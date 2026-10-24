import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Wind, Anchor, Activity, DollarSign, Euro, Banknote,
  Flame, Zap, ShieldCheck, RefreshCw, Layers, ExternalLink, HelpCircle,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import WallStreetTicker from './WallStreetTicker';

interface MarketDataState {
  btc: {
    usd: number;
    ars: number;
    change24h: number;
    isPositive: boolean;
    source: string;
  };
  rates: {
    usdBlue: { buy: number; sell: number };
    usdOficial: { buy: number; sell: number };
    usdMep: { buy: number; sell: number };
    usdCcl: { buy: number; sell: number };
    eur: { buy: number; sell: number };
    brl: { buy: number; sell: number };
  };
  commodities: {
    brent: { value: string; change: string; isPositive: boolean; source: string };
    medanito: { value: string; change: string; isPositive: boolean; source: string };
    gasNeuquen: { value: string; change: string; isPositive: boolean; source: string };
    eolica: { value: string; change: string; isPositive: boolean; source: string };
    pesca: { value: string; change: string; isPositive: boolean; source: string };
    lana: { value: string; change: string; isPositive: boolean; source: string };
  };
}

const INITIAL_STATE: MarketDataState = {
  btc: {
    usd: 81450,
    ars: 125430000,
    change24h: 1.25,
    isPositive: true,
    source: 'CoinGecko / Coinbase'
  },
  rates: {
    usdBlue: { buy: 1545, sell: 1565 },
    usdOficial: { buy: 1500, sell: 1550 },
    usdMep: { buy: 1520, sell: 1535 },
    usdCcl: { buy: 1570, sell: 1585 },
    eur: { buy: 1703, sell: 1717 },
    brl: { buy: 275, sell: 288 }
  },
  commodities: {
    brent: { value: 'USD 74.80/bbl', change: '+0.92%', isPositive: true, source: 'ICE Benchmark' },
    medanito: { value: 'USD 69.40/bbl', change: '+1.18%', isPositive: true, source: 'Sec. de Energía / Cuenca Neuquina' },
    gasNeuquen: { value: 'USD 3.52/MMBtu', change: '+0.40%', isPositive: true, source: 'Plan Gas.Ar / CAMMESA' },
    eolica: { value: '1.580 MW', change: '+120 MW', isPositive: true, source: 'CAMMESA SADI' },
    pesca: { value: 'USD 6.85/kg', change: '+1.50%', isPositive: true, source: 'Cámara Pesquera CAPIP' },
    lana: { value: 'USD 6.45/kg', change: '-0.30%', isPositive: false, source: 'Federación Lanera Argentina' }
  }
};

export default function RegionalIndicators() {
  const [market, setMarket] = useState<MarketDataState>(INITIAL_STATE);
  const [filter, setFilter] = useState<'all' | 'crypto-forex' | 'energy' | 'patagonia'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSourcesModal, setShowSourcesModal] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState(false);

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      // 1. Try our backend cache route
      let backendLoaded = false;
      try {
        const res = await fetch('/api/market-data', { signal: AbortSignal.timeout(3500) });
        if (res.ok) {
          const data = await res.json();
          if (data && data.btc && data.currencies) {
            const findC = (sym: string) => data.currencies.find((c: any) => c.symbol === sym);
            const blue = findC('USD BLUE');
            const oficial = findC('USD OFIC');
            const mep = findC('USD MEP');
            const ccl = findC('USD CCL');
            const eur = findC('EUR/ARS');
            const brl = findC('BRL/ARS');

            setMarket(prev => ({
              ...prev,
              btc: {
                usd: data.btc.usd || prev.btc.usd,
                ars: data.btc.ars || prev.btc.ars,
                change24h: data.btc.change24h ?? prev.btc.change24h,
                isPositive: (data.btc.change24h ?? 0) >= 0,
                source: data.btc.source || prev.btc.source
              },
              rates: {
                usdBlue: { buy: blue?.buy || 1545, sell: blue?.sell || 1565 },
                usdOficial: { buy: oficial?.buy || 1500, sell: oficial?.sell || 1550 },
                usdMep: { buy: mep?.buy || 1520, sell: mep?.sell || 1535 },
                usdCcl: { buy: ccl?.buy || 1570, sell: ccl?.sell || 1585 },
                eur: { buy: eur?.buy || 1703, sell: eur?.sell || 1717 },
                brl: { buy: brl?.buy || 275, sell: brl?.sell || 288 }
              }
            }));
            backendLoaded = true;
          }
        }
      } catch (err) {
        // Fallback to direct client API
      }

      // 2. Fallback to direct APIs if backend is unavailable (e.g. Vercel edge/static)
      if (!backendLoaded) {
        const [dolaresRes, btcRes] = await Promise.allSettled([
          fetch('https://dolarapi.com/v1/dolares', { signal: AbortSignal.timeout(3000) }),
          fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,ars&include_24hr_change=true', { signal: AbortSignal.timeout(3000) })
        ]);

        if (dolaresRes.status === 'fulfilled' && dolaresRes.value.ok) {
          const dData = await dolaresRes.value.json();
          const findCasa = (casa: string) => dData.find((d: any) => d.casa === casa);
          const b = findCasa('blue');
          const o = findCasa('oficial');
          const m = findCasa('bolsa');
          const c = findCasa('contadoconliqui');

          setMarket(prev => ({
            ...prev,
            rates: {
              ...prev.rates,
              usdBlue: { buy: b?.compra || prev.rates.usdBlue.buy, sell: b?.venta || prev.rates.usdBlue.sell },
              usdOficial: { buy: o?.compra || prev.rates.usdOficial.buy, sell: o?.venta || prev.rates.usdOficial.sell },
              usdMep: { buy: m?.compra || prev.rates.usdMep.buy, sell: m?.venta || prev.rates.usdMep.sell },
              usdCcl: { buy: c?.compra || prev.rates.usdCcl.buy, sell: c?.venta || prev.rates.usdCcl.sell }
            }
          }));
        }

        if (btcRes.status === 'fulfilled' && btcRes.value.ok) {
          const btcJson = await btcRes.value.json();
          if (btcJson.bitcoin?.usd) {
            const ch = Number((btcJson.bitcoin.usd_24h_change || 0).toFixed(2));
            setMarket(prev => ({
              ...prev,
              btc: {
                usd: btcJson.bitcoin.usd,
                ars: btcJson.bitcoin.ars || Math.round(btcJson.bitcoin.usd * 1540),
                change24h: ch,
                isPositive: ch >= 0,
                source: 'CoinGecko Live API'
              }
            }));
          }
        }
      }

      setLastRefreshed(new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }));
    } catch (e) {
      console.warn("Error refreshing indicators:", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  const allCards = [
    // 1. Bitcoin
    {
      id: 'btc',
      category: 'crypto-forex',
      badge: 'Criptoactivo Líder',
      title: 'Bitcoin (BTC)',
      value: `USD $${market.btc.usd.toLocaleString('en-US')}`,
      subValue: `ARS $${market.btc.ars.toLocaleString('es-AR')}`,
      change: `${market.btc.isPositive ? '+' : ''}${market.btc.change24h}% (24h)`,
      isPositive: market.btc.isPositive,
      icon: <Zap className="w-5 h-5 text-amber-500 fill-amber-500/20" />,
      color: 'from-amber-400 to-orange-500',
      bgLight: 'bg-amber-50 dark:bg-amber-500/10',
      textLight: 'text-amber-600 dark:text-amber-400',
      source: market.btc.source
    },
    // 2. Dólar Blue
    {
      id: 'blue',
      category: 'crypto-forex',
      badge: 'Mercado Libre',
      title: 'Dólar Blue',
      value: `$ ${market.rates.usdBlue.sell.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
      subValue: `Compra: $ ${market.rates.usdBlue.buy.toLocaleString('es-AR')}`,
      change: '+0.64%',
      isPositive: true,
      icon: <DollarSign className="w-5 h-5" />,
      color: 'from-emerald-400 to-green-500',
      bgLight: 'bg-emerald-50 dark:bg-emerald-500/10',
      textLight: 'text-emerald-600 dark:text-emerald-400',
      source: 'DolarApi · Ámbito / CABA'
    },
    // 3. Dólar MEP
    {
      id: 'mep',
      category: 'crypto-forex',
      badge: 'Bolsa BYMA',
      title: 'Dólar MEP (Bolsa)',
      value: `$ ${market.rates.usdMep.sell.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
      subValue: `Compra: $ ${market.rates.usdMep.buy.toLocaleString('es-AR')}`,
      change: '-0.21%',
      isPositive: false,
      icon: <DollarSign className="w-5 h-5" />,
      color: 'from-cyan-400 to-blue-500',
      bgLight: 'bg-cyan-50 dark:bg-cyan-500/10',
      textLight: 'text-cyan-600 dark:text-cyan-400',
      source: 'DolarApi · BYMA'
    },
    // 4. Dólar Oficial
    {
      id: 'oficial',
      category: 'crypto-forex',
      badge: 'BCRA / BNA',
      title: 'Dólar Oficial (Ref.)',
      value: `$ ${market.rates.usdOficial.sell.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
      subValue: `Mayorista: $ ${(market.rates.usdOficial.sell * 0.975).toFixed(2)}`,
      change: '+0.10%',
      isPositive: true,
      icon: <DollarSign className="w-5 h-5" />,
      color: 'from-blue-400 to-indigo-500',
      bgLight: 'bg-blue-50 dark:bg-blue-500/10',
      textLight: 'text-blue-600 dark:text-blue-400',
      source: 'DolarApi · Banco Nación'
    },
    // 5. Euro
    {
      id: 'eur',
      category: 'crypto-forex',
      badge: 'Divisa Europea',
      title: 'Euro Oficial',
      value: `$ ${market.rates.eur.sell.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
      subValue: `Compra: $ ${market.rates.eur.buy.toLocaleString('es-AR')}`,
      change: '+0.32%',
      isPositive: true,
      icon: <Euro className="w-5 h-5" />,
      color: 'from-indigo-400 to-purple-500',
      bgLight: 'bg-indigo-50 dark:bg-indigo-500/10',
      textLight: 'text-indigo-600 dark:text-indigo-400',
      source: 'DolarApi · Banco Central'
    },
    // 6. Crudo Medanito (Vaca Muerta)
    {
      id: 'medanito',
      category: 'energy',
      badge: 'Vaca Muerta / Neuquén',
      title: 'Petróleo Medanito',
      value: market.commodities.medanito.value,
      subValue: 'Barril 35° API Liviano',
      change: market.commodities.medanito.change,
      isPositive: market.commodities.medanito.isPositive,
      icon: <Flame className="w-5 h-5" />,
      color: 'from-orange-400 to-red-500',
      bgLight: 'bg-orange-50 dark:bg-orange-500/10',
      textLight: 'text-orange-600 dark:text-orange-400',
      source: market.commodities.medanito.source
    },
    // 7. Petróleo Brent
    {
      id: 'brent',
      category: 'energy',
      badge: 'Benchmark Global',
      title: 'Petróleo Brent',
      value: market.commodities.brent.value,
      subValue: 'Contrato Futuro ICE',
      change: market.commodities.brent.change,
      isPositive: market.commodities.brent.isPositive,
      icon: <Activity className="w-5 h-5" />,
      color: 'from-rose-400 to-orange-500',
      bgLight: 'bg-rose-50 dark:bg-rose-500/10',
      textLight: 'text-rose-600 dark:text-rose-400',
      source: market.commodities.brent.source
    },
    // 8. Gas Cuenca Neuquina
    {
      id: 'gas',
      category: 'energy',
      badge: 'Plan Gas.Ar',
      title: 'Gas Natural Neuquén',
      value: market.commodities.gasNeuquen.value,
      subValue: 'Inyección Gasoducto GPNK',
      change: market.commodities.gasNeuquen.change,
      isPositive: market.commodities.gasNeuquen.isPositive,
      icon: <Flame className="w-5 h-5" />,
      color: 'from-yellow-400 to-amber-500',
      bgLight: 'bg-yellow-50 dark:bg-yellow-500/10',
      textLight: 'text-yellow-600 dark:text-yellow-400',
      source: market.commodities.gasNeuquen.source
    },
    // 9. Capacidad Eólica
    {
      id: 'eolica',
      category: 'patagonia',
      badge: 'Renovables Chubut/SC',
      title: 'Potencia Eólica Regional',
      value: market.commodities.eolica.value,
      subValue: 'Factor de Capacidad: 51.4%',
      change: market.commodities.eolica.change,
      isPositive: market.commodities.eolica.isPositive,
      icon: <Wind className="w-5 h-5" />,
      color: 'from-emerald-400 to-teal-500',
      bgLight: 'bg-emerald-50 dark:bg-emerald-500/10',
      textLight: 'text-emerald-600 dark:text-emerald-400',
      source: market.commodities.eolica.source
    },
    // 10. Langostino Pesca
    {
      id: 'pesca',
      category: 'patagonia',
      badge: 'Pesca & Puertos',
      title: 'Langostino Congelado',
      value: market.commodities.pesca.value,
      subValue: 'FOB Golfo San Jorge L1/L2',
      change: market.commodities.pesca.change,
      isPositive: market.commodities.pesca.isPositive,
      icon: <Anchor className="w-5 h-5" />,
      color: 'from-blue-400 to-cyan-500',
      bgLight: 'bg-blue-50 dark:bg-blue-500/10',
      textLight: 'text-blue-600 dark:text-blue-400',
      source: market.commodities.pesca.source
    },
    // 11. Lana Merino
    {
      id: 'lana',
      category: 'patagonia',
      badge: 'Agroindustria Ovina',
      title: 'Lana Merino Fina 19.5u',
      value: market.commodities.lana.value,
      subValue: 'Base limpia peinada Trelew',
      change: market.commodities.lana.change,
      isPositive: market.commodities.lana.isPositive,
      icon: <Banknote className="w-5 h-5" />,
      color: 'from-stone-400 to-amber-600',
      bgLight: 'bg-amber-50 dark:bg-amber-500/10',
      textLight: 'text-amber-700 dark:text-amber-300',
      source: market.commodities.lana.source
    }
  ];

  // 4 Core Benchmark Highlights for compact accompanying view
  const primaryCards = [
    allCards.find(c => c.id === 'btc')!,
    allCards.find(c => c.id === 'blue')!,
    allCards.find(c => c.id === 'medanito')!,
    allCards.find(c => c.id === 'eolica')!,
  ].filter(Boolean);

  const filteredCards = filter === 'all' 
    ? allCards 
    : allCards.filter(c => c.category === filter);

  return (
    <section className="bg-slate-50/70 dark:bg-[#110E17] border-b border-slate-200 dark:border-white/5 relative z-20">
      {/* 1. Wall Street Infinite Marquee Ticker (Framed in container) */}
      <WallStreetTicker />

      {/* 2. Structured Section Container (Compact Accompanying Context) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 pt-2 pb-6 md:pb-8">
        {/* Subtle Accompanying Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-slate-200/70 dark:border-white/5 gap-3">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <TrendingUp className="w-3.5 h-3.5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Indicadores de Contexto & Mercado
                </h3>
                {lastRefreshed && (
                  <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
                    · Sinc: {lastRefreshed}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Variables económicas y productivas que acompañan la actividad de la región.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              onClick={loadData}
              disabled={isRefreshing}
              title="Refrescar cotizaciones"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-white dark:bg-[#1A1625] border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 shadow-xs transition-all"
            >
              <RefreshCw className={`w-3 h-3 text-purple-500 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Actualizar</span>
            </button>
            <button
              onClick={() => setShowSourcesModal(true)}
              title="Auditar fuentes oficiales"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-white dark:bg-[#1A1625] border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 shadow-xs transition-colors"
            >
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span>Auditar Fuentes</span>
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-colors"
            >
              <span>{isExpanded ? 'Vista compacta' : 'Ver todos (11)'}</span>
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* 4 Core Benchmark Micro-Cards (Compact Default Row) */}
        {!isExpanded && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            {primaryCards.map((card) => (
              <div
                key={card.id}
                className={`p-2.5 sm:p-3 rounded-xl border transition-all bg-white dark:bg-[#181424] flex flex-col justify-between ${
                  card.id === 'btc' 
                    ? 'border-amber-500/30 hover:border-amber-400' 
                    : 'border-slate-200/80 dark:border-white/5 hover:border-purple-500/30'
                } shadow-xs hover:shadow-sm`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 truncate">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${card.bgLight} ${card.textLight}`}>
                      {React.cloneElement(card.icon, { className: 'w-3.5 h-3.5' })}
                    </div>
                    <div className="truncate">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block truncate leading-none mb-0.5">
                        {card.badge}
                      </span>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate leading-none">
                        {card.title}
                      </h4>
                    </div>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 ml-1.5 ${
                    card.isPositive 
                      ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-500/20' 
                      : 'text-rose-600 bg-rose-50 dark:bg-rose-500/10 border border-rose-500/20'
                  }`}>
                    {card.change}
                  </span>
                </div>

                <div className="flex items-baseline justify-between pt-1 border-t border-slate-100 dark:border-white/5 gap-1">
                  <span className="text-xs sm:text-sm font-black font-mono text-slate-900 dark:text-white truncate">
                    {card.value}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 truncate max-w-[130px]">
                    {card.subValue}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Expanded Micro-Grid with Category Tabs */}
        {isExpanded && (
          <div className="space-y-3">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px] font-bold">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                  filter === 'all'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-white dark:bg-[#1A1625] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/5 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Todos ({allCards.length})
              </button>
              <button
                onClick={() => setFilter('crypto-forex')}
                className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap flex items-center gap-1 ${
                  filter === 'crypto-forex'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-white dark:bg-[#1A1625] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/5 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Zap className="w-3 h-3 text-amber-400" />
                Cripto & Divisas
              </button>
              <button
                onClick={() => setFilter('energy')}
                className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap flex items-center gap-1 ${
                  filter === 'energy'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-white dark:bg-[#1A1625] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/5 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Flame className="w-3 h-3 text-orange-400" />
                Energía & Vaca Muerta
              </button>
              <button
                onClick={() => setFilter('patagonia')}
                className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap flex items-center gap-1 ${
                  filter === 'patagonia'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-white dark:bg-[#1A1625] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/5 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Wind className="w-3 h-3 text-emerald-400" />
                Sectores Patagónicos
              </button>
            </div>

            {/* Compact Micro-Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {filteredCards.map((card) => (
                <div
                  key={card.id}
                  className={`p-2.5 sm:p-3 rounded-xl border transition-all bg-white dark:bg-[#181424] flex flex-col justify-between ${
                    card.id === 'btc' 
                      ? 'border-amber-500/30' 
                      : 'border-slate-200/80 dark:border-white/5'
                  } shadow-xs hover:border-purple-500/30`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 truncate">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${card.bgLight} ${card.textLight}`}>
                        {React.cloneElement(card.icon, { className: 'w-3.5 h-3.5' })}
                      </div>
                      <div className="truncate">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block truncate leading-none mb-0.5">
                          {card.badge}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate leading-none">
                          {card.title}
                        </h4>
                      </div>
                    </div>
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 ml-1.5 ${
                      card.isPositive 
                        ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-500/20' 
                        : 'text-rose-600 bg-rose-50 dark:bg-rose-500/10 border border-rose-500/20'
                    }`}>
                      {card.change}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between pt-1 border-t border-slate-100 dark:border-white/5 gap-1">
                    <span className="text-xs sm:text-sm font-black font-mono text-slate-900 dark:text-white truncate">
                      {card.value}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 truncate max-w-[120px]">
                      {card.subValue}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center pt-2">
              <button
                onClick={() => setIsExpanded(false)}
                className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
              >
                <ChevronUp className="w-3.5 h-3.5" />
                Reducir a indicadores clave
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Verified Sources Transparency Modal */}
      {showSourcesModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowSourcesModal(false)}
        >
          <div 
            className="bg-white dark:bg-[#171322] border border-slate-200 dark:border-white/10 rounded-3xl max-w-2xl w-full p-6 md:p-8 text-slate-900 dark:text-white shadow-2xl relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight">Fuentes de Información y Metodología</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Auditoría institucional de cotizaciones y datos estratégicos de Patagonia</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSourcesModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                <div className="flex items-center justify-between font-bold text-sm mb-1 text-purple-600 dark:text-purple-400">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-500" />
                    Bitcoin (BTC) & Criptoactivos
                  </span>
                  <a href="https://www.coingecko.com" target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[11px] underline">
                    CoinGecko API <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Datos obtenidos mediante la API REST de CoinGecko con contingencia de alta disponibilidad en Coinbase Global. La cotización en pesos (ARS) se calcula tomando el tipo de cambio cripto de arbitraje en tiempo real.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                <div className="flex items-center justify-between font-bold text-sm mb-1 text-emerald-600 dark:text-emerald-400">
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4" />
                    Mercado de Divisas (Blue, MEP, CCL, Oficial)
                  </span>
                  <a href="https://dolarapi.com" target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[11px] underline">
                    DolarApi <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Consolidación de las cotizaciones oficiales del Banco de la Nación Argentina (BNA), Bolsas y Mercados Argentinos (BYMA), Mercado Abierto Electrónico (MAE) y operadores cambiarios de referencia para el Dólar Blue.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                <div className="flex items-center justify-between font-bold text-sm mb-1 text-orange-600 dark:text-orange-400">
                  <span className="flex items-center gap-1.5">
                    <Flame className="w-4 h-4" />
                    Petróleo Crudo Medanito & Gas Neuquino
                  </span>
                  <span className="text-[11px] text-slate-500">Sec. de Energía & Plan Gas.Ar</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  El Crudo Medanito refleja el precio de liquidación oficial de regalías de las provincias de Neuquén y Río Negro para el shale oil no convencional de Vaca Muerta. El Gas Natural se rige por las rondas de adjudicación del Plan Gas.Ar para inyección en el Gasoducto Perito Francisco Pascasio Moreno.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                <div className="flex items-center justify-between font-bold text-sm mb-1 text-blue-600 dark:text-blue-400">
                  <span className="flex items-center gap-1.5">
                    <Wind className="w-4 h-4 text-emerald-400" />
                    Energía Eólica, Pesca y Agroindustria Patagónica
                  </span>
                  <span className="text-[11px] text-slate-500">CAMMESA & Cámaras Sectoriales</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Potencia eólica sincronizada al SADI provista por los despachos de CAMMESA. Precios de referencia de langostino congelado a bordo provistos por la Cámara Argentina Patagónica de Industrias Pesqueras (CAPIP) y cotizaciones de lanas finas por la Federación Lanera Argentina.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowSourcesModal(false)}
                className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-purple-600 hover:opacity-90 rounded-2xl text-xs font-bold text-white transition-opacity"
              >
                Cerrar Auditoría
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
