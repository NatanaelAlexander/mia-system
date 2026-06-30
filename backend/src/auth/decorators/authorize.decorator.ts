import { SetMetadata } from '@nestjs/common';
import { PermissionModule } from '../permissions/permission-modules';
import { AuthSurface } from '../types/auth.types';

export const AUTHORIZE_RESOURCE_KEY = 'authorize_resource';
export const AUTHORIZE_SURFACE_KEY = 'authorize_surface';
export const AUTHORIZE_ACTION_KEY = 'authorize_action';
export const AUTHENTICATED_ONLY_KEY = 'authenticated_only';

/** Módulo de permisos (`companies`, `tickets`, …). Una vez por controller. */
export const AuthorizeResource = (resource: PermissionModule) =>
  SetMetadata(AUTHORIZE_RESOURCE_KEY, resource);

/** Superficie HTTP permitida para todo el controller. */
export const AuthorizeSurface = (surface: AuthSurface) =>
  SetMetadata(AUTHORIZE_SURFACE_KEY, surface);

/** Override puntual: acción distinta al CRUD inferido por método HTTP. */
export const AuthorizeAction = (action: string) =>
  SetMetadata(AUTHORIZE_ACTION_KEY, action);

/**
 * Solo JWT + superficie + versión de permisos (sin permiso module:action).
 * Patrón edificio-alcazar: update-profile y rutas self-service.
 */
export const AuthenticatedOnly = () =>
  SetMetadata(AUTHENTICATED_ONLY_KEY, true);
