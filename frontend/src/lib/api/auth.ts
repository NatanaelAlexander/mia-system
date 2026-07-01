import type { AuthTokensResponse } from "@/lib/auth/types";
import { apiFetch } from "./client";

export async function loginRequest(
  email: string,
  password: string,
): Promise<AuthTokensResponse> {
  return apiFetch<AuthTokensResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function logoutRequest(refreshToken: string): Promise<{ ok: true }> {
  return apiFetch<{ ok: true }>("/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}

export async function refreshRequest(
  refreshToken: string,
): Promise<AuthTokensResponse> {
  return apiFetch<AuthTokensResponse>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}
