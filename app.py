"""Flask-приложение тренажёра памяти.

Эндпоинты:
    GET  /                  — главная (тренажёр)
    GET  /admin             — админ-панель
    GET  /reference         — справочник всех значений
    GET  /img/<filename>    — раздача картинок

    GET  /api/exercises     — список доступных упражнений
    GET  /api/images        — справочник {номер: {name, filename}}
    POST /api/session       — старт сессии {exercise_id}
    POST /api/check         — проверка ответа {number, show, answer, exercise_id}
    GET  /api/results       — все сохранённые результаты
    POST /api/results       — сохранить результат
    DELETE /api/results     — очистить историю
"""
from __future__ import annotations

import fcntl
import json
import os
from contextlib import contextmanager
from datetime import datetime
from typing import Any, Dict, List

from flask import Flask, jsonify, render_template, request, send_from_directory

from exercises import (
    build_session,
    check_answer,
    get_exercise,
    list_exercises,
    parse_image_files,
)


# ─── Конфигурация ────────────────────────────────────────────────────────────
IMG_FOLDER = "img"
RESULTS_FILE = "results.json"

app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = IMG_FOLDER


# ─── Кэш справочника картинок ────────────────────────────────────────────────
_images_cache = None


def get_images():
    global _images_cache
    if _images_cache is None:
        _images_cache = parse_image_files(IMG_FOLDER)
    return _images_cache


def images_as_json() -> Dict[int, dict]:
    return {num: entry.as_dict() for num, entry in get_images().items()}


# ─── Хранилище результатов (persist в JSON, межпроцессная блокировка) ──────
#
# Gunicorn запускает 4 воркера в разных процессах — threading.Lock не помог бы.
# Используем fcntl.flock на отдельном lock-файле: блокировка на уровне ОС,
# работает между процессами.
RESULTS_LOCK_FILE = RESULTS_FILE + ".lock"


@contextmanager
def _results_lock():
    """Эксклюзивная межпроцессная блокировка вокруг чтения/записи results.json."""
    with open(RESULTS_LOCK_FILE, "a") as lock_fd:
        fcntl.flock(lock_fd, fcntl.LOCK_EX)
        try:
            yield
        finally:
            fcntl.flock(lock_fd, fcntl.LOCK_UN)


def _load_results() -> List[dict]:
    if not os.path.exists(RESULTS_FILE):
        return []
    try:
        with open(RESULTS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return []


def _save_results(results: List[dict]) -> None:
    tmp = RESULTS_FILE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    os.replace(tmp, RESULTS_FILE)


# ─── Страницы ────────────────────────────────────────────────────────────────
@app.route("/")
def index():
    return render_template("trainer.html")


@app.route("/admin")
def admin():
    return render_template("admin.html")


@app.route("/reference")
def reference():
    images = sorted(get_images().items())
    images_for_template = [(n, e.as_dict()) for n, e in images]
    return render_template("reference.html", images=images_for_template)


@app.route("/img/<path:filename>")
def serve_image(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)


# ─── API ─────────────────────────────────────────────────────────────────────
@app.route("/api/exercises")
def api_exercises():
    return jsonify(list_exercises())


@app.route("/api/images")
def api_images():
    return jsonify(images_as_json())


@app.route("/api/session", methods=["POST"])
def api_session():
    data: Dict[str, Any] = request.get_json(silent=True) or {}
    exercise_id = data.get("exercise_id")
    cfg = get_exercise(exercise_id) if exercise_id else None
    if cfg is None:
        return jsonify({"error": "unknown_exercise"}), 400
    return jsonify(build_session(cfg, get_images()))


@app.route("/api/check", methods=["POST"])
def api_check():
    data: Dict[str, Any] = request.get_json(silent=True) or {}
    try:
        number = int(data["number"])
    except (KeyError, TypeError, ValueError):
        return jsonify({"error": "bad_number"}), 400
    show = data.get("show", "image")
    answer = str(data.get("answer", ""))

    result = check_answer(number, show, answer, get_images())
    if "error" in result:
        return jsonify(result), 404
    return jsonify(result)


@app.route("/api/results", methods=["GET", "POST", "DELETE"])
def api_results():
    if request.method == "GET":
        with _results_lock():
            return jsonify(_load_results())

    if request.method == "POST":
        data = request.get_json(silent=True) or {}
        try:
            total = max(0, int(data.get("total", 0)))
            correct = max(0, int(data.get("correct", 0)))
        except (TypeError, ValueError):
            return jsonify({"error": "bad_payload"}), 400
        # Ограничиваем correct диапазоном [0, total] — на случай битых клиентов
        correct = min(correct, total)

        entry = {
            "exercise_id": data.get("exercise_id"),
            "title": data.get("title"),
            "level": data.get("level"),
            "correct": correct,
            "total": total,
            "percentage": round(correct / total * 100) if total > 0 else 0,
            "timestamp": data.get("timestamp") or datetime.utcnow().isoformat() + "Z",
        }

        with _results_lock():
            results = _load_results()
            results.append(entry)
            _save_results(results)
        return jsonify({"ok": True, "entry": entry})

    # DELETE
    with _results_lock():
        _save_results([])
    return jsonify({"ok": True})


# ─── Запуск ──────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    debug = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
    app.run(host="0.0.0.0", port=5000, debug=debug)
