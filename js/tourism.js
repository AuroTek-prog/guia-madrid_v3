function renderPage() {
    // Esta función necesita datos adicionales de madrid.json
    fetch(`${window.ROOT_PATH}data/madrid.json`)
        .then(response => response.json())
        .then(madridData => {
            // Actualizar textos estáticos
            document.title = t('tourism.title');
            document.getElementById('page-title').textContent = t('tourism.title');
            document.getElementById('hero-category').textContent = t('tourism.hero_slogan');
            document.getElementById('hero-headline').textContent = 'Madrid Te Espera';
            document.getElementById('hero-description').textContent = t('tourism.hero_description');
            document.getElementById('experiences-headline').textContent = t('tourism.experiences_title');
            document.getElementById('experiences-subtitle').textContent = t('tourism.experiences_subtitle');
            document.getElementById('fab-text').textContent = t('tourism.map_view');
            
            // Usamos window.ROOT_PATH para construir la ruta completa y correcta
            document.querySelector('#hero-image .bg-cover').style.backgroundImage = `url('${window.ROOT_PATH}${madridData.hero.image}')`;
            
            // Renderizar el feed de experiencias
            const feedContainer = document.getElementById('experiences-feed');
            feedContainer.innerHTML = ''; // Limpiar contenido previo

            madridData.experiences.forEach((exp, index) => {
                const placeName = t(`tourism.places.${exp.nameKey}`);

                const card = document.createElement('div');
                card.className = 'experience-card';
                card.innerHTML = `
                    <div class="flex flex-col items-stretch justify-start rounded-2xl shadow-xl bg-white dark:bg-surface-dark overflow-hidden transition-transform duration-300 hover:shadow-2xl hover:-translate-y-1 ring-1 ring-black/5 dark:ring-white/5">
                        <div class="relative w-full aspect-[4/5] sm:aspect-video bg-center bg-no-repeat bg-cover" style="background-image: url('${window.ROOT_PATH}${exp.image}');">
                            <div class="absolute top-4 left-4">
                                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md text-white border border-white/20 shadow-sm uppercase tracking-wider">
                                    ${t(`tourism.categories.${exp.categoryKey}`)}
                                </span>
                            </div>
                        </div>
                        <div class="flex w-full grow flex-col items-start justify-center gap-3 p-6">
                            <div class="flex flex-col gap-2 w-full">
                                <div class="flex justify-between items-start w-full">
                                    <p class="place-title text-gray-900 dark:text-white text-2xl font-bold leading-tight tracking-tight">${placeName}</p>
                                    <span class="material-symbols-outlined text-gray-400 dark:text-gray-500" style="font-size: 20px;">favorite_border</span>
                                </div>
                                <p class="text-gray-600 dark:text-gray-400 text-base font-light leading-relaxed line-clamp-2">
                                    ${t(`tourism.places.${exp.descriptionKey}`)}
                                </p>
                            </div>
                            <div class="w-full pt-2">
                                <button id="details-btn-${index}" class="details-btn flex w-full items-center justify-center rounded-lg h-12 bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/10 text-sm font-semibold tracking-wide transition-colors gap-2">
                                    <span>${t('tourism.explore_details')}</span>
                                    <span class="material-symbols-outlined" style="font-size: 18px;">arrow_forward</span>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                feedContainer.appendChild(card);

                // Adjuntar el evento directamente al botón
                const detailsButton = document.getElementById(`details-btn-${index}`);
                if (detailsButton) {
                    detailsButton.addEventListener('click', function() {
                        console.log('¡CLIC EN BOTÓN DETECTADO!');
                        
                        // Obtenemos el nombre del lugar desde el texto del título en la misma tarjeta
                        const placeTitle = card.querySelector('.place-title').textContent.trim();
                        
                        console.log(`Buscando: ${placeTitle}`);
                        
                        const searchQuery = encodeURIComponent(`${placeTitle} Madrid`);
                        const searchUrl = `https://www.google.com/search?q=${searchQuery}`;
                        
                        console.log(`URL: ${searchUrl}`);
                        
                        // Abrimos en una nueva pestaña
                        window.open(searchUrl, '_blank');
                    });
                }
            });
            
            // Configurar el modal de selección de mapa
            setupMapModal();
            
            // Configurar navegación inferior
            setupBottomNavigation(window.appState.apartmentId, window.appState.lang);
        })
        .catch(error => console.error('Error loading Madrid data:', error));
}

function setupMapModal() {
    const mapButton = document.getElementById('map-button');
    const mapModal = document.getElementById('map-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const mapOptions = document.querySelectorAll('.map-option');
    
    // Mostrar el modal al hacer clic en el botón del mapa
    mapButton.addEventListener('click', function() {
        mapModal.style.display = 'flex';
        setTimeout(() => {
            mapModal.classList.add('show');
        }, 10);
    });
    
    // Cerrar modal al hacer clic en el botón de cerrar
    closeModalBtn.addEventListener('click', function() {
        mapModal.classList.remove('show');
        setTimeout(() => {
            mapModal.style.display = 'none';
        }, 300);
    });
    
    // Cerrar modal al hacer clic fuera del contenido
    mapModal.addEventListener('click', function(e) {
        if (e.target === mapModal) {
            mapModal.classList.remove('show');
            setTimeout(() => {
                mapModal.style.display = 'none';
            }, 300);
        }
    });
    
    // Manejar la selección de mapa
    mapOptions.forEach(option => {
        option.addEventListener('click', function(e) {
            e.stopPropagation();
            const mapType = this.getAttribute('data-map');
            openMap(mapType);
            mapModal.classList.remove('show');
            setTimeout(() => {
                mapModal.style.display = 'none';
            }, 300);
        });
    });
}

function openMap(mapType) {
    const lat = 40.4168;
    const lng = -3.7038;
    const query = encodeURIComponent('Madrid, España');
    const label = encodeURIComponent('Puntos de interés en Madrid');
    
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    let mapUrl;

    if (isIOS) {
        switch (mapType) {
            case 'google':
                mapUrl = `comgooglemaps://?center=${lat},${lng}&q=${query}&zoom=12`;
                window.location.href = mapUrl;
                setTimeout(() => {
                    window.location.href = `https://www.google.com/maps/search/?api=1&query=${query}`;
                }, 500);
                return;
            case 'apple':
                mapUrl = `maps://?q=${label}&ll=${lat},${lng}`;
                break;
            case 'waze':
                mapUrl = `waze://?ll=${lat},${lng}&navigate=yes`;
                window.location.href = mapUrl;
                setTimeout(() => {
                    window.location.href = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
                }, 500);
                return;
            default:
                mapUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
        }
    } else {
        switch (mapType) {
            case 'google':
                mapUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
                break;
            case 'apple':
                mapUrl = `http://maps.apple.com/?q=${query}&ll=${lat},${lng}`;
                break;
            case 'waze':
                mapUrl = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
                break;
            default:
                mapUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
        }
    }
    
    window.location.href = mapUrl;
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

// Inicializar la página cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', renderPage);