import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../common/database/database.service';
import { AssetsService } from '../assets/assets.service';
import {
  ArchivoEmpresaNoEncontradoException,
  CarpetaNoEncontradaException,
  CarpetaNombreDuplicadoException,
  EmpresaDriveNoEncontradaException,
  NombreCarpetaInvalidoException,
} from './exceptions/company-files.exceptions';
import {
  SQL_ASSETS_IN_FOLDERS,
  SQL_COMPANY_EXISTS,
  SQL_DELETE_FOLDER,
  SQL_DESCENDANT_FOLDER_IDS,
  SQL_FIND_COMPANY_ASSET,
  SQL_FIND_FOLDER_BY_ID,
  SQL_FOLDER_ANCESTORS,
  SQL_INSERT_FOLDER,
  SQL_LINK_ASSET,
  SQL_LIST_CHILD_FOLDERS,
  SQL_LIST_FOLDER_ASSETS,
  SQL_RENAME_FOLDER,
} from './queries/company-files.queries';
import {
  CompanyFolder,
  CompanyFolderAssetItem,
  CompanyFolderBreadcrumbItem,
  CompanyFolderContents,
} from './types/company-files.types';
import { AssetDownloadUrl } from '../assets/types/asset.types';

@Injectable()
export class CompanyFilesService {
  constructor(
    private readonly db: DatabaseService,
    private readonly assetsService: AssetsService,
  ) {}

  async listContents(
    companyId: string,
    folderId?: string | null,
  ): Promise<CompanyFolderContents> {
    await this.assertCompanyExists(companyId);

    const currentFolderId = folderId ?? null;
    if (currentFolderId) {
      const folder = await this.requireFolder(currentFolderId);
      if (folder.companyId !== companyId) {
        throw new CarpetaNoEncontradaException();
      }
    }

    const [{ rows: folders }, { rows: files }, breadcrumb] = await Promise.all([
      this.db.query<CompanyFolder>(SQL_LIST_CHILD_FOLDERS, [
        companyId,
        currentFolderId,
      ]),
      this.db.query<CompanyFolderAssetItem>(SQL_LIST_FOLDER_ASSETS, [
        companyId,
        currentFolderId,
      ]),
      this.buildBreadcrumb(currentFolderId),
    ]);

    return {
      companyId,
      folderId: currentFolderId,
      breadcrumb,
      folders,
      files,
    };
  }

  async createFolder(
    actorUserId: string,
    companyId: string,
    name: string,
    parentId?: string | null,
  ): Promise<CompanyFolder> {
    await this.assertCompanyExists(companyId);

    const trimmed = name.trim();
    if (!trimmed) {
      throw new NombreCarpetaInvalidoException();
    }

    const parent = parentId ?? null;
    if (parent) {
      const parentFolder = await this.requireFolder(parent);
      if (parentFolder.companyId !== companyId) {
        throw new CarpetaNoEncontradaException();
      }
    }

    try {
      const { rows } = await this.db.query<CompanyFolder>(SQL_INSERT_FOLDER, [
        companyId,
        parent,
        trimmed,
        actorUserId,
      ]);
      return rows[0];
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new CarpetaNombreDuplicadoException();
      }
      throw error;
    }
  }

  async renameFolder(folderId: string, name: string): Promise<CompanyFolder> {
    await this.requireFolder(folderId);

    const trimmed = name.trim();
    if (!trimmed) {
      throw new NombreCarpetaInvalidoException();
    }

    try {
      const { rows } = await this.db.query<CompanyFolder>(SQL_RENAME_FOLDER, [
        folderId,
        trimmed,
      ]);
      return rows[0];
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new CarpetaNombreDuplicadoException();
      }
      throw error;
    }
  }

  async deleteFolderCascade(folderId: string): Promise<void> {
    const folder = await this.requireFolder(folderId);

    const { rows: descendants } = await this.db.query<{ id: string }>(
      SQL_DESCENDANT_FOLDER_IDS,
      [folderId],
    );
    const folderIds = descendants.map((row) => row.id);

    const { rows: linked } = await this.db.query<{ assetId: string }>(
      SQL_ASSETS_IN_FOLDERS,
      [folder.companyId, folderIds],
    );

    for (const row of linked) {
      await this.assetsService.delete(row.assetId);
    }

    await this.db.query(SQL_DELETE_FOLDER, [folderId]);
  }

  async uploadFile(
    actorUserId: string,
    companyId: string,
    file: Express.Multer.File,
    folderId?: string | null,
    displayName?: string,
  ): Promise<CompanyFolderAssetItem> {
    await this.assertCompanyExists(companyId);

    const targetFolderId = folderId ?? null;
    if (targetFolderId) {
      const folder = await this.requireFolder(targetFolderId);
      if (folder.companyId !== companyId) {
        throw new CarpetaNoEncontradaException();
      }
    }

    const ownerSegment = targetFolderId ?? 'root';
    const asset = await this.assetsService.uploadFile({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      ownerType: 'companies',
      ownerId: `${companyId}/${ownerSegment}`,
      uploadedById: actorUserId,
      displayFileName: displayName?.trim() || undefined,
    });

    await this.db.query(SQL_LINK_ASSET, [
      companyId,
      targetFolderId,
      asset.id,
    ]);

    return {
      id: asset.id,
      fileName: asset.fileName,
      mimeType: asset.mimeType,
      fileSize: asset.fileSize,
      uploadedById: asset.uploadedById,
      createdAt: asset.createdAt,
      folderId: targetFolderId,
    };
  }

  async getDownloadUrl(assetId: string): Promise<AssetDownloadUrl> {
    await this.requireCompanyAsset(assetId);
    return this.assetsService.getDownloadUrl(assetId);
  }

  async deleteFile(assetId: string): Promise<void> {
    await this.requireCompanyAsset(assetId);
    await this.assetsService.delete(assetId);
  }

  private async assertCompanyExists(companyId: string): Promise<void> {
    const { rows } = await this.db.query<{ id: string }>(SQL_COMPANY_EXISTS, [
      companyId,
    ]);
    if (!rows[0]) {
      throw new EmpresaDriveNoEncontradaException();
    }
  }

  private async requireFolder(folderId: string): Promise<CompanyFolder> {
    const { rows } = await this.db.query<CompanyFolder>(SQL_FIND_FOLDER_BY_ID, [
      folderId,
    ]);
    if (!rows[0]) {
      throw new CarpetaNoEncontradaException();
    }
    return rows[0];
  }

  private async requireCompanyAsset(assetId: string): Promise<void> {
    const { rows } = await this.db.query(SQL_FIND_COMPANY_ASSET, [assetId]);
    if (!rows[0]) {
      throw new ArchivoEmpresaNoEncontradoException();
    }
  }

  private async buildBreadcrumb(
    folderId: string | null,
  ): Promise<CompanyFolderBreadcrumbItem[]> {
    if (!folderId) {
      return [];
    }

    const { rows } = await this.db.query<CompanyFolderBreadcrumbItem & { depth: number }>(
      SQL_FOLDER_ANCESTORS,
      [folderId],
    );

    return rows.map((row) => ({ id: row.id, name: row.name }));
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === '23505'
    );
  }
}
