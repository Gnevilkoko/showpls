import { Injectable } from '@nestjs/common';
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
      forcePathStyle: true, // Required for S3-compatible services like Beget Cloud
    });
  }

  async uploadFile(file: Buffer): Promise<UploadResult> {
    // Calculate SHA256 hash BEFORE uploading
    const hash = createHash('sha256').update(file).digest('hex');

    // Get file type information
    const fileTypeResult = await fromBuffer(file);
    if (!fileTypeResult) {
      throw new Error('Unable to determine file type');
    }

    const { mime: mimeType, ext } = fileTypeResult;

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

    await upload.done();

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