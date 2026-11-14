import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Pause,
  Play,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  fetchSharedMarketSnapshot,
  getInitialMarketSnapshot,
  subscribeMarketSnapshot,
  SharedMarketSnapshot,
} from '../lib/marketClient';

export interface MarketItem {
  id: string;
  category: 'crypto' | 'forex' | 'energy' | 'patagonia';
  symbol: string;
  name: string;
  value: string;
  subValue?: string;
  change: string;
  isPositive: boolean;
  source: string;
  sourceUrl?: string;
  details?: string;
  dataMode: 'live' | 'official_reference';
  updatedAt?: string;
}

function snapshotToTickerItems(snap: SharedMarketSnapshot): MarketItem[] {
  const btcItem: MarketItem = {
    id: 'btc-usd',
    category: 'crypto',
    symbol: 'BTC/USD',
    name: 'Bitcoin',
    value: `USD $${Number(snap.btc.usd).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`,
    subValue: `ARS $${Number(snap.btc.ars).toLocaleString('es-AR')}`,
    change: `${snap.btc.isPositive ? '+' : ''}${snap.btc.change24h}%`,
    isPositive: snap.btc.isPositive,
    source: snap.btc.source,
    sourceUrl: 'https://www.coingecko.com/en/coins/bitcoin',
    details: 'Cotización en tiempo real del activo digital líder con conversión directa a ARS.',
    dataMode: snap.btc.dataMode,
    updatedAt: snap.btc.updatedAt,
  };

  const currencyItems: MarketItem[] = snap.currencies
    .filter((c) => ['USD BLUE', 'USD MEP', 'USD CCL', 'USD OFIC', 'EUR/ARS'].includes(c.symbol))
    .map((c) => ({
      id: c.symbol.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      category: 'forex',
      symbol: c.symbol,
      name: c.name,
      value: `$ ${c.sell.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
      subValue: `Compra $${c.buy.toLocaleString('es-AR')}`,
      change: c.change,
      isPositive: c.isPositive,
      source: c.source,
      sourceUrl: 'https://dolarapi.com',
      details: `Referencia cambiaria para contratos y liquidación B2B (${c.dataMode === 'live' ? 'API en vivo' : 'referencia'}).`,
      dataMode: c.dataMode,
      updatedAt: c.updatedAt,
    }));

  const commodityItems: MarketItem[] = snap.patagonia.map((p) => {
    const isEnergy = ['BRENT', 'MEDANITO', 'GAS PGY'].includes(p.symbol);
    return {
      id: p.symbol.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      category: isEnergy ? 'energy' : 'patagonia',
      symbol: p.symbol,
      name: p.name,
      value: p.value,
      subValue: p.unit,
      change: p.change,
      isPositive: p.isPositive,
      source: p.source,
      sourceUrl: p.sourceUrl,
      details: `${p.name} · Fuente: ${p.source} (${p.dataMode === 'live' ? 'Tiempo real' : 'Referencia sectorial oficial'}).`,
      dataMode: p.dataMode,
      updatedAt: p.updatedAt,
    };
  });

  return [btcItem, ...currencyItems, ...commodityItems];
}

export default function WallStreetTicker() {
  const [snapshot, setSnapshot] = useState<SharedMarketSnapshot>(() => getInitialMarketSnapshot());
  const [isPaused, setIsPaused] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const items = useMemo(() => snapshotToTickerItems(snapshot), [snapshot]);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await fetchSharedMarketSnapshot(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsub = subscribeMarketSnapshot((next) => setSnapshot(next));
    fetchSharedMarketSnapshot(false);
    const interval = setInterval(() => {
      fetchSharedMarketSnapshot(false);
    }, 60000);
    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  const lastUpdatedText = snapshot.updatedAt
    ? new Date(snapshot.updatedAt).toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 pt-3 pb-1 select-none relative z-30">
      <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-[#0B0912] text-white shadow-sm overflow-hidden">
        <div className="px-4 py-2 flex items-center justify-between text-[11px] font-mono border-b border-white/10 bg-white/[0.02] text-slate-400">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-emerald-400 font-bold tracking-wide text-[11px] whitespace-nowrap">
              Terminal Financiera Patagonia · En Vivo
            </span>
            <span className="hidden sm:inline-block text-slate-600" aria-hidden="true">
              ·
            </span>
            <span className="hidden md:flex items-center gap-1.5 text-slate-400 text-[11px] truncate">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ICE Brent · DolarApi · CoinGecko · Ref. Oficial Sectorial
            </span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {lastUpdatedText && (
              <span className="hidden lg:inline-block text-slate-500 text-[11px] tabular-nums">
                Sinc: <span className="text-slate-300 font-semibold">{lastUpdatedText}</span>
              </span>
            )}
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              title="Actualizar cotizaciones en vivo"
              className="flex items-center gap-1.5 hover:text-white transition-colors text-slate-300 disabled:opacity-50 text-[11px] px-2 py-1 rounded hover:bg-white/5 whitespace-nowrap"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-purple-400' : ''}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
            <button
              onClick={() => setIsPaused(!isPaused)}
              title={isPaused ? 'Reanudar cinta' : 'Pausar cinta'}
              className="flex items-center gap-1.5 hover:text-white transition-colors text-slate-300 text-[11px] px-2 py-1 rounded hover:bg-white/5 whitespace-nowrap"
            >
              {isPaused ? (
                <Play className="w-3 h-3 text-emerald-400" />
              ) : (
                <Pause className="w-3 h-3 text-amber-400" />
              )}
              <span className="hidden sm:inline">{isPaused ? 'Reanudar' : 'Pausa'}</span>
            </button>
          </div>
        </div>

        <div
          className="relative overflow-hidden py-2 bg-gradient-to-r from-[#0d0a17] via-[#090710] to-[#0d0a17]"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-[#0B0912] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-[#0B0912] to-transparent z-10 pointer-events-none" />

          <div className={`animate-ticker ${isPaused ? 'ticker-paused' : ''} flex items-center gap-4`}>
            {[...items, ...items].map((item, idx) => {
              const isCrypto = item.category === 'crypto';
              return (
                <button
                  key={`${item.id}-${idx}`}
                  onClick={() => setSelectedItem(item)}
                  className={`group flex items-center gap-3 px-3.5 py-1.5 rounded-lg border transition-colors text-left whitespace-nowrap cursor-pointer ${
                    isCrypto
                      ? 'bg-amber-500/10 border-amber-500/30 hover:border-amber-400'
                      : item.category === 'energy'
                      ? 'bg-orange-500/5 border-orange-500/20 hover:border-orange-400'
                      : 'bg-white/5 border-white/10 hover:border-purple-400/50'
                  }`}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      {isCrypto && <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />}
                      <span className="font-mono font-bold text-xs tracking-wider text-slate-100">
                        {item.symbol}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">{item.name}</span>
                  </div>

                  <div className="flex flex-col text-right font-mono tabular-nums">
                    <span className="font-bold text-xs text-white">{item.value}</span>
                    {item.subValue && (
                      <span className="text-[10px] text-slate-400">{item.subValue}</span>
                    )}
                  </div>

                  <div
                    className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums font-bold ${
                      item.dataMode === 'official_reference'
                        ? 'bg-white/10 text-slate-300'
                        : item.isPositive
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {item.dataMode === 'live' &&
                      (item.isPositive ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3" />
                      ))}
                    {item.change}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {selectedItem && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-[#151221] border border-white/20 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center font-mono font-bold text-sm">
                  {selectedItem.symbol.slice(0, 3)}
                </div>
                <div>
                  <h4 className="font-bold text-lg leading-tight flex items-center gap-2">
                    {selectedItem.symbol}
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-mono tabular-nums font-semibold ${
                        selectedItem.isPositive
                          ? 'text-emerald-400 bg-emerald-500/20'
                          : 'text-rose-400 bg-rose-500/20'
                      }`}
                    >
                      {selectedItem.change}
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400">{selectedItem.name}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 font-mono text-sm">
              <div className="bg-[#1C182B] p-4 rounded-xl border border-white/10 flex items-center justify-between">
                <span className="text-slate-400 text-xs">Cotización / Valor:</span>
                <span className="text-xl font-bold text-white tabular-nums">{selectedItem.value}</span>
              </div>

              {selectedItem.subValue && (
                <div className="bg-[#1C182B] p-3 rounded-xl border border-white/5 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Unidad / Compra:</span>
                  <span className="text-slate-200 font-semibold tabular-nums">
                    {selectedItem.subValue}
                  </span>
                </div>
              )}

              {selectedItem.details && (
                <div className="text-xs text-slate-300 font-sans leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">
                  {selectedItem.details}
                </div>
              )}

              <div className="pt-2 border-t border-white/10 flex flex-col gap-1 text-[11px] text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Origen y modalidad:</span>
                  <span className="text-purple-300 font-semibold">
                    {selectedItem.dataMode === 'live' ? 'Feed En Vivo' : 'Referencia Oficial Sectorial'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Fuente:</span>
                  <span className="text-slate-200">{selectedItem.source}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              {selectedItem.sourceUrl && (
                <a
                  href={selectedItem.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-white/10 hover:bg-white/15 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  Verificar Fuente <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <button
                onClick={() => setSelectedItem(null)}
                className="px-5 py-2 bg-orange-500 hover:bg-orange-600 rounded-xl text-xs font-bold text-white transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
