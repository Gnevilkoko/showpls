import { IsString, IsArray, IsOptional, IsUUID } from "class-validator"
import { ApiProperty } from "@nestjs/swagger"

export class CreateArbitrationDto {
  @ApiProperty({
    description: "Request ID for which arbitration is created",
    example: "550e8400-e29b-41d4-a716-446655440000"
  })
  @IsUUID()
  requestId: string

  @ApiProperty({
    description: "Reason for arbitration",
    example: "The task was not completed as agreed"
  })
  @IsString()
  reason: string

  @ApiProperty({
    description: "Optional attachment URLs as proof",
    example: ["https://example.com/proof1.jpg"],
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[]
}