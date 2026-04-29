import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { createHash } from 'crypto';
import { randomUUID } from 'crypto';
import { fromBuffer } from 'file-type';

export interface UploadResult {
  url: string;
  hash: string;
  filename: string;
  mimeType: string;
  size: number;
}

// Allowed file types and size limits (incl. image/heic for iPhone)
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
];

const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime', // .mov
  'video/x-msvideo', // .avi
];

const MAX_IMAGE_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

@Injectable()
export class UploadService {
  private s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.S3_REGION || 'ru-central1',
      endpoint: process.env.S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true,
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });
  }

  async uploadFile(file: Buffer): Promise<UploadResult> {
    if (
      !process.env.S3_ENDPOINT ||
      !process.env.S3_BUCKET_NAME ||
      !process.env.S3_ACCESS_KEY_ID ||
      !process.env.S3_SECRET_ACCESS_KEY
    ) {
      throw new InternalServerErrorException('S3 is not configured');
    }

    // Get file type information
    const fileTypeResult = await fromBuffer(file);
    if (!fileTypeResult) {
      throw new BadRequestException('Unable to determine file type');
    }

    const { mime: mimeType, ext } = fileTypeResult;

    // Validate file type
    const isImage = ALLOWED_IMAGE_TYPES.includes(mimeType);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(mimeType);

    if (!isImage && !isVideo) {
      throw new BadRequestException(
        `Invalid file type: ${mimeType}. Allowed types: ${[...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES].join(', ')}`
      );
    }

    // Validate file size
    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
    if (file.length > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      const fileSizeMB = (file.length / (1024 * 1024)).toFixed(2);
      throw new BadRequestException(
        `File size (${fileSizeMB}MB) exceeds limit of ${maxSizeMB}MB for ${isImage ? 'images' : 'videos'}`
      );
    }

    // Calculate SHA256 hash BEFORE uploading
    const hash = createHash('sha256').update(file).digest('hex');

    // Generate unique filename
    const filename = `${randomUUID()}.${ext}`;

    // Upload to S3 using Upload from lib-storage for better multipart handling
    const upload = new Upload({
      client: this.s3Client,
      params: {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: filename,
        Body: file,
        ContentType: mimeType,
        // Add metadata if needed
        Metadata: {
          originalHash: hash,
        },
      },
    });

    try {
      await upload.done();
    } catch (err: unknown) {
      const e = err && typeof err === 'object' ? (err as Record<string, unknown>) : null;
      const msg = err instanceof Error ? err.message : String(err);
      const denied =
        e?.name === 'AccessDenied' ||
        e?.Code === 'AccessDenied' ||
        (typeof msg === 'string' && (msg.includes('Access Denied') || msg.includes('AccessDenied')));
      if (denied) {
        throw new InternalServerErrorException(
          'S3 AccessDenied: use current bucket keys from Beget (same bucket as S3_BUCKET_NAME).',
        );
      }
      throw err;
    }

    // Construct the public URL
    const url = `${process.env.S3_PUBLIC_URL || process.env.S3_ENDPOINT}/${process.env.S3_BUCKET_NAME}/${filename}`;

    return {
      url,
      hash,
      filename,
      mimeType,
      size: file.length,
    };
  }
}