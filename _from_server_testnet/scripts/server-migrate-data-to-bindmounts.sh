#!/bin/sh
# Однократная миграция: копирует данные из Docker-томов в ./data/postgres и ./data/redis.
# Запускать из корня проекта на сервере перед первым использованием docker-compose.server.yaml.

set -e
cd "$(dirname "$0")/.."

COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-showpls-testnet}"
POSTGRES_VOLUME="${COMPOSE_PROJECT_NAME}_postgres_data"
REDIS_VOLUME="${COMPOSE_PROJECT_NAME}_redis_data"

mkdir -p data/postgres data/redis

echo "Останавливаем контейнеры (без удаления томов)..."
docker compose -f docker-compose-local.yaml down || true

if docker volume inspect "$POSTGRES_VOLUME" 2>/dev/null; then
  echo "Копируем Postgres из тома $POSTGRES_VOLUME в ./data/postgres ..."
  docker run --rm \
    -v "$POSTGRES_VOLUME:/from:ro" \
    -v "$(pwd)/data/postgres:/to" \
    alpine sh -c "cp -a /from/. /to/"
  echo "Postgres: готово."
else
  echo "Том $POSTGRES_VOLUME не найден — используем пустую ./data/postgres (первый запуск)."
fi

if docker volume inspect "$REDIS_VOLUME" 2>/dev/null; then
  echo "Копируем Redis из тома $REDIS_VOLUME в ./data/redis ..."
  docker run --rm \
    -v "$REDIS_VOLUME:/from:ro" \
    -v "$(pwd)/data/redis:/to" \
    alpine sh -c "cp -a /from/. /to/ 2>/dev/null || true"
  echo "Redis: готово."
else
  echo "Том $REDIS_VOLUME не найден — используем пустую ./data/redis."
fi

echo "Запускаем с привязкой к папкам (данные больше не потеряются)..."
docker compose -f docker-compose-local.yaml -f docker-compose.server.yaml up -d

echo "Готово. Дальше всегда используйте:"
echo "  docker compose -f docker-compose-local.yaml -f docker-compose.server.yaml up -d"
echo "  docker compose -f docker-compose-local.yaml -f docker-compose.server.yaml restart api web"
