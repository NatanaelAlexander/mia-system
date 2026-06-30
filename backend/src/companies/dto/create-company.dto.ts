import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { CompanyStatus } from '../entities/company.entity';

export class CreateCompanyDto {
  @IsString({ message: 'El nombre debe ser texto' })
  @MinLength(1, { message: 'El nombre es obligatorio' })
  @MaxLength(255, { message: 'El nombre no puede superar 255 caracteres' })
  name: string;

  @IsString({ message: 'El RUT debe ser texto' })
  @MinLength(1, { message: 'El RUT es obligatorio' })
  @MaxLength(50, { message: 'El RUT no puede superar 50 caracteres' })
  taxId: string;

  @IsOptional()
  @IsString({ message: 'La dirección debe ser texto' })
  address?: string;

  @IsOptional()
  @IsString({ message: 'El teléfono debe ser texto' })
  @MaxLength(50, { message: 'El teléfono no puede superar 50 caracteres' })
  phoneNumber?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El correo no es válido' })
  email?: string;

  @IsOptional()
  @IsEnum(CompanyStatus, { message: 'El estado no es válido' })
  status?: CompanyStatus;
}
