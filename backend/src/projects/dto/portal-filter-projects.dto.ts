import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class PortalFilterProjectsDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4', { message: 'El ID de la empresa no es válido' })
  companyId?: string;

  @ApiPropertyOptional({
    example: '12.345.678-5',
    description: 'Busca por nombre o RUT de la empresa vinculada.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  companySearch?: string;
}
