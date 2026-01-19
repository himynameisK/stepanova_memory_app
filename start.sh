#!/bin/bash
# Скрипт для запуска приложения в production режиме

# Получаем директорию скрипта
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Проверяем наличие виртуальной среды
if [ ! -d ".venv" ]; then
    echo "Виртуальная среда не найдена. Создаю..."
    python3 -m venv .venv
fi

# Активируем виртуальную среду
source .venv/bin/activate

# Устанавливаем зависимости, если нужно
if [ ! -f ".venv/.deps_installed" ]; then
    echo "Устанавливаю зависимости..."
    pip install --upgrade pip
    pip install -r requirements.txt
    touch .venv/.deps_installed
fi

# Проверяем, не запущен ли уже процесс
if [ -f "gunicorn.pid" ]; then
    PID=$(cat gunicorn.pid)
    if ps -p $PID > /dev/null 2>&1; then
        echo "Приложение уже запущено (PID: $PID)"
        echo "Используйте ./stop.sh для остановки"
        exit 1
    else
        echo "Удаляю старый PID файл..."
        rm -f gunicorn.pid
    fi
fi

# Создаем директорию для логов, если её нет
mkdir -p logs

# Запускаем приложение через gunicorn
echo "Запускаю приложение на 0.0.0.0:5000..."
gunicorn \
    --bind 0.0.0.0:5000 \
    --workers 4 \
    --worker-class sync \
    --timeout 120 \
    --access-logfile logs/access.log \
    --error-logfile logs/error.log \
    --log-level info \
    --pid gunicorn.pid \
    --daemon \
    app:app

# Ждем немного и проверяем статус
sleep 2

if [ -f "gunicorn.pid" ]; then
    PID=$(cat gunicorn.pid)
    if ps -p $PID > /dev/null 2>&1; then
        echo "✓ Приложение успешно запущено!"
        echo "  PID: $PID"
        echo "  URL: http://0.0.0.0:5000"
        echo "  Логи: logs/access.log и logs/error.log"
        echo ""
        echo "Для остановки используйте: ./stop.sh"
    else
        echo "✗ Ошибка при запуске приложения"
        echo "Проверьте логи: logs/error.log"
        exit 1
    fi
else
    echo "✗ Ошибка: PID файл не создан"
    exit 1
fi

