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
import { RequestModule } from "./modules/request/request.module"
import { ResponseModule } from "./modules/response/response.module"
import { DealModule } from "./modules/deal/deal.module"
import { UploadModule } from "./modules/upload/upload.module"
import { QueueModule } from "./modules/queue/queue.module"
import { GeoModule } from "./modules/geo/geo.module"
import path from "path"
import { ChatModule } from "./modules/chat/chat.module"
import { NotificationModule } from "./modules/notification/notification.module"
import { AcceptLanguageResolver, I18nModule } from "nestjs-i18n"
import { Blockchain, FallbackLanguageCode, Token, TokenService } from "@share"
import { ClsModule } from "nestjs-cls"
import { TelegrafModule } from "nestjs-telegraf"
import { BotHandler } from "./modules/bot/bot.handler"
import { TopUpModule } from "./modules/top-up/top-up.module"
import { SubmissionModule } from "./modules/submission/submission.module"
import { ArbitrationModule } from "./modules/arbitration/arbitration.module"
import { LedgerModule } from "@ledger"
import { CacheModule } from "@nestjs/cache-manager"
import KeyvRedis from "@keyv/redis"
import { SpecialsModule } from "./modules/specials/specials.module"
import { HealthModule } from "./modules/health/health.module"
import { DeviceModule } from "./modules/device/device.module"

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
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        return {
          stores: [
            // Using Redis instead of CacheableMemory for better cache management
            // with frequent location updates
            new KeyvRedis(RedisConfig.getDSN()),
          ],
        }
      },
    } as any),
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
    AuthModule,
    RequestModule,
    ResponseModule,
    DealModule,
    UploadModule,
    QueueModule,
    GeoModule,
    ChatModule,
    NotificationModule,

      LedgerModule.forRootAsync({
        setup: async (ledger) => {
          if (Token.STARS) {
            let currency = await ledger.currency.retrieve({
              code: Token.STARS,
              blockchain: null,
            })
            if (!currency) {
              await ledger.currency.create({
                name: Token.STARS,
                code: Token.STARS,
                scale: TokenService.getDecimals(Token.STARS),
                blockchain: null,
              })
            }
          }

          for (let token of Object.values(Token)) {
            let blockchain: string | null = null
            if (token === Token.TON || token === Token.USDT) {
              blockchain = Blockchain.TON
            }

            let currency = await ledger.currency.retrieve({
              code: token,
              blockchain,
            })
            if (!currency) {
              await ledger.currency.create({
                name: token,
                code: token,
                scale: TokenService.getDecimals(token),
                blockchain,
              })
            }
          }
        },
      }),
    TopUpModule,
    SubmissionModule,
    ArbitrationModule,
    SpecialsModule,
    HealthModule,
    DeviceModule,
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
