import { Injectable, Logger, Provider } from "@nestjs/common"
import { getRepositoryToken, InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { Context, Telegraf } from "telegraf"
import { getBotToken, InjectBot } from "nestjs-telegraf"
import { StarsTopUp } from "@share/entities"
import { retryWithExponentialBackoff } from "@share/utils"
import { DbHelpers } from "../../../db"
import { UserService } from "../../user"

import { randomUUID } from "crypto"
import { StarsTopUpListDto } from "./dto/stars-top-up.list.dto"
import { paginate } from "nestjs-typeorm-paginate"
import { Ledger } from "@ledger"
import { Token } from "@share"
import TopUpExceptions from "../top-up.exceptions"
import { Currency } from "@ledger/entities"

@Injectable()
export class StarsTopUpService {
  protected logger = new Logger(StarsTopUpService.name)
  protected externalType = "stars"

  protected constructor(
    @InjectRepository(StarsTopUp) public repository: Repository<StarsTopUp>,
    @InjectBot() protected bot: Telegraf<Context>,
    protected ledger: Ledger,
    protected currency: Currency
  ) {}

  async create({ amount, userId }: CreateStarsTopUp) {
    const id = randomUUID()

    const link = await this.bot.telegram.createInvoiceLink({
      title: "Top Up",
      description: `Пополнение баланса на ${amount} Stars`,
      payload: id,
      currency: "XTR",
      prices: [
        {
          label: "Top Up Stars Balance",
          amount,
        },
      ],
      provider_token: "",
    })

    const insertResult = await this.repository
      .createQueryBuilder()
      .insert()
      .into(StarsTopUp)
      .values({
        id,
        amount: (amount * 1e6).toString(),
        paid: false,
        link,
        txid: null,
        refunded: false,
        userId,
      })
      .returning("*")
      .execute()

    const topUp = this.repository.create(insertResult.raw[0] as object)
    this.logger.log({
      message: "TopUp created",
      data: {
        id: topUp.id,
        userId: topUp.userId,
      },
    })
    return topUp
  }

  async retrieve(id: string) {
    return await this.repository.findOneOrFail({
      where: {
        id,
      },
    })
  }

  async list({ page, limit, filter, sort }: StarsTopUpListDto) {
    return await paginate(
      this.repository,
      { page, limit },
      {
        where: {
          txid: filter.txid,
          paid: filter.paid,
          refunded: filter.refunded,
          userId: filter.userId,
        },
        order: {
          createdAt: sort.createdAt,
          amount: sort.amount,
        },
        relations: {
          user: true,
        },
      }
    )
  }

  async processSuccessfullPayment({ id, txid }: ProcessPaymentParams) {
    await retryWithExponentialBackoff(
      async () => {
        return await this.repository.manager.transaction("SERIALIZABLE", async (manager) => {
          const repository = manager.getRepository(StarsTopUp)

          const topUp = await repository.findOne({
            where: {
              id,
            },
          })

          if (!topUp) {
            throw new TopUpExceptions.NotFound(
              `TopUp not found by these params: ${JSON.stringify({
                id,
              })}`
            )
          }

          if (topUp.refunded) {
            this.logger.error({
              message: "Cannot process payment for refunded top-up",
              data: { id: topUp.id },
            })
            return
          }

          if (topUp.paid) {
            this.logger.warn({
              message: "TopUp already marked as paid",
              data: {
                id: topUp.id,
              },
            })
            return
          }

          await repository.update(
            { id },
            {
              paid: true,
              txid,
            }
          )

          await this.ledger.deposit.create(
            {
              userId: topUp.userId,
              amount: BigInt(topUp.amount),
              currencyId: this.currency.id,
              externalId: topUp.id,
              externalType: this.externalType,
            },
            manager
          )
        })
      },
      (e) => DbHelpers.isSerializationFailure(e)
    )

    this.logger.log({
      message: `TopUp is paid`,
      data: {
        id,
      },
    })
  }

  async processRefundedPayment({ id }: ProcessPaymentParams) {
    await retryWithExponentialBackoff(
      async () => {
        return await this.repository.manager.transaction("SERIALIZABLE", async (manager) => {
          const repository = manager.getRepository(StarsTopUp)

          const topUp = await repository.findOne({
            where: {
              id,
            },
          })

          if (!topUp) {
            throw new TopUpExceptions.NotFound(
              `TopUp not found by these params: ${JSON.stringify({
                id,
              })}`
            )
          }

          if (topUp.refunded) {
            this.logger.warn({
              message: "TopUp already marked as refunded",
              data: {
                id: topUp.id,
              },
            })
            return
          }

          if (!topUp.paid) {
            return
          }

          await repository.update(
            { id },
            {
              refunded: true,
            }
          )

          await this.ledger.deposit.revert(
            {
              externalId: topUp.id,
              externalType: this.externalType,
            },
            manager
          )
        })
      },
      (e) => DbHelpers.isSerializationFailure(e)
    )
    this.logger.log({
      message: "TopUp is refunded",
      data: {
        id,
      },
    })
  }

  public static async initialize(repository: Repository<StarsTopUp>, bot: Telegraf<Context>, ledger: Ledger) {
    const currency = await ledger.currency.retrieve({
      code: Token.STARS,
      blockchain: null,
    })
    if (!currency) {
      throw new Error(`Currency not found by these params: ${JSON.stringify({ code: Token.STARS, blockchain: null })}`)
    }
    return new StarsTopUpService(repository, bot, ledger, currency)
  }
}

export type ProcessPaymentParams = {
  id: string
  txid: string
}

export type CreateStarsTopUp = {
  userId: string
  amount: number
}

export const StarsTopUpServiceProvider: Provider = {
  provide: StarsTopUpService,
  inject: [getRepositoryToken(StarsTopUp), getBotToken(), Ledger],
  useFactory: async (repository: Repository<StarsTopUp>, bot: Telegraf<Context>, ledger: Ledger) => {
    return await StarsTopUpService.initialize(repository, bot, ledger)
  },
}
