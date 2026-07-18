/**
 * Catálogo de estilos visuales de la app.
 * Para agregar uno nuevo:
 * 1. Añade el CSS en `src/styles/themes/<id>.css` con selectores
 *    `[data-style="<id>"]` y `.dark[data-style="<id>"]`
 * 2. Impórtalo en `src/app/globals.css`
 * 3. Regístralo aquí
 */
export type AppStyleId = (typeof APP_STYLES)[number]["id"];

export type AppStyleDefinition = {
  id: string;
  label: string;
  description: string;
  /** Color de preview en el selector (hex o css color) */
  swatch: string;
};

export const DEFAULT_STYLE_ID = "default" as const;

export const APP_STYLES = [
  {
    id: "default",
    label: "Team Prime",
    description: "Estilo actual de la aplicación",
    swatch: "#e89a3c",
  },
  {
    id: "t3-chat",
    label: "T3 Chat",
    description: "Acentos magenta / violeta",
    swatch: "#c0266b",
  },
  {
    id: "mono",
    label: "Mono",
    description: "Escala de grises minimalista",
    swatch: "#737373",
  },
  {
    id: "clean-slate",
    label: "Clean Slate",
    description: "Paleta limpia con acento índigo",
    swatch: "#6d5ce7",
  },
  {
    id: "cyberpunk",
    label: "Cyberpunk",
    description: "Neón magenta sobre fondo oscuro",
    swatch: "#f472b6",
  },
  {
    id: "nature",
    label: "Nature",
    description: "Verdes naturales y tonos tierra",
    swatch: "#3f7a45",
  },
  {
    id: "fl-theme",
    label: "FL Theme",
    description: "Cian y navy corporativo (Inter)",
    swatch: "#3eb8e8",
  },
] as const satisfies readonly AppStyleDefinition[];

const styleIds = new Set<string>(APP_STYLES.map((style) => style.id));

export function isAppStyleId(value: string | null | undefined): value is AppStyleId {
  return typeof value === "string" && styleIds.has(value);
}

export function resolveAppStyleId(
  value: string | null | undefined,
): AppStyleId {
  return isAppStyleId(value) ? value : DEFAULT_STYLE_ID;
}

export function getAppStyle(id: string | null | undefined): AppStyleDefinition {
  const resolved = resolveAppStyleId(id);
  return APP_STYLES.find((style) => style.id === resolved) ?? APP_STYLES[0];
}
