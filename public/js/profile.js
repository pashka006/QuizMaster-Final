async function loadResults() {
    const res = await fetch('/api/my-results');
    const results = await res.json();
    const tableBody = document.getElementById('results-table');

    if (!tableBody) return;

    if (results.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3">Ви ще не проходили тестів.</td></tr>';
        return;
    }

    tableBody.innerHTML = results.map(r => {

        let displayScore = r.score;
        if (r.score <= 5 && r.score > 0) {
            displayScore = "Тест пройдено (старий формат)";
        } else {
            displayScore = r.score + "%";
        }

        return `
        <tr>
            <td>${r.title}</td>
            <td><strong>${displayScore}</strong></td>
            <td>${new Date(r.completed_at).toLocaleString('uk-UA')}</td>
        </tr>
    `}).join('');
}

loadResults();