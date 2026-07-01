import type { AuthSession, AuthTokensResponse } from "./types";
import { clearSessionCookie, setSessionCookie } from "./cookies";

const SESSION_STORAGE_KEY = "mia_auth_session";

export function getSession(): AuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function setSession(tokens: AuthTokensResponse): AuthSession {
  const session: AuthSession = {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: Date.now() + tokens.expiresIn * 1000,
    user: tokens.user,
  };

  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  setSessionCookie();
  return session;
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
  clearSessionCookie();
}

export function getAccessToken(): string | null {
  return getSession()?.accessToken ?? null;
}
