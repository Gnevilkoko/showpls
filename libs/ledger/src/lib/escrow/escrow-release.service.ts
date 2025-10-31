import { InjectDataSource } from "@nestjs/typeorm"
import { DataSource, EntityManager } from "typeorm"
import { AccountService } from "@ledger/account/account.service"
import { BalanceService } from "@ledger/balance/balance.service"
import { CurrencyService } from "@ledger/currency/currency.service"
import { z } from "zod"
import LedgerExceptions from "@ledger/ledger.exceptions"
import {
  Account,
  AccountOwnerType,
  Balance,
  Currency,
  Entry,
  Transaction,
  TransactionStatus,
  TransactionType,
} from "@ledger/entities"
import Decimal from "decimal.js"

export class EscrowReleaseService {
  protected static readonly feeInPercentage = 2.5 as number

  constructor(
    @InjectDataSource() protected dataSource: DataSource,
    public account: AccountService,
    public balance: BalanceService,
    public currency: CurrencyService
  ) {}

  async release(params: EscrowReleaseParams, manager: EntityManager) {
    const result = schema.safeParse(params)

    if (!result.success) {
      throw new LedgerExceptions.InvalidProvidedData(undefined, {
        cause: result.error,
      })
    }
    const { externalType, externalId } = result.data

    const holdTransaction: Transaction | null = await manager.getRepository(Transaction).findOne({
      where: {
        type: TransactionType.EscrowHold,
        externalType,
        externalId,
      },
      relations: {
        entries: true,
      },
    })

    if (!holdTransaction) {
      throw new LedgerExceptions.AssociatedTransactionNotFound(
        `Hold transaction not found by these parameters: ${JSON.stringify({
          type: TransactionType.EscrowHold,
          externalType,
          externalId,
        })}`
      )
    }

    const currencyId = holdTransaction.entries.at(0)!.currencyId

    let transaction: Transaction | null = await manager.getRepository(Transaction).findOne({
      where: {
        type: TransactionType.EscrowRelease,
        externalType,
        externalId,
      },
    })

    if (transaction) {
      return
    }

    const currency = (await this.currency.retrieve({
      id: currencyId,
    })) as Currency

    const transactionInsertResult = await manager
      .createQueryBuilder()
      .insert()
      .into(Transaction)
      .values({
        type: TransactionType.EscrowRelease,
        externalType,
        externalId,
        status: TransactionStatus.Completed,
        initiatorType: holdTransaction.initiatorType,
        initiatorId: holdTransaction.initiatorId,
        meta: {},
        postedAt: new Date(),
        updatedAt: new Date(),
      })
      .returning("*")
      .execute()

    transaction = manager.create(Transaction, transactionInsertResult.raw[0] as object)

    const {
      from,
      to,
      escrow,
      amount: _amount,
    } = holdTransaction.meta as {
      from: string
      to: string
      escrow: string
      amount: string
    }

    let platformAccount: Account | null = await this.account.retrieve(
      {
        ownerType: AccountOwnerType.Platform,
        ownerId: null,
      },
      manager
    )

    if (!platformAccount) {
      platformAccount = await this.account.create(
        {
          ownerType: AccountOwnerType.Platform,
          ownerId: null,
        },
        manager
      )
    }

    let platformBalance: Balance | null = await this.balance.retrieve(
      {
        currencyId: currency.id,
        accountId: platformAccount.id,
      },
      manager
    )

    if (!platformBalance) {
      platformBalance = await this.balance.create(
        {
          currencyId: currency.id,
          accountId: platformAccount.id,
        },
        manager
      )
    }

    const amount = BigInt(_amount)
    const feeInBasisPoints = BigInt(new Decimal(EscrowReleaseService.feeInPercentage).mul(100).toString())

    const feeAmount = (amount * feeInBasisPoints) / 10_000n

    const toAmount = amount - feeAmount
    const escrowAmount = amount - feeAmount

    let dustAmount = 0n

    const total = -amount + toAmount + feeAmount

    if (total !== 0n) {
      const dust = -total
      dustAmount = BigInt(Math.abs(Number(dust)))

      await manager.getRepository(Entry).insert({
        amount: dust.toString(),
        currencyId: currency.id,
        accountId: platformAccount.id,
        transactionId: transaction.id,
        meta: {
          description: "Rounding correction",
        } as any,
      })
    }

    await manager.getRepository(Entry).insert({
      amount: (-escrowAmount).toString(),
      currencyId: currency.id,
      accountId: escrow,
      transactionId: transaction.id,
      meta: {},
    })

    await manager.getRepository(Entry).insert({
      amount: (-feeAmount).toString(),
      currencyId: currency.id,
      accountId: escrow,
      transactionId: transaction.id,
      meta: {},
    })

    await manager.getRepository(Entry).insert({
      amount: toAmount.toString(),
      currencyId: currency.id,
      accountId: to,
      transactionId: transaction.id,
      meta: {},
    })

    await manager.getRepository(Entry).insert({
      amount: feeAmount.toString(),
      currencyId: currency.id,
      accountId: platformAccount.id,
      transactionId: transaction.id,
      meta: {},
    })

    if (dustAmount !== 0n) {
      await manager.getRepository(Entry).insert({
        amount: dustAmount.toString(),
        currencyId: currency.id,
        accountId: platformAccount.id,
        transactionId: transaction.id,
        meta: {},
      })
    }

    const escrowBalance = (await this.balance.retrieve(
      {
        currencyId: currency.id,
        accountId: escrow,
      },
      manager
    )) as Balance

    await manager.getRepository(Balance).decrement({ id: escrowBalance.id }, "amount", amount.toString())

    const toBalance = (await this.balance.retrieve(
      {
        currencyId: currency.id,
        accountId: to,
      },
      manager
    )) as Balance

    await manager.getRepository(Balance).increment({ id: toBalance.id }, "amount", toAmount.toString())

    await manager
      .getRepository(Balance)
      .increment({ id: platformBalance.id }, "amount", (feeAmount + dustAmount).toString())

    const fromBalance = (await this.balance.retrieve(
      {
        currencyId: currency.id,
        accountId: from,
      },
      manager
    )) as Balance

    await manager
      .createQueryBuilder()
      .update(Balance)
      .set({
        lockedAmount: () => '"lockedAmount" - :amount',
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
})

export type EscrowReleaseParams = z.infer<typeof schema>
