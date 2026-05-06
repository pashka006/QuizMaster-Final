import { API } from './api.js';

const list = document.getElementById('quiz-list');
const searchInput = document.getElementById('searchInput');

async function render(query = '') {
    const quizzes = await API.getQuizzes(query);
    list.innerHTML = quizzes.length ? quizzes.map(q => `
        <div class="card">
            <h3>${q.title}</h3>
            <p>${q.description || ''}</p>
            <a href="/quiz.html?id=${q.id}"><button>Пройти тест</button></a>
        </div>
    `).join('') : '<p>Вікторин не знайдено.</p>';
}

if (searchInput) searchInput.oninput = (e) => render(e.target.value);
render();