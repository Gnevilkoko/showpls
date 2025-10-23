import { Module } from "@nestjs/common"
import { AppService } from "./app.service"
import { WinstonModule, utilities } from "nest-winston"
import { getWinstonOptions } from "./get-winston-options"
import ms from "ms"
import { TypeOrmModule } from "@nestjs/typeorm"
import { DatabaseConfig, RedisConfig } from "./config"
import { RedisModule } from "@liaoliaots/nestjs-redis"
import { ThrottlerModule, ThrottlerModuleOptions } from "@nestjs/throttler"
import { DataSource, DataSourceOptions } from "typeorm"
import { AuthModule } from "./modules/auth/auth.module"
import path from "path"
import { AcceptLanguageResolver, HeaderResolver, I18nModule } from "nestjs-i18n"
import { LanguageCode } from "@share"


@Module({
  imports: [
    WinstonModule.forRoot({
      ...getWinstonOptions(),

    }),

    // CacheModule.registerAsync({
    //   isGlobal: true,
    //   useFactory: async () => {
    //     return {
    //       stores: [
    //         new Keyv({
    //           store: new CacheableMemory({ ttl: ms("5m"), lruSize: 500 }),
    //         }),
    //         new KeyvRedis(RedisConfig.getDSN())
    // ],
    // }
    // },
    // }),
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
    I18nModule.forRoot({
      logging: false,
      fallbackLanguage: LanguageCode.EN,
      loaderOptions: {
        path: path.join(__dirname, "/assets/i18n/"),
        watch: false,
      },
      resolvers: [new AcceptLanguageResolver({ // RFC4647, BCP 47(Best Current Practice 47), <language>-<region>.
        matchType: "loose"
      })],
    }),

    AuthModule,
  ],
  providers: [AppService],
  controllers: [],
})
export class AppModule {}
