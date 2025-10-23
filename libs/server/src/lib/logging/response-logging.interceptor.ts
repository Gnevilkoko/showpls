import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common"
import { Logger } from "winston"
import { InjectLogger } from "@server/logging/inject-logger"
import { Request, Response } from "express"
import { Observable, tap } from "rxjs"
import { get } from "lodash"

@Injectable()
export class ResponseLoggingInterceptor implements NestInterceptor {
  constructor(@InjectLogger() private readonly logger: Logger) {}

  public intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp()
    const request = ctx.getRequest<Request>()
    const response = ctx.getResponse<Response>()

    return next.handle().pipe(
      tap((data) => {
        const end = process.hrtime.bigint()
        this.logger.info(`Response ${request.method} ${request.path} ${response.statusCode}`, {
          method: request.method,
          url: request.path,
          id: request.id,
          userId: get(request, "payload.id"),
          sessionId: get(request, "session.id"),
          body: data,
          duration: request.start ? Number(end - request.start) : undefined,
        })
      })
    )
  }
}
