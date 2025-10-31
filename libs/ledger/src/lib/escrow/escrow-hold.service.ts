import { z } from "zod"
import { InjectDataSource } from "@nestjs/typeorm"
import { DataSource, EntityManager } from "typeorm"
import { AccountService } from "@ledger/account/account.service"
import { BalanceService } from "@ledger/balance/balance.service"
import { CurrencyService } from "@ledger/currency/currency.service"
import LedgerExceptions from "@ledger/ledger.exceptions"
import {
  Account,
  AccountOwnerType,
  Balance,
  Entry,
  Transaction,
  TransactionInitiatorType,
  TransactionStatus,
  TransactionType,
} from "@ledger/entities"
import EscrowExceptions from "@ledger/escrow/escrow.exceptions"

export class EscrowHoldService {
  constructor(
    @InjectDataSource() protected dataSource: DataSource,
    public account: AccountService,
    public balance: BalanceService,
    public currency: CurrencyService
  ) {}

  async hold(params: EscrowHoldParams, manager: EntityManager) {
    const result = schema.safeParse(params)

    if (!result.success) {
      throw new LedgerExceptions.InvalidProvidedData(undefined, {
        cause: result.error,
      })
    }
    const { externalType, externalId, from, to, amount, currencyId } = result.data
    let transaction: Transaction | null = await manager.getRepository(Transaction).findOne({
      where: {
        type: TransactionType.EscrowHold,
        externalType,
        externalId,
      },
    })

    if (transaction) {
      return
    }

    const currency = await this.currency.retrieve({
      id: currencyId,
    })

    if (!currency) {
      throw new LedgerExceptions.CurrencyNotFound()
    }

    const fromAccount = await this.account.retrieve(
      {
        ownerId: from,
        ownerType: AccountOwnerType.User,
      },
      manager
    )

    if (!fromAccount) {
      throw new EscrowExceptions.InsufficientFunds()
    }

    const fromBalance = await this.balance.retrieve(
      {
        accountId: fromAccount.id,
        currencyId: currency.id,
      },
      manager
    )

    if (!fromBalance || BigInt(fromBalance.amount) < amount) {
      throw new EscrowExceptions.InsufficientFunds()
    }

    let toAccount = await this.account.retrieve(
      {
        ownerId: to,
        ownerType: AccountOwnerType.User,
      },
      manager
    )

    if (!toAccount) {
      toAccount = await this.account.create(
        {
          ownerId: to,
          ownerType: AccountOwnerType.User,
        },
        manager
      )
    }

    let toBalance = await this.balance.retrieve(
      {
        accountId: toAccount.id,
        currencyId: currency.id,
      },
      manager
    )

    if (!toBalance) {
      toBalance = await this.balance.create(
        {
          accountId: toAccount.id,
          currencyId: currency.id,
        },
        manager
      )
    }

    let escrowAccount: Account | null = await this.account.retrieve(
      {
        ownerId: null,
        ownerType: AccountOwnerType.Escrow,
      },
      manager
    )

    if (!escrowAccount) {
      escrowAccount = await this.account.create(
        {
          ownerId: null,
          ownerType: AccountOwnerType.Escrow,
        },
        manager
      )
    }

    let escrowBalance = await this.balance.retrieve(
      {
        currencyId: currency.id,
        accountId: escrowAccount.id,
      },
      manager
    )

    if (!escrowBalance) {
      escrowBalance = await this.balance.create(
        {
          currencyId: currency.id,
          accountId: escrowAccount.id,
        },
        manager
      )
    }

    const transactionInsertResult = await manager
      .createQueryBuilder()
      .insert()
      .into(Transaction)
      .values({
        type: TransactionType.EscrowHold,
        externalType,
        externalId,
        status: TransactionStatus.Completed,
        initiatorType: TransactionInitiatorType.User,
        initiatorId: from,
        meta: {
          from: fromAccount.id,
          to: toAccount.id,
          escrow: escrowAccount.id,
          amount: amount.toString(),
        } as Record<string, any>,
        postedAt: new Date(),
        updatedAt: new Date(),
      })
      .returning("*")
      .execute()

    transaction = manager.create(Transaction, transactionInsertResult.raw[0] as object)

    await manager.getRepository(Entry).insert({
      amount: (-amount).toString(),
      currencyId: currency.id,
      accountId: fromAccount.id,
      transactionId: transaction.id,
      meta: {
        description: undefined,
      } as Record<string, any>,
    })

    await manager.getRepository(Entry).insert({
      amount: amount.toString(),
      currencyId: currency.id,
      accountId: toAccount.id,
      transactionId: transaction.id,
      meta: {},
    })

    await manager.getRepository(Balance).increment({ id: escrowBalance.id }, "amount", amount.toString())

    await manager
      .createQueryBuilder()
      .update(Balance)
      .set({
        amount: () => `amount - :amount`,
        lockedAmount: () => '"lockedAmount" + :amount',
      })
      .setParameter("amount", amount.toString())
      .where({
        id: fromBalance.id,
      })
      .execute()
  }
}

const schema = z.object({
  externalType: z.string().min(1),
  externalId: z.string().min(1),
  from: z.coerce.number().int().positive().transform(String),
  to: z.coerce.number().int().positive().transform(String),
  currencyId: z.coerce.number().int().positive().transform(String),
  amount: z.coerce.bigint().positive(),
})

export type EscrowHoldParams = z.infer<typeof schema>
