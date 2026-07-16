export const NotificationsRealtimeEvent = {
  NOTIFICATION_CREATED: 'notification.created',
  NOTIFICATIONS_UPDATED: 'notifications.updated',
} as const;

export interface NotificationCreatedPayload {
  id: string;
  kind: 'ticket' | 'quote';
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
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsUpdatedPayload {
  unreadCount: number;
}
