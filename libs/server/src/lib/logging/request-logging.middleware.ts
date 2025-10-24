import { Injectable, NestMiddleware } from "@nestjs/common"
import { InjectLogger } from "./inject-logger"
import { Logger } from "winston"
import { NextFunction, Request, Response } from "express"
import { getClientIp } from "request-ip"
import { get, isEmpty } from "lodash"
import { ClsService } from "nestjs-cls"
import { randomUUID } from "crypto"

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  constructor(
    @InjectLogger() private readonly logger: Logger,
    protected cls: ClsService
  ) {}

  async use(request: Request, res: Response, next: NextFunction) {
    const id = randomUUID()
    this.cls.set("id", id)

    this.logger.info(`Request ${request.method} ${request.path}`, {
      method: request.method,
      url: request.path,
      id: this.cls.get("id"),
      ip: getClientIp(request),
      userAgent: request.get("user-agent") || undefined,
      body: request.body,
      query: isEmpty(request.query) ? undefined : request.query,
      params: isEmpty(request.params) ? undefined : request.params,
      userId: get(request, "payload.id"),
      sessionId: get(request, "session.id"),
      // headers: {},
    })

    request.start = process.hrtime.bigint()
    next()
  }
}
