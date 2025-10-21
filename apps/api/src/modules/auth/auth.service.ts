import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { User } from "@share/entities"
import { Repository } from "typeorm"
import { SignInDto } from "./dto/sign-in.dto"
import crypto from "crypto"
import qs from "qs"
import { AuthDataValidator, objectToAuthDataMap } from "@telegram-auth/server"
import { BotConfig, JwtConfig } from "../../config"
import jwt, { SignOptions } from "jsonwebtoken"

@Injectable()
export class AuthService {
  protected token = BotConfig.token

  constructor(@InjectRepository(User) public repository: Repository<User>) {}

  public async authenticate(data: SignInDto) {
    if (data.type === "basic") {
      throw new Error(`Not supported`)
    }

    if (data.type === "tg-mini-app") {
      return AuthService.verifyInitData(data.payload, this.token)
    }

    if (data.type === "tg-login-widget") {
      return await AuthService.verifyTelegramLoginWidgetData(data.payload, this.token)
    }
  }

  static verifyInitData(initData: string, botToken: string) {
    const encoded = decodeURIComponent(initData)

    const secret = crypto.createHmac("sha256", "WebAppData").update(botToken)

    const arr = encoded.split("&")
    const hashIndex = arr.findIndex((str) => str.startsWith("hash="))
    const hash = arr.splice(hashIndex)[0].split("=")[1]

    arr.sort((a, b) => a.localeCompare(b))
    const dataCheckString = arr.join("\n")

    const _hash = crypto.createHmac("sha256", secret.digest()).update(dataCheckString).digest("hex")

    const isOk = _hash === hash
    if (!isOk) {
      throw new Error(`Invalid initData`)
    }

    return this.decodeInitData(initData)
  }

  protected static decodeInitData(initData: string) {
    const rawData = qs.parse(initData)

    const user = JSON.parse(rawData.user as any)

    return AuthService.recursiveToCamel(user) as {
      id: number
      username?: string
      firstName: string
      lastName?: string
      languageCode?: string
    }
  }

  protected static async verifyTelegramLoginWidgetData(data: Record<string, any>, botToken: string) {
    const validator = new AuthDataValidator({ botToken })
    try {
      const user = await validator.validate(objectToAuthDataMap(data))

      return AuthService.recursiveToCamel(user) as {
        id: number
        username?: string
        firstName: string
        lastName?: string
        languageCode?: string
      }
    } catch (e) {
      throw e
    }
  }

  protected static recursiveToCamel = (item: unknown): unknown => {
    if (Array.isArray(item)) {
      return item.map((el: unknown) => AuthService.recursiveToCamel(el))
    } else if (typeof item === "function" || item !== Object(item)) {
      return item
    }
    return Object.fromEntries(
      Object.entries(item as Record<string, unknown>).map(([key, value]: [string, unknown]) => [
        key.replace(/([-_][a-z])/gi, (c) => c.toUpperCase().replace(/[-_]/g, "")),
        AuthService.recursiveToCamel(value),
      ])
    )
  }

    public static generateToken<T extends object>(payload: T, expMilliseconds?: number) {
    let options: SignOptions = {
      algorithm: "RS256",
    }
    if (expMilliseconds) {
      // "100" is equal 100ms, 100 is equal 100s.
      options.expiresIn = `${expMilliseconds}`
    }

    return jwt.sign(payload, JwtConfig.privateKey, options)
  }
}
