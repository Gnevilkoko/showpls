import { TestingModule } from "@nestjs/testing"
import { INestApplication } from "@nestjs/common"
import axios from "axios"
import { TONTopUpService } from "../ton-top-up.service"
import { FixtureService, TestingService } from "../../../../testing"
import { TONTopUp } from "@share/entities"
import AuthService from "../../../auth/auth.service"

describe("TONTonUpController", () => {
  let module: TestingModule
  let service: TONTopUpService
  let app: INestApplication
  let fixtureService: FixtureService

  beforeEach(async () => {
    await TestingService.dropDataSources()
    module = await TestingService.getTopUpModule()

    service = module.get(TONTopUpService)
    app = await TestingService.getApp(module)
    fixtureService = new FixtureService(module)
  })

  afterEach(async () => {
    await app.close()
  })

  it("POST /ton-top-up/create 200", async () => {
    const user = await fixtureService.createUser()
    const resp = await axios.post(
      "ton-top-up/create",
      {},
      {
        headers: {
          Authorization: `Bearer ${AuthService.generateToken(user)}`,
        },
      }
    )
    expect(resp.status).toBe(200)
    const topUp = (await resp.data) as TONTopUp
    expect(topUp.paid).toBeFalsy()
    expect(topUp.amount).toBeNull()
    expect(topUp.txid).toBeNull()
    expect(topUp.memo).toBeDefined()
    expect(topUp.userId).toBe(user.id)
  })
})
