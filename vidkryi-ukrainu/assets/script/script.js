// ===== БАГАТОМОВНІСТЬ =====
let currentLang = localStorage.getItem('language') || 'uk';
window.currentLang = currentLang;  // Глобальна змінна для всіх скриптів
let translations = {};
let currentUser = null;

async function loadTranslations(lang) {
    try {
        const response = await fetch(`assets/lang/${lang}.json`);
        if (!response.ok) throw new Error('Network response was not ok');
        translations = await response.json();
        return translations;
    } catch (error) {
        console.error('Помилка завантаження перекладів:', error);
        return {};
    }
}

function t(key) {
    return translations[key] || key;
}

async function setLanguage(lang) {
    currentLang = lang;
    window.currentLang = lang;  // Оновлюємо глобальну змінну
    localStorage.setItem('language', lang);
    await loadTranslations(lang);
    updateAllTexts();
    updateDynamicContent();
    updateSelectedLangText();
    
    const optionsDesktop = document.getElementById('langOptions');
    const optionsMobile = document.getElementById('langOptionsMobile');
    const selectedDesktop = document.querySelector('.desktop-lang-selector .lang-selected');
    const selectedMobile = document.querySelector('.mobile-lang-selector .lang-selected');
    
    if (optionsDesktop) optionsDesktop.classList.remove('open');
    if (optionsMobile) optionsMobile.classList.remove('open');
    if (selectedDesktop) selectedDesktop.classList.remove('open');
    if (selectedMobile) selectedMobile.classList.remove('open');
}

function updateAllTexts() {
    document.querySelectorAll('[data-translate]').forEach(el => {
        const key = el.getAttribute('data-translate');
        if (key && translations[key]) {
            if (el.tagName === 'INPUT' && el.getAttribute('type') !== 'button' && el.getAttribute('type') !== 'submit') {
                if (el.placeholder !== undefined) {
                    el.placeholder = translations[key];
                } else {
                    el.value = translations[key];
                }
            } else if (el.tagName === 'TEXTAREA') {
                el.placeholder = translations[key];
            } else {
                el.textContent = translations[key];
            }
        }
    });
    
    document.querySelectorAll('[data-translate-placeholder]').forEach(el => {
        const key = el.getAttribute('data-translate-placeholder');
        if (key && translations[key]) {
            el.placeholder = translations[key];
        }
    });
    
    if (document.title) {
        const currentPage = document.querySelector('.main-menu a.active')?.getAttribute('data-translate') || 'nav_home';
        document.title = t(currentPage) + ' | Відкрий Україну';
    }
}

function updateSelectedLangText() {
    const langText = currentLang === 'uk' ? 'UA' : 'EN';
    const selectedText = document.getElementById('selectedLangText');
    const selectedTextMobile = document.getElementById('selectedLangTextMobile');
    if (selectedText) selectedText.textContent = langText;
    if (selectedTextMobile) selectedTextMobile.textContent = langText;
    
    document.querySelectorAll('.lang-option').forEach(opt => {
        if (opt.dataset.lang === currentLang) {
            opt.classList.add('active');
        } else {
            opt.classList.remove('active');
        }
    });
}

function updateDynamicContent() {
    if (typeof renderRoutesCatalog === 'function') {
        const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
        renderRoutesCatalog(activeFilter);
    }
    if (typeof renderRoutesGallery === 'function') {
        renderRoutesGallery();
    }
    if (typeof renderPopularRoutes === 'function') {
        renderPopularRoutes();
    }
    if (typeof renderTestimonials === 'function') {
        renderTestimonials();
    }
    
    const addReviewBtn = document.getElementById('addReviewBtn');
    if (addReviewBtn) {
        addReviewBtn.setAttribute('data-translate', 'add_review_btn');
        addReviewBtn.textContent = t('add_review_btn');
    }
}

window.setLanguage = setLanguage;

// ===== DROPDOWN МОВИ =====
function toggleLangDropdown() {
    const options = document.getElementById('langOptions');
    const selected = document.querySelector('.desktop-lang-selector .lang-selected');
    if (options) {
        options.classList.toggle('open');
        selected?.classList.toggle('open');
    }
}

function toggleLangDropdownMobile() {
    const options = document.getElementById('langOptionsMobile');
    const selected = document.querySelector('.mobile-lang-selector .lang-selected');
    if (options) {
        options.classList.toggle('open');
        selected?.classList.toggle('open');
    }
}

window.toggleLangDropdown = toggleLangDropdown;
window.toggleLangDropdownMobile = toggleLangDropdownMobile;

document.addEventListener('click', function(event) {
    const desktopSelector = document.querySelector('.desktop-lang-selector .lang-selector');
    const mobileSelector = document.querySelector('.mobile-lang-selector .lang-selector');
    
    if (desktopSelector && !desktopSelector.contains(event.target)) {
        const options = document.getElementById('langOptions');
        const selected = document.querySelector('.desktop-lang-selector .lang-selected');
        if (options) options.classList.remove('open');
        if (selected) selected.classList.remove('open');
    }
    
    if (mobileSelector && !mobileSelector.contains(event.target)) {
        const options = document.getElementById('langOptionsMobile');
        const selected = document.querySelector('.mobile-lang-selector .lang-selected');
        if (options) options.classList.remove('open');
        if (selected) selected.classList.remove('open');
    }
});

// ===== БУРГЕР-МЕНЮ =====
const burgerMenu = document.getElementById('burgerMenu');
const openIcon = document.getElementById('openIcon');
const closeIcon = document.getElementById('closeIcon');
const headerNav = document.getElementById('headerNav');

if (burgerMenu && openIcon && closeIcon && headerNav) {
    burgerMenu.addEventListener('click', () => {
        openIcon.classList.toggle('d-none');
        closeIcon.classList.toggle('d-none');
        headerNav.classList.toggle('header-nav__open');
        document.body.style.overflow = headerNav.classList.contains('header-nav__open') ? 'hidden' : 'auto';
    });
}

// ===== СИСТЕМА СПОВІЩЕНЬ =====
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i><span>${message}</span>`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

window.showNotification = showNotification;  // Глобальна функція

// ===== ЗБЕРЕЖЕННЯ СТАНУ АВТОРИЗАЦІЇ =====
function saveAuthState(user, name) {
    if (user) {
        localStorage.setItem('auth_user_id', user.id);
        localStorage.setItem('auth_user_email', user.email);
        if (name) localStorage.setItem('auth_user_name', name);
    } else {
        localStorage.removeItem('auth_user_id');
        localStorage.removeItem('auth_user_email');
        localStorage.removeItem('auth_user_name');
    }
}

// Миттєво показуємо стан з localStorage ДО відповіді Supabase
function preloadAuthFromCache() {
    const userId = localStorage.getItem('auth_user_id');
    const userName = localStorage.getItem('auth_user_name');
    const desktopAuth = document.querySelector('.desktop-auth');
    const mobileAuth = document.querySelector('.mobile-auth');
    const desktopUserInfo = document.querySelector('.desktop-user-info');
    const mobileUserInfo = document.querySelector('.mobile-user-info');
    if (userId && userName) {
        if (desktopAuth) desktopAuth.classList.remove('auth-ready');
        if (mobileAuth) mobileAuth.classList.remove('auth-ready');
        if (desktopUserInfo) desktopUserInfo.classList.add('auth-ready');
        if (mobileUserInfo) mobileUserInfo.classList.add('auth-ready');
        document.querySelectorAll('.user-name').forEach(el => { el.textContent = userName; });
    } else {
        if (desktopAuth) desktopAuth.classList.add('auth-ready');
        if (mobileAuth) mobileAuth.classList.add('auth-ready');
        if (desktopUserInfo) desktopUserInfo.classList.remove('auth-ready');
        if (mobileUserInfo) mobileUserInfo.classList.remove('auth-ready');
    }
}

// ===== АВТОРИЗАЦІЯ З SUPABASE =====

async function loadCurrentUser() {
    const desktopAuth = document.querySelector('.desktop-auth');
    const mobileAuth = document.querySelector('.mobile-auth');
    const desktopUserInfo = document.querySelector('.desktop-user-info');
    const mobileUserInfo = document.querySelector('.mobile-user-info');
    
    if (desktopAuth) desktopAuth.classList.add('auth-loading');
    if (mobileAuth) mobileAuth.classList.add('auth-loading');
    
    try {
        if (!window.supabaseClient) {
            console.warn('Supabase не ініціалізовано');
            return;
        }
        
        const { data: { user }, error: userError } = await window.supabaseClient.auth.getUser();
        
        if (userError) throw userError;
        
        if (user) {
            const { data: profile, error: profileError } = await window.supabaseClient
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
            
            if (profileError && profileError.code !== 'PGRST116') {
                console.error('Помилка профілю:', profileError);
            }
            
            currentUser = { 
                ...user, 
                profile: profile || {
                    name: user.user_metadata?.name || user.email?.split('@')[0] || 'Користувач',
                    email: user.email,
                    role: 'user'
                }
            };
            
            if (user.user_metadata?.name && (!profile || !profile.name)) {
                await window.supabaseClient
                    .from('profiles')
                    .upsert({ 
                        id: user.id, 
                        name: user.user_metadata.name,
                        email: user.email,
                        phone: user.user_metadata.phone || '',
                        role: 'user'
                    });
                currentUser.profile.name = user.user_metadata.name;
            }
            
            const displayName = currentUser?.profile?.name || user.user_metadata?.name || user.email?.split('@')[0] || 'Користувач';
            saveAuthState(user, displayName);
        } else {
            currentUser = null;
            saveAuthState(null);
        }
        
        updateAuthUI();
        
    } catch (error) {
        console.error('Помилка завантаження користувача:', error);
        currentUser = null;
        updateAuthUI();
    } finally {
        if (desktopAuth) desktopAuth.classList.remove('auth-loading');
        if (mobileAuth) mobileAuth.classList.remove('auth-loading');
    }
}

function updateAuthUI() {
    const desktopAuth = document.querySelector('.desktop-auth');
    const desktopUserInfo = document.querySelector('.desktop-user-info');
    const mobileAuth = document.querySelector('.mobile-auth');
    const mobileUserInfo = document.querySelector('.mobile-user-info');

    const isLoggedIn = !!currentUser;
    const isAdminUser = currentUser?.profile?.role === 'admin';

    if (isLoggedIn) {
        if (desktopAuth) desktopAuth.classList.remove('auth-ready');
        if (mobileAuth) mobileAuth.classList.remove('auth-ready');
        if (desktopUserInfo) desktopUserInfo.classList.add('auth-ready');
        if (mobileUserInfo) mobileUserInfo.classList.add('auth-ready');
        
        let userName = 'Користувач';
        if (currentUser?.profile?.name && currentUser.profile.name !== '') {
            userName = currentUser.profile.name;
        } else if (currentUser?.user_metadata?.name) {
            userName = currentUser.user_metadata.name;
        } else if (currentUser?.email) {
            userName = currentUser.email.split('@')[0];
        }
        
        document.querySelectorAll('.user-name').forEach(el => {
            el.textContent = userName;
        });
        
        if (isAdminUser && !document.querySelector('.admin-link')) {
            const adminLi = document.createElement('li');
            adminLi.innerHTML = '<a href="admin.html" class="admin-link" style="color: var(--primary-color);"><i class="fas fa-shield-alt"></i> Адмін-панель</a>';
            const mainMenu = document.querySelector('.main-menu');
            if (mainMenu && !mainMenu.querySelector('.admin-link')) {
                mainMenu.appendChild(adminLi);
            }
        }
    } else {
        if (desktopAuth) desktopAuth.classList.add('auth-ready');
        if (mobileAuth) mobileAuth.classList.add('auth-ready');
        if (desktopUserInfo) desktopUserInfo.classList.remove('auth-ready');
        if (mobileUserInfo) mobileUserInfo.classList.remove('auth-ready');
        
        const adminLink = document.querySelector('.admin-link');
        if (adminLink) adminLink.parentElement?.remove();
    }
}

async function showLoginModal() {
    const modalDiv = document.createElement('div');
    modalDiv.className = 'modal';
    modalDiv.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
            <button class="modal-close"><i class="fa-solid fa-xmark"></i></button>
            <h3 class="modal-title" data-translate="auth_login_title">${t('auth_login_title')}</h3>
            <form class="modal-form">
                <div class="form-group"><input type="email" id="loginEmail" placeholder="${t('auth_email')}" required></div>
                <div class="form-group"><input type="password" id="loginPassword" placeholder="${t('auth_password')}" required></div>
                <button type="submit" class="btn btn--primary btn--full">${t('auth_login_btn')}</button>
                <p class="text-center" style="margin-top:15px;"><span data-translate="auth_no_account">${t('auth_no_account')}</span> <a href="#" class="auth-link" data-translate="auth_register_link">${t('auth_register_link')}</a></p>
            </form>
        </div>
    `;
    document.body.appendChild(modalDiv);
    modalDiv.classList.add('modal--open');
    
    const close = () => { modalDiv.remove(); document.body.style.overflow = 'auto'; };
    modalDiv.querySelector('.modal-overlay').addEventListener('click', close);
    modalDiv.querySelector('.modal-close').addEventListener('click', close);
    
    modalDiv.querySelector('form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = modalDiv.querySelector('#loginEmail').value;
        const password = modalDiv.querySelector('#loginPassword').value;
        
        try {
            const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                email, password
            });
            if (error) throw error;
            
            await new Promise(resolve => setTimeout(resolve, 500));
            await loadCurrentUser();
            close();
            
            const userName = currentUser?.profile?.name || currentUser?.user_metadata?.name || currentUser?.email?.split('@')[0] || 'мандрівник';
            showNotification(`Ласкаво просимо, ${userName}!`, 'success');
        } catch (error) {
            showNotification('Невірний email або пароль', 'error');
        }
    });
    
    modalDiv.querySelector('.auth-link').onclick = (e) => {
        e.preventDefault();
        close();
        showRegisterModal();
    };
    document.body.style.overflow = 'hidden';
}

async function showRegisterModal() {
    const modalDiv = document.createElement('div');
    modalDiv.className = 'modal';
    modalDiv.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
            <button class="modal-close"><i class="fa-solid fa-xmark"></i></button>
            <h3 class="modal-title" data-translate="auth_register_title">${t('auth_register_title')}</h3>
            <form class="modal-form">
                <div class="form-group"><input type="text" id="regName" placeholder="${t('auth_name')}" required></div>
                <div class="form-group"><input type="email" id="regEmail" placeholder="${t('auth_email')}" required></div>
                <div class="form-group"><input type="tel" id="regPhone" placeholder="Телефон" required></div>
                <div class="form-group"><input type="password" id="regPassword" placeholder="${t('auth_password')}" required></div>
                <button type="submit" class="btn btn--primary btn--full">${t('auth_register_btn')}</button>
                <p class="text-center" style="margin-top:15px;"><span data-translate="auth_have_account">${t('auth_have_account')}</span> <a href="#" class="auth-link" data-translate="auth_login_link">${t('auth_login_link')}</a></p>
            </form>
        </div>
    `;
    document.body.appendChild(modalDiv);
    modalDiv.classList.add('modal--open');
    
    const close = () => { modalDiv.remove(); document.body.style.overflow = 'auto'; };
    modalDiv.querySelector('.modal-overlay').addEventListener('click', close);
    modalDiv.querySelector('.modal-close').addEventListener('click', close);
    
    modalDiv.querySelector('form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = modalDiv.querySelector('#regName').value;
        const email = modalDiv.querySelector('#regEmail').value;
        const phone = modalDiv.querySelector('#regPhone').value;
        const password = modalDiv.querySelector('#regPassword').value;
        
        try {
            const { data, error } = await window.supabaseClient.auth.signUp({
                email, password,
                options: { 
                    data: { 
                        name: name,
                        phone: phone 
                    } 
                }
            });
            if (error) throw error;
            
            close();
            showNotification('Реєстрація успішна! Перевірте email для підтвердження.', 'success');
        } catch (error) {
            showNotification(error.message || 'Помилка реєстрації', 'error');
        }
    });
    
    modalDiv.querySelector('.auth-link').onclick = (e) => {
        e.preventDefault();
        close();
        showLoginModal();
    };
    document.body.style.overflow = 'hidden';
}

async function logout() {
    try {
        await window.supabaseClient.auth.signOut();
        currentUser = null;
        saveAuthState(null);
        updateAuthUI();
        showNotification('Ви вийшли з системи', 'info');
    } catch (error) {
        console.error('Помилка виходу:', error);
    }
}

window.showLoginModal = showLoginModal;
window.showRegisterModal = showRegisterModal;
window.logout = logout;

// ===== МОДАЛЬНЕ ВІКНО КОНСУЛЬТАЦІЇ =====
async function openConsultationModal() {
    if (!window.supabaseClient) {
        showNotification('Помилка підключення', 'error');
        return;
    }
    
    const { data: routes } = await window.supabaseClient
        .from('routes')
        .select('id, name, name_en')
        .eq('is_active', true);
    
    const isLoggedIn = currentUser !== null;
    const userData = isLoggedIn ? {
        name: currentUser?.profile?.name || '',
        email: currentUser?.email || '',
        phone: currentUser?.profile?.phone || ''
    } : { name: '', email: '', phone: '' };
    
    const modalDiv = document.createElement('div');
    modalDiv.className = 'modal';
    modalDiv.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
            <button class="modal-close"><i class="fa-solid fa-xmark"></i></button>
            <h3 class="modal-title">${t('modal_consultation_title')}</h3>
            <form class="modal-form" id="consultationFormDynamic">
                <div class="form-group">
                    <label>${t('modal_name')} ${isLoggedIn ? '' : '*'}</label>
                    <input type="text" id="consultName" value="${userData.name.replace(/"/g, '&quot;')}" placeholder="${t('modal_name')}" ${!isLoggedIn ? 'required' : ''}>
                </div>
                <div class="form-group">
                    <label>Email ${isLoggedIn ? '' : '*'}</label>
                    <input type="email" id="consultEmail" value="${userData.email.replace(/"/g, '&quot;')}" placeholder="${t('modal_email')}" ${!isLoggedIn ? 'required' : ''}>
                </div>
                <div class="form-group">
                    <label>Телефон ${isLoggedIn ? '' : '*'}</label>
                    <input type="tel" id="consultPhone" value="${userData.phone.replace(/"/g, '&quot;')}" placeholder="${t('modal_phone')}" ${!isLoggedIn ? 'required' : ''}>
                </div>
                <div class="form-group">
                    <label>Оберіть маршрут *</label>
                    <select id="consultRoute" required>
                        <option value="" disabled selected>${t('modal_route_placeholder')}</option>
                        ${routes.map(route => `
                            <option value="${route.id}">${currentLang === 'uk' ? route.name.replace(/"/g, '&quot;') : route.name_en.replace(/"/g, '&quot;')}</option>
                        `).join('')}
                    </select>
                </div>
                <button type="submit" class="btn btn--primary btn--full">${t('modal_submit')}</button>
                ${isLoggedIn ? '<p class="text-center" style="margin-top:15px; font-size:12px; color:#888;">Ваші дані автоматично підставлені з профілю</p>' : ''}
            </form>
        </div>
    `;
    document.body.appendChild(modalDiv);
    modalDiv.classList.add('modal--open');
    
    const close = () => { modalDiv.remove(); document.body.style.overflow = 'auto'; };
    modalDiv.querySelector('.modal-overlay').addEventListener('click', close);
    modalDiv.querySelector('.modal-close').addEventListener('click', close);
    
    modalDiv.querySelector('#consultationFormDynamic').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = modalDiv.querySelector('#consultName').value || userData.name;
        const phone = modalDiv.querySelector('#consultPhone').value || userData.phone;
        const email = modalDiv.querySelector('#consultEmail').value || userData.email;
        const routeId = modalDiv.querySelector('#consultRoute').value;
        const routeName = modalDiv.querySelector('#consultRoute').options[modalDiv.querySelector('#consultRoute').selectedIndex]?.text;
        
        if (!name || !phone || !email || !routeId) {
            showNotification('Заповніть всі поля', 'warning');
            return;
        }
        
        try {
            const { error } = await window.supabaseClient
                .from('consultations')
                .insert([{ 
                    name, 
                    phone, 
                    email, 
                    route_interest: routeName,
                    status: 'new'
                }]);
            if (error) throw error;
            
            close();
            showNotification('Дякуємо! Ми зв\'яжемося з вами найближчим часом.', 'success');
        } catch (error) {
            showNotification('Помилка надсилання. Спробуйте пізніше.', 'error');
        }
    });
    
    document.body.style.overflow = 'hidden';
}

const consultationBtn = document.getElementById('openModalBtn');
if (consultationBtn) {
    consultationBtn.onclick = openConsultationModal;
}

// ===== ВІДГУКИ =====
let reviewModal = null;

async function openReviewModal() {
    if (!currentUser) {
        showNotification(t('add_review_btn') === 'Залишити відгук' ? 'Увійдіть, щоб залишити відгук' : 'Please login to leave a review', 'warning');
        return;
    }
    if (reviewModal) reviewModal.remove();
    
    reviewModal = document.createElement('div');
    reviewModal.className = 'modal';
    reviewModal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
            <button class="modal-close"><i class="fa-solid fa-xmark"></i></button>
            <h3 class="modal-title" data-translate="add_review_btn">${t('add_review_btn')}</h3>
            <form class="modal-form">
                <div class="form-group">
                    <label>Оцінка:</label>
                    <select id="reviewRating">
                        <option value="5">★★★★★ (5)</option>
                        <option value="4">★★★★☆ (4)</option>
                        <option value="3">★★★☆☆ (3)</option>
                        <option value="2">★★☆☆☆ (2)</option>
                        <option value="1">★☆☆☆☆ (1)</option>
                    </select>
                </div>
                <div class="form-group"><textarea id="reviewText" rows="4" placeholder="${t('add_review_btn') === 'Залишити відгук' ? 'Ваш відгук...' : 'Your review...'}" required></textarea></div>
                <button type="submit" class="btn btn--primary btn--full" data-translate="add_review_btn">${t('add_review_btn')}</button>
                <p class="text-center" style="margin-top:15px; font-size:12px; color:#888;">Відгук буде опубліковано після перевірки адміністратором</p>
            </form>
        </div>
    `;
    document.body.appendChild(reviewModal);
    reviewModal.classList.add('modal--open');
    
    const close = () => { reviewModal.remove(); reviewModal = null; document.body.style.overflow = 'auto'; };
    reviewModal.querySelector('.modal-overlay').addEventListener('click', close);
    reviewModal.querySelector('.modal-close').addEventListener('click', close);
    
    reviewModal.querySelector('form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const rating = parseInt(reviewModal.querySelector('#reviewRating').value);
        const text = reviewModal.querySelector('#reviewText').value;
        
        if (!text.trim()) {
            showNotification('Напишіть відгук', 'warning');
            return;
        }
        
        try {
            const { error } = await window.supabaseClient
                .from('reviews')
                .insert([{
                    user_id: currentUser.id,
                    user_name: currentUser?.profile?.name || currentUser?.email?.split('@')[0],
                    review_text: text,
                    rating: rating,
                    is_approved: false
                }]);
            if (error) throw error;
            
            close();
            showNotification('Дякуємо за відгук! Він буде опублікований після перевірки.', 'success');
        } catch (error) {
            showNotification('Помилка надсилання відгуку', 'error');
        }
    });
    document.body.style.overflow = 'hidden';
}

async function renderTestimonials() {
    const container = document.getElementById('testimonials-container');
    if (!container) return;
    
    try {
        if (!window.supabaseClient) {
            container.innerHTML = '<p style="text-align:center;">Помилка підключення</p>';
            return;
        }
        
        const { data: reviews } = await window.supabaseClient
            .from('reviews')
            .select('*')
            .eq('is_approved', true)
            .order('created_at', { ascending: false })
            .limit(6);
        
        container.innerHTML = (reviews || []).map(review => `
            <div class="testimonial-card">
                <div class="testimonial-avatar">
                    <div class="avatar-placeholder">${escapeHtml(review.user_name?.charAt(0).toUpperCase() || '?')}</div>
                </div>
                <div class="testimonial-content">
                    <div style="margin-bottom: 8px;">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
                    <p class="testimonial-text">"${escapeHtml(review.review_text)}"</p>
                    <p class="testimonial-author">— ${escapeHtml(review.user_name)}</p>
                    <p class="testimonial-date">${new Date(review.created_at).toLocaleDateString()}</p>
                </div>
            </div>
        `).join('');
        
        if (!document.getElementById('addReviewBtn')) {
            const btn = document.createElement('button');
            btn.id = 'addReviewBtn';
            btn.className = 'add-review-btn';
            btn.setAttribute('data-translate', 'add_review_btn');
            btn.innerHTML = t('add_review_btn');
            btn.onclick = openReviewModal;
            container.parentElement.appendChild(btn);
        } else {
            const btn = document.getElementById('addReviewBtn');
            btn.setAttribute('data-translate', 'add_review_btn');
            btn.innerHTML = t('add_review_btn');
        }
    } catch (error) {
        console.error('Помилка завантаження відгуків:', error);
        container.innerHTML = '<p style="text-align:center;">Помилка завантаження відгуків</p>';
    }
}

window.openReviewModal = openReviewModal;

// ===== ПОПУЛЯРНІ МАРШРУТИ (З SUPABASE) =====
async function renderPopularRoutes() {
    const container = document.getElementById('popular-routes-container');
    if (!container) return;

    try {
        if (!window.supabaseClient) {
            container.innerHTML = '<p style="text-align:center;">Помилка підключення</p>';
            return;
        }
        
        const { data: routes, error } = await window.supabaseClient
            .from('routes')
            .select('*')
            .eq('is_active', true)
            .limit(3);
        
        if (error) throw error;
        
        if (!routes || routes.length === 0) {
            container.innerHTML = '<p style="text-align:center;">Завантаження маршрутів...</p>';
            return;
        }
        
        const lang = window.currentLang || localStorage.getItem('language') || 'uk';
        
        container.innerHTML = routes.map(route => `
            <div class="route-card">
                <div class="route-image-container">
                    <img class="route-image" src="${route.image_url}" alt="${lang === 'uk' ? route.name : route.name_en}" loading="lazy" onerror="this.src='assets/images/placeholder.jpg'">
                    <span class="route-price">${route.price} грн</span>
                </div>
                <div class="route-content">
                    <h3 class="route-title">${escapeHtml(lang === 'uk' ? route.name : route.name_en)}</h3>
                    <p class="route-region">
                        <svg class="icon icon-small" width="16" height="16">
                            <use xlink:href="assets/images/icons/sprite.svg#icon-location"></use>
                        </svg>
                        ${escapeHtml(lang === 'uk' ? route.region_name : route.region_name_en)}
                    </p>
                    <p class="route-description">${escapeHtml(lang === 'uk' ? route.description.substring(0, 100) : route.description_en.substring(0, 100))}...</p>
                    <div class="route-meta">
                        <span class="meta-item">
                            <svg class="icon icon-small" width="14" height="14">
                                <use xlink:href="assets/images/icons/sprite.svg#icon-clock"></use>
                            </svg>
                            ${escapeHtml(lang === 'uk' ? route.duration : route.duration_en)}
                        </span>
                        <span class="meta-item difficulty-${route.difficulty}">
                            <svg class="icon icon-small" width="14" height="14">
                                <use xlink:href="assets/images/icons/sprite.svg#icon-mountain"></use>
                            </svg>
                            ${route.difficulty === 'medium' ? (lang === 'uk' ? 'середньо' : 'medium') : (lang === 'uk' ? 'легко' : 'easy')}
                        </span>
                    </div>
                    <div class="route-actions">
                        <a href="route-detail.html?id=${route.id}" class="btn btn--outline btn--small">
                            <svg class="icon icon-small" width="14" height="14">
                                <use xlink:href="assets/images/icons/sprite.svg#icon-route"></use>
                            </svg>
                            ${t('route_detail_btn')}
                        </a>
                    </div>
                </div>
            </div>
        `).join('');
    } catch(e) {
        console.error('Помилка завантаження популярних маршрутів:', e);
        container.innerHTML = '<p style="text-align:center;">Помилка завантаження маршрутів</p>';
    }
}

// ===== ПІДПИСКА НА НОВИНИ =====
async function handleNewsletterSubscribe(email) {
    try {
        if (!window.supabaseClient) {
            showNotification('Помилка підключення', 'error');
            return false;
        }
        
        const { error } = await window.supabaseClient
            .from('newsletter_subscribers')
            .insert([{ email }]);
        if (error && error.code === '23505') {
            showNotification('Ви вже підписані на новини!', 'info');
            return true;
        }
        if (error) throw error;
        showNotification('Дякуємо за підписку!', 'success');
        return true;
    } catch (error) {
        showNotification('Помилка підписки. Спробуйте пізніше.', 'error');
        return false;
    }
}

// Додаємо обробник для форми підписки в футері
document.addEventListener('DOMContentLoaded', () => {
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const input = newsletterForm.querySelector('input[type="email"]');
            if (input && input.value) {
                await handleNewsletterSubscribe(input.value);
                input.value = '';
            }
        });
    }
});

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ===== ІНІЦІАЛІЗАЦІЯ =====
(async function init() {
    await loadTranslations(currentLang);
    updateAllTexts();
    updateSelectedLangText();
    preloadAuthFromCache();
    await loadCurrentUser();
    
    if (document.getElementById('popular-routes-container')) {
        await renderPopularRoutes();
    }
    if (document.getElementById('testimonials-container')) {
        await renderTestimonials();
    }
    
    document.body.classList.add('loaded');
})();
