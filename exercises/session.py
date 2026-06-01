"""Генерация сессии и проверка ответов.

Один файл вместо отдельных модулей под каждый вариант — логика общая,
отличия описаны в registry.ExerciseConfig.
"""
from __future__ import annotations

import random
from typing import Dict, List

from .base import ImageEntry
from .registry import ExerciseConfig


def _sample_numbers(images: Dict[int, ImageEntry], count: int) -> List[int]:
    """Случайные `count` номеров из справочника (или все, если меньше)."""
    available = list(images.keys())
    if len(available) <= count:
        random.shuffle(available)
        return available
    return random.sample(available, count)


def build_session(cfg: ExerciseConfig, images: Dict[int, ImageEntry]) -> dict:
    """Готовит данные для нового сеанса упражнения.

    Возвращает структуру для клиента: список вопросов с уже подложенными
    подсказками отображения — чтобы фронт не лез повторно за справочником.
    """
    numbers = _sample_numbers(images, cfg.count)

    questions = []
    for i, n in enumerate(numbers):
        entry = images[n]
        # Какой столбец показываем как подсказку для этого вопроса
        if cfg.prompt == "image":
            show = "image"
        elif cfg.prompt == "number":
            show = "number"
        elif cfg.prompt == "alternating":
            # Чередуем: чётные индексы — картинка, нечётные — число
            show = "image" if i % 2 == 0 else "number"
        elif cfg.prompt == "mixed":
            # Случайный выбор — картинка или число
            show = random.choice(("image", "number"))
        else:
            show = "image"

        questions.append({
            "number": n,
            "name": entry.name,
            "filename": entry.filename,
            "show": show,
        })

    return {
        "exercise_id": cfg.id,
        "title": cfg.title,
        "level": cfg.level,
        "layout": cfg.layout,
        "max_attempts": cfg.max_attempts,
        "total": len(questions),
        "questions": questions,
    }


def check_answer(number: int, show: str, user_answer: str,
                 images: Dict[int, ImageEntry]) -> dict:
    """Сравнивает ответ пользователя с эталоном.

    `show` — что показывали в подсказке. Соответственно ожидаемый ответ
    противоположный: показывали картинку → ждём число; показывали число →
    ждём слово.
    """
    if number not in images:
        return {"error": "unknown_number"}

    entry = images[number]
    user_answer = (user_answer or "").strip()

    if show == "image":
        # Пользователь должен был ввести число
        try:
            correct = int(user_answer) == entry.number
        except ValueError:
            correct = False
        expected = str(entry.number)
    else:
        # Пользователь должен был ввести слово
        correct = user_answer.upper() == entry.name.upper()
        expected = entry.name

    return {
        "correct": correct,
        "expected": expected,
        "name": entry.name,
        "filename": entry.filename,
        "number": entry.number,
    }
