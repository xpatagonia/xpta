export type MarketDataMode = "live" | "official_reference";

export interface MarketCurrencyEntry {
  symbol: string;
  name: string;
  buy: number;
  sell: number;
  change: string;
  changePct: number;
  isPositive: boolean;
  source: string;
  dataMode: MarketDataMode;
  updatedAt: string;
}

export interface MarketCommodityEntry {
  symbol: string;
  name: string;
  value: string;
  numericValue?: number;
  change: string;
  changePct: number;
  isPositive: boolean;
  unit: string;
  source: string;
  sourceUrl?: string;
  dataMode: MarketDataMode;
  updatedAt: string;
}

export interface MarketVariationAlert {
  id: string;
  symbol: string;
  title: string;
  message: string;
  change: string;
  severity: "up" | "down" | "info";
  dataMode: MarketDataMode;
}

export interface MarketSnapshotPayload {
  updatedAt: string;
  brechaBluePct: number;
  btc: {
    symbol: string;
    name: string;
    usd: number;
    ars: number;
    change24h: number;
    isPositive: boolean;
    source: string;
    dataMode: MarketDataMode;
    updatedAt: string;
  };
  currencies: MarketCurrencyEntry[];
  patagonia: MarketCommodityEntry[];
  alerts: MarketVariationAlert[];
}

interface PreviousRatesCache {
  currencies: Record<string, number>;
  brentPrevClose: number | null;
}

const DEFAULT_PREVIOUS_SELL: Record<string, number> = {
  "USD BLUE": 1555,
  "USD MEP": 1535,
  "USD CCL": 1578,
  "USD OFIC": 1548,
  "USD MAY": 1512,
  "EUR/ARS": 1710,
  "BRL/ARS": 288,
};

let prevRatesState: PreviousRatesCache = {
  currencies: { ...DEFAULT_PREVIOUS_SELL },
  brentPrevClose: 74.12,
};

let cachedPayload: { timestamp: number; data: MarketSnapshotPayload } | null = null;
const CACHE_TTL_MS = 60 * 1000;

export function computePctChange(current: number, baseline: number): {
  pct: number;
  label: string;
  isPositive: boolean;
} {
  if (!Number.isFinite(current) || !Number.isFinite(baseline) || baseline <= 0) {
    return { pct: 0, label: "0.00%", isPositive: true };
  }
  const raw = ((current - baseline) / baseline) * 100;
  const pct = Number(raw.toFixed(2));
  const isPositive = pct >= 0;
  return {
    pct,
    label: `${isPositive ? "+" : ""}${pct.toFixed(2)}%`,
    isPositive,
  };
}

export function computeBrechaBluePct(blueSell: number, oficialSell: number): number {
  if (!Number.isFinite(blueSell) || !Number.isFinite(oficialSell) || oficialSell <= 0) return 0;
  return Number((((blueSell - oficialSell) / oficialSell) * 100).toFixed(1));
}

export function buildMarketAlerts(params: {
  btcChange24h: number;
  btcUsd: number;
  brentPrice: number;
  brentChangePct: number;
  brentMode: MarketDataMode;
  currencies: MarketCurrencyEntry[];
  brechaBluePct: number;
}): MarketVariationAlert[] {
  const alerts: MarketVariationAlert[] = [];

  if (Math.abs(params.brentChangePct) >= 0.8) {
    const pos = params.brentChangePct >= 0;
    alerts.push({
      id: "alert-brent",
      symbol: "BRENT",
      title: `Crudo Brent ${pos ? "al alza" : "en baja"}`,
      message: `Cotiza USD ${params.brentPrice.toFixed(2)}/bbl (${pos ? "+" : ""}${params.brentChangePct.toFixed(2)}%) — impacta costos de logística y referencia Medanito.`,
      change: `${pos ? "+" : ""}${params.brentChangePct.toFixed(2)}%`,
      severity: pos ? "up" : "down",
      dataMode: params.brentMode,
    });
  }

  if (Math.abs(params.btcChange24h) >= 1.5) {
    const pos = params.btcChange24h >= 0;
    alerts.push({
      id: "alert-btc",
      symbol: "BTC",
      title: `Bitcoin ${pos ? "repunta" : "retrocede"} en 24h`,
      message: `Opera en USD $${params.btcUsd.toLocaleString("en-US")} (${pos ? "+" : ""}${params.btcChange24h.toFixed(2)}%).`,
      change: `${pos ? "+" : ""}${params.btcChange24h.toFixed(2)}%`,
      severity: pos ? "up" : "down",
      dataMode: "live",
    });
  }

  const blue = params.currencies.find((c) => c.symbol === "USD BLUE");
  const mep = params.currencies.find((c) => c.symbol === "USD MEP");

  if (blue && Math.abs(blue.changePct) >= 0.5) {
    alerts.push({
      id: "alert-blue",
      symbol: "USD BLUE",
      title: `Movimiento en Dólar Libre`,
      message: `Venta $${blue.sell.toLocaleString("es-AR")} (${blue.change}) respecto a referencia anterior.`,
      change: blue.change,
      severity: blue.isPositive ? "up" : "down",
      dataMode: blue.dataMode,
    });
  } else if (mep && Math.abs(mep.changePct) >= 0.5) {
    alerts.push({
      id: "alert-mep",
      symbol: "USD MEP",
      title: `Variación Dólar MEP (BYMA)`,
      message: `Venta $${mep.sell.toLocaleString("es-AR")} (${mep.change}).`,
      change: mep.change,
      severity: mep.isPositive ? "up" : "down",
      dataMode: mep.dataMode,
    });
  }

  if (params.brechaBluePct >= 10) {
    alerts.push({
      id: "alert-brecha",
      symbol: "BRECHA",
      title: `Brecha Blue vs Oficial en ${params.brechaBluePct}%`,
      message: `Seguimiento clave para importación de insumos industriales y facturación B2B.`,
      change: `${params.brechaBluePct}%`,
      severity: "info",
      dataMode: "live",
    });
  } else {
    alerts.push({
      id: "alert-brecha-comp",
      symbol: "BRECHA",
      title: `Brecha Blue / Oficial comprimida (${params.brechaBluePct}%)`,
      message: `Diferencial cambiario acotado para presupuestar fletes y contratos RFQ en pesos/USD.`,
      change: `${params.brechaBluePct}%`,
      severity: "info",
      dataMode: "live",
    });
  }

  return alerts.slice(0, 3);
}

async function fetchLiveBrentQuote(): Promise<{
  price: number;
  prevClose: number;
  changePct: number;
  changeLabel: string;
  isPositive: boolean;
  dataMode: MarketDataMode;
  updatedAt: string;
  source: string;
}> {
  try {
    const res = await fetch(
      "https://query1.finance.yahoo.com/v8/finance/chart/BZ=F?range=2d&interval=1d",
      {
        headers: { "User-Agent": "xPatagonia-MarketTerminal/1.0" },
        signal: AbortSignal.timeout(3500),
      }
    );
    if (res.ok) {
      const json: any = await res.json();
      const meta = json?.chart?.result?.[0]?.meta;
      const price = Number(meta?.regularMarketPrice);
      const prev = Number(meta?.chartPreviousClose || meta?.previousClose || prevRatesState.brentPrevClose || 74.12);
      if (Number.isFinite(price) && price > 10) {
        prevRatesState.brentPrevClose = prev;
        const delta = computePctChange(price, prev);
        const marketTime = meta?.regularMarketTime
          ? new Date(meta.regularMarketTime * 1000).toISOString()
          : new Date().toISOString();
        return {
          price: Number(price.toFixed(2)),
          prevClose: prev,
          changePct: delta.pct,
          changeLabel: delta.label,
          isPositive: delta.isPositive,
          dataMode: "live",
          updatedAt: marketTime,
          source: "ICE Brent Futures (BZ=F)",
        };
      }
    }
  } catch {
    // Fallback cleanly below
  }

  const fallbackPrice = prevRatesState.brentPrevClose || 74.8;
  return {
    price: fallbackPrice,
    prevClose: fallbackPrice,
    changePct: 0,
    changeLabel: "0.00%",
    isPositive: true,
    dataMode: "official_reference",
    updatedAt: new Date().toISOString(),
    source: "ICE Benchmark (Referencia)",
  };
}

export async function getMarketSnapshot(forceRefresh = false): Promise<MarketSnapshotPayload> {
  const now = Date.now();
  if (!forceRefresh && cachedPayload && now - cachedPayload.timestamp < CACHE_TTL_MS) {
    return cachedPayload.data;
  }

  const [dolaresRes, cotizacionesRes, cgRes, brentData] = await Promise.allSettled([
    fetch("https://dolarapi.com/v1/dolares", { signal: AbortSignal.timeout(4000) }),
    fetch("https://dolarapi.com/v1/cotizaciones", { signal: AbortSignal.timeout(4000) }),
    fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,ars&include_24hr_change=true",
      { signal: AbortSignal.timeout(4000) }
    ),
    fetchLiveBrentQuote(),
  ]);

  let dolares: any[] = [];
  if (dolaresRes.status === "fulfilled" && dolaresRes.value.ok) {
    try {
      dolares = await dolaresRes.value.json();
    } catch {
      dolares = [];
    }
  }

  let cotizaciones: any[] = [];
  if (cotizacionesRes.status === "fulfilled" && cotizacionesRes.value.ok) {
    try {
      cotizaciones = await cotizacionesRes.value.json();
    } catch {
      cotizaciones = [];
    }
  }

  let btc = {
    usd: 81450,
    usd_24h_change: 1.25,
    ars: 125000000,
    source: "CoinGecko / Coinbase",
    dataMode: "official_reference" as MarketDataMode,
    updatedAt: new Date().toISOString(),
  };

  if (cgRes.status === "fulfilled" && cgRes.value.ok) {
    try {
      const cgData: any = await cgRes.value.json();
      if (cgData?.bitcoin?.usd) {
        btc = {
          usd: cgData.bitcoin.usd,
          usd_24h_change: Number((cgData.bitcoin.usd_24h_change || 0).toFixed(2)),
          ars: cgData.bitcoin.ars || Math.round(cgData.bitcoin.usd * 1540),
          source: "CoinGecko API",
          dataMode: "live",
          updatedAt: new Date().toISOString(),
        };
      }
    } catch {
      // ignore
    }
  } else {
    try {
      const cbRes = await fetch("https://api.coinbase.com/v2/prices/spot?currency=USD", {
        signal: AbortSignal.timeout(2500),
      });
      if (cbRes.ok) {
        const cbData: any = await cbRes.json();
        const val = parseFloat(cbData.data?.amount);
        if (!isNaN(val)) {
          btc.usd = val;
          btc.ars = Math.round(val * 1540);
          btc.source = "Coinbase Spot";
          btc.dataMode = "live";
        }
      }
    } catch {
      // ignore
    }
  }

  const pickRate = (
    symbol: string,
    name: string,
    sourceName: string,
    raw: any,
    fallbackBuy: number,
    fallbackSell: number
  ): MarketCurrencyEntry => {
    const buy = Number(raw?.compra) || fallbackBuy;
    const sell = Number(raw?.venta) || fallbackSell;
    const baseline = prevRatesState.currencies[symbol] || sell;
    const delta = computePctChange(sell, baseline);
    if (Number.isFinite(sell) && sell > 0 && raw?.venta) {
      // Update rolling baseline only if change is notable, keeping intraday comparison useful
      if (Math.abs(delta.pct) >= 3) {
        prevRatesState.currencies[symbol] = sell;
      }
    }
    const mode: MarketDataMode = raw?.venta ? "live" : "official_reference";
    return {
      symbol,
      name,
      buy,
      sell,
      change: delta.label,
      changePct: delta.pct,
      isPositive: delta.isPositive,
      source: sourceName,
      dataMode: mode,
      updatedAt: raw?.fechaActualizacion || new Date().toISOString(),
    };
  };

  const blueRaw = dolares.find((d) => d.casa === "blue");
  const oficialRaw = dolares.find((d) => d.casa === "oficial");
  const mepRaw = dolares.find((d) => d.casa === "bolsa");
  const cclRaw = dolares.find((d) => d.casa === "contadoconliqui");
  const mayoristaRaw = dolares.find((d) => d.casa === "mayorista");
  const eurRaw = cotizaciones.find((c) => c.moneda === "EUR");
  const brlRaw = cotizaciones.find((c) => c.moneda === "BRL");

  const currencies: MarketCurrencyEntry[] = [
    pickRate("USD BLUE", "Dólar Blue", "DolarApi · Ámbito", blueRaw, 1545, 1565),
    pickRate("USD MEP", "Dólar Bolsa MEP", "DolarApi · BYMA", mepRaw, 1520, 1535),
    pickRate("USD CCL", "Contado con Liqui", "DolarApi · BYMA", cclRaw, 1570, 1585),
    pickRate("USD OFIC", "Dólar Oficial", "DolarApi · BNA / BCRA", oficialRaw, 1500, 1550),
    pickRate("USD MAY", "Dólar Mayorista", "DolarApi · MAE", mayoristaRaw, 1495, 1515),
    pickRate("EUR/ARS", "Euro Oficial", "DolarApi · Banco Nación", eurRaw, 1700, 1715),
    pickRate("BRL/ARS", "Real Brasileño", "DolarApi", brlRaw, 275, 288),
  ];

  const brent =
    brentData.status === "fulfilled"
      ? brentData.value
      : {
          price: 74.8,
          prevClose: 74.8,
          changePct: 0,
          changeLabel: "0.00%",
          isPositive: true,
          dataMode: "official_reference" as MarketDataMode,
          updatedAt: new Date().toISOString(),
          source: "ICE Benchmark (Referencia)",
        };

  // Medanito historically tracks Brent minus export/quality differential (~7.2% discount to Brent)
  const medanitoEstimated = Number((brent.price * 0.928).toFixed(2));
  const referenceDateLabel = new Date().toISOString().slice(0, 10);

  const patagonia: MarketCommodityEntry[] = [
    {
      symbol: "BRENT",
      name: "Petróleo Brent Internacional",
      value: `USD ${brent.price.toFixed(2)}/bbl`,
      numericValue: brent.price,
      change: brent.changeLabel,
      changePct: brent.changePct,
      isPositive: brent.isPositive,
      unit: "USD/barril",
      source: brent.source,
      sourceUrl: "https://finance.yahoo.com/quote/BZ=F",
      dataMode: brent.dataMode,
      updatedAt: brent.updatedAt,
    },
    {
      symbol: "MEDANITO",
      name: "Crudo Medanito Neuquén",
      value: `USD ${medanitoEstimated.toFixed(2)}/bbl`,
      numericValue: medanitoEstimated,
      change: brent.changeLabel,
      changePct: brent.changePct,
      isPositive: brent.isPositive,
      unit: "USD/barril (Paridad Brent -7.2%)",
      source: "Sec. Energía / Cuenca Neuquina",
      dataMode: brent.dataMode === "live" ? "live" : "official_reference",
      updatedAt: brent.updatedAt,
    },
    {
      symbol: "GAS PGY",
      name: "Gas Natural Cuenca Neuquina",
      value: "USD 3.52/MMBtu",
      numericValue: 3.52,
      change: "Plan Gas.Ar",
      changePct: 0,
      isPositive: true,
      unit: "USD/MMBtu",
      source: "Plan Gas.Ar · ENARSA / CAMMESA",
      dataMode: "official_reference",
      updatedAt: referenceDateLabel,
    },
    {
      symbol: "EÓLICA",
      name: "Potencia Eólica Regional",
      value: "1.580 MW",
      numericValue: 1580,
      change: "FC 51.4%",
      changePct: 0,
      isPositive: true,
      unit: "SADI Patagónico",
      source: "CAMMESA · Parques Chubut / Santa Cruz",
      dataMode: "official_reference",
      updatedAt: referenceDateLabel,
    },
    {
      symbol: "PESCA",
      name: "Langostino L1/L2 Congelado",
      value: "USD 6.85/kg",
      numericValue: 6.85,
      change: "FOB Puerto",
      changePct: 0,
      isPositive: true,
      unit: "USD/kg FOB",
      source: "CAPIP · Cámara Pesquera Patagónica",
      dataMode: "official_reference",
      updatedAt: referenceDateLabel,
    },
    {
      symbol: "LANA",
      name: "Lana Merino Fina 19.5u",
      value: "USD 6.45/kg",
      numericValue: 6.45,
      change: "Base Peinada",
      changePct: 0,
      isPositive: true,
      unit: "USD/kg Trelew",
      source: "Federación Lanera Argentina",
      dataMode: "official_reference",
      updatedAt: referenceDateLabel,
    },
    {
      symbol: "LITIO",
      name: "Carbonato de Litio Li2CO3",
      value: "USD 10,850/tn",
      numericValue: 10850,
      change: "Grado Batería",
      changePct: 0,
      isPositive: true,
      unit: "USD/tonelada",
      source: "LME / Fastmarkets Ref.",
      dataMode: "official_reference",
      updatedAt: referenceDateLabel,
    },
  ];

  const blueSell = currencies.find((c) => c.symbol === "USD BLUE")?.sell || 1565;
  const oficialSell = currencies.find((c) => c.symbol === "USD OFIC")?.sell || 1550;
  const brechaBluePct = computeBrechaBluePct(blueSell, oficialSell);

  const alerts = buildMarketAlerts({
    btcChange24h: btc.usd_24h_change,
    btcUsd: btc.usd,
    brentPrice: brent.price,
    brentChangePct: brent.changePct,
    brentMode: brent.dataMode,
    currencies,
    brechaBluePct,
  });

  const payload: MarketSnapshotPayload = {
    updatedAt: new Date().toISOString(),
    brechaBluePct,
    btc: {
      symbol: "BTC",
      name: "Bitcoin",
      usd: btc.usd,
      ars: btc.ars,
      change24h: btc.usd_24h_change,
      isPositive: btc.usd_24h_change >= 0,
      source: btc.source,
      dataMode: btc.dataMode,
      updatedAt: btc.updatedAt,
    },
    currencies,
    patagonia,
    alerts,
  };

  cachedPayload = { timestamp: now, data: payload };
  return payload;
}
