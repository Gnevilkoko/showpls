import { NestFactory } from "@nestjs/core"
import { AppModule } from "./app.module"
import { WinstonModule } from "nest-winston"
import { getWinstonOptions } from "./get-winston-options"
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger"
import { cleanupOpenApiDoc } from "nestjs-zod"
import { ConfigService } from "./config"
import { AppService } from "./app.service"

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(getWinstonOptions()),
  })

  await AppService.upgrade(app)

  if (ConfigService.isDevelopment()) {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle("Showpls API").setDescription("Showpls API description").setVersion("1.0").build(),
      {
        extraModels: [],
      }
    )
    SwaggerModule.setup("api/swagger", app, cleanupOpenApiDoc(document))
  }

  const port = 8080
  await app.listen(port)
}

bootstrap()
