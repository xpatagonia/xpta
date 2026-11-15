import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  Wind,
  Anchor,
  Activity,
  DollarSign,
  Euro,
  Flame,
  Zap,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Bell,
} from 'lucide-react';
import WallStreetTicker from './WallStreetTicker';
import ConfigurableSection, {
  getSectionCardClass,
  getSectionGridClass,
  getSectionHeadingSizeClass,
  resolveSectionSurfaceTone,
} from './ConfigurableSection';
import { HomeSectionDesignConfig } from '../lib/siteSettings';
import {
  fetchSharedMarketSnapshot,
  getInitialMarketSnapshot,
  subscribeMarketSnapshot,
  SharedMarketSnapshot,
} from '../lib/marketClient';

interface IndicatorCardData {
  id: string;
  category: 'crypto-forex' | 'energy' | 'patagonia';
  metaLabel: string;
  title: string;
  value: string;
  subValue: string;
  change: string;
  isPositive: boolean;
  dataMode: 'live' | 'official_reference';
  icon: React.ReactElement;
  iconBg: string;
  iconText: string;
  source: string;
  updatedAt: string;
}

export default function RegionalIndicators({ config }: { config?: HomeSectionDesignConfig }) {
  const [snapshot, setSnapshot] = useState<SharedMarketSnapshot>(() => getInitialMarketSnapshot());
  const [filter, setFilter] = useState<'all' | 'crypto-forex' | 'energy' | 'patagonia'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSourcesModal, setShowSourcesModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      await fetchSharedMarketSnapshot(true);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const unsub = subscribeMarketSnapshot((next) => setSnapshot(next));
    fetchSharedMarketSnapshot(false);
    return () => unsub();
  }, []);

  const allCards: IndicatorCardData[] = useMemo(() => {
    const getCurrency = (sym: string) => snapshot.currencies.find((c) => c.symbol === sym);
    const getCommodity = (sym: string) => snapshot.patagonia.find((c) => c.symbol === sym);

    const blue = getCurrency('USD BLUE');
    const mep = getCurrency('USD MEP');
    const oficial = getCurrency('USD OFIC');
    const eur = getCurrency('EUR/ARS');

    const brent = getCommodity('BRENT');
    const medanito = getCommodity('MEDANITO');
    const gas = getCommodity('GAS PGY');
    const eolica = getCommodity('EÓLICA');
    const pesca = getCommodity('PESCA');
    const lana = getCommodity('LANA');

    return [
      {
        id: 'brent',
        category: 'energy',
        metaLabel: brent?.dataMode === 'live' ? 'Futuro ICE · En vivo' : 'Benchmark Global · Ref.',
        title: 'Petróleo Brent',
        value: brent?.value || 'USD 74.80/bbl',
        subValue: 'Contrato Futuro BZ=F',
        change: brent?.change || 'Ref.',
        isPositive: brent?.isPositive ?? true,
        dataMode: brent?.dataMode || 'official_reference',
        icon: <Activity className="w-4 h-4" />,
        iconBg: 'bg-orange-500/10',
        iconText: 'text-orange-600 dark:text-orange-400',
        source: brent?.source || 'ICE Brent Futures',
        updatedAt: brent?.updatedAt || snapshot.updatedAt,
      },
      {
        id: 'blue',
        category: 'crypto-forex',
        metaLabel: `DolarApi · Brecha ${snapshot.brechaBluePct}%`,
        title: 'Dólar Blue',
        value: `$ ${(blue?.sell || 1565).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
        subValue: `Compra $ ${(blue?.buy || 1545).toLocaleString('es-AR')}`,
        change: blue?.change || '0.00%',
        isPositive: blue?.isPositive ?? true,
        dataMode: blue?.dataMode || 'live',
        icon: <DollarSign className="w-4 h-4" />,
        iconBg: 'bg-emerald-500/10',
        iconText: 'text-emerald-600 dark:text-emerald-400',
        source: blue?.source || 'DolarApi · Ámbito',
        updatedAt: blue?.updatedAt || snapshot.updatedAt,
      },
      {
        id: 'medanito',
        category: 'energy',
        metaLabel:
          medanito?.dataMode === 'live'
            ? 'Vaca Muerta · Paridad Brent'
            : 'Cuenca Neuquina · Ref.',
        title: 'Crudo Medanito',
        value: medanito?.value || 'USD 69.40/bbl',
        subValue: '35° API Liviano Neuquén',
        change: medanito?.change || 'Paridad',
        isPositive: medanito?.isPositive ?? true,
        dataMode: medanito?.dataMode || 'official_reference',
        icon: <Flame className="w-4 h-4" />,
        iconBg: 'bg-amber-500/10',
        iconText: 'text-amber-600 dark:text-amber-400',
        source: medanito?.source || 'Sec. de Energía',
        updatedAt: medanito?.updatedAt || snapshot.updatedAt,
      },
      {
        id: 'btc',
        category: 'crypto-forex',
        metaLabel: snapshot.btc.dataMode === 'live' ? 'CoinGecko · En vivo' : 'Criptoactivo · Ref.',
        title: 'Bitcoin (BTC)',
        value: `USD $${snapshot.btc.usd.toLocaleString('en-US')}`,
        subValue: `ARS $${snapshot.btc.ars.toLocaleString('es-AR')}`,
        change: `${snapshot.btc.isPositive ? '+' : ''}${snapshot.btc.change24h}%`,
        isPositive: snapshot.btc.isPositive,
        dataMode: snapshot.btc.dataMode,
        icon: <Zap className="w-4 h-4" />,
        iconBg: 'bg-amber-500/10',
        iconText: 'text-amber-600 dark:text-amber-400',
        source: snapshot.btc.source,
        updatedAt: snapshot.btc.updatedAt,
      },
      {
        id: 'mep',
        category: 'crypto-forex',
        metaLabel: 'BYMA · Dólar Bolsa',
        title: 'Dólar MEP',
        value: `$ ${(mep?.sell || 1535).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
        subValue: `Compra $ ${(mep?.buy || 1520).toLocaleString('es-AR')}`,
        change: mep?.change || '0.00%',
        isPositive: mep?.isPositive ?? true,
        dataMode: mep?.dataMode || 'live',
        icon: <DollarSign className="w-4 h-4" />,
        iconBg: 'bg-cyan-500/10',
        iconText: 'text-cyan-600 dark:text-cyan-400',
        source: mep?.source || 'DolarApi · BYMA',
        updatedAt: mep?.updatedAt || snapshot.updatedAt,
      },
      {
        id: 'oficial',
        category: 'crypto-forex',
        metaLabel: 'BCRA / BNA · Referencia',
        title: 'Dólar Oficial',
        value: `$ ${(oficial?.sell || 1550).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
        subValue: `Mayorista Ref. $ ${((oficial?.sell || 1550) * 0.975).toFixed(2)}`,
        change: oficial?.change || '0.00%',
        isPositive: oficial?.isPositive ?? true,
        dataMode: oficial?.dataMode || 'live',
        icon: <DollarSign className="w-4 h-4" />,
        iconBg: 'bg-blue-500/10',
        iconText: 'text-blue-600 dark:text-blue-400',
        source: oficial?.source || 'DolarApi · BNA',
        updatedAt: oficial?.updatedAt || snapshot.updatedAt,
      },
      {
        id: 'eur',
        category: 'crypto-forex',
        metaLabel: 'Banco Nación · Divisa',
        title: 'Euro Oficial',
        value: `$ ${(eur?.sell || 1715).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
        subValue: `Compra $ ${(eur?.buy || 1700).toLocaleString('es-AR')}`,
        change: eur?.change || '0.00%',
        isPositive: eur?.isPositive ?? true,
        dataMode: eur?.dataMode || 'live',
        icon: <Euro className="w-4 h-4" />,
        iconBg: 'bg-purple-500/10',
        iconText: 'text-purple-600 dark:text-purple-400',
        source: eur?.source || 'DolarApi · BNA',
        updatedAt: eur?.updatedAt || snapshot.updatedAt,
      },
      {
        id: 'gas',
        category: 'energy',
        metaLabel: `Plan Gas.Ar · Ref. ${gas?.updatedAt?.slice(0, 10) || 'Oficial'}`,
        title: 'Gas Natural Neuquén',
        value: gas?.value || 'USD 3.52/MMBtu',
        subValue: 'Inyección Troncal GPNK',
        change: 'Ref. Oficial',
        isPositive: true,
        dataMode: 'official_reference',
        icon: <Flame className="w-4 h-4" />,
        iconBg: 'bg-yellow-500/10',
        iconText: 'text-amber-600 dark:text-amber-400',
        source: gas?.source || 'Plan Gas.Ar',
        updatedAt: gas?.updatedAt || snapshot.updatedAt,
      },
      {
        id: 'eolica',
        category: 'patagonia',
        metaLabel: `CAMMESA · Ref. ${eolica?.updatedAt?.slice(0, 10) || 'Oficial'}`,
        title: 'Potencia Eólica Regional',
        value: eolica?.value || '1.580 MW',
        subValue: 'Factor de Capacidad 51.4%',
        change: 'SADI',
        isPositive: true,
        dataMode: 'official_reference',
        icon: <Wind className="w-4 h-4" />,
        iconBg: 'bg-emerald-500/10',
        iconText: 'text-emerald-600 dark:text-emerald-400',
        source: eolica?.source || 'CAMMESA SADI',
        updatedAt: eolica?.updatedAt || snapshot.updatedAt,
      },
      {
        id: 'pesca',
        category: 'patagonia',
        metaLabel: `CAPIP · Ref. ${pesca?.updatedAt?.slice(0, 10) || 'Oficial'}`,
        title: 'Langostino Congelado',
        value: pesca?.value || 'USD 6.85/kg',
        subValue: 'FOB Golfo San Jorge L1/L2',
        change: 'FOB',
        isPositive: true,
        dataMode: 'official_reference',
        icon: <Anchor className="w-4 h-4" />,
        iconBg: 'bg-cyan-500/10',
        iconText: 'text-cyan-600 dark:text-cyan-400',
        source: pesca?.source || 'CAPIP',
        updatedAt: pesca?.updatedAt || snapshot.updatedAt,
      },
      {
        id: 'lana',
        category: 'patagonia',
        metaLabel: `Fed. Lanera · Ref. ${lana?.updatedAt?.slice(0, 10) || 'Oficial'}`,
        title: 'Lana Merino Fina 19.5u',
        value: lana?.value || 'USD 6.45/kg',
        subValue: 'Base limpia peinada Trelew',
        change: 'Exportación',
        isPositive: true,
        dataMode: 'official_reference',
        icon: <TrendingUp className="w-4 h-4" />,
        iconBg: 'bg-stone-500/10',
        iconText: 'text-stone-600 dark:text-stone-300',
        source: lana?.source || 'Federación Lanera Argentina',
        updatedAt: lana?.updatedAt || snapshot.updatedAt,
      },
    ];
  }, [snapshot]);

  const primaryCards = allCards.slice(0, 4);
  const filteredCards = filter === 'all' ? allCards : allCards.filter((c) => c.category === filter);

  const lastRefreshed = snapshot.updatedAt
    ? new Date(snapshot.updatedAt).toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const accentColor = config?.accentColor || '#f97316';
  const surfaceTone = resolveSectionSurfaceTone(config);
  const blockOverrides = config?.blockOverrides || {};

  const gridClass = getSectionGridClass(
    config?.columnStyle,
    'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3'
  );
  const cardSurfaceClass = getSectionCardClass(config?.cardStyle, surfaceTone);
  const isBento = config?.columnStyle === 'bento';

  const applyCardOverride = (card: IndicatorCardData) => {
    const ov = blockOverrides[card.id];
    if (!ov) return { ...card, imageUrl: '' };
    return {
      ...card,
      title: ov.title || card.title,
      metaLabel: ov.tagline || card.metaLabel,
      subValue: ov.description || card.subValue,
      imageUrl: ov.imageUrl || '',
    };
  };

  const visiblePrimary = primaryCards
    .filter((c) => !blockOverrides[c.id]?.hidden)
    .map(applyCardOverride);
  const visibleFiltered = filteredCards
    .filter((c) => !blockOverrides[c.id]?.hidden)
    .map(applyCardOverride);

  const alertBarClass =
    surfaceTone === 'light'
      ? 'bg-white border-slate-200 text-slate-900'
      : surfaceTone === 'dark'
      ? 'bg-[#181424] border-white/10 text-slate-100'
      : 'bg-white dark:bg-[#181424] border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100';

  const secondaryBtnClass =
    surfaceTone === 'light'
      ? 'bg-white border-slate-300 text-slate-800 hover:border-purple-500/40'
      : surfaceTone === 'dark'
      ? 'bg-[#1A1625] border-white/15 text-slate-100 hover:border-purple-500/40'
      : 'bg-white dark:bg-[#1A1625] border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-purple-500/40';

  return (
    <ConfigurableSection
      id="indicadores"
      config={config}
      noPaddingWrapper
      defaultClassName="bg-slate-50/70 dark:bg-[#110E17] border-b border-slate-200 dark:border-white/5 relative z-20"
      innerContainerClassName="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 pt-3 pb-6 md:pb-8 relative z-10"
    >
      <div className="-mx-4 sm:-mx-6 md:-mx-12 mb-3">
        <WallStreetTicker />
      </div>

      {/* Alertas de Variación Calculadas */}
      {snapshot.alerts.length > 0 && (
        <div
          className={`mb-4 px-3.5 py-2.5 rounded-xl border flex flex-wrap items-center gap-x-4 gap-y-2 text-xs ${alertBarClass}`}
        >
          <span
            className="inline-flex items-center gap-1.5 font-bold shrink-0"
            style={{ color: accentColor }}
          >
            <Bell className="w-3.5 h-3.5" />
            Alertas de Mercado
          </span>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 opacity-85 min-w-0">
            {snapshot.alerts.map((al, idx) => (
              <React.Fragment key={al.id}>
                <span className="inline-flex items-center gap-1.5">
                  <strong className="font-mono">{al.symbol}</strong>
                  <span
                    className={`font-mono tabular-nums font-bold ${
                      al.severity === 'up'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : al.severity === 'down'
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-purple-600 dark:text-purple-400'
                    }`}
                  >
                    {al.change}
                  </span>
                  <span className="opacity-75 truncate max-w-[320px]">— {al.title}</span>
                </span>
                {idx < snapshot.alerts.length - 1 && (
                  <span className="opacity-30 hidden sm:inline" aria-hidden="true">
                    ·
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-slate-200/70 dark:border-white/10 gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className="p-1.5 rounded-lg"
            style={{ backgroundColor: `${accentColor}1A`, color: accentColor }}
          >
            <TrendingUp className="w-4 h-4" />
          </span>
          <div>
            <div className="flex items-center gap-2 text-xs">
              <h3
                className={`font-display font-bold tracking-tight ${
                  config?.headingScale === 'editorial' ? 'text-xl sm:text-2xl' : 'text-sm sm:text-base'
                }`}
              >
                {config?.titleOverride || 'Indicadores de Contexto & Mercado'}
              </h3>
              {lastRefreshed && (
                <span className="text-[11px] opacity-70 font-mono tabular-nums hidden md:inline">
                  · Sincronizado {lastRefreshed}
                </span>
              )}
            </div>
            <p className="text-xs opacity-75">
              {config?.subtitleOverride ||
                'Brent y divisas en vivo con cálculo de variación diaria más referencias sectoriales auditadas.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={loadData}
            disabled={isRefreshing}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap ${secondaryBtnClass}`}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-purple-500 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Actualizar</span>
          </button>
          <button
            type="button"
            onClick={() => setShowSourcesModal(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap ${secondaryBtnClass}`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Auditar Fuentes</span>
          </button>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90 whitespace-nowrap"
            style={{ backgroundColor: accentColor }}
          >
            <span>{isExpanded ? 'Vista compacta' : `Ver todos (${allCards.length})`}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Category Filter Bar when expanded */}
      {isExpanded && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 text-xs font-semibold">
          {[
            { id: 'all', label: `Todos (${allCards.length})` },
            { id: 'energy', label: 'Energía & Brent' },
            { id: 'crypto-forex', label: 'Divisas & Cripto' },
            { id: 'patagonia', label: 'Sectores Patagónicos' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 border ${
                filter === tab.id
                  ? 'text-white border-transparent'
                  : secondaryBtnClass
              }`}
              style={filter === tab.id ? { backgroundColor: accentColor } : undefined}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Configurable Indicators Grid */}
      <div className={gridClass}>
        {(isExpanded ? visibleFiltered : visiblePrimary).map((card, idx) => (
          <div
            key={card.id}
            className={`p-3.5 rounded-xl flex flex-col justify-between transition-colors overflow-hidden ${cardSurfaceClass} ${
              isBento && idx === 0 ? 'md:col-span-4' : isBento ? 'md:col-span-2' : ''
            }`}
          >
            {card.imageUrl && (
              <div className="-mx-3.5 -mt-3.5 mb-3 h-24 overflow-hidden bg-slate-900">
                <img
                  src={card.imageUrl}
                  alt={card.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${card.iconBg} ${card.iconText}`}
                >
                  {card.icon}
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] opacity-70 block truncate leading-tight">
                    {card.metaLabel}
                  </span>
                  <h4
                    className={`font-bold truncate ${
                      config?.headingScale === 'editorial' ? 'text-base' : 'text-sm'
                    }`}
                  >
                    {card.title}
                  </h4>
                </div>
              </div>
              <span
                className={`text-[11px] font-mono tabular-nums font-bold px-2 py-0.5 rounded shrink-0 ${
                  card.dataMode === 'official_reference'
                    ? surfaceTone === 'light'
                      ? 'text-slate-700 bg-slate-100'
                      : surfaceTone === 'dark'
                      ? 'text-slate-200 bg-white/10'
                      : 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/10'
                    : card.isPositive
                    ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10'
                    : 'text-rose-700 dark:text-rose-400 bg-rose-500/10'
                }`}
              >
                {card.change}
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-2 border-t border-slate-200/60 dark:border-white/10 gap-2 font-mono tabular-nums">
              <span className="text-sm font-bold truncate">{card.value}</span>
              <span className="text-[11px] opacity-70 truncate max-w-[140px]">
                {card.subValue}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Sources Modal */}
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
                  <h3 className={getSectionHeadingSizeClass('compact', 'text-lg') + ' font-bold tracking-tight'}>
                    Fuentes de Información y Metodología
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Diferenciación transparente entre feeds en vivo y referencias sectoriales de Patagonia
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSourcesModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                <div className="flex items-center justify-between font-bold text-sm mb-1 text-orange-600 dark:text-orange-400">
                  <span>Petróleo Brent (BZ=F) &amp; Paridad Medanito — En Vivo</span>
                  <a
                    href="https://finance.yahoo.com/quote/BZ=F"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[11px] underline"
                  >
                    ICE Brent <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  El futuro de Petróleo Brent se consulta en línea comparando el último precio operado contra el cierre previo para generar alertas reales. La estimación de Crudo Medanito aplica el diferencial técnico de paridad sobre Brent.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                <div className="flex items-center justify-between font-bold text-sm mb-1 text-emerald-600 dark:text-emerald-400">
                  <span>Mercado Cambiario (Blue, MEP, CCL, Oficial, Euro) — En Vivo</span>
                  <a
                    href="https://dolarapi.com"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[11px] underline"
                  >
                    DolarApi <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Consolidación en vivo de BNA, BYMA, MAE y Mercado Libre con cálculo automático de variación porcentual y brecha cambiaria Blue/Oficial para cotizar insumos y fletes B2B.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                <div className="flex items-center justify-between font-bold text-sm mb-1 text-purple-600 dark:text-purple-400">
                  <span>Bitcoin (BTC) — En Vivo</span>
                  <a
                    href="https://www.coingecko.com"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[11px] underline"
                  >
                    CoinGecko API <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Cotización USD/ARS y variación real de 24 horas vía CoinGecko con contingencia en Coinbase Spot.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                <div className="flex items-center justify-between font-bold text-sm mb-1 text-blue-600 dark:text-blue-400">
                  <span>Gas Plan.Ar, Eólica CAMMESA, Pesca CAPIP y Lana Merino</span>
                  <span className="text-[11px] text-slate-500">Referencias Oficiales</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Indicadores estructurales etiquetados explícitamente con su última fecha de referencia oficial sectorial (ENARSA, CAMMESA, CAPIP y Federación Lanera Argentina).
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSourcesModal(false)}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: accentColor }}
              >
                Cerrar Auditoría
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfigurableSection>
  );
}
