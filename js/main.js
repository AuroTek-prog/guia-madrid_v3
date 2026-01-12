// js/main.js - Versión robusta, completa y optimizada (enero 2026)

// ==============================
// Estado global
// ==============================
window.appState = {
    apartmentId: null,
    lang: 'es',
    apartmentData: null,
    translations: null
};

// ==============================
// Traducción global con fallback
// ==============================
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

// ==============================
// Helper global para texto seguro
// ==============================
window.safeText = function(id, value) {
    const el = document.getElementById(id);
    if (!el) {
        console.warn(`⚠️ Elemento #${id} no encontrado`);
        return;
    }
    if (value !== undefined && value !== null) {
        el.textContent = value;
    }
};

// ==============================
// Copiar al portapapeles
// ==============================
window.copyToClipboard = function(text) {
    if (!navigator.clipboard) {
        console.warn('Clipboard API no soportado');
        showNotification('Función no disponible');
        return;
    }
    navigator.clipboard.writeText(text)
        .then(() => showNotification(t('common.copied') || 'Copiado'))
        .catch(err => {
            console.error('Error al copiar:', err);
            showNotification('Error al copiar');
        });
};

// ==============================
// Mostrar notificaciones
// ==============================
window.showNotification = function(message) {
    const notification = document.createElement('div');
    notification.className =
        'fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity duration-300';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => { notification.style.opacity = '0'; }, 2000);
    setTimeout(() => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
    }, 2300);
};

// ==============================
// Volver atrás preservando params
// ==============================
window.goBack = function() {
    const params = new URLSearchParams(window.location.search);
    const apartmentId = params.get('apartment') || 'sol-101';
    const lang = params.get('lang') || 'es';

    window.location.href =
        `${window.ROOT_PATH}index.html?apartment=${encodeURIComponent(apartmentId)}&lang=${encodeURIComponent(lang)}`;
};

// ==============================
// Cambiar idioma (preserva apt)
// ==============================
window.changeLanguage = function() {
    const apartmentId = window.appState.apartmentId || 'sol-101';
    const lang = window.appState.lang || 'es';

    window.location.href =
        `${window.ROOT_PATH}index.html?apartment=${encodeURIComponent(apartmentId)}&lang=${encodeURIComponent(lang)}`;
};

// ======================================================
// Navegación inferior (RUTAS ABSOLUTAS DESDE LA RAÍZ)
// ======================================================
window.setupBottomNavigation = function(apartmentId, lang) {
    const baseUrl = `?apartment=${encodeURIComponent(apartmentId)}&lang=${encodeURIComponent(lang)}`;
    const root = window.ROOT_PATH || './';

    const navMap = [
        { id: 'nav-home', href: `${root}index.html${baseUrl}`, key: 'navigation.nav_home' },
        { id: 'nav-devices', href: `${root}pages/devices.html${baseUrl}`, key: 'navigation.devices_title' },
        { id: 'nav-recommendations', href: `${root}pages/recommendations.html${baseUrl}`, key: 'navigation.recommendations_title' },
        { id: 'nav-tourism', href: `${root}pages/tourism.html${baseUrl}`, key: 'navigation.tourism_title' },
        { id: 'nav-contact', href: `${root}pages/contact.html${baseUrl}`, key: 'navigation.contact_title' },
        { id: 'nav-essentials', href: `${root}pages/essentials.html${baseUrl}`, key: 'navigation.essentials_title' }
    ];

    navMap.forEach(({ id, href, key }) => {
        const link = document.getElementById(id);
        if (link) {
            link.href = href;
            const span = link.querySelector('span:last-child');
            if (span) span.textContent = t(key) || key;
        }
    });

    console.log('Navegación inferior configurada con rutas absolutas:', navMap);
};

// ==============================
// Inicialización principal
// ==============================
async function initializeApp() {
    const params = new URLSearchParams(window.location.search);
    window.appState.apartmentId = params.get('apartment') || 'sol-101';
    window.appState.lang = params.get('lang') || 'es';

    try {
        const [apartmentRes, translationsRes] = await Promise.all([
            fetch(`${window.ROOT_PATH}data/apartments.json`),
            fetch(`${window.ROOT_PATH}data/${window.appState.lang}.json`)
        ]);

        if (!apartmentRes.ok || !translationsRes.ok) {
            throw new Error('Error cargando datos');
        }

        window.appState.apartmentData = await apartmentRes.json();
        window.appState.translations = await translationsRes.json();

        if (!window.appState.apartmentData[window.appState.apartmentId]) {
            console.warn(`Apartamento "${window.appState.apartmentId}" no encontrado → usando default`);
            window.appState.apartmentId = 'sol-101';
            if (!window.appState.apartmentData['sol-101']) {
                throw new Error('Default sol-101 no existe');
            }
        }

        document.documentElement.lang = window.appState.lang;

        const wait = setInterval(() => {
            if (typeof renderPage === 'function') {
                clearInterval(wait);
                renderPage();
            }
        }, 100);

        setTimeout(() => clearInterval(wait), 5000);

    } catch (error) {
        console.error('Error inicializando app:', error);
        document.body.innerHTML = `
            <div class="p-8 text-center bg-white dark:bg-gray-900 min-h-screen flex flex-col items-center justify-center">
                <h1 class="text-3xl font-bold text-red-600 mb-4">Error al cargar la guía</h1>
                <p class="text-gray-600 dark:text-gray-300 mb-6 max-w-md">
                    Parece que hay un problema con los datos o la conexión.
                </p>
                <a href="${window.ROOT_PATH}index.html?apartment=${encodeURIComponent(window.appState.apartmentId || 'sol-101')}&lang=${encodeURIComponent(window.appState.lang || 'es')}"
                   class="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700">
                    Volver al inicio
                </a>
            </div>`;
    }
}

document.addEventListener('DOMContentLoaded', initializeApp);

// =====================================================
// Zona del apartamento (Turf.js) con tolerancia mejorada
// =====================================================
let __zonesCache = null;

async function getApartmentZone(apartment, tolerance = 0.0005) {
    if (!apartment?.lat || !apartment?.lng) return null;

    const lat = Number(apartment.lat);
    const lng = Number(apartment.lng);
    if (isNaN(lat) || isNaN(lng)) return null;

    try {
        if (!__zonesCache) {
            const zonesRes = await fetch(`${window.ROOT_PATH}data/zones.json`);
            if (!zonesRes.ok) throw new Error('No se pudo cargar zones.json');
            __zonesCache = await zonesRes.json();
        }

        const point = turf.point([lng, lat]);

        for (const zone of __zonesCache) {
            if (!zone?.polygon?.length || zone.polygon.length < 3) continue;

            let coords = zone.polygon.map(p => [Number(p[0]), Number(p[1])]);
            const first = coords[0];
            const last = coords[coords.length - 1];
            if (Math.abs(first[0] - last[0]) > tolerance || Math.abs(first[1] - last[1]) > tolerance) {
                coords = [...coords, first];
            }

            const polygon = turf.polygon([coords]);
            if (turf.booleanPointInPolygon(point, polygon)) {
                console.log(`Zona detectada: ${zone.name} (id: ${zone.id})`);
                return zone;
            }
        }

        console.log('No se encontró zona para:', { lat, lng });
        return null;
    } catch (err) {
        console.error('Error cargando/detectando zona:', err);
        return null;
    }
}
