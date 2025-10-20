import { NestFactory } from "@nestjs/core"
import { AppModule } from "./app.module"
import { WinstonModule } from "nest-winston"
import { getWinstonOptions } from "./get-winston-options"

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(getWinstonOptions()),
  })
  const globalPrefix = "api"
  app.setGlobalPrefix(globalPrefix)
  const port = process.env.PORT || 8000
  await app.listen(port)
  console.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`)
}

bootstrap()
