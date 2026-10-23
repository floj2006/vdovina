# Подключается в location со страницами (deploy/nginx.conf)
add_header X-Content-Type-Options nosniff always;
add_header Referrer-Policy strict-origin-when-cross-origin always;
add_header X-Frame-Options DENY always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
add_header Strict-Transport-Security "max-age=31536000" always;
# HTML всегда перепроверяется: после деплоя браузер не возьмёт страницу со ссылками на удалённые ассеты
add_header Cache-Control "no-cache" always;
