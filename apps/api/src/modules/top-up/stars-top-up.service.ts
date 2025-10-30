import { Injectable, Logger } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { Context, Telegraf } from "telegraf"
import { InjectBot } from "nestjs-telegraf"
import { StarsTopUp } from "@share/entities"
import { retryWithExponentialBackoff } from "@share/utils"
import { DbHelpers } from "../../db"
import { UserService } from "../user"

import { randomUUID } from "crypto"
import { StarsTopUpListDto } from "./dto/stars-top-up.list.dto"
import { paginate } from "nestjs-typeorm-paginate"
import { Ledger } from "@ledger"
import { Token } from "@share"

@Injectable()
export class StarsTopUpService {
  protected logger = new Logger(StarsTopUpService.name)
  protected externalType = "stars"

  constructor(
    @InjectRepository(StarsTopUp) public repository: Repository<StarsTopUp>,
    @InjectBot() protected bot: Telegraf<Context>,
    protected userService: UserService,
    protected ledger: Ledger
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
        amount: amount * 1e6,
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
    const currency = (await this.ledger.currency.retrieve({
      code: Token.STARS,
      blockchain: null,
    }))!

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
            throw new Error(`Not found`)
          }

          if (topUp.paid) {
            return
          }

          await repository.update(
            { id },
            {
              paid: true,
              txid,
            }
          )

          await this.ledger.createDeposit(
            {
              userId: topUp.userId,
              amount: BigInt(topUp.amount),
              currencyId: currency.id,
              externalId: topUp.id,
              externalType: this.externalType,
            },
            manager
          )

          // await this.userService.incrementBalance(
          //   {
          //     userId: topUp.userId,
          //     amount: topUp.amount.toString(),
          //     token: Token.STARS,
          //   },
          //   manager
          // )
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
            throw new Error(`Not found`)
          }

          if (topUp.refunded) {
            return
          }

          await repository.update(
            { id },
            {
              refunded: true,
            }
          )

          await this.ledger.revertDeposit(
            {
              externalId: topUp.id,
              externalType: this.externalType,
            },
            manager
          )

          // await this.userService.decrementBalance(
          //   {
          //     userId: topUp.userId,
          //     amount: topUp.amount.toString(),
          //     token: Token.STARS,
          //   },
          //   manager
          // )
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
}

export type ProcessPaymentParams = {
  id: string
  txid: string
}

export type CreateStarsTopUp = {
  userId: string
  amount: number
}
