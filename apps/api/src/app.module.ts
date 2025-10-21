import { Module } from "@nestjs/common"
import { AppService } from "./app.service"
import { WinstonModule } from "nest-winston"
import { getWinstonOptions } from "./get-winston-options"
import { format, transports } from "winston"
import { CacheModule } from "@nestjs/cache-manager"
import Keyv from "keyv"
import ms from "ms"
import { TypeOrmModule } from "@nestjs/typeorm"
import { DatabaseConfig, RedisConfig } from "./config"
import { RedisModule } from "@liaoliaots/nestjs-redis"
import { ThrottlerModule, ThrottlerModuleOptions } from "@nestjs/throttler"
import {DataSource, DataSourceOptions} from "typeorm"
import {CacheableMemory} from "cacheable"
import { AuthModule } from "./modules/auth/auth.module"

@Module({
  imports: [
    WinstonModule.forRoot({
      ...getWinstonOptions()
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        return {
          stores: [
            new Keyv({
              store: new CacheableMemory({ ttl: ms("5m"), lruSize: 500 }),
            }),
            // new KeyvRedis(RedisConfig.getDSN())
          ],
        }
      },
    }),
    TypeOrmModule.forRootAsync({
      name: "default",
      inject: [],
      useFactory: async () => {
        return {
          ...DatabaseConfig,
        }
      },
      dataSourceFactory: async (options) => {
        return new DataSource(options as DataSourceOptions)
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
    AuthModule
  ],
  providers: [AppService],
  controllers: [],
})
export class AppModule {}
