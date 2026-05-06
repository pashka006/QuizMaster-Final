export const API = {
    async fetchJSON(url, options = {}) {
        const response = await fetch(url, options);
        return await response.json();
    },
    getMe: () => API.fetchJSON('/api/me'),
    logout: () => API.fetchJSON('/api/logout', { method: 'POST' }),
    getQuizzes: (query = '') => API.fetchJSON(`/api/quizzes?search=${query}`),
    getQuestions: (id) => API.fetchJSON(`/api/quizzes/${id}/questions`),
    saveResult: (data) => API.fetchJSON('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }),
    login: (creds) => API.fetchJSON('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creds)
    }),
    register: (creds) => API.fetchJSON('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creds)
    })
};