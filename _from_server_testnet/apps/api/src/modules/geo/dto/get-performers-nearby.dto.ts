import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsNumber, Min, Max } from 'class-validator'

export class GetPerformersNearbyDto {
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
  lat: number

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
  lng: number

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
}