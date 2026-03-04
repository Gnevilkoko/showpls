import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, MaxLength } from 'class-validator'

export class UpdateProfileDto {
  @ApiPropertyOptional({ description: 'First name', example: 'John' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  firstName?: string

  @ApiPropertyOptional({ description: 'Last name', example: 'Doe' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  lastName?: string | null

  @ApiPropertyOptional({ description: 'Avatar URL', example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  avatar?: string | null

  @ApiPropertyOptional({ description: 'About text', example: 'Freelance photographer' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  about?: string | null

  @ApiPropertyOptional({ description: 'City', example: 'Istanbul' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  city?: string | null
}
