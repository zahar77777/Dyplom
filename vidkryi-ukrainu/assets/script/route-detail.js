let pointsMap = null;
let pointsMarkers = [];
let gallerySwiper = null;
let currentRoute = null;
let priceChannel = null;

function getRouteIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

async function loadRouteDetails() {
    // Перевірка Supabase
    if (!window.supabaseClient) {
        console.error('Supabase не ініціалізовано');
        if (typeof showNotification === 'function') {
            showNotification('Помилка підключення до сервера', 'error');
        }
        return null;
    }
    
    const routeId = getRouteIdFromUrl();
    if (!routeId) {
        console.error('Немає ID маршруту');
        window.location.href = 'routes.html';
        return null;
    }
    
    console.log('Завантаження маршруту ID:', routeId);
    
    try {
        const { data: route, error } = await window.supabaseClient
            .from('routes')
            .select('*')
            .eq('id', parseInt(routeId))
            .single();
        
        if (error) {
            console.error('Помилка завантаження маршруту:', error);
            window.location.href = 'routes.html';
            return null;
        }
        
        if (!route) {
            console.error('Маршрут не знайдено');
            window.location.href = 'routes.html';
            return null;
        }
        
        console.log('Маршрут завантажено:', route.name, 'Ціна:', route.price);
        
        const { data: points, error: pointsError } = await window.supabaseClient
            .from('route_points')
            .select('*')
            .eq('route_id', parseInt(routeId))
            .order('order');
        
        if (pointsError) console.error('Помилка точок:', pointsError);
        
        const { data: gallery, error: galleryError } = await window.supabaseClient
            .from('route_gallery')
            .select('*')
            .eq('route_id', parseInt(routeId))
            .order('order');
        
        if (galleryError) console.error('Помилка галереї:', galleryError);
        
        const { data: timeline, error: timelineError } = await window.supabaseClient
            .from('route_timeline')
            .select('*')
            .eq('route_id', parseInt(routeId))
            .order('day_number');
        
        if (timelineError) console.error('Помилка таймлайну:', timelineError);
        
        currentRoute = {
            ...route,
            points: points || [],
            gallery: gallery || [],
            timeline: timeline || []
        };
        
        console.log('Дані завантажено:', {
            points: currentRoute.points.length,
            gallery: currentRoute.gallery.length,
            timeline: currentRoute.timeline.length,
            price: currentRoute.price
        });
        
        return currentRoute;
        
    } catch (error) {
        console.error('Критична помилка:', error);
        window.location.href = 'routes.html';
        return null;
    }
}

function updateHeroSection(route) {
    const heroImage = document.getElementById('heroImage');
    const heroTitle = document.getElementById('heroTitle');
    const heroRegionSpan = document.querySelector('#heroRegion span');
    const heroPriceSpan = document.querySelector('#heroPrice span');
    const lang = window.currentLang || localStorage.getItem('language') || 'uk';
    
    if (heroImage) {
        heroImage.src = route.image_url;
        heroImage.onerror = () => { heroImage.src = 'assets/images/placeholder.jpg'; };
        heroImage.alt = lang === 'uk' ? route.name : route.name_en;
    }
    if (heroTitle) heroTitle.textContent = lang === 'uk' ? route.name : route.name_en;
    if (heroRegionSpan) heroRegionSpan.textContent = lang === 'uk' ? route.region_name : route.region_name_en;
    if (heroPriceSpan) heroPriceSpan.textContent = route.price + ' грн';
}

function updateInfoSection(route) {
    const description = document.getElementById('routeDescription');
    const duration = document.getElementById('routeDuration');
    const difficulty = document.getElementById('routeDifficulty');
    const location = document.getElementById('routeLocation');
    const distance = document.getElementById('routeDistance');
    const lang = window.currentLang || localStorage.getItem('language') || 'uk';
    
    if (description) description.textContent = lang === 'uk' ? route.description : route.description_en;
    if (duration) duration.textContent = lang === 'uk' ? route.duration : route.duration_en;
    if (difficulty) {
        const difficultyText = route.difficulty === 'medium' ? (lang === 'uk' ? 'середньо' : 'medium') : (lang === 'uk' ? 'легко' : 'easy');
        difficulty.textContent = difficultyText;
        difficulty.className = `stat-value difficulty-${route.difficulty}`;
    }
    if (location) location.textContent = lang === 'uk' ? route.region_name : route.region_name_en;
    if (distance) distance.textContent = route.distance;
}

function initRouteGallery(route) {
    const galleryWrapper = document.getElementById('routeGalleryWrapper');
    if (!galleryWrapper) {
        console.error('galleryWrapper не знайдено');
        return;
    }
    
    galleryWrapper.innerHTML = '';
    
    console.log('Ініціалізація галереї, фото:', route.gallery);
    
    if (!route.gallery || route.gallery.length === 0) {
        if (route.image_url) {
            const slide = document.createElement('div');
            slide.className = 'swiper-slide gallery-slide';
            slide.innerHTML = `<img src="${route.image_url}" alt="${route.name}" loading="lazy" onerror="this.src='assets/images/placeholder.jpg'">`;
            galleryWrapper.appendChild(slide);
            console.log('Додано головне фото');
        } else {
            galleryWrapper.innerHTML = '<div class="swiper-slide">Фото відсутні</div>';
        }
    } else {
        route.gallery.forEach((img, index) => {
            const slide = document.createElement('div');
            slide.className = 'swiper-slide gallery-slide';
            const imgUrl = typeof img === 'string' ? img : img.image_url;
            slide.innerHTML = `<img src="${imgUrl}" alt="${route.name} - фото ${index + 1}" loading="lazy" onerror="this.src='assets/images/placeholder.jpg'">`;
            galleryWrapper.appendChild(slide);
        });
        console.log('Додано', route.gallery.length, 'фото з галереї');
    }
    
    if (gallerySwiper) {
        gallerySwiper.destroy(true, true);
        gallerySwiper = null;
    }
    
    setTimeout(() => {
        if (galleryWrapper.children.length > 0) {
            gallerySwiper = new Swiper('.route-gallery-swiper', {
                slidesPerView: 1,
                spaceBetween: 20,
                loop: galleryWrapper.children.length > 1,
                navigation: {
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev',
                },
                pagination: {
                    el: '.swiper-pagination',
                    clickable: true,
                },
                breakpoints: {
                    768: { slidesPerView: 2 },
                    1024: { slidesPerView: 3 }
                }
            });
            console.log('Swiper ініціалізовано');
        }
    }, 100);
}

function initPointsMap(route) {
    const mapContainer = document.getElementById('routePointsMap');
    if (!mapContainer) {
        console.error('mapContainer не знайдено');
        return;
    }
    
    if (pointsMap) {
        pointsMarkers.forEach(marker => marker.remove());
        pointsMarkers = [];
        pointsMap.remove();
        pointsMap = null;
    }
    
    if (!route.points || route.points.length === 0) {
        mapContainer.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#f5f5f5;">Точки маршруту відсутні</div>';
        console.log('Немає точок маршруту');
        return;
    }
    
    console.log('Ініціалізація карти, точок:', route.points.length);
    
    let centerLat = 0, centerLng = 0;
    route.points.forEach(point => {
        centerLat += point.lat;
        centerLng += point.lng;
    });
    centerLat /= route.points.length;
    centerLng /= route.points.length;
    
    pointsMap = L.map(mapContainer).setView([centerLat, centerLng], 10);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(pointsMap);
    
    const pointIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background: var(--primary-color, #2c5f2d); width: 36px; height: 36px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.2);"><i class="fas fa-map-marker-alt" style="color: white; font-size: 16px;"></i></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36]
    });
    
    route.points.forEach(point => {
        const marker = L.marker([point.lat, point.lng], { icon: pointIcon })
            .bindPopup(`<div class="map-popup"><strong>${escapeHtml(point.name)}</strong><p>${escapeHtml(point.description)}</p></div>`)
            .addTo(pointsMap);
        pointsMarkers.push(marker);
    });
    
    if (route.points.length > 1) {
        const bounds = L.latLngBounds(route.points.map(p => [p.lat, p.lng]));
        pointsMap.fitBounds(bounds, { padding: [50, 50] });
    }
    
    console.log('Карта ініціалізована');
}

function updateTimeline(route) {
    const timelineContainer = document.getElementById('routeTimeline');
    if (!timelineContainer) return;
    
    timelineContainer.innerHTML = '';
    const lang = window.currentLang || localStorage.getItem('language') || 'uk';
    
    if (!route.timeline || route.timeline.length === 0) {
        timelineContainer.innerHTML = '<p>Програма маршруту відсутня</p>';
        console.log('Немає таймлайну');
        return;
    }
    
    console.log('Ініціалізація таймлайну, днів:', route.timeline.length);
    
    route.timeline.forEach(day => {
        const dayCard = document.createElement('div');
        dayCard.className = 'timeline-day';
        
        let activities = [];
        if (lang === 'uk') {
            activities = day.activities;
        } else {
            activities = day.activities_en || day.activities;
        }
        
        const title = lang === 'uk' ? day.title : (day.title_en || day.title);
        
        dayCard.innerHTML = `
            <div class="timeline-day-header">
                <div class="timeline-day-number">${day.day_number}</div>
                <h3 class="timeline-day-title">${escapeHtml(title)}</h3>
            </div>
            <ul class="timeline-activities">
                ${activities.map(activity => `<li><i class="fas fa-check-circle"></i> ${escapeHtml(activity)}</li>`).join('')}
            </ul>
        `;
        
        timelineContainer.appendChild(dayCard);
    });
    
    console.log('Таймлайн ініціалізовано');
}

// ===== БРОНЮВАННЯ =====
function initBookingModal(route) {
    const bookBtn = document.getElementById('bookRouteBtn');
    const modal = document.getElementById('bookingModal');
    const modalOverlay = document.getElementById('bookingModalOverlay');
    const modalClose = document.getElementById('bookingModalClose');
    const bookingForm = document.getElementById('bookingForm');
    
    if (!bookBtn || !modal) {
        console.error('Елементи бронювання не знайдено');
        return;
    }
    
    // Встановлюємо мінімальну дату
    const dateInput = document.getElementById('bookingDate');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
    }
    
    async function loadCurrentUserForBooking() {
        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (user) {
                const { data: profile } = await window.supabaseClient
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                
                window.currentUser = { ...user, profile };
                
                const nameInput = document.getElementById('bookingName');
                const emailInput = document.getElementById('bookingEmail');
                const phoneInput = document.getElementById('bookingPhone');
                
                if (nameInput && window.currentUser.profile?.name) nameInput.value = window.currentUser.profile.name;
                if (emailInput && window.currentUser.email) emailInput.value = window.currentUser.email;
                if (phoneInput && window.currentUser.profile?.phone) phoneInput.value = window.currentUser.profile.phone;
            }
        } catch (error) {
            console.error('Помилка завантаження користувача:', error);
        }
    }
    
    const openModal = () => {
        loadCurrentUserForBooking();
        modal.classList.add('modal--open');
        document.body.style.overflow = 'hidden';
    };
    
    const closeModal = () => {
        modal.classList.remove('modal--open');
        document.body.style.overflow = 'auto';
    };
    
    bookBtn.addEventListener('click', openModal);
    if (modalOverlay) modalOverlay.addEventListener('click', closeModal);
    if (modalClose) modalClose.addEventListener('click', closeModal);
    
    if (bookingForm) {
        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('bookingName')?.value || '';
            const email = document.getElementById('bookingEmail')?.value || '';
            const phone = document.getElementById('bookingPhone')?.value || '';
            const date = document.getElementById('bookingDate')?.value || '';
            const people = parseInt(document.getElementById('bookingPeople')?.value) || 1;
            
            // Перевірка дати
            if (date) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const selectedDate = new Date(date);
                
                if (selectedDate < today) {
                    if (typeof showNotification === 'function') {
                        showNotification('Не можна вибрати дату в минулому. Оберіть сьогоднішню або майбутню дату.', 'warning');
                    }
                    return;
                }
            }
            
            if (!name || !email || !phone || !date) {
                if (typeof showNotification === 'function') {
                    showNotification('Заповніть всі поля', 'warning');
                }
                return;
            }
            
            const totalPrice = route.price * people;
            
            try {
                const { data: { user } } = await window.supabaseClient.auth.getUser();
                
                const { error: bookingError } = await window.supabaseClient
                    .from('bookings')
                    .insert([{
                        user_id: user?.id || null,
                        route_id: route.id,
                        booking_date: date,
                        people_count: people,
                        name: name,
                        email: email,
                        phone: phone,
                        total_price: totalPrice,
                        status: 'pending',
                        email_sent: false,
                        cancellation_email_sent: false,
                        comment: ''
                    }]);
                
                if (bookingError) throw bookingError;
                
                console.log('✅ Бронювання збережено в базі. Очікує підтвердження адміна.');
                
                if (typeof showNotification === 'function') {
                    showNotification('Ваше бронювання прийнято! Очікуйте підтвердження від адміністратора.', 'success');
                }
                closeModal();
                bookingForm.reset();
                
            } catch (error) {
                console.error('Помилка бронювання:', error);
                if (typeof showNotification === 'function') {
                    showNotification('Помилка бронювання. Спробуйте пізніше.', 'error');
                }
            }
        });
    }
    
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('modal--open')) closeModal();
    });
}

// ===== REAL-TIME ОНОВЛЕННЯ ЦІНИ =====
function setupRealtimePriceUpdate(routeId) {
    if (priceChannel) {
        priceChannel.unsubscribe();
    }
    
    priceChannel = window.supabaseClient
        .channel('price-updates')
        .on('postgres_changes', 
            { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'routes', 
                filter: `id=eq.${routeId}` 
            },
            (payload) => {
                if (payload.new && payload.new.price) {
                    console.log('🔄 Отримано оновлення ціни в реальному часі:', payload.new.price);
                    
                    const heroPriceSpan = document.querySelector('#heroPrice span');
                    if (heroPriceSpan) {
                        heroPriceSpan.textContent = payload.new.price + ' грн';
                        heroPriceSpan.style.backgroundColor = '#ff9800';
                        setTimeout(() => {
                            heroPriceSpan.style.backgroundColor = '';
                        }, 500);
                    }
                    
                    if (currentRoute) {
                        currentRoute.price = payload.new.price;
                    }
                    
                    if (typeof showNotification === 'function') {
                        showNotification('Ціну оновлено! Нова ціна: ' + payload.new.price + ' грн', 'info');
                    }
                }
            }
        )
        .subscribe((status) => {
            console.log('📡 Real-time підключення статус:', status);
        });
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ===== ІНІЦІАЛІЗАЦІЯ СТОРІНКИ =====
document.addEventListener('DOMContentLoaded', async () => {
    console.log('route-detail.js завантажено');
    
    const route = await loadRouteDetails();
    if (!route) return;
    
    updateHeroSection(route);
    updateInfoSection(route);
    initRouteGallery(route);
    initPointsMap(route);
    updateTimeline(route);
    initBookingModal(route);
    
    const routeId = getRouteIdFromUrl();
    if (routeId) {
        setupRealtimePriceUpdate(parseInt(routeId));
    }
});

window.addEventListener('beforeunload', () => {
    if (priceChannel) {
        priceChannel.unsubscribe();
    }
});
