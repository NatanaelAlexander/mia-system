import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PERMISSIONS_MATCH_MODE_KEY,
  REQUIRE_PERMISSIONS_KEY,
} from '../decorators/require-permissions.decorator';
import {
  PermisoDenegadoException,
  PermisosDesactualizadosException,
} from '../exceptions/auth.exceptions';
import { hasPermissions } from '../permissions/has-permissions';
import { PermissionsService } from '../permissions/permissions.service';
import { PermissionMatchMode } from '../permissions/permissions.types';
import { AuthenticatedRequest } from '../types/authenticated-request';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(
      REQUIRE_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const tokenUser = request.user;

    if (!tokenUser?.sub) {
      throw new PermisoDenegadoException();
    }

    const authorization = await this.permissionsService.resolveAuthorization(
      tokenUser.sub,
    );

    if (!authorization) {
      throw new PermisoDenegadoException();
    }

    if (authorization.permissionsVersion !== tokenUser.permVersion) {
      throw new PermisosDesactualizadosException();
    }

    request.authorization = authorization;

    if (this.permissionsService.isSuperAdmin(authorization.roles)) {
      return true;
    }

    const mode =
      this.reflector.getAllAndOverride<PermissionMatchMode>(
        PERMISSIONS_MATCH_MODE_KEY,
        [context.getHandler(), context.getClass()],
      ) ?? 'all';

    if (!hasPermissions(authorization.permissions, required, mode)) {
      throw new PermisoDenegadoException();
    }

    return true;
  }
}
