import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuditLogResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  userId: string | null;

  @ApiProperty({ example: 'create' })
  action: string;

  @ApiProperty({ example: 'companies' })
  tableName: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  recordId: string | null;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true, nullable: true })
  oldValues: Record<string, unknown> | null;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true, nullable: true })
  newValues: Record<string, unknown> | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
}

export class PaginatedAuditLogsResponseDto {
  @ApiProperty({ type: AuditLogResponseDto, isArray: true })
  items: AuditLogResponseDto[];

  @ApiProperty({ example: 137, description: 'Total de registros que cumplen los filtros' })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  pageSize: number;
}
