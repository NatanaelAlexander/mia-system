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

export class TicketAssigneeResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty({ type: String, isArray: true })
  roles: string[];

  @ApiProperty()
  isSuperAdmin: boolean;
}

export class TicketKanbanItemResponseDto extends TicketResponseDto {
  @ApiPropertyOptional({ nullable: true })
  lastCommentAuthorFirstName: string | null;

  @ApiPropertyOptional({ nullable: true })
  lastCommentAuthorLastName: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  lastCommentAt: Date | null;

  @ApiProperty()
  isClosed: boolean;

  @ApiProperty()
  isWorking: boolean;

  @ApiPropertyOptional({ type: TicketAssigneeResponseDto, isArray: true })
  assignees?: TicketAssigneeResponseDto[];
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
    description:
      'Si es true, el comentario solo es visible en el panel interno.',
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

  @ApiProperty({
    description: 'true si el autor tiene rol cliente (portal)',
  })
  authorIsClient: boolean;

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

export class TicketTimelinePointResponseDto {
  @ApiProperty({ type: String, format: 'date-time' })
  date: Date;

  @ApiProperty({ example: 12 })
  total: number;

  @ApiProperty({ example: 8 })
  open: number;

  @ApiProperty({ example: 4 })
  closed: number;
}
