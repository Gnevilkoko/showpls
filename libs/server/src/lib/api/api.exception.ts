import { HttpException, HttpStatus } from "@nestjs/common"
import { ErrorCode } from "@share"
import { ApiProperty } from "@nestjs/swagger"

type ApiExceptionMessage = string | object

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
    super(
      { statusCode: HttpStatus.BAD_REQUEST, errorCode: code, message } as APIExceptionResponse,
      HttpStatus.BAD_REQUEST,
      { cause }
    )
  }
}
