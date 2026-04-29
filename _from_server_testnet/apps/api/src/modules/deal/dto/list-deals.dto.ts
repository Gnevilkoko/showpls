import { ApiPropertyOptional } from "@nestjs/swagger"
import { IsEnum, IsIn, IsNumber, IsOptional, Min, Max } from "class-validator"
import { DealStatus } from "@share/deal-status.enum"
import { Type } from "class-transformer"

export class ListDealsDto {
  @ApiPropertyOptional({
    enum: DealStatus,
    description: "Filter by deal status"
  })
  @IsOptional()
  @IsEnum(DealStatus)
  status?: DealStatus

  @ApiPropertyOptional({
    enum: ["customer", "performer"],
    description: "Filter by user role in deal",
    default: "both"
  })
  @IsOptional()
  @IsIn(["customer", "performer"])
  myRole?: "customer" | "performer"

  @ApiPropertyOptional({
    type: Number,
    description: "Limit number of results",
    default: 20
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20

  @ApiPropertyOptional({
    type: Number,
    description: "Offset for pagination",
    default: 0
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset?: number = 0
}