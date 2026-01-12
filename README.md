## To run everything inside docker (For cross-platform development consistency)
```shell
docker-compose -f docker-compose-local.yaml up -d
```
### Launch tests
```shell
docker-compose -f docker-compose-local.yaml exec -w /app api npm run test:api
docker-compose -f docker-compose-local.yaml exec -w /app api npm run test:ledger
```

---

## Launch dev api and web outside Docker.
### Suitable if you don't have node/npm installed locally
### Postgres, redis will be inside docker

```shell
docker-compose -f dev-docker-compose.yaml up -d
npm run dev:api
npm run dev:web
```

### Launch tests 

```shell
docker-compose -f dev-docker-compose.yaml up -d 
npm run test:api ### OR: nx test api --runInBand --silent
npm run test:ledger ### OR: nx test ledger --runInBand --silent
```
