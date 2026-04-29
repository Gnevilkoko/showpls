import { Injectable, Logger, OnApplicationShutdown, OnModuleInit } from "@nestjs/common"
import { InjectBot } from "nestjs-telegraf"
import type { Context, Telegraf } from "telegraf"
import { BotConfig, ConfigService } from "../../config"

/**
 * nestjs-telegraf при launchOptions !== false вызывает bot.launch() в factory и падает на getMe(),
 * если api.telegram.org недоступен — весь API не поднимается. Отключаем автозапуск в модуле и
 * подключаем бота здесь с бесконечными ретраями.
 */
@Injectable()
export class BotLaunchService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(BotLaunchService.name)
  private launched = false
  private retryTimer: ReturnType<typeof setTimeout> | null = null

  constructor(@InjectBot() private readonly bot: Telegraf<Context>) {}

  onModuleInit() {
    this.scheduleRetry(2000)
  }

  onApplicationShutdown() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer)
      this.retryTimer = null
    }
  }

  private scheduleRetry(ms: number) {
    if (this.retryTimer) clearTimeout(this.retryTimer)
    this.retryTimer = setTimeout(() => void this.tryLaunch(), ms)
  }

  private async tryLaunch() {
    if (this.launched) return
    try {
      if (ConfigService.isProduction()) {
        await this.bot.launch({
          webhook: {
            domain: BotConfig.domain,
            path: BotConfig.webhookSecretPath,
          },
        })
      } else {
        await this.bot.launch()
      }
      this.launched = true
      this.logger.log("Telegram bot launched")
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      this.logger.warn(`Telegram bot launch failed (${msg}), retry in 60s`)
      this.scheduleRetry(60_000)
    }
  }
}
