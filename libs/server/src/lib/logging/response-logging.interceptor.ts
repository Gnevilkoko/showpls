import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common"
import { Logger } from "winston"
import { InjectLogger } from "@server/logging/inject-logger"
import { Request, Response } from "express"
import { Observable, tap } from "rxjs"
import { get } from "lodash"
import { ClsService } from "nestjs-cls"

@Injectable()
export class ResponseLoggingInterceptor implements NestInterceptor {
  constructor(@InjectLogger() private readonly logger: Logger, protected cls: ClsService) {}

  public intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp()
    const req = ctx.getRequest<Request>()
    const response = ctx.getResponse<Response>()
    const path = req.originalUrl

    return next.handle().pipe(
      tap((data) => {
        if (response.statusCode === 201) {
          response.status(200)
        }

        const end = process.hrtime.bigint()
        this.logger.info(`Response ${req.method} ${path} ${response.statusCode}`, {
          method: req.method,
          url: path,
          id: this.cls.get("id"),
          userId: get(req, "payload.id"),
          sessionId: get(req, "session.id"),
          body: data,
          duration: req.start ? Number(end - req.start) : undefined,
        })
      })
    )
  }
}
