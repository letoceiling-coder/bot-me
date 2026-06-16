#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/bot-me.neeklo.ru"
REPO="git@github.com:letoceiling-coder/bot-me.git"
DOMAIN="bot-me.neeklo.ru"
NGINX_AVAIL="/etc/nginx/sites-available/${DOMAIN}.conf"
NGINX_ENABLED="/etc/nginx/sites-enabled/${DOMAIN}.conf"

echo "==> Deploy bot-me to ${DOMAIN}"

if [[ ! -d "${APP_DIR}/.git" ]]; then
  mkdir -p "${APP_DIR}"
  git clone "${REPO}" "${APP_DIR}"
fi

cd "${APP_DIR}"
git fetch origin
git reset --hard origin/main

if [[ ! -f .env ]]; then
  echo "ERROR: create ${APP_DIR}/.env from .env.production.example first"
  exit 1
fi

docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d postgres redis
sleep 8
docker compose -f docker-compose.prod.yml run --rm api npx prisma migrate deploy
docker compose -f docker-compose.prod.yml run --rm api npx tsx prisma/seed.ts
docker compose -f docker-compose.prod.yml up -d

if [[ ! -L "${NGINX_ENABLED}" ]]; then
  ln -sf "${NGINX_AVAIL}" "${NGINX_ENABLED}"
fi

if [[ ! -d "/etc/letsencrypt/live/${DOMAIN}" ]]; then
  echo "==> HTTP nginx + certbot (isolated cert name)"
  cp deploy/nginx/${DOMAIN}.http.conf "${NGINX_AVAIL}"
  nginx -t
  systemctl reload nginx
  certbot certonly --webroot -w /var/www/certbot -d "${DOMAIN}" \
    --cert-name "${DOMAIN}" --non-interactive --agree-tos -m admin@neeklo.ru
fi

cp deploy/nginx/${DOMAIN}.conf "${NGINX_AVAIL}"
nginx -t
systemctl reload nginx

echo "==> Done: https://${DOMAIN}/admin"
