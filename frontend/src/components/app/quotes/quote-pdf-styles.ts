export type QuotePdfLayoutId =
  | "clasico"
  | "tarjetas"
  | "minimal"
  | "editorial"
  | "informe"
  | "banner"
  | "dual";

export interface QuotePdfLayout {
  id: QuotePdfLayoutId;
  name: string;
  description: string;
}

export interface QuotePdfTheme {
  layoutId: QuotePdfLayoutId;
  primary: string;
  secondary: string;
  background: "#FFFFFF";
}

export const QUOTE_PDF_BACKGROUND = "#FFFFFF" as const;

export const DEFAULT_QUOTE_PDF_LAYOUT_ID: QuotePdfLayoutId = "clasico";
export const DEFAULT_QUOTE_PDF_PRIMARY = "#2563EB";
export const DEFAULT_QUOTE_PDF_SECONDARY = "#6B7280";

export const QUOTE_PDF_LAYOUTS: QuotePdfLayout[] = [
  {
    id: "clasico",
    name: "Clásico",
    description:
      "Cabecera amplia, bloque de datos en dos columnas y tablas con total relleno.",
  },
  {
    id: "tarjetas",
    name: "Tarjetas",
    description:
      "Datos del cliente en cards individuales y secciones con contenedores redondeados.",
  },
  {
    id: "minimal",
    name: "Minimal",
    description:
      "Mucho aire, líneas finas, sin cajas grises y totales solo con borde.",
  },
  {
    id: "editorial",
    name: "Editorial",
    description:
      "Barra lateral de acento, tipografía marcada y tablas con encabezado fuerte.",
  },
  {
    id: "informe",
    name: "Informe",
    description:
      "Cajas con barras de título, bloque INFORMACIÓN y total tipo «Valor final».",
  },
  {
    id: "banner",
    name: "Banner",
    description:
      "Cabecera a todo el ancho con color principal y tabla con encabezado sólido.",
  },
  {
    id: "dual",
    name: "Dual",
    description:
      "Tarjetas Cliente / Emisor, tipografía moderna y total destacado.",
  },
];

/** Paleta sugerida para color principal. */
export const QUOTE_PDF_PRIMARY_COLORS = [
  "#2563EB",
  "#E8913A",
  "#15803D",
  "#4338CA",
  "#E11D48",
  "#0F172A",
  "#0F766E",
  "#1E3A5F",
] as const;

/** Paleta sugerida para color secundario. */
export const QUOTE_PDF_SECONDARY_COLORS = [
  "#6B7280",
  "#4A7C7A",
  "#64748B",
  "#78716C",
  "#475569",
  "#94A3B8",
  "#334155",
  "#52525B",
] as const;

export function isQuotePdfLayoutId(
  value: unknown,
): value is QuotePdfLayoutId {
  return (
    typeof value === "string" &&
    QUOTE_PDF_LAYOUTS.some((layout) => layout.id === value)
  );
}

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#([0-9A-Fa-f]{6})$/.test(value);
}

export function getQuotePdfLayout(id?: string | null): QuotePdfLayout {
  return (
    QUOTE_PDF_LAYOUTS.find((layout) => layout.id === id) ?? QUOTE_PDF_LAYOUTS[0]
  );
}

export function resolveQuotePdfTheme(input?: {
  layoutId?: string | null;
  primary?: string | null;
  secondary?: string | null;
}): QuotePdfTheme {
  const layoutId =
    input?.layoutId === "compacto"
      ? DEFAULT_QUOTE_PDF_LAYOUT_ID
      : isQuotePdfLayoutId(input?.layoutId)
        ? input.layoutId
        : DEFAULT_QUOTE_PDF_LAYOUT_ID;

  return {
    layoutId,
    primary: isHexColor(input?.primary)
      ? input.primary
      : DEFAULT_QUOTE_PDF_PRIMARY,
    secondary: isHexColor(input?.secondary)
      ? input.secondary
      : DEFAULT_QUOTE_PDF_SECONDARY,
    background: QUOTE_PDF_BACKGROUND,
  };
}

export function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;
  const int = Number.parseInt(value, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}
