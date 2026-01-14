/* =====================================================
   FUNCIÓN DE TRADUCCIÓN MEJORADA Y EXTENDIDA
===================================================== */
/**
 * Traduce una clave usando el sistema de traducciones y glosario
 * @param {string} key - Clave de traducción (ej: 'essentials.title')
 * @param {Object} placeholders - Objeto con valores para reemplazar placeholders (opcional)
 * @param {boolean} useGlossary - Si se debe usar el glosario para traducir texto dinámico (opcional, por defecto true)
 * @returns {string} - Texto traducido o la clave original si no se encuentra
 */
const localT = function(key, placeholders = {}, useGlossary = true) {
    const placeholdersArg = placeholders || {};
    const options = { useGlossary };
    if (window.resolveTranslation) return window.resolveTranslation(key, placeholdersArg, options);
    if (window.t) return window.t(key, placeholdersArg, options);
    return key;
};

/**
 * Traduce un texto usando un glosario de palabras clave
 * @param {string} text - Texto original en español
 * @param {string} lang - Código de idioma
 * @returns {string} - Texto con palabras clave traducidas
 */
function translateWithGlossary(text, lang) {
    if (window.translateWithGlossary) return window.translateWithGlossary(text, lang);
    // Si no hay implementación global, mantener la implementación local mínima
    if (lang === 'es' || !window.appState?.translations?.glossary) return text;
    const glossary = window.appState.translations.glossary;
    let translatedText = text;
    const sortedKeys = Object.keys(glossary).sort((a, b) => b.length - a.length);
    sortedKeys.forEach(spanishTerm => {
        const translation = glossary[spanishTerm];
        if (translation) {
            const regex = new RegExp(`\\b${spanishTerm}\\b`, 'gi');
            translatedText = translatedText.replace(regex, (match) => match[0] === match[0].toUpperCase() ? translation.charAt(0).toUpperCase() + translation.slice(1) : translation);
        }
    });
    return translatedText;
}

/* =====================================================
   HELPERS MEJORADOS
===================================================== */
/**
 * Obtiene un elemento de forma segura y registra una advertencia si no existe
 * @param {string} id - ID del elemento
 * @returns {HTMLElement|null} - Elemento encontrado o null
 */
function safeGet(id) {
    const el = document.getElementById(id);
    if (!el) console.warn(`⚠️ Elemento #${id} no encontrado`);
    return el;
}

/**
 * Establece el texto de un elemento de forma segura
 * @param {string} id - ID del elemento
 * @param {string} value - Valor a establecer
 */
function safeText(id, value) {
    const el = safeGet(id);
    if (el && value !== undefined && value !== null) el.textContent = value;
}

/**
 * Establece el HTML interno de un elemento de forma segura
 * @param {string} id - ID del elemento
 * @param {string} html - HTML a establecer
 */
function safeHTML(id, html) {
    const el = safeGet(id);
    if (el && html !== undefined && html !== null) el.innerHTML = html;
}

/* =====================================================
   MENSAJES FLOTANTES MEJORADAS
===================================================== */
/**
 * Muestra una notificación flotante
 * @param {string} message - Mensaje a mostrar
 * @param {number} duration - Duración en milisegundos (opcional, por defecto 3000)
 * @param {string} type - Tipo de notificación: 'info', 'success', 'warning', 'error' (opcional)
 */
function showNotification(message, duration = 3000, type = 'info') {
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
}

/* =====================================================
   COPIAR AL PORTAPAPELES MEJORADO
===================================================== */
/**
 * Copia texto al portapapeles y muestra una notificación
 * @param {string} text - Texto a copiar
 * @param {string} successMessage - Mensaje de éxito (opcional)
 */
function copyToClipboard(text, successMessage) {
    if (!navigator.clipboard) {
        showNotification('Función no disponible en este navegador', 3000, 'warning');
        return;
    }
    
    navigator.clipboard.writeText(text)
        .then(() => {
            const defaultMessage = localT('common.copied') || '¡Copiado!';
            showNotification(successMessage || defaultMessage, 2000, 'success');
        })
        .catch(err => {
            console.error('Error al copiar:', err);
            showNotification('Error al copiar el texto', 3000, 'error');
        });
}

/* =====================================================
   INICIALIZACIÓN DE PÁGINA MEJORADA
===================================================== */
/**
 * Inicializa una página con el patrón común
 * @param {string} pageName - Nombre de la página (para logging)
 * @param {Function} pageInit - Función de inicialización específica de la página
 */
async function initializePage(pageName, pageInit) {
    const params = new URLSearchParams(window.location.search);
    const apartmentId = params.get('apartment') || 'sol-101';
    const lang = params.get('lang') || 'es';

    try {
        const [apartmentsRes, translationsRes] = await Promise.all([
            fetch(`${window.ROOT_PATH}data/apartments.json`),
            fetch(`${window.ROOT_PATH}data/${lang}.json`)
        ]);

        if (!apartmentsRes.ok || !translationsRes.ok) {
            throw new Error('Error cargando datos');
        }

        const apartmentsData = await apartmentsRes.json();
        const translations = await translationsRes.json();
        
        // Guardar datos en el estado global
        window.appState = {
            apartmentId,
            apartmentData: apartmentsData,
            translations,
            lang
        };

        const apt = apartmentsData[apartmentId];
        if (!apt) {
            console.warn(`Apartamento "${apartmentId}" no encontrado, usando defecto`);
            window.appState.apartmentId = 'sol-101';
        }

        // Configurar título de página
        document.title = localT(`${pageName}.title`) || pageName;
        safeText('page-title', localT(`${pageName}.title`) || pageName);

        // Ejecutar función de inicialización específica de la página
        if (typeof pageInit === 'function') {
            await pageInit(apt, translations);
        }

        // Configurar navegación inferior
        setupBottomNavigation(window.appState.apartmentId, window.appState.lang);

    } catch (err) {
        console.error(`Error inicializando ${pageName}:`, err);
        document.body.innerHTML = `
            <div class="p-8 text-center bg-white dark:bg-gray-900 min-h-screen flex flex-col items-center justify-center">
                <h1 class="text-3xl font-bold text-red-600 mb-4">Error al cargar la página</h1>
                <p class="text-gray-600 dark:text-gray-300 mb-6 max-w-md">
                    Ha ocurrido un error al cargar los datos. Por favor, inténtelo de nuevo más tarde.
                </p>
                <a href="${window.ROOT_PATH}index.html?apartment=${encodeURIComponent(window.appState.apartmentId || 'sol-101')}&lang=${encodeURIComponent(window.appState.lang || 'es')}"
                   class="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700">
                    Volver al inicio
                </a>
            </div>`;
    }
}

/* =====================================================
   EJEMPLO DE USO PARA LA PÁGINA DE CONTACTO
===================================================== */
async function initializeContact() {
    await initializePage('contact', async (apt, translations) => {
        // Configurar información de ubicación
        safeText('apartment-id', apt.emergency?.apartmentId || 'N/A');
        safeText('address-line1', apt.address);
        safeText('address-line2', `${localT('contact.floor')} ${apt.address.split(',')[1] || ''}, ${apt.address.split(',')[0]}`);

        // Configurar información del anfitrión
        const host = apt.emergency?.host || apt.host;
        if (host) {
            safeText('host-name', host.name);
            safeText('host-role', localT('contact.host_role') || host.role || 'Anfitrión');
            
            // Configurar foto del anfitrión
            const hostPhoto = safeGet('host-photo');
            if (hostPhoto && host.photo) {
                hostPhoto.style.backgroundImage = `url('${host.photo}')`;
            }
            
            // Configurar estado del anfitrión
            const hostStatus = safeGet('host-status');
            if (hostStatus && host.online !== undefined) {
                if (host.online) {
                    hostStatus.innerHTML = `
                        <div class="flex items-center gap-2">
                            <div class="size-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span class="text-xs font-bold text-green-700 dark:text-green-400">${localT('contact.online')}</span>
                        </div>
                    `;
                } else {
                    hostStatus.innerHTML = `
                        <div class="flex items-center gap-2">
                            <div class="size-2 rounded-full bg-gray-500"></div>
                            <span class="text-xs font-bold text-gray-700 dark:text-gray-400">${localT('contact.offline')}</span>
                        </div>
                    `;
                }
            }
            
            // Configurar disponibilidad
            const availability = host.availability;
            if (availability) {
                safeText('host-availability-general', `${localT('contact.available_general')} ${availability.general || '09:00 - 22:00'} ${localT('contact.for_general_inquiries')}.`);
            }
            
            // Configurar botones de contacto
            const callBtn = safeGet('btn-call-host');
            if (callBtn && host.phone) {
                callBtn.href = `tel:${host.phone}`;
            }
            
            const whatsappBtn = safeGet('btn-whatsapp-host');
            if (whatsappBtn && host.whatsapp) {
                whatsappBtn.href = `https://wa.me/${host.whatsapp.replace(/[^0-9]/g, '')}`;
            }
        }

        // Configurar servicios de emergencia
        const servicesContainer = safeGet('services-container');
        if (servicesContainer && apt.emergency?.services) {
            servicesContainer.innerHTML = '';
            
            apt.emergency.services.forEach(service => {
                const colorMap = {
                    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
                    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
                    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
                    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                };
                
                const colorClass = colorMap[service.color] || 'bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400';
                
                const serviceCard = document.createElement('div');
                serviceCard.className = 'flex items-center justify-between p-4 bg-card-light dark:bg-card-dark rounded-xl shadow-sm border border-gray-100 dark:border-gray-800';
                serviceCard.innerHTML = `
                    <div class="flex items-center gap-4">
                        <div class="flex items-center justify-center size-10 rounded-full ${colorClass}">
                            <span class="material-symbols-outlined">${service.icon}</span>
                        </div>
                        <div>
                            <p class="text-text-main-light dark:text-text-main-dark font-bold text-base">${service.name}</p>
                            <p class="text-text-muted-light dark:text-text-muted-dark text-xs">${service.localName}</p>
                        </div>
                    </div>
                    <a class="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-bold text-text-main-light dark:text-text-main-dark transition-colors" href="tel:${service.phone}">
                        ${service.phone}
                    </a>
                `;
                
                servicesContainer.appendChild(serviceCard);
            });
        }

        // Configurar botón de copiar dirección
        const copyBtn = safeGet('btn-copy-address');
        if (copyBtn) {
            copyBtn.onclick = () => {
                const address = `${apt.address}`;
                copyToClipboard(address, localT('contact.address_copied'));
            };
        }
    });
}

// Inicializar la página cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', initializeContact);