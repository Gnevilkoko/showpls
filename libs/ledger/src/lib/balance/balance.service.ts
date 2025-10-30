import { Injectable } from "@nestjs/common"
import { InjectDataSource } from "@nestjs/typeorm"
import { DataSource, EntityManager } from "typeorm"
import { z } from "zod"
import { Balance } from "@ledger/entities"
import LedgerExceptions from "@ledger/ledger.exceptions"

@Injectable()
export class BalanceService {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}

  async create(params: CreateBalanceParams, manager: EntityManager | undefined) {
    const result = schema.safeParse(params)
    if (!result.success) {
      throw new LedgerExceptions.InvalidProvidedData()
    }
    const { currencyId, accountId } = result.data
    manager = manager || this.dataSource.manager
    const insertResult = await manager
      .createQueryBuilder()
      .insert()
      .into(Balance)
      .values({
        currencyId,
        accountId,
        amount: "0",
        lockedAmount: "0",
        updatedAt: new Date(),
      })
      .returning("*")
      .execute()

    return manager.create(Balance, insertResult.raw[0] as object)
  }

  async retrieve(params: RetrieveBalanceParams, manager: EntityManager | undefined) {
    const result = schema.safeParse(params)
    if (!result.success) {
      throw new LedgerExceptions.InvalidProvidedData()
    }
    const { currencyId, accountId } = result.data

    return await (manager || this.dataSource.manager).getRepository(Balance).findOne({
      where: {
        currencyId,
        accountId,
      },
    })
  }
}

const schema = z.object({
  currencyId: z.coerce.bigint().positive().transform(String),
  accountId: z.coerce.bigint().positive().transform(String),
})

export type CreateBalanceParams = z.infer<typeof schema>
export type RetrieveBalanceParams = z.infer<typeof schema>
