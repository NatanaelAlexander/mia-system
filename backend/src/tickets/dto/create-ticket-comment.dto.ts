import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateTicketCommentDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El ID del ticket no es válido' })
  ticketId: string;

  @ApiProperty({ example: 'Revisamos el caso y estamos en ello.' })
  @IsString({ message: 'El comentario debe ser texto' })
  @MinLength(1)
  comment: string;

  @ApiPropertyOptional({
    description:
      'Si es true, el comentario solo es visible en el panel interno.',
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'isInternal debe ser verdadero o falso' })
  isInternal?: boolean;
}
