import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../common/database/database.service';
import { Ticket } from '../tickets/types/ticket.types';
import { TicketComment } from '../tickets/types/ticket.types';
import {
  SQL_COUNT_UNREAD_NOTIFICATIONS,
  SQL_FIND_INTERNAL_USER_IDS,
  SQL_FIND_NOTIFICATIONS_BY_USER,
  SQL_FIND_TICKET_ASSIGNEE_USER_IDS,
  SQL_INSERT_TICKET_NOTIFICATION,
  SQL_MARK_ALL_NOTIFICATIONS_READ,
  SQL_MARK_NOTIFICATION_READ,
  SQL_MARK_QUOTE_NOTIFICATION_READ,
  SQL_MARK_TICKET_NOTIFICATIONS_READ,
} from './queries/notifications.queries';
import { NotificationsRealtimeService } from './realtime/notifications-realtime.service';
import {
  TicketNotification,
  TicketNotificationListResult,
  TicketNotificationType,
} from './types/notification.types';

const DEFAULT_LIMIT = 30;

@Injectable()
export class NotificationsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly realtimeService: NotificationsRealtimeService,
  ) {}

  async listForUser(
    userId: string,
    limit = DEFAULT_LIMIT,
  ): Promise<TicketNotificationListResult> {
    const safeLimit = Math.min(Math.max(limit, 1), 100);

    const [{ rows }, unreadCount] = await Promise.all([
      this.db.query<TicketNotification>(SQL_FIND_NOTIFICATIONS_BY_USER, [
        userId,
        safeLimit,
      ]),
      this.countUnread(userId),
    ]);

    return { items: rows, unreadCount };
  }

  async countUnread(userId: string): Promise<number> {
    const { rows } = await this.db.query<{ count: number }>(
      SQL_COUNT_UNREAD_NOTIFICATIONS,
      [userId],
    );
    return rows[0]?.count ?? 0;
  }

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    const ticketResult = await this.db.query(SQL_MARK_NOTIFICATION_READ, [
      notificationId,
      userId,
    ]);
    if (!ticketResult.rowCount) {
      await this.db.query(SQL_MARK_QUOTE_NOTIFICATION_READ, [
        notificationId,
        userId,
      ]);
    }
    await this.emitUnreadCount(userId);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.db.query(SQL_MARK_ALL_NOTIFICATIONS_READ, [userId]);
    await this.emitUnreadCount(userId);
  }

  async markTicketAsRead(userId: string, ticketId: string): Promise<void> {
    await this.db.query(SQL_MARK_TICKET_NOTIFICATIONS_READ, [userId, ticketId]);
    await this.emitUnreadCount(userId);
  }

  async notifyTicketCreated(
    actorUserId: string,
    ticket: Ticket,
  ): Promise<void> {
    const recipientIds = await this.getAssigneeUserIds(ticket.id);
    const message = `Nuevo ticket: ${ticket.title}`;

    await this.createForRecipients({
      recipientIds,
      actorUserId,
      ticket,
      type: TicketNotificationType.TICKET_CREATED,
      commentId: null,
      message,
    });
  }

  async notifyTicketComment(
    actorUserId: string,
    ticket: Ticket,
    comment: TicketComment,
  ): Promise<void> {
    const assigneeIds = await this.getAssigneeUserIds(ticket.id);
    const recipientIds = new Set<string>([...assigneeIds, ticket.userId]);

    if (comment.isInternal) {
      const internalIds = await this.filterInternalUserIds([...recipientIds]);
      recipientIds.clear();
      for (const id of internalIds) {
        recipientIds.add(id);
      }
    }

    const authorName = `${comment.authorFirstName} ${comment.authorLastName}`.trim();
    const message = `${authorName} respondió en ${ticket.title}`;

    await this.createForRecipients({
      recipientIds: [...recipientIds],
      actorUserId,
      ticket,
      type: TicketNotificationType.TICKET_COMMENT,
      commentId: comment.id,
      message,
    });
  }

  private async createForRecipients(input: {
    recipientIds: string[];
    actorUserId: string;
    ticket: Ticket;
    type: (typeof TicketNotificationType)[keyof typeof TicketNotificationType];
    commentId: string | null;
    message: string;
  }): Promise<void> {
    const recipients = [
      ...new Set(
        input.recipientIds.filter((userId) => userId !== input.actorUserId),
      ),
    ];

    if (recipients.length === 0) {
      return;
    }

    for (const userId of recipients) {
      const { rows } = await this.db.query<{ id: string }>(
        SQL_INSERT_TICKET_NOTIFICATION,
        [
          userId,
          input.ticket.id,
          input.ticket.projectId,
          input.type,
          input.commentId,
          input.actorUserId,
          input.message,
        ],
      );

      const notificationId = rows[0]?.id;
      if (!notificationId) {
        continue;
      }

      const list = await this.listForUser(userId, 1);
      const created = list.items[0];
      if (!created) {
        continue;
      }

      this.realtimeService.emitNotificationCreated(userId, {
        id: created.id,
        kind: created.kind,
        ticketId: created.ticketId,
        projectId: created.projectId,
        quoteId: created.quoteId,
        companyId: created.companyId,
        shareToken: created.shareToken,
        type: created.type,
        commentId: created.commentId,
        actorUserId: created.actorUserId,
        actorFirstName: created.actorFirstName,
        actorLastName: created.actorLastName,
        ticketTitle: created.ticketTitle,
        message: created.message,
        readAt: created.readAt ? created.readAt.toISOString() : null,
        createdAt: created.createdAt.toISOString(),
      });

      const unreadCount = await this.countUnread(userId);
      this.realtimeService.emitNotificationsUpdated(userId, { unreadCount });
    }
  }

  private async getAssigneeUserIds(ticketId: string): Promise<string[]> {
    const { rows } = await this.db.query<{ userId: string }>(
      SQL_FIND_TICKET_ASSIGNEE_USER_IDS,
      [ticketId],
    );
    return rows.map((row) => row.userId);
  }

  private async filterInternalUserIds(userIds: string[]): Promise<string[]> {
    if (userIds.length === 0) {
      return [];
    }

    const { rows } = await this.db.query<{ userId: string }>(
      SQL_FIND_INTERNAL_USER_IDS,
      [userIds],
    );
    return rows.map((row) => row.userId);
  }

  private async emitUnreadCount(userId: string): Promise<void> {
    const unreadCount = await this.countUnread(userId);
    this.realtimeService.emitNotificationsUpdated(userId, { unreadCount });
  }
}
