import { ApiProperty } from "@nestjs/swagger"
import { IsNotEmpty, IsUUID } from "class-validator"

export class RejectSubmissionDto {
  @ApiProperty({ example: "uuid-of-request" })
  @IsUUID()
  @IsNotEmpty()
  requestId: string
}
