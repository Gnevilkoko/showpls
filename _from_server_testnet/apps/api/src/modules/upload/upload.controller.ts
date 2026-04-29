import {
  Controller,
  Post,
  Get,
  Query,
  Res,
  BadRequestException,
  ForbiddenException,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
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

  /** Прокси картинок для canvas-маркеров карты: внешние CDN без CORS иначе не рисуются. Без JWT — <img> не шлёт Authorization. */
  static isAllowedMapImageUrl(target: string): boolean {
    let u: URL
    try {
      u = new URL(target)
    } catch {
      return false
    }
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return false
    const host = u.hostname.toLowerCase()
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return false
    if (host === '0.0.0.0' || host.endsWith('.localhost')) return false
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
      if (host.startsWith('10.') || host.startsWith('127.') || host.startsWith('169.254.')) return false
      if (host.startsWith('192.168.')) return false
      const oct = host.split('.').map(Number)
      if (oct[0] === 172 && oct[1] >= 16 && oct[1] <= 31) return false
    }
    const s3Base = (process.env.S3_PUBLIC_URL || process.env.S3_ENDPOINT || '').replace(/\/$/, '')
    if (s3Base && target.startsWith(s3Base)) return true
    if (host.endsWith('.telegram.org') || host === 'telegram.org') return true
    if (host.endsWith('telegram-cdn.org') || host.includes('cdn.telegram.org')) return true
    if (host === 't.me' && u.pathname.startsWith('/i/userpic')) return true
    return false
  }

  @ApiOperation({ summary: 'Proxy avatar URL for map canvas (allowlist: S3, Telegram CDNs)' })
  @ApiQuery({ name: 'u', required: true, description: 'Absolute image URL (encoded)' })
  @IpRateLimit({ ttl: ms('1m'), limit: 120 })
  @Get('map-image')
  async mapImage(@Query('u') u: string, @Res() res: Response): Promise<void> {
    if (!u?.trim()) {
      throw new BadRequestException('Missing u')
    }
    let target: string
    try {
      target = decodeURIComponent(u.trim())
    } catch {
      throw new BadRequestException('Invalid u')
    }
    if (!UploadController.isAllowedMapImageUrl(target)) {
      throw new ForbiddenException('URL not allowed')
    }

    const upstream = await fetch(target, {
      signal: AbortSignal.timeout(12_000),
      headers: { 'User-Agent': 'ShowplsMapImageProxy/1.0' },
    })
    if (!upstream.ok) {
      throw new BadRequestException('Upstream failed')
    }

    const buf = Buffer.from(await upstream.arrayBuffer())
    if (buf.length > 2 * 1024 * 1024) {
      throw new BadRequestException('Too large')
    }

    const rawCt = upstream.headers.get('content-type') || ''
    const contentType = rawCt.startsWith('image/') ? rawCt : 'image/jpeg'
    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=3600')
    res.send(buf)
  }

  @ApiSecurity("jwt-auth")
  @UseGuards(AuthGuard)
  /** Several photos in one task + retries easily hit 5/min; keep sane ceiling against abuse. */
  @IpRateLimit({ ttl: ms('1m'), limit: 120 })
  @RateLimit({ ttl: ms('1m'), limit: 40 })
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