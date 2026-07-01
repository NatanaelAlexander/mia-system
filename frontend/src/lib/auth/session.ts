import {
  clearAuthCookies,
  getAccessTokenCookie,
  getRefreshTokenCookie,
  setAuthCookies,
} from "./cookies";
import {
  decodeAccessToken,
  isAccessTokenExpired,
  maxAgeSecondsFromJwt,
} from "./jwt";
import type { AuthSession, AuthTokensResponse } from "./types";

export function getSession(): AuthSession | null {
  const accessToken = getAccessTokenCookie();
  if (!accessToken) {
    return null;
  }

  const claims = decodeAccessToken(accessToken);
  if (!claims || isAccessTokenExpired(claims)) {
    return null;
  }

  return { claims };
}

export function persistAuthTokens(tokens: AuthTokensResponse): AuthSession {
  const claims = decodeAccessToken(tokens.accessToken);
  if (!claims) {
    throw new Error("Access token inválido");
  }

  const accessMaxAge = maxAgeSecondsFromJwt(
    tokens.accessToken,
    tokens.expiresIn,
  );
  const refreshMaxAge = maxAgeSecondsFromJwt(
    tokens.refreshToken,
    tokens.expiresIn * 24 * 7,
  );

  setAuthCookies(
    tokens.accessToken,
    tokens.refreshToken,
    accessMaxAge,
    refreshMaxAge,
  );

  return { claims };
}

export function clearSession(): void {
  clearAuthCookies();
}

export function getAccessToken(): string | null {
  return getAccessTokenCookie();
}

export function getRefreshToken(): string | null {
  return getRefreshTokenCookie();
}
