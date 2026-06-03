// ===== СТАТИСТИКА ДЛЯ СТОРІНКИ "ПРО НАС" =====
async function loadAboutStats() {
    const statRoutes = document.getElementById('statRoutes');
    if (!statRoutes) return;
    
    try {
        // 1. Кількість маршрутів
        const { count: routesCount } = await window.supabaseClient
            .from('routes')
            .select('*', { count: 'exact', head: true });
        
        // 2. Відсоток схвалених відгуків
        const { count: totalReviews } = await window.supabaseClient
            .from('reviews')
            .select('*', { count: 'exact', head: true });
        
        const { count: approvedReviews } = await window.supabaseClient
            .from('reviews')
            .select('*', { count: 'exact', head: true })
            .eq('is_approved', true);
        
        const positivePercent = totalReviews > 0 ? Math.round((approvedReviews / totalReviews) * 100) : 100;
        
        // 3. Кількість областей
        const { data: regions } = await window.supabaseClient
            .from('routes')
            .select('region_name');
        
        const regionsCount = [...new Set(regions?.map(r => r.region_name) || [])].length;
        
        // 4. Кількість користувачів
        const { count: travelersCount } = await window.supabaseClient
            .from('profiles')
            .select('*', { count: 'exact', head: true });
        
        // Оновлюємо HTML
        document.getElementById('statRoutes').textContent = routesCount || 0;
        document.getElementById('statTravelers').textContent = travelersCount || 0;
        document.getElementById('statRegions').textContent = regionsCount || 0;
        document.getElementById('statReviews').textContent = positivePercent + '%';
        
    } catch (error) {
        console.error('Помилка:', error);
    }
}

document.addEventListener('DOMContentLoaded', loadAboutStats);