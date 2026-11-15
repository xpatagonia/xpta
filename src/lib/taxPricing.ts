export type TaxDisplayMode = 'net' | 'gross' | 'both';

export const ALLOWED_TAX_RATES = [0, 10.5, 21, 27] as const;

export interface TaxBreakdown {
  netPrice: number;
  taxRatePercent: number;
  taxRateBps: number;
  taxAmount: number;
  grossPrice: number;
}

export interface CompanyServiceItem {
  id?: number;
  companyKey: string;
  serviceName: string;
  category: string;
  unitLabel: string;
  currency: 'ARS' | 'USD';
  netPrice: number;
  taxRatePercent: number;
  taxRateBps: number;
  taxAmount: number;
  grossPrice: number;
  taxDisplayMode: TaxDisplayMode;
  active: boolean;
}

export function normalizeTaxRatePercent(raw?: number | string | null): number {
  const num = Number(raw);
  if (!Number.isFinite(num) || num < 0) return 21;
  return Math.round(num * 100) / 100;
}

export function taxRatePercentToBps(taxRatePercent: number): number {
  return Math.max(0, Math.round(normalizeTaxRatePercent(taxRatePercent) * 100));
}

export function taxRateBpsToPercent(taxRateBps: number): number {
  if (!Number.isFinite(taxRateBps) || taxRateBps < 0) return 21;
  return Math.round((taxRateBps / 100) * 100) / 100;
}

export function calculateTaxBreakdownFromNet(
  netPriceInput: number,
  taxRatePercentInput: number = 21
): TaxBreakdown {
  const safeNet = Number.isFinite(netPriceInput) && netPriceInput > 0 ? netPriceInput : 0;
  const rate = normalizeTaxRatePercent(taxRatePercentInput);
  const netCents = Math.round(safeNet * 100);
  const rateBps = taxRatePercentToBps(rate);
  const taxCents = Math.round((netCents * rateBps) / 10000);
  const grossCents = netCents + taxCents;

  return {
    netPrice: netCents / 100,
    taxRatePercent: rate,
    taxRateBps: rateBps,
    taxAmount: taxCents / 100,
    grossPrice: grossCents / 100,
  };
}

export function calculateTaxBreakdownFromGross(
  grossPriceInput: number,
  taxRatePercentInput: number = 21
): TaxBreakdown {
  const safeGross = Number.isFinite(grossPriceInput) && grossPriceInput > 0 ? grossPriceInput : 0;
  const rate = normalizeTaxRatePercent(taxRatePercentInput);
  const rateBps = taxRatePercentToBps(rate);
  const grossCents = Math.round(safeGross * 100);
  const netCents =
    rateBps === 0 ? grossCents : Math.round((grossCents * 10000) / (10000 + rateBps));
  const taxCents = grossCents - netCents;

  return {
    netPrice: netCents / 100,
    taxRatePercent: rate,
    taxRateBps: rateBps,
    taxAmount: taxCents / 100,
    grossPrice: grossCents / 100,
  };
}

export function formatServicePrice(amount: number, currency: 'ARS' | 'USD' = 'ARS'): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const formatted = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: safe % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(safe);
  return currency === 'USD' ? `U$S ${formatted}` : `$${formatted} ARS`;
}

export function normalizeTaxDisplayMode(raw?: string | null): TaxDisplayMode {
  if (raw === 'gross' || raw === 'both') return raw;
  return 'net';
}

export function resolvePrimaryPriceLabel(
  item: Pick<CompanyServiceItem, 'netPrice' | 'grossPrice' | 'taxRatePercent' | 'currency' | 'unitLabel'>,
  mode: TaxDisplayMode
): { primary: string; secondary: string } {
  const unitSuffix = item.unitLabel ? ` / ${item.unitLabel}` : '';
  const netLabel = formatServicePrice(item.netPrice, item.currency);
  const grossLabel = formatServicePrice(item.grossPrice, item.currency);

  if (mode === 'gross') {
    return {
      primary: `${grossLabel}${unitSuffix}`,
      secondary: `IVA ${item.taxRatePercent}% incl. (Neto ${netLabel})`,
    };
  }
  if (mode === 'both') {
    return {
      primary: `${netLabel}${unitSuffix} + IVA`,
      secondary: `Final c/IVA (${item.taxRatePercent}%): ${grossLabel}`,
    };
  }
  return {
    primary: `${netLabel}${unitSuffix}`,
    secondary: item.taxRatePercent > 0 ? `+ IVA (${item.taxRatePercent}%) · Final ${grossLabel}` : 'Exento de IVA',
  };
}

/**
 * Semilla inicial de tarifas de referencia para los actores destacados del directorio,
 * editable y persistible por el Super Admin en la Tabla de Control.
 */
export function getDefaultSeedServicesForCompany(companyKey: string): CompanyServiceItem[] {
  const seedMap: Record<
    string,
    Array<{ name: string; category: string; unit: string; currency: 'ARS' | 'USD'; net: number; tax: number }>
  > = {
    'comp-petrosur': [
      { name: 'Provisión e inyección de fluidos de perforación', category: 'Petróleo y Gas', unit: 'Jornada', currency: 'ARS', net: 1450000, tax: 21 },
      { name: 'Control sólido y tratamiento de cutting en locación', category: 'Petróleo y Gas', unit: 'Día', currency: 'ARS', net: 890000, tax: 21 },
    ],
    'comp-metalurgica-sur': [
      { name: 'Fabricación de tanques API 650 (por tonelada)', category: 'Metalurgia', unit: 'Tn', currency: 'ARS', net: 2850000, tax: 21 },
      { name: 'Calderería pesada y soldadura ASME certificada', category: 'Metalurgia', unit: 'Hora', currency: 'ARS', net: 78000, tax: 21 },
    ],
    'serv-izajes-neuquen': [
      { name: 'Servicio de Grúa Hidráulica 120 Tn en yacimiento', category: 'Logística', unit: 'Hora', currency: 'ARS', net: 185000, tax: 21 },
      { name: 'Traslado especial en carretón cama baja RN 7 / RN 22', category: 'Logística', unit: 'Km', currency: 'ARS', net: 4200, tax: 10.5 },
    ],
    'prof-ing-paredes': [
      { name: 'Auditoría de impacto ambiental y plan de gestión PGAS', category: 'Ingeniería', unit: 'Servicio', currency: 'ARS', net: 620000, tax: 21 },
      { name: 'Dirección técnica e inspección HSEQ por jornada', category: 'Ingeniería', unit: 'Jornada', currency: 'ARS', net: 165000, tax: 21 },
    ],
  };

  const rows = seedMap[companyKey] || [];
  return rows.map((r, idx) => {
    const breakdown = calculateTaxBreakdownFromNet(r.net, r.tax);
    return {
      id: -(idx + 1),
      companyKey,
      serviceName: r.name,
      category: r.category,
      unitLabel: r.unit,
      currency: r.currency,
      netPrice: breakdown.netPrice,
      taxRatePercent: breakdown.taxRatePercent,
      taxRateBps: breakdown.taxRateBps,
      taxAmount: breakdown.taxAmount,
      grossPrice: breakdown.grossPrice,
      taxDisplayMode: 'net',
      active: true,
    };
  });
}
