import { ApiProperty } from "@nestjs/swagger"
import { IsBoolean, IsOptional, IsString } from "class-validator"
import { PaginationDto } from "../../../common/dto/pagination.dto"
import { Transform } from "class-transformer"

export class ChatListDto extends PaginationDto {
  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  isFavorite?: boolean

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  search?: string
}