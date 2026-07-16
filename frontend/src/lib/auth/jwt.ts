import type { AccessTokenClaims } from "./types";

function decodeBase64UrlToUtf8(base64Url: string): string {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "=",
  );

  if (typeof window === "undefined") {
    return Buffer.from(padded, "base64").toString("utf-8");
  }

  // atob() returns a binary Latin-1 string; re-decode as UTF-8 for ñ, accents, etc.
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder("utf-8").decode(bytes);
}

function decodeJwtPayload<T>(token: string): T | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const json = decodeBase64UrlToUtf8(parts[1]);
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

export function decodeAccessToken(
  accessToken: string,
): AccessTokenClaims | null {
  const payload = decodeJwtPayload<AccessTokenClaims>(accessToken);

  if (!payload || payload.type !== "access" || !payload.sub) {
    return null;
  }

  return payload;
}

export function isAccessTokenExpired(claims: AccessTokenClaims): boolean {
  return Date.now() >= claims.exp * 1000;
}

export function maxAgeSecondsFromJwt(
  token: string,
  fallbackSeconds: number,
): number {
  const payload = decodeJwtPayload<{ exp?: number }>(token);

  if (!payload?.exp) {
    return fallbackSeconds;
  }

  return Math.max(0, payload.exp - Math.floor(Date.now() / 1000));
}
