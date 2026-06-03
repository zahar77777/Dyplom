let map;
let markers = [];
let userMarker = null;
let routeLayer = null;
let routesData = [];
let routeInfoControl = null;

async function loadRoutesData() {
    const { data, error } = await window.supabaseClient
        .from('routes')
        .select('*')
        .eq('is_active', true)
        .order('id');
    
    if (error) {
        console.error('Помилка завантаження маршрутів:', error);
        routesData = [];
    } else {
        routesData = data;
    }
    return routesData;
}

document.addEventListener('DOMContentLoaded', async function() {
    if (document.getElementById('routes-map')) {
        await loadRoutesData();
        initRoutesMap();
        renderRoutesCatalog();
        initFilters();
        autoGetGeolocation();
    }
});

function initRoutesMap() {
    map = L.map('routes-map').setView([49.0, 31.0], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    addMarkersToMap();
}

function autoGetGeolocation() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const userCoords = [position.coords.latitude, position.coords.longitude];
            const userIcon = L.divIcon({
                className: 'user-marker',
                html: `<div style="background-color: #2196f3; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center;"><div style="width:10px;height:10px;background:white;border-radius:50%;"></div></div>`,
                iconSize: [32, 32],
                iconAnchor: [16, 16]
            });
            userMarker = L.marker(userCoords, { icon: userIcon }).bindPopup('<strong>Ваше місцезнаходження</strong>').addTo(map);
        }, function(error) {}, { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 });
    }
}

function addMarkersToMap(filterType = 'all') {
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    
    const filteredRoutes = filterType === 'all' ? routesData : routesData.filter(route => route.region === filterType);
    
    filteredRoutes.forEach(route => {
        const color = route.type === 'hiking' ? '#2c5f2d' : (route.type === 'water' ? '#2196f3' : (route.type === 'castle' ? '#9c27b0' : '#b68b40'));
        const markerIcon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><use href="assets/images/icons/sprite.svg#icon-location"></use></svg></div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
        });
        
        const marker = L.marker([route.start_coords_lat, route.start_coords_lng], { icon: markerIcon }).addTo(map);
        marker.bindPopup(`
            <div class="popup-content">
                <div class="popup-title">${currentLang === 'uk' ? route.name : route.name_en}</div>
                <div class="popup-buttons">
                    <button onclick="buildRouteToStart(${route.id}, '${route.start_name}', [${route.start_coords_lat}, ${route.start_coords_lng}])" class="popup-btn popup-btn--route">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><use href="assets/images/icons/sprite.svg#icon-walk"></use></svg>${t('route_on_map_btn')}
                    </button>
                    <a href="route-detail.html?id=${route.id}" class="popup-btn popup-btn--detail">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><use href="assets/images/icons/sprite.svg#icon-route"></use></svg>${t('route_detail_btn')}
                    </a>
                </div>
            </div>
        `, { className: 'custom-popup' });
        markers.push(marker);
    });
}

window.buildRouteToStart = buildRouteToStart;

async function buildRouteToStart(routeId, startName, startCoords) {
    if (!userMarker) {
        const msg = document.createElement('div');
        msg.innerHTML = 'Геолокація недоступна. Дозвольте доступ до місцезнаходження в налаштуваннях браузера.';
        msg.style.cssText = `position: absolute; bottom: 20px; left: 20px; background: rgba(0,0,0,0.8); color: white; padding: 10px 15px; border-radius: 8px; font-size: 12px; z-index: 1000; max-width: 260px;`;
        document.querySelector('.map-wrapper').appendChild(msg);
        setTimeout(() => msg.remove(), 4000);
        return;
    }
    
    const userCoords = userMarker.getLatLng();
    if (routeLayer) { map.removeLayer(routeLayer); routeLayer = null; }
    if (routeInfoControl) { map.removeControl(routeInfoControl); routeInfoControl = null; }
    
    try {
        const url = `https://router.project-osrm.org/route/v1/driving/${userCoords.lng},${userCoords.lat};${startCoords[1]},${startCoords[0]}?overview=full&geometries=geojson`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.routes && data.routes.length > 0) {
            const coordinates = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
            const distanceKm = (data.routes[0].distance / 1000).toFixed(1);
            const durationMin = Math.round(data.routes[0].duration / 60);
            
            routeLayer = L.polyline(coordinates, { color: '#ff9800', weight: 5, opacity: 0.8, dashArray: '5, 10' }).addTo(map);
            map.fitBounds(routeLayer.getBounds(), { padding: [50, 50] });
            
            routeInfoControl = L.control({ position: 'topright' });
            routeInfoControl.onAdd = function() {
                const div = L.DomUtil.create('div', 'route-info-panel');
                div.innerHTML = `<strong>Як доїхати до старту</strong><div class="info-row"><span class="info-label">Старт:</span><span class="info-value">${startName}</span></div><div class="info-row"><span class="info-label">Відстань:</span><span class="info-value">${distanceKm} км</span></div><div class="info-row"><span class="info-label">Час:</span><span class="info-value">${durationMin} хв</span></div>`;
                return div;
            };
            routeInfoControl.addTo(map);
        }
    } catch (error) { console.error(error); }
}

function renderRoutesCatalog(filterType = 'all') {
    const container = document.getElementById('routes-catalog-container');
    if (!container) return;
    
    const filteredRoutes = filterType === 'all' ? routesData : routesData.filter(route => route.region === filterType);
    const lang = currentLang;
    
    container.innerHTML = '';
    
    filteredRoutes.forEach(route => {
        container.insertAdjacentHTML('beforeend', `
            <div class="route-card">
                <div class="route-image-container">
                    <img src="${route.image_url}" alt="${lang === 'uk' ? route.name : route.name_en}" class="route-image" loading="lazy" onerror="this.src='assets/images/placeholder.jpg'">
                    <span class="route-price">${route.price} грн</span>
                </div>
                <div class="route-content">
                    <h3 class="route-title">${escapeHtml(lang === 'uk' ? route.name : route.name_en)}</h3>
                    <p class="route-region">
                        <svg class="icon icon-small" width="16" height="16">
                            <use href="assets/images/icons/sprite.svg#icon-location"></use>
                        </svg>
                        ${lang === 'uk' ? route.region_name : route.region_name_en}
                    </p>
                    <p class="route-description">${escapeHtml(lang === 'uk' ? route.description.substring(0, 100) : route.description_en.substring(0, 100))}...</p>
                    <div class="route-meta">
                        <span class="meta-item">
                            <svg class="icon icon-small" width="14" height="14">
                                <use href="assets/images/icons/sprite.svg#icon-clock"></use>
                            </svg>
                            ${lang === 'uk' ? route.duration : route.duration_en}
                        </span>
                        <span class="meta-item">
                            <svg class="icon icon-small" width="14" height="14">
                                <use href="assets/images/icons/sprite.svg#icon-walk"></use>
                            </svg>
                            ${route.distance}
                        </span>
                        <span class="meta-item difficulty-${route.difficulty}">
                            <svg class="icon icon-small" width="14" height="14">
                                <use href="assets/images/icons/sprite.svg#icon-mountain"></use>
                            </svg>
                            ${route.difficulty === 'medium' ? (lang === 'uk' ? 'середньо' : 'medium') : (lang === 'uk' ? 'легко' : 'easy')}
                        </span>
                    </div>
                    <div class="route-actions">
                        <button class="btn btn--outline btn--small show-on-map-btn" data-id="${route.id}" data-coords="${route.start_coords_lat},${route.start_coords_lng}">
                            <svg class="icon icon-small" width="14" height="14">
                                <use href="assets/images/icons/sprite.svg#icon-map"></use>
                            </svg>
                            ${t('route_on_map_btn')}
                        </button>
                        <a href="route-detail.html?id=${route.id}" class="btn btn--primary btn--small">
                            <svg class="icon icon-small" width="14" height="14">
                                <use href="assets/images/icons/sprite.svg#icon-route"></use>
                            </svg>
                            ${t('route_detail_btn')}
                        </a>
                    </div>
                </div>
            </div>
        `);
    });
    
    document.querySelectorAll('.show-on-map-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const routeId = parseInt(this.dataset.id);
            const route = routesData.find(r => r.id === routeId);
            if (route && map) {
                const mapContainer = document.getElementById('routes-map');
                const topPos = mapContainer.getBoundingClientRect().top + window.pageYOffset - 100;
                window.scrollTo({ top: topPos, behavior: 'smooth' });
                setTimeout(() => { map.setView([route.start_coords_lat, route.start_coords_lng], 13); }, 400);
            }
        });
    });
}

function initFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const filterMap = { 'all': 'all', 'carpathians': 'carpathians', 'castles': 'castles', 'cities': 'cities', 'water': 'water' };
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const filterValue = this.dataset.filter;
            const filterType = filterMap[filterValue] || filterValue;
            addMarkersToMap(filterType);
            renderRoutesCatalog(filterType);
        });
    });
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}