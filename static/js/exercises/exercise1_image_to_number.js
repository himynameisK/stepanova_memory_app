/** Упражнение 1: Картинка → Число */

const MAX_ATTEMPTS = 2;
let attempts = 0;

async function initExercise1(session) {
    attempts = 0;
    showNextImageEx1(session);
}

async function showNextImageEx1(session) {
    // Проверяем завершение упражнения перед показом нового вопроса
    if (!session || session.current_index >= session.images.length) {
        if (typeof showResults === 'function') {
            showResults();
        }
        return false; // Упражнение завершено
    }
    
    const currentImageNumber = session.images[session.current_index];
    
    // Получаем правильное имя файла
    const images = await loadImagesCache();
    if (images[currentImageNumber]) {
        const filename = images[currentImageNumber].filename;
        document.getElementById('trainer-image').src = `/img/${filename}`;
    }
    
    // Сброс состояния
    attempts = 0;
    const answerInput = document.getElementById('answer-input');
    const checkBtn = document.getElementById('check-btn');
    answerInput.value = '';
    answerInput.disabled = false;
    checkBtn.disabled = false;
    document.getElementById('result-container').innerHTML = '<span class="placeholder">Ожидание ответа...</span>';
    document.getElementById('attempts-info').textContent = '';
    
    answerInput.focus();
    return true;
}

async function checkAnswerEx1(session) {
    const answerInput = document.getElementById('answer-input');
    const userAnswer = answerInput.value.trim();
    
    if (!userAnswer) {
        alert('Пожалуйста, введите число');
        return false;
    }
    
    try {
        const currentImageNumber = session.images[session.current_index];
        
        const response = await fetch('/api/trainer/check', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                exercise_type: 'image_to_number',
                image_number: currentImageNumber,
                answer: userAnswer
            })
        });
        
        const result = await response.json();
        attempts++;
        
        if (result.correct) {
            // Правильный ответ
            document.getElementById('result-container').innerHTML = 
                `<span class="result-correct">${result.image_name}</span>`;
            session.correct_answers++;
            
            // Переход к следующему вопросу через 1 секунду
            setTimeout(() => {
                session.current_index++;
                updateProgress();
                showNextImageEx1(session);
            }, 1000);
            return true;
        } else {
            // Неправильный ответ
            if (attempts >= MAX_ATTEMPTS) {
                document.getElementById('result-container').innerHTML = 
                    `<span class="result-wrong">✗</span>`;
                answerInput.disabled = true;
                document.getElementById('check-btn').disabled = true;
                
                // Показываем правильный ответ
                setTimeout(() => {
                    document.getElementById('result-container').innerHTML = 
                        `<span class="result-info">Правильный ответ: ${result.correct_answer}</span>`;
                    
                    // Переход к следующему вопросу через 2 секунды
                    setTimeout(() => {
                        session.current_index++;
                        updateProgress();
                        showNextImageEx1(session);
                    }, 2000);
                }, 1000);
            } else {
                document.getElementById('result-container').innerHTML = 
                    `<span class="result-wrong">✗</span>`;
                document.getElementById('attempts-info').textContent = 
                    `Попытка ${attempts} из ${MAX_ATTEMPTS}. Попробуйте еще раз.`;
                answerInput.value = '';
                answerInput.focus();
            }
            return false;
        }
    } catch (error) {
        console.error('Ошибка при проверке ответа:', error);
        alert('Ошибка при проверке ответа');
        return false;
    }
}

