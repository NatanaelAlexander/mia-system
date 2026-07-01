import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'nuevo@mia.local' })
  @IsEmail({}, { message: 'El correo no es válido' })
  @MaxLength(255, { message: 'El correo no puede superar 255 caracteres' })
  email: string;

  @ApiProperty({ example: 'Temporal123', minLength: 6 })
  @IsString({ message: 'La contraseña debe ser texto' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @MaxLength(100, { message: 'La contraseña no puede superar 100 caracteres' })
  password: string;

  @ApiProperty({ example: 'María' })
  @IsString({ message: 'El nombre debe ser texto' })
  @MinLength(1, { message: 'El nombre es obligatorio' })
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'González' })
  @IsString({ message: 'El apellido debe ser texto' })
  @MinLength(1, { message: 'El apellido es obligatorio' })
  @MaxLength(100)
  lastName: string;

  @ApiPropertyOptional({ example: '+56912345678' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phoneNumber?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description: 'Roles a asignar al crear',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: 'Cada rol debe ser un UUID válido' })
  roleIds?: string[];

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description: 'Cargos laborales',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: 'Cada cargo debe ser un UUID válido' })
  jobTitleIds?: string[];

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description: 'Empresas vinculadas (clientes portal)',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: 'Cada empresa debe ser un UUID válido' })
  companyIds?: string[];
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'nuevo@mia.local' })
  @IsOptional()
  @IsEmail({}, { message: 'El correo no es válido' })
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ example: 'María' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({ example: 'González' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({ example: '+56912345678', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phoneNumber?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [String], format: 'uuid' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  jobTitleIds?: string[];
}

export class AssignUserRolesDto {
  @ApiProperty({ type: [String], format: 'uuid' })
  @IsArray()
  @ArrayNotEmpty({ message: 'Debes indicar al menos un rol' })
  @IsUUID('4', { each: true, message: 'Cada rol debe ser un UUID válido' })
  roleIds: string[];
}

export class LinkUserCompanyDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El ID de empresa no es válido' })
  companyId: string;
}

export class LinkUserCompanyRequestDto extends LinkUserCompanyDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El ID de usuario no es válido' })
  userId: string;
}

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'nuevo@mia.local' })
  @IsOptional()
  @IsEmail({}, { message: 'El correo no es válido' })
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ example: 'María' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({ example: 'González' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({ example: '+56912345678', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phoneNumber?: string | null;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'admin' })
  @IsString()
  @MinLength(1, { message: 'La contraseña actual es obligatoria' })
  currentPassword: string;

  @ApiProperty({ example: 'NuevaClave123', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'La nueva contraseña debe tener al menos 6 caracteres' })
  @MaxLength(100)
  newPassword: string;
}

export class AdminChangePasswordDto {
  @ApiProperty({ example: 'Temporal123', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @MaxLength(100)
  password: string;
}

export class FilterUsersDto {
  @ApiPropertyOptional({ description: 'Filtrar por estado activo/inactivo' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'cliente', description: 'Nombre del rol' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  roleName?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Usuarios de una empresa' })
  @IsOptional()
  @IsUUID('4')
  companyId?: string;
}
