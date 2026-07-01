import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../common/database/database.service';
import { R2StorageService } from '../common/storage/r2-storage.service';
import {
  ArchivoDemasiadoGrandeException,
  ArchivoRequeridoException,
  AssetNoEncontradoException,
  R2NoConfiguradoException,
  TipoArchivoNoPermitidoException,
} from './exceptions/assets.exceptions';
import {
  SQL_DELETE_ASSET,
  SQL_FIND_ALL_ASSETS,
  SQL_FIND_ASSET_BY_ID,
  SQL_INSERT_ASSET,
} from './queries/assets.queries';
import { Asset, AssetDownloadUrl } from './types/asset.types';
import { assertValidUpload } from '../common/utils/upload-validation.util';

const DOWNLOAD_URL_TTL_SECONDS = 300;

export interface UploadAssetFileInput {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  ownerType: string;
  ownerId: string;
  uploadedById?: string | null;
  displayFileName?: string;
}

@Injectable()
export class AssetsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly r2Storage: R2StorageService,
  ) {}

  async findAll(): Promise<Asset[]> {
    const { rows } = await this.db.query<Asset>(SQL_FIND_ALL_ASSETS);
    return rows;
  }

  async findById(id: string): Promise<Asset> {
    const { rows } = await this.db.query<Asset>(SQL_FIND_ASSET_BY_ID, [id]);

    if (!rows[0]) {
      throw new AssetNoEncontradoException();
    }

    return rows[0];
  }

  async uploadFile(input: UploadAssetFileInput): Promise<Asset> {
    if (!input.buffer?.length) {
      throw new ArchivoRequeridoException();
    }

    try {
      assertValidUpload({
        originalName: input.originalName,
        mimeType: input.mimeType,
        size: input.buffer.length,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'ARCHIVO_DEMASIADO_GRANDE') {
          throw new ArchivoDemasiadoGrandeException();
        }
        if (error.message === 'TIPO_ARCHIVO_NO_PERMITIDO') {
          throw new TipoArchivoNoPermitidoException();
        }
      }
      throw new ArchivoRequeridoException();
    }

    if (!this.r2Storage.isConfigured()) {
      throw new R2NoConfiguradoException();
    }

    const uploaded = await this.r2Storage.upload({
      ownerType: input.ownerType,
      ownerId: input.ownerId,
      fileName: input.originalName,
      mimeType: input.mimeType || 'application/octet-stream',
      body: input.buffer,
    });

    const { rows } = await this.db.query<Asset>(SQL_INSERT_ASSET, [
      input.displayFileName?.trim() || input.originalName,
      uploaded.key,
      uploaded.mimeType,
      uploaded.fileSize,
      input.uploadedById ?? null,
    ]);

    return rows[0];
  }

  async uploadStandaloneFile(
    file: Express.Multer.File,
    uploadedById?: string | null,
  ): Promise<Asset> {
    return this.uploadFile({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      ownerType: 'assets',
      ownerId: randomUUID(),
      uploadedById,
    });
  }

  async getDownloadUrl(id: string): Promise<AssetDownloadUrl> {
    const asset = await this.findById(id);

    if (!this.r2Storage.isConfigured()) {
      throw new R2NoConfiguradoException();
    }

    const url = await this.r2Storage.getSignedDownloadUrl(
      asset.filePath,
      DOWNLOAD_URL_TTL_SECONDS,
    );

    return { url, expiresInSeconds: DOWNLOAD_URL_TTL_SECONDS };
  }

  async delete(id: string): Promise<void> {
    const asset = await this.findById(id);

    if (this.r2Storage.isConfigured()) {
      await this.r2Storage.deleteByKey(asset.filePath);
    }

    await this.db.query(SQL_DELETE_ASSET, [id]);
  }
}
