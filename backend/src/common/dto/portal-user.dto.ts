import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class PortalUserDto {
  @ApiProperty({
    format: 'uuid',
    description:
      'Usuario portal. Pendiente auth: enviar manualmente; luego vendrá del JWT.',
  })
  @IsUUID('4', { message: 'El ID del usuario no es válido' })
  userId: string;
}
