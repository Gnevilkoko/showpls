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

  })

  it("should revertDeposit() works", async () => {

  })
})
