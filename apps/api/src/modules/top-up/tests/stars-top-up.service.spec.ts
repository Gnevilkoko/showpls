import { Test, TestingModule } from "@nestjs/testing"
import { DataSource } from "typeorm"
import { TestingService } from "../../../testing"
import { getDataSourceToken, TypeOrmModule } from "@nestjs/typeorm"
import { StarsTopUpService } from "../stars-top-up.service"
import { getBotToken } from "nestjs-telegraf"
import { faker } from "@faker-js/faker/locale/en"
import { UserService } from "../../user"
import { LanguageCode, Role, Token } from "@share"
import { StarsTopUp } from "@share/entities"
import { randomBytes } from "node:crypto"
import { RedisService } from "@liaoliaots/nestjs-redis"

const token = Token.STARS
describe("StarsTopUpService", () => {
  let module: TestingModule
  let dataSource: DataSource
  let service: StarsTopUpService

  beforeEach(async () => {
    await TestingService.dropDataSources()
    module = await Test.createTestingModule({
      imports: [...TestingService.getMustHaveModules(), TypeOrmModule.forFeature([StarsTopUp])],
      providers: [
        {
          provide: getBotToken(),
          useValue: {
            telegram: {
              createInvoiceLink: async () => {
                return faker.internet.url()
              },
            },
          },
        },
        StarsTopUpService,
      ],
    }).compile()

    service = module.get(StarsTopUpService)
    dataSource = module.get(getDataSourceToken())
  })

  afterEach(async () => {
    await module.close()
  })

  async function createUser() {
    return await module.get(UserService).create({
      firstName: faker.person.firstName(),
      role: Role.Normal,
      languageCode: LanguageCode.EN,
      tgId: faker.number.int().toString(),
    })
  }

  it("should create() works", async () => {
    const user = await createUser()
    const amount = 100
    const topUp = await service.create({
      amount,
      userId: user.id,
    })
    expect(topUp.amount).toBe(100e6)
    expect(topUp.paid).toBeFalsy()
    expect(topUp.refunded).toBeFalsy()
    expect(topUp.txid).toBeNull()
    expect(topUp.userId).toBe(user.id)
  })

  it("should processSuccessfullPayment() works", async () => {
    const { id: userId, balances } = await createUser()
    const amount = 100
    const { id } = await service.create({
      amount,
      userId: userId,
    })
    expect(+balances[token]).toBe(0)
    await service.processSuccessfullPayment({ id, txid: randomBytes(32).toString("hex") })

    const topUp = await service.retrieve(id)

    expect(topUp.paid).toBeTruthy()
    expect(topUp.txid).toBeTruthy()

    const user = await module.get(UserService).retrieve(userId)
    expect(+user.balances[token]).toBe(100e6)
  })

  it("should processRefundedPayment() works", async () => {
    const { id: userId, balances } = await createUser()
    const amount = 100
    const { id } = await service.create({
      amount,
      userId: userId,
    })
    expect(+balances[token]).toBe(0)
    await service.processSuccessfullPayment({ id, txid: randomBytes(32).toString("hex") })
    await service.processRefundedPayment({ id, txid: randomBytes(32).toString("hex") })

    const topUp = await service.retrieve(id)
    expect(topUp.refunded).toBeTruthy()

    const user = await module.get(UserService).retrieve(userId)
    expect(+user.balances[token]).toBe(0)
  })

  it("should processSuccessfullPayment() to be idempotency", async () => {
    const { id: userId, balances } = await createUser()
    const amount = 100
    const { id } = await service.create({
      amount,
      userId: userId,
    })
    expect(+balances[token]).toBe(0)
    await service.processSuccessfullPayment({ id, txid: randomBytes(32).toString("hex") })
    await service.processSuccessfullPayment({ id, txid: randomBytes(32).toString("hex") })
    await service.processSuccessfullPayment({ id, txid: randomBytes(32).toString("hex") })

    const topUp = await service.retrieve(id)

    expect(topUp.paid).toBeTruthy()
    expect(topUp.txid).toBeTruthy()

    const user = await module.get(UserService).retrieve(userId)
    expect(+user.balances[token]).toBe(100e6)
  })

  it("should list() works", async () => {
    const { id: userId } = await createUser()
    const amount = 100
    const { id } = await service.create({
      amount,
      userId: userId,
    })
    await service.processSuccessfullPayment({ id, txid: randomBytes(32).toString("hex") })
    await service.create({
      amount,
      userId: userId,
    })
    await service.create({
      amount,
      userId: userId,
    })

    expect((await service.list({page: 1, limit: 10, filter: {}, sort: {}})).items.length).toBe(3)
    expect((await service.list({page: 1, limit: 10, filter: {paid: true}, sort: {}})).items.length).toBe(1)
    expect((await service.list({page: 1, limit: 10, filter: {paid: false}, sort: {}})).items.length).toBe(2)
    expect((await service.list({page: 1, limit: 10, filter: {userId: userId}, sort: {}})).items.length).toBe(3)
  })
})
