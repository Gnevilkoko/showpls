import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ConflictException,
  ForbiddenException,
  HttpException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common"
import { ErrorCode } from "@share"
import { Request, Response } from "express"
import { EntityNotFoundError, TypeORMError } from "typeorm"
import CommonExceptions from "../common.exceptions"
import { ApiException, ApiExceptionResponseData } from "./http-exceptions"

@Catch(Error)
export class HttpExceptionFilter implements HttpExceptionFilter {
  private logger = new Logger(HttpExceptionFilter.name)

  async catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    let bizErrorCode = 400

    console.error(exception, exception.stack)

    if (exception instanceof CommonExceptions.DeletionFailed) {
      const error = new ApiException(ErrorCode.BUSINESS_ERROR, `Deletion failed`)
      response.status(bizErrorCode).json(error.getResponse())
      return
    }

    if (exception instanceof HttpException) {
      // this.logger.error(exception, exception.stack)
      if (exception instanceof ApiException) {
        response.status(bizErrorCode).json(exception.getResponse())
        // this.logger.debug(exception.getResponse())
        return
      }

      const data: ApiExceptionResponseData = {
        statusCode: bizErrorCode,
        errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
      }

      switch (exception.name) {
        case NotFoundException.name:
          data.errorCode = ErrorCode.INTERNAL_SERVER_ERROR
          break
        case ForbiddenException.name:
          data.errorCode = ErrorCode.ACCESS_DENIED
          break
        // case InternalServerErrorException.name:
        // 	data.errorCode = ErrorCode.INTERNAL_SERVER_ERROR
        // 	break
        case ConflictException.name:
          data.errorCode = ErrorCode.INTERNAL_SERVER_ERROR
          break
        case BadRequestException.name:
          data.errorCode = ErrorCode.INTERNAL_SERVER_ERROR
          break
        case UnauthorizedException.name:
          data.errorCode = ErrorCode.UNAUTHORIZED
          break
        default:
          response.send(exception.getResponse()) // NotAcceptableException, Timeout, UnsupportedMediaTypeException, ... Not biz exceptions.
          return
      }
      response.status(bizErrorCode).send(data)
      return
    }

    this.logger.error(exception)

    if (exception instanceof TypeORMError) {
      if (exception instanceof EntityNotFoundError) {
        const apiException = new ApiException(ErrorCode.BUSINESS_ERROR, "Entity record not found")
        response.status(bizErrorCode).json({ ...(apiException.getResponse() as object) })
        return // don't forget "return"
      }
    }

    response.status(500).json(new ApiException(ErrorCode.INTERNAL_SERVER_ERROR, exception.message).getResponse())
  }
}
