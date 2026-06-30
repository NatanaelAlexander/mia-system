import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AccesoSuperficieDenegadoException } from '../exceptions/auth.exceptions';
import { AuthenticatedRequest } from '../types/authenticated-request';

@Injectable()
export class PortalSurfaceGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.user?.surfaces?.includes('portal')) {
      throw new AccesoSuperficieDenegadoException();
    }

    return true;
  }
}
