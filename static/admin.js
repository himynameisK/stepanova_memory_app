async function loadImages() {
    try {
        const response = await fetch('/api/images');
        const images = await response.json();
        
        const imagesList = document.getElementById('images-list');
        imagesList.innerHTML = '';
        
        const sortedNumbers = Object.keys(images).map(Number).sort((a, b) => a - b);
        
        sortedNumbers.forEach(number => {
            const image = images[number];
            const card = document.createElement('div');
            card.className = 'image-card';
            card.innerHTML = `
                <div class="image-preview">
                    <img src="/img/${image.filename}" alt="${image.name}">
                </div>
                <div class="image-info">
                    <strong>${number}</strong> - ${image.name}
                </div>
            `;
            imagesList.appendChild(card);
        });
    } catch (error) {
        console.error('Ошибка при загрузке изображений:', error);
        document.getElementById('images-list').innerHTML = 
            '<p class="error">Ошибка при загрузке изображений</p>';
    }
}

async function loadResults() {
    try {
        const response = await fetch('/api/results');
        const results = await response.json();
        
        const resultsList = document.getElementById('results-list');
        
        if (results.length === 0) {
            resultsList.innerHTML = '<p>Результатов пока нет</p>';
            return;
        }
        
        resultsList.innerHTML = '<table class="results-table"><thead><tr><th>Дата</th><th>Уровень</th><th>Верных ответов</th><th>Всего вопросов</th><th>Процент</th></tr></thead><tbody></tbody></table>';
        
        const tbody = resultsList.querySelector('tbody');
        results.reverse().forEach(result => {
            const row = document.createElement('tr');
            const date = new Date(result.timestamp);
            row.innerHTML = `
                <td>${date.toLocaleString('ru-RU')}</td>
                <td>${result.level === 'simple' ? 'Простой' : result.level}</td>
                <td>${result.correct}</td>
                <td>${result.total}</td>
                <td>${result.percentage}%</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Ошибка при загрузке результатов:', error);
        document.getElementById('results-list').innerHTML = 
            '<p class="error">Ошибка при загрузке результатов</p>';
    }
}

function saveSettings() {
    const count = document.getElementById('questions-count').value;
    localStorage.setItem('questionsCount', count);
    alert('Настройки сохранены!');
}

function loadSettings() {
    const savedCount = localStorage.getItem('questionsCount');
    if (savedCount) {
        document.getElementById('questions-count').value = savedCount;
    }
}

// Загружаем данные при загрузке страницы
window.addEventListener('DOMContentLoaded', () => {
    loadImages();
    loadResults();
    loadSettings();
    
    // Обновляем результаты каждые 5 секунд
    setInterval(loadResults, 5000);
});

