import { JwtSignOptions, JwtVerifyOptions } from '@nestjs/jwt';
import { JwtAccessPayload, JwtRefreshPayload } from './types/auth.types';
import {
  TokenAccesoInvalidoException,
  RefreshTokenInvalidoException,
} from './exceptions/auth.exceptions';

export const JWT_ALGORITHM = 'HS256' as const;

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuidV4(value: unknown): value is string {
  return typeof value === 'string' && UUID_V4.test(value);
}

export function accessTokenVerifyOptions(secret: string): JwtVerifyOptions {
  return {
    secret,
    algorithms: [JWT_ALGORITHM],
  };
}

export function refreshTokenVerifyOptions(secret: string): JwtVerifyOptions {
  return {
    secret,
    algorithms: [JWT_ALGORITHM],
  };
}

export function accessTokenSignOptions(
  secret: string,
  expiresIn: JwtSignOptions['expiresIn'],
): JwtSignOptions {
  return {
    secret,
    expiresIn,
    algorithm: JWT_ALGORITHM,
  };
}

export function refreshTokenSignOptions(
  secret: string,
  expiresIn: JwtSignOptions['expiresIn'],
): JwtSignOptions {
  return {
    secret,
    expiresIn,
    algorithm: JWT_ALGORITHM,
  };
}

export function parseBearerToken(
  authorizationHeader: string | undefined,
): string {
  if (!authorizationHeader?.startsWith('Bearer ')) {
    throw new TokenAccesoInvalidoException();
  }

  const token = authorizationHeader.slice('Bearer '.length).trim();
  if (!token) {
    throw new TokenAccesoInvalidoException();
  }

  return token;
}

export function assertAccessTokenPayload(
  payload: unknown,
): asserts payload is JwtAccessPayload {
  if (!payload || typeof payload !== 'object') {
    throw new TokenAccesoInvalidoException();
  }

  const claims = payload as Record<string, unknown>;

  if (claims.type !== 'access') {
    throw new TokenAccesoInvalidoException();
  }

  if (!isUuidV4(claims.sub)) {
    throw new TokenAccesoInvalidoException();
  }

  if (typeof claims.permVersion !== 'number' || !Number.isFinite(claims.permVersion)) {
    throw new TokenAccesoInvalidoException();
  }
}

export function assertRefreshTokenPayload(
  payload: unknown,
): asserts payload is JwtRefreshPayload {
  if (!payload || typeof payload !== 'object') {
    throw new RefreshTokenInvalidoException();
  }

  const claims = payload as Record<string, unknown>;

  if (claims.type !== 'refresh') {
    throw new RefreshTokenInvalidoException();
  }

  if (!isUuidV4(claims.sub)) {
    throw new RefreshTokenInvalidoException();
  }

  if (!isUuidV4(claims.sid)) {
    throw new RefreshTokenInvalidoException();
  }
}
