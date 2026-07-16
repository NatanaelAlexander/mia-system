import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsUUID } from 'class-validator';

export type TicketLifecycleFilter = 'all' | 'active' | 'closed';

export class FilterTicketsDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4', { message: 'El ID del proyecto no es válido' })
  projectId?: string;

  @ApiPropertyOptional({
    default: false,
    description: 'Solo internal: incluir tickets en estado Borrador',
  })
  @IsOptional()
  @IsBoolean({ message: 'includeDrafts debe ser booleano' })
  includeDrafts?: boolean;

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
