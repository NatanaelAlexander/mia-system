import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ProjectStatus, ProjectType } from '../types/project.types';

export class UpdateProjectDto {
  @ApiPropertyOptional({ example: 'Portal cliente v2' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    example: 'Rediseño del portal de clientes y flujo de tickets.',
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  @MaxLength(5000, {
    message: 'La descripción no puede superar 5000 caracteres',
  })
  description?: string | null;

  @ApiPropertyOptional({ enum: ProjectType })
  @IsOptional()
  @IsEnum(ProjectType, { message: 'El tipo de proyecto no es válido' })
  type?: ProjectType;

  @ApiPropertyOptional({ enum: ProjectStatus })
  @IsOptional()
  @IsEnum(ProjectStatus, { message: 'El estado del proyecto no es válido' })
  status?: ProjectStatus;
}
