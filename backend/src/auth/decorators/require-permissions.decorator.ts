import { applyDecorators, SetMetadata } from '@nestjs/common';
import { PermissionName } from '../permissions/permission.constants';
import { PermissionMatchMode } from '../permissions/permissions.types';

export const REQUIRE_PERMISSIONS_KEY = 'require_permissions';
export const PERMISSIONS_MATCH_MODE_KEY = 'permissions_match_mode';

export const RequirePermissions = (...permissions: PermissionName[]) =>
  SetMetadata(REQUIRE_PERMISSIONS_KEY, permissions);

export const RequireAnyPermission = (...permissions: PermissionName[]) =>
  applyDecorators(
    SetMetadata(REQUIRE_PERMISSIONS_KEY, permissions),
    SetMetadata(PERMISSIONS_MATCH_MODE_KEY, 'any' satisfies PermissionMatchMode),
  );

export const PermissionMatch = (mode: PermissionMatchMode) =>
  SetMetadata(PERMISSIONS_MATCH_MODE_KEY, mode);
