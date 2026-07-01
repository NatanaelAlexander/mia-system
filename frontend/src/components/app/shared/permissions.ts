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
