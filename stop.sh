#!/bin/bash
# Скрипт для остановки приложения

# Получаем директорию скрипта
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Проверяем наличие PID файла
if [ ! -f "gunicorn.pid" ]; then
    echo "PID файл не найден. Приложение, возможно, не запущено."
    exit 1
fi

# Читаем PID
PID=$(cat gunicorn.pid)

# Проверяем, существует ли процесс
if ! ps -p $PID > /dev/null 2>&1; then
    echo "Процесс с PID $PID не найден. Удаляю PID файл..."
    rm -f gunicorn.pid
    exit 0
fi

# Останавливаем процесс
echo "Останавливаю приложение (PID: $PID)..."
kill $PID

# Ждем завершения процесса
WAIT_TIME=0
MAX_WAIT=10
while ps -p $PID > /dev/null 2>&1 && [ $WAIT_TIME -lt $MAX_WAIT ]; do
    sleep 1
    WAIT_TIME=$((WAIT_TIME + 1))
done

# Если процесс все еще работает, принудительно завершаем
if ps -p $PID > /dev/null 2>&1; then
    echo "Процесс не завершился, принудительно останавливаю..."
    kill -9 $PID
    sleep 1
fi

# Удаляем PID файл
if [ -f "gunicorn.pid" ]; then
    rm -f gunicorn.pid
fi

# Проверяем результат
if ! ps -p $PID > /dev/null 2>&1; then
    echo "✓ Приложение успешно остановлено"
else
    echo "✗ Ошибка при остановке приложения"
    exit 1
fi

