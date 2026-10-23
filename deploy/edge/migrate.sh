#!/usr/bin/env bash
# Однократный перевод VDS на общий прокси edge. Запуск под root: bash /opt/edge/migrate.sh
# Сайт Жуковой недоступен ~2–5 секунд (между остановкой её Caddy и стартом общего).
# Любая ошибка до переключения портов — выход без изменений; после — автоматический откат на её Caddy.
set -euo pipefail
cd /opt/edge
OLGA=olga-zhukova-vologda.ru

check() { curl -fsS -o /dev/null -w "%{http_code}" --max-time 10 --resolve "$OLGA:443:127.0.0.1" "https://$OLGA/"; }

echo "1/6 Сайт Жуковой сейчас: $(check)"

ts=$(date +%Y%m%d-%H%M%S); b=/root/backup-olga-$ts; mkdir -p "$b"
cp -a /opt/olga/compose.yaml /opt/olga/deployment/Caddyfile "$b/"
docker run --rm -v olga-zhukova_caddy_data:/d alpine tar cz -C /d . > "$b/caddy_data.tgz"
echo "2/6 Резервная копия: $b"

docker network inspect edge >/dev/null 2>&1 || docker network create edge >/dev/null
docker run --rm -v /opt/edge/Caddyfile:/etc/caddy/Caddyfile:ro caddy:2-alpine caddy validate --config /etc/caddy/Caddyfile >/dev/null
echo "3/6 Сеть edge есть, Caddyfile валиден"

# Сертификаты Жуковой — в новый Caddy, чтобы не перевыпускать и не было окна без HTTPS
docker volume create edge_caddy_data >/dev/null
docker run --rm -v olga-zhukova_caddy_data:/from:ro -v edge_caddy_data:/to alpine sh -c 'cp -a /from/. /to/'
# Её приложение — в сеть edge под именем olga-app (без перезапуска контейнера)
docker network inspect edge --format '{{range .Containers}}{{.Name}} {{end}}' | grep -q olga-zhukova-app-1 \
  || docker network connect --alias olga-app edge olga-zhukova-app-1
docker run --rm --network edge alpine wget -qO /dev/null http://olga-app:3000/
echo "4/6 Сертификаты скопированы, olga-app доступен из сети edge"

rollback() {
  echo "!! Откат: возвращаю Caddy Жуковой"
  docker compose -p edge -f /opt/edge/compose.yaml down || true
  docker start olga-zhukova-caddy-1
  sleep 3; echo "Сайт Жуковой после отката: $(check || true)"
  exit 1
}

docker stop olga-zhukova-caddy-1 >/dev/null
docker compose -f /opt/edge/compose.yaml up -d >/dev/null 2>&1 || rollback
for i in $(seq 1 15); do code=$(check 2>/dev/null || true); [ "$code" = 200 ] && break; sleep 1; done
[ "${code:-}" = 200 ] || rollback
echo "5/6 Порты у общего Caddy, сайт Жуковой: $code"

# Её Caddy остаётся остановленным (restart: unless-stopped не поднимет его после перезагрузки).
docker update --restart=no olga-zhukova-caddy-1 >/dev/null
echo "6/6 Готово. Откат вручную: docker compose -f /opt/edge/compose.yaml down && docker start olga-zhukova-caddy-1"
