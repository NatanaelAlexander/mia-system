import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class LinkRepresentativeDto {
  @IsUUID()
  legalRepresentativeId: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  position?: string;
}
