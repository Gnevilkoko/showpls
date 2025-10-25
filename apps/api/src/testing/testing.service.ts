import { TestingModule } from "@nestjs/testing"
import { AppService } from "../app.service"
import { DynamicModule, ExecutionContext, INestApplication } from "@nestjs/common"
import { DataSource, DataSourceOptions } from "typeorm"
import { DatabaseConfig, RedisConfig } from "../config"
import Redis from "ioredis"
import { WinstonModule } from "nest-winston"
import { AuthModule } from "../modules/auth/auth.module"
import { RedisModule } from "@liaoliaots/nestjs-redis"
import { ThrottlerModule, ThrottlerModuleOptions } from "@nestjs/throttler"
import ms from "ms"
import { TypeOrmModule } from "@nestjs/typeorm"
import { getWinstonOptions } from "../get-winston-options"
import { ClsModule } from "nestjs-cls"

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

  static getMustHaveModules(): (DynamicModule | { new (): any })[] {
    return [
      // CacheModule.registerAsync({
      //   isGlobal: true,
      //   useFactory: async () => {
      //     return {
      //       stores: [
      //         new Keyv({
      //           store: new CacheableMemory({ ttl: ms("5m"), lruSize: 500 }),
      //         }),
      //       ],
      //     }
      //   },
      // }),
      ClsModule.forRoot({
        global: true,
        middleware: {
          mount: false,
        },
      }),
      WinstonModule.forRoot({
        ...getWinstonOptions(),
      }),
      TypeOrmModule.forRootAsync({
        name: "default",
        inject: [],
        useFactory: async () => {
          return {
            ...DatabaseConfig,
            autoLoadEntities: true,
          }
        },
        dataSourceFactory: async (options) => {
          const dataSource = new DataSource({ ...options } as DataSourceOptions)
          // await dataSource.initialize()
          return dataSource
        },
      }),
      RedisModule.forRoot({
        config: {
          url: RedisConfig.getDSN(),
        },
        closeClient: true,
        readyLog: true,
        errorLog: true,
      }),
      ThrottlerModule.forRootAsync({
        useFactory: () => {
          return {
            skipIf: (_: ExecutionContext) => {
              return true
            },
            throttlers: [
              {
                name: "default",
                ttl: ms("1m"),
                limit: 50,
              },
            ],
          } as ThrottlerModuleOptions
        },
      }),
      AuthModule,
    ]
  }
}
