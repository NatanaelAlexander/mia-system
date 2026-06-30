import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PATH_METADATA } from '@nestjs/common/constants';
import { AuthService } from '../auth.service';
import {
  AUTHENTICATED_ONLY_KEY,
  AUTHORIZE_RESOURCE_KEY,
  AUTHORIZE_SURFACE_KEY,
} from '../decorators/authorize.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { REQUIRE_PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import {
  AccesoSuperficieDenegadoException,
  PermisoDenegadoException,
  PermisosDesactualizadosException,
  RutaSinAutorizacionException,
  RutaSinPermisoConfiguradoException,
  TokenAccesoInvalidoException,
  UsuarioSinPermisosException,
} from '../exceptions/auth.exceptions';
import { hasPermissions } from '../permissions/has-permissions';
import { PermissionsService } from '../permissions/permissions.service';
import { RoutePermissionResolver } from '../permissions/route-permission.resolver';
import { AuthenticatedRequest } from '../types/authenticated-request';
import { parseBearerToken } from '../jwt-token.util';

/**
 * Guard global (estilo middleware de edificio-alcazar):
 * JWT → superficie → default-deny → permisos desde BD.
 */
@Injectable()
export class ApiAuthorizationGuard implements CanActivate {
  private readonly permissionResolver: RoutePermissionResolver;

  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
    private readonly permissionsService: PermissionsService,
  ) {
    this.permissionResolver = new RoutePermissionResolver(reflector);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ])
    ) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    await this.authenticate(request);

    const surface = this.permissionResolver.getSurface(context);
    const resource = this.reflector.getAllAndOverride<string>(
      AUTHORIZE_RESOURCE_KEY,
      [context.getClass()],
    );
    const authenticatedOnly = this.reflector.getAllAndOverride<boolean>(
      AUTHENTICATED_ONLY_KEY,
      [context.getHandler(), context.getClass()],
    );
    const explicitPermissions = this.reflector.getAllAndOverride<string[]>(
      REQUIRE_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!surface && this.isApiController(context)) {
      throw new RutaSinAutorizacionException();
    }

    if (surface && !request.user.surfaces?.includes(surface)) {
      throw new AccesoSuperficieDenegadoException();
    }

    const authorization = await this.permissionsService.resolveAuthorization(
      request.user.sub,
    );

    if (!authorization) {
      throw new PermisoDenegadoException();
    }

    if (authorization.permissionsVersion !== request.user.permVersion) {
      throw new PermisosDesactualizadosException();
    }

    request.authorization = authorization;

    if (
      !this.permissionsService.bypassesPermissionChecks(authorization) &&
      authorization.permissions.length === 0
    ) {
      throw new UsuarioSinPermisosException();
    }

    if (authenticatedOnly) {
      return true;
    }

    if (surface && !resource && !explicitPermissions?.length) {
      throw new RutaSinPermisoConfiguradoException();
    }

    const resolved = this.permissionResolver.resolve(context);
    if (!resolved) {
      throw new RutaSinPermisoConfiguradoException();
    }

    if (this.permissionsService.bypassesPermissionChecks(authorization)) {
      return true;
    }

    if (
      !hasPermissions(
        authorization.permissions,
        resolved.permissions,
        resolved.mode,
      )
    ) {
      throw new PermisoDenegadoException();
    }

    return true;
  }

  private isApiController(context: ExecutionContext): boolean {
    const controllerPath =
      Reflect.getMetadata(PATH_METADATA, context.getClass()) ?? '';

    return (
      controllerPath.startsWith('internal/') ||
      controllerPath.startsWith('portal/') ||
      controllerPath.startsWith('auth/')
    );
  }

  private async authenticate(request: AuthenticatedRequest): Promise<void> {
    const token = parseBearerToken(request.headers.authorization);

    try {
      request.user = await this.authService.verifyAccessToken(token);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw new TokenAccesoInvalidoException();
      }
      throw error;
    }
  }
}
