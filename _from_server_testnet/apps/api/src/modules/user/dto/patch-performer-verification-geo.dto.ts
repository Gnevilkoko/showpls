import { ApiProperty } from "@nestjs/swagger"
import { Type } from "class-transformer"
import { IsNumber, IsOptional, Max, Min } from "class-validator"

/** Обновить только координаты верифицированного исполнителя (карта + снимок verification). */
export class PatchPerformerVerificationGeoDto {
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
}
