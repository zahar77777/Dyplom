// ===== ГАЛЕРЕЯ МАРШРУТІВ =====
let routesWithGalleries = [];
let lightboxSwiper = null;
let currentRoute = null;

// Перевірка наявності Supabase
if (!window.supabaseClient) {
    console.error('Supabase не ініціалізовано!');
    const container = document.getElementById('routesGalleryGrid');
    if (container) {
        container.innerHTML = '<div class="error-message" style="text-align:center;padding:60px;"><i class="fas fa-exclamation-triangle fa-3x" style="color: var(--primary-color);"></i><p>Помилка підключення до бази даних. Спробуйте оновити сторінку.</p></div>';
    }
}

async function loadRoutesGalleryData() {
    // Перевірка Supabase з повторною спробою
    if (!window.supabaseClient) {
        console.warn('Supabase не готовий, повторна спроба через 500ms');
        setTimeout(() => loadRoutesGalleryData(), 500);
        return;
    }
    
    try {
        const { data: routes, error: routesError } = await window.supabaseClient
            .from('routes')
            .select('*')
            .eq('is_active', true)
            .order('id');
        
        if (routesError) throw routesError;
        
        if (!routes || routes.length === 0) {
            console.warn('Немає маршрутів в базі');
            renderRoutesGallery();
            return;
        }
        
        routesWithGalleries = [];
        
        // Завантажуємо всі галереї паралельно
        const galleryResults = await Promise.all(
            routes.map(route =>
                window.supabaseClient
                    .from('route_gallery')
                    .select('image_url')
                    .eq('route_id', route.id)
                    .order('order')
            )
        );
        
        routes.forEach((route, i) => {
            const { data: gallery, error: galleryError } = galleryResults[i];
            if (galleryError) {
                console.error('Помилка завантаження галереї:', galleryError);
            }
            
            const galleryImages = (gallery && gallery.length > 0)
                ? gallery.map(g => g.image_url)
                : [route.image_url];
            
            routesWithGalleries.push({
                id: route.id,
                name: route.name,
                name_en: route.name_en,
                region: route.region_name,
                regionIcon: route.region,
                duration: route.duration,
                duration_en: route.duration_en,
                difficulty: route.difficulty,
                distance: route.distance,
                mainImage: route.image_url,
                description: route.description,
                description_en: route.description_en,
                gallery: galleryImages
            });
        });
        
        console.log('Завантажено маршрутів для галереї:', routesWithGalleries.length);
        renderRoutesGallery();
        
    } catch (error) {
        console.error('Помилка завантаження даних галереї:', error);
        const container = document.getElementById('routesGalleryGrid');
        if (container) {
            container.innerHTML = '<div style="text-align: center; padding: 60px; grid-column: 1/-1;"><i class="fas fa-exclamation-triangle fa-3x" style="color: var(--primary-color);"></i><p>Помилка завантаження даних. Спробуйте оновити сторінку.</p></div>';
        }
    }
}

function renderRoutesGallery() {
    const container = document.getElementById('routesGalleryGrid');
    if (!container) return;
    
    const lang = window.currentLang || localStorage.getItem('language') || 'uk';
    
    if (routesWithGalleries.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 60px; grid-column: 1/-1;"><i class="fas fa-spinner fa-pulse fa-3x" style="color: var(--primary-color);"></i><p>Завантаження...</p></div>';
        return;
    }
    
    container.innerHTML = routesWithGalleries.map(route => {
        const name = lang === 'uk' ? route.name : route.name_en;
        const desc = lang === 'uk' ? route.description : route.description_en;
        const duration = lang === 'uk' ? route.duration : route.duration_en;
        const difficultyText = route.difficulty === 'medium' ? (lang === 'uk' ? 'середньо' : 'medium') : (lang === 'uk' ? 'легко' : 'easy');
        
        return `
        <div class="route-gallery-card" data-route-id="${route.id}">
            <div class="route-gallery-card__image">
                <img src="${route.mainImage}" alt="${escapeHtml(name)}" loading="lazy" onerror="this.src='assets/images/placeholder.jpg'">
                <span class="route-gallery-card__badge">${route.gallery.length} фото</span>
            </div>
            <div class="route-gallery-card__content">
                <h3 class="route-gallery-card__title">${escapeHtml(name)}</h3>
                <div class="route-gallery-card__region">
                    <i class="fas fa-map-marker-alt"></i> ${escapeHtml(route.region)}
                </div>
                <p class="route-gallery-card__desc">${escapeHtml(desc.substring(0, 120))}...</p>
                <div class="route-gallery-card__stats">
                    <span><i class="fas fa-clock"></i> ${escapeHtml(duration)}</span>
                    <span><i class="fas fa-mountain"></i> ${difficultyText}</span>
                    <span><i class="fas fa-ruler"></i> ${escapeHtml(route.distance)}</span>
                </div>
            </div>
        </div>
    `}).join('');
    
    document.querySelectorAll('.route-gallery-card').forEach(card => {
        card.addEventListener('click', () => {
            const routeId = parseInt(card.dataset.routeId);
            const route = routesWithGalleries.find(r => r.id === routeId);
            if (route) openRouteLightbox(route);
        });
    });
}

function openRouteLightbox(route) {
    currentRoute = route;
    const lang = window.currentLang || localStorage.getItem('language') || 'uk';
    
    const titleEl = document.getElementById('lightboxTitle');
    const regionEl = document.getElementById('infoRegion');
    const durationEl = document.getElementById('infoDuration');
    const difficultyEl = document.getElementById('infoDifficulty');
    const distanceEl = document.getElementById('infoDistance');
    
    const name = lang === 'uk' ? route.name : route.name_en;
    const duration = lang === 'uk' ? route.duration : route.duration_en;
    const difficultyText = route.difficulty === 'medium' ? (lang === 'uk' ? 'середньо' : 'medium') : (lang === 'uk' ? 'легко' : 'easy');
    
    if (titleEl) titleEl.textContent = name;
    if (regionEl) regionEl.textContent = route.region;
    if (durationEl) durationEl.textContent = duration;
    if (difficultyEl) difficultyEl.textContent = difficultyText;
    if (distanceEl) distanceEl.textContent = route.distance;
    
    const wrapper = document.getElementById('lightboxWrapper');
    if (wrapper) {
        wrapper.innerHTML = '';
        route.gallery.forEach((imgSrc, index) => {
            const slide = document.createElement('div');
            slide.className = 'swiper-slide';
            slide.innerHTML = `<img src="${imgSrc}" alt="${escapeHtml(name)} - фото ${index + 1}" loading="lazy" onerror="this.src='assets/images/placeholder.jpg'">`;
            wrapper.appendChild(slide);
        });
    }
    
    if (lightboxSwiper) {
        lightboxSwiper.destroy(true, true);
        lightboxSwiper = null;
    }
    
    const swiperEl = document.querySelector('#lightboxSwiper');
    if (swiperEl && route.gallery.length > 0) {
        lightboxSwiper = new Swiper('#lightboxSwiper', {
            slidesPerView: 1,
            spaceBetween: 0,
            loop: route.gallery.length > 1,
            navigation: false,
            on: {
                slideChange: function() {
                    updateCounter(this.realIndex + 1);
                }
            }
        });
    }
    
    updateCounter(1);
    
    const lightbox = document.getElementById('routeLightbox');
    if (lightbox) {
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function updateCounter(current) {
    const counter = document.getElementById('lightboxCounter');
    if (counter && currentRoute) {
        counter.textContent = `${current} / ${currentRoute.gallery.length}`;
    }
}

function closeLightbox() {
    const lightbox = document.getElementById('routeLightbox');
    if (lightbox) {
        lightbox.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
    if (lightboxSwiper) {
        lightboxSwiper.slideTo(0, 0);
    }
}

function nextSlide() {
    if (lightboxSwiper) lightboxSwiper.slideNext();
}

function prevSlide() {
    if (lightboxSwiper) lightboxSwiper.slidePrev();
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', () => {
    loadRoutesGalleryData();
    
    const lightbox = document.getElementById('routeLightbox');
    const closeBtn = document.getElementById('lightboxCloseBtn');
    const prevBtn = document.getElementById('lightboxPrev');
    const nextBtn = document.getElementById('lightboxNext');
    
    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
    if (prevBtn) prevBtn.addEventListener('click', prevSlide);
    if (nextBtn) nextBtn.addEventListener('click', nextSlide);
    
    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            const isSlide = e.target.closest('.swiper-slide');
            const isNav = e.target.closest('.route-lightbox__nav');
            const isClose = e.target.closest('.route-lightbox__close');
            const isHeader = e.target.closest('.route-lightbox__header');
            const isInfo = e.target.closest('.route-lightbox__info');
            const isCounter = e.target.closest('.route-lightbox__counter');
            
            if (!isSlide && !isNav && !isClose && !isHeader && !isInfo && !isCounter) {
                closeLightbox();
            }
        });
    }
    
    document.addEventListener('keydown', (e) => {
        const lightboxEl = document.getElementById('routeLightbox');
        if (e.key === 'Escape' && lightboxEl && lightboxEl.classList.contains('active')) {
            closeLightbox();
        }
        if (e.key === 'ArrowLeft' && lightboxEl && lightboxEl.classList.contains('active')) {
            prevSlide();
        }
        if (e.key === 'ArrowRight' && lightboxEl && lightboxEl.classList.contains('active')) {
            nextSlide();
        }
    });
});
