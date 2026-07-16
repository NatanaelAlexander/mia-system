/** Tasas Chile vigentes (2026). Mantener alineado con backend quotes-tax.util.ts */
export const IVA_RATE = 0.19;
export const RETENTION_RATE_2026 = 0.1525;

export type QuoteDocumentType = "boleta" | "factura";
export type PriceInputMode = "gross" | "liquid";

export interface SectionTotals {
  subtotal: number;
  taxAmount: number;
  retentionAmount: number;
  liquidAmount: number;
  total: number;
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateSectionTotals(input: {
  itemPrices: number[];
  documentType: QuoteDocumentType;
  applyTax: boolean;
  priceInputMode?: PriceInputMode;
}): SectionTotals {
  const rawSubtotal = input.itemPrices.reduce((sum, price) => sum + price, 0);
  const subtotal = roundMoney(rawSubtotal);

  if (!input.applyTax) {
    return {
      subtotal,
      taxAmount: 0,
      retentionAmount: 0,
      liquidAmount: subtotal,
      total: subtotal,
    };
  }

  if (input.documentType === "factura") {
    const taxAmount = roundMoney(subtotal * IVA_RATE);
    return {
      subtotal,
      taxAmount,
      retentionAmount: 0,
      liquidAmount: subtotal,
      total: roundMoney(subtotal + taxAmount),
    };
  }

  if (input.priceInputMode === "liquid") {
    const liquidAmount = subtotal;
    const gross = roundMoney(liquidAmount / (1 - RETENTION_RATE_2026));
    const retentionAmount = roundMoney(gross - liquidAmount);
    return {
      subtotal: gross,
      taxAmount: 0,
      retentionAmount,
      liquidAmount,
      total: gross,
    };
  }

  const retentionAmount = roundMoney(subtotal * RETENTION_RATE_2026);
  const liquidAmount = roundMoney(subtotal - retentionAmount);
  return {
    subtotal,
    taxAmount: 0,
    retentionAmount,
    liquidAmount,
    total: subtotal,
  };
}

export function formatClp(value: number): string {
  return value.toLocaleString("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  });
}
