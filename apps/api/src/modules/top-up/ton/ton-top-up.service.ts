import { Injectable, Logger, Provider } from "@nestjs/common"
import { Blockchain, Token } from "@share"
import { getRepositoryToken, InjectDataSource, InjectRepository } from "@nestjs/typeorm"
import { StarsTopUp, TONIgnoredTransaction, TONTopUp } from "@share/entities"
import { DataSource, Repository } from "typeorm"
import { Ledger } from "@ledger"
import { z } from "zod"
import { retryWithExponentialBackoff } from "@share/utils"
import { DbHelpers } from "../../../db"
import { paginate } from "nestjs-typeorm-paginate"
import { TONTopUpListDto } from "./dto/ton-top-up-list.dto"
import { Currency } from "@ledger/entities"
import { Context, Telegraf } from "telegraf"
import { StarsTopUpService } from "../stars/stars-top-up.service"

@Injectable()
export class TONTopUpService {
  protected logger = new Logger(TONTopUpService.name)
  protected externalType = "ton"

  protected constructor(
    @InjectRepository(TONTopUp) protected repository: Repository<TONTopUp>,
    protected ledger: Ledger,
    protected currencies: Record<Token.TON | Token.USDT, Currency>
  ) {}

  async create({ userId }: CreateTONTopUpParams) {
    const insertResult = await this.repository
      .createQueryBuilder()
      .insert()
      .into(TONTopUp)
      .values({
        userId,
        txid: null,
        amount: null,
        token: null,
        paid: false,
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

  async list({ page, limit, filter, sort }: TONTopUpListDto) {
    return await paginate(
      this.repository,
      { page, limit },
      {
        where: {
          txid: filter.txid,
          paid: filter.paid,
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

  async processPayment(params: ProcessPaymentParams) {
    const result = schema.safeParse(params)

    if (!result.success) {
      throw new Error(`Invalid data provided, data: ${JSON.stringify(params)}`)
    }

    const { txid, amount, token, memo } = result.data

    const currency = this.currencies[token]

    const topUp = await retryWithExponentialBackoff(
      async () => {
        return await this.repository.manager.transaction("SERIALIZABLE", async (manager) => {
          const repository = manager.getRepository(TONTopUp)

          const topUp = await repository.findOne({
            where: {
              memo: memo.toString(),
            },
          })

          if (!topUp) {
            await manager.getRepository(TONIgnoredTransaction).insert({
              txid,
              reason: "No associated top up",
            })
            return
          }

          if (topUp.paid) {
            if (topUp.txid !== txid) {
              await manager.getRepository(TONIgnoredTransaction).insert({
                txid,
                reason: "transaction contains the memo that is associated with another transaction",
              })
            } else {
              this.logger.warn({
                message: "TopUp already marked as paid",
                data: {
                  id: topUp.id,
                },
              })
            }
            return
          }

          await repository.update(
            { id: topUp.id },
            {
              paid: true,
              txid,
              amount: amount.toString(),
              token,
            }
          )

          await this.ledger.deposit.create(
            {
              userId: topUp.userId,
              amount: amount,
              currencyId: currency.id,
              externalId: topUp.id,
              externalType: this.externalType,
            },
            manager
          )

          await manager.getRepository(TONIgnoredTransaction).insert({
            txid,
            reason: "successfully processed",
          })
          return topUp
        })
      },
      (e) => DbHelpers.isSerializationFailure(e)
    )

    if (topUp) {
      this.logger.log({
        message: "TopUp is paid",
        data: {
          id: topUp.id,
        },
      })
    }
  }

  public static async initialize(repository: Repository<TONTopUp>, ledger: Ledger) {
    const TON = await ledger.currency.retrieve({
      blockchain: Blockchain.TON,
      code: Token.TON,
    })
    const USDT = await ledger.currency.retrieve({
      blockchain: Blockchain.TON,
      code: Token.USDT,
    })
    if (!TON) {
      throw new Error(`Currency not found by code: ${Token.TON}`)
    }

    if (!USDT) {
      throw new Error(`Currency not found by code: ${Token.USDT}`)
    }

    return new TONTopUpService(repository, ledger, {
      [Token.TON]: TON,
      [Token.USDT]: USDT,
    })
  }
}

const schema = z.object({
  txid: z.string().min(1),
  amount: z.bigint().positive(),
  token: z.enum([Token.TON, Token.USDT]),
  memo: z.bigint().positive(),
})

type ProcessPaymentParams = z.infer<typeof schema>

export type CreateTONTopUpParams = {
  userId: string
}

export const TONTopUpServiceProvider: Provider = {
  provide: TONTopUpService,
  inject: [getRepositoryToken(TONTopUp), Ledger],
  useFactory: async (repository: Repository<TONTopUp>, ledger: Ledger) => {
    return await TONTopUpService.initialize(repository, ledger)
  },
}
