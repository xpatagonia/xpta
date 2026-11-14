import { getApiUrl } from './apiConfig';

export type MarketDataMode = 'live' | 'official_reference';

export interface MarketCurrencyItem {
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

export interface MarketCommodityItem {
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

export interface MarketAlertItem {
  id: string;
  symbol: string;
  title: string;
  message: string;
  change: string;
  severity: 'up' | 'down' | 'info';
  dataMode: MarketDataMode;
}

export interface SharedMarketSnapshot {
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
  currencies: MarketCurrencyItem[];
  patagonia: MarketCommodityItem[];
  alerts: MarketAlertItem[];
}

const DEFAULT_SNAPSHOT: SharedMarketSnapshot = {
  updatedAt: new Date().toISOString(),
  brechaBluePct: 1.0,
  btc: {
    symbol: 'BTC',
    name: 'Bitcoin',
    usd: 81450,
    ars: 125430000,
    change24h: 1.25,
    isPositive: true,
    source: 'CoinGecko / Coinbase',
    dataMode: 'official_reference',
    updatedAt: new Date().toISOString(),
  },
  currencies: [
    { symbol: 'USD BLUE', name: 'Dólar Blue', buy: 1545, sell: 1565, change: '0.00%', changePct: 0, isPositive: true, source: 'DolarApi · Ámbito', dataMode: 'official_reference', updatedAt: new Date().toISOString() },
    { symbol: 'USD MEP', name: 'Dólar Bolsa MEP', buy: 1520, sell: 1535, change: '0.00%', changePct: 0, isPositive: true, source: 'DolarApi · BYMA', dataMode: 'official_reference', updatedAt: new Date().toISOString() },
    { symbol: 'USD CCL', name: 'Contado con Liqui', buy: 1570, sell: 1585, change: '0.00%', changePct: 0, isPositive: true, source: 'DolarApi · BYMA', dataMode: 'official_reference', updatedAt: new Date().toISOString() },
    { symbol: 'USD OFIC', name: 'Dólar Oficial', buy: 1500, sell: 1550, change: '0.00%', changePct: 0, isPositive: true, source: 'DolarApi · BNA', dataMode: 'official_reference', updatedAt: new Date().toISOString() },
    { symbol: 'EUR/ARS', name: 'Euro Oficial', buy: 1700, sell: 1715, change: '0.00%', changePct: 0, isPositive: true, source: 'DolarApi · BNA', dataMode: 'official_reference', updatedAt: new Date().toISOString() },
  ],
  patagonia: [
    { symbol: 'BRENT', name: 'Petróleo Brent Internacional', value: 'USD 74.80/bbl', numericValue: 74.8, change: 'Ref.', changePct: 0, isPositive: true, unit: 'USD/barril', source: 'ICE Benchmark', dataMode: 'official_reference', updatedAt: new Date().toISOString().slice(0, 10) },
    { symbol: 'MEDANITO', name: 'Crudo Medanito Neuquén', value: 'USD 69.40/bbl', numericValue: 69.4, change: 'Paridad', changePct: 0, isPositive: true, unit: 'USD/barril', source: 'Sec. Energía / Cuenca Neuquina', dataMode: 'official_reference', updatedAt: new Date().toISOString().slice(0, 10) },
    { symbol: 'GAS PGY', name: 'Gas Natural Cuenca Neuquina', value: 'USD 3.52/MMBtu', numericValue: 3.52, change: 'Plan Gas.Ar', changePct: 0, isPositive: true, unit: 'USD/MMBtu', source: 'Plan Gas.Ar / CAMMESA', dataMode: 'official_reference', updatedAt: new Date().toISOString().slice(0, 10) },
    { symbol: 'EÓLICA', name: 'Potencia Eólica Regional', value: '1.580 MW', numericValue: 1580, change: 'FC 51.4%', changePct: 0, isPositive: true, unit: 'SADI Patagónico', source: 'CAMMESA', dataMode: 'official_reference', updatedAt: new Date().toISOString().slice(0, 10) },
    { symbol: 'PESCA', name: 'Langostino L1/L2 Congelado', value: 'USD 6.85/kg', numericValue: 6.85, change: 'FOB Puerto', changePct: 0, isPositive: true, unit: 'USD/kg FOB', source: 'CAPIP', dataMode: 'official_reference', updatedAt: new Date().toISOString().slice(0, 10) },
    { symbol: 'LANA', name: 'Lana Merino Fina 19.5u', value: 'USD 6.45/kg', numericValue: 6.45, change: 'Base Peinada', changePct: 0, isPositive: true, unit: 'USD/kg Trelew', source: 'Fed. Lanera Argentina', dataMode: 'official_reference', updatedAt: new Date().toISOString().slice(0, 10) },
    { symbol: 'LITIO', name: 'Carbonato de Litio Li2CO3', value: 'USD 10,850/tn', numericValue: 10850, change: 'Grado Batería', changePct: 0, isPositive: true, unit: 'USD/tn', source: 'LME / Fastmarkets', dataMode: 'official_reference', updatedAt: new Date().toISOString().slice(0, 10) },
  ],
  alerts: [],
};

let currentSnapshot: SharedMarketSnapshot = DEFAULT_SNAPSHOT;
let lastFetchedAt = 0;
let inflightPromise: Promise<SharedMarketSnapshot> | null = null;
const listeners = new Set<(snap: SharedMarketSnapshot) => void>();

function notifyListeners(snap: SharedMarketSnapshot) {
  listeners.forEach((fn) => {
    try {
      fn(snap);
    } catch {
      // ignore subscriber errors
    }
  });
}

export function getInitialMarketSnapshot(): SharedMarketSnapshot {
  return currentSnapshot;
}

export function subscribeMarketSnapshot(listener: (snap: SharedMarketSnapshot) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export async function fetchSharedMarketSnapshot(forceRefresh = false): Promise<SharedMarketSnapshot> {
  const now = Date.now();
  if (!forceRefresh && now - lastFetchedAt < 45000 && lastFetchedAt > 0) {
    return currentSnapshot;
  }

  if (inflightPromise && !forceRefresh) {
    return inflightPromise;
  }

  inflightPromise = (async () => {
    try {
      const qs = forceRefresh ? '?refresh=1' : '';
      const res = await fetch(`${getApiUrl()}/api/market-data${qs}`, {
        signal: AbortSignal.timeout(4500),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.btc && Array.isArray(data.currencies)) {
          currentSnapshot = {
            ...DEFAULT_SNAPSHOT,
            ...data,
            patagonia: Array.isArray(data.patagonia) ? data.patagonia : DEFAULT_SNAPSHOT.patagonia,
            alerts: Array.isArray(data.alerts) ? data.alerts : [],
          };
          lastFetchedAt = Date.now();
          notifyListeners(currentSnapshot);
          return currentSnapshot;
        }
      }
    } catch {
      // Fall through to direct browser APIs
    }

    // Client fallback if backend is unreachable
    try {
      const [dolaresRes, btcRes] = await Promise.allSettled([
        fetch('https://dolarapi.com/v1/dolares', { signal: AbortSignal.timeout(3000) }),
        fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,ars&include_24hr_change=true',
          { signal: AbortSignal.timeout(3000) }
        ),
      ]);

      const next: SharedMarketSnapshot = {
        ...currentSnapshot,
        updatedAt: new Date().toISOString(),
      };

      if (dolaresRes.status === 'fulfilled' && dolaresRes.value.ok) {
        const dolares: any[] = await dolaresRes.value.json();
        const findCasa = (casa: string) => dolares.find((d) => d.casa === casa);
        const blue = findCasa('blue');
        const mep = findCasa('bolsa');
        const ccl = findCasa('contadoconliqui');
        const oficial = findCasa('oficial');

        next.currencies = next.currencies.map((c) => {
          const match =
            c.symbol === 'USD BLUE'
              ? blue
              : c.symbol === 'USD MEP'
              ? mep
              : c.symbol === 'USD CCL'
              ? ccl
              : c.symbol === 'USD OFIC'
              ? oficial
              : null;
          if (!match) return c;
          return {
            ...c,
            buy: Number(match.compra) || c.buy,
            sell: Number(match.venta) || c.sell,
            dataMode: 'live',
            updatedAt: match.fechaActualizacion || new Date().toISOString(),
          };
        });

        if (blue?.venta && oficial?.venta) {
          next.brechaBluePct = Number((((blue.venta - oficial.venta) / oficial.venta) * 100).toFixed(1));
        }
      }

      if (btcRes.status === 'fulfilled' && btcRes.value.ok) {
        const btcJson: any = await btcRes.value.json();
        if (btcJson?.bitcoin?.usd) {
          const ch = Number((btcJson.bitcoin.usd_24h_change || 0).toFixed(2));
          next.btc = {
            ...next.btc,
            usd: btcJson.bitcoin.usd,
            ars: btcJson.bitcoin.ars || Math.round(btcJson.bitcoin.usd * 1540),
            change24h: ch,
            isPositive: ch >= 0,
            source: 'CoinGecko Live API',
            dataMode: 'live',
            updatedAt: new Date().toISOString(),
          };
        }
      }

      currentSnapshot = next;
      lastFetchedAt = Date.now();
      notifyListeners(currentSnapshot);
    } catch {
      // Preserve last known snapshot
    }

    return currentSnapshot;
  })();

  try {
    return await inflightPromise;
  } finally {
    inflightPromise = null;
  }
}
