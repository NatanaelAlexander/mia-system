"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { logoutRequest } from "@/lib/api/auth";
import {
  clearSession,
  getRefreshToken,
  getSession,
  persistAuthTokens,
} from "@/lib/auth/session";
import type { AccessTokenClaims, AuthTokensResponse } from "@/lib/auth/types";

interface AuthContextValue {
  claims: AccessTokenClaims | null;
  isLoading: boolean;
  login: (tokens: AuthTokensResponse) => void;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [claims, setClaims] = React.useState<AccessTokenClaims | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // Limpia almacenamiento legacy (sessionStorage + cookie flag).
    sessionStorage.removeItem("mia_auth_session");
    document.cookie = "mia_session_flag=; path=/; max-age=0; SameSite=Lax";

    setClaims(getSession()?.claims ?? null);
    setIsLoading(false);
  }, []);

  const login = React.useCallback(
    (tokens: AuthTokensResponse) => {
      const session = persistAuthTokens(tokens);
      setClaims(session.claims);
      router.replace("/app");
    },
    [router],
  );

  const logout = React.useCallback(async () => {
    const refreshToken = getRefreshToken();

    try {
      if (refreshToken) {
        await logoutRequest(refreshToken);
      }
    } catch {
      // Idempotente en backend; limpiamos cookies igual.
    } finally {
      clearSession();
      setClaims(null);
      router.replace("/login");
    }
  }, [router]);

  return (
    <AuthContext.Provider value={{ claims, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
}
