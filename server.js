const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'quiz_super_secret_key',
    resave: false,
    saveUninitialized: false
}));

const db = new sqlite3.Database('./database.sqlite');

// Створення таблиць
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS Users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password_hash TEXT, role TEXT DEFAULT 'User')`);
    db.run(`CREATE TABLE IF NOT EXISTS Quizzes (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, description TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS Questions (id INTEGER PRIMARY KEY AUTOINCREMENT, quiz_id INTEGER, text TEXT, FOREIGN KEY(quiz_id) REFERENCES Quizzes(id) ON DELETE CASCADE)`);
    db.run(`CREATE TABLE IF NOT EXISTS Answers (id INTEGER PRIMARY KEY AUTOINCREMENT, question_id INTEGER, text TEXT, is_correct BOOLEAN, FOREIGN KEY(question_id) REFERENCES Questions(id) ON DELETE CASCADE)`);
    db.run(`CREATE TABLE IF NOT EXISTS Results (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, quiz_id INTEGER, score INTEGER, completed_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);

    db.get("SELECT * FROM Users WHERE username = 'admin'", async (err, row) => {
        if (!row) {
            const hash = await bcrypt.hash('admin123', 10);
            db.run("INSERT INTO Users (username, password_hash, role) VALUES (?, ?, ?)", ['admin', hash, 'Admin']);
        }
    });
});

// --- API МАРШРУТИ ---

app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    db.run("INSERT INTO Users (username, password_hash) VALUES (?, ?)", [username, hash], (err) => {
        if (err) return res.status(400).json({ success: false, error: 'Користувач вже існує' });
        res.json({ success: true });
    });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM Users WHERE username = ?", [username], async (err, user) => {
        if (!user || !(await bcrypt.compare(password, user.password_hash))) return res.status(401).json({ error: 'Помилка входу' });
        req.session.userId = user.id;
        req.session.role = user.role;
        req.session.username = user.username;
        res.json({ success: true, role: user.role, username: user.username });
    });
});

app.get('/api/me', (req, res) => {
    res.json(req.session.userId ? { loggedIn: true, username: req.session.username, role: req.session.role } : { loggedIn: false });
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

app.get('/api/quizzes', (req, res) => {
    const search = req.query.search || '';
    db.all("SELECT * FROM Quizzes WHERE title LIKE ?", [`%${search}%`], (err, rows) => res.json(rows));
});

app.post('/api/quizzes', (req, res) => {
    if (req.session.role !== 'Admin') return res.status(403).json({ error: 'Недостатньо прав' });
    const { title, description } = req.body;
    db.run("INSERT INTO Quizzes (title, description) VALUES (?, ?)", [title, description], function(err) {
        if (err) return res.status(500).json({ error: 'DB Error' });
        res.json({ success: true, quizId: this.lastID });
    });
});

app.get('/api/quizzes/:id/questions', (req, res) => {
    db.all("SELECT * FROM Questions WHERE quiz_id = ?", [req.params.id], (err, questions) => {
        if (!questions) return res.json([]);
        db.all("SELECT * FROM Answers WHERE question_id IN (SELECT id FROM Questions WHERE quiz_id = ?)", [req.params.id], (err, answers) => {
            res.json(questions.map(q => ({ ...q, answers: answers.filter(a => a.question_id === q.id) })));
        });
    });
});

app.post('/api/questions', (req, res) => {
    if (req.session.role !== 'Admin') return res.status(403).json({ error: 'Недостатньо прав' });
    const { quizId, text, correct_answer, wrong_answer1, wrong_answer2 } = req.body;
    db.run("INSERT INTO Questions (quiz_id, text) VALUES (?, ?)", [quizId, text], function(err) {
        if (err) return res.status(500).json({ error: 'Error saving question' });
        const questionId = this.lastID;
        const stmt = db.prepare("INSERT INTO Answers (question_id, text, is_correct) VALUES (?, ?, ?)");
        stmt.run(questionId, correct_answer, 1);
        stmt.run(questionId, wrong_answer1, 0);
        stmt.run(questionId, wrong_answer2, 0);
        stmt.finalize(() => res.json({ success: true }));
    });
});

// --- РЕЗУЛЬТАТИ---
app.post('/api/results', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Auth required' });
    const { quizId, score } = req.body;
    // Використовуємо ISO формат для точного часу
    const now = new Date().toISOString();
    db.run("INSERT INTO Results (user_id, quiz_id, score, completed_at) VALUES (?, ?, ?, ?)",
        [req.session.userId, quizId, score, now], () => res.json({ success: true }));
});

app.get('/api/my-results', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Auth required' });
    const sql = `
        SELECT Results.score, Results.completed_at, Quizzes.title 
        FROM Results 
        JOIN Quizzes ON Results.quiz_id = Quizzes.id 
        WHERE Results.user_id = ? 
        ORDER BY Results.completed_at DESC
    `;
    db.all(sql, [req.session.userId], (err, rows) => res.json(rows || []));
});

app.listen(PORT, () => console.log(`Server: http://localhost:${PORT}`));