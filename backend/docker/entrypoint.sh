#!/bin/sh
# Entrypoint container Anteraja. Jalan sebelum supervisord menyalakan
# php-fpm, nginx, redis, reverb, queue worker, dan scheduler.
set -e

# Port publik: Render mengisi $PORT otomatis; host lain bisa PORT=8080.
sed -i "s/LISTEN_PORT/${PORT:-8080}/g" /etc/nginx/nginx.conf

# APP_KEY dibutuhkan Laravel. Bila kosong, dibuat otomatis (berlaku
# untuk demo — token Sanxtum lama hangus tiap container restart).
if [ -z "$APP_KEY" ]; then
  php artisan key:generate --force
fi

php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan migrate --force

# Isi data demo sekali saja: set SEED_ON_START=true, deploy, lalu matikan.
if [ "${SEED_ON_START:-false}" = "true" ]; then
  php artisan db:seed --force
fi

exec /usr/bin/supervisord -c /etc/supervisord.conf
