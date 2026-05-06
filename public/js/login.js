import { API } from './api.js';
const form = document.getElementById('loginForm');
if (form) form.onsubmit = async (e) => {
    e.preventDefault();
    const data = await API.login({ username: form.username.value, password: form.password.value });
    if (data.success) window.location.href = '/';
    else document.getElementById('msg').innerText = data.error;
};