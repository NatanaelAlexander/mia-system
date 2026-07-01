import type { AccessTokenClaims } from "@/lib/auth/types";
import type { ResourceSurface } from "@/components/app/api/types";

export function preferredSurface(claims: AccessTokenClaims): ResourceSurface {
  return claims.surfaces.includes("internal") ? "internal" : "portal";
}
