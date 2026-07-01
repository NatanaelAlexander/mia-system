import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { CompanyStatus } from '../types/company.types';

export class FilterCompaniesDto {
  @ApiPropertyOptional({
    enum: CompanyStatus,
    description: 'Filtrar por estado. Sin valor devuelve activas e inactivas.',
  })
  @IsOptional()
  @IsEnum(CompanyStatus)
  status?: CompanyStatus;

  @ApiPropertyOptional({
    example: 'Empresa Demo',
    description: 'Busca por nombre o RUT (con o sin puntos).',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
