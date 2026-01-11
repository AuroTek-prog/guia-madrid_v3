// js/recommendations.js - Versión FINAL con filtro dinámico + partners por zona + fallbacks robustos

let currentFilter = 'all'; // Filtro activo por defecto

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

    // Renderizar chips de filtro
    const filterContainer = document.getElementById('filter-chips');
    if (filterContainer && recs.categories) {
        filterContainer.innerHTML = '';
        recs.categories.forEach(cat => {
            const chip = document.createElement('div');
            chip.className = `snap-start flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-5 border border-transparent cursor-pointer transition-all active:scale-95 ${
                cat.key === currentFilter 
                    ? 'bg-primary text-white font-semibold' 
                    : 'bg-gray-100 dark:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
            }`;
            chip.innerHTML = `
                <span class="material-symbols-outlined text-[18px]">${cat.icon}</span>
                <p class="text-sm leading-normal">${t(`recommendations.filters.${cat.key}`)}</p>
            `;
            chip.onclick = () => {
                currentFilter = cat.key;
                console.log('Filtro cambiado a:', currentFilter);
                renderFilteredContent(); // Re-renderiza todo
            };
            filterContainer.appendChild(chip);
        });
    }

    // Featured con fallback
    const featuredContainer = document.getElementById('featured-item');
    if (featuredContainer) {
        if (recs.featured) {
            const featured = recs.featured;
            safeText('featured-title', t('recommendations.hosts_pick'));
            featuredContainer.innerHTML = `
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
        } else {
            safeText('featured-title', 'Recomendación destacada');
            featuredContainer.innerHTML = '<p class="text-center text-gray-500 py-4">No hay recomendación destacada disponible</p>';
        }
    }

    // Renderizar contenido filtrado (estático + partners)
    await renderFilteredContent();

    // Configurar navegación inferior
    setupBottomNavigation(window.appState.apartmentId, window.appState.lang);
}

// Función principal de renderizado filtrado
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
                if (section.titleKey === 'transport_title') {
                    itemsContainer.innerHTML += `
                        <div class="bg-gray-50 dark:bg-[#151c2b] rounded-xl p-4 flex gap-4 items-start border border-gray-100 dark:border-gray-800">
                            <div class="size-12 rounded-full bg-[#1152d4]/10 flex items-center justify-center shrink-0">
                                <span class="material-symbols-outlined text-primary text-[24px]">subway</span>
                            </div>
                            <div class="flex-1">
                                <div class="flex justify-between items-start">
                                    <h4 class="text-gray-900 dark:text-white font-bold text-base">${item.name}</h4>
                                    <span class="text-xs font-bold bg-white dark:bg-gray-700 px-2 py-1 rounded border border-gray-200 dark:border-gray-600 shadow-sm text-gray-800 dark:text-gray-200">${item.distance}</span>
                                </div>
                                <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">${item.details}</p>
                                ${item.lines ? `<div class="flex gap-2 mt-3">${item.lines.map(color => `<span class="inline-block size-3 rounded-full" style="background-color: ${color};"></span>`).join('')}</div>` : ''}
                            </div>
                        </div>`;
                } else if (section.titleKey === 'essentials_title') {
                    const card = document.createElement('div');
                    card.className = 'snap-start w-40 shrink-0 flex flex-col';
                    card.innerHTML = `
                        <div class="h-28 w-full bg-center bg-no-repeat bg-cover rounded-xl mb-3 relative overflow-hidden" style="background-image: url('${item.image || "https://via.placeholder.com/150"}');">
                            <div class="absolute inset-0 bg-black/10"></div>
                            <div class="absolute bottom-2 left-2 bg-white/90 dark:bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                                <span class="text-[10px] font-bold text-gray-900 dark:text-white">${item.distance || 'N/A'}</span>
                            </div>
                        </div>
                        <h4 class="text-gray-900 dark:text-white font-bold text-sm truncate">${item.name}</h4>
                        <p class="text-gray-500 dark:text-gray-400 text-xs">${t(`recommendations.types.${item.typeKey || 'unknown'}`)}</p>`;
                    itemsContainer.appendChild(card);
                } else {
                    const listItem = document.createElement('div');
                    listItem.className = 'flex gap-4 items-center mb-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#151c2b] shadow-sm';
                    listItem.innerHTML = `
                        <div class="w-20 h-20 shrink-0 bg-center bg-no-repeat bg-cover rounded-lg" style="background-image: url('${item.image || "https://via.placeholder.com/100"}');"></div>
                        <div class="flex-1 min-w-0">
                            <h4 class="text-gray-900 dark:text-white font-bold text-base truncate">${item.name}</h4>
                            <p class="text-gray-500 dark:text-gray-400 text-xs mb-1">${t(`recommendations.types.${item.typeKey || 'unknown'}`)} • ${item.priceRange || 'N/A'}</p>
                            <div class="flex items-center gap-1 text-primary text-xs font-semibold">
                                <span class="material-symbols-outlined text-[14px]">directions_walk</span>
                                <span>${item.distance || 'N/A'}</span>
                            </div>
                        </div>
                        <button class="shrink-0 size-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-primary hover:text-white transition-colors">
                            <span class="material-symbols-outlined text-[18px]">chevron_right</span>
                        </button>`;
                    itemsContainer.appendChild(listItem);
                }
            });

            sectionDiv.innerHTML += sectionHTML;
            sectionDiv.appendChild(itemsContainer);
            sectionsContainer.appendChild(sectionDiv);
        });
    }

    // 2. Partners dinámicos filtrados por zona y categoría actual
    try {
        const zone = await getApartmentZone(apt);
        if (zone) {
            console.log('Apartamento en zona:', zone.name);

            const timestamp = new Date().getTime(); // Bypass cache
            const partnersRes = await fetch(`${window.ROOT_PATH}data/partners.json?t=${timestamp}`, { cache: 'no-store' });
            if (!partnersRes.ok) throw new Error('No se pudo cargar partners.json');
            const allPartners = await partnersRes.json();

            const visiblePartners = allPartners.filter(p => {
                const inZone = p.zones?.includes(zone.id);
                const inCategory = currentFilter === 'all' || p.categoryKey === currentFilter;
                return inZone && inCategory && p.active !== false;
            });

            if (visiblePartners.length > 0) {
                hasContent = true;
                const partnersSection = document.createElement('div');
                partnersSection.className = 'pt-8';
                partnersSection.innerHTML = `<h3 class="text-xl font-bold mb-6">Ofertas y recomendaciones locales en ${zone.name}</h3>`;

                const partnersContainer = document.createElement('div');
                partnersContainer.className = 'grid gap-6 md:grid-cols-2';

                visiblePartners.forEach(partner => {
                    const card = document.createElement('div');
                    card.className = 'bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow';
                    card.innerHTML = `
                        <div class="h-40 bg-cover bg-center" style="background-image: url('${partner.image || "https://via.placeholder.com/400x200?text=Sin+imagen"}')"></div>
                        <div class="p-5">
                            <h4 class="text-lg font-semibold mb-2">${partner.name}</h4>
                            <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">${partner.description || ''}</p>
                            <p class="text-primary font-medium">${partner.offer || 'Oferta disponible'}</p>
                        </div>`;
                    partnersContainer.appendChild(card);
                });

                partnersSection.appendChild(partnersContainer);
                sectionsContainer.appendChild(partnersSection);
            }
        }
    } catch (err) {
        console.error('Error cargando partners o zonas:', err);
    }

    // Fallback visual si no hay NADA (estático ni partners)
    if (!hasContent) {
        const noContent = document.createElement('div');
        noContent.className = 'pt-8 text-center text-gray-500 dark:text-gray-400';
        noContent.innerHTML = `
            <span class="material-symbols-outlined text-5xl mb-4 text-gray-300 dark:text-gray-600">info</span>
            <p class="text-lg font-medium">No hay recomendaciones disponibles en este momento</p>
            <p class="text-sm mt-2">Próximamente más contenido personalizado.</p>`;
        sectionsContainer.appendChild(noContent);
    }

    // Configurar navegación inferior
    setupBottomNavigation(window.appState.apartmentId, window.appState.lang);
}