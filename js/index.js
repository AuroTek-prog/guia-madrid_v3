// js/index.js - Lógica completa de la página principal

let currentLang = 'es';

function renderPage() {
    const apt = window.appState.apartmentData?.[window.appState.apartmentId];
    if (!apt) {
        console.error('No hay datos de apartamento disponibles');
        document.body.innerHTML = `
            <div class="p-8 text-center">
                <h1 class="text-3xl font-bold text-red-600">Apartamento no encontrado</h1>
                <p class="mt-4 text-gray-600 dark:text-gray-300">Vuelve al inicio o contacta al anfitrión.</p>
                <a href="index.html" class="mt-6 inline-block bg-primary text-white px-6 py-3 rounded-xl">Volver</a>
            </div>`;
        return;
    }

    currentLang = window.appState.lang;

    // Hero
    const heroImage = document.getElementById('hero-image');
    if (heroImage && apt.images?.portada) heroImage.style.backgroundImage = `url(${apt.images.portada})`;

    safeText('hero-subtitle', t('index.hero_subtitle'));
    const welcomeTitle = document.getElementById('welcome-title');
    if (welcomeTitle) welcomeTitle.innerHTML = `${t('index.welcome_title')} <br/><span class="font-bold">${t('index.welcome_bold')}</span>`;

    // Tarjeta flotante
    const thumbnail = document.getElementById('property-thumbnail');
    if (thumbnail && apt.images?.portada) thumbnail.style.backgroundImage = `url(${apt.images.portada})`;
    safeText('property-name', apt.name || 'Apartamento sin nombre');
    safeText('property-address', apt.address || 'Dirección no disponible');

    // Selector de idioma
    safeText('select-lang-title', t('index.select_language_title'));
    safeText('select-lang-desc', t('index.select_language_desc'));
    safeText('start-guide-text', t('index.start_guide'));

    // Botones de idioma dinámicos
    const languageGrid = document.getElementById('language-grid');
    if (languageGrid) {
        languageGrid.innerHTML = '';
        const languages = [
            { code: 'es', flag: '🇪🇸', name: 'languages.spanish' },
            { code: 'en', flag: '🇬🇧', name: 'languages.english' },
            { code: 'fr', flag: '🇫🇷', name: 'languages.french' },
            { code: 'de', flag: '🇩🇪', name: 'languages.german' }
        ];

        languages.forEach(lang => {
            const isSelected = lang.code === currentLang;
            const button = document.createElement('button');
            button.className = `group relative flex flex-col items-center justify-center gap-3 p-5 rounded-2xl bg-white dark:bg-[#1e2736] ${isSelected ? 'border-2 border-primary/10 dark:border-primary/30' : 'border border-transparent hover:border-primary/30 dark:hover:border-primary/50'} shadow-sm hover:shadow-md transition-all duration-300 ring-2 ring-transparent focus:ring-primary/20`;
            button.onclick = () => changeLanguage(lang.code);
            button.innerHTML = `
                <div class="w-10 h-10 rounded-full ${isSelected ? 'bg-primary/10 dark:bg-primary/20' : 'bg-[#f8f9fc] dark:bg-slate-700'} flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                    ${lang.flag}
                </div>
                <span class="text-sm font-semibold ${isSelected ? 'text-[#0d121b] dark:text-white' : 'text-[#0d121b] dark:text-white group-hover:text-primary dark:group-hover:text-primary-400'}">${t(lang.name)}</span>
                ${isSelected ? `<div class="absolute top-3 right-3"><span class="material-symbols-outlined text-primary text-sm">radio_button_checked</span></div>` : ''}
            `;
            languageGrid.appendChild(button);
        });
    }

    // Footer
    safeText('host-name', `${t('index.hosted_by')} ${apt.host?.name || 'Anfitrión'}`);
    safeText('app-version', t('index.app_version'));

    // Navegación textos y hrefs
    const navTexts = [
        { selector: '#nav-essentials h4', key: 'navigation.essentials_title' },
        { selector: '#nav-essentials p', key: 'navigation.essentials_desc' },
        { selector: '#nav-devices h4', key: 'navigation.devices_title' },
        { selector: '#nav-devices p', key: 'navigation.devices_desc' },
        { selector: '#nav-recommendations h4', key: 'navigation.recommendations_title' },
        { selector: '#nav-recommendations p', key: 'navigation.recommendations_desc' },
        { selector: '#nav-tourism h4', key: 'navigation.tourism_title' },
        { selector: '#nav-tourism p', key: 'navigation.tourism_desc' },
        { selector: '#nav-contact h4', key: 'navigation.contact_title' },
        { selector: '#nav-contact p', key: 'navigation.contact_desc' }
    ];
    navTexts.forEach(({ selector, key }) => {
        const el = document.querySelector(selector);
        if (el) el.textContent = t(key);
    });

    setupBottomNavigation(window.appState.apartmentId, currentLang);
}

function startGuide() {
    document.getElementById('language-selector-section')?.classList.add('hidden');
    document.getElementById('navigation-section')?.classList.remove('hidden');
}

function changeLanguage(lang) {
    const currentUrl = new URL(window.location);
    currentUrl.searchParams.set('lang', lang);
    window.location.href = currentUrl.toString();
}

// Helper seguro para texto
function safeText(id, text) {
    const el = document.getElementById(id);
    if (el && text) el.textContent = text;
}
