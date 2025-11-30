import { ApiPropertyOptional } from "@nestjs/swagger"
import { IsBoolean, IsDateString, IsNumber, IsObject, IsOptional, IsString, MinLength, Min, IsArray, ArrayMaxSize, MaxLength, ValidateIf, registerDecorator, ValidationOptions, ValidationArguments } from "class-validator"

function IsValidDeadlineAt(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidDeadlineAt',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!value) return true; // Optional field

          const obj = args.object as any;
          if (!obj.isUrgent) return true; // Only validate for urgent tasks

          // Parse ISO timestamp
          const date = new Date(value);
          if (isNaN(date.getTime())) return false;

          const hours = date.getUTCHours();
          const minutes = date.getUTCMinutes();

          // Hours: 0-24 inclusive
          if (hours < 0 || hours > 24) return false;

          // Minutes: 0, 10, 20, 30, 40, 50
          const validMinutes = [0, 10, 20, 30, 40, 50];
          if (!validMinutes.includes(minutes)) return false;

          return true;
        },
        defaultMessage(args: ValidationArguments) {
          return 'deadlineAt must be a valid ISO timestamp with hours 0-24 and minutes in steps of 10 (0, 10, 20, 30, 40, 50) for urgent tasks';
        },
      },
    });
  };
}

export class UpdateRequestDto {
  @ApiPropertyOptional({ example: "Тестовая задача", minLength: 3, maxLength: 255 })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: "Title must be at least 3 characters long" })
  @MaxLength(255, { message: "Title must not exceed 255 characters" })
  title?: string

  @ApiPropertyOptional({ example: "Сделать фото в центре города", minLength: 10, maxLength: 5000 })
  @IsOptional()
  @IsString()
  @MinLength(10, { message: "Description must be at least 10 characters long" })
  @MaxLength(5000, { message: "Description must not exceed 5000 characters" })
  description?: string

  @ApiPropertyOptional({ example: 500, minimum: 1 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 0 }, { message: "Price must be an integer" })
  @Min(1, { message: "Price must be greater than 0" })
  price?: number

  @ApiPropertyOptional({ example: 55.75, minimum: -90, maximum: 90 })
  @IsOptional()
  @IsNumber()
  @Min(-90, { message: "Latitude must be between -90 and 90" })
  latitude?: number

  @ApiPropertyOptional({ example: 37.61, minimum: -180, maximum: 180 })
  @IsOptional()
  @IsNumber()
  @Min(-180, { message: "Longitude must be between -180 and 180" })
  longitude?: number

  @ApiPropertyOptional({ example: "2025-12-31T23:59:59.000Z" })
  @IsOptional()
  @IsDateString()
  expiresAt?: string | null

  @ApiPropertyOptional({ example: "2025-12-31T12:30:00.000Z" })
  @IsOptional()
  @IsDateString()
  @IsValidDeadlineAt()
  deadlineAt?: string | null

  @ApiPropertyOptional({
    example: ["https://example.com/file1.jpg", "https://example.com/file2.jpg"],
    type: [String],
    isArray: true
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10, { message: "Maximum 10 attachments allowed" })
  attachments?: string[]

  @ApiPropertyOptional({
    example: { tags: ["photo", "urgent"] }
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isUrgent?: boolean

  @ApiPropertyOptional({ example: "Moscow, Red Square", maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: "Address must not exceed 500 characters" })
  address?: string
}