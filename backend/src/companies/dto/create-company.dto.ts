import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { CompanyStatus } from '../types/company.types';

export class CreateCompanyDto {
  @ApiProperty({ example: 'Empresa Demo SpA' })
  @IsString({ message: 'El nombre debe ser texto' })
  @MinLength(1, { message: 'El nombre es obligatorio' })
  @MaxLength(255, { message: 'El nombre no puede superar 255 caracteres' })
  name: string;

  @ApiProperty({
    example: '12.345.678-5',
    description: 'RUT chileno. Se almacena en formato canónico (12.345.678-5).',
  })
  @IsString({ message: 'El RUT debe ser texto' })
  @MinLength(1, { message: 'El RUT es obligatorio' })
  @MaxLength(50, { message: 'El RUT no puede superar 50 caracteres' })
  taxId: string;

  @ApiPropertyOptional({ example: 'Av. Providencia 123' })
  @IsOptional()
  @IsString({ message: 'La dirección debe ser texto' })
  address?: string;

  @ApiPropertyOptional({ example: '+56912345678' })
  @IsOptional()
  @IsString({ message: 'El teléfono debe ser texto' })
  @MaxLength(50, { message: 'El teléfono no puede superar 50 caracteres' })
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'contacto@empresa.cl' })
  @IsOptional()
  @IsEmail({}, { message: 'El correo no es válido' })
  email?: string;

  @ApiPropertyOptional({ enum: CompanyStatus, example: CompanyStatus.ACTIVE })
  @IsOptional()
  @IsEnum(CompanyStatus, { message: 'El estado no es válido' })
  status?: CompanyStatus;
}
