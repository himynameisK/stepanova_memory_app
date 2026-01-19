from flask import Flask, render_template, jsonify, request, send_from_directory
import os
import json

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'img'

# База данных для хранения результатов (в реальном приложении использовать БД)
results_db = []

# Импортируем модули упражнений
from exercises.base import parse_image_files
from exercises.exercise1_image_to_number import Exercise1ImageToNumber
from exercises.exercise2_number_to_word import Exercise2NumberToWord

# Инициализируем упражнения
_images_cache = None

def get_images_data():
    """Получает кэш изображений"""
    global _images_cache
    if _images_cache is None:
        _images_cache = parse_image_files()
    return _images_cache

@app.route('/')
def index():
    return render_template('trainer.html')

@app.route('/admin')
def admin():
    return render_template('admin.html')

@app.route('/reference')
def reference():
    """Страница со всеми значениями цифр и картинок"""
    images = get_images_data()
    # Сортируем по номеру
    sorted_images = sorted(images.items())
    return render_template('reference.html', images=sorted_images)

@app.route('/api/images')
def get_images():
    """Возвращает список всех доступных изображений"""
    images = get_images_data()
    return jsonify(images)

@app.route('/api/trainer/start', methods=['POST'])
def start_trainer():
    """Начинает новый сеанс тренажера"""
    data = request.json
    exercise_type = data.get('exercise_type', 'image_to_number')
    level = data.get('level', 'simple')
    count = data.get('count', 30)
    
    images_data = get_images_data()
    
    # Выбираем нужное упражнение
    if exercise_type == 'image_to_number':
        exercise = Exercise1ImageToNumber(images_data)
    elif exercise_type == 'number_to_word':
        exercise = Exercise2NumberToWord(images_data)
    else:
        return jsonify({'error': 'Unknown exercise type'}), 400
    
    session_data = exercise.generate_session(count)
    return jsonify(session_data)

@app.route('/api/trainer/check', methods=['POST'])
def check_answer():
    """Проверяет ответ пользователя"""
    data = request.json
    exercise_type = data.get('exercise_type', 'image_to_number')
    number = data.get('number') or data.get('image_number')  # Поддержка обоих полей
    user_answer = data.get('answer')
    
    if not number or user_answer is None:
        return jsonify({'error': 'Missing required fields'}), 400
    
    images_data = get_images_data()
    
    # Выбираем нужное упражнение
    if exercise_type == 'image_to_number':
        exercise = Exercise1ImageToNumber(images_data)
        result, status_code = exercise.check_answer(int(number), user_answer)
    elif exercise_type == 'number_to_word':
        exercise = Exercise2NumberToWord(images_data)
        result, status_code = exercise.check_answer(int(number), user_answer)
    else:
        return jsonify({'error': 'Unknown exercise type'}), 400
    
    return jsonify(result), status_code

@app.route('/api/results', methods=['POST'])
def save_results():
    """Сохраняет результаты тренировки"""
    data = request.json
    results_db.append(data)
    return jsonify({'success': True})

@app.route('/api/results', methods=['GET'])
def get_results():
    """Возвращает все результаты"""
    return jsonify(results_db)

@app.route('/img/<path:filename>')
def serve_image(filename):
    """Отдает изображения из папки img"""
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == '__main__':
    # Для production используйте gunicorn
    # Для разработки можно использовать debug=True
    debug_mode = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    app.run(debug=debug_mode, host='0.0.0.0', port=5000)

