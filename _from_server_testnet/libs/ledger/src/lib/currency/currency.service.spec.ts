import { TestingModule } from "@nestjs/testing"
import { DataSource } from "typeorm"
import { TestingService } from "@ledger/testing/testing.service"
import { getDataSourceToken } from "@nestjs/typeorm"
import { CurrencyService } from "@ledger/currency/currency.service"

describe("CurrencyService", () => {
  let module: TestingModule
  let dataSource: DataSource
  let service: CurrencyService

  beforeEach(async () => {
    await TestingService.dropDataSources()
    module = await TestingService.getModule()
    service = module.get(CurrencyService)
    dataSource = module.get(getDataSourceToken())
  })

  afterEach(async () => {
    await module.close()
  })

  it("should create() works", async () => {
    const currency = await service.create({
      name: "Tether (USDT)",
      code: "USDT",
      blockchain: "ethereum",
      scale: 6,
    })
    expect(currency.id).toBeDefined()
    expect(currency.scale).toBe(6)
  })

  it("should retrieve() works for id", async () => {
    const currency = await service.create({
      name: "Tether (USDT)",
      code: "USDT",
      blockchain: "ethereum",
      scale: 6,
    })

    const { id } = (await service.retrieve({ id: currency.id }))!
    expect(id).toBe(currency.id)
  })
  it("should retrieve() works for code and blockchain", async () => {
    const currency = await service.create({
      name: "Tether (USDT)",
      code: "USDT",
      blockchain: "ethereum",
      scale: 6,
    })

    const { id } = (await service.retrieve({ code: "USDT", blockchain: "ethereum" }))!
    expect(id).toBe(currency.id)
  })
})
