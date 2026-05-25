#!/bin/bash
# Скрипт для настройки Nginx как reverse proxy

echo "Настройка Nginx для приложения..."

# Проверяем наличие nginx
if ! command -v nginx &> /dev/null; then
    echo "Nginx не установлен. Устанавливаю..."
    sudo apt-get update
    sudo apt-get install -y nginx
fi

# Копируем конфигурацию
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
NGINX_CONF="/etc/nginx/sites-available/memory_app"

echo "Создаю конфигурацию Nginx..."
sudo cp "$SCRIPT_DIR/nginx.conf" "$NGINX_CONF"

# Создаем символическую ссылку
if [ ! -L /etc/nginx/sites-enabled/memory_app ]; then
    echo "Активирую сайт..."
    sudo ln -s "$NGINX_CONF" /etc/nginx/sites-enabled/
fi

# Удаляем дефолтный сайт, если он включен
if [ -L /etc/nginx/sites-enabled/default ]; then
    echo "Отключаю дефолтный сайт..."
    sudo rm /etc/nginx/sites-enabled/default
fi

# Проверяем конфигурацию
echo "Проверяю конфигурацию Nginx..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "Перезагружаю Nginx..."
    sudo systemctl reload nginx
    echo "✓ Nginx настроен успешно!"
    echo ""
    echo "Теперь приложение доступно на:"
    echo "  http://194.156.119.68/"
    echo "  http://194.156.119.68:5000 (напрямую)"
else
    echo "✗ Ошибка в конфигурации Nginx"
    exit 1
fi
