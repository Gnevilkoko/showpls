import { TestingModule } from "@nestjs/testing"
import { FixtureService, TestingService } from "../../../../testing"
import { UserService } from "../../../user"
import { Token } from "@share"
import { randomBytes } from "node:crypto"
import { TONTopUpService } from "../ton-top-up.service"

describe("TONTopUpService", () => {
  let module: TestingModule
  let service: TONTopUpService
  let fixtureService: FixtureService
  beforeEach(async () => {
    await TestingService.dropDataSources()
    module = await TestingService.getTopUpModule()

    service = module.get(TONTopUpService)
    fixtureService = new FixtureService(module)
  })

  afterEach(async () => {
    await module.close()
  })

  async function getBalance(id: string, token: Token) {
    const balances = await module.get(UserService).getBalances(id)
    return BigInt(balances.find((balance) => balance.code === token)!.balance)
  }

  it("should create() works", async () => {
    const user = await fixtureService.createUser()
    const topUp = await service.create({ userId: user.id })
    expect(topUp.paid).toBeFalsy()
    expect(topUp.amount).toBeNull()
    expect(topUp.txid).toBeNull()
    expect(topUp.memo).toBeDefined()
    expect(topUp.userId).toBe(user.id)
  })

  it("should processPayment() works", async () => {
    const user = await fixtureService.createUser()
    const { id, memo } = await service.create({ userId: user.id })

    const amount = BigInt(100e9)

    expect(await getBalance(user.id, Token.TON)).toBe(0n)
    await service.processPayment({
      txid: randomBytes(32).toString("hex"),
      memo: BigInt(memo),
      amount,
      token: Token.TON,
    })

    const topUp = await service.retrieve(id)
    expect(topUp.id).toBe(id)
    expect(topUp.memo).toBe(memo)
    expect(topUp.paid).toBeTruthy()
    expect(topUp.amount).toBe(amount.toString())
    expect(topUp.txid).not.toBeNull()

    expect(await getBalance(user.id, Token.TON)).toBe(amount)
  })
})
