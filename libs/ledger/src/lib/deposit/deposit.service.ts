import { InjectDataSource } from "@nestjs/typeorm"
import { DataSource, EntityManager } from "typeorm"
import { AccountService } from "@ledger/account/account.service"
import { BalanceService } from "@ledger/balance/balance.service"
import { CurrencyService } from "@ledger/currency/currency.service"
import { Injectable, Logger } from "@nestjs/common"
import { z } from "zod"
import LedgerExceptions from "@ledger/ledger.exceptions"
import {
  Account,
  AccountOwnerType,
  Balance,
  Currency,
  Entry,
  Transaction,
  TransactionInitiatorType,
  TransactionStatus,
  TransactionType,
} from "@ledger/entities"

@Injectable()
export class DepositService {
  protected logger = new Logger(DepositService.name)

  constructor(
    @InjectDataSource() protected dataSource: DataSource,
    public account: AccountService,
    public balance: BalanceService,
    public currency: CurrencyService
  ) {}

  async create(params: CreateDepositParams, manager: EntityManager) {
    const result = createSchema.safeParse(params)

    if (!result.success) {
      throw new LedgerExceptions.InvalidProvidedData(undefined, {
        cause: result.error,
      })
    }
    const { externalType, externalId, currencyId, amount, userId } = result.data

    const currency = await manager.getRepository(Currency).findOne({
      where: {
        id: currencyId,
      },
    })

    if (!currency) {
      throw new LedgerExceptions.CurrencyNotFound()
    }

    let account: Account | null
    account = await this.account.retrieve(
      {
        ownerId: userId,
        ownerType: AccountOwnerType.User,
      },
      manager
    )

    if (!account) {
      account = await this.account.create(
        {
          ownerId: userId,
          ownerType: AccountOwnerType.User,
        },
        manager
      )
    }

    let balance: Balance | null
    balance = await this.balance.retrieve(
      {
        accountId: account.id,
        currencyId,
      },
      manager
    )

    if (!balance) {
      balance = await this.balance.create(
        {
          currencyId: currency.id,
          accountId: account.id,
        },
        manager
      )
    }

    let transaction: Transaction | null = await manager.getRepository(Transaction).findOne({
      where: {
        type: TransactionType.CreateDeposit,
        externalType,
        externalId,
      },
    })

    if (transaction) {
      this.logger.warn({
        message: `Transaction already exists`,
        data: {
          id: transaction.id,
        },
      })
      return
    }

    const transactionInsertResult = await manager
      .createQueryBuilder()
      .insert()
      .into(Transaction)
      .values({
        type: TransactionType.CreateDeposit,
        externalType,
        externalId,
        status: TransactionStatus.Completed,

        initiatorType: TransactionInitiatorType.User,
        initiatorId: userId,
        meta: {},
        postedAt: new Date(),
        updatedAt: new Date(),
      })
      .returning("*")
      .execute()

    transaction = manager.create(Transaction, transactionInsertResult.raw[0] as object)

    let externalAccount: Account | null

    externalAccount = await this.account.retrieve(
      {
        ownerType: AccountOwnerType.External,
        ownerId: null,
      },
      manager
    )

    if (!externalAccount) {
      externalAccount = await this.account.create(
        {
          ownerType: AccountOwnerType.External,
          ownerId: null,
        },
        manager
      )
    }

    // debit
    await manager.getRepository(Entry).insert({
      amount: (-amount).toString(),
      currencyId: currency.id,
      accountId: externalAccount.id,
      transactionId: transaction.id,
      meta: {},
    })

    // credit
    await manager.getRepository(Entry).insert({
      amount: amount.toString(),
      currencyId: currency.id,
      accountId: account.id,
      transactionId: transaction.id,
      meta: {},
    })

    await manager.getRepository(Balance).increment({ id: balance.id }, "amount", amount.toString())
  }

  async revert(params: RevertExternalDepositParams, manager: EntityManager) {
    const result = revertSchema.safeParse(params)

    if (!result.success) {
      throw new LedgerExceptions.InvalidProvidedData(undefined, {
        cause: result.error,
      })
    }
    const { externalType, externalId } = result.data

    const prevTransaction = await manager.getRepository(Transaction).findOne({
      where: {
        type: TransactionType.CreateDeposit,
        externalType,
        externalId,
      },
      relations: {
        entries: true,
      },
    })

    if (!prevTransaction) {
      throw new LedgerExceptions.AssociatedTransactionNotFound(
        `Deposit creation transaction not found by these parameters: ${JSON.stringify({
          type: TransactionType.CreateDeposit,
          externalType,
          externalId,
        })}`
      )
    }

    let transaction: Transaction | null = await manager.getRepository(Transaction).findOne({
      where: {
        type: TransactionType.RevertDeposit,
        externalType,
        externalId,
      },
    })

    if (transaction) {
      this.logger.warn({
        message: `Transaction already exists`,
        data: {
          id: transaction.id,
        },
      })
      return
    }

    const transactionInsertResult = await manager
      .createQueryBuilder()
      .insert()
      .into(Transaction)
      .values({
        type: TransactionType.RevertDeposit,
        externalType,
        externalId,
        status: TransactionStatus.Completed,
        initiatorType: prevTransaction.initiatorType,
        initiatorId: prevTransaction.initiatorId,
        meta: {},
        postedAt: new Date(),
        updatedAt: new Date(),
      })
      .returning("*")
      .execute()

    transaction = manager.create(Transaction, transactionInsertResult.raw[0] as object)

    for (let entry of prevTransaction.entries) {
      const amount = (-BigInt(entry.amount)).toString()
      await manager.getRepository(Entry).insert({
        amount: amount,
        currencyId: entry.currencyId,
        accountId: entry.accountId,
        transactionId: transaction.id,
        meta: {},
      })
      const account = (await manager.getRepository(Account).findOne({
        where: {
          id: entry.accountId,
        },
      }))!

      if (account.ownerType === AccountOwnerType.User) {
        const balance = (await this.balance.retrieve({ accountId: account.id, currencyId: entry.currencyId }, manager))!
        await manager.getRepository(Balance).increment({ id: balance.id }, "amount", amount)
      }
    }
  }
}

const createSchema = z.object({
  externalType: z.string().min(1),
  externalId: z.string().min(1),
  amount: z.coerce.bigint().positive(),
  currencyId: z.coerce.number().int().positive().transform(String),
  userId: z.coerce.number().int().positive().transform(String),
})

export type CreateDepositParams = z.infer<typeof createSchema>

const revertSchema = z.object({
  externalType: z.string().min(1),
  externalId: z.string().min(1),
})

export type RevertExternalDepositParams = z.infer<typeof revertSchema>
