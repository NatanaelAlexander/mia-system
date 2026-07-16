export const TicketNotificationType = {
  TICKET_CREATED: 'ticket_created',
  TICKET_COMMENT: 'ticket_comment',
} as const;

export type TicketNotificationTypeName =
  (typeof TicketNotificationType)[keyof typeof TicketNotificationType];

export interface TicketNotification {
  id: string;
  kind: 'ticket' | 'quote';
  userId: string;
  ticketId: string | null;
  projectId: string | null;
  quoteId: string | null;
  companyId: string | null;
  shareToken: string | null;
  type: string;
  commentId: string | null;
  actorUserId: string;
  actorFirstName: string;
  actorLastName: string;
  ticketTitle: string | null;
  message: string;
  readAt: Date | null;
  createdAt: Date;
}

export interface TicketNotificationListResult {
  items: TicketNotification[];
  unreadCount: number;
}
