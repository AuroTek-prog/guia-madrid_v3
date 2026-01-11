/* =====================================================
   js/essentials.js - Versión FINAL corregida y funcional
   - WiFi, access y rules con fallback "No disponible"
   - Raixer: solo abre 'street' si no hay 2 puertas
   - Logs y notificaciones claras
===================================================== */

// CONFIG RAIXER (restaurada)
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

// Verificar estado
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

// Abrir puerta
async function raixerOpenDoor(deviceId, position = 'street') {
    console.log(`[Raixer] Intentando abrir ${position} - deviceId: ${deviceId}`);
    try {
        const response = await fetch(
            `${RAIXER_API.baseUrl}/devices/${deviceId}/open-door/${position}`,
            {
                method: 'POST',
                headers: getRaixerAuthHeaders(),
                body: JSON.stringify({ deviceId, position })
            }
        );
        if (!response.ok) throw new Error(`Error ${response.status}`);
        const result = await response.json();
        console.log('[Raixer] Respuesta:', result);
        const success = Array.isArray(result) ? result.every(d => d.status === 'success') : result.status === 'success';
        return { success, result };
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

        // Carga básica con fallback (nunca "Cargando...")
        safeText('page-title', t('essentials.title'));
        safeText('apartment-name', apt.name || 'Apartamento sin nombre');
        safeText('apartment-address', apt.address || 'Dirección no disponible');

        // WiFi
        safeText('wifi-title', t('essentials.wifi_title'));
        safeText('wifi-network', apt.wifi?.network || 'No disponible');
        safeText('wifi-password', apt.wifi?.password || 'No disponible');
        const copyBtn = safeGet('wifi-copy-btn');
        if (apt.wifi?.password) {
            if (copyBtn) copyBtn.onclick = () => {
                navigator.clipboard.writeText(apt.wifi.password);
                showNotification(t('common.copied'));
            };
        } else {
            if (copyBtn) copyBtn.style.display = 'none';
        }

        // Access Instructions
        safeText('access-title', t('essentials.access_title'));
        safeText('access-code', apt.access?.code || '---');
        const stepsList = safeGet('access-steps-list');
        if (stepsList) {
            stepsList.innerHTML = '';
            if (Array.isArray(apt.access?.instructions)) {
                apt.access.instructions.forEach((step, i) => {
                    const li = document.createElement('li');
                    li.className = 'flex gap-2 items-start';
                    li.innerHTML = `<span class="flex items-center justify-center size-6 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-bold mt-0.5">${i+1}</span>
                                    <p class="text-sm text-text-muted-light dark:text-text-muted-dark leading-relaxed">${step}</p>`;
                    stepsList.appendChild(li);
                });
            } else {
                stepsList.innerHTML = '<p class="text-sm text-gray-500">Instrucciones no disponibles</p>';
            }
        }

        // House Rules
        safeText('house-rules-title', t('essentials.house_rules_title'));
        const rulesGrid = safeGet('house-rules-grid');
        if (rulesGrid) {
            rulesGrid.innerHTML = '';
            if (Array.isArray(apt.houseRules)) {
                const colorMap = { red: 'bg-red-50 dark:bg-red-900/20 text-red-500', indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500', green: 'bg-green-50 dark:bg-green-900/20 text-green-500', amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-500' };
                apt.houseRules.forEach(rule => {
                    const colorClass = colorMap[rule.color] || 'bg-gray-100 text-gray-500';
                    const titleKey = rule.titleKey?.replace(/^rules_/, '');
                    const subtitleKey = rule.subtitleKey?.replace(/^rules_/, '');
                    const card = document.createElement('div');
                    card.className = 'bg-card-light dark:bg-card-dark p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col items-center text-center gap-2';
                    card.innerHTML = `<div class="size-10 rounded-full ${colorClass} flex items-center justify-center"><span class="material-symbols-outlined">${rule.icon}</span></div>
                                      <span class="text-sm font-semibold">${t(`essentials.rules.${titleKey}`)}</span>
                                      ${subtitleKey ? `<span class="text-xs text-text-muted-light dark:text-text-muted-dark">${t(`essentials.rules.${subtitleKey}`)}</span>` : ''}`;
                    rulesGrid.appendChild(card);
                });
            } else {
                rulesGrid.innerHTML = '<p class="text-sm text-gray-500">Reglas no disponibles</p>';
            }
        }

        // RAIXER
        const portalBtn = safeGet('btn-portal-access');
        const houseBtn = safeGet('btn-house-access');
        const portalLed = safeGet('led-portal');
        const houseLed = safeGet('led-house');

        const deviceId = apt.raixerDevices?.deviceId;
        const hasTwoDoors = apt.raixerDevices?.hasTwoDoors || false; // Añade este campo en JSON para pisos con 2 puertas

        async function updateLed(led, deviceId) {
            if (!led) return;
            led.className = 'absolute top-3 right-3 h-3 w-3 rounded-full bg-yellow-500 animate-pulse';
            const status = await checkRaixerDeviceStatus(deviceId);
            if (status.success) {
                led.className = `absolute top-3 right-3 h-3 w-3 rounded-full ${status.online ? 'bg-green-500' : 'bg-red-500'}`;
            } else {
                led.className = 'absolute top-3 right-3 h-3 w-3 rounded-full bg-gray-500';
                showNotification('Estado de puerta no disponible');
            }
        }

        if (!deviceId) {
            showNotification('Control de puertas no configurado');
            [portalBtn, houseBtn].forEach(btn => {
                if (btn) btn.disabled = true, btn.classList.add('opacity-50', 'cursor-not-allowed');
            });
            [portalLed, houseLed].forEach(led => {
                if (led) led.className = 'absolute top-3 right-3 h-3 w-3 rounded-full bg-gray-500';
            });
            return;
        }

        await updateLed(portalLed, deviceId);
        await updateLed(houseLed, deviceId);

        window.openPortalDoor = async () => {
            showNotification('Abriendo portal...');
            const result = await raixerOpenDoor(deviceId, 'street');
            showNotification(result.success ? 'Portal abierto correctamente' : `Error: ${result.error || 'Desconocido'}`);
            await updateLed(portalLed, deviceId);
        };

        window.openHouseDoor = async () => {
            showNotification('Abriendo puerta de la casa...');
            if (hasTwoDoors) {
                const result = await raixerOpenDoor(deviceId, 'home');
                showNotification(result.success ? 'Puerta abierta correctamente' : `Error: ${result.error || 'Desconocido'}`);
            } else {
                showNotification('Este apartamento solo tiene una puerta principal');
            }
            await updateLed(houseLed, deviceId);
        };

        if (portalBtn) portalBtn.onclick = window.openPortalDoor;
        if (houseBtn) houseBtn.onclick = window.openHouseDoor;

    } catch (err) {
        console.error('Error inicializando essentials:', err);
        showNotification('Error cargando información del apartamento');
    }
}

document.addEventListener('DOMContentLoaded', initializeEssentials);