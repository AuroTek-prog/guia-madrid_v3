// js/recommendations.js - Versión MEJORADA: Detección de zonas robusta + Premium en destacado + Básicos visibles

let currentFilter = 'all'; // Filtro activo por defecto

// Categorías por defecto (siempre visibles, sin "experience")
const defaultCategories = [
    { icon: "grid_view", key: "all" },
    { icon: "restaurant", key: "eat" },
    { icon: "local_cafe", key: "drink" },
    { icon: "shopping_bag", key: "shop" },
    { icon: "directions_bus", key: "transit" }
];

// Función mejorada para detectar la zona del apartamento
async function getApartmentZone(apartment) {
    if (!apartment || !apartment.coordinates) {
        console.warn('El apartamento no tiene coordenadas definidas');
        return null;
    }

    try {
        // Cargar zonas si no están en caché
        if (!window.zonesData) {
            const timestamp = new Date().getTime();
            const zonesRes = await fetch(`${window.ROOT_PATH}data/zones.json?t=${timestamp}`, { cache: 'no-store' });
            if (!zonesRes.ok) throw new Error('No se pudo cargar zones.json');
            window.zonesData = await zonesRes.json();
        }

        const point = turf.point([apartment.coordinates.lng, apartment.coordinates.lat]);
        
        // Buscar en qué zona está el punto
        for (const zone of window.zonesData) {
            const polygon = turf.polygon([zone.polygon]);
            if (turf.booleanPointInPolygon(point, polygon)) {
                console.log(`Apartamento detectado en zona: ${zone.name}`);
                return zone;
            }
        }
        
        // Si no está en ninguna zona, intentar asignar la más cercana
        let closestZone = null;
        let minDistance = Infinity;
        
        for (const zone of window.zonesData) {
            const center = turf.center(turf.polygon([zone.polygon]));
            const distance = turf.distance(point, center, { units: 'kilometers' });
            
            if (distance < minDistance) {
                minDistance = distance;
                closestZone = zone;
            }
        }
        
        console.log(`Apartamento fuera de zona definida, asignando la más cercana: ${closestZone.name} (${minDistance.toFixed(2)} km)`);
        return closestZone;
    } catch (error) {
        console.error('Error al detectar la zona:', error);
        return null;
    }
}

async function renderPage() {
    const apt = window.appState.apartmentData?.[window.appState.apartmentId];
    if (!apt) {
        console.error('No hay datos de apartamento');
        showFallbackMessage('No se pudo cargar los datos del apartamento.');
        return;
    }

    const recs = apt.recommendations || {};

    document.title = t('navigation.recommendations_title');
    safeText('page-title', t('navigation.recommendations_title'));
    safeText('headline', t('recommendations.title'));
    safeText('subtitle', t('recommendations.subtitle') || 'Lugares seleccionados a poca distancia de tu apartamento en Madrid');

    // Renderizar chips de filtro SIEMPRE
    renderFilterChips(recs.categories || defaultCategories);

    // Renderizar contenido filtrado (estático + premium + básicos)
    await renderFilteredContent();

    // Configurar navegación inferior
    setupBottomNavigation(window.appState.apartmentId, window.appState.lang);
}

// Renderiza chips de filtro (siempre visible y con azul al seleccionar)
function renderFilterChips(categories) {
    const container = document.getElementById('filter-chips');
    if (!container) return;
    container.innerHTML = '';
    categories.forEach(cat => {
        const chip = document.createElement('div');
        chip.dataset.key = cat.key;
        chip.className = `snap-start flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-5 border border-transparent cursor-pointer transition-all active:scale-95 ${
            cat.key === currentFilter 
                ? 'bg-primary text-white font-semibold shadow-md' 
                : 'bg-gray-100 dark:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-700 text-gray-900 dark:text-gray-100'
        }`;
        chip.innerHTML = `
            <span class="material-symbols-outlined text-[18px]">${cat.icon}</span>
            <p class="text-sm leading-normal">${t(`recommendations.filters.${cat.key}`) || cat.key}</p>
        `;
        chip.onclick = () => {
            currentFilter = cat.key;
            // Limpiar TODOS los chips y poner azul solo al nuevo
            document.querySelectorAll('#filter-chips > div').forEach(c => {
                c.classList.remove('bg-primary', 'text-white', 'font-semibold', 'shadow-md');
                c.classList.add('bg-gray-100', 'dark:bg-gray-800', 'text-gray-900', 'dark:text-gray-100', 'hover:border-gray-200', 'dark:hover:border-gray-700');
            });
            chip.classList.add('bg-primary', 'text-white', 'font-semibold', 'shadow-md');
            chip.classList.remove('bg-gray-100', 'dark:bg-gray-800', 'text-gray-900', 'dark:text-gray-100', 'hover:border-gray-200', 'dark:hover:border-gray-700');
            renderFilteredContent();
        };
        container.appendChild(chip);
    });
}

// Renderiza contenido filtrado (estático + premium + básicos)
async function renderFilteredContent() {
    const apt = window.appState.apartmentData?.[window.appState.apartmentId];
    if (!apt) return;
    const recs = apt.recommendations || {};
    const sectionsContainer = document.getElementById('sections-container');
    if (!sectionsContainer) return;

    sectionsContainer.innerHTML = ''; // Limpiar
    let hasContent = false;

    // 1. Recomendaciones estáticas filtradas
    if (recs.sections) {
        recs.sections.forEach(section => {
            const filteredItems = section.items.filter(item => currentFilter === 'all' || item.typeKey === currentFilter);
            if (filteredItems.length === 0) return;
            hasContent = true;

            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'pt-6';
            let sectionHTML = `<h3 class="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] mb-4">${t(`recommendations.${section.titleKey}`)}</h3>`;
            const itemsContainer = document.createElement('div');
            itemsContainer.className = section.titleKey === 'essentials_title' ? 'flex gap-4 overflow-x-auto hide-scrollbar snap-x pb-4' : 'flex flex-col gap-4';

            filteredItems.forEach(item => {
                // Tu lógica original de renderizado de items (transport, essentials, etc.)
                // ... (mantén tu código aquí sin cambios)
            });

            sectionDiv.innerHTML += sectionHTML;
            sectionDiv.appendChild(itemsContainer);
            sectionsContainer.appendChild(sectionDiv);
        });
    }

    // 2. Partners dinámicos
    try {
        const zone = await getApartmentZone(apt);
        console.log('Apartamento en zona:', zone?.name || 'No detectada');

        const timestamp = new Date().getTime();
        const partnersRes = await fetch(`${window.ROOT_PATH}data/partners.json?t=${timestamp}`, { cache: 'no-store' });
        if (!partnersRes.ok) throw new Error('No se pudo cargar partners.json');
        const allPartners = await partnersRes.json();

        // PREMIUM: global → siempre mostrar (solo filtrar por categoría)
        const premiumPartners = allPartners.filter(p => p.global === true && p.active !== false && (currentFilter === 'all' || p.categoryKey === currentFilter));

        // BÁSICO: mostrar todos si no hay zona detectada, o solo los de la zona si hay
        const basicPartners = zone 
            ? allPartners.filter(p => !p.global && p.zones?.includes(zone.id) && p.active !== false && (currentFilter === 'all' || p.categoryKey === currentFilter))
            : allPartners.filter(p => !p.global && p.active !== false && (currentFilter === 'all' || p.categoryKey === currentFilter));

        // Mostrar PREMIUM en sección destacada existente
        if (premiumPartners.length > 0) {
            hasContent = true;
            const featuredItem = document.getElementById('featured-item');
            if (featuredItem) {
                // Mostrar solo el primer partner premium en la sección destacada
                const partner = premiumPartners[0];
                featuredItem.innerHTML = `
                    <div class="h-48 bg-cover bg-center" style="background-image: url('${partner.image || "https://via.placeholder.com/600x300?text=Sin+imagen"}')"></div>
                    <div class="p-5">
                        <span class="inline-block bg-primary text-white text-xs font-bold px-2 py-1 rounded mb-2">Premium</span>
                        <h4 class="text-xl font-bold mb-2">${partner.name}</h4>
                        <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">${partner.description || ''}</p>
                        <p class="text-primary font-medium">${partner.offer || 'Oferta disponible'}</p>
                        <p class="text-sm text-gray-500 dark:text-gray-500 mt-2">${partner.distanceKey || ''}</p>
                    </div>
                `;
                
                // Si hay más partners premium, mostrar carrusel debajo
                if (premiumPartners.length > 1) {
                    const premiumSection = document.createElement('div');
                    premiumSection.className = 'pt-6';
                    premiumSection.innerHTML = `<h3 class="text-lg font-bold mb-4">Más recomendaciones destacadas</h3>`;
                    
                    const premiumContainer = document.createElement('div');
                    premiumContainer.className = 'flex gap-4 overflow-x-auto hide-scrollbar snap-x pb-4';
                    
                    // Mostrar el resto de partners premium (empezando desde el segundo)
                    for (let i = 1; i < premiumPartners.length; i++) {
                        const partner = premiumPartners[i];
                        const card = document.createElement('div');
                        card.className = 'snap-start w-64 shrink-0 flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow border-2 border-primary/30';
                        card.innerHTML = `
                            <div class="h-32 bg-cover bg-center" style="background-image: url('${partner.image || "https://via.placeholder.com/300x150?text=Sin+imagen"}')"></div>
                            <div class="p-4">
                                <span class="inline-block bg-primary text-white text-xs font-bold px-2 py-1 rounded mb-2">Premium</span>
                                <h4 class="text-base font-semibold mb-1">${partner.name}</h4>
                                <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">${partner.description || ''}</p>
                                <p class="text-primary font-medium mt-2">${partner.offer || 'Oferta disponible'}</p>
                            </div>`;
                        premiumContainer.appendChild(card);
                    }
                    
                    premiumSection.appendChild(premiumContainer);
                    sectionsContainer.appendChild(premiumSection);
                }
            }
        }

        // Mostrar básicos en sección locales (debajo)
        if (basicPartners.length > 0) {
            hasContent = true;
            const basicSection = document.createElement('div');
            basicSection.className = 'pt-8';
            basicSection.innerHTML = `<h3 class="text-xl font-bold mb-6">Ofertas locales ${zone ? `en ${zone.name}` : 'cerca de ti'}</h3>`;

            const basicContainer = document.createElement('div');
            basicContainer.className = 'grid gap-6 md:grid-cols-2';

            basicPartners.forEach(partner => {
                const card = document.createElement('div');
                card.className = 'bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow';
                card.innerHTML = `
                    <div class="h-40 bg-cover bg-center" style="background-image: url('${partner.image || "https://via.placeholder.com/400x200?text=Sin+imagen"}')"></div>
                    <div class="p-5">
                        <h4 class="text-lg font-semibold mb-2">${partner.name}</h4>
                        <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">${partner.description || ''}</p>
                        <p class="text-primary font-medium">${partner.offer || 'Oferta disponible'}</p>
                        ${partner.zones ? `<p class="text-xs text-gray-500 dark:text-gray-500 mt-2">Zona: ${partner.zones.join(', ')}</p>` : ''}
                    </div>`;
                basicContainer.appendChild(card);
            });

            basicSection.appendChild(basicContainer);
            sectionsContainer.appendChild(basicSection);
        }
    } catch (err) {
        console.error('Error cargando partners o zonas:', err);
    }

    // Fallback visual si no hay NADA
    if (!hasContent) {
        const noContent = document.createElement('div');
        noContent.className = 'pt-8 text-center text-gray-500 dark:text-gray-400';
        noContent.innerHTML = `
            <span class="material-symbols-outlined text-5xl mb-4 text-gray-300 dark:text-gray-600">info</span>
            <p class="text-lg font-medium">No hay recomendaciones disponibles en este momento</p>
            <p class="text-sm mt-2">Próximamente más contenido personalizado.</p>`;
        sectionsContainer.appendChild(noContent);
    }

    setupBottomNavigation(window.appState.apartmentId, window.appState.lang);
}