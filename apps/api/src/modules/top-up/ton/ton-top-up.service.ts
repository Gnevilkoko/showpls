import { Injectable, Logger } from "@nestjs/common"
import { Blockchain, Token } from "@share"
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm"
import { TONIgnoredTransaction, TONTopUp } from "@share/entities"
import { DataSource, Repository } from "typeorm"
import { Ledger } from "@ledger"
import { z } from "zod"
import { retryWithExponentialBackoff } from "@share/utils"
import { DbHelpers } from "../../../db"
import { StarsTopUpListDto } from "../dto/stars-top-up.list.dto"
import { paginate } from "nestjs-typeorm-paginate"
import { TONTopUpListDto } from "./dto/ton-top-up-list.dto"

@Injectable()
export class TONTopUpService {
  protected logger = new Logger(TONTopUpService.name)
  protected externalType = "ton"

  constructor(
    @InjectRepository(TONTopUp) protected repository: Repository<TONTopUp>,
    @InjectDataSource() protected dataSource: DataSource,
    protected ledger: Ledger
  ) {}

  async create({ userId }: CreateTONTopUpParams) {
    const insertResult = await this.dataSource
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

    const currency = (await this.ledger.currency.retrieve({
      code: token,
      blockchain: Blockchain.TON,
    }))!

    await retryWithExponentialBackoff(
      async () => {
        return await this.dataSource.manager.transaction("SERIALIZABLE", async (manager) => {
          const repository = manager.getRepository(TONTopUp)

          const topUp: TONTopUp | null = await repository.findOne({
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
            this.logger.warn({
              message: "TopUp already marked as paid",
              data: {
                id: topUp.id,
              },
            })
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
        })
      },
      (e) => DbHelpers.isSerializationFailure(e)
    )
  }
}

const schema = z.object({
  txid: z.string().min(1),
  amount: z.bigint().positive(),
  token: z.enum(Token),
  memo: z.bigint().positive(),
})

type ProcessPaymentParams = z.infer<typeof schema>

export type CreateTONTopUpParams = {
  userId: string
}
