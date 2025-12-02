import { ApiProperty } from "@nestjs/swagger"
import { IsArray, IsEnum, IsOptional, IsString } from "class-validator"

export class SendMessageDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  text?: string

  @ApiProperty({ required: false, type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attachments?: string[]

  @ApiProperty({ enum: ["message", "notification"], default: "message" })
  @IsEnum(["message", "notification"])
  @IsOptional()
  type?: "message" | "notification" = "message"

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  variant?: string
}