import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsNumber, Min, Max } from 'class-validator'

export class GetRequestsInBoundsDto {
  @ApiProperty({
    description: 'Northern latitude boundary',
    example: 40.7128,
    minimum: -90,
    maximum: 90,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  north: number

  @ApiProperty({
    description: 'Southern latitude boundary',
    example: 40.7000,
    minimum: -90,
    maximum: 90,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  south: number

  @ApiProperty({
    description: 'Eastern longitude boundary',
    example: -74.0060,
    minimum: -180,
    maximum: 180,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  east: number

  @ApiProperty({
    description: 'Western longitude boundary',
    example: -74.0200,
    minimum: -180,
    maximum: 180,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  west: number
}