import { HttpException, HttpStatus } from "@nestjs/common"
import { ErrorCode } from "@share"

type ApiExceptionMessage = string | object

export type ApiExceptionResponseData = {
  statusCode: number
  errorCode: ErrorCode
  message?: ApiExceptionMessage
}

export class ApiException extends HttpException {
  constructor(code: ErrorCode, message?: ApiExceptionMessage, cause?: Error) {
    super(
      { statusCode: HttpStatus.BAD_REQUEST, errorCode: code, message } as ApiExceptionResponseData,
      HttpStatus.BAD_REQUEST,
      { cause },
    )
  }
}
