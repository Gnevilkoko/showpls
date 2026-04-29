import {
  IsString,
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsObject,
  IsArray,
  ValidateNested,
  Min,
  Max,
  MaxLength,
} from "class-validator"
import { Type } from "class-transformer"
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { SpecialSection } from "@share"

class LocalizedTextDto {
  @ApiProperty({ example: "Заголовок" })
  @IsString()
  @MaxLength(500)
  ru: string

  @ApiProperty({ example: "Title" })
  @IsString()
  @MaxLength(500)
  en: string
}

export class CreateSpecialDto {
  @ApiProperty({ enum: SpecialSection })
  @IsEnum(SpecialSection)
  section: SpecialSection

  @ApiProperty({ type: LocalizedTextDto })
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  title: LocalizedTextDto

  @ApiProperty({ type: LocalizedTextDto })
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  description: LocalizedTextDto

  @ApiPropertyOptional({ type: [LocalizedTextDto], default: [] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LocalizedTextDto)
  steps?: LocalizedTextDto[]

  @ApiProperty({ example: "Nike" })
  @IsString()
  @MaxLength(120)
  partnerName: string

  @ApiProperty({ example: "N" })
  @IsString()
  @MaxLength(12)
  partnerShort: string

  @ApiProperty({ example: "#111111" })
  @IsString()
  @MaxLength(32)
  partnerColor: string

  @ApiPropertyOptional({ type: LocalizedTextDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  badge?: LocalizedTextDto | null

  @ApiProperty({ enum: ["findTask", "createTask", "wallet", "profile"] })
  @IsIn(["findTask", "createTask", "wallet", "profile"])
  actionType: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  actionPayload?: Record<string, unknown> | null

  @ApiProperty({ type: LocalizedTextDto })
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  actionLabel: LocalizedTextDto

  @ApiProperty({ example: 50 })
  @IsNumber()
  @Min(0)
  rewardAmount: number

  @ApiPropertyOptional({ description: "Currency ID (bigint). If omitted, STARS is used." })
  @IsOptional()
  @IsString()
  rewardCurrencyId?: string

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean

  @ApiPropertyOptional({ example: "2025-01-01T00:00:00.000Z" })
  @IsOptional()
  @IsString()
  startsAt?: string | null

  @ApiPropertyOptional({ example: "2025-12-31T23:59:59.000Z" })
  @IsOptional()
  @IsString()
  endsAt?: string | null

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  claimLimitPerUser?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown> | null
}
