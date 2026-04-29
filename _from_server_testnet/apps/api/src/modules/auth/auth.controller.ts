import { Body, Controller, Get, Post, Req } from "@nestjs/common"
import { ValidationPipe } from "../../common/validation"
import {
  SignInDto,
  SignInSchema,
  PhoneInitDto,
  PhoneInitSchema,
  PhoneVerifyDto,
  PhoneVerifySchema,
  AuthCallbackDto,
  AuthCallbackSchema,
  ExchangeCallbackCodeDto,
  ExchangeCallbackCodeSchema,
} from "./dto/sign-in.dto"
import AuthService from "./auth.service"
import { UCallerService } from "./ucaller.service"
import { SessionConfig } from "../../config"
import ms from "ms"
import { get } from "lodash"
import { ApiBody, ApiExtraModels, ApiOkResponse, ApiOperation, ApiTags, getSchemaPath } from "@nestjs/swagger"
import { User } from "@share/entities"
import { Request } from "express"
import { addMilliseconds, isPast } from "date-fns"
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken"
import { APIException } from "@server/api"
import { ErrorCode, FallbackLanguageCode, Role } from "@share"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import AuthExceptions from "./auth.exceptions"
import { RateLimit } from "../../common/rate-limit"
import { InjectLogger } from "@server/logging"
import { Logger } from "winston"
import { GetUser } from "../user/decorators"
import { UserService } from "../user/user.service"
import { saveSession } from "./auth-session.util"
import { toAccessTokenPayload, toPublicUser } from "./auth-user.serialize"

@ApiExtraModels(User)
@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  protected logger: Logger
  /** Совпадает с SessionConfig.maxAge (cookie + refreshToken.expireAt), чтобы не вылетать из-за короткого JWT */
  protected accessTokenLifetime = SessionConfig.maxAge

  constructor(
    @InjectLogger() logger: Logger,
    protected service: AuthService,
    protected ucaller: UCallerService,
    protected userService: UserService,
    @InjectRepository(User) protected repository: Repository<User>
  ) {
    this.logger = logger.child({ context: AuthController.name })
  }

  /** Восстановление refresh-сессии, если в Redis пусто, но access JWT ещё валиден (типично после F5). */
  private tryUserIdFromValidAccessToken(req: Request): string | null {
    const raw = req.headers.authorization
    if (!raw?.startsWith("Bearer ")) return null
    const token = raw.slice(7).trim()
    if (!token) return null
    try {
      const p = AuthService.verifySignature<{ id?: unknown; role?: unknown }>(token)
      const id = p?.id != null ? String(p.id) : ""
      const role = p?.role
      if (!id || typeof role !== "string") return null
      if (!Object.values(Role).includes(role as Role)) return null
      return id
    } catch {
      return null
    }
  }

  @Post("test")
  async test() {
    return {
      ok: true,
    }
  }

  @ApiBody({
    schema: {
      oneOf: [
        {
          type: "object",
          properties: {
            type: { type: "string", enum: ["tg-login-widget"] },
            payload: { type: "object" },
          },
        },
        {
          type: "object",
          properties: {
            type: { type: "string", enum: ["tg-mini-app"] },
            payload: { type: "string" },
          },
        },
      ],
    },
  })
  @ApiOkResponse({
    schema: {
      type: "object",
      properties: {
        accessToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR..." },
        user: { $ref: getSchemaPath(User) },
      },
    },
  })
  @RateLimit({
    limit: 10,
    ttl: ms("1m"),
  })
  @Post("sign-in")
  async signIn(@Body(new ValidationPipe(SignInSchema)) dto: SignInDto, @Req() req: Request) {
    try {
      const user = await this.service.authenticate(dto)
      const now = new Date()
      req.session.refreshToken = {
        expireAt: addMilliseconds(now, SessionConfig.maxAge).toISOString(),
      }

      req.session.user = {
        id: String(user.id),
        role: user.role,
      }

      await saveSession(req)

      await this.repository.update({ id: user.id }, { lastSeenAt: new Date() })
      const plainUser = toPublicUser(user)

      return {
        user: plainUser,
        accessToken: AuthService.generateToken(toAccessTokenPayload(user), this.accessTokenLifetime),
        authCallbackCode: AuthService.issueAuthCallbackCode(String(user.id)),
      }
    } catch (e) {
      if (e instanceof AuthExceptions.CredentialsAreInvalid) {
        throw new APIException(ErrorCode.UNAUTHORIZED, `Credentials are invalid`)
      }

      if (e instanceof AuthExceptions.CredentialsAreExpired) {
        throw new APIException(ErrorCode.UNAUTHORIZED, `Credentials are expired`)
      }

      if (e instanceof AuthExceptions.IsBanned) {
        throw new APIException(ErrorCode.ACCESS_DENIED, `You are banned`)
      }
      throw e
    }
  }

  @ApiOkResponse({
    schema: {
      type: "object",
      properties: {
        accessToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR..." },
        user: { $ref: getSchemaPath(User) },
      },
    },
  })
  @RateLimit({
    limit: 10,
    ttl: ms("1m"),
  })
  @Post("refresh-token")
  async refreshToken(@Req() req: Request) {
    try {
      const expireAt = get(req.session, "refreshToken.expireAt", undefined) as string | undefined
      const sessionUserId = get(req.session, "user.id", undefined) as string | undefined

      const sessionRefreshValid = Boolean(
        expireAt && sessionUserId && !isPast(new Date(expireAt))
      )

      let userId: string | undefined
      if (sessionRefreshValid) {
        userId = sessionUserId
      } else {
        const fromJwt = this.tryUserIdFromValidAccessToken(req)
        if (fromJwt) {
          userId = fromJwt
        } else if (expireAt && isPast(new Date(expireAt))) {
          throw new APIException(ErrorCode.UNAUTHORIZED, "Refresh token expired")
        } else {
          throw new APIException(ErrorCode.UNAUTHORIZED, "Session not exists")
        }
      }

      const user = await this.repository.findOneBy({
        id: userId,
      })

      if (!user) {
        throw new APIException(ErrorCode.UNAUTHORIZED, `User not found`)
      }

      try {
        await this.service.checkPolitics(user)
      } catch (e) {
        if (e instanceof AuthExceptions.IsBanned) {
          throw new APIException(ErrorCode.ACCESS_DENIED, `You are banned`)
        }
        throw new APIException(ErrorCode.UNAUTHORIZED, `Cannot update access token`)
      }

      await this.repository.update({ id: user.id }, { lastSeenAt: new Date() })

      const plainUser = toPublicUser(user)
      const accessToken = AuthService.generateToken(toAccessTokenPayload(user), this.accessTokenLifetime)

      const now = new Date()
      req.session.user = {
        id: String(user.id),
        role: user.role,
      }
      req.session.refreshToken = {
        expireAt: addMilliseconds(now, SessionConfig.maxAge).toISOString(),
      }
      await saveSession(req)

      return {
        user: plainUser,
        accessToken,
      }
    } catch (e) {
      if (e instanceof APIException) {
        throw e
      }
      this.logger.error({
        message: "refresh-token unexpected error",
        err: e instanceof Error ? e.message : String(e),
      })
      throw new APIException(ErrorCode.UNAUTHORIZED, "Refresh token unavailable")
    }
  }

  @ApiOperation({
    summary: "Обмен кода с /auth/callback (JWT из query ?code=)",
    description:
      "После Telegram/phone auth клиент открывает showpls://auth/callback?code=… или https://…/auth/callback?code=…. " +
      "Код выдаётся в ответах sign-in / phone/verify / POST auth/callback как authCallbackCode. " +
      "Срок жизни кода ~10 минут.",
  })
  @ApiOkResponse({
    schema: {
      type: "object",
      properties: {
        accessToken: { type: "string" },
        user: { $ref: getSchemaPath(User) },
      },
    },
  })
  @RateLimit({ limit: 20, ttl: ms("1m") })
  @Post("exchange-callback-code")
  async exchangeCallbackCode(
    @Body(new ValidationPipe(ExchangeCallbackCodeSchema)) dto: ExchangeCallbackCodeDto,
    @Req() req: Request,
  ) {
    let userId: string
    try {
      ;({ userId } = AuthService.verifyAuthCallbackCode(dto.code))
    } catch (e) {
      if (e instanceof TokenExpiredError) {
        throw new APIException(ErrorCode.UNAUTHORIZED, "Auth code expired")
      }
      if (e instanceof JsonWebTokenError) {
        throw new APIException(ErrorCode.UNAUTHORIZED, "Invalid auth code")
      }
      throw e
    }

    const user = await this.repository.findOneBy({ id: userId })
    if (!user) {
      throw new APIException(ErrorCode.UNAUTHORIZED, "User not found")
    }

    try {
      await this.service.checkPolitics(user)
    } catch (err) {
      if (err instanceof AuthExceptions.IsBanned) {
        throw new APIException(ErrorCode.ACCESS_DENIED, "You are banned")
      }
      throw err
    }

    const now = new Date()
    req.session.refreshToken = {
      expireAt: addMilliseconds(now, SessionConfig.maxAge).toISOString(),
    }
    req.session.user = { id: String(user.id), role: user.role }
    await saveSession(req)

    await this.repository.update({ id: user.id }, { lastSeenAt: new Date() })
    const plainUser = toPublicUser(user)

    return {
      user: plainUser,
      accessToken: AuthService.generateToken(toAccessTokenPayload(user), this.accessTokenLifetime),
    }
  }

  @RateLimit({ limit: 5, ttl: ms("1m") })
  @Post("phone/init")
  async phoneInit(@Body(new ValidationPipe(PhoneInitSchema)) dto: PhoneInitDto) {
    try {
      const { ucallerId } = await this.ucaller.initCall(dto.phone)
      return { status: true, ucallerId }
    } catch (e: any) {
      this.logger.error({ message: "Phone init failed", error: e?.message })
      throw new APIException(ErrorCode.BUSINESS_ERROR, e?.message || "Failed to initiate call")
    }
  }

  @RateLimit({ limit: 10, ttl: ms("1m") })
  @Post("phone/verify")
  async phoneVerify(@Body(new ValidationPipe(PhoneVerifySchema)) dto: PhoneVerifyDto, @Req() req: Request) {
    const normalizedPhone = dto.phone.replace(/\D/g, "")

    const isValid = this.ucaller.verifyCode(normalizedPhone, dto.code)
    if (!isValid) {
      throw new APIException(ErrorCode.UNAUTHORIZED, "Invalid or expired code")
    }

    let user = await this.repository.findOne({ where: { phone: normalizedPhone } })

    if (!user) {
      user = await this.userService.create({
        tgId: null,
        username: null,
        firstName: normalizedPhone.slice(-4),
        lastName: null,
        avatar: null,
        role: Role.Normal,
        languageCode: FallbackLanguageCode,
        phone: normalizedPhone,
      })
    }

    if (user.banned) {
      throw new APIException(ErrorCode.ACCESS_DENIED, "You are banned")
    }

    const now = new Date()
    req.session.refreshToken = {
      expireAt: addMilliseconds(now, SessionConfig.maxAge).toISOString(),
    }
    req.session.user = { id: String(user.id), role: user.role }
    await saveSession(req)

    await this.repository.update({ id: user.id }, { lastSeenAt: new Date() })
    const plainUser = toPublicUser(user)

    return {
      user: plainUser,
      accessToken: AuthService.generateToken(toAccessTokenPayload(user), this.accessTokenLifetime),
      authCallbackCode: AuthService.issueAuthCallbackCode(String(user.id)),
    }
  }

  @ApiOperation({ summary: "Unified auth callback for mobile/web" })
  @RateLimit({ limit: 10, ttl: ms("1m") })
  @Post("callback")
  async authCallback(@Body(new ValidationPipe(AuthCallbackSchema)) dto: AuthCallbackDto, @Req() req: Request) {
    let user: User | null = null

    if (dto.method === "telegram") {
      try {
        user = await this.service.authenticate({ type: dto.type as any, payload: dto.payload })
      } catch (e) {
        if (e instanceof AuthExceptions.CredentialsAreInvalid) {
          throw new APIException(ErrorCode.UNAUTHORIZED, "Credentials are invalid")
        }
        if (e instanceof AuthExceptions.CredentialsAreExpired) {
          throw new APIException(ErrorCode.UNAUTHORIZED, "Credentials are expired")
        }
        if (e instanceof AuthExceptions.IsBanned) {
          throw new APIException(ErrorCode.ACCESS_DENIED, "You are banned")
        }
        throw e
      }
    } else if (dto.method === "phone") {
      const normalizedPhone = dto.phone.replace(/\D/g, "")
      const isValid = this.ucaller.verifyCode(normalizedPhone, dto.code)
      if (!isValid) {
        throw new APIException(ErrorCode.UNAUTHORIZED, "Invalid or expired code")
      }

      user = await this.repository.findOne({ where: { phone: normalizedPhone } })
      if (!user) {
        user = await this.userService.create({
          tgId: null,
          username: null,
          firstName: normalizedPhone.slice(-4),
          lastName: null,
          avatar: null,
          role: Role.Normal,
          languageCode: FallbackLanguageCode,
          phone: normalizedPhone,
        })
      }

      if (user.banned) {
        throw new APIException(ErrorCode.ACCESS_DENIED, "You are banned")
      }
    }

    if (!user) {
      throw new APIException(ErrorCode.UNAUTHORIZED, "Authentication failed")
    }

    const now = new Date()
    req.session.refreshToken = {
      expireAt: addMilliseconds(now, SessionConfig.maxAge).toISOString(),
    }
    req.session.user = { id: String(user.id), role: user.role }
    await saveSession(req)

    await this.repository.update({ id: user.id }, { lastSeenAt: new Date() })
    const plainUser = toPublicUser(user)

    return {
      user: plainUser,
      accessToken: AuthService.generateToken(toAccessTokenPayload(user), this.accessTokenLifetime),
      authCallbackCode: AuthService.issueAuthCallbackCode(String(user.id)),
    }
  }

  @Post("sign-out")
  async signOut(@Req() req: Request) {
    req.session.destroy((e) => {
      if (e) {
        this.logger.error({
          message: "Failed to destroy session",
          errorType: e?.constructor?.name || "Unknown"
        })
      }
    })
  }

  @ApiOkResponse({
    schema: {
      type: "array",
      items: {
        type: "object",
        properties: {},
      },
    },
  })
  @Get("get-rules")
  async getRules(@GetUser() user: User | null) {
    return await this.service.getRules(user)
  }

// // ГЕНЕРАТОР ВЕЧНЫХ ТОКЕНОВ ДЛЯ ТЕСТОВ
//   @Post("dev/generate-permanent-tokens")
//   async generatePermanentTokens() {
//     const customer = await this.repository.findOneBy({ id: "777777" });
//     const performer = await this.repository.findOneBy({ id: "888888" });
//     const admin = await this.repository.findOneBy({ id: "999999" }); // <--- Админ тут

//     if (!customer || !performer || !admin) {
//       throw new APIException(ErrorCode.UNAUTHORIZED, "Запусти сначала seed.sql, братишка! Админа нет в базе.");
//     }

//     // 2. Готовим payload
//     const plainCustomer = omit(instanceToPlain(customer), []);
//     const plainPerformer = omit(instanceToPlain(performer), []);
//     const plainAdmin = omit(instanceToPlain(admin), []); // <--- ВОТ ЭТО ДОБАВИТЬ

//     // 3. Генерируем токены на 365 дней
//     const oneYear = 31536000000;

//     return {
//       message: "Сохрани эти токены, они работают 1 год 👇",
//       CUSTOMER_777777: AuthService.generateToken(plainCustomer, oneYear),
//       PERFORMER_888888: AuthService.generateToken(plainPerformer, oneYear),
//       ADMIN_999999: AuthService.generateToken(plainAdmin, oneYear),
//     };
//   }
}