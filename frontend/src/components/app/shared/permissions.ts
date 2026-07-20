import type { AccessTokenClaims } from "@/lib/auth/types";

export interface ModuleAccess {
  requiredPermission?: string;
  internalOnly?: boolean;
}

/** Mirrors backend PermissionsService.bypassesPermissionChecks. */
function bypassesPermissionChecks(claims: AccessTokenClaims): boolean {
  return (
    claims.roles.includes("super_admin") ||
    claims.permissions.includes("system:manage")
  );
}

export function canAccessModule(
  claims: AccessTokenClaims | null,
  access: ModuleAccess,
) {
  if (!claims) {
    return false;
  }

  if (access.internalOnly && !claims.surfaces.includes("internal")) {
    return false;
  }

  if (!access.requiredPermission) {
    return true;
  }

  return hasPermission(claims, access.requiredPermission);
}

export function hasPermission(
  claims: AccessTokenClaims | null,
  permission: string,
) {
  if (!claims) {
    return false;
  }

  if (bypassesPermissionChecks(claims)) {
    return true;
  }

  return claims.permissions.includes(permission);
}

export function isInternalUser(claims: AccessTokenClaims | null) {
  return claims?.surfaces.includes("internal") ?? false;
}

export function isSuperAdmin(claims: AccessTokenClaims | null) {
  return claims?.roles.includes("super_admin") ?? false;
}

/** Admin trabajador: acceso acotado por tickets asignados. */
export function isScopedAdmin(claims: AccessTokenClaims | null) {
  return Boolean(claims?.roles.includes("admin") && !isSuperAdmin(claims));
}
