import { INestApplication, Injectable } from "@nestjs/common"
import { getLoggerToken, InjectLogger, ResponseLoggingInterceptor } from "@server/logging"
import fs from "fs"
import { ConfigService, RedisConfig, SessionConfig } from "./config"
import cookieParser from "cookie-parser"
import session from "express-session"
import { RedisStore } from "connect-redis"
import { createClient } from "redis"
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

    const logger = app.get<Logger>(getLoggerToken())

    // @ts-ignore
    app.set("trust proxy", 1) // before set express-session
    // @ts-ignore
    app.set("query parser", "extended")

    app.use(cookieParser(SessionConfig.secret))

    let sessionStore: session.Store | undefined
    try {
      const sessionRedis = createClient({ url: RedisConfig.getDSN() })
      sessionRedis.on("error", (err) => {
        logger.error(`Session Redis client error: ${err instanceof Error ? err.message : String(err)}`)
      })
      await sessionRedis.connect()
      sessionStore = new RedisStore({
        client: sessionRedis,
        prefix: "sess:showpls:",
      })
      logger.info("express-session: using RedisStore (sessions survive API restarts)")
    } catch (e) {
      logger.warn(
        `express-session: Redis unavailable (${e instanceof Error ? e.message : String(e)}), falling back to MemoryStore`
      )
    }

    app.use(
      session({
        name: "sessionID",
        secret: SessionConfig.secret,
        store: sessionStore,
        resave: false,
        saveUninitialized: false,
        rolling: true,
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
