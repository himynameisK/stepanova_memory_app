"""Базовый класс для упражнений"""
import random
from abc import ABC, abstractmethod


class BaseExercise(ABC):
    """Базовый класс для всех упражнений"""
    
    def __init__(self, images_data):
        self.images_data = images_data
    
    @abstractmethod
    def generate_session(self, count=30):
        """Генерирует данные сессии для упражнения"""
        pass
    
    @abstractmethod
    def check_answer(self, session_data, user_answer):
        """Проверяет ответ пользователя"""
        pass


def parse_image_files():
    """Парсит файлы изображений и возвращает словарь {номер: название}"""
    import os
    import re
    
    images = {}
    img_dir = 'img'
    if os.path.exists(img_dir):
        for filename in os.listdir(img_dir):
            if filename.endswith('.png'):
                # Формат: НОМЕР_НАЗВАНИЕ.png
                match = re.match(r'(\d+)_(.+)\.png', filename)
                if match:
                    number = int(match.group(1))
                    name = match.group(2)
                    images[number] = {
                        'name': name,
                        'filename': filename
                    }
    return images

