// ===== НОТИФІКАЦІЇ =====
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

// ===== ФУНКЦІЯ ВІДПРАВКИ EMAIL ПРО СТАТУС =====
async function sendStatusEmail(booking, newStatus) {
    if (typeof emailjs === 'undefined') {
        console.warn('EmailJS не підключено');
        return false;
    }
    
    try {
        let templateId = '';
        let statusText = '';
        
        if (newStatus === 'confirmed') {
            templateId = 'template_j9j53yu';
            statusText = 'ПІДТВЕРДЖЕНО';
        } else if (newStatus === 'cancelled') {
            templateId = 'template_ncmv16j';
            statusText = 'СКАСОВАНО';
        } else {
            return false;
        }
        
        const templateParams = {
            to_email: booking.email,
            to_name: booking.name,
            name: booking.name,
            routeName: booking.routes?.name || 'Маршрут',
            date: booking.booking_date,
            people: booking.people_count,
            totalPrice: booking.total_price,
            phone: booking.phone,
            status: statusText,
            status_message: newStatus === 'confirmed' 
                ? 'Ваше бронювання підтверджено! Чекаємо на вас.' 
                : 'На жаль, ваше бронювання скасовано. Зв\'яжіться з нами для деталей.'
        };
        
        console.log(`📧 Відправка ${newStatus} email на ${booking.email}`);
        
        const result = await emailjs.send('service_jjy0v9l', templateId, templateParams);
        console.log(`✅ Email про ${newStatus} відправлено!`, result);
        return true;
        
    } catch (error) {
        console.error(`❌ Помилка відправки email про ${newStatus}:`, error);
        return false;
    }
}

// ===== ПЕРЕВІРКА АДМІНА =====
async function checkAdmin() {
    try {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) {
            window.location.href = 'index.html';
            return null;
        }
        const { data: profile } = await window.supabaseClient
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
        if (profile?.role !== 'admin') {
            window.location.href = 'index.html';
            return null;
        }
        return user;
    } catch (error) {
        console.error('Помилка перевірки адміна:', error);
        window.location.href = 'index.html';
        return null;
    }
}

// ===== СТАТИСТИКА =====
async function loadStats() {
    try {
        const [reviews, consultations, bookings, subscribers, routes] = await Promise.all([
            window.supabaseClient.from('reviews').select('*', { count: 'exact', head: true }),
            window.supabaseClient.from('consultations').select('*', { count: 'exact', head: true }),
            window.supabaseClient.from('bookings').select('*', { count: 'exact', head: true }),
            window.supabaseClient.from('newsletter_subscribers').select('*', { count: 'exact', head: true }),
            window.supabaseClient.from('routes').select('*', { count: 'exact', head: true })
        ]);
        
        const pendingReviews = await window.supabaseClient
            .from('reviews')
            .select('*', { count: 'exact', head: true })
            .eq('is_approved', false);
        
        document.getElementById('reviewsCount').textContent = reviews.count || 0;
        document.getElementById('pendingReviewsCount').textContent = pendingReviews.count || 0;
        document.getElementById('consultationsCount').textContent = consultations.count || 0;
        document.getElementById('bookingsCount').textContent = bookings.count || 0;
        document.getElementById('subscribersCount').textContent = subscribers.count || 0;
        document.getElementById('routesCount').textContent = routes.count || 0;
    } catch (error) {
        console.error('Помилка статистики:', error);
    }
}

// ===== ВІДГУКИ =====
async function loadReviews() {
    const { data } = await window.supabaseClient
        .from('reviews')
        .select('*')
        .eq('is_approved', false)
        .order('created_at', { ascending: false });
    
    const tbody = document.getElementById('reviewsTable');
    if (!data?.length) {
        tbody.innerHTML = '<tr><td colspan="5">Немає відгуків на перевірці</td></tr>';
        return;
    }
    
    tbody.innerHTML = data.map(review => `
        <tr>
            <td>${review.id}</td>
            <td>${escapeHtml(review.user_name)}</td>
            <td>${escapeHtml(review.review_text.substring(0, 100))}...</td>
            <td>${'★'.repeat(review.rating)}</td>
            <td>
                <button class="btn-approve" onclick="approveReview(${review.id})">✅ Схвалити</button>
                <button class="btn-delete" onclick="deleteReview(${review.id})">🗑️ Видалити</button>
            </td>
        </tr>
    `).join('');
}

window.approveReview = async (id) => {
    const { error } = await window.supabaseClient
        .from('reviews')
        .update({ is_approved: true })
        .eq('id', id);
    if (!error) {
        showNotification('Відгук схвалено', 'success');
        loadReviews();
        loadStats();
    }
};

window.deleteReview = async (id) => {
    if (confirm('Видалити відгук?')) {
        const { error } = await window.supabaseClient
            .from('reviews')
            .delete()
            .eq('id', id);
        if (!error) {
            showNotification('Відгук видалено', 'success');
            loadReviews();
            loadStats();
        }
    }
};

// ===== КОНСУЛЬТАЦІЇ =====
async function loadConsultations() {
    const { data } = await window.supabaseClient
        .from('consultations')
        .select('*')
        .order('created_at', { ascending: false });
    
    const tbody = document.getElementById('consultationsTable');
    if (!data?.length) {
        tbody.innerHTML = '<tr><td colspan="8">Немає консультацій</td></tr>';
        return;
    }
    
    tbody.innerHTML = data.map(cons => `
        <tr>
            <td>${cons.id}</td>
            <td>${escapeHtml(cons.name)}</td>
            <td>${escapeHtml(cons.phone)}</td>
            <td>${escapeHtml(cons.email)}</td>
            <td>${escapeHtml(cons.route_interest || '-')}</td>
            <td>${new Date(cons.created_at).toLocaleDateString()}</td>
            <td>
                <select onchange="updateConsultationStatus(${cons.id}, this.value)">
                    <option value="new" ${cons.status === 'new' ? 'selected' : ''}>🆕 Нова</option>
                    <option value="processed" ${cons.status === 'processed' ? 'selected' : ''}>📞 Опрацьовано</option>
                    <option value="completed" ${cons.status === 'completed' ? 'selected' : ''}>✅ Завершено</option>
                </select>
            </td>
            <td><button class="btn-delete" onclick="deleteConsultation(${cons.id})">🗑️</button></td>
        </tr>
    `).join('');
}

window.updateConsultationStatus = async (id, newStatus) => {
    try {
        const { error } = await window.supabaseClient
            .from('consultations')
            .update({ status: newStatus })
            .eq('id', id);
        
        if (error) throw error;
        
        let statusText = '';
        switch(newStatus) {
            case 'new': statusText = 'Нова'; break;
            case 'processed': statusText = 'Опрацьовано'; break;
            case 'completed': statusText = 'Завершено'; break;
        }
        
        showNotification(`Статус змінено на "${statusText}"`, 'success');
        loadConsultations();
        loadStats();
        
    } catch (error) {
        console.error('Помилка оновлення статусу:', error);
        showNotification('Помилка оновлення статусу', 'error');
    }
};

window.deleteConsultation = async (id) => {
    if (confirm('Видалити заявку?')) {
        const { error } = await window.supabaseClient
            .from('consultations')
            .delete()
            .eq('id', id);
        if (!error) {
            showNotification('Заявку видалено', 'success');
            loadConsultations();
            loadStats();
        }
    }
};

// ===== БРОНЮВАННЯ (оновлена версія з email) =====
async function loadBookings() {
    const { data } = await window.supabaseClient
        .from('bookings')
        .select('*, routes(name)')
        .order('created_at', { ascending: false });
    
    const tbody = document.getElementById('bookingsTable');
    if (!data?.length) {
        tbody.innerHTML = '<tr><td colspan="9">Немає бронювань</td></tr>';
        return;
    }
    
    tbody.innerHTML = data.map(booking => `
        <tr>
            <td>${booking.id}</td>
            <td>${escapeHtml(booking.name)}</td>
            <td>${escapeHtml(booking.routes?.name || '-')}</td>
            <td>${booking.booking_date}</td>
            <td>${booking.people_count}</td>
            <td>${booking.total_price} грн</td>
            <td>
                <select onchange="updateBookingStatus(${booking.id}, this.value)" 
                        ${booking.status === 'completed' ? 'disabled' : ''}
                        style="${booking.status === 'completed' ? 'opacity:0.6;' : ''}">
                    <option value="pending" ${booking.status === 'pending' ? 'selected' : ''}>⏳ Очікує</option>
                    <option value="confirmed" ${booking.status === 'confirmed' ? 'selected' : ''}>✅ Підтверджено</option>
                    <option value="completed" ${booking.status === 'completed' ? 'selected' : ''}>🎉 Виконано</option>
                    <option value="cancelled" ${booking.status === 'cancelled' ? 'selected' : ''}>❌ Скасовано</option>
                </select>
            </td>
            <td>
                ${booking.status === 'confirmed' && !booking.email_sent ? 
                    '<span style="color:#ff9800;font-size:11px;">📧 Email не відправлено</span>' : 
                    booking.status === 'confirmed' && booking.email_sent ? 
                    '<span style="color:#4caf50;font-size:11px;">✅ Email відправлено</span>' : 
                    booking.status === 'cancelled' && booking.cancellation_email_sent ?
                    '<span style="color:#4caf50;font-size:11px;">📧 Скасування відправлено</span>' :
                    booking.status === 'cancelled' && !booking.cancellation_email_sent ?
                    '<span style="color:#ff9800;font-size:11px;">⚠️ Email не відправлено</span>' : '-'
                }
            </td>
            <td>
                <button class="btn-delete" onclick="deleteBooking(${booking.id})" ${booking.status === 'confirmed' ? 'disabled style="opacity:0.5;"' : ''}>🗑️</button>
            </td>
        </tr>
    `).join('');
}

window.updateBookingStatus = async (id, newStatus) => {
    try {
        const { data: booking, error: fetchError } = await window.supabaseClient
            .from('bookings')
            .select('*, routes(name)')
            .eq('id', id)
            .single();
        
        if (fetchError) throw fetchError;
        
        const { error: updateError } = await window.supabaseClient
            .from('bookings')
            .update({ 
                status: newStatus,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);
        
        if (updateError) throw updateError;
        
        if (newStatus === 'confirmed' && !booking.email_sent) {
            const emailSent = await sendStatusEmail(booking, 'confirmed');
            if (emailSent) {
                await window.supabaseClient
                    .from('bookings')
                    .update({ email_sent: true })
                    .eq('id', id);
            }
            showNotification(`Бронювання підтверджено! Email відправлено клієнту.`, 'success');
        } 
        else if (newStatus === 'cancelled' && !booking.cancellation_email_sent) {
            const emailSent = await sendStatusEmail(booking, 'cancelled');
            if (emailSent) {
                await window.supabaseClient
                    .from('bookings')
                    .update({ cancellation_email_sent: true })
                    .eq('id', id);
            }
            showNotification(`Бронювання скасовано. Email про скасування відправлено.`, 'warning');
        }
        else {
            showNotification(`Статус оновлено`, 'success');
        }
        
        loadBookings();
        loadStats();
        
    } catch (error) {
        console.error('Помилка оновлення статусу:', error);
        showNotification('Помилка оновлення статусу', 'error');
    }
};

window.deleteBooking = async (id) => {
    if (confirm('Видалити бронювання?')) {
        const { error } = await window.supabaseClient
            .from('bookings')
            .delete()
            .eq('id', id);
        if (!error) {
            showNotification('Бронювання видалено', 'success');
            loadBookings();
            loadStats();
        }
    }
};

// ===== ПІДПИСНИКИ =====
async function loadSubscribers() {
    const { data } = await window.supabaseClient
        .from('newsletter_subscribers')
        .select('*')
        .order('subscribed_at', { ascending: false });
    
    const tbody = document.getElementById('subscribersTable');
    if (!data?.length) {
        tbody.innerHTML = '<tr><td colspan="3">Немає підписників</td></tr>';
        return;
    }
    
    tbody.innerHTML = data.map(sub => `
        <tr>
            <td>${escapeHtml(sub.email)}</td>
            <td>${new Date(sub.subscribed_at).toLocaleDateString()}</td>
            <td><button class="btn-delete" onclick="deleteSubscriber('${sub.email}')">🗑️</button></td>
        </tr>
    `).join('');
}

window.deleteSubscriber = async (email) => {
    if (confirm('Видалити підписника?')) {
        const { error } = await window.supabaseClient
            .from('newsletter_subscribers')
            .delete()
            .eq('email', email);
        if (!error) {
            showNotification('Підписника видалено', 'success');
            loadSubscribers();
            loadStats();
        }
    }
};

// ===== МАРШРУТИ =====
let routesData = [];

async function loadRoutes() {
    const { data, error } = await window.supabaseClient
        .from('routes')
        .select('*')
        .order('id');
    
    if (error) {
        console.error('Помилка завантаження маршрутів:', error);
        return;
    }
    
    routesData = data || [];
    
    const tbody = document.getElementById('routesTable');
    if (!routesData.length) {
        tbody.innerHTML = '<tr><td colspan="6">Немає маршрутів</td></tr>';
        return;
    }
    
    tbody.innerHTML = routesData.map(route => `
        <tr>
            <td>${route.id}</td>
            <td>${escapeHtml(route.name)}<br><small style="color:#888;">${escapeHtml(route.name_en)}</small></td>
            <td>${escapeHtml(route.region_name)}</td>
            <td><strong style="color: var(--primary-color); font-size: 1.1rem;" id="price-${route.id}">${route.price} грн</strong></td>
            <td>${route.is_active ? '✅ Так' : '❌ Ні'}</td>
            <td>
                <button class="btn-approve" onclick="editPrice(${route.id}, '${escapeHtml(route.name)}', ${route.price})" style="background: #ff9800;">
                    <i class="fas fa-coins"></i> Змінити ціну
                </button>
            </td>
        </tr>
    `).join('');
}

window.editPrice = function(id, name, currentPrice) {
    document.getElementById('priceRouteId').value = id;
    document.getElementById('priceRouteName').value = name;
    document.getElementById('priceValue').value = currentPrice;
    document.getElementById('priceValue').defaultValue = currentPrice;
    document.getElementById('priceModal').style.display = 'flex';
};

window.closePriceModal = function() {
    document.getElementById('priceModal').style.display = 'none';
};

document.getElementById('priceForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const routeId = document.getElementById('priceRouteId').value;
    const newPrice = parseInt(document.getElementById('priceValue').value);
    const oldPrice = parseInt(document.getElementById('priceValue').defaultValue);
    
    if (!newPrice || newPrice <= 0) {
        showNotification('Введіть коректну ціну', 'warning');
        return;
    }
    
    const { error } = await window.supabaseClient
        .from('routes')
        .update({ price: newPrice, updated_at: new Date().toISOString() })
        .eq('id', parseInt(routeId));
    
    if (error) {
        showNotification('Помилка оновлення ціни', 'error');
        console.error(error);
    } else {
        showNotification(`Ціну оновлено: ${oldPrice} → ${newPrice} грн`, 'success');
        
        const priceSpan = document.getElementById(`price-${routeId}`);
        if (priceSpan) {
            priceSpan.textContent = newPrice + ' грн';
        }
        
        const routeIndex = routesData.findIndex(r => r.id === parseInt(routeId));
        if (routeIndex !== -1) {
            routesData[routeIndex].price = newPrice;
        }
        
        closePriceModal();
        loadStats();
    }
});

document.getElementById('priceModal')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('priceModal')) {
        closePriceModal();
    }
});

// ===== КОРИСТУВАЧІ =====
async function loadUsers() {
    const { data: profiles, error } = await window.supabaseClient
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
    
    const tbody = document.getElementById('usersTable');
    if (!tbody) return;
    
    if (error || !profiles?.length) {
        tbody.innerHTML = '<tr><td colspan="5">Немає користувачів</td></tr>';
        return;
    }
    
    tbody.innerHTML = profiles.map(profile => `
        <tr>
            <td style="font-family: monospace; font-size: 12px;">${profile.id.substring(0, 8)}...</td>
            <td style="word-break: break-all;">${escapeHtml(profile.email)}</td>
            <td>${escapeHtml(profile.name || '-')}</td>
            <td>
                <select onchange="changeRole('${profile.id}', this.value)" style="padding: 5px 8px; border-radius: 6px;">
                    <option value="user" ${profile.role === 'user' ? 'selected' : ''}>👤 Користувач</option>
                    <option value="admin" ${profile.role === 'admin' ? 'selected' : ''}>👑 Адмін</option>
                </select>
            </td>
            <td>
                <button class="btn-delete" onclick="deleteUser('${profile.id}')" style="padding: 4px 10px;">🗑️</button>
            </td>
        </tr>
    `).join('');
}

window.changeRole = async (userId, newRole) => {
    const { error } = await window.supabaseClient
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
    if (!error) {
        showNotification(`Роль змінено на ${newRole === 'admin' ? 'Адміна' : 'Користувача'}`, 'success');
        loadUsers();
    }
};

window.deleteUser = async (userId) => {
    if (confirm('Видалити користувача?')) {
        const { error } = await window.supabaseClient.auth.admin.deleteUser(userId);
        if (!error) {
            showNotification('Користувача видалено', 'success');
            loadUsers();
            loadStats();
        }
    }
};

// ===== ДОПОМІЖНІ ФУНКЦІЇ =====
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ===== ВКЛАДКИ =====
function initTabs() {
    const tabs = document.querySelectorAll('.admin-tab-btn');
    tabs.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`${tabId}Tab`).classList.add('active');
            
            if (tabId === 'reviews') loadReviews();
            else if (tabId === 'consultations') loadConsultations();
            else if (tabId === 'bookings') loadBookings();
            else if (tabId === 'subscribers') loadSubscribers();
            else if (tabId === 'routes') loadRoutes();
            else if (tabId === 'users') loadUsers();
        });
    });
}

// ===== ВИХІД =====
document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    await window.supabaseClient.auth.signOut();
    window.location.href = 'index.html';
});

// ===== ІНІЦІАЛІЗАЦІЯ =====
document.addEventListener('DOMContentLoaded', async () => {
    const user = await checkAdmin();
    if (!user) return;
    
    await loadStats();
    await loadRoutes();
    initTabs();
});