"""Подмодули тренажёра: загрузка справочника, реестр и сессии."""
from .base import ImageEntry, parse_image_files
from .registry import EXERCISES, ExerciseConfig, get_exercise, list_exercises
from .session import build_session, check_answer

__all__ = [
    "EXERCISES",
    "ExerciseConfig",
    "ImageEntry",
    "build_session",
    "check_answer",
    "get_exercise",
    "list_exercises",
    "parse_image_files",
]
