import { ApiPropertyOptional } from "@nestjs/swagger"
import { IsOptional, IsString } from "class-validator"

export class AcceptResponseDto {
  @ApiPropertyOptional({ example: "Let's start working!" })
  @IsOptional()
  @IsString()
  message?: string
}