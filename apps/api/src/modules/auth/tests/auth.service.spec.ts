import crypto from "crypto"
import { AuthService } from "../auth.service"

describe("AuthService", () => {
  const service = new AuthService({} as any, {} as any)
  const botToken = "123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefg"

  it("should verifyInitData() works", async () => {
    const initData =
      "user=%7B%22id%22%3A1814724100%2C%22first_name%22%3A%22Danil%22%2C%22last_name%22%3A%22%22%2C%22username%22%3A%22shuriken0x%22%2C%22language_code%22%3A%22ru%22%2C%22allows_write_to_pm%22%3Atrue%2C%22photo_url%22%3A%22https%3A%5C%2F%5C%2Ft.me%5C%2Fi%5C%2Fuserpic%5C%2F320%5C%2F__Z8Ub_yS_A3lgAQnIDbc6S1JWhgLYbkXka5ZeXaSuA.svg%22%7D&chat_instance=-1916489895483310135&chat_type=sender&auth_date=1761217073&signature=u25mEwy0YFrBYPL_l2S8SMSuljCQ7s9qWFpQTtflVLXKMta-xiRTP9mYJyczpcn8f7jtJ3jjQUdZeRiDiPs_Ag&hash=730be3f8ad13e07db6a87b4fcf1f0f71744e0a64c6941c869c727aff3616cae0"

    // @ts-ignore
    const data = service.verifyInitData(initData, botToken)
    expect(data.id).toBeDefined()
  })
})
