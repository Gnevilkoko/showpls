import { Test, TestingModule } from "@nestjs/testing"
import { DataSource } from "typeorm"
import { getJettonDaemonProvider, JettonDaemon } from "../ton/jetton/jetton.daemon"
import { FixtureService, TestingService } from "../../../testing"
import { getDataSourceToken, TypeOrmModule } from "@nestjs/typeorm"
import { StarsTopUp, TONIgnoredTransaction, TONTopUp } from "@share/entities"
import { TONTopUpService } from "../ton/ton-top-up.service"
import { getJettonServiceToken } from "../ton/jetton/get-jetton-service-token"
import { LanguageCode, Role, Token } from "@share"
import { JettonService } from "../ton/jetton/jetton.service"
import { getJettonDaemonToken } from "../ton/jetton/get-jetton-daemon-token"
import { UserService } from "../../user"
import { faker } from "@faker-js/faker/locale/en"
import { StarsTopUpService } from "../stars/stars-top-up.service"
import { getBotToken } from "nestjs-telegraf"
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
