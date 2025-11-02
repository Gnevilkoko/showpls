import { Test, TestingModule } from "@nestjs/testing"
import { DataSource } from "typeorm"
import { StarsTopUpService } from "../stars/stars-top-up.service"
import { TestingService } from "../../../testing"
import { getDataSourceToken, TypeOrmModule } from "@nestjs/typeorm"
import { StarsTopUp } from "@share/entities"
import { faker } from "@faker-js/faker/locale/en"
import { getBotToken } from "nestjs-telegraf"
import { StarsTopUpController } from "../stars/stars-top-up.controller"
import { UserService } from "../../user"
import { LanguageCode, Role } from "@share"
import { INestApplication } from "@nestjs/common"
import axios, { AxiosInstance } from "axios"
import AuthService from "../../auth/auth.service"
import { ClsModule } from "nestjs-cls"
import { ClsService } from "nestjs-cls"



describe("StarsTopUpController", () => {
  let module: TestingModule
  let dataSource: DataSource
  let service: StarsTopUpService
  let app: INestApplication
  let url: string = "http://localhost:8000"
  let instance: AxiosInstance


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
      controllers: [StarsTopUpController],
    })
      .compile()

    service = module.get(StarsTopUpService)
    app = await TestingService.getApp(module)
    instance = axios.create({
      baseURL: `${url}/api/stars-top-up`,
      withCredentials: true,
      validateStatus: (status) => status <= 500,
    })
    dataSource = module.get(getDataSourceToken())
  })

  afterEach(async () => {
    await app.close()
    // whyIsNodeRunning();
  })

  async function createUser() {
    return await module.get(UserService).create({
      firstName: faker.person.firstName(),
      role: Role.Normal,
      languageCode: LanguageCode.EN,
      tgId: faker.number.int().toString(),
    })
  }

  it("POST /stars-top-up/create 200", async () => {
    const user = await createUser()
    const amount = 100
    const resp = await instance.post("create", {
      amount
    }, {
      headers: {
        Authorization: `Bearer ${AuthService.generateToken(user)}`
      }
    })
    expect(resp.status).toBe(200)
    const topUp = await resp.data as StarsTopUp
    expect(topUp.amount).toBe(100e6)
    expect(topUp.paid).toBeFalsy()
    expect(topUp.refunded).toBeFalsy()
    expect(topUp.txid).toBeNull()
    expect(topUp.userId).toBe(user.id)

  })
})
