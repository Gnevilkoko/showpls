import { ApiProperty } from "@nestjs/swagger"
import { IsString } from "class-validator"

export class CreateResponseDto {
  @ApiProperty()
  @IsString()
  requestId: string
}