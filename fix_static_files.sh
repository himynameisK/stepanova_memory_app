#!/bin/bash
# Скрипт для исправления проблемы со статическими файлами

echo "Исправление проблемы со статическими файлами..."

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
NGINX_CONF="/etc/nginx/sites-available/memory_app"

# Проверяем, существует ли конфигурация
if [ ! -f "$NGINX_CONF" ]; then
    echo "Конфигурация Nginx не найдена. Запустите сначала ./setup_nginx.sh"
    exit 1
fi

# Обновляем конфигурацию
echo "Обновляю конфигурацию Nginx..."
sudo cp "$SCRIPT_DIR/nginx.conf" "$NGINX_CONF"

# Примечание: Статические файлы теперь обслуживаются через Flask/Gunicorn,
# который может читать файлы из /root, поэтому не нужно менять права доступа

# Проверяем конфигурацию
echo "Проверяю конфигурацию Nginx..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "Перезагружаю Nginx..."
    sudo systemctl reload nginx
    echo ""
    echo "✓ Конфигурация обновлена!"
    echo ""
    echo "Проверьте сайт: http://194.156.119.68/"
    echo "Если проблема сохраняется, проверьте логи:"
    echo "  sudo tail -f /var/log/nginx/memory_app_error.log"
else
    echo "✗ Ошибка в конфигурации Nginx"
    exit 1
fi
