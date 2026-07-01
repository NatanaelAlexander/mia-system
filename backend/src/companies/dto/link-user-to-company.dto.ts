import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class LinkUserToCompanyDto {
  @ApiProperty({ format: 'uuid', description: 'Usuario a vincular o desvincular' })
  @IsUUID('4', { message: 'El usuario no es un ID válido' })
  userId: string;
}
