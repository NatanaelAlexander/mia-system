import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

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
}
