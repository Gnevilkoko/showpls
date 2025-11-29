import { ApiProperty } from "@nestjs/swagger"
import { IsDateString, IsNumber, IsObject, IsString, ValidateNested } from "class-validator"
import { Type } from "class-transformer"

class LocationDto {
  @ApiProperty({ example: 55.75 })
  @IsNumber()
  lat: number

  @ApiProperty({ example: 37.61 })
  @IsNumber()
  lng: number

  @ApiProperty({ example: "Moscow" })
  @IsString()
  address: string
}

export class CreateRequestDto {
  @ApiProperty({ example: "Тестовая задача" })
  @IsString()
  title: string

  @ApiProperty({ example: "Сделать фото" })
  @IsString()
  description: string

  @ApiProperty({ type: LocationDto, example: { lat: 55.75, lng: 37.61, address: "Moscow" } })
  @IsObject()
  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto

  @ApiProperty({ example: "500" })
  @IsString()
  price: string

  @ApiProperty({ example: "RUB" })
  @IsString()
  currencyId: string

  @ApiProperty({ example: "2025-12-31T00:00:00.000Z" })
  @IsDateString()
  expiresAt: string
}