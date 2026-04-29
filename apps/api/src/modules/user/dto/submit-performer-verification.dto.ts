import { ApiProperty } from "@nestjs/swagger"
import { Type } from "class-transformer"
import { IsIn, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from "class-validator"

const OS_VALUES = ["ios", "android", "web"] as const

export class SubmitPerformerVerificationDto {
  @ApiProperty({ example: 41.0082 })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number

  @ApiProperty({ example: 28.9784 })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  accuracyM?: number | null

  @ApiProperty({ enum: OS_VALUES })
  @IsString()
  @IsIn([...OS_VALUES])
  os: (typeof OS_VALUES)[number]

  @ApiProperty({ example: "17.2" })
  @IsString()
  @MinLength(0)
  @MaxLength(64)
  osVersion: string

  @ApiProperty({ example: "iPhone 13" })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  deviceModel: string

  @ApiProperty()
  @IsString()
  @MaxLength(2048)
  userAgent: string
}
