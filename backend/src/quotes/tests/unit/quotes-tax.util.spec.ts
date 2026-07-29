import {
  calculateSectionTotals,
  IVA_RATE,
} from '../../quotes-tax.util';

describe('quotes-tax.util (unit)', () => {
  it('sin impuesto: total = subtotal', () => {
    const result = calculateSectionTotals({
      itemPrices: [100, 50],
      documentType: 'factura',
      applyTax: false,
    });
    expect(result.subtotal).toBe(150);
    expect(result.taxAmount).toBe(0);
    expect(result.total).toBe(150);
  });

  it('factura con IVA 19%', () => {
    const result = calculateSectionTotals({
      itemPrices: [1000],
      documentType: 'factura',
      applyTax: true,
    });
    expect(result.subtotal).toBe(1000);
    expect(result.taxAmount).toBe(1000 * IVA_RATE);
    expect(result.total).toBe(1000 + 1000 * IVA_RATE);
  });
});
