import { TestingModule } from "@nestjs/testing"
import { DataSource } from "typeorm"
import { Ledger } from "../index"
import { getDataSourceToken } from "@nestjs/typeorm"
import { AccountOwnerType } from "@ledger/entities"
import { AccountService } from "@ledger/account/account.service"
import { BalanceService } from "@ledger/balance/balance.service"
import { TestingService } from "@ledger/testing/testing.service"
import { CurrencyService } from "@ledger/currency/currency.service"
import { randomBytes } from "node:crypto"

describe("Ledger", () => {
  let module: TestingModule
  let dataSource: DataSource
  let service: Ledger

  beforeEach(async () => {
    await TestingService.dropDataSources()
    module = await TestingService.getModule()
    service = module.get(Ledger)
    dataSource = module.get(getDataSourceToken())
  })

  afterEach(async () => {
    await module.close()
  })

  it("should createDeposit() works", async () => {
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

    await service.createDeposit(
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

  it("should revertDeposit() works", async () => {
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

    await service.createDeposit(
      {
        userId: user.id,
        externalType: "ton",
        externalId: txid,
        currencyId: currency.id,
        amount: BigInt(500e6),
      },
      dataSource.manager
    )

    await service.revertDeposit(
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
