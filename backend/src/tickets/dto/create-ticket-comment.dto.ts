import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MinLength } from 'class-validator';

export class CreateTicketCommentDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El ID del ticket no es válido' })
  ticketId: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Autor del comentario. Pendiente auth.',
  })
  @IsUUID('4', { message: 'El ID del usuario no es válido' })
  userId: string;

  @ApiProperty({ example: 'Revisamos el caso y estamos en ello.' })
  @IsString({ message: 'El comentario debe ser texto' })
  @MinLength(1)
  comment: string;
}
