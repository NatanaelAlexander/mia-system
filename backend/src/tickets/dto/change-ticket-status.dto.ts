import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ChangeTicketStatusDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El ID del estado no es válido' })
  statusId: string;
}
