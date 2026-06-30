import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class SoftDeleteTicketDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Usuario que mueve el ticket a Borrador. Pendiente auth.',
  })
  @IsUUID('4', { message: 'El ID del usuario no es válido' })
  userId: string;
}
