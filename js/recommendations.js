// js/recommendations.js - Versión FINAL: Premium en "Recomendación destacada" + Básicos en locales + Filtro siempre visible
let currentFilter = 'all'; // Filtro activo por defecto

// Categorías por defecto (siempre visibles)
const defaultCategories = [
    { icon: "grid_view", key: "all" },
    { icon: "restaurant", key: "eat" },
    { icon: "local_cafe", key: "drink" },
    { icon: "shopping_bag", key: "shop" },
    { icon: "directions_bus", key: "transit" },
    { icon: "photo_camera", key: "experience" }
];

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

    // Renderizar sección destacada (estático + premium partners)
    await renderFeaturedAndPremium();

    // Renderizar contenido filtrado (estático + básicos)
    await renderFilteredContent();

    // Configurar navegación inferior
    setupBottomNavigation(window.appState.apartmentId, window.appState.lang);
}

// Renderiza chips de filtro (siempre visible y con color azul al seleccionar)
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

// Renderiza Recomendación destacada (estático) + Premium partners (global:true)
async function renderFeaturedAndPremium() {
    const container = document.getElementById('featured-item');
    if (!container) return;
    container.innerHTML = '';

    const apt = window.appState.apartmentData?.[window.appState.apartmentId];
    const recs = apt.recommendations || {};

    // Prioridad 1: Featured estático
    if (recs.featured) {
        const featured = recs.featured;
        safeText('featured-title', t('recommendations.hosts_pick'));
        container.innerHTML = `
            <div class="absolute top-3 left-3 z-10 bg-white/90 dark:bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                <span class="material-symbols-outlined text-primary text-[14px]">directions_walk</span>
                <span class="text-xs font-bold text-gray-900 dark:text-white">${featured.distance || 'N/A'}</span>
            </div>
            <div class="w-full bg-center bg-no-repeat aspect-[16/9] bg-cover" style="background-image: url('${featured.image || "https://via.placeholder.com/400x200?text=Sin+imagen"}');">
                <div class="w-full h-full bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
            </div>
            <div class="flex w-full flex-col items-stretch justify-center gap-1 p-4">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">${featured.name || 'Recomendación destacada'}</p>
                        <p class="text-primary text-sm font-medium mt-1">${t(`recommendations.types.${featured.typeKey || 'unknown'}`)} • ${featured.priceRange || 'N/A'}</p>
                    </div>
                    <div class="bg-primary/10 dark:bg-primary/20 p-2 rounded-full text-primary hover:bg-primary hover:text-white transition-colors">
                        <span class="material-symbols-outlined text-[20px] block">near_me</span>
                    </div>
                </div>
                <p class="text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal line-clamp-2 mt-1">${t(`recommendations.descriptions.${featured.descriptionKey || 'no_desc'}`)}</p>
            </div>`;
        return; // Prioridad: si hay featured estático, mostramos solo eso
    }

    // Prioridad 2: Premium partners
    try {
        const timestamp = new Date().getTime();
        const partnersRes = await fetch(`${window.ROOT_PATH}data/partners.json?t=${timestamp}`, { cache: 'no-store' });
        if (!partnersRes.ok) throw new Error('No se pudo cargar partners.json');
        const allPartners = await partnersRes.json();

        const premiumPartners = allPartners.filter(p => p.global === true && p.active !== false && (currentFilter === 'all' || p.categoryKey === currentFilter));

        if (premiumPartners.length > 0) {
            safeText('featured-title', 'Recomendación Premium Destacada');
            const premium = premiumPartners[0]; // Solo el primero
            container.innerHTML = `
                <div class="absolute top-3 left-3 z-10 bg-white/90 dark:bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                    <span class="material-symbols-outlined text-primary text-[14px]">directions_walk</span>
                    <span class="text-xs font-bold text-gray-900 dark:text-white">${premium.distanceKey || 'N/A'}</span>
                </div>
                <div class="w-full bg-center bg-no-repeat aspect-[16/9] bg-cover" style="background-image: url('${premium.image || "https://via.placeholder.com/400x200?text=Sin+imagen"}');">
                    <div class="w-full h-full bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
                </div>
                <div class="flex w-full flex-col items-stretch justify-center gap-1 p-4">
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">${premium.name}</p>
                            <p class="text-primary text-sm font-medium mt-1">${t(`recommendations.types.${premium.categoryKey || 'unknown'}`)} • ${premium.priceRange || 'N/A'}</p>
                        </div>
                        <div class="bg-primary/10 dark:bg-primary/20 p-2 rounded-full text-primary hover:bg-primary hover:text-white transition-colors">
                            <span class="material-symbols-outlined text-[20px] block">near_me</span>
                        </div>
                    </div>
                    <p class="text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal line-clamp-2 mt-1">${premium.description || ''}</p>
                    <p class="text-primary font-medium mt-2">${premium.offer || 'Oferta disponible'}</p>
                </div>`;
        } else {
            safeText('featured-title', 'Recomendación destacada');
            container.innerHTML = '<p class="text-center text-gray-500 py-4">No hay recomendación destacada disponible</p>';
        }
    } catch (err) {
        console.error('Error cargando premium:', err);
        safeText('featured-title', 'Recomendación destacada');
        container.innerHTML = '<p class="text-center text-gray-500 py-4">No hay recomendación destacada disponible</p>';
    }
}

// Renderiza contenido filtrado (estático + básicos)
async function renderFilteredContent() {
    const apt = window.appState.apartmentData?.[window.appState.apartmentId];
    if (!apt) return;
    const recs = apt.recommendations || {};
    const sectionsContainer = document.getElementById('sections-container');
    if (!sectionsContainer) return;

    sectionsContainer.innerHTML = '';
    let hasContent = false;

    // Recomendaciones estáticas filtradas
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
                // Mantener tu lógica de renderizado original aquí
            });

            sectionDiv.innerHTML += sectionHTML;
            sectionDiv.appendChild(itemsContainer);
            sectionsContainer.appendChild(sectionDiv);
        });
    }

    // Básicos (global:false) filtrados por zona y categoría
    try {
        const zone = await getApartmentZone(apt);

        const timestamp = new Date().getTime();
        const partnersRes = await fetch(`${window.ROOT_PATH}data/partners.json?t=${timestamp}`, { cache: 'no-store' });
        if (!partnersRes.ok) throw new Error('No se pudo cargar partners.json');
        const allPartners = await partnersRes.json();

        const basicPartners = allPartners.filter(p => {
            if (p.global === true) return false;
            if (!p.active) return false;
            const inZone = zone && p.zones?.includes(zone.id);
            const inCategory = currentFilter === 'all' || p.categoryKey === currentFilter;
            return inZone && inCategory;
        });

        if (basicPartners.length > 0) {
            hasContent = true;
            const basicSection = document.createElement('div');
            basicSection.className = 'pt-8';
            basicSection.innerHTML = `<h3 class="text-xl font-bold mb-6">Ofertas locales en ${zone?.name || 'tu zona'}</h3>`;

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
