export const TicketNotificationType = {
  TICKET_CREATED: 'ticket_created',
  TICKET_COMMENT: 'ticket_comment',
} as const;

export type TicketNotificationTypeName =
  (typeof TicketNotificationType)[keyof typeof TicketNotificationType];

export interface TicketNotification {
  id: string;
  userId: string;
  ticketId: string;
  projectId: string;
  type: TicketNotificationTypeName;
  commentId: string | null;
  actorUserId: string;
  actorFirstName: string;
  actorLastName: string;
  ticketTitle: string;
  message: string;
  readAt: Date | null;
  createdAt: Date;
}

export interface TicketNotificationListResult {
  items: TicketNotification[];
  unreadCount: number;
}
