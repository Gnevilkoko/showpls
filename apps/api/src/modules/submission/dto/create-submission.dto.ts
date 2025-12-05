import { ApiProperty } from "@nestjs/swagger"
import { IsArray, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID } from "class-validator"

export class CreateSubmissionDto {
  @ApiProperty({ example: "uuid-of-request" })
  @IsUUID()
  @IsNotEmpty()
  requestId: string

  @ApiProperty({ example: ["https://s3.ru1.storage.beget.cloud/c0ca6843f56c-public/61b0e63f-0dc0-4b97-8f54-05d2694eb8d9.jpg"] })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  attachments: string[]

  @ApiProperty({ example: { clientGeo: { lat: 40.7128, lng: -74.0060 } }, required: false })
  @IsObject()
  @IsOptional()
  proofMeta?: Record<string, any>
}