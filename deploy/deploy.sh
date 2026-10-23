#!/usr/bin/env bash
# Обновление сайта на VDS: git pull → сборка в контейнере → выкладка без простоя → перезапуск API.
# Запуск под root: bash /opt/oksana/repo/deploy/deploy.sh
set -euo pipefail
cd "$(dirname "$0")/.."
SITE=/opt/oksana/site

git pull --ff-only

# Node на сервер не ставим: собираем в одноразовом контейнере (переменные VITE_* берутся из .env)
docker run --rm -v "$PWD":/app -w /app --env-file .env -e DEPLOY=1 node:22-alpine \
  sh -c "npm ci --no-audit --no-fund && npm run build"

# HTML заменяется атомарно (--delay-updates), старые /assets/ остаются на 30 дней —
# у открытых вкладок догрузятся чанки прошлой версии
mkdir -p "$SITE"
rsync -a --delay-updates dist/ "$SITE/"
find "$SITE/assets" -type f -mtime +30 -delete

docker compose -f deploy/compose.yaml up -d
docker compose -f deploy/compose.yaml restart api
sleep 2
docker compose -f deploy/compose.yaml exec -T web wget -qO- http://oksana-api:3001/api/health >/dev/null
echo "✓ сайт выложен, API отвечает"
