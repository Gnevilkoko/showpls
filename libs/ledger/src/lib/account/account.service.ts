import { Injectable } from "@nestjs/common"
import { InjectDataSource } from "@nestjs/typeorm"
import { DataSource, EntityManager, IsNull } from "typeorm"
import { z } from "zod"
import { Account, AccountOwnerType, AccountPurpose } from "@ledger/entities"
import LedgerExceptions from "@ledger/ledger.exceptions"

@Injectable()
export class AccountService {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}

  async create(params: CreateAccountParams, manager: EntityManager | undefined) {
    const result = schema.safeParse(params)
    if (!result.success) {
      throw new LedgerExceptions.InvalidProvidedData()
    }
    const { ownerId, ownerType } = result.data
    manager = manager || this.dataSource.manager

    const insertResult = await manager
      .createQueryBuilder()
      .insert()
      .into(Account)
      .values({
        purpose: AccountPurpose.Main,
        ownerType: ownerType,
        ownerId: ownerId,
      })
      .returning("*")
      .execute()

    return manager.create(Account, insertResult.raw[0] as object)
  }

  async retrieve(params: RetrieveAccountParams, manager: EntityManager | undefined) {
    const result = schema.safeParse(params)
    if (!result.success) {
      throw new LedgerExceptions.InvalidProvidedData()
    }
    const { ownerId, ownerType } = result.data
    return await (manager || this.dataSource.manager).getRepository(Account).findOne({
      where: {
        ownerType,
        ownerId: ownerId ? ownerId : IsNull(),
      },
    })
  }
}

const schema = z.discriminatedUnion("ownerType", [
  z.object({
    ownerType: z.literal(AccountOwnerType.User),
    ownerId: z.coerce.bigint().positive().transform(String),
  }),
  z.object({
    ownerType: z.literal(AccountOwnerType.Escrow),
    ownerId: z.coerce.bigint().positive().transform(String),
  }),
  z.object({ ownerType: z.literal(AccountOwnerType.Platform), ownerId: z.null() }),
  z.object({ ownerType: z.literal(AccountOwnerType.External), ownerId: z.null() }),
])

export type CreateAccountParams = z.infer<typeof schema>
export type RetrieveAccountParams = z.infer<typeof schema>
