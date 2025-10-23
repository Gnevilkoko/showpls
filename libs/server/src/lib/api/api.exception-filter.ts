import { ArgumentsHost, Catch, HttpException } from "@nestjs/common"
import { InjectLogger } from "@server/logging"
import { Request, Response } from "express"
import { APIException, APIExceptionResponse } from "@server/api/api.exception"
import { Logger } from "winston"
import { ErrorCode } from "@share"
import { CRUDExceptions } from "./crud.exceptions"
import { get, omit } from "lodash"
import { randomUUID } from 'crypto';
import { serializeError } from "serialize-error-cjs"

@Catch(Error)
export class APIExceptionFilter {
  protected bizStatusCode = 400
  // protected logger: Logger

  constructor(@InjectLogger() protected logger: Logger) {
    // this.logger = logger.child({
    //   context: APIExceptionFilter.name,
    // })

  }

  async catch(e: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()
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

    response.status(exceptionResponseData.statusCode).json(exceptionResponseData)
    const end = process.hrtime.bigint()

    this.logger.error(`Response ${request.method} ${request.path} ${exceptionResponseData.statusCode}`, {
      // error: stack ? JSON.parse(JSON.stringify(e, Object.getOwnPropertyNames(e))) : undefined,
       method: request.method,
      url: request.path,
      id: request.id,
          userId: get(request, "payload.id"),
      sessionId: get(request, "session.id"),

      body: exceptionResponseData,


      ...(isUnexpectedError ? serializeError(e) : undefined),

      // stack: shouldLogStack ? e.stack : undefined,
      duration: request.start ? Number(end - request.start) : undefined,

    })
  }
}
