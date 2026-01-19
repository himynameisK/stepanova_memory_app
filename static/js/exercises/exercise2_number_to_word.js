/** Упражнение 2: Число → Слово */

const MAX_ATTEMPTS_EX2 = 2;
let attemptsEx2 = 0;

async function initExercise2(session) {
    attemptsEx2 = 0;
    showNextNumberEx2(session);
}

async function showNextNumberEx2(session) {
    // Проверяем завершение упражнения перед показом нового вопроса
    if (!session || session.current_index >= session.numbers.length) {
        if (typeof showResults === 'function') {
            showResults();
        }
        return false; // Упражнение завершено
    }
    
    const currentNumber = session.numbers[session.current_index];
    
    // Показываем число
    document.getElementById('number-display').textContent = currentNumber;
    
    // Сброс состояния
    attemptsEx2 = 0;
    const answerInput = document.getElementById('answer-input-ex2');
    const checkBtn = document.getElementById('check-btn-ex2');
    answerInput.value = '';
    answerInput.disabled = false;
    checkBtn.disabled = false;
    
    // Скрываем результаты предыдущего вопроса
    const resultPlaceholder = document.getElementById('result-placeholder');
    const resultImage = document.getElementById('trainer-image-ex2');
    const crossResult = document.getElementById('cross-result');
    
    resultPlaceholder.style.display = 'block';
    resultImage.classList.add('hidden');
    crossResult.classList.add('hidden');
    resultImage.src = '';
    
    document.getElementById('attempts-info-ex2').textContent = '';
    
    answerInput.focus();
    return true;
}

async function checkAnswerEx2(session) {
    const answerInput = document.getElementById('answer-input-ex2');
    const userAnswer = answerInput.value.trim();
    
    if (!userAnswer) {
        alert('Пожалуйста, введите слово');
        return false;
    }
    
    try {
        const currentNumber = session.numbers[session.current_index];
        
        const response = await fetch('/api/trainer/check', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                exercise_type: 'number_to_word',
                number: currentNumber,
                answer: userAnswer
            })
        });
        
        const result = await response.json();
        attemptsEx2++;
        
        const resultPlaceholder = document.getElementById('result-placeholder');
        const resultImage = document.getElementById('trainer-image-ex2');
        const crossResult = document.getElementById('cross-result');
        
        if (result.correct) {
            // Правильный ответ - показываем картинку
            resultPlaceholder.style.display = 'none';
            crossResult.classList.add('hidden');
            resultImage.src = `/img/${result.image_filename}`;
            resultImage.classList.remove('hidden');
            session.correct_answers++;
            
            // Переход к следующему вопросу через 1.5 секунды
            setTimeout(() => {
                session.current_index++;
                updateProgress();
                showNextNumberEx2(session);
            }, 1500);
            return true;
        } else {
            // Неправильный ответ - показываем красный крест
            resultPlaceholder.style.display = 'none';
            resultImage.classList.add('hidden');
            crossResult.classList.remove('hidden');
            
            if (attemptsEx2 >= MAX_ATTEMPTS_EX2) {
                answerInput.disabled = true;
                document.getElementById('check-btn-ex2').disabled = true;
                
                // Переход к следующему вопросу через 2 секунды
                setTimeout(() => {
                    session.current_index++;
                    updateProgress();
                    showNextNumberEx2(session);
                }, 2000);
            } else {
                document.getElementById('attempts-info-ex2').textContent = 
                    `Попытка ${attemptsEx2} из ${MAX_ATTEMPTS_EX2}. Попробуйте еще раз.`;
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

