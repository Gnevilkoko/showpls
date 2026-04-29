import { TestingModule } from "@nestjs/testing"
import { DataSource } from "typeorm"
import { AccountService } from "./account.service"
import { TestingService } from "../testing/testing.service"
import { getDataSourceToken } from "@nestjs/typeorm"
import { AccountOwnerType } from "@ledger/entities"

describe("AccountService", () => {
  let module: TestingModule
  let dataSource: DataSource
  let service: AccountService

  beforeEach(async () => {
    await TestingService.dropDataSources()
    module = await TestingService.getModule()
    service = module.get(AccountService)
    dataSource = module.get(getDataSourceToken())
  })

  afterEach(async () => {
    await module.close()
  })

  it("should create() works", async () => {
    const account = await service.create(
      {
        ownerId: "1",
        ownerType: AccountOwnerType.User,
      },
      undefined
    )
    expect(account!.id).toBe("1")
    expect(account!.ownerType).toBe(AccountOwnerType.User)
  })

  it("should retrieve() works", async () => {
    await service.create(
      {
        ownerId: "1",
        ownerType: AccountOwnerType.User,
      },
      undefined
    )
    const account = await service.retrieve(
      {
        ownerId: "1",
        ownerType: AccountOwnerType.User,
      },
      undefined
    )
    expect(account!.id).toBe("1")
    expect(account!.ownerType).toBe(AccountOwnerType.User)
  })
})
