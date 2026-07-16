import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export type TicketLifecycleFilter = 'all' | 'active' | 'closed';

export class PortalFilterTicketsDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4', { message: 'El ID del proyecto no es válido' })
  projectId?: string;

  @ApiPropertyOptional({
    enum: ['all', 'active', 'closed'],
    description: 'Filtrar tickets activos o cerrados para vista kanban',
  })
  @IsOptional()
  @IsIn(['all', 'active', 'closed'], {
    message: 'lifecycle debe ser all, active o closed',
  })
  lifecycle?: TicketLifecycleFilter;

  @ApiPropertyOptional({
    description: 'Solo tickets en trabajo (Tomado, En desarrollo, QA, Esperando cliente)',
  })
  @IsOptional()
  @IsBoolean({ message: 'workingOnly debe ser booleano' })
  workingOnly?: boolean;
}

export class PortalCreateTicketDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El ID del proyecto no es válido' })
  projectId: string;

  @ApiProperty({ example: 'Error al iniciar sesión' })
  @IsString({ message: 'El título debe ser texto' })
  @MinLength(1)
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  description?: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El ID de prioridad no es válido' })
  priorityId: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4', { message: 'El ID de categoría no es válido' })
  categoryId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4', { message: 'El ID de estado de pago no es válido' })
  paymentStatusId?: string;
}

export class PortalCreateTicketCommentDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El ID del ticket no es válido' })
  ticketId: string;

  @ApiProperty({ example: 'Gracias, quedamos atentos.' })
  @IsString({ message: 'El comentario debe ser texto' })
  @MinLength(1)
  comment: string;
}
