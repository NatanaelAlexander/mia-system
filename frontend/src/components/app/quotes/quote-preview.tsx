"use client";

import type { ReactNode } from "react";
import type { QuoteDocumentType, QuoteFrequency } from "@/components/app/api/quotes";
import {
  calculateSectionTotals,
  formatClp,
} from "@/components/app/quotes/quotes-tax";
import {
  resolveQuotePdfTheme,
  type QuotePdfLayoutId,
  type QuotePdfTheme,
} from "@/components/app/quotes/quote-pdf-styles";
import { cn } from "@/lib/utils";

export interface QuotePreviewItem {
  title: string;
  description: string;
  price: number;
}

export interface QuotePreviewSection {
  frequency: QuoteFrequency;
  esCanje: boolean;
  applyTax: boolean;
  priceInputMode: "gross" | "liquid";
  items: QuotePreviewItem[];
}

export interface QuotePreviewModel {
  quoteNumber?: number | string;
  companyName: string;
  companyTaxId: string;
  legalRepresentativeName: string;
  legalRepresentativeTaxId: string;
  issuerName: string;
  issuerTaxId: string;
  issuerService: string;
  issuerPhone: string | null;
  issuerEmail: string | null;
  documentType: QuoteDocumentType;
  issueDate: string;
  expiresAt: string;
  pdfLayoutId?: QuotePdfLayoutId | string;
  pdfPrimaryColor?: string;
  pdfSecondaryColor?: string;
  sections: QuotePreviewSection[];
}

const FREQUENCY_TITLE: Record<QuoteFrequency, string> = {
  unico: "PAGOS UNITARIOS",
  mensual: "PAGOS MENSUALES",
  anual: "PAGOS ANUALES",
};

function formatDay(value: string): string {
  if (!value) return "—";
  const date = new Date(`${value}T12:00:00`);
  return date.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function QuotePreviewDocument({ model }: { model: QuotePreviewModel }) {
  const theme = resolveQuotePdfTheme({
    layoutId: model.pdfLayoutId,
    primary: model.pdfPrimaryColor,
    secondary: model.pdfSecondaryColor,
  });

  switch (theme.layoutId) {
    case "tarjetas":
      return <LayoutTarjetas model={model} theme={theme} />;
    case "minimal":
      return <LayoutMinimal model={model} theme={theme} />;
    case "editorial":
      return <LayoutEditorial model={model} theme={theme} />;
    case "informe":
      return <LayoutInforme model={model} theme={theme} />;
    case "banner":
      return <LayoutBanner model={model} theme={theme} />;
    case "dual":
      return <LayoutDual model={model} theme={theme} />;
    case "clasico":
    default:
      return <LayoutClasico model={model} theme={theme} />;
  }
}

function LayoutClasico({
  model,
  theme,
}: {
  model: QuotePreviewModel;
  theme: QuotePdfTheme;
}) {
  return (
    <div
      className="rounded-lg border border-gray-200 p-6 text-gray-900 shadow-sm sm:p-8"
      style={{ backgroundColor: theme.background }}
    >
      <div className="border-b border-gray-200 pb-3">
        <h2 className="text-2xl font-bold tracking-tight" style={{ color: theme.primary }}>
          COTIZACIÓN
        </h2>
        <IssuerBlock model={model} secondary={theme.secondary} />
      </div>
      <div className="mt-4 grid gap-4 rounded-lg bg-gray-50 p-4 text-sm sm:grid-cols-2">
        <ClientFields model={model} secondary={theme.secondary} />
        <MetaFields
          model={model}
          primary={theme.primary}
          secondary={theme.secondary}
          align="right"
        />
      </div>
      <SectionsBlock model={model} theme={theme} variant="clasico" />
      <FooterNote secondary={theme.secondary} />
    </div>
  );
}

function LayoutInforme({
  model,
  theme,
}: {
  model: QuotePreviewModel;
  theme: QuotePdfTheme;
}) {
  return (
    <div
      className="border border-gray-300 p-4 text-gray-900 sm:p-6"
      style={{ backgroundColor: theme.background }}
    >
      <div className="flex flex-col gap-3 border-b border-gray-300 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold" style={{ color: theme.primary }}>
            {model.issuerName}
          </p>
          <p className="text-xs" style={{ color: theme.secondary }}>
            RUT {model.issuerTaxId}
          </p>
          <p className="text-xs" style={{ color: theme.secondary }}>
            {model.issuerService}
          </p>
          <p className="text-xs" style={{ color: theme.secondary }}>
            {[model.issuerPhone, model.issuerEmail].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="text-right text-xs" style={{ color: theme.secondary }}>
          <p className="font-semibold text-gray-900">
            N° {model.quoteNumber ?? "—"}
          </p>
          <p className="uppercase">{formatDay(model.issueDate)}</p>
          <p>Validez: {formatDay(model.expiresAt)}</p>
        </div>
      </div>

      <h2 className="my-5 text-center text-3xl font-black tracking-tight text-gray-900">
        COTIZACIÓN
      </h2>

      <div className="overflow-hidden border border-gray-300">
        <div
          className="px-3 py-1.5 text-xs font-bold tracking-wide text-white"
          style={{ backgroundColor: theme.primary }}
        >
          INFORMACIÓN
        </div>
        <div className="grid gap-4 p-3 text-sm sm:grid-cols-2">
          <div className="space-y-1.5">
            <InfoLine label="Empresa" value={model.companyName} secondary={theme.secondary} />
            <InfoLine label="RUT" value={model.companyTaxId} secondary={theme.secondary} />
            <InfoLine
              label="Contacto"
              value={model.legalRepresentativeName}
              secondary={theme.secondary}
            />
            <InfoLine
              label="RUN"
              value={model.legalRepresentativeTaxId}
              secondary={theme.secondary}
            />
          </div>
          <div className="space-y-1.5">
            <InfoLine
              label="Documento"
              value={model.documentType === "factura" ? "Factura" : "Boleta"}
              secondary={theme.secondary}
            />
            <InfoLine
              label="Emisión"
              value={formatDay(model.issueDate)}
              secondary={theme.secondary}
            />
            <InfoLine
              label="Validez"
              value={formatDay(model.expiresAt)}
              secondary={theme.secondary}
            />
          </div>
        </div>
      </div>

      <SectionsBlock model={model} theme={theme} variant="informe" />

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <BoxedNote title="OBSERVACIÓN" theme={theme}>
          Documento generado desde MIA System.
        </BoxedNote>
        <BoxedNote title="CONDICIÓN DE PAGO" theme={theme}>
          Según acuerdo comercial. Validez hasta {formatDay(model.expiresAt)}.
        </BoxedNote>
        <div className="min-w-[160px] self-end text-sm">
          <div className="flex justify-between border-b border-gray-200 py-1">
            <span style={{ color: theme.secondary }}>Subtotal</span>
            <span className="font-medium">
              {formatClp(sumSections(model).subtotal)}
            </span>
          </div>
          <div
            className="mt-2 flex justify-between px-2 py-2 font-bold text-white"
            style={{ backgroundColor: theme.primary }}
          >
            <span>Valor final</span>
            <span>{formatClp(sumSections(model).total)}</span>
          </div>
        </div>
      </div>

      <p className="mt-4 text-center text-xs" style={{ color: theme.secondary }}>
        Cotización válida hasta {formatDay(model.expiresAt)}.
      </p>
    </div>
  );
}

function LayoutBanner({
  model,
  theme,
}: {
  model: QuotePreviewModel;
  theme: QuotePdfTheme;
}) {
  return (
    <div
      className="overflow-hidden border border-gray-200 text-gray-900"
      style={{ backgroundColor: theme.background }}
    >
      <div className="px-5 py-6 text-white sm:px-7" style={{ backgroundColor: theme.primary }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-lg font-bold">{model.issuerName}</p>
            <p className="mt-2 text-[11px] uppercase tracking-wide opacity-90">
              {model.issuerService}
            </p>
            <p className="text-[11px] opacity-90">
              {[model.issuerTaxId, model.issuerPhone, model.issuerEmail]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <div className="sm:text-right">
            <h2 className="text-2xl font-black tracking-tight">
              COTIZACIÓN #{model.quoteNumber ?? "—"}
            </h2>
            <div className="mt-3 space-y-1 text-xs uppercase tracking-wide opacity-95">
              <p>
                <span className="opacity-70">Fecha: </span>
                {formatDay(model.issueDate)}
              </p>
              <p>
                <span className="opacity-70">Emisor: </span>
                {model.issuerName}
              </p>
              <p>
                <span className="opacity-70">Cliente: </span>
                {model.companyName}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="h-1" style={{ backgroundColor: theme.secondary }} />

      <div className="space-y-4 px-5 py-5 sm:px-7">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-gray-900">
            Descripción del proyecto
          </p>
          <p className="mt-2 text-sm" style={{ color: theme.secondary }}>
            {model.legalRepresentativeName} · RUT {model.companyTaxId} ·{" "}
            {model.documentType === "factura" ? "Factura" : "Boleta"} · Validez{" "}
            {formatDay(model.expiresAt)}
          </p>
        </div>
        <SectionsBlock model={model} theme={theme} variant="banner" />
        <p className="text-xs" style={{ color: theme.secondary }}>
          Cotización válida hasta {formatDay(model.expiresAt)}.
        </p>
      </div>
    </div>
  );
}

function LayoutDual({
  model,
  theme,
}: {
  model: QuotePreviewModel;
  theme: QuotePdfTheme;
}) {
  const totals = sumSections(model);

  return (
    <div
      className="overflow-hidden rounded-xl border border-gray-200 text-gray-900"
      style={{ backgroundColor: theme.background }}
    >
      <div
        className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-white"
        style={{ backgroundColor: theme.primary }}
      >
        <h2 className="text-xl font-bold tracking-tight">COTIZACIÓN</h2>
        <div
          className="rounded-md px-3 py-1 text-sm font-semibold"
          style={{ backgroundColor: "color-mix(in oklab, white 18%, transparent)" }}
        >
          N.º {model.quoteNumber ?? "—"}
        </div>
      </div>

      <div className="grid gap-4 px-5 py-4 sm:grid-cols-[1.1fr_auto_0.9fr] sm:px-6">
        <div>
          <p className="text-base font-bold" style={{ color: theme.primary }}>
            {model.issuerName}
          </p>
          <p className="mt-1 text-xs" style={{ color: theme.secondary }}>
            RUT {model.issuerTaxId}
          </p>
          <p className="text-xs" style={{ color: theme.secondary }}>
            {model.issuerService}
          </p>
          <p className="text-xs" style={{ color: theme.secondary }}>
            {[model.issuerPhone, model.issuerEmail].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="hidden w-px bg-current opacity-30 sm:block" style={{ color: theme.primary }} />
        <div className="space-y-1 text-sm sm:text-right">
          <InfoLine label="Emisión" value={formatDay(model.issueDate)} secondary={theme.secondary} />
          <InfoLine label="Validez" value={formatDay(model.expiresAt)} secondary={theme.secondary} />
          <InfoLine
            label="Documento"
            value={model.documentType === "factura" ? "Factura" : "Boleta"}
            secondary={theme.secondary}
          />
        </div>
      </div>

      <div className="grid gap-3 px-5 pb-4 sm:grid-cols-2 sm:px-6">
        <div
          className="rounded-xl p-3"
          style={{ backgroundColor: `${theme.primary}14` }}
        >
          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase" style={{ color: theme.primary }}>
            <span className="size-2 rounded-sm" style={{ backgroundColor: theme.primary }} />
            Cliente
          </p>
          <p className="font-semibold">{model.companyName}</p>
          <p className="text-xs" style={{ color: theme.secondary }}>
            RUT {model.companyTaxId}
          </p>
          <p className="text-xs" style={{ color: theme.secondary }}>
            {model.legalRepresentativeName} · {model.legalRepresentativeTaxId}
          </p>
        </div>
        <div
          className="rounded-xl p-3"
          style={{ backgroundColor: `${theme.primary}14` }}
        >
          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase" style={{ color: theme.primary }}>
            <span className="size-2 rounded-sm" style={{ backgroundColor: theme.primary }} />
            Emisor
          </p>
          <p className="font-semibold">{model.issuerName}</p>
          <p className="text-xs" style={{ color: theme.secondary }}>
            RUT {model.issuerTaxId}
          </p>
          <p className="text-xs" style={{ color: theme.secondary }}>
            {[model.issuerEmail, model.issuerPhone].filter(Boolean).join(" · ") ||
              model.issuerService}
          </p>
        </div>
      </div>

      <div className="px-5 pb-4 sm:px-6">
        <SectionsBlock model={model} theme={theme} variant="dual" />
      </div>

      <div className="flex flex-col gap-4 px-5 pb-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <p className="text-3xl font-black" style={{ color: theme.primary }}>
          {formatClp(totals.total)}
        </p>
        <div className="min-w-[200px] space-y-1 text-sm">
          <div className="flex justify-between">
            <span style={{ color: theme.secondary }}>Subtotal</span>
            <span>{formatClp(totals.subtotal)}</span>
          </div>
          {totals.taxAmount > 0 ? (
            <div className="flex justify-between">
              <span style={{ color: theme.secondary }}>Impuesto</span>
              <span>{formatClp(totals.taxAmount)}</span>
            </div>
          ) : null}
          {totals.retentionAmount > 0 ? (
            <div className="flex justify-between">
              <span style={{ color: theme.secondary }}>Retención</span>
              <span>{formatClp(totals.retentionAmount)}</span>
            </div>
          ) : null}
          <div
            className="flex justify-between rounded-md px-3 py-2 font-bold text-white"
            style={{ backgroundColor: theme.primary }}
          >
            <span>Total</span>
            <span>{formatClp(totals.total)}</span>
          </div>
        </div>
      </div>

      <div
        className="mx-5 mb-5 rounded-lg border-l-4 px-3 py-2 text-xs sm:mx-6"
        style={{
          borderColor: theme.primary,
          backgroundColor: `${theme.primary}12`,
        }}
      >
        <p className="font-bold" style={{ color: theme.primary }}>
          Notas
        </p>
        <p style={{ color: theme.secondary }}>
          Cotización válida hasta {formatDay(model.expiresAt)}. Gracias por su
          preferencia.
        </p>
      </div>
    </div>
  );
}

function LayoutTarjetas({
  model,
  theme,
}: {
  model: QuotePreviewModel;
  theme: QuotePdfTheme;
}) {
  const cards = [
    { label: "Empresa", value: model.companyName },
    { label: "RUT", value: model.companyTaxId },
    { label: "Representante", value: model.legalRepresentativeName },
    { label: "RUN", value: model.legalRepresentativeTaxId },
    { label: "Nº", value: String(model.quoteNumber ?? "—"), accent: true },
    { label: "Fecha", value: formatDay(model.issueDate) },
    { label: "Validez", value: formatDay(model.expiresAt) },
    {
      label: "Documento",
      value: model.documentType === "factura" ? "Factura" : "Boleta",
    },
  ];

  return (
    <div
      className="rounded-2xl border border-gray-200 p-5 text-gray-900 sm:p-7"
      style={{ backgroundColor: theme.background }}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: theme.secondary }}>
            Documento comercial
          </p>
          <h2 className="text-2xl font-bold" style={{ color: theme.primary }}>
            Cotización
          </h2>
        </div>
        <div className="rounded-xl px-3 py-2 text-right text-white" style={{ backgroundColor: theme.primary }}>
          <p className="text-[10px] uppercase opacity-80">Nº</p>
          <p className="text-xl font-bold">{model.quoteNumber ?? "—"}</p>
        </div>
      </div>
      <IssuerBlock model={model} secondary={theme.secondary} />
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-gray-200 bg-gray-50/80 p-3"
          >
            <p className="text-[10px] font-bold uppercase" style={{ color: theme.secondary }}>
              {card.label}
            </p>
            <p
              className={cn("text-sm font-medium", card.accent && "text-lg font-bold")}
              style={card.accent ? { color: theme.primary } : undefined}
            >
              {card.value || "—"}
            </p>
          </div>
        ))}
      </div>
      <SectionsBlock model={model} theme={theme} variant="tarjetas" />
      <FooterNote secondary={theme.secondary} />
    </div>
  );
}

function LayoutMinimal({
  model,
  theme,
}: {
  model: QuotePreviewModel;
  theme: QuotePdfTheme;
}) {
  return (
    <div
      className="px-2 py-4 text-gray-900 sm:px-6 sm:py-8"
      style={{ backgroundColor: theme.background }}
    >
      <h2
        className="text-3xl font-light tracking-tight"
        style={{ color: theme.primary }}
      >
        Cotización
      </h2>
      <div className="mt-6 grid gap-8 border-y border-gray-200 py-6 text-sm sm:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <IssuerBlock model={model} secondary={theme.secondary} />
          <ClientFields model={model} secondary={theme.secondary} stacked />
        </div>
        <MetaFields
          model={model}
          primary={theme.primary}
          secondary={theme.secondary}
          stacked
        />
      </div>
      <SectionsBlock model={model} theme={theme} variant="minimal" />
      <FooterNote secondary={theme.secondary} />
    </div>
  );
}

function LayoutEditorial({
  model,
  theme,
}: {
  model: QuotePreviewModel;
  theme: QuotePdfTheme;
}) {
  return (
    <div
      className="flex overflow-hidden rounded-lg border border-gray-200 text-gray-900"
      style={{ backgroundColor: theme.background }}
    >
      <div className="w-2 shrink-0 sm:w-3" style={{ backgroundColor: theme.primary }} />
      <div className="min-w-0 flex-1 p-5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2
              className="text-3xl font-black uppercase tracking-tight"
              style={{ color: theme.primary }}
            >
              Cotización
            </h2>
            <IssuerBlock model={model} secondary={theme.secondary} />
          </div>
          <div
            className="rounded-none border-l-4 pl-4 text-sm"
            style={{ borderColor: theme.primary }}
          >
            <MetaFields
              model={model}
              primary={theme.primary}
              secondary={theme.secondary}
            />
          </div>
        </div>
        <div className="mt-5 border-t-2 pt-4" style={{ borderColor: theme.primary }}>
          <ClientFields model={model} secondary={theme.secondary} columns />
        </div>
        <SectionsBlock model={model} theme={theme} variant="editorial" />
        <FooterNote secondary={theme.secondary} />
      </div>
    </div>
  );
}

function InfoLine({
  label,
  value,
  secondary,
}: {
  label: string;
  value: string;
  secondary: string;
}) {
  return (
    <p>
      <span className="font-semibold" style={{ color: secondary }}>
        {label}:{" "}
      </span>
      <span className="text-gray-900">{value || "—"}</span>
    </p>
  );
}

function BoxedNote({
  title,
  theme,
  children,
}: {
  title: string;
  theme: QuotePdfTheme;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden border border-gray-300 text-sm">
      <div
        className="px-2 py-1 text-[11px] font-bold tracking-wide text-white"
        style={{ backgroundColor: theme.primary }}
      >
        {title}
      </div>
      <div className="min-h-14 px-2 py-2" style={{ color: theme.secondary }}>
        {children}
      </div>
    </div>
  );
}

function sumSections(model: QuotePreviewModel) {
  return model.sections
    .filter((section) => section.items.length > 0)
    .reduce(
      (acc, section) => {
        const totals = calculateSectionTotals({
          itemPrices: section.items.map((item) => item.price),
          documentType: model.documentType,
          applyTax: section.applyTax,
          priceInputMode: section.priceInputMode,
        });
        return {
          subtotal: acc.subtotal + totals.subtotal,
          taxAmount: acc.taxAmount + totals.taxAmount,
          retentionAmount: acc.retentionAmount + totals.retentionAmount,
          total: acc.total + totals.total,
        };
      },
      { subtotal: 0, taxAmount: 0, retentionAmount: 0, total: 0 },
    );
}

function IssuerBlock({
  model,
  secondary,
}: {
  model: QuotePreviewModel;
  secondary: string;
}) {
  return (
    <div className="mt-2 space-y-0.5">
      <p className="text-sm font-semibold text-gray-900">
        {model.issuerName} | {model.issuerTaxId}
      </p>
      <p className="text-sm" style={{ color: secondary }}>
        {model.issuerService}
      </p>
      <p className="text-sm" style={{ color: secondary }}>
        {[model.issuerPhone, model.issuerEmail].filter(Boolean).join(" | ")}
      </p>
    </div>
  );
}

function ClientFields({
  model,
  secondary,
  stacked = false,
  columns = false,
}: {
  model: QuotePreviewModel;
  secondary: string;
  stacked?: boolean;
  columns?: boolean;
}) {
  const fields = [
    { label: "NOMBRE/RAZÓN SOCIAL", value: model.companyName },
    { label: "R.U.T", value: model.companyTaxId },
    { label: "REPRESENTANTE LEGAL", value: model.legalRepresentativeName },
    { label: "R.U.N REPRESENTANTE LEGAL", value: model.legalRepresentativeTaxId },
  ];

  return (
    <div
      className={cn(
        "space-y-3",
        columns && "grid gap-3 sm:grid-cols-2 sm:space-y-0",
        stacked && "space-y-2",
      )}
    >
      {fields.map((field) => (
        <PreviewField
          key={field.label}
          label={field.label}
          value={field.value}
          secondary={secondary}
        />
      ))}
    </div>
  );
}

function MetaFields({
  model,
  primary,
  secondary,
  align = "left",
  stacked = false,
}: {
  model: QuotePreviewModel;
  primary: string;
  secondary: string;
  align?: "left" | "right";
  stacked?: boolean;
}) {
  return (
    <div
      className={cn(
        "space-y-3",
        align === "right" && "sm:text-right",
        stacked && "space-y-4",
      )}
    >
      <PreviewField
        label="COTIZACIÓN Nº"
        value={String(model.quoteNumber ?? "—")}
        emphasize
        primary={primary}
        secondary={secondary}
      />
      <PreviewField
        label="FECHA"
        value={formatDay(model.issueDate)}
        secondary={secondary}
      />
      <PreviewField
        label="VALIDEZ"
        value={formatDay(model.expiresAt)}
        secondary={secondary}
      />
      <PreviewField
        label="DOCUMENTO"
        value={model.documentType === "factura" ? "Factura" : "Boleta"}
        secondary={secondary}
      />
    </div>
  );
}

function SectionsBlock({
  model,
  theme,
  variant,
}: {
  model: QuotePreviewModel;
  theme: QuotePdfTheme;
  variant: QuotePdfLayoutId;
}) {
  const dense = false;
  const minimal = variant === "minimal";
  const cards = variant === "tarjetas" || variant === "dual";
  const editorial = variant === "editorial" || variant === "informe";
  const banner = variant === "banner";
  const tableHeaderSolid =
    variant === "banner" || variant === "dual" || variant === "informe";

  return (
    <div className={cn("mt-6 space-y-6", dense && "mt-3 space-y-3")}>
      {model.sections
        .filter((section) => section.items.length > 0)
        .map((section) => {
          const totals = calculateSectionTotals({
            itemPrices: section.items.map((item) => item.price),
            documentType: model.documentType,
            applyTax: section.applyTax,
            priceInputMode: section.priceInputMode,
          });
          const title = section.esCanje
            ? `${FREQUENCY_TITLE[section.frequency]} (CANJE)`
            : FREQUENCY_TITLE[section.frequency];

          return (
            <div
              key={section.frequency}
              className={cn(
                "space-y-2",
                cards && "rounded-xl border border-gray-200 p-3",
              )}
            >
              <h3
                className={cn(
                  "pb-1 text-sm font-bold text-gray-900",
                  !minimal && "border-b-2",
                  editorial && "uppercase tracking-wide",
                  dense && "text-xs",
                  minimal && "border-b border-gray-200 font-medium",
                )}
                style={!minimal ? { borderColor: theme.primary } : undefined}
              >
                {title}
              </h3>
              <div
                className={cn(
                  "overflow-x-auto",
                  !minimal && "rounded-lg border border-gray-200",
                  minimal && "border-y border-gray-200",
                  variant === "informe" && "rounded-none",
                )}
              >
                <table className={cn("w-full text-sm", dense && "text-xs")}>
                  <thead
                    className={cn(
                      "text-left text-xs",
                      tableHeaderSolid ? "text-white" : "bg-gray-50",
                      banner && "uppercase tracking-wide",
                    )}
                    style={
                      tableHeaderSolid
                        ? { backgroundColor: theme.primary }
                        : { color: theme.secondary }
                    }
                  >
                    <tr>
                      <th className="px-3 py-2">Proyecto</th>
                      <th className="px-3 py-2">Descripción</th>
                      <th className="px-3 py-2 text-right">Precio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.items.map((item, index) => (
                      <tr
                        key={`${section.frequency}-${index}`}
                        className="border-t border-gray-100"
                      >
                        <td className="px-3 py-2 font-medium">{item.title}</td>
                        <td className="px-3 py-2" style={{ color: theme.secondary }}>
                          {item.description || "—"}
                        </td>
                        <td
                          className="px-3 py-2 text-right font-medium"
                          style={{
                            color: item.price < 0 ? "#DC2626" : undefined,
                          }}
                        >
                          {formatClp(item.price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={cn("space-y-1 text-sm", dense && "text-xs")}>
                <TotalRow
                  label="Sub-Total"
                  value={formatClp(totals.subtotal)}
                  secondary={theme.secondary}
                  minimal={minimal}
                />
                {model.documentType === "factura" && section.applyTax ? (
                  <TotalRow
                    label="IVA (19%)"
                    value={formatClp(totals.taxAmount)}
                    secondary={theme.secondary}
                    minimal={minimal}
                  />
                ) : null}
                {model.documentType === "boleta" && section.applyTax ? (
                  <>
                    <TotalRow
                      label="Retención 15,25%"
                      value={formatClp(totals.retentionAmount)}
                      secondary={theme.secondary}
                      minimal={minimal}
                    />
                    <TotalRow
                      label="Líquido"
                      value={formatClp(totals.liquidAmount)}
                      secondary={theme.secondary}
                      minimal={minimal}
                    />
                  </>
                ) : null}
                {model.documentType === "boleta" && !section.applyTax ? (
                  <p className="px-1 text-xs" style={{ color: theme.secondary }}>
                    El monto indicado corresponde al valor líquido a recibir; la
                    retención legal deberá ser asumida por el pagador.
                  </p>
                ) : null}
                <div
                  className={cn(
                    "flex justify-between px-3 py-2 font-semibold",
                    minimal
                      ? "rounded-none border-2"
                      : "rounded text-white",
                  )}
                  style={
                    minimal
                      ? { borderColor: theme.primary, color: theme.primary }
                      : { backgroundColor: theme.primary }
                  }
                >
                  <span>Total</span>
                  <span>{formatClp(totals.total)}</span>
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
}

function TotalRow({
  label,
  value,
  secondary,
  minimal,
}: {
  label: string;
  value: string;
  secondary: string;
  minimal: boolean;
}) {
  return (
    <div
      className={cn(
        "flex justify-between px-3 py-1.5",
        minimal ? "border-b border-gray-100" : "rounded bg-gray-50",
      )}
    >
      <span style={{ color: secondary }}>{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function FooterNote({
  secondary,
  compact = false,
}: {
  secondary: string;
  compact?: boolean;
}) {
  return (
    <p
      className={cn(
        "border-t border-gray-200 text-center italic",
        compact ? "mt-4 pt-2 text-xs" : "mt-10 pt-4 text-sm",
      )}
      style={{ color: secondary }}
    >
      Gracias por su preferencia.
    </p>
  );
}

function PreviewField({
  label,
  value,
  emphasize = false,
  primary,
  secondary,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
  primary?: string;
  secondary: string;
}) {
  return (
    <div>
      <p
        className="text-[10px] font-bold tracking-wide"
        style={{ color: secondary }}
      >
        {label}
      </p>
      <p
        className={
          emphasize ? "text-xl font-bold" : "text-sm font-medium text-gray-900"
        }
        style={emphasize && primary ? { color: primary } : undefined}
      >
        {value || "—"}
      </p>
    </div>
  );
}
