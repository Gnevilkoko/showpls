import { ApiPropertyOptional } from "@nestjs/swagger"
import { IsEnum, IsIn, IsNumber, IsOptional, IsString, Min, Max } from "class-validator"
import { RequestStatus } from "@share/request-status.enum"
import { Type } from "class-transformer"

export class ListRequestsDto {
  @ApiPropertyOptional({
    enum: RequestStatus,
    description: "Filter by request status"
  })
  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus

  @ApiPropertyOptional({
    enum: ["customer", "performer", "both"],
    description: "Filter by user tasks"
  })
  @IsOptional()
  @IsIn(["customer", "performer", "both"])
  myTasks?: "customer" | "performer" | "both"

  @ApiPropertyOptional({
    type: Number,
    description: "Bounding box north latitude"
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  north?: number

  @ApiPropertyOptional({
    type: Number,
    description: "Bounding box south latitude"
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  south?: number

  @ApiPropertyOptional({
    type: Number,
    description: "Bounding box east longitude"
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  east?: number

  @ApiPropertyOptional({
    type: Number,
    description: "Bounding box west longitude"
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  west?: number

  @ApiPropertyOptional({
    type: Number,
    description: "Search radius in km"
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  radius?: number

  @ApiPropertyOptional({
    type: Number,
    description: "Center latitude for radius search"
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number

  @ApiPropertyOptional({
    type: Number,
    description: "Center longitude for radius search"
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number

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

  @ApiPropertyOptional({
    enum: ["createdAt", "price", "distance"],
    description: "Sort by field",
    default: "createdAt"
  })
  @IsOptional()
  @IsIn(["createdAt", "price", "distance"])
  sortBy?: "createdAt" | "price" | "distance"

  @ApiPropertyOptional({
    enum: ["asc", "desc"],
    description: "Sort order",
    default: "desc"
  })
  @IsOptional()
  @IsIn(["asc", "desc"])
  sortOrder?: "asc" | "desc" = "desc"
}