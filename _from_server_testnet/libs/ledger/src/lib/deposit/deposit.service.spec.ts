import { TestingModule } from "@nestjs/testing"
import { DataSource } from "typeorm"
import { TestingService } from "@ledger/testing/testing.service"
import { getDataSourceToken } from "@nestjs/typeorm"
import { DepositService } from "@ledger/deposit/deposit.service"
import { AccountService } from "@ledger/account/account.service"
import { AccountOwnerType } from "@ledger/entities"
import { CurrencyService } from "@ledger/currency/currency.service"
import { randomBytes } from "node:crypto"
import { BalanceService } from "@ledger/balance/balance.service"

describe("DepositService", () => {
  let module: TestingModule
  let dataSource: DataSource
  let service: DepositService

  beforeEach(async () => {
    await TestingService.dropDataSources()
    module = await TestingService.getModule()
    service = module.get(DepositService)
    dataSource = module.get(getDataSourceToken())
  })

  afterEach(async () => {
    await module.close()
  })

  it("should create() works", async () => {
    const user = {
      id: "1",
    }
    const account = await module.get(AccountService).create(
      {
        ownerType: AccountOwnerType.User,
        ownerId: user.id,
      },
      undefined
    )

    const currency = await module.get(CurrencyService).create({
      name: "Tether (USDT)",
      code: "USDT",
      blockchain: "ton",
      scale: 6,
    })

    const txid = randomBytes(32).toString("hex")

    await service.create(
      {
        userId: user.id,
        externalType: "ton",
        externalId: txid,
        currencyId: currency.id,
        amount: BigInt(500e6),
      },
      dataSource.manager
    )

    const balance = (await module.get(BalanceService).retrieve(
      {
        accountId: account.id,
        currencyId: currency.id,
      },
      undefined
    ))!

    expect(+balance.amount).toBe(500e6)
  })

  it("should revert() works", async () => {
    const user = {
      id: "1",
    }
    const account = await module.get(AccountService).create(
      {
        ownerType: AccountOwnerType.User,
        ownerId: user.id,
      },
      undefined
    )

    const currency = await module.get(CurrencyService).create({
      name: "Tether (USDT)",
      code: "USDT",
      blockchain: "ton",
      scale: 6,
    })

    const txid = randomBytes(32).toString("hex")

    await service.create(
      {
        userId: user.id,
        externalType: "ton",
        externalId: txid,
        currencyId: currency.id,
        amount: BigInt(500e6),
      },
      dataSource.manager
    )

    await service.revert(
      {
        externalType: "ton",
        externalId: txid,
      },
      dataSource.manager
    )

    const balance = (await module.get(BalanceService).retrieve(
      {
        accountId: account.id,
        currencyId: currency.id,
      },
      undefined
    ))!

    expect(+balance.amount).toBe(0)
  })
})
