# Container backend Anteraja: nginx + php-fpm + Reverb (WS) + queue + scheduler.
# Satu container menjalankan semua proses karena Render Free hanya memberi
# 1 service dan tidak menyediakan worker/cron gratis.
FROM php:8.3-fpm-alpine

# nginx sebagai entrypoint publik, supervisor untuk menjalankan proses panjang.
RUN apk add --no-cache nginx supervisor \
 && docker-php-ext-install pdo_pgsql pcntl mbstring \
 && docker-php-ext-enable opcache

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
COPY . .

# Pool php-fpm jalan sebagai www-data supaya bisa menulis storage/logs.
COPY docker/www.conf /usr/local/etc/php-fpm.d/zz-anteraja.conf

RUN composer install --no-dev --optimize-autoloader --no-interaction \
 && mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
 && chown -R www-data:www-data storage bootstrap/cache

COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/supervisord.conf /etc/supervisord.conf
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Render mengisi env $PORT; nilai lain (Koyeb/standalone) bisa PORT=8080.
EXPOSE 8080
CMD ["/entrypoint.sh"]
