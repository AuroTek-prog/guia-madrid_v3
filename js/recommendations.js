// Renderiza contenido filtrado
async function renderFilteredContent() {
    const apt = window.appState.apartmentData?.[window.appState.apartmentId];
    if (!apt) return;
    const recs = apt.recommendations || {};
    const sectionsContainer = document.getElementById('sections-container');
    if (!sectionsContainer) return;

    sectionsContainer.innerHTML = '';
    let hasContent = false;

    // 1. Recomendaciones estáticas
    if (recs.sections) {
        recs.sections.forEach(section => {
            const filteredItems = section.items.filter(item => currentFilter === 'all' || item.typeKey === currentFilter);
            if (filteredItems.length === 0) return;
            hasContent = true;

            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'pt-6';
            const sectionHTML = `<h3 class="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] mb-4">${t(`recommendations.${section.titleKey}`)}</h3>`;
            const itemsContainer = document.createElement('div');
            itemsContainer.className = section.titleKey === 'essentials_title' ? 'flex gap-4 overflow-x-auto hide-scrollbar snap-x pb-4' : 'flex flex-col gap-4';

            filteredItems.forEach(item => {
                // ... lógica de renderizado original de cada item
            });

            sectionDiv.innerHTML += sectionHTML;
            sectionDiv.appendChild(itemsContainer);
            sectionsContainer.appendChild(sectionDiv);
        });
    }

    // 2. Partners dinámicos
    try {
        const zone = await getApartmentZone(apt);
        const timestamp = new Date().getTime();
        const partnersRes = await fetch(`${window.ROOT_PATH}data/partners.json?t=${timestamp}`, { cache: 'no-store' });
        if (!partnersRes.ok) throw new Error('No se pudo cargar partners.json');
        const allPartners = await partnersRes.json();

        // PREMIUM: siempre mostrar (filtrado por categoría)
        const premiumPartners = allPartners.filter(p => p.global === true && p.active !== false && (currentFilter === 'all' || p.categoryKey === currentFilter));

        // BÁSICO: si hay zona filtramos por zona, si no, mostramos todos como fallback
        let basicPartners = [];
        let basicTitle = '';
        if (zone) {
            basicPartners = allPartners.filter(p => !p.global && p.zones?.includes(zone.id) && p.active !== false && (currentFilter === 'all' || p.categoryKey === currentFilter));
            basicTitle = `Ofertas locales en ${zone.name}`;
        } else {
            basicPartners = allPartners.filter(p => !p.global && p.active !== false && (currentFilter === 'all' || p.categoryKey === currentFilter));
            basicTitle = 'Recomendados en Madrid';
        }

        // Mostrar PREMIUM
        if (premiumPartners.length > 0) {
            hasContent = true;
            const premiumSection = document.createElement('div');
            premiumSection.className = 'pt-8';
            premiumSection.innerHTML = `<h3 class="text-xl font-bold mb-6 text-primary">Recomendaciones Premium Destacadas</h3>`;
            const premiumContainer = document.createElement('div');
            premiumContainer.className = 'flex gap-4 overflow-x-auto hide-scrollbar snap-x pb-4';

            premiumPartners.forEach(partner => {
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
            });

            premiumSection.appendChild(premiumContainer);
            sectionsContainer.appendChild(premiumSection);
        }

        // Mostrar BÁSICOS
        if (basicPartners.length > 0) {
            hasContent = true;
            const basicSection = document.createElement('div');
            basicSection.className = 'pt-8';
            basicSection.innerHTML = `<h3 class="text-xl font-bold mb-6">${basicTitle}</h3>`;
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

        // Si no hay zona y no hay básicos, mostrar mensaje bonito (opcional)
        if (!zone && basicPartners.length === 0) {
            const noZoneMsg = document.createElement('div');
            noZoneMsg.className = 'pt-8 text-center text-gray-500 dark:text-gray-400';
            noZoneMsg.innerHTML = `
                <span class="material-symbols-outlined text-5xl mb-4 text-gray-300 dark:text-gray-600">info</span>
                <p class="text-lg font-medium">No se detectó zona específica</p>
                <p class="text-sm mt-2">Mostrando ofertas generales en Madrid.</p>`;
            sectionsContainer.appendChild(noZoneMsg);
        }

    } catch (err) {
        console.error('Error cargando partners o zonas:', err);
    }

    // Fallback si no hay contenido
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
