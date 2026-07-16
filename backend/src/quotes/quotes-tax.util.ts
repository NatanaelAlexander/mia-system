/** Tasas Chile vigentes (2026). Ajustar cuando cambie el año. */
export const IVA_RATE = 0.19;
export const RETENTION_RATE_2026 = 0.1525;

export type QuoteDocumentType = 'boleta' | 'factura';
export type PriceInputMode = 'gross' | 'liquid';

export interface SectionTotalsInput {
  itemPrices: number[];
  documentType: QuoteDocumentType;
  applyTax: boolean;
  priceInputMode?: PriceInputMode;
}

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

/**
 * Calcula totales de una sección de cotización.
 * - Factura + IVA: items = neto; IVA 19%; total = neto + IVA.
 * - Boleta + retención, modo gross: items = bruto; retención 15,25%; líquido = bruto − retención.
 * - Boleta + retención, modo liquid: items = líquido deseado; se hace gross-up al bruto.
 * - Sin impuesto: total = subtotal; en boleta liquidAmount = subtotal.
 */
export function calculateSectionTotals(input: SectionTotalsInput): SectionTotals {
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

  if (input.documentType === 'factura') {
    const taxAmount = roundMoney(subtotal * IVA_RATE);
    return {
      subtotal,
      taxAmount,
      retentionAmount: 0,
      liquidAmount: subtotal,
      total: roundMoney(subtotal + taxAmount),
    };
  }

  // Boleta con retención
  if (input.priceInputMode === 'liquid') {
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
