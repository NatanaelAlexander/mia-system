"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { logoutRequest } from "@/lib/api/auth";
import { clearSession, getSession, setSession } from "@/lib/auth/session";
import type { AuthSession, AuthTokensResponse } from "@/lib/auth/types";

interface AuthContextValue {
  session: AuthSession | null;
  isLoading: boolean;
  login: (tokens: AuthTokensResponse) => void;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [session, setSessionState] = React.useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    setSessionState(getSession());
    setIsLoading(false);
  }, []);

  const login = React.useCallback(
    (tokens: AuthTokensResponse) => {
      const nextSession = setSession(tokens);
      setSessionState(nextSession);
      router.replace("/app");
    },
    [router],
  );

  const logout = React.useCallback(async () => {
    const current = getSession();

    try {
      if (current?.refreshToken) {
        await logoutRequest(current.refreshToken);
      }
    } catch {
      // Idempotente en backend; limpiamos sesión local igual.
    } finally {
      clearSession();
      setSessionState(null);
      router.replace("/login");
    }
  }, [router]);

  return (
    <AuthContext.Provider value={{ session, isLoading, login, logout }}>
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
