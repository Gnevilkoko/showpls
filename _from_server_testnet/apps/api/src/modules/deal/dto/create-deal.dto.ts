import { ApiProperty } from "@nestjs/swagger"
import { IsString, IsOptional, IsBoolean, IsEnum } from "class-validator"

export class CreateDealDto {
  @ApiProperty({ example: "777777" })
  @IsString()
  customerId: string

  @ApiProperty({ example: "888888" })
  @IsString()
  performerId: string

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
  @IsString()
  requestId: string

  @ApiProperty({ example: "660e8400-e29b-41d4-a716-446655440001" })
  @IsString()
  responseId: string

  @ApiProperty({ enum: ["locked", "released", "rejected"], example: "locked" })
  @IsEnum(["locked", "released", "rejected"])
  escrowStatus: "locked" | "released" | "rejected" | null

  @ApiProperty({ required: false, example: false })
  @IsOptional()
  @IsBoolean()
  arbitrationApproved?: boolean
}