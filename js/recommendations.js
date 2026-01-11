// js/recommendations.js - FINAL ÚNICO BLOQUE: Premium destacado + básicos + filtros + fallback
let currentFilter = 'all';
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
    renderFilterChips(recs.categories || defaultCategories);
    await renderFeaturedAndPremium();
    await renderFilteredContent();
    setupBottomNavigation(window.appState.apartmentId, window.appState.lang);
}

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

async function renderFeaturedAndPremium() {
    const container = document.getElementById('featured-item');
    if (!container) return;
    container.innerHTML = '';
    const apt = window.appState.apartmentData?.[window.appState.apartmentId];
    const recs = apt.recommendations || {};

    if (recs.featured) {
        const f = recs.featured;
        safeText('featured-title', t('recommendations.hosts_pick'));
        container.innerHTML = `
            <div class="absolute top-3 left-3 z-10 bg-white/90 dark:bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                <span class="material-symbols-outlined text-primary text-[14px]">directions_walk</span>
                <span class="text-xs font-bold text-gray-900 dark:text-white">${f.distance || 'N/A'}</span>
            </div>
            <div class="w-full bg-center bg-no-repeat aspect-[16/9] bg-cover" style="background-image:url('${f.image || "https://via.placeholder.com/400x200?text=Sin+imagen"}')">
                <div class="w-full h-full bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
            </div>
            <div class="flex w-full flex-col items-stretch justify-center gap-1 p-4">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">${f.name || 'Recomendación destacada'}</p>
                        <p class="text-primary text-sm font-medium mt-1">${t(`recommendations.types.${f.typeKey || 'unknown'}`)} • ${f.priceRange || 'N/A'}</p>
                    </div>
                    <div class="bg-primary/10 dark:bg-primary/20 p-2 rounded-full text-primary hover:bg-primary hover:text-white transition-colors">
                        <span class="material-symbols-outlined text-[20px] block">near_me</span>
                    </div>
                </div>
                <p class="text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal line-clamp-2 mt-1">${t(`recommendations.descriptions.${f.descriptionKey || 'no_desc'}`)}</p>
            </div>
        `;
        return;
    }

    try {
        const ts = new Date().getTime();
        const res = await fetch(`${window.ROOT_PATH}data/partners.json?t=${ts}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('No se pudo cargar partners.json');
        const all = await res.json();
        const premium = all.filter(p => p.global === true && p.active !== false && (currentFilter === 'all' || p.categoryKey === currentFilter));
        if (premium.length === 0) {
            safeText('featured-title', 'Recomendación destacada');
            container.innerHTML = '<p class="text-center text-gray-500 py-4">No hay recomendación destacada disponible</p>';
            return;
        }
        safeText('featured-title', 'Recomendaciones Premium Destacadas');
        if (premium.length === 1) {
            const p = premium[0];
            container.innerHTML = `
                <div class="absolute top-3 left-3 z-10 bg-white/90 dark:bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                    <span class="material-symbols-outlined text-primary text-[14px]">directions_walk</span>
                    <span class="text-xs font-bold text-gray-900 dark:text-white">${p.distance || 'N/A'}</span>
                </div>
                <div class="w-full bg-center bg-no-repeat aspect-[16/9] bg-cover" style="background-image:url('${p.image || "https://via.placeholder.com/400x200?text=Sin+imagen"}')">
                    <div class="w-full h-full bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
                </div>
                <div class="flex w-full flex-col items-stretch justify-center gap-1 p-4">
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">${p.name}</p>
                            <p class="text-primary text-sm font-medium mt-1">${t(`recommendations.types.${p.categoryKey || 'unknown'}`)} • ${p.priceRange || 'N/A'}</p>
                        </div>
                        <div class="bg-primary/10 dark:bg-primary/20 p-2 rounded-full text-primary hover:bg-primary hover:text-white transition-colors">
                            <span class="material-symbols-outlined text-[20px] block">near_me</span>
                        </div>
                    </div>
                    <p class="text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal line-clamp-2 mt-1">${p.description || ''}</p>
                    <p class="text-primary font-medium mt-2">${p.offer || 'Oferta disponible'}</p>
                </div>
            `;
        } else {
            const carousel = document.createElement('div');
            carousel.className = 'flex gap-4 overflow-x-auto hide-scrollbar snap-x pb-4';
            premium.forEach(p => {
                const card = document.createElement('div');
                card.className = 'snap-start w-64 shrink-0 flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow border-2 border-primary/30';
                card.innerHTML = `
                    <div class="h-32 bg-cover bg-center" style="background-image:url('${p.image || "https://via.placeholder.com/300x150?text=Sin+imagen"}')"></div>
                    <div class="p-4">
                        <span class="inline-block bg-primary text-white text-xs font-bold px-2 py-1 rounded mb-2">Premium</span>
                        <h4 class="text-base font-semibold mb-1">${p.name}</h4>
                        <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">${p.description || ''}</p>
                        <p class="text-primary font-medium mt-2">${p.offer || 'Oferta disponible'}</p>
                    </div>
                `;
                carousel.appendChild(card);
            });
            container.appendChild(carousel);
        }
    } catch (e) {
        console.error('Error cargando premium:', e);
        safeText('featured-title', 'Recomendación destacada');
        container.innerHTML = '<p class="text-center text-gray-500 py-4">No hay recomendación destacada disponible</p>';
    }
}

async function renderFilteredContent() {
    const apt = window.appState.apartmentData?.[window.appState.apartmentId];
    if (!apt) return;
    const recs = apt.recommendations || {};
    const sectionsContainer = document.getElementById('sections-container');
    if (!sectionsContainer) return;
    sectionsContainer.innerHTML = '';
    let hasContent = false;

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
            sectionDiv.innerHTML += sectionHTML;
            sectionDiv.appendChild(itemsContainer);
            sectionsContainer.appendChild(sectionDiv);
        });
    }

    try {
        const zone = await getApartmentZone(apt);
        const ts = new Date().getTime();
        const res = await fetch(`${window.ROOT_PATH}data/partners.json?t=${ts}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('No se pudo cargar partners.json');
        const all = await res.json();
        const basic = all.filter(p => !p.global && p.active !== false && zone && p.zones?.includes(zone.id) && (currentFilter === 'all' || p.categoryKey === currentFilter));
        if (basic.length > 0) {
            hasContent = true;
            const basicSection = document.createElement('div');
            basicSection.className = 'pt-8';
            basicSection.innerHTML = `<h3 class="text-xl font-bold mb-6">Ofertas locales en ${zone?.name || 'tu zona'}</h3>`;
            const basicContainer = document.createElement('div');
            basicContainer.className = 'grid gap-6 md:grid-cols-2';
            basic.forEach(p => {
                const card = document.createElement('div');
                card.className = 'bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow';
                card.innerHTML = `
                    <div class="h-40 bg-cover bg-center" style="background-image:url('${p.image || "https://via.placeholder.com/400x200?text=Sin+imagen"}')"></div>
                    <div class="p-5">
                        <h4 class="text-lg font-semibold mb-2">${p.name}</h4>
                        <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">${p.description || ''}</p>
                        <p class="text-primary font-medium">${p.offer || 'Oferta disponible'}</p>
                    </div>
                `;
                basicContainer.appendChild(card);
            });
            basicSection.appendChild(basicContainer);
            sectionsContainer.appendChild(basicSection);
        }
    } catch (err) {
        console.error('Error cargando partners o zonas:', err);
    }

    if (!hasContent) {
        const noContent = document.createElement('div');
        noContent.className = 'pt-8 text-center text-gray-500 dark:text-gray-400';
        noContent.innerHTML = `
            <span class="material-symbols-outlined text-5xl mb-4 text-gray-300 dark:text-gray-600">info</span>
            <p class="text-lg font-medium">No hay recomendaciones disponibles en este momento</p>
            <p class="text-sm mt-2">Próximamente más contenido personalizado.</p>
        `;
        sectionsContainer.appendChild(noContent);
    }
    setupBottomNavigation(window.appState.apartmentId, window.appState.lang);
}
