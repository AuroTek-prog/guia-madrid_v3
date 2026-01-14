// js/main.js - Versión corregida y optimizada (enero 2026)

// ==============================
// Estado global
// ==============================
window.appState = {
    apartmentId: null,
    lang: 'es',
    apartmentData: null,
    translations: null,
    debugMode: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
};

// ==============================
// Traducción global con placeholders y glosario
// ==============================
window.t = function(key, placeholders = {}, options = {}) {
    // Opciones: { useGlossary: true, silent: false }
    const { useGlossary = true, silent = false } = options;
    
    if (!window.appState?.translations) {
        if (!silent) {
            if (window.appState.debugMode) {
                console.warn('Traducciones no cargadas');
            }
        }
        return `[${key}]`;
    }
    
    // Obtener el valor de la clave desde el objeto de traducciones
    const keys = key.split('.');
    let value = window.appState.translations;
    
    for (const k of keys) {
        value = value?.[k];
        if (value === undefined) {
            if (!silent) {
                if (window.appState.debugMode) {
                    console.warn(`Clave de traducción no encontrada: ${key}`);
                }
            }
            return `[${key}]`;
        }
    }
    
    // Si el valor es una cadena, procesar placeholders y glosario
    if (typeof value === 'string') {
        // Reemplazar placeholders como {{key}}
        for (const placeholderKey in placeholders) {
            if (placeholders.hasOwnProperty(placeholderKey)) {
                const regex = new RegExp(`{{\\s*${placeholderKey}\\s*}}`, 'g');
                value = value.replace(regex, placeholders[placeholderKey]);
            }
        }
        
        // Aplicar traducción con glosario si es necesario
        if (useGlossary && window.appState.lang !== 'es' && window.appState.translations?.glossary) {
            value = translateWithGlossary(value, window.appState.lang);
        }
    }
    
    return value;
};

// ==============================
// Traducción con glosario de palabras clave
// ==============================
window.translateWithGlossary = function(text, lang) {
    if (lang === 'es' || !window.appState?.translations?.glossary) return text;
    const glossary = window.appState.translations.glossary;
    let translatedText = text;
    
    // Ordenar las claves por longitud (descendente) para traducir frases primero
    const sortedKeys = Object.keys(glossary).sort((a, b) => b.length - a.length);
    
    sortedKeys.forEach(spanishTerm => {
        const translation = glossary[spanishTerm];
        if (translation) {
            // Usar expresión regular con 'g' (global) y 'i' (insensible a mayúsculas/minúsculas)
            const regex = new RegExp(`\\b${spanishTerm}\\b`, 'gi');
            translatedText = translatedText.replace(regex, (match) => {
                // Conservar la capitalización original
                if (match[0] === match[0].toUpperCase()) {
                    return translation.charAt(0).toUpperCase() + translation.slice(1);
                }
                return translation;
            });
        }
    });
    
    return translatedText;
};

// Resolver claves de traducción con tolerancia a formatos antiguos (global)
window.resolveTranslation = function(key, placeholders = {}, options = {}) {
    if (!key) return '';
    if (!window.appState?.translations) return `[${key}]`;

    const tryKeys = [];
    tryKeys.push(key);
    // underscores -> dots
    if (key.includes('_')) tryKeys.push(key.replace(/_/g, '.'));
    // rules_foo -> rules.foo
    if (key.startsWith('rules_')) tryKeys.push(`rules.${key.replace(/^rules_/, '')}`);
    // first underscore to dot
    if (key.includes('_') && !key.includes('.')) tryKeys.push(key.replace('_', '.'));

    for (const candidate of tryKeys) {
        const parts = candidate.split('.');
        let node = window.appState.translations;
        let found = true;
        for (const p of parts) {
            if (node && Object.prototype.hasOwnProperty.call(node, p)) {
                node = node[p];
            } else {
                found = false;
                break;
            }
        }
        if (found && node !== undefined) {
            let value = node;
            if (typeof value === 'string') {
                // placeholders
                for (const k in placeholders) {
                    if (Object.prototype.hasOwnProperty.call(placeholders, k)) {
                        const regex = new RegExp(`{{\\s*${k}\\s*}}`, 'g');
                        value = value.replace(regex, placeholders[k]);
                    }
                }
                // glossary
                const useGlossary = options?.useGlossary !== false;
                if (useGlossary && window.appState.lang !== 'es' && window.appState.translations?.glossary) {
                    value = window.translateWithGlossary ? window.translateWithGlossary(value, window.appState.lang) : value;
                }
            }
            return value;
        }
    }

    return `[${key}]`;
};

// ==============================
// Helper global para texto seguro
// ==============================
window.safeText = function(id, value) {
    const el = document.getElementById(id);
    if (!el) {
        if (window.appState.debugMode) {
            console.warn(`⚠️ Elemento #${id} no encontrado`);
        }
        return;
    }
    if (value !== undefined && value !== null) el.textContent = value;
};

// ==============================
// Copiar al portapapeles con animación de éxito
// ==============================
window.copyToClipboard = function(text, successElementId) {
    if (!navigator.clipboard) return showNotification('Función no disponible');
    navigator.clipboard.writeText(text)
        .then(() => {
            showNotification(t('common.copied') || 'Copiado');
            
            // Mostrar animación de éxito
            if (successElementId) {
                const successElement = document.getElementById(successElementId);
                if (successElement) {
                    successElement.classList.add('show');
                    setTimeout(() => {
                        successElement.classList.remove('show');
                    }, 2000);
                }
            }
        })
        .catch(err => {
            console.error('Error al copiar:', err);
            showNotification('Error al copiar');
        });
};

// ==============================
// Mostrar notificaciones mejoradas
// ==============================
window.showNotification = function(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    
    // Clases base
    notification.className = 'fixed bottom-20 left-1/2 transform -translate-x-1/2 px-4 py-3 rounded-lg shadow-lg z-50 transition-all duration-300 max-w-sm';
    
    // Clases específicas del tipo
    const typeClasses = {
        info: 'bg-blue-600 text-white',
        success: 'bg-green-600 text-white',
        warning: 'bg-yellow-500 text-white',
        error: 'bg-red-600 text-white'
    };
    
    notification.classList.add(...typeClasses[type].split(' '));
    
    notification.innerHTML = `
        <div class="flex items-center justify-between">
            <span>${message}</span>
            <span onclick="this.parentElement.remove()" class="ml-4 cursor-pointer font-bold">✖</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animación de entrada
    setTimeout(() => {
        notification.classList.add('opacity-100');
    }, 10);
    
    // Animación de salida y eliminación
    setTimeout(() => {
        notification.classList.remove('opacity-100');
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, duration);
};

// ==============================
// Validación de traducciones (solo en modo debug)
// ==============================
window.validateTranslations = function() {
    if (!window.appState.debugMode) return;
    
    const usedKeys = new Set();
    
    // Recolectar todas las claves usadas en el código
    document.querySelectorAll('[data-t]').forEach(el => {
        usedKeys.add(el.dataset.t);
    });
    
    document.querySelectorAll('[data-translate]').forEach(el => {
        usedKeys.add(el.dataset.translate);
    });
    
    // Verificar si todas las claves usadas existen en las traducciones
    const missingKeys = [];
    usedKeys.forEach(key => {
        if (t(key, {}, { silent: true }) === `[${key}]`) {
            missingKeys.push(key);
        }
    });
    
    if (missingKeys.length > 0) {
        console.groupCollapsed('⚠️ Claves de traducción faltantes:', true);
        console.table(missingKeys);
        console.groupEnd();
    } else {
        console.log('✅ Todas las claves de traducción están definidas');
    }
};

// ==============================
// Volver atrás preservando params
// ==============================
window.goBack = function() {
    const params = new URLSearchParams(window.location.search);
    const apartmentId = params.get('apartment') || 'sol-101';
    const lang = params.get('lang') || 'es';
    window.location.href = `${window.ROOT_PATH}index.html?apartment=${encodeURIComponent(apartmentId)}&lang=${encodeURIComponent(lang)}`;
};

// ==============================
// Cambiar idioma (preserva apt)
// ==============================
window.changeLanguage = function() {
    const apartmentId = window.appState.apartmentId || 'sol-101';
    const lang = window.appState.lang || 'es';
    window.location.href = `${window.ROOT_PATH}index.html?apartment=${encodeURIComponent(apartmentId)}&lang=${encodeURIComponent(lang)}`;
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
    
    if (window.appState.debugMode) {
        console.log('Navegación inferior configurada:', navMap);
    }
};

// ==============================
// Inicialización principal mejorada
// ==============================
async function initializeApp() {
    const params = new URLSearchParams(window.location.search);
    window.appState.apartmentId = params.get('apartment') || 'sol-101';
    window.appState.lang = params.get('lang') || 'es';

    try {
        // Cargar datos de forma secuencial para evitar errores de referencia
        const apartmentsRes = await fetch(`${window.ROOT_PATH}data/apartments.json`);
        const translationsRes = await fetch(`${window.ROOT_PATH}data/${window.appState.lang}.json`);

        if (!apartmentsRes.ok || !translationsRes.ok) {
            throw new Error('Error cargando datos');
        }

        const apartmentsData = await apartmentsRes.json();
        const translations = await translationsRes.json();

        window.appState.apartmentData = apartmentsData;
        window.appState.translations = translations;

        if (!window.appState.apartmentData[window.appState.apartmentId]) {
            if (window.appState.debugMode) {
                console.warn(`Apartamento "${window.appState.apartmentId}" no encontrado → usando default`);
            }
            window.appState.apartmentId = 'sol-101';
            if (!window.appState.apartmentData['sol-101']) {
                throw new Error('Default sol-101 no existe');
            }
        }

        document.documentElement.lang = window.appState.lang;

        // Esperar a que la página esté completamente cargada antes de ejecutar renderPage
        if (typeof renderPage === 'function') {
            renderPage();
        }

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

// ==============================
// Inicialización con validación
// ==============================
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    
    // Validar traducciones en modo debug
    setTimeout(() => {
        validateTranslations();
    }, 1000);
});

// =====================================================
// Zona del apartamento (Turf.js) con tolerancia mejorada
// =====================================================
let __zonesCache = null;

async function getApartmentZone(apartment, tolerance = 0.0007) {
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
            if (!Array.isArray(zone?.polygon) || zone.polygon.length < 3) continue;

            let coords = zone.polygon.map(p => [Number(p[0]), Number(p[1])]).filter(c => !c.some(isNaN));
            if (coords.length < 3) continue;

            const first = coords[0];
            const last = coords[coords.length - 1];
            if (Math.abs(first[0] - last[0]) > tolerance || Math.abs(first[1] - last[1]) > tolerance) {
                coords.push(first);
            }

            if (turf.booleanPointInPolygon(point, turf.polygon([coords]))) {
                if (window.appState.debugMode) {
                    console.log(`Zona detectada: ${zone.name} (id: ${zone.id})`);
                }
                return zone;
            }
        }

        if (window.appState.debugMode) {
            console.log('No se encontró zona para:', { lat, lng });
        }
        return null;

    } catch (err) {
        console.error('Error cargando/detectando zona:', err);
        return null;
    }
}