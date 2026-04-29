import { HttpException, HttpStatus } from "@nestjs/common"
import { ErrorCode } from "@share"
import { ApiProperty } from "@nestjs/swagger"

type ApiExceptionMessage = string | object

function httpStatusForErrorCode(code: ErrorCode): number {
  switch (code) {
    case ErrorCode.UNAUTHORIZED:
    case ErrorCode.ACCESS_TOKEN_EXPIRED:
      return HttpStatus.UNAUTHORIZED
    case ErrorCode.ACCESS_DENIED:
      return HttpStatus.FORBIDDEN
    case ErrorCode.RATE_LIMITED:
      return HttpStatus.TOO_MANY_REQUESTS
    default:
      return HttpStatus.BAD_REQUEST
  }
}

export class APIExceptionResponse {
  @ApiProperty({ type: "number" })
  statusCode: number

  @ApiProperty({ enum: ErrorCode })
  errorCode: ErrorCode

  @ApiProperty({ oneOf: [{ type: "string" }, { type: "object" }] })
  message?: ApiExceptionMessage
}

export class APIException extends HttpException {
  constructor(code: ErrorCode, message?: ApiExceptionMessage, cause?: Error) {
    const status = httpStatusForErrorCode(code)
    super(
      { statusCode: status, errorCode: code, message } as APIExceptionResponse,
      status,
      { cause }
    )
  }
}
