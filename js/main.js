// js/main.js - Versión final robusta y tolerante, un solo bloque

window.appState = {
    apartmentId: null,
    lang: 'es',
    apartmentData: null,
    translations: null
};

async function initializeApp() {
    const params = new URLSearchParams(window.location.search);
    window.appState.apartmentId = params.get('apartment') || 'sol-101';
    window.appState.lang = params.get('lang') || 'es';

    try {
        // Cargar datos en paralelo
        const [apartmentRes, translationsRes] = await Promise.all([
            fetch(`${window.ROOT_PATH}data/apartments.json`),
            fetch(`${window.ROOT_PATH}data/${window.appState.lang}.json`)
        ]);

        if (!apartmentRes.ok) throw new Error(`Apartments: ${apartmentRes.statusText}`);
        if (!translationsRes.ok) throw new Error(`Translations: ${translationsRes.statusText}`);

        const apartmentsObj = await apartmentRes.json();
        window.appState.apartmentData = apartmentsObj;

        // Validar apartamento solicitado
        if (!apartmentsObj[window.appState.apartmentId]) {
            console.warn(`Apartamento no encontrado: ${window.appState.apartmentId} → usando default`);
            window.appState.apartmentId = 'sol-101';
            if (!apartmentsObj['sol-101']) throw new Error('Default sol-101 no existe');
        }

        window.appState.translations = await translationsRes.json();
        document.documentElement.lang = window.appState.lang;

        // Llamar a renderPage si existe
        if (typeof renderPage === 'function') renderPage();
        else console.warn('renderPage no definido – espera a que index.js cargue');

    } catch (error) {
        console.error("Error inicializando app:", error);
        document.body.innerHTML = `
            <div class="p-8 text-center bg-white dark:bg-gray-900 min-h-screen flex flex-col items-center justify-center">
                <h1 class="text-3xl font-bold text-red-600 mb-4">Error al cargar la guía</h1>
                <p class="text-gray-600 dark:text-gray-300 mb-6 max-w-md">
                    Parece que hay un problema con los datos o la conexión. Intenta refrescar o contacta al anfitrión.
                </p>
                <a href="index.html" class="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700">
                    Volver al inicio
                </a>
            </div>`;
    }

    // Función de traducción global con fallback
    window.t = function(key) {
        if (!window.appState?.translations) return `[${key}]`;
        return key.split('.').reduce((obj, k) => (obj?.[k] ?? undefined), window.appState.translations) ?? `[${key}]`;
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

    // Navegar atrás sin perder parámetros
    window.goBack = function() {
        const params = new URLSearchParams(window.location.search);
        const apartmentId = params.get('apartment') || 'sol-101';
        const lang = params.get('lang') || 'es';
        if (!window.location.pathname.endsWith('index.html')) {
            window.location.href = `${window.ROOT_PATH}index.html?apartment=${apartmentId}&lang=${lang}`;
        } else {
            history.back();
        }
    };

    // Cambiar idioma
    window.changeLanguage = function() {
        window.location.href = `${window.ROOT_PATH}index.html`;
    };

    // Configurar navegación inferior
    window.setupBottomNavigation = function(apartmentId, lang) {
        const baseUrl = `?apartment=${apartmentId}&lang=${lang}`;
        const navMap = [
            { id: 'nav-home', href: `index.html${baseUrl}`, key: 'navigation.nav_home' },
            { id: 'nav-devices', href: `devices.html${baseUrl}`, key: 'navigation.devices_title' },
            { id: 'nav-recommendations', href: `recommendations.html${baseUrl}`, key: 'navigation.recommendations_title' },
            { id: 'nav-tourism', href: `tourism.html${baseUrl}`, key: 'navigation.tourism_title' },
            { id: 'nav-contact', href: `contact.html${baseUrl}`, key: 'navigation.contact_title' }
        ];
        navMap.forEach(({ id, href, key }) => {
            const nav = document.getElementById(id);
            if (nav) {
                nav.href = href;
                const span = nav.querySelector('span:last-child');
                if (span) span.textContent = t(key) || key;
            }
        });
    };
}

document.addEventListener('DOMContentLoaded', initializeApp);
