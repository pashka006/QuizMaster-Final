import { API } from './api.js';

const addQuizForm = document.getElementById('addQuizForm');
const addQuestionForm = document.getElementById('addQuestionForm');
const quizSelect = document.getElementById('quizSelect');

// 1. Завантаження списку вікторин
async function loadQuizzes() {
    try {
        const quizzes = await API.getQuizzes();
        console.log("Вікторини завантажено:", quizzes);
        if (quizSelect) {
            quizSelect.innerHTML = '<option value="">Оберіть вікторину...</option>' +
                quizzes.map(q => `<option value="${q.id}">${q.title}</option>`).join('');
        }
    } catch (err) {
        console.error("Помилка завантаження списку:", err);
    }
}

// 2. Створення вікторини
if (addQuizForm) {
    addQuizForm.onsubmit = async (e) => {
        e.preventDefault();
        console.log("Спроба створити вікторину...");

        const payload = {
            title: document.getElementById('qTitle').value,
            description: document.getElementById('qDesc').value
        };

        try {
            const res = await fetch('/api/quizzes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            console.log("Відповідь сервера (Quiz):", data);

            if (data.success) {
                alert('Успіх: Вікторину створено!');
                addQuizForm.reset();
                await loadQuizzes();
            } else {
                alert('Помилка сервера: ' + (data.error || 'Доступ заборонено'));
            }
        } catch (err) {
            console.error("Помилка при запиті:", err);
            alert("Критична помилка. Перевір консоль (F12)");
        }
    };
}

// 3. Додавання запитання
if (addQuestionForm) {
    addQuestionForm.onsubmit = async (e) => {
        e.preventDefault();
        console.log("Спроба додати запитання...");

        const quizId = quizSelect.value;
        if (!quizId) return alert('Оберіть вікторину зі списку!');

        const payload = {
            quizId: parseInt(quizId),
            text: document.getElementById('qText').value,
            correct_answer: document.getElementById('ansCorrect').value,
            wrong_answer1: document.getElementById('ansWrong1').value,
            wrong_answer2: document.getElementById('ansWrong2').value
        };

        try {
            const res = await fetch('/api/questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            console.log("Відповідь сервера (Question):", data);

            if (data.success) {
                alert('Успіх: Запитання додано!');
                addQuestionForm.reset();
            } else {
                alert('Помилка: ' + (data.error || 'Не вдалося зберегти'));
            }
        } catch (err) {
            console.error("Помилка при запиті:", err);
        }
    };
}

loadQuizzes();