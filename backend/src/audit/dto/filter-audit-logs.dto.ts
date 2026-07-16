import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class FilterAuditLogsDto {
  @ApiPropertyOptional({ example: 'companies' })
  @IsOptional()
  @IsString({ message: 'El nombre de tabla debe ser texto' })
  tableName?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4', { message: 'El ID del registro no es válido' })
  recordId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4', { message: 'El ID del usuario no es válido' })
  userId?: string;

  @ApiPropertyOptional({ example: 'create' })
  @IsOptional()
  @IsString({ message: 'La acción debe ser texto' })
  action?: string;

  @ApiPropertyOptional({
    example: '2026-07-01T00:00:00.000Z',
    description: 'Fecha inicial (inclusive) en formato ISO 8601',
  })
  @IsOptional()
  @IsISO8601({}, { message: 'La fecha inicial no es válida' })
  dateFrom?: string;

  @ApiPropertyOptional({
    example: '2026-07-31T23:59:59.999Z',
    description: 'Fecha final (inclusive) en formato ISO 8601',
  })
  @IsOptional()
  @IsISO8601({}, { message: 'La fecha final no es válida' })
  dateTo?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La página debe ser un número entero' })
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El tamaño de página debe ser un número entero' })
  @Min(1)
  @Max(200)
  pageSize?: number;
}
