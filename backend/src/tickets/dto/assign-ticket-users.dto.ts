import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsUUID } from 'class-validator';

export class GetTicketAssigneesDto {
  @ApiProperty({ type: String, format: 'uuid' })
  @IsUUID('4', { message: 'El ID del ticket no es válido' })
  ticketId: string;
}

export class AssignTicketUsersDto {
  @ApiProperty({
    type: String,
    format: 'uuid',
    isArray: true,
    description:
      'Admins y superadmins responsables. Los superadmins activos siempre se conservan.',
  })
  @IsArray({ message: 'Los asignados deben enviarse como una lista' })
  @ArrayUnique({ message: 'No se permiten usuarios asignados duplicados' })
  @IsUUID('4', {
    each: true,
    message: 'Todos los IDs de asignados deben ser válidos',
  })
  userIds: string[];
}
