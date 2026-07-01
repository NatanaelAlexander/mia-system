import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { AuthService } from '../../auth/auth.service';
import { JwtAccessPayload } from '../../auth/types/auth.types';

export type AuthenticatedSocket = Socket & {
  data: {
    user: JwtAccessPayload;
  };
};

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<Socket>();
    await this.authenticateClient(client);
    return true;
  }

  async authenticateClient(client: Socket): Promise<JwtAccessPayload> {
    const existing = client.data?.user as JwtAccessPayload | undefined;
    if (existing?.sub) {
      return existing;
    }

    const token = this.extractToken(client);
    if (!token) {
      throw new WsException('Token de acceso requerido');
    }

    try {
      const user = await this.authService.verifyAccessToken(token);
      client.data.user = user;
      return user;
    } catch {
      throw new WsException('Token de acceso inválido o expirado');
    }
  }

  private extractToken(client: Socket): string | null {
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.trim()) {
      return authToken.trim();
    }

    const header = client.handshake.headers.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return header.slice('Bearer '.length).trim();
    }

    return null;
  }
}
