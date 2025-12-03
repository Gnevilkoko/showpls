import { Body, Controller, Get, Post, Req } from "@nestjs/common"
import { ValidationPipe } from "../../common/validation"
import { SignInDto, SignInSchema } from "./dto/sign-in.dto"
import AuthService from "./auth.service"
import { ConfigService, SessionConfig } from "../../config"
import ms from "ms"
import { get, omit } from "lodash"
import { ApiBody, ApiExtraModels, ApiOkResponse, ApiTags, getSchemaPath } from "@nestjs/swagger"
import { User } from "@share/entities"
import { Request } from "express"
import { addMilliseconds, isPast } from "date-fns"
import { instanceToPlain } from "class-transformer"
import { APIException } from "@server/api"
import { ErrorCode } from "@share"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import AuthExceptions from "./auth.exceptions"
import { RateLimit } from "../../common/rate-limit"
import { InjectLogger } from "@server/logging"
import { Logger } from "winston"
import { GetUser } from "../user/decorators"

@ApiExtraModels(User)
@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  protected logger: Logger
  protected accessTokenLifetime = ConfigService.isDevelopment() ? ms("72h") : ms("15m")

  constructor(
    @InjectLogger() logger: Logger,
    protected service: AuthService,
    @InjectRepository(User) protected repository: Repository<User>
  ) {
    this.logger = logger.child({ context: AuthController.name })
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
        id: user.id,
        role: user.role,
      }

      req.session.save()

      await this.repository.update({ id: user.id }, { lastSeenAt: new Date() })
      const plainUser = omit(instanceToPlain(user), [])

      return {
        user: plainUser,
        accessToken: AuthService.generateToken(plainUser, this.accessTokenLifetime),
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
    const expireAt = get(req.session, "refreshToken.expireAt", undefined)
    const userId = get(req.session, "user.id", undefined)

    if (!expireAt || !userId) {
      throw new APIException(ErrorCode.UNAUTHORIZED, `Session not exists`)
    }

    if (isPast(new Date(expireAt))) {
      throw new APIException(ErrorCode.UNAUTHORIZED, "Refresh token expired")
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

    const plainUser = omit(instanceToPlain(user), [])

    return {
      user: plainUser,
      accessToken: AuthService.generateToken(plainUser, this.accessTokenLifetime),
    }
  }

  @Post("sign-out")
  async signOut(@Req() req: Request) {
    req.session.destroy((e) => {
      this.logger.error(e)
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
  // @Post("dev/generate-permanent-tokens")
  // async generatePermanentTokens() {
  //   // 1. Ищем наших юзеров по ID (string, так как в сущности это bigint, но TypeORM мапит)
  //   // Важно: в seed.sql мы писали числа, но TypeORM часто работает со строками для bigint
  //   const customer = await this.repository.findOneBy({ id: "777777" });
  //   const performer = await this.repository.findOneBy({ id: "888888" });

  //   if (!customer || !performer) {
  //     throw new APIException(ErrorCode.UNAUTHORIZED, "Запусти сначала seed.sql, братишка!");
  //   }

  //   // 2. Готовим payload
  //   const plainCustomer = omit(instanceToPlain(customer), []);
  //   const plainPerformer = omit(instanceToPlain(performer), []);

  //   // 3. Генерируем токены на 365 дней (ms('365d'))
  //   // Внимание: число 31536000000 - это год в миллисекундах
  //   const oneYear = 31536000000;

  //   return {
  //     message: "Сохрани эти токены, они работают 1 год 👇",
  //     CUSTOMER_777777: AuthService.generateToken(plainCustomer, oneYear),
  //     PERFORMER_888888: AuthService.generateToken(plainPerformer, oneYear),
  //   };
  // }
}