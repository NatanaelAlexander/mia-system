import { AuthSurface } from '../types/auth.types';

export interface UserAuthorization {
  userId: string;
  roles: string[];
  permissions: string[];
  surfaces: AuthSurface[];
  permissionsVersion: number;
}

export type PermissionMatchMode = 'all' | 'any';

export interface RequirePermissionsOptions {
  mode?: PermissionMatchMode;
}
