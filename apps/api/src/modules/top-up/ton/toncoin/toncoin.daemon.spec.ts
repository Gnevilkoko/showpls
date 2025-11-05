import { Test, TestingModule } from "@nestjs/testing"
import { DataSource } from "typeorm"
import { TestingService } from "../../../../testing"
import { getDataSourceToken, TypeOrmModule } from "@nestjs/typeorm"
import { ToncoinDaemon } from "./toncoin.daemon"
import { TONIgnoredTransaction, TONTopUp } from "@share/entities"
import { TONTopUpService } from "../ton-top-up.service"
import ms from "ms"
import { UserService } from "../../../user"
import { faker } from "@faker-js/faker/locale/en"
import { LanguageCode, Role } from "@share"

jest.setTimeout(ms("5m"))

describe("ToncoinDaemon", () => {
  let module: TestingModule
  let dataSource: DataSource
  let service: ToncoinDaemon

  beforeEach(async () => {
    await TestingService.dropDataSources()
    module = await TestingService.compileModule(
      Test.createTestingModule({
        imports: [...TestingService.getMustHaveModules(), TypeOrmModule.forFeature([TONTopUp, TONIgnoredTransaction])],
        providers: [TONTopUpService, ToncoinDaemon],
      })
    )

    dataSource = module.get(getDataSourceToken())
    service = module.get(ToncoinDaemon)
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

  it("should works", async () => {
     const user = await createUser()
        const topUp = await module.get(TONTopUpService).create({
      userId: user.id
    })

    await dataSource.getRepository(TONTopUp).update({id: topUp.id}, {
      memo: "10001"
    })


    // @ts-ignore
    await service.process()
  })
})
