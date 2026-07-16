import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TicketNotificationResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  ticketId!: string;

  @ApiProperty({ format: 'uuid' })
  projectId!: string;

  @ApiProperty({ enum: ['ticket_created', 'ticket_comment'] })
  type!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  commentId!: string | null;

  @ApiProperty({ format: 'uuid' })
  actorUserId!: string;

  @ApiProperty()
  actorFirstName!: string;

  @ApiProperty()
  actorLastName!: string;

  @ApiProperty()
  ticketTitle!: string;

  @ApiProperty()
  message!: string;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  readAt!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;
}

export class TicketNotificationListResponseDto {
  @ApiProperty({ type: TicketNotificationResponseDto, isArray: true })
  items!: TicketNotificationResponseDto[];

  @ApiProperty()
  unreadCount!: number;
}
