#!/bin/sh
set -e

if [ ! -f .env ]; then
    cp .env.example .env
fi

sed -i 's/DB_HOST=.*/DB_HOST=db/' .env 2>/dev/null || true
sed -i 's/DB_PORT=.*/DB_PORT=3306/' .env 2>/dev/null || true
sed -i 's/DB_PASSWORD=.*/DB_PASSWORD=root/' .env 2>/dev/null || true

if [ ! -d "vendor" ] || [ ! -f "vendor/autoload.php" ]; then
    echo "Instalando dependencias de Composer por primera vez..."
    composer install --no-interaction --no-scripts --prefer-dist --no-audit
fi

if ! grep -q "APP_KEY=base64" .env; then
    php artisan key:generate --no-interaction
fi

php artisan storage:link --no-interaction 2>/dev/null || true

echo "Servidor Backend en ejecucion en http://0.0.0.0:8000"
exec php artisan serve --host=0.0.0.0 --port=8000
