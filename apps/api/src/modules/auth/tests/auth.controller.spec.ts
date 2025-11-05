import { INestApplication, Module } from "@nestjs/common"
import { Test, TestingModule } from "@nestjs/testing"
import axios, { AxiosInstance } from "axios"
import { DataSource, Repository } from "typeorm"
import { getDataSourceToken, getRepositoryToken } from "@nestjs/typeorm"
import ms from "ms"
import { TestingService } from "../../../testing"
import { AppModule } from "../../../app.module"
import AuthService from "../auth.service"
import { User } from "@share/entities"
import { UserService } from "../../user"
import { SignInDto } from "../dto/sign-in.dto"
import request from "supertest"
import { ErrorCode } from "@share"
import { APIExceptionResponse } from "@server/api"
import { getLoggerToken } from "@server/logging"
import { Logger } from "winston"
import { AbilityFactory } from "../index"
import { getBotToken } from "nestjs-telegraf"

jest.mock("../../../config/bot.config", () => {
  const actual = jest.requireActual("../../../config/bot.config")
  return {
    ...actual,
    default: () => {
      return {
        token: "123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefg",
      }
    },
    __esModule: true,
  }
})
jest.setTimeout(ms("1m"))
describe("AuthController", () => {
  let module: TestingModule
  let app: INestApplication
  let url: string = "http://localhost:8000"
  let instance: AxiosInstance
  let dataSource: DataSource

  beforeEach(async () => {
    await TestingService.dropDataSources()
    module = await Test.createTestingModule({
      imports: [...TestingService.getMustHaveModules()],
    })
      .overrideProvider(AuthService)
      .useFactory({
        inject: [getLoggerToken(), getRepositoryToken(User), UserService],
        factory: (
          logger: Logger,
          repository: Repository<User>,
          service: UserService,
          abilityFactory: AbilityFactory
        ) => {
          class UpgradedAuthService extends AuthService {
            authenticate(data: SignInDto, ignoreExpiration: boolean = false) {
              return super.authenticate(data, true)
            }

            protected async verifyTelegramLoginWidgetData(data: Record<string, any>, botToken: string) {
              return AuthService.recursiveToCamel(data as any) as any
            }
          }

          return new UpgradedAuthService(logger, repository, service, abilityFactory)
        },
      })
      .compile()
    app = await TestingService.getApp(module)
    // url = await app.getUrl()
    instance = axios.create({
      baseURL: `${url}/api/auth`,
      withCredentials: true,
    })
    dataSource = module.get(getDataSourceToken())
  })

  afterEach(async () => {
    await app.close()
  })

  it("POST /auth/sign-in 200 for tg-mini-app", async () => {
    const initData =
      "user=%7B%22id%22%3A1814724100%2C%22first_name%22%3A%22Danil%22%2C%22last_name%22%3A%22%22%2C%22username%22%3A%22shuriken0x%22%2C%22language_code%22%3A%22ru%22%2C%22allows_write_to_pm%22%3Atrue%2C%22photo_url%22%3A%22https%3A%5C%2F%5C%2Ft.me%5C%2Fi%5C%2Fuserpic%5C%2F320%5C%2F__Z8Ub_yS_A3lgAQnIDbc6S1JWhgLYbkXka5ZeXaSuA.svg%22%7D&chat_instance=-1916489895483310135&chat_type=sender&auth_date=1761217073&signature=u25mEwy0YFrBYPL_l2S8SMSuljCQ7s9qWFpQTtflVLXKMta-xiRTP9mYJyczpcn8f7jtJ3jjQUdZeRiDiPs_Ag&hash=730be3f8ad13e07db6a87b4fcf1f0f71744e0a64c6941c869c727aff3616cae0"

    const resp = await instance.post("sign-in", {
      type: "tg-mini-app",
      payload: initData,
    })
    const data = resp.data
    expect(data.user).toBeDefined()
    expect(data.user.id).toBe("1")
    expect(data.user.tgId).toBe("1814724100")
    expect(data.accessToken).toBeDefined()
  })

  it("should /auth/sign-in 400 (ValidationError)", async () => {
    const response = await request(app.getHttpServer()).post("/api/auth/sign-in").send({
      type: "tg-mini-app",
      payload: null,
    })
    expect(response.statusCode).toBe(400)
    const data = response.body as APIExceptionResponse
    expect(data.errorCode).toBe(ErrorCode.VALIDATION_ERROR)
  })

  it("should /auth/sign-in 400 (UNAUTHORIZED) - CredentialsAreInvalid", async () => {
    const response = await request(app.getHttpServer()).post("/api/auth/sign-in").send({
      type: "tg-mini-app",
      payload: "...",
    })
    expect(response.statusCode).toBe(400)
    const data = response.body as APIExceptionResponse
    expect(data.errorCode).toBe(ErrorCode.UNAUTHORIZED)
  })

  it("POST /auth/sign-in 200 for tg-login-widget", async () => {
    const resp = await instance.post("sign-in", {
      type: "tg-login-widget",
      payload: {
        auth_date: 176120000,
        first_name: "Danil",
        hash: "c11336e5a23c8d5064f84416d8fc38f71725dd402f7f7a29fd7172816f610be3",
        id: 1814724100,
        username: "shuriken0x",
      },
    })
    const data = resp.data
    expect(data.user).toBeDefined()
    expect(data.user.id).toBe("1")
    expect(data.user.tgId).toBe("1814724100")
    expect(data.accessToken).toBeDefined()
  })

  it("POST /auth/refresh-token 200", async () => {
    const initData =
      "user=%7B%22id%22%3A1814724100%2C%22first_name%22%3A%22Danil%22%2C%22last_name%22%3A%22%22%2C%22username%22%3A%22shuriken0x%22%2C%22language_code%22%3A%22ru%22%2C%22allows_write_to_pm%22%3Atrue%2C%22photo_url%22%3A%22https%3A%5C%2F%5C%2Ft.me%5C%2Fi%5C%2Fuserpic%5C%2F320%5C%2F__Z8Ub_yS_A3lgAQnIDbc6S1JWhgLYbkXka5ZeXaSuA.svg%22%7D&chat_instance=-1916489895483310135&chat_type=sender&auth_date=1761217073&signature=u25mEwy0YFrBYPL_l2S8SMSuljCQ7s9qWFpQTtflVLXKMta-xiRTP9mYJyczpcn8f7jtJ3jjQUdZeRiDiPs_Ag&hash=730be3f8ad13e07db6a87b4fcf1f0f71744e0a64c6941c869c727aff3616cae0"

    const { headers } = await instance.post("sign-in", {
      type: "tg-mini-app",
      payload: initData,
    })
    const cookies = headers["set-cookie"] as string[]
    const sessionCookie = cookies[0]
    const { data } = await instance.post(
      `refresh-token`,
      {},
      {
        headers: {
          Cookie: sessionCookie,
        },
      }
    )

    expect(data.accessToken).toBeDefined()
    expect(data.user.id).toBeDefined()
  })
})
