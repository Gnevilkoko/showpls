import { Injectable, Logger } from "@nestjs/common"
import { InjectDataSource } from "@nestjs/typeorm"
import { DataSource, EntityManager } from "typeorm"
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
import { BalanceService } from "@ledger/balance/balance.service"
import { CurrencyService } from "@ledger/currency/currency.service"
import { AccountService } from "@ledger/account/account.service"

@Injectable()
export class Ledger {
  protected logger = new Logger(Ledger.name)

  constructor(
    @InjectDataSource() protected dataSource: DataSource,
    public account: AccountService,
    public balance: BalanceService,
    public currency: CurrencyService
  ) {}

  public async createEscrowHolding() {
      // secureDeal = internalId
  }

  public async createDeposit(
    { userId, currencyId, externalId, externalType, amount }: CreateExternalDepositParams,
    manager: EntityManager
  ) {
    // if (status !== TransactionStatus.Completed) {
    //   throw new Error(`Депозит должен быть подтвержден`)
    // }

    if (!externalType || !externalId) {
      throw new Error(`Поддерживаются только внешние депозиты`)
    }

    // if (ownerType !== AccountOwnerType.User) {
    //   throw new Error(`Только юзер может создать депозит`)
    // }

    const currency = await manager.getRepository(Currency).findOne({
      where: {
        id: currencyId,
      },
    })

    if (!currency) {
      throw new Error("Currency not found")
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
        type: TransactionType.Deposit,
        externalType,
        externalId,
      },
    })

    if (transaction) {
      return
    }

    const transactionInsertResult = await manager
      .createQueryBuilder()
      .insert()
      .into(Transaction)
      .values({
        type: TransactionType.Deposit,
        externalType,
        externalId,
        status: TransactionStatus.Completed,

        initiatorType: TransactionInitiatorType.User,
        initiatorId: userId,
        meta: {},
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
    return transaction
  }

  public async revertDeposit({ externalId, externalType }: RevertExternalDepositParams, manager: EntityManager) {
    const prevTransaction = await manager.getRepository(Transaction).findOne({
      where: {
        type: TransactionType.Deposit,
        externalType,
        externalId,
      },
      relations: {
        entries: true,
      },
    })

    if (!prevTransaction) {
      throw new Error("Транзакция не найдена")
    }

    let transaction: Transaction | null = await manager.getRepository(Transaction).findOne({
      where: {
        type: TransactionType.RevertDeposit,
        externalType,
        externalId,
      },
    })

    // idempotency
    if (transaction) {
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

export type CreateExternalDepositParams = {
  userId: string
  // ownerId: string
  // ownerType: AccountOwnerType
  currencyId: string
  externalType: string | null
  externalId: string | null
  amount: bigint
}

export type RevertExternalDepositParams = {
  externalId: string
  externalType: string
}
