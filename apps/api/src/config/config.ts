import { z } from "zod"
import { ConfigService } from "./config.service"
import corsConfig from "./cors.config"
import databaseConfig from "./database.config"
import jwtConfig from "./jwt.config"
import redisConfig from "./redis.config"
import sessionConfig from "./session.config"
import botConfig from "./bot.config"
import { randomBytes } from "node:crypto"

z.enum(["development", "production", "test"]).parse(process.env.NODE_ENV)

ConfigService.loadEnv()

export const DOMAIN = process.env.DOMAIN as string
if (!DOMAIN) {
  throw new Error(`Set "DOMAIN" env variable`)
}

export const BotConfig = {
  ...botConfig(),
  domain: DOMAIN,
  webhookSecretPath: `/api/bot/${botConfig().webhookPath}`,
}
export const CorsConfig = corsConfig()
export const DatabaseConfig = databaseConfig()
export const RedisConfig = redisConfig()
export const JwtConfig = jwtConfig()
export const SessionConfig = sessionConfig()
