import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PATH_METADATA } from '@nestjs/common/constants';
import {
  AUTHORIZE_ACTION_KEY,
  AUTHORIZE_RESOURCE_KEY,
  AUTHORIZE_SURFACE_KEY,
} from '../decorators/authorize.decorator';
import {
  PERMISSIONS_MATCH_MODE_KEY,
  REQUIRE_PERMISSIONS_KEY,
} from '../decorators/require-permissions.decorator';
import { PermissionName } from './permission.constants';
import { PermissionMatchMode } from './permissions.types';
import { AuthSurface } from '../types/auth.types';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

interface ResolvedPermission {
  permissions: PermissionName[];
  mode: PermissionMatchMode;
}

type PathRule = {
  test: (path: string, method: HttpMethod, surface: AuthSurface) => boolean;
  permission: PermissionName;
};

/** Rutas compuestas (archivos, comentarios, catálogos) que no siguen CRUD simple. */
const PATH_RULES: PathRule[] = [
  {
    test: (path, method) => path.includes('catalogos') && method === 'GET',
    permission: 'tickets:read',
  },
  {
    test: (path, method) =>
      (path.includes('subir-archivo') || path.endsWith('/subir')) &&
      method === 'POST',
    permission: 'assets:create',
  },
  {
    test: (path, method) =>
      (path.includes('vincular-archivo') ||
        path.includes('desvincular-archivo')) &&
      method === 'POST',
    permission: 'assets:update',
  },
  {
    test: (path, method) =>
      (path.includes('archivos') || path.includes('descarga')) && method === 'GET',
    permission: 'assets:read',
  },
  {
    test: (path, method, surface) =>
      path.includes('comentarios') && method === 'GET' && surface === 'internal',
    permission: 'ticket_comments:read_internal',
  },
  {
    test: (path, method, surface) =>
      path.includes('comentarios') && method === 'GET' && surface === 'portal',
    permission: 'ticket_comments:read',
  },
  {
    test: (path, method) =>
      path.includes('comentarios') && method === 'POST',
    permission: 'ticket_comments:create',
  },
  {
    test: (path, method) => path.includes('/estado') && method === 'PATCH',
    permission: 'tickets:change_status',
  },
  {
    test: (path, method) =>
      path.includes('representatives') &&
      (method === 'POST' || method === 'DELETE'),
    permission: 'companies:update',
  },
];

const HTTP_ACTION: Record<HttpMethod, string | null> = {
  GET: 'read',
  POST: 'create',
  PATCH: 'update',
  PUT: 'update',
  DELETE: 'delete',
};

export class RoutePermissionResolver {
  constructor(private readonly reflector: Reflector) {}

  resolve(context: ExecutionContext): ResolvedPermission | null {
    const explicit = this.reflector.getAllAndOverride<PermissionName[]>(
      REQUIRE_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (explicit?.length) {
      const mode =
        this.reflector.getAllAndOverride<PermissionMatchMode>(
          PERMISSIONS_MATCH_MODE_KEY,
          [context.getHandler(), context.getClass()],
        ) ?? 'all';

      return { permissions: explicit, mode };
    }

    const actionOverride = this.reflector.getAllAndOverride<string>(
      AUTHORIZE_ACTION_KEY,
      [context.getHandler(), context.getClass()],
    );

    const resource = this.reflector.getAllAndOverride<string>(
      AUTHORIZE_RESOURCE_KEY,
      [context.getClass()],
    );

    const surface = this.reflector.getAllAndOverride<AuthSurface>(
      AUTHORIZE_SURFACE_KEY,
      [context.getClass()],
    );

    if (!resource || !surface) {
      return null;
    }

    const { path, method } = this.extractRoute(context);

    for (const rule of PATH_RULES) {
      if (rule.test(path, method, surface)) {
        return { permissions: [rule.permission], mode: 'all' };
      }
    }

    const action = actionOverride ?? HTTP_ACTION[method];
    if (!action) {
      return null;
    }

    return {
      permissions: [`${resource}:${action}` as PermissionName],
      mode: 'all',
    };
  }

  getSurface(context: ExecutionContext): AuthSurface | null {
    return (
      this.reflector.getAllAndOverride<AuthSurface>(AUTHORIZE_SURFACE_KEY, [
        context.getClass(),
      ]) ?? null
    );
  }

  private extractRoute(context: ExecutionContext): {
    path: string;
    method: HttpMethod;
  } {
    const request = context.switchToHttp().getRequest<{
      method: string;
      route?: { path: string };
    }>();

    const controllerPath =
      Reflect.getMetadata(PATH_METADATA, context.getClass()) ?? '';
    const handlerPath =
      Reflect.getMetadata(PATH_METADATA, context.getHandler()) ?? '';

    const declared = [controllerPath, handlerPath]
      .filter(Boolean)
      .join('/')
      .replace(/\/+/g, '/');

    const path = (request.route?.path ?? declared).replace(/\/+/g, '/');
    const method = request.method.toUpperCase() as HttpMethod;

    return { path, method };
  }
}
