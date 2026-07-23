import {
  Body,
  Controller,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import {
  AuthorizeResource,
  AuthorizeSurface,
} from '../auth/decorators/authorize.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Permission } from '../auth/permissions/permission.constants';
import { CompanyFilesService } from './company-files.service';
import {
  CreateCompanyFolderDto,
  DeleteCompanyFileDto,
  DeleteCompanyFolderDto,
  DownloadCompanyFileDto,
  ListCompanyFolderContentsDto,
  RenameCompanyFolderDto,
  UploadCompanyFileDto,
} from './dto/company-files.dto';
import {
  CompanyFileDownloadResponseDto,
  CompanyFileResponseDto,
  CompanyFolderContentsResponseDto,
  CompanyFolderResponseDto,
} from './dto/responses/company-files-response.dto';

@ApiBearerAuth('access-token')
@AuthorizeSurface('internal')
@AuthorizeResource('company_files')
@ApiTags('Company files — Internal')
@Controller('internal/company-files')
export class InternalCompanyFilesController {
  constructor(private readonly companyFilesService: CompanyFilesService) {}

  @Post('contenido')
  @RequirePermissions(Permission.CompanyFilesRead)
  @ApiOperation({ summary: 'Listar carpetas y archivos de una ubicación' })
  @ApiBody({ type: ListCompanyFolderContentsDto })
  @ApiOkResponse({ type: CompanyFolderContentsResponseDto })
  listContents(@Body() dto: ListCompanyFolderContentsDto) {
    return this.companyFilesService.listContents(dto.companyId, dto.folderId);
  }

  @Post('carpetas')
  @RequirePermissions(Permission.CompanyFilesCreate)
  @ApiOperation({ summary: 'Crear carpeta en el drive de la empresa' })
  @ApiBody({ type: CreateCompanyFolderDto })
  @ApiCreatedResponse({ type: CompanyFolderResponseDto })
  createFolder(
    @CurrentUser('sub') actorUserId: string,
    @Body() dto: CreateCompanyFolderDto,
  ) {
    return this.companyFilesService.createFolder(
      actorUserId,
      dto.companyId,
      dto.name,
      dto.parentId,
    );
  }

  @Patch('carpetas')
  @RequirePermissions(Permission.CompanyFilesUpdate)
  @ApiOperation({ summary: 'Renombrar carpeta' })
  @ApiBody({ type: RenameCompanyFolderDto })
  @ApiOkResponse({ type: CompanyFolderResponseDto })
  renameFolder(@Body() dto: RenameCompanyFolderDto) {
    return this.companyFilesService.renameFolder(dto.folderId, dto.name);
  }

  @Post('carpetas/eliminar')
  @RequirePermissions(Permission.CompanyFilesDelete)
  @ApiOperation({
    summary: 'Eliminar carpeta (cascade: subcarpetas, links y archivos en R2)',
  })
  @ApiBody({ type: DeleteCompanyFolderDto })
  @ApiOkResponse({ description: 'Carpeta eliminada' })
  async deleteFolder(@Body() dto: DeleteCompanyFolderDto) {
    await this.companyFilesService.deleteFolderCascade(dto.folderId);
    return { ok: true };
  }

  @Post('subir-archivo')
  @RequirePermissions(Permission.CompanyFilesCreate)
  @ApiOperation({
    summary: 'Subir archivo al drive (máx. 50 MB)',
    description:
      'Sube a R2 con prefijo companies/{companyId}/{folderId|root}/… y vincula en company_folder_assets.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'companyId'],
      properties: {
        file: { type: 'string', format: 'binary' },
        companyId: { type: 'string', format: 'uuid' },
        folderId: {
          type: 'string',
          format: 'uuid',
          nullable: true,
          description: 'Sin valor = raíz',
        },
        displayName: {
          type: 'string',
          description: 'Nombre visible opcional',
        },
      },
    },
  })
  @ApiCreatedResponse({ type: CompanyFileResponseDto })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  uploadFile(
    @CurrentUser('sub') actorUserId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadCompanyFileDto,
  ) {
    return this.companyFilesService.uploadFile(
      actorUserId,
      dto.companyId,
      file,
      dto.folderId,
      dto.displayName,
    );
  }

  @Post('archivos/descarga')
  @RequirePermissions(Permission.CompanyFilesRead)
  @ApiOperation({ summary: 'URL firmada de descarga (TTL corto)' })
  @ApiBody({ type: DownloadCompanyFileDto })
  @ApiOkResponse({ type: CompanyFileDownloadResponseDto })
  download(@Body() dto: DownloadCompanyFileDto) {
    return this.companyFilesService.getDownloadUrl(dto.assetId);
  }

  @Post('archivos/eliminar')
  @RequirePermissions(Permission.CompanyFilesDelete)
  @ApiOperation({ summary: 'Eliminar archivo del drive y de R2' })
  @ApiBody({ type: DeleteCompanyFileDto })
  @ApiOkResponse({ description: 'Archivo eliminado' })
  async deleteFile(@Body() dto: DeleteCompanyFileDto) {
    await this.companyFilesService.deleteFile(dto.assetId);
    return { ok: true };
  }
}
