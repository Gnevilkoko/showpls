import { NestFactory } from "@nestjs/core"
import { AppModule } from "./app.module"
import { WinstonModule } from "nest-winston"
import { getWinstonOptions } from "./get-winston-options"
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger"
import { cleanupOpenApiDoc } from "nestjs-zod"
import { BotConfig, ConfigService, CorsConfig } from "./config"
import { AppService } from "./app.service"
import { APIExceptionResponse } from "@server/api"
import { Context, Telegraf } from "telegraf"
import { getBotToken } from "nestjs-telegraf"

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(getWinstonOptions()),
  })

  // Применяем конфигурацию CORS для HTTP запросов
  app.enableCors(CorsConfig)

  await AppService.upgrade(app)

  if (ConfigService.isProduction()) {
    const bot = app.get<Telegraf<Context>>(getBotToken())
    app.use(bot.webhookCallback(BotConfig.webhookSecretPath))
  }

  if (ConfigService.isDevelopment()) {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle("Showpls API")
        .setDescription("Showpls API description")
        .setVersion("1.0")
        .addBearerAuth(
          {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
          "jwt-auth"
        )
        .build(),
      {
        deepScanRoutes: true,
        extraModels: [APIExceptionResponse],
      }
    )
    SwaggerModule.setup("api/swagger", app, cleanupOpenApiDoc(document))
  }

  const port = 8080
  await app.listen(port)
}

bootstrap()
