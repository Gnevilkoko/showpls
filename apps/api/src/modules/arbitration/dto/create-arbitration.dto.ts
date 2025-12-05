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
    example: ["https://s3.ru1.storage.beget.cloud/c0ca6843f56c-public/61b0e63f-0dc0-4b97-8f54-05d2694eb8d9.jpg"],
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[]
}