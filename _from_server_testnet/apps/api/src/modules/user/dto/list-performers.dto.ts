import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsNumber, Min, Max, IsOptional } from 'class-validator'

export class ListPerformersDto {
  @ApiProperty({
    description: 'Latitude of the center point',
    example: 40.7128,
    minimum: -90,
    maximum: 90,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number

  @ApiProperty({
    description: 'Longitude of the center point',
    example: -74.0060,
    minimum: -180,
    maximum: 180,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number

  @ApiProperty({
    description: 'Search radius in kilometers',
    example: 10,
    minimum: 0.1,
    maximum: 100,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  @Max(100)
  radiusKm: number

  @ApiPropertyOptional({
    description: 'Northern latitude boundary (optional)',
    example: 40.7128,
    minimum: -90,
    maximum: 90,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  @IsOptional()
  north?: number

  @ApiPropertyOptional({
    description: 'Southern latitude boundary (optional)',
    example: 40.7000,
    minimum: -90,
    maximum: 90,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  @IsOptional()
  south?: number

  @ApiPropertyOptional({
    description: 'Eastern longitude boundary (optional)',
    example: -74.0060,
    minimum: -180,
    maximum: 180,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  @IsOptional()
  east?: number

  @ApiPropertyOptional({
    description: 'Western longitude boundary (optional)',
    example: -74.0200,
    minimum: -180,
    maximum: 180,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  @IsOptional()
  west?: number
}