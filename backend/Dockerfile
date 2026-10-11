# ============================================
# Dockerfile untuk Railway - Laravel Backend
# ============================================

FROM php:8.3-cli

# Install system dependencies & PHP extensions
RUN apt-get update && apt-get install -y \
    libzip-dev \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libpq-dev \
    unzip \
    git \
    && docker-php-ext-install \
        pdo_pgsql \
        pdo_mysql \
        pgsql \
        zip \
        gd \
        mbstring \
        xml \
        opcache

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www

# Copy project files
COPY . .

# Install PHP dependencies (no dev)
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Generate application key if not set
RUN php artisan key:generate --force || true

# Run migrations & seeders on build (optional, can also be done via CLI)
# RUN php artisan migrate --force --seed

# Set permissions
RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache

# Expose port
EXPOSE 8000

# Start Laravel server
CMD php artisan serve --host=0.0.0.0 --port=8000
