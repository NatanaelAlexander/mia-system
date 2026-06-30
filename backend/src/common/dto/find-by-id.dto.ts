import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class FindByIdDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El ID no es válido' })
  id: string;
}
