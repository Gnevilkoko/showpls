#!/usr/bin/env bash
set -euo pipefail
# Синхронизация репозитория на VPS и перезапуск api/web (см. README).
# Пример: ./scripts/deploy-rsync-testnet.sh user@host
# Или:    DEPLOY_PATH=~/showpls-testnet ./scripts/deploy-rsync-testnet.sh user@host

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="${1:-${DEPLOY_SSH:-}}"
REMOTE_DIR="${DEPLOY_PATH:-~/showpls-testnet}"

if [[ -z "${TARGET}" ]]; then
  echo "Usage: $0 user@vps-host"
  echo "   or: DEPLOY_SSH=user@host $0"
  exit 1
fi

echo "Rsync: server .env files are NOT touched (--exclude '.env*')."
rsync -az "${ROOT}/" "${TARGET}:${REMOTE_DIR}/" \
  --exclude=.git \
  --exclude=node_modules \
  --exclude=data \
  --exclude=media \
  --exclude='.env*' \
  --exclude='**/dist' \
  --exclude=.nx \
  --exclude=coverage

ssh "${TARGET}" "cd ${REMOTE_DIR} && docker compose -f docker-compose.server.yaml restart api web"

echo "Done: synced to ${TARGET}:${REMOTE_DIR} and restarted api web."
