/* =====================================================
   js/essentials.js - Versión FINAL con LISTA DINÁMICA DE PUERTAS
   - Detecta puertas reales vía /devices/{id}/doors
   - Botones y LEDs solo para puertas existentes
   - Fallbacks completos y logs detallados
   - Animación LED de éxito integrada
   - Sección de acceso reubicada entre botones y WiFi
   - Traducción de instrucciones con glosario
===================================================== */

// CONFIG RAIXER
const RAIXER_API = {
    baseUrl: 'https://api.raixer.com',
    apiUser: 'user_580949a8d4d6ac1f3602ebc9',
    apiSecret: '8ad5553cf21a1b3cfca144a98aa1d27998ffbf38042eafca73051905589f1db6'
};

// Headers con Basic Auth
function getRaixerAuthHeaders() {
    const credentials = btoa(`${RAIXER_API.apiUser}:${RAIXER_API.apiSecret}`);
    return {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
    };
}

// Obtener puertas reales del dispositivo
async function getRaixerDoors(deviceId) {
    console.log(`[Raixer] Listando puertas reales del dispositivo: ${deviceId}`);
    try {
        const response = await fetch(`${RAIXER_API.baseUrl}/devices/${deviceId}/doors`, {
            method: 'GET',
            headers: getRaixerAuthHeaders()
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error ${response.status}: ${errorText}`);
        }
        const doors = await response.json();
        console.log('[Raixer] Puertas encontradas:', doors);
        return doors;
    } catch (error) {
        console.error('[Raixer] Error listando puertas:', error);
        showNotification('No se pudieron cargar las puertas (contacta al anfitrión)');
        return [];
    }
}

// Verificar estado del dispositivo
async function checkRaixerDeviceStatus(deviceId) {
    console.log(`[Raixer] Verificando estado del dispositivo: ${deviceId}`);
    try {
        const response = await fetch(`${RAIXER_API.baseUrl}/devices/${deviceId}`, {
            method: 'GET',
            headers: getRaixerAuthHeaders()
        });
        if (!response.ok) throw new Error(`Error ${response.status}`);
        const device = await response.json();
        const online = device.online || device.status === 'online';
        console.log(`[Raixer] Estado: ${online ? 'ONLINE' : 'OFFLINE'}`);
        return { online, success: true };
    } catch (error) {
        console.error('[Raixer] Error verificando:', error);
        return { online: false, success: false, error: error.message };
    }
}

// Abrir puerta usando use o _id
async function raixerOpenDoor(deviceId, doorIdentifier) {
    console.log(`[Raixer] Abriendo puerta ${doorIdentifier} - deviceId: ${deviceId}`);
    try {
        const response = await fetch(
            `${RAIXER_API.baseUrl}/devices/${deviceId}/open-door/${doorIdentifier}`,
            {
                method: 'POST',
                headers: getRaixerAuthHeaders()
            }
        );
        if (!response.ok) throw new Error(`Error ${response.status}`);
        const result = await response.json();
        console.log('[Raixer] Respuesta apertura:', result);
        return { success: true, result };
    } catch (error) {
        console.error('[Raixer] Error abriendo:', error);
        return { success: false, error: error.message };
    }
}

// HELPERS
function safeGet(id) {
    const el = document.getElementById(id);
    if (!el) console.warn(`⚠️ Elemento #${id} no encontrado`);
    return el;
}

function safeText(id, value) {
    const el = safeGet(id);
    if (el && value !== undefined && value !== null) el.textContent = value;
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity duration-300';
    notification.innerHTML = message + ' <span onclick="this.parentNode.remove()" class="ml-2 cursor-pointer font-bold">✖</span>';
    document.body.appendChild(notification);
    setTimeout(() => notification.style.opacity = '0', 3000);
    setTimeout(() => notification.remove(), 3500);
    console.log('[NOTIF]', message);
}

function t(key) {
    if (!window.appState || !window.appState.translations) return `[${key}]`;
    const keys = key.split('.');
    let value = window.appState.translations;
    for (const k of keys) {
        value = value?.[k];
        if (value === undefined) return `[${key}]`;
    }
    return value;
}

// Función para copiar texto al portapapeles con animación de éxito
function copyToClipboardWithAnimation(text, successElementId) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification(t('common.copied') || 'Copiado');
        
        // Mostrar animación de éxito
        const successElement = document.getElementById(successElementId);
        if (successElement) {
            successElement.classList.add('show');
            setTimeout(() => {
                successElement.classList.remove('show');
            }, 2000);
        }
    }).catch(err => {
        console.error('Error al copiar:', err);
        showNotification('Error al copiar');
    });
}

/* =====================================================
   INICIALIZACIÓN PRINCIPAL
===================================================== */
async function initializeEssentials() {
    const params = new URLSearchParams(window.location.search);
    const apartmentId = params.get('apartment') || 'sol-101';
    const lang = params.get('lang') || 'es';

    try {
        const [apartmentsRes, translationsRes] = await Promise.all([
            fetch(`${window.ROOT_PATH}data/apartments.json`),
            fetch(`${window.ROOT_PATH}data/${lang}.json`)
        ]);

        if (!apartmentsRes.ok || !translationsRes.ok) throw new Error('Error cargando datos');

        const apartmentsData = await apartmentsRes.json();
        const translations = await translationsRes.json();

        window.appState = { apartmentId, apartmentData: apartmentsData, translations, lang };

        const apt = apartmentsData[apartmentId];
        if (!apt) throw new Error(`Apartamento ${apartmentId} no encontrado`);

        document.title = t('essentials.title');
        safeText('page-title', t('essentials.title'));
        safeText('apartment-name', apt.name || 'Apartamento sin nombre');
        safeText('apartment-address', apt.address || 'Dirección no disponible');

        // Configurar sección de acceso (reubicada antes de WiFi)
        setupAccessSection(apt);

        // Configurar sección WiFi (mejorada)
        setupWiFiSection(apt);

        // Configurar reglas de la casa
        setupHouseRules(apt);

        // RAIXER
        const portalBtn = safeGet('btn-portal-access');
        const houseBtn = safeGet('btn-house-access');
        const portalLed = safeGet('led-portal');
        const houseLed = safeGet('led-house');

        const deviceId = apt.raixerDevices?.deviceId;

        if (!deviceId) {
            showNotification('Control de puertas no configurado en este apartamento');
            [portalBtn, houseBtn].forEach(btn => {
                if (btn) {
                    btn.disabled = true;
                    btn.classList.add('opacity-50', 'cursor-not-allowed');
                }
            });
            [portalLed, houseLed].forEach(led => {
                if (led) led.className = 'absolute top-3 right-3 h-3 w-3 rounded-full bg-gray-500 shadow-sm';
            });
            return;
        }

        const doors = await getRaixerDoors(deviceId);

        // Función updateLed (actualizada para soportar "desactivado")
        async function updateLed(led, isAvailable = true) {
            if (!led) return;

            if (!isAvailable) {
                // Puerta no existe → LED gris fijo, sin pulso
                led.className = 'absolute top-3 right-3 h-3 w-3 rounded-full bg-gray-500 shadow-sm';
                return;
            }

            // Puerta existe → estado real con pulso de carga
            led.className = 'absolute top-3 right-3 h-3 w-3 rounded-full bg-yellow-500 animate-pulse';
            const status = await checkRaixerDeviceStatus(deviceId);
            led.className = `absolute top-3 right-3 h-3 w-3 rounded-full ${status.online ? 'bg-green-500' : 'bg-red-500'} shadow-sm`;
        }

        // Inicializar LEDs según disponibilidad real
        const portalDoor = doors.find(d => d.use?.toLowerCase() === 'street' || d.name?.toLowerCase().includes('calle') || d.name?.toLowerCase().includes('portal'));
        const houseDoor = doors.find(d => d.use?.toLowerCase() === 'home' || d.name?.toLowerCase().includes('casa') || d.name?.toLowerCase().includes('interior'));

        await updateLed(portalLed, !!portalDoor);
        await updateLed(houseLed, !!houseDoor);

        // Botones dinámicos
        if (portalBtn) {
            if (portalDoor) {
                portalBtn.onclick = async () => {
                    showNotification('Abriendo portal...');
                    const result = await raixerOpenDoor(deviceId, portalDoor.use || portalDoor._id);
                    showNotification(result.success ? 'Portal abierto correctamente' : `Error: ${result.error || 'Desconocido'}`);

                    if (result.success) {
                        portalLed.className = 'absolute top-3 right-3 h-3 w-3 rounded-full bg-green-500 shadow-lg shadow-green-500/50 scale-150 opacity-100 transition-all duration-300 animate-pulse-fast';
                        setTimeout(async () => await updateLed(portalLed, true), 2500);
                    } else {
                        await updateLed(portalLed, true);
                    }
                };
            } else {
                portalBtn.disabled = true;
                portalBtn.classList.add('opacity-50', 'cursor-not-allowed');
                portalBtn.title = 'Portal no disponible';
            }
        }

        if (houseBtn) {
            if (houseDoor) {
                houseBtn.onclick = async () => {
                    showNotification('Abriendo puerta interior...');
                    const result = await raixerOpenDoor(deviceId, houseDoor.use || houseDoor._id);
                    showNotification(result.success ? 'Puerta abierta correctamente' : `Error: ${result.error || 'Desconocido'}`);

                    if (result.success) {
                        houseLed.className = 'absolute top-3 right-3 h-3 w-3 rounded-full bg-green-500 shadow-lg shadow-green-500/50 scale-150 opacity-100 transition-all duration-300 animate-pulse-fast';
                        setTimeout(async () => await updateLed(houseLed, true), 2500);
                    } else {
                        await updateLed(houseLed, true);
                    }
                };
            } else {
                houseBtn.disabled = true;
                houseBtn.classList.add('opacity-50', 'cursor-not-allowed');
                houseBtn.title = 'Puerta interior no disponible';
            }
        }

    } catch (err) {
        console.error('Error inicializando essentials:', err);
        showNotification('Error cargando información del apartamento');
    }
}

// Función para configurar la sección de acceso con traducción por glosario
function setupAccessSection(apartment) {
    const accessData = apartment.access;
    
    if (!accessData) {
        const accessSection = safeGet('access-section');
        if (accessSection) accessSection.style.display = 'none';
        return;
    }
    
    // Título de la sección
    safeText('access-title', t('essentials.access_title') || 'Instrucciones de Acceso');
    
    // Tipo de acceso
    const accessTypeElement = safeGet('access-type');
    const accessTypeIconElement = safeGet('access-type-icon');
    
    // Mapeo de tipos de acceso a textos e iconos
    const accessTypes = {
        'keybox': { text: t('essentials.access_keybox') || 'Caja de llaves', icon: 'key' },
        'keypad': { text: t('essentials.access_keypad') || 'Teclado numérico', icon: 'dialpad' },
        'smart': { text: t('essentials.access_smart') || 'Acceso inteligente', icon: 'lock' },
        'inteligente': { text: t('essentials.access_smart') || 'Acceso inteligente', icon: 'lock' },
        'default': { text: t('essentials.access_default') || 'Acceso estándar', icon: 'vpn_key' }
    };
    
    const accessType = accessTypes[accessData.type] || accessTypes['default'];
    if (accessTypeElement) accessTypeElement.textContent = accessType.text;
    if (accessTypeIconElement) accessTypeIconElement.textContent = accessType.icon;
    
    // Código de acceso
    const accessCodeElement = safeGet('access-code');
    if (accessCodeElement) accessCodeElement.textContent = accessData.code || '---';
    
    // Configurar botón de copiar código
    const copyAccessCodeBtn = safeGet('access-code-copy-btn');
    if (copyAccessCodeBtn && accessData.code) {
        copyAccessCodeBtn.onclick = () => {
            copyToClipboardWithAnimation(accessData.code, 'access-copy-success');
        };
    } else if (copyAccessCodeBtn) {
        copyAccessCodeBtn.style.display = 'none';
    }
    
    // Instrucciones de acceso con traducción por glosario
    const accessStepsList = safeGet('access-steps-list');
    if (accessStepsList) {
        accessStepsList.innerHTML = '';
        
        // Obtener el idioma actual
        const currentLang = window.appState.lang || 'es';
        
        if (Array.isArray(accessData.instructions)) {
            accessData.instructions.forEach((step, i) => {
                const li = document.createElement('li');
                li.className = 'flex gap-2 items-start';
                
                // Traducir el paso usando el glosario
                const translatedStep = translateWithGlossary(step, currentLang);
                
                li.innerHTML = `<span class="flex items-center justify-center size-6 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-bold mt-0.5">${i+1}</span>
                                <p class="text-sm text-text-muted-light dark:text-text-muted-dark leading-relaxed">${translatedStep}</p>`;
                accessStepsList.appendChild(li);
            });
            
            // Añadir una nota si el idioma no es español (opcional)
            if (currentLang !== 'es') {
                const noteLi = document.createElement('li');
                noteLi.className = 'mt-4 pt-3 border-t border-gray-200 dark:border-gray-700';
                noteLi.innerHTML = `<p class="text-xs text-gray-500 italic">${t('essentials.instructions_note') || 'Nota: Las instrucciones específicas han sido parcialmente traducidas automáticamente.'}</p>`;
                accessStepsList.appendChild(noteLi);
            }
        } else {
            accessStepsList.innerHTML = '<p class="text-sm text-gray-500">' + (t('essentials.no_instructions') || 'Instrucciones no disponibles') + '</p>';
        }
    }
}

// Función para configurar la sección WiFi (mejorada)
function setupWiFiSection(apartment) {
    const wifiData = apartment.wifi;
    
    if (!wifiData) {
        const wifiSection = safeGet('wifi-section');
        if (wifiSection) wifiSection.style.display = 'none';
        return;
    }
    
    // Título de la sección
    safeText('wifi-title', t('essentials.wifi_title') || 'WiFi');
    
    // Nombre de la red
    const wifiNetworkElement = safeGet('wifi-network');
    if (wifiNetworkElement) {
        const networkName = wifiData.network || wifiData.type || 'No disponible';
        wifiNetworkElement.textContent = networkName;
        
        // Aplicar estilo especial al texto de la contraseña
        if (wifiData.password) {
            wifiNetworkElement.classList.add('font-mono', 'font-bold');
        }
    }
    
    // Contraseña
    const wifiPasswordElement = safeGet('wifi-password');
    if (wifiPasswordElement) {
        const password = wifiData.password || wifiData.code || 'No disponible';
        wifiPasswordElement.textContent = password;
        
        // Aplicar estilo especial al texto de la contraseña
        if (password !== 'No disponible') {
            wifiPasswordElement.classList.add('password-text');
        }
    }
    
    // Etiquetas
    safeText('wifi-network-label', t('essentials.wifi_network') || 'Red');
    safeText('wifi-password-label', t('essentials.wifi_password') || 'Contraseña');
    
    // Configurar botón de copiar contraseña
    const copyWifiBtn = safeGet('wifi-copy-btn');
    if (copyWifiBtn && (wifiData.password || wifiData.code)) {
        const password = wifiData.password || wifiData.code || '';
        copyWifiBtn.onclick = () => {
            copyToClipboardWithAnimation(password, 'wifi-copy-success');
        };
    } else if (copyWifiBtn) {
        copyWifiBtn.style.display = 'none';
    }
}

// Función para configurar las reglas de la casa
function setupHouseRules(apartment) {
    const houseRules = apartment.houseRules;
    
    if (!houseRules || !Array.isArray(houseRules)) {
        const houseRulesSection = safeGet('house-rules-section');
        if (houseRulesSection) houseRulesSection.style.display = 'none';
        return;
    }
    
    // Título de la sección
    safeText('house-rules-title', t('essentials.house_rules') || 'Normas de la Casa');
    
    const houseRulesGrid = safeGet('house-rules-grid');
    if (houseRulesGrid) {
        houseRulesGrid.innerHTML = '';
        
        houseRules.forEach(rule => {
            const ruleCard = document.createElement('div');
            ruleCard.className = `flex flex-col items-center gap-2 p-3 rounded-lg bg-surface-light dark:bg-surface-dark border border-gray-100 dark:border-gray-800`;
            
            const icon = document.createElement('span');
            icon.className = `material-symbols-outlined text-${rule.color || 'primary'}`;
            icon.textContent = rule.icon;
            
            const title = document.createElement('span');
            title.className = 'text-sm font-semibold text-center';
            title.textContent = t(rule.titleKey) || rule.titleKey;
            
            ruleCard.appendChild(icon);
            ruleCard.appendChild(title);
            
            if (rule.subtitleKey) {
                const subtitle = document.createElement('span');
                subtitle.className = 'text-xs text-text-muted-light dark:text-text-muted-dark text-center';
                subtitle.textContent = t(rule.subtitleKey) || rule.subtitleKey;
                ruleCard.appendChild(subtitle);
            }
            
            houseRulesGrid.appendChild(ruleCard);
        });
    }
}

document.addEventListener('DOMContentLoaded', initializeEssentials);