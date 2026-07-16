export const NotificationsRealtimeEvent = {
  NOTIFICATION_CREATED: 'notification.created',
  NOTIFICATIONS_UPDATED: 'notifications.updated',
} as const;

export interface NotificationCreatedPayload {
  id: string;
  ticketId: string;
  projectId: string;
  type: string;
  commentId: string | null;
  actorUserId: string;
  actorFirstName: string;
  actorLastName: string;
  ticketTitle: string;
  message: string;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsUpdatedPayload {
  unreadCount: number;
}
