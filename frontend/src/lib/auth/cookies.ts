export const ACCESS_TOKEN_COOKIE = "mia_access";
export const REFRESH_TOKEN_COOKIE = "mia_refresh";

const REFRESH_FALLBACK_MAX_AGE = 60 * 60 * 24 * 7;

function cookieSuffix(maxAgeSeconds: number): string {
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";

  return `; path=/; max-age=${maxAgeSeconds}; SameSite=Lax${secure}`;
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`),
  );

  return match ? decodeURIComponent(match[1]) : null;
}

export function getAccessTokenCookie(): string | null {
  return readCookie(ACCESS_TOKEN_COOKIE);
}

export function getRefreshTokenCookie(): string | null {
  return readCookie(REFRESH_TOKEN_COOKIE);
}

export function setAuthCookies(
  accessToken: string,
  refreshToken: string,
  accessMaxAgeSeconds: number,
  refreshMaxAgeSeconds = REFRESH_FALLBACK_MAX_AGE,
): void {
  document.cookie = `${ACCESS_TOKEN_COOKIE}=${encodeURIComponent(accessToken)}${cookieSuffix(accessMaxAgeSeconds)}`;
  document.cookie = `${REFRESH_TOKEN_COOKIE}=${encodeURIComponent(refreshToken)}${cookieSuffix(refreshMaxAgeSeconds)}`;
}

export function clearAuthCookies(): void {
  document.cookie = `${ACCESS_TOKEN_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  document.cookie = `${REFRESH_TOKEN_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}
