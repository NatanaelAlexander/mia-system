import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AccesoSuperficieDenegadoException } from '../exceptions/auth.exceptions';
import { AuthenticatedRequest } from '../types/authenticated-request';

@Injectable()
export class InternalSurfaceGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.user?.surfaces?.includes('internal')) {
      throw new AccesoSuperficieDenegadoException();
    }

    return true;
  }
}
