import { Ticket, TicketComment } from '../types/ticket.types';

export const TicketsRealtimeEvent = {
  COMMENT_CREATED: 'comment.created',
  TICKET_STATUS_CHANGED: 'ticket.status_changed',
  COMMENT_TYPING: 'comment.typing',
  TICKET_PRESENCE: 'ticket.presence',
} as const;

export type TicketsRealtimeEventName =
  (typeof TicketsRealtimeEvent)[keyof typeof TicketsRealtimeEvent];

export interface TicketPresenceUser {
  userId: string;
  firstName: string;
  lastName: string;
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
