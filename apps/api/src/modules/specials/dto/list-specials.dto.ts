import { Type } from "class-transformer"
import { IsEnum, IsNumber, IsOptional, Max, Min } from "class-validator"
import { ApiPropertyOptional } from "@nestjs/swagger"
import { SpecialSection } from "@share"

export class ListSpecialsDto {
  @ApiPropertyOptional({
    enum: SpecialSection,
    description: "Filter specials by section",
  })
  @IsOptional()
  @IsEnum(SpecialSection)
  section?: SpecialSection

  @ApiPropertyOptional({
    type: Number,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20

  @ApiPropertyOptional({
    type: Number,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset?: number = 0
}
