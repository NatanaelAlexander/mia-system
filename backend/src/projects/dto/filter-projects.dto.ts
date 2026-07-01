import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ProjectStatus } from '../types/project.types';

export class FilterProjectsDto {
  @ApiPropertyOptional({
    enum: ProjectStatus,
    description: 'Filtrar por estado. Sin valor devuelve todos los estados.',
  })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;
}
