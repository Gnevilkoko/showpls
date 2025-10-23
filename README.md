

## Launch backend

```shell
docker-compose -f dev-docker-compose.yaml up
nx run api:dev 
```


## Launch tests 

```shell
nx test api # unit tests
nx e2e api-e2e --runInBand --codeCoverage  # e2e tests
```
