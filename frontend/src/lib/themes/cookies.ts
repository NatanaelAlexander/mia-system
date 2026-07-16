import {
  DEFAULT_STYLE_ID,
  resolveAppStyleId,
  type AppStyleId,
} from "./registry";

export const UI_STYLE_COOKIE = "mia_ui_style";
const UI_STYLE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

function cookieSuffix(maxAgeSeconds: number): string {
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";

  return `; path=/; max-age=${maxAgeSeconds}; SameSite=Lax${secure}`;
}

export function getUiStyleCookie(): AppStyleId {
  if (typeof document === "undefined") {
    return DEFAULT_STYLE_ID;
  }

  const match = document.cookie.match(
    new RegExp(
      `(?:^|; )${UI_STYLE_COOKIE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`,
    ),
  );

  const raw = match ? decodeURIComponent(match[1]) : null;
  return resolveAppStyleId(raw);
}

export function setUiStyleCookie(styleId: AppStyleId): void {
  document.cookie = `${UI_STYLE_COOKIE}=${encodeURIComponent(styleId)}${cookieSuffix(UI_STYLE_MAX_AGE_SECONDS)}`;
}

/** Script inline para aplicar el estilo antes del primer paint (evita FOUC). */
export function getUiStyleBootstrapScript(): string {
  const cookie = UI_STYLE_COOKIE;
  const fallback = DEFAULT_STYLE_ID;
  return `(function(){try{var m=document.cookie.match(/(?:^|; )${cookie}=([^;]*)/);var v=m?decodeURIComponent(m[1]):"${fallback}";document.documentElement.setAttribute("data-style",v||"${fallback}");}catch(e){document.documentElement.setAttribute("data-style","${fallback}");}})();`;
}
