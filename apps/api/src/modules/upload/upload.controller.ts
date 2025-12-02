import { Controller, Post, UploadedFile, UseInterceptors, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiBody, ApiSecurity } from '@nestjs/swagger';
import { UploadService, UploadResult } from './upload.service';
import { Express } from 'express';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RateLimit, IpRateLimit } from '../../common/rate-limit';

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @ApiSecurity("jwt-auth")
  @UseGuards(AuthGuard)
  @IpRateLimit({ ttl: 60, limit: 10 }) // 10 requests per minute per IP
  @RateLimit({ ttl: 60, limit: 5 }) // 5 requests per minute per account
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB - maximum allowed size for videos
      },
    })
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadFile(@UploadedFile() file: Express.Multer.File): Promise<UploadResult> {
    return this.uploadService.uploadFile(file.buffer);
  }
}