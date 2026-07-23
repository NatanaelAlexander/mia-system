import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class UpdateTicketDto {
  @ApiPropertyOptional({ example: 'Error al iniciar sesión (actualizado)' })
  @IsOptional()
  @IsString({ message: 'El título debe ser texto' })
  @MinLength(1)
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsString({ message: 'La descripción debe ser texto' })
  description?: string | null;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4', { message: 'El ID de prioridad no es válido' })
  priorityId?: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsUUID('4', { message: 'El ID de categoría no es válido' })
  categoryId?: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsUUID('4', { message: 'El ID de estado de pago no es válido' })
  paymentStatusId?: string | null;
}
