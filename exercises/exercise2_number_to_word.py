"""Упражнение 2: Число -> Слово (простой уровень)"""
import random


class Exercise2NumberToWord:
    """Упражнение: показывается число, нужно ввести слово"""
    
    def __init__(self, images_data):
        self.images_data = images_data
    
    def generate_session(self, count=30):
        """Генерирует сессию упражнения с числами от 0 до 100"""
        # Выбираем случайные числа от 0 до 100
        all_numbers = list(range(101))  # 0-100
        available_numbers = [n for n in all_numbers if n in self.images_data]
        
        # Если доступных меньше count, используем все доступные
        if len(available_numbers) < count:
            selected = available_numbers
        else:
            selected = random.sample(available_numbers, count)
        
        # Перемешиваем для случайного порядка
        random.shuffle(selected)
        
        return {
            'exercise_type': 'number_to_word',
            'level': 'simple',
            'numbers': selected,
            'current_index': 0,
            'correct_answers': 0,
            'total_questions': len(selected)
        }
    
    def check_answer(self, number, user_answer):
        """Проверяет ответ пользователя (слово)"""
        if number not in self.images_data:
            return {'error': 'Number not found'}, 404
        
        # Нормализуем ответ пользователя (убираем пробелы, приводим к верхнему регистру)
        user_word = user_answer.strip().upper()
        correct_word = self.images_data[number]['name'].upper()
        
        correct = user_word == correct_word
        
        return {
            'correct': correct,
            'correct_answer': self.images_data[number]['name'],
            'user_answer': user_answer.strip(),
            'image_filename': self.images_data[number]['filename']
        }, 200

