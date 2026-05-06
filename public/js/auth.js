import { API } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
    const authLinks = document.getElementById('auth-links');
    if (!authLinks) return;

    const data = await API.getMe();
    if (data.loggedIn) {
        authLinks.innerHTML = `
            <a href="/profile.html">Профіль (<strong>${data.username}</strong>)</a>
            ${data.role === 'Admin' ? '<a href="/admin.html">Адмін-панель</a>' : ''}
            <a href="#" id="logout-btn">Вийти</a>
        `;
        document.getElementById('logout-btn').onclick = async () => {
            await API.logout();
            window.location.href = '/';
        };
    } else {
        authLinks.innerHTML = '<a href="/login.html">Увійти</a><a href="/register.html">Реєстрація</a>';
    }
});