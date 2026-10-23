#!/usr/bin/env bash
# Обновление сайта на сервере: git pull → сборка → выкладка → перезапуск API.
# Запуск из каталога репозитория под пользователем oksana: bash deploy/deploy.sh
set -euo pipefail
cd "$(dirname "$0")/.."
SITE=/var/www/oksana/site   # root в nginx.conf

git pull --ff-only
npm ci
set -a; . ./.env; set +a
DEPLOY=1 npm run build   # собирается в dist/, nginx его не отдаёт — сайт не падает на время сборки

# Выкладка без простоя: HTML заменяется атомарно (--delay-updates), старые /assets/ остаются,
# чтобы у открытых вкладок догрузились чанки прошлой версии
mkdir -p "$SITE"
rsync -a --delay-updates dist/ "$SITE/"
find "$SITE/assets" -type f -mtime +30 -delete

sudo systemctl restart oksana-orders
curl -fsS --retry 10 --retry-connrefused --retry-delay 1 http://127.0.0.1:3001/api/health >/dev/null
echo "✓ сайт выложен, API отвечает"
