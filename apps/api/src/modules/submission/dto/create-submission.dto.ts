import { ApiProperty } from "@nestjs/swagger"
import { IsArray, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID } from "class-validator"

export class CreateSubmissionDto {
  @ApiProperty({ example: "uuid-of-request" })
  @IsUUID()
  @IsNotEmpty()
  requestId: string

  @ApiProperty({ example: ["https://example.com/proof1.jpg", "https://example.com/proof2.jpg"] })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  attachments: string[]

  @ApiProperty({ example: { clientGeo: { lat: 40.7128, lng: -74.0060 } }, required: false })
  @IsObject()
  @IsOptional()
  proofMeta?: Record<string, any>
}