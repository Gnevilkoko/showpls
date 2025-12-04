import { IsOptional, IsEnum, IsInt, Min } from "class-validator"
import { Type } from "class-transformer"
import { ApiProperty } from "@nestjs/swagger"

export class ListArbitrationsDto {
  @ApiProperty({
    description: "Filter by arbitration status",
    enum: ["pending", "resolved"],
    required: false
  })
  @IsOptional()
  @IsEnum(["pending", "resolved"])
  status?: "pending" | "resolved"

  @ApiProperty({
    description: "Maximum number of items to return",
    example: 20,
    required: false,
    default: 20
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number

  @ApiProperty({
    description: "Number of items to skip",
    example: 0,
    required: false,
    default: 0
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number
}