## Before starting, change the .env.development variables "POSTGRES_HOST" and "REDIS_HOST"

## ⚠️ Сервер / данные БД

**В `docker-compose.server.yaml` Postgres и Redis привязаны к папкам на диске** (`./data/postgres`, `./data/redis`), а не к томам Docker. Поэтому:
- **`docker compose down -v` не удаляет данные БД** — удаляются только именованные тома из этого файла (node_modules, letsencrypt), а данные лежат в `./data/`, не в томах.
- Потерять данные можно только если вручную удалить папку `./data` на сервере или запускать на сервере **другой** compose (`docker-compose-local.yaml`) с томами.

**На сервере использовать только `docker-compose.server.yaml`** (или скопировать его в `docker-compose.yaml`, тогда можно вызывать `docker compose` без `-f`):

```bash
cd ~/showpls-testnet
docker compose -f docker-compose.server.yaml up -d
# Перезапуск только api и web (postgres/redis не трогаем):
docker compose -f docker-compose.server.yaml restart api web
```

- **Не запускать** на сервере `docker-compose-local.yaml` — там данные в томах, при `down -v` они удалятся.
- **Деплой:** rsync без `--delete`, с `--exclude=data`; затем только `restart api web`. Не делать `down`, не перезапускать postgres/redis.

### Wallet balance on server

Balances are stored in **minimal units** (1 STARS = 1e6, so 100 STARS = 100000000 in DB). The API returns `balance` and `lockedBalance` as strings; the UI divides by 1e6.

If the wallet shows 0 on the server, check that the user has an account and a STARS balance row. Example (run in Postgres on the server; replace `USER_ID` with the user id, e.g. `3`):

```sql
SELECT a.id AS account_id, a."ownerId", c.code AS currency_code, b.amount, b."lockedAmount"
FROM account a
LEFT JOIN balance b ON b."accountId" = a.id
LEFT JOIN currency c ON c.id = b."currencyId"
WHERE a."ownerType" = 'user' AND a."ownerId" = 'USER_ID';
```

If there is no row or `amount` is 0, insert/update the account and balance (use the correct `currency.id` for STARS from `SELECT id, code FROM currency WHERE code = 'STARS' AND blockchain IS NULL`).

## To run everything inside docker (For cross-platform development consistency)
### Works on localhost:8000

```shell
docker-compose -f docker-compose-local.yaml up -d
```
### Launch tests
```shell
docker-compose -f docker-compose-local.yaml exec -w /app api npm run test:api
docker-compose -f docker-compose-local.yaml exec -w /app api npm run test:ledger
```

---

## Recommended for frontend development under Windows OS.
## Launch dev api and web outside Docker.
### Postgres, redis will be inside docker
### Works on localhost:80

```shell
docker-compose -f dev-docker-compose.yaml up -d
npx nx run api:dev
npx nx run web:serve
```

### Launch tests 

```shell
docker-compose -f dev-docker-compose.yaml up -d 
npm run test:api ### OR: nx test api --runInBand --silent
npm run test:ledger ### OR: nx test ledger --runInBand --silent
```
