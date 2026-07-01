import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCompanyRepresentativeDto {
  @IsOptional()
  @IsString({ message: 'El cargo debe ser texto' })
  @MaxLength(100, { message: 'El cargo no puede superar 100 caracteres' })
  position?: string;
}
