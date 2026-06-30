import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class GetProjectAssetsDto {
  @ApiProperty({ format: 'uuid', description: 'ID del proyecto' })
  @IsUUID('4', { message: 'El ID del proyecto no es válido' })
  projectId: string;
}

export class LinkProjectAssetDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El ID del proyecto no es válido' })
  projectId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El ID del archivo no es válido' })
  assetId: string;
}

export class UnlinkProjectAssetDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El ID del proyecto no es válido' })
  projectId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El ID del archivo no es válido' })
  assetId: string;
}

export class UploadProjectAssetDto {
  @ApiProperty({ format: 'uuid', description: 'Proyecto al que se vincula el archivo' })
  @IsUUID('4', { message: 'El ID del proyecto no es válido' })
  projectId: string;
}
