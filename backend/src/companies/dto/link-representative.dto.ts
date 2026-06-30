import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class LinkRepresentativeDto {
  @IsUUID('4', { message: 'El representante legal no es un ID válido' })
  legalRepresentativeId: string;

  @IsOptional()
  @IsString({ message: 'El cargo debe ser texto' })
  @MaxLength(100, { message: 'El cargo no puede superar 100 caracteres' })
  position?: string;
}
