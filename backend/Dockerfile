FROM php:8.3-cli-alpine

# Instalar dependencias del sistema y extensiones requeridas por Laravel
RUN apk add --no-cache \
    bash \
    mysql-client \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    zip \
    libzip-dev \
    unzip \
    git \
    curl \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo pdo_mysql gd zip

# Copiar Composer global
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copiar definicion de paquetes
COPY composer.json ./

# Instalar dependencias en build time ignorando bloqueos de seguridad
RUN composer install --no-interaction --no-scripts --prefer-dist --no-security-blocking

# Copiar el resto del código del backend
COPY . .

# Optimizar autoloader
RUN composer dump-autoload --no-scripts --optimize

RUN chmod +x entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/var/www/html/entrypoint.sh"]
