import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { TokenAccesoInvalidoException } from '../exceptions/auth.exceptions';
import { AuthenticatedRequest } from '../types/authenticated-request';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new TokenAccesoInvalidoException();
    }

    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) {
      throw new TokenAccesoInvalidoException();
    }

    request.user = await this.authService.verifyAccessToken(token);
    return true;
  }
}
