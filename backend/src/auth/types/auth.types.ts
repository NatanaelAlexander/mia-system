export type AuthTokenType = 'access' | 'refresh';

export type AuthSurface = 'internal' | 'portal';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  permissionsVersion: number;
}

/** Claims del access token (identidad + snapshot para UI). */
export interface JwtAccessPayload {
  sub: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  surfaces: AuthSurface[];
  permissions: string[];
  permVersion: number;
  type: 'access';
}

export interface JwtRefreshPayload {
  sub: string;
  type: 'refresh';
}

export type JwtPayload = JwtAccessPayload | JwtRefreshPayload;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface AuthLoginResult extends AuthTokens {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
    surfaces: AuthSurface[];
    permissions: string[];
    permVersion: number;
  };
}
