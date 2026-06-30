import { ApiProperty } from '@nestjs/swagger';
import { ProjectStatus, ProjectType } from '../../types/project.types';

export class ProjectResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  companyId: string;

  @ApiProperty({ example: 'Portal cliente 2026' })
  name: string;

  @ApiProperty({ enum: ProjectType })
  type: ProjectType;

  @ApiProperty({ enum: ProjectStatus })
  status: ProjectStatus;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
