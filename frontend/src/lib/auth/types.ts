export type AuthSurface = "internal" | "portal";

/** Claims del access token (solo lectura decodificando el payload JWT en cliente). */
export interface AccessTokenClaims {
  sub: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  surfaces: AuthSurface[];
  permissions: string[];
  permVersion: number;
  type: "access";
  exp: number;
  iat: number;
}

export interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: "Bearer";
  /** El backend lo envía; en cliente no se persiste — usar decode del access token. */
  user?: unknown;
}

export interface AuthSession {
  claims: AccessTokenClaims;
}
