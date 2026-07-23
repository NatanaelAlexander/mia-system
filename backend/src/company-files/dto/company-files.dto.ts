import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class ListCompanyFolderContentsDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El ID de empresa no es válido' })
  companyId: string;

  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    description: 'Carpeta actual. Sin valor = raíz de la empresa.',
  })
  @IsOptional()
  @IsUUID('4', { message: 'El ID de carpeta no es válido' })
  folderId?: string | null;
}

export class CreateCompanyFolderDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El ID de empresa no es válido' })
  companyId: string;

  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    description: 'Carpeta padre. Sin valor = raíz.',
  })
  @IsOptional()
  @IsUUID('4', { message: 'El ID de carpeta padre no es válido' })
  parentId?: string | null;

  @ApiProperty({ minLength: 1, maxLength: 255 })
  @IsString()
  @MinLength(1, { message: 'El nombre es obligatorio' })
  @MaxLength(255, { message: 'El nombre es demasiado largo' })
  name: string;
}

export class RenameCompanyFolderDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El ID de carpeta no es válido' })
  folderId: string;

  @ApiProperty({ minLength: 1, maxLength: 255 })
  @IsString()
  @MinLength(1, { message: 'El nombre es obligatorio' })
  @MaxLength(255, { message: 'El nombre es demasiado largo' })
  name: string;
}

export class DeleteCompanyFolderDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El ID de carpeta no es válido' })
  folderId: string;
}

export class DeleteCompanyFileDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El ID de archivo no es válido' })
  assetId: string;
}

export class DownloadCompanyFileDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El ID de archivo no es válido' })
  assetId: string;
}

export class UploadCompanyFileDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El ID de empresa no es válido' })
  companyId: string;

  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    description: 'Carpeta destino. Sin valor = raíz.',
  })
  @IsOptional()
  @IsUUID('4', { message: 'El ID de carpeta no es válido' })
  folderId?: string | null;

  @ApiPropertyOptional({
    description: 'Nombre visible opcional. Sin valor usa el nombre del archivo.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  displayName?: string;
}
