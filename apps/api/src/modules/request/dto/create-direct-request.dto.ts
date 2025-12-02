import { ApiProperty } from "@nestjs/swagger"
import { IsString, IsUUID } from "class-validator"
import { CreateRequestDto } from "./create-request.dto"

export class CreateDirectRequestDto extends CreateRequestDto {
  @ApiProperty({ 
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "UUID of the performer to send the task to"
  })
  @IsString()
  @IsUUID()
  performerId: string
}