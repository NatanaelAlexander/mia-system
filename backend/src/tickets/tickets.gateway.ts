import { Logger, UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { loadSecurityConfig } from '../common/security/security.config';
import type { JwtAccessPayload } from '../auth/types/auth.types';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';
import type { AuthenticatedSocket } from '../auth/guards/ws-jwt.guard';
import { TicketsService } from './tickets.service';
import { TicketNoEncontradoException } from './exceptions/tickets.exceptions';
import { ticketInternalRoom, ticketPublicRoom, appOnlineRoom, appPresenceWatchersRoom } from './realtime/ticket-rooms.util';
import { TicketsRealtimeService } from './realtime/tickets-realtime.service';
import { TicketsRealtimeEvent } from './realtime/tickets-realtime.types';
import type {
  CommentAssetsUploadingMessage,
  CommentTypingMessage,
  TicketJoinPayload,
  TicketLeavePayload,
  TicketPresencePayload,
  TicketPresenceUser,
  AppPresencePayload,
  AppPresenceUser,
} from './realtime/tickets-realtime.types';

function socketCorsOrigins(): string[] | boolean {
  const origins = loadSecurityConfig().corsOrigins;
  if (origins.length === 0) {
    return true;
  }
  return origins;
}

@WebSocketGateway({
  namespace: '/tickets',
  cors: {
    origin: socketCorsOrigins(),
    credentials: true,
  },
})
export class TicketsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(TicketsGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly wsJwtGuard: WsJwtGuard,
    private readonly ticketsService: TicketsService,
    private readonly realtimeService: TicketsRealtimeService,
  ) {}

  afterInit(server: Server): void {
    this.realtimeService.setServer(server);
    this.logger.log('TicketsGateway inicializado (namespace /tickets)');
  }

  async handleConnection(client: Socket): Promise<void> {
    try {
      await this.wsJwtGuard.authenticateClient(client);
      const user = client.data.user as JwtAccessPayload | undefined;
      if (user) {
        await client.join(appOnlineRoom());
        if (this.canWatchAppPresence(user)) {
          await client.join(appPresenceWatchersRoom());
        }
        await this.broadcastAppPresence();
      }
    } catch (error) {
      const message =
        error instanceof WsException
          ? String(error.message)
          : 'No autorizado';
      this.logger.debug(`Conexión rechazada: ${message}`);
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    const ticketIds = this.getJoinedTicketIds(client);
    for (const ticketId of ticketIds) {
      await this.broadcastPresence(ticketId);
    }
    await this.broadcastAppPresence();
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('ticket.join')
  async handleJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: TicketJoinPayload,
  ): Promise<{ ok: true }> {
    const ticketId = payload?.ticketId;
    if (!ticketId) {
      throw new WsException('ticketId es requerido');
    }

    const user = client.data.user;

    let access: { isInternalViewer: boolean };
    try {
      access = await this.ticketsService.assertRealtimeTicketAccess(
        user,
        ticketId,
      );
    } catch (error) {
      if (error instanceof TicketNoEncontradoException) {
        throw new WsException('Ticket no encontrado o sin acceso');
      }
      throw error;
    }

    await client.join(ticketPublicRoom(ticketId));
    this.trackJoinedTicket(client, ticketId);

    if (access.isInternalViewer) {
      await client.join(ticketInternalRoom(ticketId));
    }

    await this.broadcastPresence(ticketId);
    return { ok: true };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('ticket.leave')
  async handleLeave(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: TicketLeavePayload,
  ): Promise<{ ok: true }> {
    const ticketId = payload?.ticketId;
    if (!ticketId) {
      throw new WsException('ticketId es requerido');
    }

    await client.leave(ticketPublicRoom(ticketId));
    await client.leave(ticketInternalRoom(ticketId));
    this.untrackJoinedTicket(client, ticketId);

    await this.broadcastPresence(ticketId);
    return { ok: true };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('comment.assets_uploading')
  async handleAssetsUploading(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: CommentAssetsUploadingMessage,
  ): Promise<{ ok: true }> {
    const ticketId = payload?.ticketId;
    if (!ticketId || !payload.commentId) {
      throw new WsException('ticketId y commentId son requeridos');
    }

    try {
      await this.ticketsService.assertRealtimeTicketAccess(
        client.data.user,
        ticketId,
      );
    } catch (error) {
      if (error instanceof TicketNoEncontradoException) {
        throw new WsException('Ticket no encontrado o sin acceso');
      }
      throw error;
    }

    const room = payload.isInternal
      ? ticketInternalRoom(ticketId)
      : ticketPublicRoom(ticketId);

    client.to(room).emit(TicketsRealtimeEvent.COMMENT_ASSETS_UPLOADING, {
      ticketId,
      commentId: payload.commentId,
      isInternal: Boolean(payload.isInternal),
      count: payload.count ?? 0,
    });
    return { ok: true };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('comment.typing')
  async handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: CommentTypingMessage,
  ): Promise<{ ok: true }> {
    const ticketId = payload?.ticketId;
    if (!ticketId) {
      throw new WsException('ticketId es requerido');
    }

    try {
      await this.ticketsService.assertRealtimeTicketAccess(
        client.data.user,
        ticketId,
      );
    } catch (error) {
      if (error instanceof TicketNoEncontradoException) {
        throw new WsException('Ticket no encontrado o sin acceso');
      }
      throw error;
    }

    const message: CommentTypingMessage = {
      ticketId,
      userId: client.data.user.sub,
      firstName: client.data.user.firstName,
      lastName: client.data.user.lastName,
      isTyping: Boolean(payload.isTyping),
    };

    const room = payload.isInternal
      ? ticketInternalRoom(ticketId)
      : ticketPublicRoom(ticketId);

    client.to(room).emit(TicketsRealtimeEvent.COMMENT_TYPING, message);
    return { ok: true };
  }

  private async broadcastPresence(ticketId: string): Promise<void> {
    const room = ticketPublicRoom(ticketId);
    const sockets = await this.server.in(room).fetchSockets();

    const usersById = new Map<string, TicketPresenceUser>();

    for (const remoteSocket of sockets) {
      const user = remoteSocket.data?.user as JwtAccessPayload | undefined;
      if (!user?.sub) {
        continue;
      }

      usersById.set(user.sub, {
        userId: user.sub,
        firstName: user.firstName,
        lastName: user.lastName,
      });
    }

    const presence: TicketPresencePayload = {
      ticketId,
      users: [...usersById.values()],
    };

    this.server
      .to(room)
      .emit(TicketsRealtimeEvent.TICKET_PRESENCE, presence);
  }

  private async broadcastAppPresence(): Promise<void> {
    const sockets = await this.server.in(appOnlineRoom()).fetchSockets();
    const usersById = new Map<string, AppPresenceUser>();

    for (const remoteSocket of sockets) {
      const user = remoteSocket.data?.user as JwtAccessPayload | undefined;
      if (!user?.sub) {
        continue;
      }

      usersById.set(user.sub, {
        userId: user.sub,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles,
        surfaces: user.surfaces,
      });
    }

    const presence: AppPresencePayload = {
      users: [...usersById.values()].sort((left, right) =>
        `${left.firstName} ${left.lastName}`.localeCompare(
          `${right.firstName} ${right.lastName}`,
          'es',
        ),
      ),
    };

    this.server
      .to(appPresenceWatchersRoom())
      .emit(TicketsRealtimeEvent.APP_PRESENCE, presence);
  }

  private canWatchAppPresence(user: JwtAccessPayload): boolean {
    return (
      user.surfaces.includes('internal') &&
      (user.roles.includes('admin') || user.roles.includes('super_admin'))
    );
  }

  private trackJoinedTicket(client: Socket, ticketId: string): void {
    const joined = this.getJoinedTicketIds(client);
    if (!joined.includes(ticketId)) {
      joined.push(ticketId);
    }
    client.data.joinedTicketIds = joined;
  }

  private untrackJoinedTicket(client: Socket, ticketId: string): void {
    const joined = this.getJoinedTicketIds(client).filter((id) => id !== ticketId);
    client.data.joinedTicketIds = joined;
  }

  private getJoinedTicketIds(client: Socket): string[] {
    const joined = client.data.joinedTicketIds;
    return Array.isArray(joined) ? (joined as string[]) : [];
  }
}
