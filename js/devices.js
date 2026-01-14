/* =====================================================
   js/devices.js - Página de dispositivos del apartamento
   - Renderiza lista de dispositivos
   - Modal de detalles
   - Barra superior: regresar + idioma
   - Barra inferior: navegación entre pestañas
===================================================== */

function renderPage() {
    const apt = window.appState.apartmentData[window.appState.apartmentId];

    // ==============================
    // Textos estáticos de la página
    // ==============================
    document.title = t('navigation.devices_title');
    safeText('page-title', t('navigation.devices_title'));
    safeText('headline', t('devices.title'));
    safeText('subtitle', t('devices.subtitle'));
    safeText('appliances-title', t('devices.appliances_title'));
    safeText('contact-host-text', t('devices.contact_host'));

    // Textos botones rápidos
    safeText('unlock-door-text', t('devices.unlock_door'));
    safeText('unlock-door-desc', t('devices.unlock_door_desc'));
    safeText('wifi-code-text', t('devices.wifi_code'));
    safeText('wifi-code-desc', t('devices.wifi_code_desc'));

    // ==============================
    // Barra superior: regresar + idioma
    // ==============================
    setupTopBar();

    // ==============================
    // Lista de dispositivos dinámica
    // ==============================
    const devicesList = safeGet('devices-list');
    if (devicesList) devicesList.innerHTML = '';

    const deviceIcons = {
        heating: 'thermostat',
        hob: 'countertops',
        ac: 'ac_unit',
        washing_machine: 'local_laundry_service',
        tv: 'tv',
        coffee_maker: 'coffee_maker'
    };

    for (const deviceKey in apt.devices) {
        const device = apt.devices[deviceKey];
        const listItem = document.createElement('div');
        listItem.className = 'flex items-center gap-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-surface-light dark:bg-surface-dark p-4 shadow-sm active:bg-slate-50 dark:active:bg-slate-800 transition-colors cursor-pointer group';
        listItem.onclick = () => showDeviceDetails(deviceKey);

        listItem.innerHTML = `
            <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                <span class="material-symbols-outlined text-[24px]">${deviceIcons[deviceKey] || 'help'}</span>
            </div>
            <div class="flex flex-1 flex-col justify-center">
                <p class="text-slate-900 dark:text-white text-base font-bold leading-normal">${t(`devices.${deviceKey}_title`)}</p>
                <p class="text-slate-500 dark:text-slate-400 text-sm font-medium leading-normal line-clamp-1">${t(`devices.${deviceKey}_desc`)}</p>
            </div>
            <div class="shrink-0 text-slate-400 dark:text-slate-500">
                <span class="material-symbols-outlined text-[24px]">chevron_right</span>
            </div>
        `;
        devicesList.appendChild(listItem);
    }

    // ==============================
    // Configurar navegación inferior
    // ==============================
    setupBottomNavigation(window.appState.apartmentId, window.appState.lang);
}

/* =====================================================
   Modal de detalles de dispositivos
===================================================== */
function showDeviceDetails(deviceKey) {
    const apt = window.appState.apartmentData[window.appState.apartmentId];
    const modal = safeGet('device-modal');
    const title = safeGet('modal-title');
    const content = safeGet('modal-content');

    if (!modal || !title || !content) return;

    let deviceTitle, deviceInstructions;

    if (deviceKey === 'access') {
        deviceTitle = t('essentials.access_title');
        deviceInstructions = `
            <div class="mb-4">
                <p class="font-semibold mb-2">${t('essentials.access_code')}</p>
                <p class="text-2xl font-mono font-bold text-primary">${apt.access.code}</p>
            </div>
            <div>
                <p class="font-semibold mb-2">${t('essentials.access_instructions')}</p>
                <p>${apt.access.type === 'keybox' ? 'Localiza la caja de llaves negra a la izquierda de la puerta. Introduce el código y tira de la palanca.' : 'Pasa la tarjeta por el lector. La luz se pondrá verde y la cerradura se desbloqueará.'}</p>
            </div>
        `;
    } else if (deviceKey === 'wifi') {
        deviceTitle = t('essentials.wifi_title');
        deviceInstructions = `
            <div class="mb-4">
                <p class="font-semibold mb-2">${t('essentials.wifi_network')}</p>
                <p class="text-lg font-bold">${apt.wifi.network}</p>
            </div>
            <div class="mb-4">
                <p class="font-semibold mb-2">${t('essentials.wifi_password')}</p>
                <div class="flex items-center gap-2">
                    <span class="text-xl font-mono font-bold text-primary">${apt.wifi.password}</span>
                    <button onclick="copyToClipboard('${apt.wifi.password}')" class="p-2 rounded-full bg-primary/10 hover:bg-primary/20 text-primary">
                        <span class="material-symbols-outlined">content_copy</span>
                    </button>
                </div>
            </div>
        `;
    } else {
        const device = apt.devices[deviceKey];
        deviceTitle = t(`devices.${deviceKey}_title`);
        deviceInstructions = `<p>${t(`devices.${device.detailsKey}`)}</p>`;
    }

    title.textContent = deviceTitle;
    content.innerHTML = deviceInstructions;

    modal.classList.remove('hidden');
}

function closeDeviceModal() {
    const modal = safeGet('device-modal');
    if (modal) modal.classList.add('hidden');
}

/* =====================================================
   Botón de contacto
===================================================== */
function contactHost() {
    const apt = window.appState.apartmentData[window.appState.apartmentId];
    const phoneNumber = apt.host.phone;
    if (phoneNumber) window.open(`tel:${phoneNumber}`, '_self');
    else showNotification("El número de teléfono del anfitrión no está disponible.");
}

/* =====================================================
   Barra superior: regresar + idioma
===================================================== */
function setupTopBar() {
    const params = new URLSearchParams(window.location.search);
    const apartmentId = params.get('apartment');
    const lang = params.get('lang') || 'es';

    const backBtn = safeGet('btn-back');
    if (backBtn) {
        backBtn.onclick = () => {
            if (document.referrer) {
                window.history.back();
            } else if (apartmentId) {
                window.location.href = `${window.ROOT_PATH}index.html?apartment=${apartmentId}&lang=${lang}`;
            } else {
                window.location.href = `${window.ROOT_PATH}language.html`;
            }
        };
    }

    const langBtn = safeGet('btn-lang');
    if (langBtn) {
        langBtn.onclick = () => {
            window.location.href = `${window.ROOT_PATH}language.html?apartment=${apartmentId}`;
        };
    }
}

/* =====================================================
   Barra inferior de navegación
===================================================== */
function setupBottomNavigation(apartmentId, lang) {
    const baseUrl = `?apartment=${apartmentId}&lang=${lang}`;

    const navHome = safeGet('nav-home');
    if (navHome) navHome.href = `${window.ROOT_PATH}index.html${baseUrl}`;

    const navDevices = safeGet('nav-devices');
    if (navDevices) navDevices.href = `devices.html${baseUrl}`;

    const navRecommendations = safeGet('nav-recommendations');
    if (navRecommendations) navRecommendations.href = `recommendations.html${baseUrl}`;

    const navTourism = safeGet('nav-tourism');
    if (navTourism) navTourism.href = `tourism.html${baseUrl}`;

    const navContact = safeGet('nav-contact');
    if (navContact) navContact.href = `contact.html${baseUrl}`;

    const navItems = [
        { id: 'nav-home', key: 'navigation.nav_home' },
        { id: 'nav-devices', key: 'navigation.devices_title' },
        { id: 'nav-recommendations', key: 'navigation.recommendations_title' },
        { id: 'nav-tourism', key: 'navigation.tourism_title' },
        { id: 'nav-contact', key: 'navigation.contact_title' }
    ];

    navItems.forEach(({ id, key }) => {
        const nav = safeGet(id);
        if (nav) {
            const span = nav.querySelector('span:last-child');
            if (span) span.textContent = t(key) || key;
        }
    });
}

/* =====================================================
   Helpers
===================================================== */
function safeGet(id) { return document.getElementById(id); }
function safeText(id, value) { const el = safeGet(id); if(el) el.textContent = value; }
function showNotification(msg) {
    const notif = document.createElement('div');
    notif.className = 'fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity duration-300';
    notif.innerHTML = msg + ' <span onclick="this.parentNode.remove()" class="ml-2 cursor-pointer font-bold">✖</span>';
    document.body.appendChild(notif);
    setTimeout(()=>notif.style.opacity='0',3000);
    setTimeout(()=>notif.remove(),3500);
}

/* =====================================================
   Inicialización
===================================================== */
document.addEventListener('DOMContentLoaded', renderPage);
