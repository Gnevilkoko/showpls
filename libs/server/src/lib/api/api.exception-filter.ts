import { ArgumentsHost, Catch, HttpException } from "@nestjs/common"
import { InjectLogger } from "@server/logging"
import { Request, Response } from "express"
import { APIException, APIExceptionResponse } from "@server/api/api.exception"
import { Logger } from "winston"
import { ErrorCode } from "@share"
import { CRUDExceptions } from "./crud.exceptions"
import { get } from "lodash"
import { serializeError } from "serialize-error-cjs"
import { ClsService } from "nestjs-cls"

@Catch(Error)
export class APIExceptionFilter {
  protected bizStatusCode = 400
  // protected logger: Logger

  constructor(@InjectLogger() protected logger: Logger, protected cls: ClsService) {
    // this.logger = logger.child({
    //   context: APIExceptionFilter.name,
    // })
  }

  async catch(e: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const resp = ctx.getResponse<Response>()
    const req = ctx.getRequest<Request>()
    let isUnexpectedError: boolean = true

    let exceptionResponseData: APIExceptionResponse = {
      statusCode: 500,
      errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
      message: "Server error",
    }

    if (e instanceof APIException) {
      exceptionResponseData = e.getResponse() as APIExceptionResponse
      isUnexpectedError = false
    } else if (e instanceof HttpException) {
      exceptionResponseData = {
        statusCode: e.getStatus(),
        errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
        message: e.message,
      }
      isUnexpectedError = false
    }

    if (e instanceof CRUDExceptions.UpdateFailed) {
      isUnexpectedError = false
    }

    if (e instanceof CRUDExceptions.DeleteFailed) {
      isUnexpectedError = false
    }

    resp.status(exceptionResponseData.statusCode).json(exceptionResponseData)
    const end = process.hrtime.bigint()

    this.logger.error(`Response ${req.method} ${req.path} ${exceptionResponseData.statusCode}`, {
      // error: stack ? JSON.parse(JSON.stringify(e, Object.getOwnPropertyNames(e))) : undefined,
      method: req.method,
      url: req.originalUrl,
      id: this.cls.get("id"),
      userId: get(req, "payload.id"),
      sessionId: get(req, "session.id"),

      body: exceptionResponseData,

      error: isUnexpectedError ? serializeError(e) : undefined,

      // stack: shouldLogStack ? e.stack : undefined,
      duration: req.start ? Number(end - req.start) : undefined,
    })
  }
}
