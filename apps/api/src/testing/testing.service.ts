import { TestingModule } from "@nestjs/testing"
import { AppService } from "../app.service"
import { INestApplication } from "@nestjs/common"
import { DataSource } from "typeorm"
import { DatabaseConfig, RedisConfig } from "../config"
import Redis from "ioredis"
import { WinstonModule } from "nest-winston"

export class TestingService {
  static async getApp(module: TestingModule) {
    const app = module.createNestApplication()
    await AppService.upgrade(app)
    await app.init()
    await app.listen(8000, "0.0.0.0")
    app.getUrl = () => TestingService.getAppUrl(app)
    return app
  }

  public static async getAppUrl(app: INestApplication) {
    const { port } = app.getHttpServer().listen().address()
    return `http://localhost:${port}`
  }

    static async dropDataSources() {
    const dataSource = new DataSource(DatabaseConfig)
    await dataSource.initialize()
    await dataSource.synchronize(true)

    const redis = new Redis(RedisConfig.getDSN())
    await new Promise((resolve, reject) => {
      redis.on("connect", () => {
        resolve(undefined)
      })

      redis.on("error", (e) => {
        // console.error(e)
        reject(e)
      })
    })

    redis.flushall()
  }



}
