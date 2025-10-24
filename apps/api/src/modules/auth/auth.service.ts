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
import AuthExceptions from "./auth.exceptions"
import { UserService } from "../user/user.service"
import { TGUser } from "./auth.types"
import { retryWithExponentialBackoff } from "@share/utils"
import { DbHelpers } from "../../db"
import { omit } from "lodash"
import { FallbackLanguageCode, LanguageCode, Role } from "@share"
import { z } from "zod"
import ms from "ms"
import { ClsService } from "nestjs-cls"
import { Logger } from "winston"
import { InjectLogger } from "@server/logging"

@Injectable()
export class AuthService {
  protected logger: Logger
  protected token = BotConfig.token

  constructor(
    @InjectLogger() logger: Logger,
    @InjectRepository(User) public repository: Repository<User>,
    protected service: UserService,
    protected clsService: ClsService
  ) {
    this.logger = logger.child({
      id: this.clsService.get("id")
    })
  }

  public async authenticate(data: SignInDto, ignoreExpiration: boolean = false) {
    let tgUser: TGUser

    if (data.type === "tg-mini-app") {
      tgUser = this.verifyInitData(data.payload, this.token)
    } else if (data.type === "tg-login-widget") {
      tgUser = await this.verifyTelegramLoginWidgetData(data.payload, this.token)
    }

    if (!ignoreExpiration) {
      const distance = new Date().getTime() - new Date(+tgUser.authDate * 1000).getTime()
      if (distance > ms("1h")) {
        throw new AuthExceptions.CredentialsAreExpired()
      }
    }

    try {
      return await retryWithExponentialBackoff(
        async () => {
          return await this.repository.manager.transaction("SERIALIZABLE", async (manager) => {
            const user = await manager.getRepository(User).findOne({
              where: {
                tgId: tgUser.id.toString(),
              },
            })

            if (user) {
              return user
            }

            return await this.service.create(
              {
                ...omit(tgUser, ["id"]),
                tgId: tgUser.id.toString(),
                role: Role.Normal,
                avatar: tgUser.photoUrl,
                languageCode: z.enum(LanguageCode).safeParse(tgUser.languageCode).success
                  ? (tgUser.languageCode as LanguageCode)
                  : FallbackLanguageCode,
              },
              manager
            )
          })
        },
        (e) => DbHelpers.isSerializationFailure(e)
      )
    } catch (e) {
      throw e
    }
  }

  protected verifyInitData(initData: string, botToken: string) {
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
      throw new AuthExceptions.CredentialsAreInvalid(undefined)
    }

    return this.decodeInitData(initData)
  }

  protected decodeInitData(initData: string) {
    const rawData = qs.parse(initData) as any
    const user = AuthService.recursiveToCamel(JSON.parse(rawData.user)) as TGUser
    user.authDate = (rawData as any).auth_date
    return user
  }

  protected async verifyTelegramLoginWidgetData(data: Record<string, any>, botToken: string) {
    const validator = new AuthDataValidator({ botToken })
    try {
      const authDataMap = objectToAuthDataMap(data)
      const user = await validator.validate(authDataMap)
      return {
        ...(AuthService.recursiveToCamel(user) as object),
      } as TGUser
    } catch (e) {
      throw new AuthExceptions.CredentialsAreInvalid(undefined, { cause: e })
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

  public static verifySignature<T extends object>(token: string): T {
    return jwt.verify(token, JwtConfig.publicKey, {
      ignoreExpiration: false,
      algorithms: ["RS256"],
    }) as T
  }

  async checkPolitics(user: User): Promise<true> {
    if (user.banned) {
      throw new AuthExceptions.IsBanned()
    }
    return true
  }
}
