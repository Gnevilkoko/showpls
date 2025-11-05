import { Injectable, NestMiddleware } from "@nestjs/common"
import { NextFunction, Request, Response } from "express"
import { APIException } from "@server/api"
import { ErrorCode } from "@share"
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken"
import AuthService from "./auth.service"
import { InjectLogger } from "@server/logging"
import { Logger } from "winston"
import { ClsService } from "nestjs-cls"
import { get } from "lodash"

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(@InjectLogger() protected logger: Logger, protected cls: ClsService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // if (req.originalUrl === "/api/auth/sign-in" || req.originalUrl === "/api/auth/refresh-token") {
    //   next()
    //   return
    // }

    const token = AuthMiddleware.extractToken(req)

    if (!token) {
      next()
      return
    }

    try {
      try {
        req.payload = AuthService.verifySignature(token) as any
        this.cls.set("userId", get(req, "payload.id"))
      } catch (e: any) {
        if (e instanceof TokenExpiredError) {
          throw new APIException(ErrorCode.ACCESS_TOKEN_EXPIRED)
        }
        if (e instanceof JsonWebTokenError) {
          throw new APIException(ErrorCode.UNAUTHORIZED, "Invalid signature or invalid token format")
        }

        this.logger.error(e)
        throw new APIException(ErrorCode.UNAUTHORIZED, e.message ? e.message : "Something wrong with the access token")
      }
    } catch (e) {
      next(e)
      return
    }

    next()
  }

  protected static extractToken(req: Request) {
    const header = req.header("Authorization") as string | undefined
    if (header && header.split(" ")[0] === "Bearer") {
      return header.split(" ")[1]
    }
    return undefined
  }
}
