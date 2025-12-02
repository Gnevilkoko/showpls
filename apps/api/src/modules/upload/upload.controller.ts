import { Controller, Post, UploadedFile, UseInterceptors, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiBody, ApiSecurity } from '@nestjs/swagger';
import { UploadService, UploadResult } from './upload.service';
import { Express } from 'express';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RateLimit } from '../../common/rate-limit/rate-limit.decorator';

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @ApiSecurity("jwt-auth")
  @UseGuards(AuthGuard)
  @RateLimit({ ttl: 60, limit: 5 })
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