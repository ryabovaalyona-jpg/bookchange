#!/bin/sh
# Ежедневная резервная копия (PRD, раздел 11): дамп базы и архив фото в Yandex Object Storage.
# На сервере, из папки deploy: crontab -e →  30 3 * * * cd /opt/knizhki && ./backup.sh >> backup.log 2>&1
# Срок хранения 14 дней задаётся правилом жизненного цикла бакета (docs/deploy.md).
set -eu
cd "$(dirname "$0")"
. ./.env

STAMP=$(date -u +%Y-%m-%d_%H%M)
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

docker compose exec -T db pg_dump -U knizhki -Fc knizhki > "$WORK/db-$STAMP.dump"
docker compose run --rm --no-deps --user root -v "$WORK:/backup" --entrypoint tar app \
  -czf "/backup/uploads-$STAMP.tar.gz" -C /data uploads

for file in "$WORK"/*; do
  docker run --rm -v "$WORK:/backup:ro" \
    -e AWS_ACCESS_KEY_ID -e AWS_SECRET_ACCESS_KEY -e AWS_DEFAULT_REGION=ru-central1 \
    amazon/aws-cli --endpoint-url=https://storage.yandexcloud.net \
    s3 cp "/backup/$(basename "$file")" "s3://$BACKUP_BUCKET/$STAMP/$(basename "$file")"
done
echo "backup $STAMP ok"
