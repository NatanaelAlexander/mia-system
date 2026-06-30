import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class FindByIdDto {
  @ApiProperty({
    format: 'uuid',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    description: 'ID del recurso',
  })
  @IsUUID('4', { message: 'El ID no es válido' })
  id: string;
}
