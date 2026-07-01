import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ProjectStatus } from '../types/project.types';

export class FilterProjectsDto {
  @ApiPropertyOptional({
    enum: ProjectStatus,
    description: 'Filtrar por estado. Sin valor devuelve todos los estados.',
  })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Filtrar por empresa vinculada.',
  })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiPropertyOptional({
    example: 'Empresa Demo',
    description: 'Busca por nombre o RUT de la empresa vinculada.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  companySearch?: string;
}
