import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CatalogItemResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;
}

export class TicketResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  projectId: string;

  @ApiProperty({ format: 'uuid' })
  userId: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiProperty({ format: 'uuid' })
  statusId: string;

  @ApiProperty()
  statusName: string;

  @ApiProperty({ format: 'uuid' })
  priorityId: string;

  @ApiProperty()
  priorityName: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  categoryId: string | null;

  @ApiPropertyOptional({ nullable: true })
  categoryName: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  paymentStatusId: string | null;

  @ApiPropertyOptional({ nullable: true })
  paymentStatusName: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  assignedToId: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}

export class TicketCommentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  ticketId: string;

  @ApiProperty({ format: 'uuid' })
  userId: string;

  @ApiProperty()
  comment: string;

  @ApiProperty({
    description: 'Si es true, el comentario solo es visible en el panel interno.',
  })
  isInternal: boolean;

  @ApiProperty()
  authorFirstName: string;

  @ApiProperty()
  authorLastName: string;

  @ApiProperty({
    example: ['Programador backend'],
    isArray: true,
    description: 'Cargos internos del autor del comentario',
  })
  authorJobTitles: string[];

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
}

export class TicketStatusHistoryResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  ticketId: string;

  @ApiProperty({ format: 'uuid' })
  statusId: string;

  @ApiProperty()
  statusName: string;

  @ApiProperty({ format: 'uuid' })
  userId: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
}
