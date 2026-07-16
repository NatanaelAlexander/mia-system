import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import {
  NotificationCreatedPayload,
  NotificationsRealtimeEvent,
  NotificationsUpdatedPayload,
} from './notifications-realtime.types';
import { userNotificationRoom } from './notification-rooms.util';

@Injectable()
export class NotificationsRealtimeService {
  private readonly logger = new Logger(NotificationsRealtimeService.name);
  private server: Server | null = null;

  setServer(server: Server): void {
    this.server = server;
  }

  emitNotificationCreated(
    userId: string,
    payload: NotificationCreatedPayload,
  ): void {
    this.emitToUser(
      userId,
      NotificationsRealtimeEvent.NOTIFICATION_CREATED,
      payload,
    );
  }

  emitNotificationsUpdated(
    userId: string,
    payload: NotificationsUpdatedPayload,
  ): void {
    this.emitToUser(
      userId,
      NotificationsRealtimeEvent.NOTIFICATIONS_UPDATED,
      payload,
    );
  }

  private emitToUser(userId: string, event: string, payload: unknown): void {
    if (!this.server) {
      this.logger.warn(`Socket.IO no inicializado; evento omitido: ${event}`);
      return;
    }

    this.server.to(userNotificationRoom(userId)).emit(event, payload);
  }
}
