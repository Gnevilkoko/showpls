import { TestingModule } from "@nestjs/testing"
import { DataSource } from "typeorm"
import { FixtureService, TestingService } from "../../../testing"
import { getDataSourceToken } from "@nestjs/typeorm"
import { TONTopUpService } from "../ton/ton-top-up.service"
import { StarsTopUpService } from "../stars/stars-top-up.service"
import { TopUpService } from "../top-up.service"

describe("TopUpService", () => {
  let module: TestingModule
  let dataSource: DataSource
  let service: TopUpService
  let fixtureService: FixtureService

  beforeEach(async () => {
    await TestingService.dropDataSources()
    module = await TestingService.getTopUpModule()
    dataSource = module.get(getDataSourceToken())
    service = module.get(TopUpService)
    fixtureService = new FixtureService(module)
  })

  afterEach(async () => {
    await module.close()
  })

  it("should list() works", async () => {
    const user = await fixtureService.createUser()
    await module.get(TONTopUpService).create({
      userId: user.id,
    })
    await module.get(StarsTopUpService).create({
      amount: 100,
      userId: user.id,
    })

    const paginationResult = await service.list({
      page: 1,
      limit: 10,
      filter: {
        paid: false,
        userId: user.id,
        txid: undefined,
      },
      sort: {},
    })
    expect(paginationResult.items.length).toBe(2)
    expect(paginationResult.meta.itemCount).toBe(2)
  })
})
