#!/bin/sh
# Восстановление из резервной копии: ./restore.sh 2026-10-20_0330
# Затирает текущую базу и фото. Проверяется в фазе 1 (PRD, раздел 6).
set -eu
cd "$(dirname "$0")"
. ./.env
STAMP=${1:?укажите метку копии, например 2026-10-20_0330}
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

docker run --rm -v "$WORK:/backup" \
  -e AWS_ACCESS_KEY_ID -e AWS_SECRET_ACCESS_KEY -e AWS_DEFAULT_REGION=ru-central1 \
  amazon/aws-cli --endpoint-url=https://storage.yandexcloud.net \
  s3 cp --recursive "s3://$BACKUP_BUCKET/$STAMP/" /backup/

docker compose stop app
docker compose exec -T db pg_restore -U knizhki -d knizhki --clean --if-exists < "$WORK/db-$STAMP.dump"
docker compose run --rm --no-deps --user root -v "$WORK:/backup:ro" --entrypoint sh app \
  -c "rm -rf /data/uploads/* && tar -xzf /backup/uploads-$STAMP.tar.gz -C /data"
docker compose start app
echo "restore $STAMP ok"
