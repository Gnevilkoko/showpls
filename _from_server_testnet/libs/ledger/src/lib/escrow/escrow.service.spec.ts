import { TestingModule } from "@nestjs/testing"
import { DataSource } from "typeorm"
import { Ledger } from "@ledger"
import { TestingService } from "@ledger/testing/testing.service"
import { getDataSourceToken } from "@nestjs/typeorm"
import { Account, AccountOwnerType, Balance, Currency, Entry } from "@ledger/entities"
import { CurrencyService } from "@ledger/currency/currency.service"
import { type EscrowReleaseService } from "@ledger/escrow/escrow-release.service"

jest.mock("./escrow-release.service", () => {
  const ERService = jest.requireActual("./escrow-release.service").EscrowReleaseService as typeof EscrowReleaseService
  Reflect.set(ERService, "feeInPercentage", 2.5)

  return {
    EscrowReleaseService: ERService,
    __esModule: true,
  }
})

describe("Ledger", () => {
  let module: TestingModule
  let dataSource: DataSource
  let service: Ledger
  let currency: Currency
  let externalType = "secure-deal"
  let externalId = "1"

  beforeEach(async () => {
    await TestingService.dropDataSources()
    module = await TestingService.getModule()
    service = module.get(Ledger)
    dataSource = module.get(getDataSourceToken())
    currency = await module.get(CurrencyService).create({
      name: "Tether (USDT)",
      code: "USDT",
      blockchain: "ton",
      scale: 6,
    })
  })

  afterEach(async () => {
    await module.close()
  })

  it("should hold() works", async () => {
    const fromAccount = await service.account.create(
      {
        ownerId: "1",
        ownerType: AccountOwnerType.User,
      },
      undefined
    )
    let fromBalance: Balance | null = await service.balance.create(
      {
        accountId: fromAccount.id,
        currencyId: currency.id,
      },
      undefined
    )

    await dataSource.getRepository(Balance).update({ id: fromBalance.id }, { amount: (1000e6).toString() })

    const toAccount = await service.account.create(
      {
        ownerId: "2",
        ownerType: AccountOwnerType.User,
      },
      undefined
    )

    const escrowAmount = BigInt(100e6)
    await service.escrow.hold(
      {
        externalType,
        externalId,
        from: fromAccount.ownerId as string,
        to: toAccount.ownerId as string,
        amount: escrowAmount,
        currencyId: currency.id,
      },
      dataSource.manager
    )

    fromBalance = (await service.balance.retrieve(
      {
        accountId: fromAccount.id,
        currencyId: currency.id,
      },
      undefined
    ))!

    expect(BigInt(fromBalance.lockedAmount)).toBe(escrowAmount)
    expect(BigInt(fromBalance.amount)).toBe(BigInt(1000e6) - escrowAmount)

    const escrowAccount = (await service.account.retrieve(
      {
        ownerId: null,
        ownerType: AccountOwnerType.Escrow,
      },
      undefined
    )) as Account

    const escrowBalance = (await service.balance.retrieve(
      {
        accountId: escrowAccount.id,
        currencyId: currency.id,
      },
      undefined
    )) as Balance

    expect(BigInt(escrowBalance.amount)).toBe(escrowAmount)
  })

  it("should release() works", async () => {
    const fromAccount = await service.account.create(
      {
        ownerId: "1",
        ownerType: AccountOwnerType.User,
      },
      undefined
    )
    let fromBalance: Balance | null = await service.balance.create(
      {
        accountId: fromAccount.id,
        currencyId: currency.id,
      },
      undefined
    )

    await dataSource.getRepository(Balance).update({ id: fromBalance.id }, { amount: (1000e6).toString() })

    const toAccount = await service.account.create(
      {
        ownerId: "2",
        ownerType: AccountOwnerType.User,
      },
      undefined
    )

    const escrowAmount = BigInt(100e6)
    await service.escrow.hold(
      {
        externalType,
        externalId,
        from: fromAccount.ownerId as string,
        to: toAccount.ownerId as string,
        amount: escrowAmount,
        currencyId: currency.id,
      },
      dataSource.manager
    )

    await service.escrow.release(
      {
        externalId,
        externalType,
      },
      dataSource.manager
    )

    const escrowAccount = (await service.account.retrieve(
      {
        ownerId: null,
        ownerType: AccountOwnerType.Escrow,
      },
      undefined
    )) as Account

    const escrowBalance = (await service.balance.retrieve(
      {
        accountId: escrowAccount.id,
        currencyId: currency.id,
      },
      undefined
    )) as Balance

    expect(BigInt(escrowBalance.amount)).toBe(BigInt(0))

    const toBalance = (await service.balance.retrieve(
      {
        accountId: toAccount.id,
        currencyId: currency.id,
      },
      undefined
    )) as Balance

    expect(BigInt(toBalance.amount)).toBe(97500000n)

    fromBalance = (await service.balance.retrieve(
      {
        accountId: fromAccount.id,
        currencyId: currency.id,
      },
      undefined
    ))!

    expect(BigInt(fromBalance.lockedAmount)).toBe(BigInt(0))
    expect(BigInt(fromBalance.amount)).toBe(BigInt(900e6))

    const platformAccount = (await service.account.retrieve(
      {
        ownerType: AccountOwnerType.Platform,
        ownerId: null,
      },
      undefined
    )) as Account

    const platformBalance = (await service.balance.retrieve(
      {
        accountId: platformAccount.id,
        currencyId: currency.id,
      },
      undefined
    )) as Balance

    expect(BigInt(platformBalance.amount)).toBe(2500000n)

    const sum = await dataSource.getRepository(Entry).sum("amount" as never, {})
    expect(sum).toBe(0)
  })

  it("should refund() works", async () => {
    const fromAccount = await service.account.create(
      {
        ownerId: "1",
        ownerType: AccountOwnerType.User,
      },
      undefined
    )
    let fromBalance: Balance | null = await service.balance.create(
      {
        accountId: fromAccount.id,
        currencyId: currency.id,
      },
      undefined
    )

    await dataSource.getRepository(Balance).update({ id: fromBalance.id }, { amount: (1000e6).toString() })

    const toAccount = await service.account.create(
      {
        ownerId: "2",
        ownerType: AccountOwnerType.User,
      },
      undefined
    )

    const escrowAmount = BigInt(100e6)
    await service.escrow.hold(
      {
        externalType,
        externalId,
        from: fromAccount.ownerId as string,
        to: toAccount.ownerId as string,
        amount: escrowAmount,
        currencyId: currency.id,
      },
      dataSource.manager
    )

    await service.escrow.refund(
      {
        externalId,
        externalType,
      },
      dataSource.manager
    )

    const escrowAccount = (await service.account.retrieve(
      {
        ownerId: null,
        ownerType: AccountOwnerType.Escrow,
      },
      undefined
    )) as Account

    const escrowBalance = (await service.balance.retrieve(
      {
        accountId: escrowAccount.id,
        currencyId: currency.id,
      },
      undefined
    )) as Balance

    expect(BigInt(escrowBalance.amount)).toBe(BigInt(0))

    const toBalance = (await service.balance.retrieve(
      {
        accountId: toAccount.id,
        currencyId: currency.id,
      },
      undefined
    )) as Balance

    expect(BigInt(toBalance.amount)).toBe(BigInt(0))

    fromBalance = (await service.balance.retrieve(
      {
        accountId: fromAccount.id,
        currencyId: currency.id,
      },
      undefined
    ))!

    expect(BigInt(fromBalance.lockedAmount)).toBe(BigInt(0))
    expect(BigInt(fromBalance.amount)).toBe(BigInt(1000e6))
  })


  it("should ", async () => {

  })
})
