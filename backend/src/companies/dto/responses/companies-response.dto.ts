import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CompanyStatus } from '../../types/company.types';

export class CompanyResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Empresa Demo SpA' })
  name: string;

  @ApiProperty({
    example: '12.345.678-5',
    description: 'RUT en formato canónico (12.345.678-5).',
  })
  taxId: string;

  @ApiPropertyOptional({ example: 'Av. Providencia 123', nullable: true })
  address: string | null;

  @ApiPropertyOptional({ example: '+56912345678', nullable: true })
  phoneNumber: string | null;

  @ApiPropertyOptional({ example: 'contacto@empresa.cl', nullable: true })
  email: string | null;

  @ApiProperty({ enum: CompanyStatus, example: CompanyStatus.ACTIVE })
  status: CompanyStatus;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}

export class LegalRepresentativeResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Juan' })
  firstName: string;

  @ApiProperty({ example: 'Pérez' })
  lastName: string;

  @ApiProperty({ example: '12345678-9' })
  identificationNumber: string;

  @ApiPropertyOptional({ nullable: true })
  email: string | null;

  @ApiPropertyOptional({ nullable: true })
  phoneNumber: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  userId: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}

export class CompanyRepresentativeResponseDto {
  @ApiProperty({ format: 'uuid' })
  companyId: string;

  @ApiProperty({ format: 'uuid' })
  legalRepresentativeId: string;

  @ApiPropertyOptional({ example: 'Gerente General', nullable: true })
  position: string | null;

  @ApiPropertyOptional({ type: LegalRepresentativeResponseDto })
  legalRepresentative?: LegalRepresentativeResponseDto;
}
