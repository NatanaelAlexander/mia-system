import { Request } from 'express';
import { UserAuthorization } from '../permissions/permissions.types';
import { JwtAccessPayload } from './auth.types';

export interface AuthenticatedRequest extends Request {
  user: JwtAccessPayload;
  /** Permisos resueltos desde BD (post PermissionsGuard). */
  authorization?: UserAuthorization;
}
