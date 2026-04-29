import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsNumber, Min, Max } from 'class-validator'

export class UpdateLocationDto {
  @ApiProperty({
    description: 'Latitude',
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
    description: 'Longitude',
    example: -74.0060,
    minimum: -180,
    maximum: 180,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number
}