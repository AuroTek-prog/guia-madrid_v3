// js/main.js - Versión robusta que espera a renderPage

window.appState = {
    apartmentId: null,
    lang: 'es',
    apartmentData: null,
    translations: null
};

// Función de traducción global con fallback
window.t = function(key) {
    if (!window.appState?.translations) return `[${key}]`;
    const keys = key.split('.');
    let value = window.appState.translations;
    for (const k of keys) {
        value = value?.[k];
        if (value === undefined) return `[${key}]`;
    }
    return value;
};

// Copiar al portapapeles
window.copyToClipboard = function(text) {
    if (!navigator.clipboard) {
        console.warn('Clipboard API no soportado');
        showNotification('Función no disponible');
        return;
    }
    navigator.clipboard.writeText(text)
        .then(() => showNotification(t('common.copied')))
        .catch(err => {
            console.error('Error al copiar: ', err);
            showNotification('Error al copiar');
        });
};

// Mostrar notificaciones
window.showNotification = function(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity duration-300';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => { notification.style.opacity = '0'; }, 2000);
    setTimeout(() => { if (document.body.contains(notification)) document.body.removeChild(notification); }, 2300);
};

// Navegar atrás o al inicio preservando apartment y lang
window.goBack = function() {
    const currentParams = new URLSearchParams(window.location.search);
    const apartmentId = currentParams.get('apartment') || 'sol-101';
    const lang = currentParams.get('lang') || 'es';

    console.log('goBack() llamado - Volviendo con apartamento:', apartmentId);

    // Siempre redirigir a index.html con parámetros para evitar perder apartment/lang
    window.location.href = `${window.ROOT_PATH}index.html?apartment=${apartmentId}&lang=${lang}`;
};

// Cambiar idioma
window.changeLanguage = function() {
    const apartmentId = window.appState.apartmentId || 'sol-101';
    const lang = window.appState.lang || 'es';
    window.location.href = `${window.ROOT_PATH}index.html?apartment=${apartmentId}&lang=${lang}`;
};

// Configurar navegación inferior con parámetros apartment y lang
window.setupBottomNavigation = function(apartmentId, lang) {
    const baseUrl = `?apartment=${encodeURIComponent(apartmentId)}&lang=${encodeURIComponent(lang)}`;

    const navMap = [
        { id: 'nav-home', href: `index.html${baseUrl}`, key: 'navigation.nav_home' },
        { id: 'nav-devices', href: `pages/devices.html${baseUrl}`, key: 'navigation.devices_title' },
        { id: 'nav-recommendations', href: `pages/recommendations.html${baseUrl}`, key: 'navigation.recommendations_title' },
        { id: 'nav-tourism', href: `pages/tourism.html${baseUrl}`, key: 'navigation.tourism_title' },
        { id: 'nav-contact', href: `pages/contact.html${baseUrl}`, key: 'navigation.contact_title' },
        { id: 'nav-essentials', href: `pages/essentials.html${baseUrl}`, key: 'navigation.essentials_title' }
    ];

    navMap.forEach(({ id, href, key }) => {
        const link = document.getElementById(id);
        if (!link) return;
        link.href = href;
        const span = link.querySelector('span:last-child');
        if (span) span.textContent = (typeof t === 'function' ? t(key) : key) || key;
    });

    console.log('Navegación inferior actualizada:', baseUrl);
};

async function initializeApp() {
    const params = new URLSearchParams(window.location.search);
    window.appState.apartmentId = params.get('apartment') || 'sol-101';
    window.appState.lang = params.get('lang') || 'es';

    try {
        const [apartmentRes, translationsRes] = await Promise.all([
            fetch(`${window.ROOT_PATH}data/apartments.json`),
            fetch(`${window.ROOT_PATH}data/${window.appState.lang}.json`)
        ]);

        if (!apartmentRes.ok || !translationsRes.ok) throw new Error('Error cargando datos');

        window.appState.apartmentData = await apartmentRes.json();
        window.appState.translations = await translationsRes.json();

        if (!window.appState.apartmentData[window.appState.apartmentId]) {
            console.warn('Apartamento no encontrado → default sol-101');
            window.appState.apartmentId = 'sol-101';
            if (!window.appState.apartmentData['sol-101']) throw new Error('Default sol-101 no existe');
        }

        document.documentElement.lang = window.appState.lang;

        // Esperar a que renderPage exista (de index.js)
        const wait = setInterval(() => {
            if (typeof renderPage === 'function') {
                clearInterval(wait);
                renderPage();
            }
        }, 100);

        // Timeout de seguridad
        setTimeout(() => clearInterval(wait), 5000);

    } catch (error) {
        console.error("Error inicializando app:", error);
        document.body.innerHTML = `
            <div class="p-8 text-center bg-white dark:bg-gray-900 min-h-screen flex flex-col items-center justify-center">
                <h1 class="text-3xl font-bold text-red-600 mb-4">Error al cargar la guía</h1>
                <p class="text-gray-600 dark:text-gray-300 mb-6 max-w-md">
                    Parece que hay un problema con los datos o la conexión. Intenta refrescar o contacta al anfitrión.
                </p>
                <a href="index.html?apartment=${window.appState.apartmentId}&lang=${window.appState.lang}" class="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700">
                    Volver al inicio
                </a>
            </div>`;
    }
}

document.addEventListener('DOMContentLoaded', initializeApp);
