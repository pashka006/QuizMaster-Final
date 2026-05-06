import { API } from './api.js';
const form = document.getElementById('regForm');
if (form) form.onsubmit = async (e) => {
    e.preventDefault();
    const data = await API.register({ username: form.username.value, password: form.password.value });
    if (data.success) { alert('Успіх!'); window.location.href = '/login.html'; }
    else document.getElementById('msg').innerText = data.error;
};