// js/index.js - Lógica principal de la home - Versión FINAL robusta, segura y optimizada

window.t = window.t || function(key) { return `[${key}]`; }; // fallback temporal

let currentLang = 'es';
let renderRetries = 0;

// Renderizado principal de la página
function renderPage() {
    console.log('renderPage() iniciado');

    if (typeof window.t !== 'function' || !window.appState?.translations) {
        if (renderRetries < 20) {
            console.warn('t() o traducciones no listas → reintentando en 100ms');
            renderRetries++;
            setTimeout(renderPage, 100);
        } else {
            console.error('No se pudo inicializar renderPage() tras múltiples intentos');
        }
        return;
    }

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
    console.log('Datos de apartamento cargados:', apt);

    currentLang = window.appState.lang || 'es';
    console.log('Idioma actual:', currentLang);

    // Hero
    const heroImage = document.getElementById('hero-image');
    if (heroImage && apt.images?.portada) heroImage.style.backgroundImage = `url(${apt.images.portada})`;

    document.getElementById('hero-subtitle').textContent = t('index.hero_subtitle');
    document.getElementById('welcome-title').innerHTML =
        `${t('index.welcome_title')} <br/><span class="font-bold">${t('index.welcome_bold')}</span>`;

    // Tarjeta flotante
    const thumbnail = document.getElementById('property-thumbnail');
    if (thumbnail && apt.images?.portada) thumbnail.style.backgroundImage = `url(${apt.images.portada})`;

    document.getElementById('property-name').textContent = apt.name || 'Apartamento sin nombre';
    document.getElementById('property-address').textContent = apt.address || 'Dirección no disponible';

    // Selector de idioma
    document.getElementById('select-lang-title').textContent = t('index.select_language_title');
    document.getElementById('select-lang-desc').textContent = t('index.select_language_desc');
    document.getElementById('start-guide-text').textContent = t('index.start_guide');

    renderLanguageButtons();

    // Footer
    document.getElementById('host-name').textContent = `${t('index.hosted_by')} ${apt.host?.name || 'Anfitrión'}`;
    document.getElementById('app-version').textContent = t('index.app_version');

    // Navegación y URLs
    renderNavigation();
    setupBottomNavigation(window.appState.apartmentId, currentLang);

    // Barra superior
    setupTopBar();

    console.log('renderPage() completado');
}

// Renderiza botones de idioma
function renderLanguageButtons() {
    const languageGrid = document.getElementById('language-grid');
    if (!languageGrid) return;

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
            ${isSelected ? `<div class="absolute top-3 right-3"><span class="material-symbols-outlined text-primary text-sm">radio_button_checked</span></div>` : ''}`;
        languageGrid.appendChild(button);
    });
    console.log('Botones de idioma renderizados');
}

// Renderiza textos de navegación
function renderNavigation() {
    const navConfig = [
        { id: 'nav-essentials', titleKey: 'navigation.essentials_title', descKey: 'navigation.essentials_desc' },
        { id: 'nav-devices', titleKey: 'navigation.devices_title', descKey: 'navigation.devices_desc' },
        { id: 'nav-recommendations', titleKey: 'navigation.recommendations_title', descKey: 'navigation.recommendations_desc' },
        { id: 'nav-tourism', titleKey: 'navigation.tourism_title', descKey: 'navigation.tourism_desc' },
        { id: 'nav-contact', titleKey: 'navigation.contact_title', descKey: 'navigation.contact_desc' }
    ];

    navConfig.forEach(({ id, titleKey, descKey }) => {
        const card = document.getElementById(id);
        if (card) {
            const h4 = card.querySelector('h4');
            const p = card.querySelector('p');
            if (h4) h4.textContent = t(titleKey);
            if (p) p.textContent = t(descKey);
        }
    });
    console.log('Navegación renderizada');
}

// Barra superior
function setupTopBar() {
    const params = new URLSearchParams(window.location.search);
    const apartmentId = params.get('apartment');

    const backBtn = document.getElementById('btn-back');
    if (backBtn) backBtn.onclick = () => {
        window.location.href = apartmentId ? `index.html?apartment=${apartmentId}&lang=${currentLang}` : 'index.html';
    };

    const langBtn = document.getElementById('btn-lang');
    if (langBtn) langBtn.onclick = () => {
        window.location.href = `index.html?apartment=${apartmentId}`;
    };
}

// Mostrar sección de navegación al iniciar guía
function startGuide() {
    const langSection = document.getElementById('language-selector-section');
    const navSection = document.getElementById('navigation-section');

    if (langSection) langSection.classList.add('hidden');
    if (navSection) navSection.classList.remove('hidden');

    console.log('Guía iniciada');
}

// Cambiar idioma
function changeLanguage(lang) {
    const url = new URL(window.location);
    url.searchParams.set('lang', lang);
    window.location.href = url.toString();
}

// Configuración robusta de navegación inferior
window.setupBottomNavigation = function(apartmentId, lang) {
    const baseUrl = `?apartment=${apartmentId}&lang=${lang}`;
    const navMap = {
        'nav-home': `index.html${baseUrl}`,
        'nav-devices': `pages/devices.html${baseUrl}`,
        'nav-recommendations': `pages/recommendations.html${baseUrl}`,
        'nav-tourism': `pages/tourism.html${baseUrl}`,
        'nav-contact': `pages/contact.html${baseUrl}`,
        'nav-essentials': `pages/essentials.html${baseUrl}`
    };

    Object.entries(navMap).forEach(([id, href]) => {
        const link = document.getElementById(id);
        if (link) link.href = href;
    });
};

// Asignación del botón "Comenzar guía"
function assignStartButton() {
    const startBtn = document.getElementById('start-guide-btn');
    if (startBtn) {
        startBtn.removeEventListener('click', startGuide);
        startBtn.addEventListener('click', startGuide);
        console.log('Evento click asignado al botón Comenzar guía');
    } else {
        setTimeout(assignStartButton, 500);
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    renderPage();
    assignStartButton();
});
