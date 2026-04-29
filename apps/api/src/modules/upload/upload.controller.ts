import { Controller, Post, Get, Query, Res, BadRequestException, UploadedFile, UseInterceptors, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiBody, ApiSecurity, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { UploadService, UploadResult } from './upload.service';
import { Express, Response } from 'express';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RateLimit, IpRateLimit } from '../../common/rate-limit';
import ms from 'ms';
import { Readable } from 'node:stream';

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @ApiSecurity("jwt-auth")
  @UseGuards(AuthGuard)
  @IpRateLimit({ ttl: ms('1m'), limit: 10 }) // 10 requests per minute per IP
  @RateLimit({ ttl: ms('1m'), limit: 5 }) // 5 requests per minute per account
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

  @ApiOperation({ summary: 'Proxy-download a stored file (forces browser download on all platforms)' })
  @ApiQuery({ name: 'url', required: true, description: 'S3 file URL' })
  @IpRateLimit({ ttl: ms('1m'), limit: 60 })
  @Get('download')
  async downloadFile(@Query('url') url: string, @Res() res: Response): Promise<void> {
    const allowedPrefix = process.env.S3_PUBLIC_URL || process.env.S3_ENDPOINT
    if (!allowedPrefix || !url?.startsWith(allowedPrefix)) {
      throw new BadRequestException('URL not allowed')
    }

    const upstream = await fetch(url)
    if (!upstream.ok) {
      throw new BadRequestException('Failed to fetch file')
    }

    const contentType = upstream.headers.get('content-type') || 'application/octet-stream'
    const filename = url.split('/').pop()?.split('?')[0] || 'file'

    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Cache-Control', 'private, max-age=3600')

    const reader = upstream.body!.getReader()
    const nodeStream = new Readable({
      async read() {
        const { done, value } = await reader.read()
        this.push(done ? null : Buffer.from(value))
      },
    })
    nodeStream.pipe(res)
  }
}