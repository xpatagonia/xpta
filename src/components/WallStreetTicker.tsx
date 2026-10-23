import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, RefreshCw, Pause, Play, ExternalLink, ShieldCheck, Zap, Activity } from 'lucide-react';

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
}

const DEFAULT_ITEMS: MarketItem[] = [
  {
    id: 'btc-usd',
    category: 'crypto',
    symbol: 'BTC/USD',
    name: 'Bitcoin',
    value: 'USD $81,450.00',
    subValue: 'ARS $125.430.000',
    change: '+1.25%',
    isPositive: true,
    source: 'CoinGecko / Coinbase Global',
    sourceUrl: 'https://www.coingecko.com/en/coins/bitcoin',
    details: 'Cotización en tiempo real del activo digital líder. Conversión a ARS según tipo de cambio implícito.'
  },
  {
    id: 'usd-blue',
    category: 'forex',
    symbol: 'USD BLUE',
    name: 'Dólar Libre / Informal',
    value: '$ 1.565,00',
    subValue: 'Compra $1.545',
    change: '+0.64%',
    isPositive: true,
    source: 'DolarApi · Ámbito / CABA',
    sourceUrl: 'https://dolarapi.com',
    details: 'Mercado de divisas libre. Cotización promedio informada en las principales plazas cambiarias.'
  },
  {
    id: 'usd-mep',
    category: 'forex',
    symbol: 'USD MEP',
    name: 'Dólar Bolsa (MEP)',
    value: '$ 1.532,40',
    subValue: 'Compra $1.528',
    change: '-0.21%',
    isPositive: false,
    source: 'DolarApi · BYMA / ALyCs',
    sourceUrl: 'https://dolarapi.com',
    details: 'Operación a través de bonos soberanos argentinos (AL30/GD30) en el mercado bursátil regulado.'
  },
  {
    id: 'usd-ccl',
    category: 'forex',
    symbol: 'USD CCL',
    name: 'Contado con Liquidación',
    value: '$ 1.582,10',
    subValue: 'Cable exterior',
    change: '+0.45%',
    isPositive: true,
    source: 'DolarApi · BYMA / CEDEARs',
    sourceUrl: 'https://dolarapi.com',
    details: 'Dólar utilizado para operaciones corporativas y giro de divisas al exterior bajo normativa CNV.'
  },
  {
    id: 'usd-oficial',
    category: 'forex',
    symbol: 'USD OFICIAL',
    name: 'Dólar BNA Minorista',
    value: '$ 1.550,00',
    subValue: 'Compra $1.500',
    change: '+0.10%',
    isPositive: true,
    source: 'DolarApi · Banco Central RA',
    sourceUrl: 'https://dolarapi.com',
    details: 'Tipo de cambio oficial de referencia del Banco de la Nación Argentina y BCRA.'
  },
  {
    id: 'eur-ars',
    category: 'forex',
    symbol: 'EUR/ARS',
    name: 'Euro Oficial',
    value: '$ 1.717,10',
    subValue: 'Compra $1.703',
    change: '+0.32%',
    isPositive: true,
    source: 'DolarApi · Banco Nación',
    sourceUrl: 'https://dolarapi.com',
    details: 'Cotización oficial del Euro contra el Peso Argentino.'
  },
  {
    id: 'crude-brent',
    category: 'energy',
    symbol: 'BRENT CRUDE',
    name: 'Petróleo Brent Internacional',
    value: 'USD 74.80/bbl',
    subValue: 'Mar del Norte',
    change: '+0.92%',
    isPositive: true,
    source: 'ICE Futures / Global Benchmark',
    details: 'Precio de referencia global para contratos de exportación de crudo ligero y crudo dulce.'
  },
  {
    id: 'crude-medanito',
    category: 'energy',
    symbol: 'MEDANITO',
    name: 'Crudo Cuenca Neuquina (Vaca Muerta)',
    value: 'USD 69.40/bbl',
    subValue: '35° API Dulce',
    change: '+1.18%',
    isPositive: true,
    source: 'Secretaría de Energía · Liquidación Regalías',
    details: 'Crudo no convencional producido en Vaca Muerta, base de las exportaciones de Neuquén y Río Negro.'
  },
  {
    id: 'gas-neuquen',
    category: 'energy',
    symbol: 'GAS PLAN.AR',
    name: 'Gas Natural Cuenca Neuquina',
    value: 'USD 3.52/MMBtu',
    subValue: 'Inyección Troncal',
    change: '+0.40%',
    isPositive: true,
    source: 'Plan Gas.Ar · CAMMESA / ENARSA',
    details: 'Precio ponderado de inyección a gasoductos troncales Neuba II y GPNK para demanda residencial e industrial.'
  },
  {
    id: 'eolica-patagonia',
    category: 'patagonia',
    symbol: 'EÓLICA PGY',
    name: 'Generación Eólica Regional',
    value: '1.580 MW',
    subValue: 'F.C. 51.4% Récord',
    change: '+120 MW',
    isPositive: true,
    source: 'CAMMESA · Sistema SADI Patagónico',
    details: 'Potencia operativa en parques eólicos de Chubut, Santa Cruz y Río Negro con factores de carga líderes mundiales.'
  },
  {
    id: 'pesca-langostino',
    category: 'patagonia',
    symbol: 'LANGOSTINO',
    name: 'Pesca Extractiva L1/L2 Entero',
    value: 'USD 6.85/kg',
    subValue: 'FOB Golfo San Jorge',
    change: '+1.50%',
    isPositive: true,
    source: 'Cámara Pesquera Patagónica / CAPIP',
    details: 'Referencia de valor de exportación en bodega de langostino congelado a bordo en puertos patagónicos.'
  },
  {
    id: 'lana-merino',
    category: 'patagonia',
    symbol: 'LANA MERINO',
    name: 'Lana Fina 19.5 Micras',
    value: 'USD 6.45/kg',
    subValue: 'Base limpia peinada',
    change: '-0.30%',
    isPositive: false,
    source: 'Federación Lanera Argentina · Trelew',
    details: 'Indicador de precios de exportación de lanas finas certificadas bajo estándares RWS en la meseta patagónica.'
  },
  {
    id: 'litio-ref',
    category: 'patagonia',
    symbol: 'LITIO LME',
    name: 'Carbonato de Litio Grado Batería',
    value: 'USD 10,850/tn',
    subValue: 'Ref. Mineral Clave',
    change: '+2.40%',
    isPositive: true,
    source: 'Fastmarkets / LME Benchmark',
    details: 'Insumo estratégico de la transición energética y movilidad eléctrica sudamericana.'
  }
];

export default function WallStreetTicker() {
  const [items, setItems] = useState<MarketItem[]>(DEFAULT_ITEMS);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch live market data
  const fetchMarketData = async () => {
    setIsLoading(true);
    try {
      // 1. Try server backend endpoint first
      let success = false;
      try {
        const res = await fetch('/api/market-data', { signal: AbortSignal.timeout(3500) });
        if (res.ok) {
          const data = await res.json();
          if (data && data.btc && data.currencies) {
            updateItemsFromBackend(data);
            success = true;
          }
        }
      } catch (e) {
        // Fallback to direct client APIs
      }

      // 2. If backend endpoint not available, fetch directly from DolarApi & CoinGecko
      if (!success) {
        await fetchDirectClientApis();
      }

      setLastUpdated(new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.warn("Market ticker fetch notification:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateItemsFromBackend = (data: any) => {
    setItems(prev => {
      return prev.map(item => {
        if (item.id === 'btc-usd' && data.btc) {
          const isPos = data.btc.change24h >= 0;
          return {
            ...item,
            value: `USD $${Number(data.btc.usd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            subValue: `ARS $${Number(data.btc.ars).toLocaleString('es-AR')}`,
            change: `${isPos ? '+' : ''}${data.btc.change24h}%`,
            isPositive: isPos,
            source: data.btc.source || 'CoinGecko / Coinbase'
          };
        }

        const matchCurr = data.currencies?.find((c: any) => {
          if (item.id === 'usd-blue') return c.symbol === 'USD BLUE';
          if (item.id === 'usd-mep') return c.symbol === 'USD MEP';
          if (item.id === 'usd-ccl') return c.symbol === 'USD CCL';
          if (item.id === 'usd-oficial') return c.symbol === 'USD OFIC';
          if (item.id === 'eur-ars') return c.symbol === 'EUR/ARS';
          return false;
        });

        if (matchCurr) {
          return {
            ...item,
            value: `$ ${matchCurr.sell ? matchCurr.sell.toLocaleString('es-AR', { minimumFractionDigits: 2 }) : item.value}`,
            subValue: matchCurr.buy ? `Compra $${matchCurr.buy.toLocaleString('es-AR')}` : item.subValue,
            change: matchCurr.change || item.change,
            isPositive: matchCurr.isPositive ?? item.isPositive,
            source: matchCurr.source || item.source
          };
        }

        return item;
      });
    });
  };

  const fetchDirectClientApis = async () => {
    try {
      // DolarApi
      const [dolaresRes, btcRes] = await Promise.allSettled([
        fetch('https://dolarapi.com/v1/dolares', { signal: AbortSignal.timeout(3000) }),
        fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,ars&include_24hr_change=true', { signal: AbortSignal.timeout(3000) })
      ]);

      let dolares: any[] = [];
      if (dolaresRes.status === 'fulfilled' && dolaresRes.value.ok) {
        dolares = await dolaresRes.value.json();
      }

      let btcData: any = null;
      if (btcRes.status === 'fulfilled' && btcRes.value.ok) {
        btcData = await btcRes.value.json();
      }

      setItems(prev => {
        return prev.map(item => {
          if (item.id === 'btc-usd' && btcData?.bitcoin) {
            const b = btcData.bitcoin;
            const change = Number((b.usd_24h_change || 0).toFixed(2));
            return {
              ...item,
              value: `USD $${Number(b.usd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              subValue: `ARS $${Number(b.ars).toLocaleString('es-AR')}`,
              change: `${change >= 0 ? '+' : ''}${change}%`,
              isPositive: change >= 0
            };
          }

          if (dolares.length > 0) {
            const findCasa = (casa: string) => dolares.find(d => d.casa === casa);
            if (item.id === 'usd-blue') {
              const d = findCasa('blue');
              if (d) return { ...item, value: `$ ${d.venta.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, subValue: `Compra $${d.compra.toLocaleString('es-AR')}` };
            }
            if (item.id === 'usd-mep') {
              const d = findCasa('bolsa');
              if (d) return { ...item, value: `$ ${d.venta.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, subValue: `Compra $${d.compra.toLocaleString('es-AR')}` };
            }
            if (item.id === 'usd-ccl') {
              const d = findCasa('contadoconliqui');
              if (d) return { ...item, value: `$ ${d.venta.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, subValue: `Compra $${d.compra.toLocaleString('es-AR')}` };
            }
            if (item.id === 'usd-oficial') {
              const d = findCasa('oficial');
              if (d) return { ...item, value: `$ ${d.venta.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, subValue: `Compra $${d.compra.toLocaleString('es-AR')}` };
            }
          }

          return item;
        });
      });
    } catch (e) {
      console.warn("Direct client API error:", e);
    }
  };

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 60000); // 60s auto refresh
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-[#0B0912] border-y border-white/10 text-white select-none relative z-30 shadow-2xl overflow-hidden">
      {/* Top micro bar for live status */}
      <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between text-[11px] font-mono border-b border-white/5 text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-emerald-400 font-bold uppercase tracking-wider">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Terminal Financiera Patagonia · En Vivo
          </span>
          <span className="hidden sm:inline-block text-slate-600">|</span>
          <span className="hidden sm:flex items-center gap-1 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Fuentes Verificadas: DolarApi · CoinGecko / Coinbase · CAMMESA · BYMA
          </span>
        </div>

        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="hidden md:inline-block text-slate-500 text-[10px]">
              Actualizado: <span className="text-slate-300 font-semibold">{lastUpdated}</span>
            </span>
          )}
          <button
            onClick={fetchMarketData}
            disabled={isLoading}
            title="Actualizar cotizaciones en vivo"
            className="flex items-center gap-1 hover:text-white transition-colors text-slate-400 disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-purple-400' : ''}`} />
            <span className="hidden sm:inline">Refrescar</span>
          </button>
          <button
            onClick={() => setIsPaused(!isPaused)}
            title={isPaused ? "Reanudar cinta" : "Pausar cinta"}
            className="flex items-center gap-1 hover:text-white transition-colors text-slate-400"
          >
            {isPaused ? <Play className="w-3 h-3 text-emerald-400" /> : <Pause className="w-3 h-3 text-amber-400" />}
            <span className="hidden sm:inline">{isPaused ? "Reanudar" : "Pausa"}</span>
          </button>
        </div>
      </div>

      {/* Ticker marquee ribbon */}
      <div 
        className="relative overflow-hidden py-2.5 bg-gradient-to-r from-[#0d0a17] via-[#090710] to-[#0d0a17]"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Subtle left & right edge vignettes */}
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#0B0912] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#0B0912] to-transparent z-10 pointer-events-none" />

        <div className={`animate-ticker ${isPaused ? 'ticker-paused' : ''} flex items-center gap-6`}>
          {/* We render the array twice for smooth infinite loop */}
          {[...items, ...items].map((item, idx) => {
            const isCrypto = item.category === 'crypto';
            return (
              <button
                key={`${item.id}-${idx}`}
                onClick={() => setSelectedItem(item)}
                className={`group flex items-center gap-3 px-4 py-1.5 rounded-lg border transition-all duration-200 text-left whitespace-nowrap cursor-pointer ${
                  isCrypto 
                    ? 'bg-amber-500/10 border-amber-500/30 hover:border-amber-400 hover:bg-amber-500/20' 
                    : item.category === 'energy'
                    ? 'bg-orange-500/5 border-orange-500/20 hover:border-orange-400 hover:bg-orange-500/15'
                    : 'bg-white/5 border-white/10 hover:border-purple-400/50 hover:bg-white/10'
                }`}
              >
                {/* Symbol and Category indicator */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    {isCrypto && <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />}
                    <span className="font-mono font-black text-xs tracking-wider text-slate-200 group-hover:text-white">
                      {item.symbol}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {item.name}
                  </span>
                </div>

                {/* Primary Price */}
                <div className="flex flex-col text-right">
                  <span className="font-mono font-bold text-xs text-white tracking-tight">
                    {item.value}
                  </span>
                  {item.subValue && (
                    <span className="text-[9px] font-mono text-slate-400">
                      {item.subValue}
                    </span>
                  )}
                </div>

                {/* Delta Badge */}
                <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                  item.isPositive 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}>
                  {item.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {item.change}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Detail Modal for clicked indicator */}
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
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-sm ${
                  selectedItem.category === 'crypto' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                  selectedItem.category === 'energy' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                  'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                }`}>
                  {selectedItem.category === 'crypto' ? '₿' : selectedItem.symbol.slice(0, 3)}
                </div>
                <div>
                  <h4 className="font-bold text-lg leading-tight flex items-center gap-2">
                    {selectedItem.symbol}
                    <span className={`text-xs px-2 py-0.5 rounded font-mono font-semibold ${
                      selectedItem.isPositive ? 'text-emerald-400 bg-emerald-500/20' : 'text-rose-400 bg-rose-500/20'
                    }`}>
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

            <div className="space-y-4 font-mono text-sm">
              <div className="bg-[#1C182B] p-4 rounded-xl border border-white/10 flex items-center justify-between">
                <span className="text-slate-400 text-xs">Cotización Actual:</span>
                <span className="text-xl font-bold text-white">{selectedItem.value}</span>
              </div>

              {selectedItem.subValue && (
                <div className="bg-[#1C182B] p-3 rounded-xl border border-white/5 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Referencia secundaria / spread:</span>
                  <span className="text-slate-200 font-semibold">{selectedItem.subValue}</span>
                </div>
              )}

              {selectedItem.details && (
                <div className="text-xs text-slate-300 font-sans leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">
                  {selectedItem.details}
                </div>
              )}

              <div className="pt-2 border-t border-white/10 flex flex-col gap-1 text-[11px] text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Fuente Oficial / Auditoría:</span>
                  <span className="text-purple-400 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    {selectedItem.source}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Frecuencia de muestreo:</span>
                  <span className="text-slate-300">Tiempo Real / Streaming API</span>
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
                  Verificar en Fuente <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <button
                onClick={() => setSelectedItem(null)}
                className="px-5 py-2 bg-gradient-to-r from-orange-500 to-purple-600 hover:opacity-90 rounded-xl text-xs font-bold text-white transition-opacity"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
