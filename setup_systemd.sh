#!/bin/bash
# Скрипт для установки systemd-сервиса (автозапуск приложения)

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SERVICE_NAME="stepanova-memory.service"
SRC="$SCRIPT_DIR/deploy/$SERVICE_NAME"
DST="/etc/systemd/system/$SERVICE_NAME"

if [ ! -f "$SRC" ]; then
    echo "✗ Не найден файл сервиса: $SRC"
    exit 1
fi

# Останавливаем ручной запуск через start.sh, если он есть
if [ -f "$SCRIPT_DIR/gunicorn.pid" ]; then
    PID=$(cat "$SCRIPT_DIR/gunicorn.pid")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "Останавливаю gunicorn (PID: $PID), запущенный через start.sh..."
        kill "$PID" || true
        sleep 2
    fi
    rm -f "$SCRIPT_DIR/gunicorn.pid"
fi

echo "Копирую $SERVICE_NAME в $DST..."
sudo cp "$SRC" "$DST"

echo "Перезагружаю конфигурацию systemd..."
sudo systemctl daemon-reload

echo "Включаю автозапуск и запускаю сервис..."
sudo systemctl enable "$SERVICE_NAME"
sudo systemctl restart "$SERVICE_NAME"

sleep 2

if systemctl is-active --quiet "$SERVICE_NAME"; then
    echo "✓ Сервис $SERVICE_NAME запущен и будет стартовать автоматически при загрузке."
    echo ""
    echo "Полезные команды:"
    echo "  sudo systemctl status $SERVICE_NAME    # статус"
    echo "  sudo systemctl restart $SERVICE_NAME   # перезапуск"
    echo "  sudo systemctl stop $SERVICE_NAME      # остановка"
    echo "  sudo journalctl -u $SERVICE_NAME -f    # логи"
else
    echo "✗ Сервис не запустился. Логи:"
    sudo systemctl status "$SERVICE_NAME" --no-pager
    exit 1
fi
