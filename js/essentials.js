/* =====================================================
   js/essentials.js - Versión FINAL con LISTA DINÁMICA DE PUERTAS
   - Detecta puertas reales vía /devices/{id}/doors
   - Botones y LEDs solo para puertas existentes
   - Fallbacks completos y logs detallados
   - Animación LED de éxito integrada
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

        // WiFi
        safeText('wifi-title', t('essentials.wifi_title'));
        safeText('wifi-network', apt.wifi?.network || 'No disponible');
        safeText('wifi-password', apt.wifi?.password || 'No disponible');
        const copyBtn = safeGet('wifi-copy-btn');
        if (apt.wifi?.password && copyBtn) {
            copyBtn.onclick = () => {
                navigator.clipboard.writeText(apt.wifi.password);
                showNotification(t('common.copied'));
            };
        } else if (copyBtn) {
            copyBtn.style.display = 'none';
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
                if (led) led.className = 'absolute top-3 right-3 h-3 w-3 rounded-full bg-gray-500';
            });
            return;
        }

        const doors = await getRaixerDoors(deviceId);

        async function updateLed(led) {
            if (!led) return;
            led.className = 'absolute top-3 right-3 h-3 w-3 rounded-full bg-yellow-500 animate-pulse';
            const status = await checkRaixerDeviceStatus(deviceId);
            led.className = `absolute top-3 right-3 h-3 w-3 rounded-full ${status.online ? 'bg-green-500' : 'bg-red-500'}`;
        }

        await updateLed(portalLed);
        await updateLed(houseLed);

        if (portalBtn) {
            const portalDoor = doors.find(d => d.use?.toLowerCase() === 'street' || d.name?.toLowerCase().includes('calle') || d.name?.toLowerCase().includes('portal'));
            if (portalDoor) {
                portalBtn.onclick = async () => {
                    showNotification('Abriendo portal...');
                    const result = await raixerOpenDoor(deviceId, portalDoor.use || portalDoor._id);

                    if (result.success) {
                        showNotification('Portal abierto correctamente');

                        if (portalLed) {
                            portalLed.className = 'absolute top-3 right-3 h-3 w-3 rounded-full bg-green-500 shadow-lg shadow-green-500/50 scale-150 opacity-100 transition-all duration-300 animate-pulse-fast';
                            setTimeout(async () => {
                                await updateLed(portalLed);
                            }, 2500);
                        }
                    } else {
                        showNotification(`Error: ${result.error || 'Desconocido'}`);
                        await updateLed(portalLed);
                    }
                };
            } else {
                portalBtn.disabled = true;
                portalBtn.classList.add('opacity-50', 'cursor-not-allowed');
                portalBtn.title = 'Portal no disponible';
            }
        }

        if (houseBtn) {
            const houseDoor = doors.find(d => d.use?.toLowerCase() === 'home' || d.name?.toLowerCase().includes('casa') || d.name?.toLowerCase().includes('interior'));
            if (houseDoor) {
                houseBtn.onclick = async () => {
                    showNotification('Abriendo puerta interior...');
                    const result = await raixerOpenDoor(deviceId, houseDoor.use || houseDoor._id);

                    if (result.success) {
                        showNotification('Puerta abierta correctamente');

                        if (houseLed) {
                            houseLed.className = 'absolute top-3 right-3 h-3 w-3 rounded-full bg-green-500 shadow-lg shadow-green-500/50 scale-150 opacity-100 transition-all duration-300 animate-pulse-fast';
                            setTimeout(async () => {
                                await updateLed(houseLed);
                            }, 2500);
                        }
                    } else {
                        showNotification(`Error: ${result.error || 'Desconocido'}`);
                        await updateLed(houseLed);
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

document.addEventListener('DOMContentLoaded', initializeEssentials);
