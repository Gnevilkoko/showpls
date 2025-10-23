import { Injectable, NestMiddleware } from "@nestjs/common"
import { InjectLogger } from "./inject-logger"
import { Logger } from "winston"
import { NextFunction, Request, Response } from "express"
import { randomUUID } from "crypto"
import { getClientIp } from "request-ip"
import { get, isEmpty } from "lodash"

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  constructor(@InjectLogger() private readonly logger: Logger) {}

  async use(request: Request, res: Response, next: NextFunction) {
    request.id = randomUUID()

    this.logger.info(`Request ${request.method} ${request.path}`, {
      method: request.method,
      url: request.path,
      id: request.id,
      ip: getClientIp(request),
      userAgent: request.get("user-agent") || undefined,
      body: request.body,
      query: isEmpty(request.query) ? undefined : request.query,
      params: isEmpty(request.params) ? undefined : request.params,
      userId: get(request, "payload.id"),
      sessionId: get(request, "session.id"),
      // headers: {},
    })

    const start = process.hrtime.bigint()
    request.start = start
    next()
  }
}
