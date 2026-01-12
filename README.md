## To run everything inside docker (For cross-platform development consistency)
```shell
docker-compose -f docker-compose-local.yaml up -d
```
### Launch tests
```shell
docker-compose -f docker-compose-local.yaml exec api nx test api --runInBand --silent
docker-compose -f docker-compose-local.yaml exec api nx test ledger --runInBand --silent
```

---

## Launch dev api and web outside Docker
### Postgres, redis will be inside docker

```shell
docker-compose -f dev-docker-compose.yaml up -d
npm run dev:api
npm run dev:web
```

### Launch tests 

```shell
docker-compose -f dev-docker-compose.yaml up -d 
nx test api --runInBand --silent
nx test ledger --runInBand --silent
```
