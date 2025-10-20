import { Module } from '@nestjs/common';
import { TypeOrmModule } from "@nestjs/typeorm"
import { DatabaseConfig, RedisConfig } from "./config"
import { DataSource, DataSourceOptions } from "typeorm"
import { RedisModule } from "@liaoliaots/nestjs-redis"
import { CacheableMemory } from "cacheable"
import { CacheModule } from "@nestjs/cache-manager"
import ms from "ms"
import Keyv from "keyv"
import { ThrottlerModule, ThrottlerModuleOptions } from "@nestjs/throttler"

@Module({
  imports: [
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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
