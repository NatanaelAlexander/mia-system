import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { isR2Configured, loadR2Config, R2Config } from './r2.config';
import { R2UploadInput, R2UploadResult } from './r2.types';

@Injectable()
export class R2StorageService implements OnModuleInit {
  private client: S3Client | null = null;
  private config: R2Config = loadR2Config();

  onModuleInit(): void {
    this.config = loadR2Config();

    if (!isR2Configured(this.config)) {
      return;
    }

    this.client = new S3Client({
      region: 'auto',
      endpoint: this.config.endpointUrl,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
    });
  }

  isConfigured(): boolean {
    return isR2Configured(this.config) && this.client !== null;
  }

  buildObjectKey(
    ownerType: string,
    ownerId: string,
    fileName: string,
  ): string {
    const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `${ownerType}/${ownerId}/${Date.now()}_${sanitized}`;
  }

  async upload(input: R2UploadInput): Promise<R2UploadResult> {
    this.ensureReady();

    const key = this.buildObjectKey(
      input.ownerType,
      input.ownerId,
      input.fileName,
    );

    await this.client!.send(
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: input.body,
        ContentType: input.mimeType,
      }),
    );

    return {
      key,
      mimeType: input.mimeType,
      fileSize: input.body.byteLength,
    };
  }

  async deleteByKey(key: string): Promise<void> {
    this.ensureReady();

    await this.client!.send(
      new DeleteObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      }),
    );
  }

  /**
   * URL temporal firmada para descarga. Solo la genera el backend tras validar permisos.
   * El bucket no es público.
   */
  async getSignedDownloadUrl(
    key: string,
    expiresInSeconds = 300,
  ): Promise<string> {
    this.ensureReady();

    return getSignedUrl(
      this.client!,
      new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      }),
      { expiresIn: expiresInSeconds },
    );
  }

  private ensureReady(): void {
    if (!this.isConfigured()) {
      throw new Error(
        'R2 no está configurado. Revisa R2_* en .env (ver .env.example).',
      );
    }
  }
}
