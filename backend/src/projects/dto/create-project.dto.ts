import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ProjectType } from '../types/project.types';

export class CreateProjectDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El ID de la empresa no es válido' })
  companyId: string;

  @ApiProperty({ example: 'Portal cliente 2026' })
  @IsString({ message: 'El nombre debe ser texto' })
  @MinLength(1, { message: 'El nombre es obligatorio' })
  @MaxLength(255, { message: 'El nombre no puede superar 255 caracteres' })
  name: string;

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

  @ApiProperty({ enum: ProjectType, example: ProjectType.EXTERNAL })
  @IsEnum(ProjectType, { message: 'El tipo de proyecto no es válido' })
  type: ProjectType;
}
