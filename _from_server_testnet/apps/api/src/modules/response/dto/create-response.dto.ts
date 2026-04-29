import { ApiProperty } from "@nestjs/swagger"
import { IsString } from "class-validator"

export class CreateResponseDto {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
  @IsString()
  requestId: string

  @ApiProperty({ example: "I can do this task for you" })
  @IsString()
  message: string
}