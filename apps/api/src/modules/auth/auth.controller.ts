import { Body, Controller, Post, Req } from "@nestjs/common"
import { ValidationPipe } from "../../common/validation"
import { SignInDto, SignInSchema } from "./dto/sign-in.dto"
import { AuthService } from "./auth.service"
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

@ApiExtraModels(User)
@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  protected accessTokenLifetime = ConfigService.isDevelopment() ? ms("72h") : ms("15m")

  constructor(protected service: AuthService, @InjectRepository(User) protected repository: Repository<User>) {}

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
}
