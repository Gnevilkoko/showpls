## Launch backend

```shell
docker-compose -f dev-docker-compose.yaml up
nx run api:dev 
```


## Launch tests 

```shell
docker-compose -f dev-docker-compose.yaml up -d 
nx test api --runInBand
nx e2e api-e2e --runInBand  
nx test ledger --runInBand
```
