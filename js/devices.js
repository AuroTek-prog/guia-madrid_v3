function renderPage() {
    const apt = window.appState.apartmentData[window.appState.apartmentId];

    // Actualizar textos estáticos de la página
    document.title = t('navigation.devices_title');
    document.getElementById('page-title').textContent = t('navigation.devices_title');
    document.getElementById('headline').textContent = t('devices.title');
    document.getElementById('subtitle').textContent = t('devices.subtitle');
    document.getElementById('appliances-title').textContent = t('devices.appliances_title');
    document.getElementById('contact-host-text').textContent = t('devices.contact_host');

    // Actualizar textos de los botones rápidos
    document.getElementById('unlock-door-text').textContent = t('devices.unlock_door');
    document.getElementById('unlock-door-desc').textContent = t('devices.unlock_door_desc');
    document.getElementById('wifi-code-text').textContent = t('devices.wifi_code');
    document.getElementById('wifi-code-desc').textContent = t('devices.wifi_code_desc');

    // Generar la lista de dispositivos dinámicamente
    const devicesList = document.getElementById('devices-list');
    devicesList.innerHTML = ''; // Limpiar contenido previo

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
    
    // Configurar navegación inferior
    setupBottomNavigation(window.appState.apartmentId, window.appState.lang);
}

function showDeviceDetails(deviceKey) {
    const apt = window.appState.apartmentData[window.appState.apartmentId];
    const modal = document.getElementById('device-modal');
    const title = document.getElementById('modal-title');
    const content = document.getElementById('modal-content');

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
    
    // Mostrar el modal
    modal.classList.remove('hidden');
}

function closeDeviceModal() {
    document.getElementById('device-modal').classList.add('hidden');
}

function contactHost() {
    const apt = window.appState.apartmentData[window.appState.apartmentId];
    const phoneNumber = apt.host.phone;
    if (phoneNumber) {
        window.open(`tel:${phoneNumber}`, '_self');
    } else {
        showNotification("El número de teléfono del anfitrión no está disponible.");
    }
}

// Función para configurar la navegación inferior
function setupBottomNavigation(apartmentId, lang) {
    const baseUrl = `?apartment=${apartmentId}&lang=${lang}`;
    
    // Configurar enlaces de navegación
    const navHome = document.getElementById('nav-home');
    if (navHome) navHome.href = `${window.ROOT_PATH}index.html${baseUrl}`;
    
    const navDevices = document.getElementById('nav-devices');
    if (navDevices) navDevices.href = `devices.html${baseUrl}`;
    
    const navRecommendations = document.getElementById('nav-recommendations');
    if (navRecommendations) navRecommendations.href = `recommendations.html${baseUrl}`;
    
    const navTourism = document.getElementById('nav-tourism');
    if (navTourism) navTourism.href = `tourism.html${baseUrl}`;
    
    // Añadir navegación a la página de contacto si existe
    const navContact = document.getElementById('nav-contact');
    if (navContact) navContact.href = `contact.html${baseUrl}`;
    
    // Actualizar textos de navegación
    const navItems = [
        { id: 'nav-home', key: 'navigation.nav_home' },
        { id: 'nav-devices', key: 'navigation.devices_title' },
        { id: 'nav-recommendations', key: 'navigation.recommendations_title' },
        { id: 'nav-tourism', key: 'navigation.tourism_title' },
        { id: 'nav-contact', key: 'navigation.contact_title' }
    ];
    
    navItems.forEach(({ id, key }) => {
        const nav = document.getElementById(id);
        if (nav) {
            const span = nav.querySelector('span:last-child');
            if (span) span.textContent = t(key) || key;
        }
    });
}