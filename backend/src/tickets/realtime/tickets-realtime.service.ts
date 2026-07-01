import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { Ticket, TicketComment } from '../types/ticket.types';
import { ticketInternalRoom, ticketPublicRoom } from './ticket-rooms.util';
import {
  CommentAssetAddedPayload,
  CommentAssetsUpdatedPayload,
  CommentCreatedPayload,
  TicketStatusChangedPayload,
  TicketsRealtimeEvent,
} from './tickets-realtime.types';

@Injectable()
export class TicketsRealtimeService {
  private readonly logger = new Logger(TicketsRealtimeService.name);
  private server: Server | null = null;

  setServer(server: Server): void {
    this.server = server;
  }

  emitCommentCreated(comment: TicketComment): void {
    const payload: CommentCreatedPayload = comment;
    const room = comment.isInternal
      ? ticketInternalRoom(comment.ticketId)
      : ticketPublicRoom(comment.ticketId);

    this.emitToRoom(room, TicketsRealtimeEvent.COMMENT_CREATED, payload);
  }

  emitCommentAssetAdded(payload: CommentAssetAddedPayload): void {
    const room = payload.isInternal
      ? ticketInternalRoom(payload.ticketId)
      : ticketPublicRoom(payload.ticketId);

    this.emitToRoom(room, TicketsRealtimeEvent.COMMENT_ASSET_ADDED, payload);
  }

  emitCommentAssetsUpdated(payload: CommentAssetsUpdatedPayload): void {
    const room = payload.isInternal
      ? ticketInternalRoom(payload.ticketId)
      : ticketPublicRoom(payload.ticketId);

    this.emitToRoom(room, TicketsRealtimeEvent.COMMENT_ASSETS_UPDATED, payload);
  }

  emitTicketStatusChanged(payload: TicketStatusChangedPayload): void {
    this.emitToRoom(
      ticketPublicRoom(payload.ticket.id),
      TicketsRealtimeEvent.TICKET_STATUS_CHANGED,
      payload,
    );
  }

  getServer(): Server | null {
    return this.server;
  }

  private emitToRoom(room: string, event: string, payload: unknown): void {
    if (!this.server) {
      this.logger.warn(`Socket.IO no inicializado; evento omitido: ${event}`);
      return;
    }

    this.server.to(room).emit(event, payload);
  }
}
