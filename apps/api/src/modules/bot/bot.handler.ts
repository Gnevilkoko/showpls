import { Command, InjectBot, On, Start, Update } from "nestjs-telegraf"
import { Context, Telegraf } from "telegraf"
import { StarsTopUpService } from "../top-up/stars/stars-top-up.service"
import { z } from "zod"
import { SuccessfulPayment } from "telegraf/typings/core/types/typegram"
import { InjectLogger } from "@server/logging"
import { Logger } from "@nestjs/common"


@Update()
export class BotHandler {
  protected logger: Logger = new Logger(BotHandler.name)
  constructor(
    @InjectBot() protected bot: Telegraf<Context>,
    protected starsTopUpService: StarsTopUpService
  ) {}

  @Start()
  async onStart(ctx: Context & { payload?: string }) {}

  @On(`pre_checkout_query`)
  async handlePreCheckoutQuery(ctx: Context) {
    const { preCheckoutQuery } = ctx
    if (!preCheckoutQuery) {
      return
    }

    const { invoice_payload } = preCheckoutQuery
    const id = invoice_payload

    if (!z.uuidv4().safeParse(id).success) {
      await this.bot.telegram.answerPreCheckoutQuery(preCheckoutQuery.id, false, `Invalid id`)
      return
    }

    const topUp = await this.starsTopUpService.repository.findOne({
      where: {
        id,
      },
    })

    if (!topUp) {
      await this.bot.telegram.answerPreCheckoutQuery(preCheckoutQuery.id, false, `Invoice not found`)
      return
    }

    await this.bot.telegram.answerPreCheckoutQuery(preCheckoutQuery.id, true)
  }

  @On("message")
  async onMessage(ctx: Context) {
    const { message } = ctx
    if (!message) {
      return
    }
    const successfullPayment = (message as { successful_payment?: SuccessfulPayment }).successful_payment

    if (successfullPayment) {
      await this.starsTopUpService.processSuccessfullPayment({
        id: successfullPayment.invoice_payload,
        txid: successfullPayment.telegram_payment_charge_id,
      })
      return
    }

    const refundedPayment = (
      message as {
        refunded_payment?: {
          invoice_payload: string
          telegram_payment_charge_id: string
        }
      }
    ).refunded_payment

    if (refundedPayment) {
      await this.starsTopUpService.processRefundedPayment({
        id: refundedPayment.invoice_payload,
        txid: refundedPayment.telegram_payment_charge_id,
      })
      return
    }
  }

  // add terms, support commands

  @Command("paysupport")
  async onPaySupport(ctx: Context) {
    await ctx.replyWithHTML(`To clarify the possibility of a refund, write to support`)
  }
}
