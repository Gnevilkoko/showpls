import { Logger } from "@nestjs/common"
import { z } from "zod"
import { ConfigService } from "./config.service"
import corsConfig from "./cors.config"
import databaseConfig from "./database.config"
import jwtConfig from "./jwt.config"
import redisConfig from "./redis.config"
import sessionConfig from "./session.config"

export const logger = new Logger("Config")

z.enum(["development", "production", "test"]).parse(process.env.NODE_ENV)

ConfigService.loadEnv()





export const CorsConfig = corsConfig()
export const DatabaseConfig = databaseConfig()
export const RedisConfig = redisConfig()
export const JwtConfig = jwtConfig()
export const SessionConfig = sessionConfig()


// @ts-ignore
logger.log(`Environment: ${ConfigService.NODE_ENV}`)
if (!ConfigService.isProduction()) {
  logger.log(`Throttling disabled`)
  logger.log(`Caching disabled`)
}
