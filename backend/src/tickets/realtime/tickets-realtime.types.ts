import { Ticket, TicketComment } from '../types/ticket.types';

export const TicketsRealtimeEvent = {
  COMMENT_CREATED: 'comment.created',
  COMMENT_ASSETS_UPLOADING: 'comment.assets_uploading',
  COMMENT_ASSET_ADDED: 'comment.asset_added',
  COMMENT_ASSETS_UPDATED: 'comment.assets_updated',
  TICKET_STATUS_CHANGED: 'ticket.status_changed',
  COMMENT_TYPING: 'comment.typing',
  TICKET_PRESENCE: 'ticket.presence',
  APP_PRESENCE: 'app.presence',
} as const;

export type TicketsRealtimeEventName =
  (typeof TicketsRealtimeEvent)[keyof typeof TicketsRealtimeEvent];

export interface TicketPresenceUser {
  userId: string;
  firstName: string;
  lastName: string;
}

export interface AppPresenceUser {
  userId: string;
  firstName: string;
  lastName: string;
  roles: string[];
  surfaces: string[];
}

export interface AppPresencePayload {
  users: AppPresenceUser[];
}

export interface TicketPresencePayload {
  ticketId: string;
  users: TicketPresenceUser[];
}

export interface CommentTypingPayload {
  ticketId: string;
  userId: string;
  firstName: string;
  lastName: string;
  isTyping: boolean;
}

export interface TicketStatusChangedPayload {
  ticket: Ticket;
  previous: {
    statusId: string;
    statusName: string;
  };
  changedByUserId: string;
}

export type CommentCreatedPayload = TicketComment;

export interface CommentAssetAddedPayload {
  ticketId: string;
  commentId: string;
  isInternal: boolean;
  asset: {
    id: string;
    fileName: string;
    mimeType: string | null;
    fileSize: number | null;
    createdAt: Date;
  };
}

export interface CommentAssetsUpdatedPayload {
  ticketId: string;
  commentId: string;
  isInternal: boolean;
  assets: Array<{
    id: string;
    fileName: string;
    mimeType: string | null;
    fileSize: number | null;
    createdAt: Date;
  }>;
}

export interface CommentAssetsUploadingMessage {
  ticketId: string;
  commentId: string;
  isInternal?: boolean;
  count?: number;
}

export interface TicketJoinPayload {
  ticketId: string;
}

export interface TicketLeavePayload {
  ticketId: string;
}

export interface CommentTypingMessage {
  ticketId: string;
  userId: string;
  firstName: string;
  lastName: string;
  isTyping: boolean;
  isInternal?: boolean;
}
