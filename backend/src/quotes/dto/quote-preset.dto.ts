import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateQuotePresetDto {
  @ApiProperty({ example: 'Mantención mensual ERP' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Si se omite, el preset queda global (todas las empresas)',
  })
  @IsOptional()
  @IsUUID('4')
  companyId?: string | null;

  @ApiProperty({
    description: 'Snapshot del formulario sin fechas',
    type: 'object',
    additionalProperties: true,
  })
  @IsObject()
  payload: Record<string, unknown>;
}

export class UpdateQuotePresetDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}

export class FilterQuotePresetsDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  companyId?: string;
}
