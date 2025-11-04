import ms from "ms"
import { Test, TestingModule } from "@nestjs/testing"
import { INestApplication } from "@nestjs/common"
import axios, { AxiosInstance } from "axios"
import { DataSource } from "typeorm"
import { TestingService } from "../../../api/src/testing"
import { getDataSourceToken } from "@nestjs/typeorm"
import { UserService } from "../../../api/src/modules/user"
import { faker } from "@faker-js/faker/locale/en"
import { Action, LanguageCode, Role } from "@share"
import AuthService from "../../../api/src/modules/auth/auth.service"
import { instanceToPlain, plainToInstance } from "class-transformer"
import { AbilityFactory } from "../../../api/src/modules/auth"
import { User } from "@share/entities"

jest.setTimeout(ms("1m"))
describe("UserController", () => {
  let module: TestingModule
  let app: INestApplication
  let url: string = "http://localhost:8000"
  let instance: AxiosInstance
  let dataSource: DataSource

  beforeEach(async () => {
    await TestingService.dropDataSources()
    module = await Test.createTestingModule({
      imports: [...TestingService.getMustHaveModules()],
    }).compile()
    app = await TestingService.getApp(module)
    // url = await app.getUrl()
    instance = axios.create({
      baseURL: `${url}/api/user`,
      withCredentials: true,
    })
    dataSource = module.get(getDataSourceToken())
  })

  afterEach(async () => {
    await app.close()
  })

  it("GET /user/retrieve 200", async () => {
    const user = await module.get(UserService).create({
      tgId: faker.number.int({ min: 1, max: 10000 }).toString(),
      firstName: faker.internet.username(),
      role: Role.Normal,
      languageCode: LanguageCode.RU,
    })
    const resp = await instance.get(`retrieve`, {
      params: {
        id: user.id,
      },
    })
    const data = resp.data
    expect(data.id).toBe(user.id)
    expect(data.role).toBe(user.role)
  })

  it("GET /user/list 200", async () => {
    for (let i = 0; i < 5; i++) {
      await module.get(UserService).create({
        tgId: faker.number.int({ min: 1, max: 10000 }).toString(),
        firstName: faker.internet.username(),
        role: i === 0 ? Role.Admin : Role.Normal,
        languageCode: LanguageCode.RU,
      })
    }

    const token = AuthService.generateToken(
      instanceToPlain({
        role: Role.Admin,
      })
    )

    const resp = await instance.get(`list`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        page: 1,
        limit: 10,
        filter: {
          role: Role.Admin,
        },
      },
    })

    const data = resp.data
    expect(data.items.length).toBe(1)
  })

  it("GET /user/get-me 200", async () => {
    const user = await module.get(UserService).create({
      tgId: faker.number.int({ min: 1, max: 10000 }).toString(),
      firstName: faker.internet.username(),
      role: Role.Normal,
      languageCode: LanguageCode.RU,
    })
    const token = AuthService.generateToken(instanceToPlain(user))

    const resp = await instance.get(`get-me`, {
      headers: {
        Authorization: `Bearer ${AuthService.generateToken(user)}`,
      },
    })
    const data = resp.data
    expect(data.id).toBe(user.id)
    expect(data.role).toBe(user.role)
  })

  it("POST /user/get-balances 200", async () => {
    const user = await module.get(UserService).create({
      tgId: faker.number.int({ min: 1, max: 10000 }).toString(),
      firstName: faker.internet.username(),
      role: Role.Normal,
      languageCode: LanguageCode.RU,
    })

    const ability =await  module.get(AbilityFactory).create(user)

    console.log(ability.can(Action.Read, plainToInstance(User, user)))



    const resp = await instance.get(
      `get-balances`,
      {
        params: {
          id: user.id
        },
        headers: {
          Authorization: `Bearer ${AuthService.generateToken(user)}`,
        },
      }
    )
    expect(resp.status).toBe(200)
    expect(Array.isArray(resp.data)).toBe(true)
  })
})
