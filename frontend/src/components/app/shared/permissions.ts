import type { AccessTokenClaims } from "@/lib/auth/types";

export interface ModuleAccess {
  requiredPermission?: string;
  internalOnly?: boolean;
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

  return claims.permissions.includes(access.requiredPermission);
}

export function hasPermission(
  claims: AccessTokenClaims | null,
  permission: string,
) {
  return claims?.permissions.includes(permission) ?? false;
}

export function isInternalUser(claims: AccessTokenClaims | null) {
  return claims?.surfaces.includes("internal") ?? false;
}
