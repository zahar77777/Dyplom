(function initSupabase() {
    const SUPABASE_URL = 'https://cjkvwmdltpnoabsrcqwb.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqa3Z3bWRsdHBub2Fic3JjcXdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNjQxOTUsImV4cCI6MjA5NTY0MDE5NX0.rUCkZO70MdH3Gmt6fgyqo4lAiUByk3pmF2Q_p1-B0nQ';

    if (typeof supabase === 'undefined') {
        console.error('Supabase CDN не завантажився! Перевір підключення інтернету або CDN-посилання.');
        return;
    }

    try {
        window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('Supabase підключено до:', SUPABASE_URL);
    } catch (e) {
        console.error('Помилка створення Supabase клієнта:', e);
    }
})();