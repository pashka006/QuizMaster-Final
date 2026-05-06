import { API } from './api.js';

let currentQuestions = [];
let currentKahootIndex = 0;
let kahootScore = 0;

const urlParams = new URLSearchParams(window.location.search);
const quizId = urlParams.get('id');
const container = document.getElementById('quiz-container');

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

async function loadQuiz() {
    if (!quizId) {
        container.innerHTML = `<h2 style="text-align:center;">Помилка: Тест не знайдено.</h2>`;
        return;
    }

    const questions = await API.getQuestions(quizId);
    if (questions.length === 0) {
        container.innerHTML = '<p style="text-align:center;">У цій вікторині ще немає питань.</p>';
        return;
    }

    currentQuestions = questions.map(q => ({
        ...q,
        answers: shuffleArray(q.answers)
    }));

    renderModeSelection();
}

function renderModeSelection() {
    container.innerHTML = `
        <h2 style="text-align: center; margin-bottom: 20px;">Оберіть режим проходження</h2>
        <div class="mode-container">
            <button class="mode-btn" id="start-classic" style="background: #0066cc;">Класичний (Усі питання)</button>
            <button class="mode-btn" id="start-kahoot" style="background: #8e44ad;">Kahoot (По одному)</button>
        </div>`;

    document.getElementById('start-classic').onclick = startClassicMode;
    document.getElementById('start-kahoot').onclick = startKahootMode;
}

// --- РЕЖИМ 1: КЛАСИЧНИЙ ---
function startClassicMode() {
    let html = '<h2>Дайте відповіді на питання:</h2><form id="quizForm">';
    currentQuestions.forEach((q, index) => {
        html += `<div class="question-block">
            <p><strong>${index + 1}. ${q.text}</strong></p>`;
        q.answers.forEach(a => {
            html += `
                <label class="answer-option">
                    <input type="radio" name="question_${q.id}" value="${a.is_correct ? 1 : 0}" required>
                    ${a.text}
                </label>`;
        });
        html += '</div>';
    });
    html += '<button type="submit" style="background:#28a745; margin-top:10px;">Завершити тест</button></form>';
    container.innerHTML = html;

    document.getElementById('quizForm').onsubmit = (e) => {
        e.preventDefault();
        let score = 0;
        new FormData(e.target).forEach(value => { if (value === "1") score++; });
        finishQuiz(score);
    };
}

// --- РЕЖИМ 2: KAHOOT ---
function startKahootMode() {
    currentKahootIndex = 0;
    kahootScore = 0;
    renderKahootQuestion();
}

function renderKahootQuestion() {
    const q = currentQuestions[currentKahootIndex];
    container.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <span style="color: #666;">Питання ${currentKahootIndex + 1} з ${currentQuestions.length}</span>
            <h2 style="margin-top: 10px;">${q.text}</h2>
        </div>
        <div id="kahoot-answers"></div>`;

    const btnContainer = document.getElementById('kahoot-answers');
    q.answers.forEach(a => {
        const btn = document.createElement('button');
        btn.className = 'kahoot-btn';
        btn.textContent = a.text;
        btn.onclick = () => {
            if (a.is_correct) kahootScore++;
            currentKahootIndex++;
            if (currentKahootIndex >= currentQuestions.length) finishQuiz(kahootScore);
            else renderKahootQuestion();
        };
        btnContainer.appendChild(btn);
    });
}

async function finishQuiz(score) {
    const percent = Math.round((score / currentQuestions.length) * 100);

    container.innerHTML = `
        <h2 style="text-align: center;">Тест завершено!</h2>
        <p style="text-align: center; font-size: 1.2rem; margin: 20px 0;">
            Ваш результат: <strong>${percent}%</strong> (${score} з ${currentQuestions.length})
        </p>
        <a href="/catalog.html"><button style="max-width: 250px; margin: 0 auto; display: block;">До каталогу</button></a>`;

    await API.saveResult({ quizId, score: percent });
}

loadQuiz();