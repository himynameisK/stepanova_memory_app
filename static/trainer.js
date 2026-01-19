// Основной файл тренажера
let currentSession = null;
let currentExerciseType = null;

let imagesCache = null;

async function loadImagesCache() {
    if (!imagesCache) {
        const response = await fetch('/api/images');
        imagesCache = await response.json();
    }
    return imagesCache;
}

async function startTrainer(exerciseType) {
    try {
        // Получаем сохраненное количество вопросов из localStorage
        const savedCount = localStorage.getItem('questionsCount');
        const count = savedCount ? parseInt(savedCount, 10) : 30;
        
        currentExerciseType = exerciseType;
        
        const response = await fetch('/api/trainer/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                exercise_type: exerciseType,
                level: 'simple',
                count: count
            })
        });
        
        if (!response.ok) {
            throw new Error('Ошибка при запуске тренажера');
        }
        
        currentSession = await response.json();
        
        // Скрываем экран выбора
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('results-screen').classList.add('hidden');
        
        // Показываем нужный экран упражнения
        if (exerciseType === 'image_to_number') {
            document.getElementById('trainer-screen-ex1').classList.remove('hidden');
            document.getElementById('trainer-screen-ex2').classList.add('hidden');
            // Инициализируем упражнение 1
            setTimeout(() => initExercise1(currentSession), 100);
        } else if (exerciseType === 'number_to_word') {
            document.getElementById('trainer-screen-ex1').classList.add('hidden');
            document.getElementById('trainer-screen-ex2').classList.remove('hidden');
            // Инициализируем упражнение 2
            setTimeout(() => initExercise2(currentSession), 100);
        }
        
    } catch (error) {
        console.error('Ошибка при запуске тренажера:', error);
        alert('Ошибка при запуске тренажера');
    }
}

function updateProgress() {
    if (!currentSession) return;
    
    const current = currentSession.current_index + 1;
    const total = currentSession.total_questions;
    const percentage = (current / total) * 100;
    
    document.getElementById('progress-text').textContent = `Вопрос ${current} из ${total}`;
    const progressFill = document.getElementById('progress-fill');
    if (progressFill) {
        progressFill.style.width = `${percentage}%`;
    }
}

async function checkAnswer() {
    if (!currentSession || !currentExerciseType) return;
    
    if (currentExerciseType === 'image_to_number') {
        await checkAnswerEx1(currentSession);
    } else if (currentExerciseType === 'number_to_word') {
        await checkAnswerEx2(currentSession);
    }
    
    updateProgress();
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        checkAnswer();
    }
}

function showResults() {
    // Скрываем все экраны упражнений
    document.getElementById('trainer-screen-ex1').classList.add('hidden');
    document.getElementById('trainer-screen-ex2').classList.add('hidden');
    document.getElementById('results-screen').classList.remove('hidden');
    
    const correct = currentSession.correct_answers;
    const total = currentSession.total_questions;
    const percentage = Math.round((correct / total) * 100);
    
    document.getElementById('correct-count').textContent = correct;
    document.getElementById('total-count').textContent = total;
    document.getElementById('percentage').textContent = percentage + '%';
    
    // Сохраняем результаты
    fetch('/api/results', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            exercise_type: currentExerciseType,
            level: currentSession.level,
            correct: correct,
            total: total,
            percentage: percentage,
            timestamp: new Date().toISOString()
        })
    }).catch(error => {
        console.error('Ошибка при сохранении результатов:', error);
    });
}

function restartTrainer() {
    if (currentSession && currentExerciseType) {
        startTrainer(currentExerciseType);
    } else {
        document.getElementById('results-screen').classList.add('hidden');
        document.getElementById('start-screen').classList.remove('hidden');
    }
}

function goToAdmin() {
    window.location.href = '/admin';
}

// Периодически обновляем прогресс
setInterval(updateProgress, 500);

// Загружаем настройки при загрузке страницы
window.addEventListener('DOMContentLoaded', () => {
    const savedCount = localStorage.getItem('questionsCount');
    if (savedCount) {
        const count = parseInt(savedCount, 10);
        const progressText = document.getElementById('progress-text');
        if (progressText) {
            progressText.textContent = `Вопрос 0 из ${count}`;
        }
    }
});
