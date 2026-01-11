/* =====================================================
   HELPERS SEGURAS
===================================================== */
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

/* =====================================================
   MENSAJES FLOTANTES
===================================================== */
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity duration-300';
    notification.innerHTML = message + ' <span onclick="this.parentNode.remove()" class="ml-2 cursor-pointer font-bold">✖</span>';
    document.body.appendChild(notification);
    setTimeout(() => { notification.style.opacity = '0'; }, 2000);
    setTimeout(() => { if (document.body.contains(notification)) document.body.removeChild(notification); }, 2300);
}

/* =====================================================
   FUNCIÓN DE TRADUCCIÓN
===================================================== */
function t(key) {
    if (!window.appState || !window.appState.translations) {
        console.warn('Traducciones no cargadas');
        return key;
    }
    
    const keys = key.split('.');
    let value = window.appState.translations;
    
    for (const k of keys) {
        value = value[k];
        if (value === undefined) {
            console.warn(`Clave de traducción no encontrada: ${key}`);
            return key;
        }
    }
    
    return value;
}

/* =====================================================
   INICIALIZACIÓN
===================================================== */
async function initializeContact() {
    const params = new URLSearchParams(window.location.search);
    const apartmentId = params.get('apartment') || 'sol-101';
    const lang = params.get('lang') || 'es';

    try {
        const [apartmentsRes, translationsRes] = await Promise.all([
            fetch(`${window.ROOT_PATH}data/apartments.json`),
            fetch(`${window.ROOT_PATH}data/${lang}.json`)
        ]);

        if (!apartmentsRes.ok || !translationsRes.ok) throw new Error('Error cargando datos');

        const apartmentsData = await apartmentsRes.json();
        const translations = await translationsRes.json();
        
        // Guardar datos en el estado global para la función t()
        window.appState = {
            apartmentId,
            apartmentData: apartmentsData,
            translations,
            lang
        };

        const apt = apartmentsData[apartmentId];
        if (!apt) throw new Error('Apartamento no encontrado');

        // Configurar título de página
        document.title = t('contact.title') || 'Contacto y Emergencias';
        safeText('page-title', t('contact.title') || 'Contacto y Emergencias');

        // Configurar información de ubicación
        safeText('apartment-id', apt.emergency?.apartmentId || 'N/A');
        safeText('address-line1', apt.address);
        safeText('address-line2', `${t('contact.floor')} ${apt.address.split(',')[1] || ''}, ${apt.address.split(',')[0]}`);

        // Configurar información del anfitrión
        const host = apt.emergency?.host || apt.host;
        if (host) {
            safeText('host-name', host.name);
            safeText('host-role', host.role || 'Anfitrión');
            
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
                        <div class="size-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span class="text-xs font-bold text-green-700 dark:text-green-400">${t('contact.online') || 'En línea'}</span>
                    `;
                } else {
                    hostStatus.innerHTML = `
                        <div class="size-2 rounded-full bg-gray-500"></div>
                        <span class="text-xs font-bold text-gray-700 dark:text-gray-400">${t('contact.offline') || 'Desconectado'}</span>
                    `;
                }
            }
            
            // Configurar disponibilidad
            const availability = host.availability;
            if (availability) {
                safeText('host-availability-general', `${t('contact.available_general')} ${availability.general || '09:00 - 22:00'} ${t('contact.for_general_inquiries')}.`);
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
                navigator.clipboard.writeText(address);
                showNotification(t('contact.address_copied') || 'Dirección copiada al portapapeles');
            };
        }

        // Configurar botón de contacto del centro
        const contactCenterBtn = safeGet('btn-contact-center');
        if (contactCenterBtn && host?.phone) {
            contactCenterBtn.onclick = () => {
                window.open(`tel:${host.phone}`, '_self');
            };
        }

        // Configurar navegación inferior
        setupBottomNavigation(apartmentId, lang);

    } catch (err) {
        console.error('Error inicializando contact:', err);
        document.body.innerHTML = `<div class="p-4 text-center"><h1 class="text-red-600 font-bold">Error al cargar la información</h1></div>`;
    }
}

document.addEventListener('DOMContentLoaded', initializeContact);