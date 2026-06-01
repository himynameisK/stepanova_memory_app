"""Каталог упражнений тренажёра.

Каждое упражнение описано конфигом с полями:
    id             — уникальный ключ (используется во фронте и API)
    title          — название для отображения
    description    — короткое описание
    level          — 'simple' | 'hard'
    layout         — 'single' (по одному) | 'grid' (таблица сразу)
    prompt         — что показываем: 'image' | 'number' | 'alternating' | 'mixed'
    answer         — что вводит пользователь: 'number' | 'word' | 'auto'
    count          — сколько вопросов в сессии
    max_attempts   — сколько попыток на вопрос (1 = без повтора)
"""
from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import Dict, List


@dataclass(frozen=True)
class ExerciseConfig:
    id: str
    title: str
    description: str
    level: str
    layout: str
    prompt: str
    answer: str
    count: int
    max_attempts: int

    def as_dict(self) -> dict:
        return asdict(self)


EXERCISES: Dict[str, ExerciseConfig] = {
    cfg.id: cfg
    for cfg in [
        ExerciseConfig(
            id="v1_image_to_number",
            title="Вариант 1. Картинка → Число",
            description="Простой уровень. По очереди 30 картинок, 2 попытки на ответ.",
            level="simple",
            layout="single",
            prompt="image",
            answer="number",
            count=30,
            max_attempts=2,
        ),
        ExerciseConfig(
            id="v2_number_to_word",
            title="Вариант 2. Число → Слово",
            description="Простой уровень. По очереди 30 чисел, 2 попытки на ответ.",
            level="simple",
            layout="single",
            prompt="number",
            answer="word",
            count=30,
            max_attempts=2,
        ),
        ExerciseConfig(
            id="v3_grid_image_to_number",
            title="Вариант 3. Таблица: 20 картинок → числа",
            description="20 картинок сразу. Введите числа без повтора.",
            level="simple",
            layout="grid",
            prompt="image",
            answer="number",
            count=20,
            max_attempts=1,
        ),
        ExerciseConfig(
            id="v4_grid_number_to_word",
            title="Вариант 4. Таблица: 20 чисел → слова",
            description="20 чисел сразу. Введите слова без повтора.",
            level="simple",
            layout="grid",
            prompt="number",
            answer="word",
            count=20,
            max_attempts=1,
        ),
        ExerciseConfig(
            id="v5_alternating",
            title="Вариант 5. Чередование (сложный)",
            description="Поочерёдно 20 картинок и 20 чисел вперемешку. Без повтора.",
            level="hard",
            layout="single",
            prompt="alternating",
            answer="auto",
            count=40,
            max_attempts=1,
        ),
        ExerciseConfig(
            id="v6_grid_mixed",
            title="Вариант 6. Таблица: 25 картинок + 25 чисел (сложный)",
            description="Сразу 50 строк смешанно. Без повтора.",
            level="hard",
            layout="grid",
            prompt="mixed",
            answer="auto",
            count=50,
            max_attempts=1,
        ),
    ]
}


def list_exercises() -> List[dict]:
    """Возвращает список конфигов для фронта (порядок сохранён)."""
    return [cfg.as_dict() for cfg in EXERCISES.values()]


def get_exercise(exercise_id: str) -> ExerciseConfig | None:
    return EXERCISES.get(exercise_id)
