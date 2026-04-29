import { IsString, IsOptional, IsEnum } from "class-validator"
import { ApiProperty } from "@nestjs/swagger"

export class ResolveArbitrationDto {
  @ApiProperty({
    description: "Action to take on the arbitration",
    enum: ["approve_cancel", "complete", "reject"],
    example: "complete"
  })
  @IsEnum(["approve_cancel", "complete", "reject"])
  action: "approve_cancel" | "complete" | "reject"

  @ApiProperty({
    description: "Optional admin comment on the resolution",
    example: "Task was completed as agreed, releasing funds to performer",
    required: false
  })
  @IsOptional()
  @IsString()
  message?: string
}