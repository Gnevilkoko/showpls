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

  async use(req: Request, res: Response, next: NextFunction) {
    const id = randomUUID()
    this.cls.set("id", id)

    const path = req.originalUrl

    this.logger.info(`Request ${req.method} ${path}`, {
      method: req.method,
      url: path,
      id: this.cls.get("id"),
      ip: getClientIp(req),
      userAgent: req.get("user-agent") || undefined,
      body: isEmpty(req.body) ? undefined : req.body,
      query: isEmpty(req.query) ? undefined : req.query,
      userId: get(req, "payload.id"),
      sessionId: get(req, "session.id"),
      // headers: {},
    })

    req.start = process.hrtime.bigint()
    next()
  }
}
