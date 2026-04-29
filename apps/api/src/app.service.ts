import { INestApplication, Injectable } from "@nestjs/common"
import { getLoggerToken, InjectLogger, ResponseLoggingInterceptor } from "@server/logging"
import fs from "fs"
import { ConfigService, SessionConfig } from "./config"
import cookieParser from "cookie-parser"
import session from "express-session"
import { RedisService } from "@liaoliaots/nestjs-redis"
import { ValidationPipe } from "./common/validation"
import { Logger } from "winston"
import { APIExceptionFilter } from "@server/api/api.exception-filter"
import { ClsService } from "nestjs-cls"

@Injectable()
export class AppService {
  constructor(@InjectLogger() protected logger: Logger) {}

  static async upgrade(app: INestApplication) {
    if (!fs.existsSync(ConfigService.mediaRoot)) {
      fs.mkdirSync(ConfigService.mediaRoot)
    }

    if (!fs.existsSync(ConfigService.mediaPrivateRoot)) {
      fs.mkdirSync(ConfigService.mediaPrivateRoot)
    }

    app.setGlobalPrefix("api")

    const redisService = app.get(RedisService)
    const redis = redisService.getOrThrow()

    const logger = app.get<Logger>(getLoggerToken())

    // @ts-ignore
    app.set("trust proxy", 1) // before set express-session
    // @ts-ignore
    app.set("query parser", "extended")

    app.use(cookieParser(SessionConfig.secret))
    app.use(
      session({
        name: "sessionID",
        secret: SessionConfig.secret,
        resave: false,
        saveUninitialized: false,
        // store: new RedisStore({
        //   client: redis,
        //   prefix: "sess:",
        //   ttl: SessionConfig.maxAge / 1000,
        // }),
        cookie: {
          path: "/",
          secure: ConfigService.isProduction(),
          // sameSite (any value even "none") requires secure: true
          sameSite: ConfigService.isProduction() ? "none" : undefined,
          httpOnly: true,
          priority: "high",
          maxAge: SessionConfig.maxAge,
        },
      })
    )

    // const als = app.get<AsyncLocalStorage<any>>(AsyncLocalStorage)
    // const requestLoggingMiddleware = new RequestLoggingMiddleware(logger, als)
    // app.use(requestLoggingMiddleware.use.bind(requestLoggingMiddleware))

    const clsService = app.get(ClsService)

    const responseLoggingInterceptor = new ResponseLoggingInterceptor(logger, clsService)
    app.useGlobalInterceptors(responseLoggingInterceptor)

    app.useGlobalFilters(new APIExceptionFilter(logger, clsService))
    app.useGlobalPipes(new ValidationPipe())

    app.enableShutdownHooks()
  }
}
