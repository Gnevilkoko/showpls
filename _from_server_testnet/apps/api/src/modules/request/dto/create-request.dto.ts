import { ApiProperty } from "@nestjs/swagger"
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

export class CreateRequestDto {
  @ApiProperty({ example: "Тестовая задача", minLength: 3, maxLength: 255 })
  @IsString()
  @MinLength(3, { message: "Title must be at least 3 characters long" })
  @MaxLength(255, { message: "Title must not exceed 255 characters" })
  title: string

  @ApiProperty({ example: "Сделать фото в центре города", minLength: 10, maxLength: 5000 })
  @IsString()
  @MinLength(10, { message: "Description must be at least 10 characters long" })
  @MaxLength(5000, { message: "Description must not exceed 5000 characters" })
  description: string

  @ApiProperty({ example: 500, minimum: 1 })
  @IsNumber({ maxDecimalPlaces: 0 }, { message: "Price must be an integer" })
  @Min(1, { message: "Price must be greater than 0" })
  price: number

  @ApiProperty({ example: 55.75, minimum: -90, maximum: 90 })
  @IsNumber()
  @Min(-90, { message: "Latitude must be between -90 and 90" })
  @ValidateIf((o) => o.latitude !== undefined)
  latitude: number

  @ApiProperty({ example: 37.61, minimum: -180, maximum: 180 })
  @IsNumber()
  @Min(-180, { message: "Longitude must be between -180 and 180" })
  @ValidateIf((o) => o.longitude !== undefined)
  longitude: number

  @ApiProperty({ example: "2025-12-31T23:59:59.000Z", required: false })
  @IsOptional()
  @IsDateString()
  expiresAt?: string | null

  @ApiProperty({ example: "2025-12-31T12:30:00.000Z", required: false })
  @IsOptional()
  @IsDateString()
  @IsValidDeadlineAt()
  deadlineAt?: string | null

  @ApiProperty({
    example: ["https://s3.ru1.storage.beget.cloud/c0ca6843f56c-public/61b0e63f-0dc0-4b97-8f54-05d2694eb8d9.jpg"],
    required: false,
    type: [String],
    isArray: true
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10, { message: "Maximum 10 attachments allowed" })
  attachments?: string[]

  @ApiProperty({
    example: { tags: ["photo", "urgent"] },
    required: false
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isUrgent?: boolean

  @ApiProperty({ example: "Moscow, Red Square", required: false, maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: "Address must not exceed 500 characters" })
  address?: string
}