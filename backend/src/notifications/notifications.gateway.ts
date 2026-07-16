import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { loadSecurityConfig } from '../common/security/security.config';
import type { JwtAccessPayload } from '../auth/types/auth.types';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';
import { userNotificationRoom } from './realtime/notification-rooms.util';
import { NotificationsRealtimeService } from './realtime/notifications-realtime.service';

function socketCorsOrigins(): string[] | boolean {
  const origins = loadSecurityConfig().corsOrigins;
  if (origins.length === 0) {
    return true;
  }
  return origins;
}

@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: socketCorsOrigins(),
    credentials: true,
  },
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(NotificationsGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly wsJwtGuard: WsJwtGuard,
    private readonly realtimeService: NotificationsRealtimeService,
  ) {}

  afterInit(server: Server): void {
    this.realtimeService.setServer(server);
    this.logger.log('NotificationsGateway inicializado (namespace /notifications)');
  }

  async handleConnection(client: Socket): Promise<void> {
    try {
      await this.wsJwtGuard.authenticateClient(client);
      const user = client.data.user as JwtAccessPayload | undefined;
      if (user?.sub) {
        await client.join(userNotificationRoom(user.sub));
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

  async handleDisconnect(): Promise<void> {
    // Sin estado adicional por conexión.
  }
}
