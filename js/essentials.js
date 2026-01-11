/* =====================================================
   js/essentials.js - Versión FINAL corregida y funcional
   (Basic Auth restaurado + endpoints que funcionaban + logs + fallback)
===================================================== */

// CONFIG RAIXER - Restaurada exactamente como en la versión que funcionaba
const RAIXER_API = {
    baseUrl: 'https://api.raixer.com',
    apiUser: 'user_580949a8d4d6ac1f3602ebc9',
    apiSecret: '8ad5553cf21a1b3cfca144a98aa1d27998ffbf38042eafca73051905589f1db6'
};

/* =====================================================
   FUNCIONES RAIXER API - Como funcionaba antes
===================================================== */

// Headers con Basic Auth
function getRaixerAuthHeaders() {
    const credentials = btoa(`${RAIXER_API.apiUser}:${RAIXER_API.apiSecret}`);
    return {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
    };
}

// Verificar estado (GET /devices/{id} - endpoint que funcionaba)
async function checkRaixerDeviceStatus(deviceId) {
    console.log(`[Raixer] Verificando estado del dispositivo: ${deviceId}`);
    try {
        const response = await fetch(`${RAIXER_API.baseUrl}/devices/${deviceId}`, {
            method: 'GET',
            headers: getRaixerAuthHeaders()
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error ${response.status}: ${errorText}`);
        }

        const device = await response.json();
        const online = device.online || device.status === 'online';
        console.log(`[Raixer] Estado: ${online ? 'ONLINE' : 'OFFLINE'}`);
        return { online, success: true };
    } catch (error) {
        console.error('[Raixer] Error verificando dispositivo:', error);
        return { online: false, success: false, error: error.message };
    }
}

// Abrir puerta (POST /open-door/{position} - endpoint que funcionaba)
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

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Raixer error ${response.status}: ${text}`);
        }

        const result = await response.json();
        console.log('[Raixer] Respuesta apertura:', result);

        const allSuccessful = Array.isArray(result) 
            ? result.every(door => door.status === 'success')
            : result.status === 'success';

        if (allSuccessful) {
            console.log('[Raixer] ¡Puerta abierta con éxito!');
        }

        return { success: allSuccessful, result };
    } catch (error) {
        console.error('[Raixer] Error abriendo puerta:', error);
        return { success: false, error: error.message };
    }
}

/* =====================================================
   HELPERS + NOTIFICATIONS + TRADUCCIÓN
===================================================== */
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
    if (!window.appState || !window.appState.translations) {
        console.warn('Traducciones no cargadas');
        return key;
    }
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

        window.appState = {
            apartmentId,
            apartmentData: apartmentsData,
            translations,
            lang
        };

        const apt = apartmentsData[apartmentId];
        if (!apt) throw new Error(`Apartamento ${apartmentId} no encontrado`);

        // Carga básica
        document.title = t('essentials.title');
        safeText('page-title', t('essentials.title'));
        safeText('apartment-name', apt.name || 'Apartamento sin nombre');
        safeText('apartment-address', apt.address || 'Dirección no disponible');

        // WiFi
        safeText('wifi-title', t('essentials.wifi_title'));
        safeText('wifi-network', apt.wifi?.network || 'No disponible');
        safeText('wifi-password', apt.wifi?.password || 'No disponible');
        const copyBtn = safeGet('wifi-copy-btn');
        if (copyBtn && apt.wifi?.password) {
            copyBtn.onclick = () => {
                navigator.clipboard.writeText(apt.wifi.password);
                showNotification(t('common.copied'));
            };
        }

        // Access, House Rules, etc. (mantén tu código original aquí si tienes más)

        // =====================================================
        // RAIXER - Restaurado + fallback visual
        // =====================================================
        const portalBtn = safeGet('btn-portal-access');
        const houseBtn = safeGet('btn-house-access');
        const portalLed = safeGet('led-portal');
        const houseLed = safeGet('led-house');

        const deviceId = apt.raixerDevices?.deviceId;

        if (!deviceId) {
            showNotification('Control de puertas no configurado');
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

        // Inicializar LEDs
        if (portalLed) await updateLed(portalLed, deviceId);
        if (houseLed) await updateLed(houseLed, deviceId);

        // Funciones de apertura
        window.openPortalDoor = async () => {
            showNotification('Abriendo portal...');
            const result = await raixerOpenDoor(deviceId, 'street');
            showNotification(result.success ? 'Portal abierto correctamente' : `Error: ${result.error || 'Desconocido'}`);
            if (portalLed) await updateLed(portalLed, deviceId);
        };

        window.openHouseDoor = async () => {
            showNotification('Abriendo puerta de la casa...');
            const result = await raixerOpenDoor(deviceId, 'home');
            showNotification(result.success ? 'Puerta abierta correctamente' : `Error: ${result.error || 'Desconocido'}`);
            if (houseLed) await updateLed(houseLed, deviceId);
        };

        if (portalBtn) portalBtn.onclick = window.openPortalDoor;
        if (houseBtn) houseBtn.onclick = window.openHouseDoor;

    } catch (err) {
        console.error('Error inicializando essentials:', err);
        showNotification('Error cargando información del apartamento');
    }
}

document.addEventListener('DOMContentLoaded', initializeEssentials);