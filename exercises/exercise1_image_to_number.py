"""Упражнение 1: Картинка -> Число (простой уровень)"""
import random
from .base import BaseExercise


class Exercise1ImageToNumber(BaseExercise):
    """Упражнение: показывается картинка, нужно ввести число"""
    
    def generate_session(self, count=30):
        """Генерирует сессию упражнения"""
        available_numbers = list(self.images_data.keys())
        
        # Выбираем случайные картинки
        selected = random.sample(available_numbers, min(count, len(available_numbers)))
        
        return {
            'exercise_type': 'image_to_number',
            'level': 'simple',
            'images': selected,
            'current_index': 0,
            'correct_answers': 0,
            'total_questions': len(selected)
        }
    
    def check_answer(self, image_number, user_answer):
        """Проверяет ответ пользователя"""
        if image_number not in self.images_data:
            return {'error': 'Image not found'}, 404
        
        try:
            correct = int(image_number) == int(user_answer)
            return {
                'correct': correct,
                'correct_answer': image_number,
                'image_name': self.images_data[image_number]['name']
            }, 200
        except ValueError:
            return {'error': 'Invalid answer format'}, 400

