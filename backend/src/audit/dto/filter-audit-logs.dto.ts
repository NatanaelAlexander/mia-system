import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

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

  @ApiPropertyOptional({ example: 50, default: 50 })
  @IsOptional()
  @IsInt({ message: 'El límite debe ser un número entero' })
  @Min(1)
  @Max(200)
  limit?: number;
}
