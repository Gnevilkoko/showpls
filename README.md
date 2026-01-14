## Before starting, change the .env.development variables "POSTGRES_HOST" and "REDIS_HOST"

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
