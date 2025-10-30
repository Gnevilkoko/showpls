import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common"
import { WinstonModule } from "nest-winston"
import { getWinstonOptions } from "./get-winston-options"
import ms from "ms"
import { TypeOrmModule } from "@nestjs/typeorm"
import { BotConfig, ConfigService, DatabaseConfig, RedisConfig } from "./config"
import { RedisModule } from "@liaoliaots/nestjs-redis"
import { ThrottlerModule, ThrottlerModuleOptions } from "@nestjs/throttler"
import { DataSource, DataSourceOptions } from "typeorm"
import { AuthModule } from "./modules/auth/auth.module"
import path from "path"
import { AcceptLanguageResolver, I18nModule } from "nestjs-i18n"
import { FallbackLanguageCode, Token } from "@share"
import { ClsModule } from "nestjs-cls"
import { TelegrafModule } from "nestjs-telegraf"
import { BotHandler } from "./modules/bot/bot.handler"
import { TopUpModule } from "./modules/top-up/top-up.module"
import { LedgerModule } from "@ledger"

@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: false,
      },
    }),
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
      fallbackLanguage: FallbackLanguageCode,
      loaderOptions: {
        path: path.join(__dirname, "/assets/i18n/"),
        watch: false,
      },
      resolvers: [
        new AcceptLanguageResolver({
          // RFC4647, BCP 47(Best Current Practice 47), <language>-<region>.
          matchType: "loose",
        }),
      ],
    }),
    TelegrafModule.forRoot({
      token: BotConfig.token,
      launchOptions: {
        webhook: ConfigService.isProduction()
          ? {
              domain: BotConfig.domain,
              path: BotConfig.webhookSecretPath,
            }
          : undefined,
      },
    }),
    LedgerModule.forRootAsync({
      initialize: async (dataSource, accountService, balanceService, currencyService) => {
        if (Token.STARS) {
          let currency = await currencyService.retrieve({
            code: Token.STARS,
            blockchain: null,
          })
          if (!currency) {
            await currencyService.create({
              name: Token.STARS,
              code: Token.STARS,
              scale: 6,
              blockchain: null,
            })
          }
        }
      },
    }),
    AuthModule,
    TopUpModule,
  ],
  providers: [BotHandler],
  controllers: [],
  exports: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // consumer.apply(ClsMiddleware, RequestLoggingMiddleware).forRoutes("*")
  }
}
