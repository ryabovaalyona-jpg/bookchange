#!/bin/sh
# Выкладка с компьютера разработчика: ./deploy/deploy.sh user@server
# Образ собирается здесь и уезжает на сервер готовым. Миграции применяются при старте приложения.
set -eu
SERVER=${1:?укажите сервер, например ubuntu@1.2.3.4}
DIR=/opt/knizhki
cd "$(dirname "$0")/.."

npm run lint
npm test
docker buildx build --platform linux/amd64 -t knizhki:latest --load .
docker save knizhki:latest | gzip | ssh "$SERVER" "gunzip | docker load"
ssh "$SERVER" "mkdir -p $DIR"
scp deploy/docker-compose.yml deploy/Caddyfile deploy/backup.sh deploy/restore.sh "$SERVER:$DIR/"
ssh "$SERVER" "cd $DIR && chmod +x backup.sh restore.sh && docker compose up -d && docker image prune -f"
echo "deployed"
