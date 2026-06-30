import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class UploadAssetDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Si se envía, el archivo queda vinculado al proyecto al subir',
  })
  @IsOptional()
  @IsUUID('4', { message: 'El ID del proyecto no es válido' })
  projectId?: string;
}
