"use client";

import * as React from "react";
import {
  APP_STYLES,
  DEFAULT_STYLE_ID,
  resolveAppStyleId,
  type AppStyleId,
} from "@/lib/themes/registry";
import { getUiStyleCookie, setUiStyleCookie } from "@/lib/themes/cookies";

type StyleThemeContextValue = {
  styleId: AppStyleId;
  setStyleId: (styleId: AppStyleId) => void;
  styles: typeof APP_STYLES;
};

const StyleThemeContext = React.createContext<StyleThemeContextValue | null>(
  null,
);

function applyStyleToDocument(styleId: AppStyleId) {
  document.documentElement.setAttribute("data-style", styleId);
}

export function StyleThemeProvider({
  children,
  initialStyleId,
}: {
  children: React.ReactNode;
  /** Valor leído en el servidor (cookie) para hidratar sin flash */
  initialStyleId?: string | null;
}) {
  const [styleId, setStyleIdState] = React.useState<AppStyleId>(() =>
    resolveAppStyleId(initialStyleId),
  );

  React.useEffect(() => {
    const fromCookie = getUiStyleCookie();
    setStyleIdState(fromCookie);
    applyStyleToDocument(fromCookie);
  }, []);

  const setStyleId = React.useCallback((next: AppStyleId) => {
    const resolved = resolveAppStyleId(next);
    setStyleIdState(resolved);
    setUiStyleCookie(resolved);
    applyStyleToDocument(resolved);
  }, []);

  const value = React.useMemo(
    () => ({
      styleId,
      setStyleId,
      styles: APP_STYLES,
    }),
    [styleId, setStyleId],
  );

  return (
    <StyleThemeContext.Provider value={value}>
      {children}
    </StyleThemeContext.Provider>
  );
}

export function useStyleTheme() {
  const context = React.useContext(StyleThemeContext);
  if (!context) {
    throw new Error("useStyleTheme must be used within StyleThemeProvider");
  }
  return context;
}

export function useStyleThemeOptional() {
  return React.useContext(StyleThemeContext);
}

export { DEFAULT_STYLE_ID };
