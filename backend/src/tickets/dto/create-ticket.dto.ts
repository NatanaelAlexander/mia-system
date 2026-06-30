import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateTicketDto {
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

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4', { message: 'El ID del asignado no es válido' })
  assignedToId?: string;
}
