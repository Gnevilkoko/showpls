import { INestApplication } from "@nestjs/common"
import { Test, TestingModule } from "@nestjs/testing"
import axios, { AxiosInstance } from "axios"
import { DataSource, Repository } from "typeorm"
import { getDataSourceToken, getRepositoryToken } from "@nestjs/typeorm"
import ms from "ms"
import { User } from "@share/entities"
import { WinstonModule } from "nest-winston"
import { TestingService } from "../../../api/src/testing"
import { AppModule } from "../../../api/src/app.module"
import { AuthService } from "../../../api/src/modules/auth/auth.service"
import { UserService } from "../../../api/src/modules/user/user.service"


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
      imports: [AppModule],
    })
      .overrideProvider(AuthService)
      .useFactory({
        inject: [getRepositoryToken(User), UserService],
        factory: (repository: Repository<User>, service: UserService) => {
          class UpgradedAuthService extends AuthService {
            protected verifyInitData(initData: string, botToken: string) {
              return super.decodeInitData(initData)
            }

            protected async verifyTelegramLoginWidgetData(data: Record<string, any>, botToken: string) {
              return data as any
            }
          }

          return new UpgradedAuthService(repository, service)
        },
      })
      .compile()
    app = await TestingService.getApp(module)
    // url = await app.getUrl()
    instance =
      axios.create({
        baseURL: `${url}/api/auth`,
        withCredentials: true,
      }
    )
    dataSource = module.get(getDataSourceToken())
  })

  afterEach(async () => {
    await app.close()
  })

  it("POST /auth/sign-in 200 for tg-mini-app", async () => {
    const initData =
      "user=%7B%22id%22%3A1814724100%2C%22first_name%22%3A%22Danil%22%2C%22last_name%22%3A%22%22%2C%22username%22%3A%22shuriken0x%22%2C%22language_code%22%3A%22ru%22%2C%22allows_write_to_pm%22%3Atrue%2C%22photo_url%22%3A%22https%3A%5C%2F%5C%2Ft.me%5C%2Fi%5C%2Fuserpic%5C%2F320%5C%2F__Z8Ub_yS_A3lgAQnIDbc6S1JWhgLYbkXka5ZeXaSuA.svg%22%7D&chat_instance=-1916489895483310135&chat_type=sender&auth_date=1761217073&signature=u25mEwy0YFrBYPL_l2S8SMSuljCQ7s9qWFpQTtflVLXKMta-xiRTP9mYJyczpcn8f7jtJ3jjQUdZeRiDiPs_Ag&hash=3fdafa239313bdd95291aba55c4cba845ece262a4f27f9965df1846326488c7c"

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

  it("POST /auth/sign-in 200 for tg-login-widget", async () => {
    const resp = await instance.post("sign-in", {
      type: "tg-login-widget",
      payload: {
        id: 1814724100,
        firstName: "Danil",
        lastName: "",
        username: "shuriken0x",
        languageCode: "ru",
        allowsWriteToPm: true,
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
      "user=%7B%22id%22%3A1814724100%2C%22first_name%22%3A%22Danil%22%2C%22last_name%22%3A%22%22%2C%22username%22%3A%22shuriken0x%22%2C%22language_code%22%3A%22ru%22%2C%22allows_write_to_pm%22%3Atrue%2C%22photo_url%22%3A%22https%3A%5C%2F%5C%2Ft.me%5C%2Fi%5C%2Fuserpic%5C%2F320%5C%2F__Z8Ub_yS_A3lgAQnIDbc6S1JWhgLYbkXka5ZeXaSuA.svg%22%7D&chat_instance=-1916489895483310135&chat_type=sender&auth_date=1761217073&signature=u25mEwy0YFrBYPL_l2S8SMSuljCQ7s9qWFpQTtflVLXKMta-xiRTP9mYJyczpcn8f7jtJ3jjQUdZeRiDiPs_Ag&hash=3fdafa239313bdd95291aba55c4cba845ece262a4f27f9965df1846326488c7c"

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
