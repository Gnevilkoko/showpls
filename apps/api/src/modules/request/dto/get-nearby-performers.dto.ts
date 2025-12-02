import { ApiPropertyOptional } from "@nestjs/swagger"
import { Type } from "class-transformer"
import { IsNumber, IsOptional, Min, Max } from "class-validator"

export class GetNearbyPerformersDto {
  @ApiPropertyOptional({
    type: Number,
    description: "Search radius in km",
    default: 5,
    minimum: 0.1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  @Max(100)
  radius?: number = 5

  @ApiPropertyOptional({
    type: Number,
    description: "Limit number of results",
    default: 50,
    minimum: 1,
    maximum: 200,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(200)
  limit?: number = 50
}