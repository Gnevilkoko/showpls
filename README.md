## Launch backend

```shell
docker-compose -f dev-docker-compose.yaml up -d
nx run api:dev 
```


## Launch tests 

```shell
docker-compose -f dev-docker-compose.yaml up -d 
nx test api --runInBand --silent
nx test ledger --runInBand --silent
```
