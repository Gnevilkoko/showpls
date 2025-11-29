import { ApiProperty } from "@nestjs/swagger"
import { IsString } from "class-validator"

export class CreateDealDto {
  @ApiProperty()
  @IsString()
  requestId: string

  @ApiProperty()
  @IsString()
  responseId: string
}