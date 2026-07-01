import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  persistAuthTokens,
} from "@/lib/auth/session";
import type { AuthTokensResponse } from "@/lib/auth/types";
import { ApiError, parseApiErrorMessage } from "./errors";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return false;
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    clearSession();
    return false;
  }

  const tokens = (await response.json()) as AuthTokensResponse;
  persistAuthTokens(tokens);
  return true;
}

async function request(path: string, options: RequestInit, authenticated: boolean) {
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (authenticated) {
    const token = getAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  return fetch(`${API_BASE_URL}/api${path}`, {
    ...options,
    headers,
  });
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  authenticated = false,
): Promise<T> {
  let response = await request(path, options, authenticated);

  if (authenticated && response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      response = await request(path, options, authenticated);
    }
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(
      response.status,
      parseApiErrorMessage(body, "No se pudo completar la solicitud"),
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
