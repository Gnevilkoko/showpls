import { ApiPropertyOptional } from "@nestjs/swagger"
import { IsOptional, IsString } from "class-validator"

export class RespondToRequestDto {
  @ApiPropertyOptional({ example: "I can do this task for you" })
  @IsOptional()
  @IsString()
  message?: string
}