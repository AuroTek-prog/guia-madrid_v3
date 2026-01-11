/* =====================================================
   js/essentials.js - Versión final segura y robusta
   (Raixer Variante recomendada 1, lista para usar)
===================================================== */

async function initializeEssentials() {
    const params = new URLSearchParams(window.location.search);
    const apartmentId = params.get('apartment') || 'sol-101';
    const lang = params.get('lang') || 'es';

    function safeGet(id) {
        const el = document.getElementById(id);
        if (!el) console.warn(`⚠️ Elemento #${id} no encontrado`);
        return el;
    }

    function safeText(id, value) {
        const el = safeGet(id);
        if (el && value !== undefined && value !== null) el.textContent = value;
    }

    function safeHTML(id, html) {
        const el = safeGet(id);
        if (el && html !== undefined && html !== null) el.innerHTML = html;
    }

    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity duration-300';
        notification.innerHTML = message + ' <span onclick="this.parentNode.remove()" class="ml-2 cursor-pointer font-bold">✖</span>';
        document.body.appendChild(notification);
        setTimeout(() => { notification.style.opacity = '0'; }, 2000);
        setTimeout(() => { if (document.body.contains(notification)) document.body.removeChild(notification); }, 2300);
    }

    function t(key) {
        if (!window.appState || !window.appState.translations) return key;
        const keys = key.split('.');
        let value = window.appState.translations;
        for (const k of keys) {
            value = value[k];
            if (value === undefined) return key;
        }
        return value;
    }

    // =====================================================
    // RAIXER - Variante recomendada 1
    // =====================================================

    function getRaixerAuthHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${window.appState?.raixerToken || ''}`
        };
    }

    async function checkRaixerDeviceStatus(deviceId) {
        try {
            const response = await fetch(`${RAIXER_API.baseUrl}/devices/${deviceId}/status`, {
                method: 'GET',
                headers: getRaixerAuthHeaders()
            });
            if (!response.ok) throw new Error(`Error ${response.status}`);
            const device = await response.json();
            return { online: device.online || device.status === 'online', success: true };
        } catch (error) {
            console.error('Error verificando:', error);
            return { online: false, success: false, error: error.message };
        }
    }

    async function raixerOpenDoor(deviceId, position = 'main') {
        try {
            const response = await fetch(`${RAIXER_API.baseUrl}/devices/${deviceId}/unlock`, {
                method: 'POST',
                headers: getRaixerAuthHeaders(),
                body: JSON.stringify({ action: 'open', position })
            });
            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Raixer error ${response.status}: ${text}`);
            }
            const result = await response.json();
            console.log('Puerta abierta:', result);
            return { success: true, result };
        } catch (error) {
            console.error('Error abriendo:', error);
            return { success: false, error: error.message };
        }
    }

    async function updateLed(led, deviceId) {
        if (!led) return;
        led.className = 'absolute top-3 right-3 h-3 w-3 rounded-full bg-yellow-500 animate-pulse';
        const status = await checkRaixerDeviceStatus(deviceId);
        if (status.success) {
            led.className = `absolute top-3 right-3 h-3 w-3 rounded-full ${status.online ? 'bg-green-500' : 'bg-red-500'}`;
        } else {
            led.className = 'absolute top-3 right-3 h-3 w-3 rounded-full bg-gray-500';
        }
    }

    // =====================================================
    // Inicialización principal
    // =====================================================

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

        // Información básica
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
        } else if (copyBtn) copyBtn.style.display = 'none';

        // Access Instructions
        safeText('access-title', t('essentials.access_title'));
        safeText('access-code', apt.access?.code || '---');
        const stepsList = safeGet('access-steps-list');
        if (stepsList && Array.isArray(apt.access?.instructions)) {
            stepsList.innerHTML = '';
            apt.access.instructions.forEach((step, i) => {
                const li = document.createElement('li');
                li.className = 'flex gap-2 items-start';
                li.innerHTML = `<span class="flex items-center justify-center size-6 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-bold mt-0.5">${i+1}</span>
                                <p class="text-sm text-text-muted-light dark:text-text-muted-dark leading-relaxed">${step}</p>`;
                stepsList.appendChild(li);
            });
        }

        // House Rules
        safeText('house-rules-title', t('essentials.house_rules_title'));
        const rulesGrid = safeGet('house-rules-grid');
        if (rulesGrid && Array.isArray(apt.houseRules)) {
            rulesGrid.innerHTML = '';
            const colorMap = { red: 'bg-red-50 dark:bg-red-900/20 text-red-500', indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500', green: 'bg-green-50 dark:bg-green-900/20 text-green-500', amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-500' };
            apt.houseRules.forEach(rule => {
                const colorClass = colorMap[rule.color] || 'bg-gray-100 text-gray-500';
                const titleKey = rule.titleKey.replace(/^rules_/, '');
                const subtitleKey = rule.subtitleKey?.replace(/^rules_/, '');
                const card = document.createElement('div');
                card.className = 'bg-card-light dark:bg-card-dark p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col items-center text-center gap-2';
                card.innerHTML = `<div class="size-10 rounded-full ${colorClass} flex items-center justify-center"><span class="material-symbols-outlined">${rule.icon}</span></div>
                                  <span class="text-sm font-semibold">${t(`essentials.rules.${titleKey}`)}</span>
                                  ${subtitleKey ? `<span class="text-xs text-text-muted-light dark:text-text-muted-dark">${t(`essentials.rules.${subtitleKey}`)}</span>` : ''}`;
                rulesGrid.appendChild(card);
            });
        }

        // Bottom Navigation
        const navItems = [
            { id: 'nav-home', key: 'navigation.nav_home' },
            { id: 'nav-devices', key: 'navigation.devices_title' },
            { id: 'nav-recommendations', key: 'navigation.recommendations_title' },
            { id: 'nav-tourism', key: 'navigation.tourism_title' }
        ];
        navItems.forEach(({ id, key }) => {
            const nav = safeGet(id);
            if (nav) {
                const span = nav.querySelector('span:last-child');
                if (span) span.textContent = t(key);
            }
        });
        const baseUrl = `?apartment=${apartmentId}&lang=${lang}`;
        safeGet('nav-home').href = `${window.ROOT_PATH}index.html${baseUrl}`;
        safeGet('nav-devices').href = `devices.html${baseUrl}`;
        safeGet('nav-recommendations').href = `recommendations.html${baseUrl}`;
        safeGet('nav-tourism').href = `tourism.html${baseUrl}`;

        // Contact Host
        window.contactHost = () => {
            const phone = apt.host?.phone;
            if (phone) window.open(`tel:${phone}`, '_self');
            else showNotification('Teléfono no disponible');
        };

        // RAIXER - Botones y LEDs
        const deviceId = apt.raixerDevices?.deviceId;
        const portalBtn = safeGet('btn-portal-access');
        const houseBtn = safeGet('btn-house-access');
        const portalLed = safeGet('led-portal');
        const houseLed = safeGet('led-house');

        if (!deviceId) {
            [portalBtn, houseBtn].forEach(btn => {
                if (btn) {
                    btn.disabled = true;
                    btn.classList.add('opacity-50', 'cursor-not-allowed');
                    btn.title = "No disponible en este apartamento";
                }
            });
            if (portalLed) portalLed.className = 'absolute top-3 right-3 h-3 w-3 rounded-full bg-gray-500';
            if (houseLed) houseLed.className = 'absolute top-3 right-3 h-3 w-3 rounded-full bg-gray-500';
        } else {
            window.openPortalDoor = async () => {
                showNotification('Abriendo portal...');
                const result = await raixerOpenDoor(deviceId, 'main');
                showNotification(result.success ? 'Portal abierto correctamente' : `Error: ${result.error}`);
                updateLed(portalLed, deviceId);
            };
            window.openHouseDoor = async () => {
                showNotification('Abriendo puerta de la casa...');
                const result = await raixerOpenDoor(deviceId, 'main');
                showNotification(result.success ? 'Puerta de la casa abierta correctamente' : `Error: ${result.error}`);
                updateLed(houseLed, deviceId);
            };
            if (portalBtn) portalBtn.onclick = window.openPortalDoor;
            if (houseBtn) houseBtn.onclick = window.openHouseDoor;
            if (portalLed) updateLed(portalLed, deviceId);
            if (houseLed) updateLed(houseLed, deviceId);
        }

    } catch (err) {
        console.error('Error inicializando essentials:', err);
        document.body.innerHTML = `<div class="p-8 text-center"><h1 class="text-2xl font-bold text-red-600">Error cargando información</h1><p class="mt-4">Contacta al anfitrión o refresca la página</p></div>`;
    }
}

document.addEventListener('DOMContentLoaded', initializeEssentials);
