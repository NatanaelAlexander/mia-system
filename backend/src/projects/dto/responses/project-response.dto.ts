import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectStatus, ProjectType } from '../../types/project.types';

export class ProjectResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  companyId: string;

  @ApiProperty({ example: 'Portal cliente 2026' })
  name: string;

  @ApiPropertyOptional({
    example: 'Rediseño del portal de clientes y flujo de tickets.',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({ enum: ProjectType })
  type: ProjectType;

  @ApiProperty({ enum: ProjectStatus })
  status: ProjectStatus;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
