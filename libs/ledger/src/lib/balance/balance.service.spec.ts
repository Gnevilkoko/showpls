import { TestingModule } from "@nestjs/testing"
import { DataSource } from "typeorm"
import { AccountService } from "@ledger/account/account.service"
import { TestingService } from "@ledger/testing/testing.service"
import { getDataSourceToken } from "@nestjs/typeorm"
import { BalanceService } from "@ledger/balance/balance.service"
import { AccountOwnerType } from "@ledger/entities"
import { CurrencyService } from "@ledger/currency/currency.service"


describe("BalanceService", () => {
    let module: TestingModule
  let dataSource: DataSource
  let service: BalanceService

  beforeEach(async () => {
    await TestingService.dropDataSources()
    module = await TestingService.getModule()
    service = module.get(BalanceService)
    dataSource = module.get(getDataSourceToken())
  })

  afterEach(async () => {
    await module.close()
  })

  it("should create() works", async () => {
    const account = await module.get(AccountService).create({
      ownerType: AccountOwnerType.User,
      ownerId: "1"
    }, undefined)
    const currency = await module.get(CurrencyService).create({
      name: "Tether (USDT)",
      code: "USDT",
      blockchain: "ethereum",
      scale: 6
    })

    const balance = await service.create({
      accountId: account.id,
      currencyId: currency.id
    }, undefined)

    expect(balance.id).toBe("1")
    expect(balance.amount).toBe("0")
    expect(balance.lockedAmount).toBe("0")
  })
})
