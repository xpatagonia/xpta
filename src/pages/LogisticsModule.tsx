import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams } from 'react-router-dom';
import {
  Truck,
  MapPin,
  Package,
  Search,
  ArrowRight,
  ShieldCheck,
  FileText,
  CheckCircle2,
  ChevronDown,
  ListFilter,
  Plus,
  Route,
  Navigation2,
  Activity,
  TrendingUp,
  Wind,
  Radio,
  Clock,
  Fuel,
  Server,
  X,
  RefreshCw,
} from 'lucide-react';
import { collection, onSnapshot, doc, getDoc, db, auth } from '../lib/db';
import LogisticsLiveMonitoring from '../components/LogisticsLiveMonitoring';
import PatagoniaRouteMap from '../components/PatagoniaRouteMap';
import {
  PATAGONIA_LOGISTIC_NODES,
  calculatePatagoniaRoute,
  RouteCalculationResult,
  INITIAL_EMPTY_RETURNS,
  EmptyReturnOffer,
  LogisticNode,
} from '../lib/patagoniaRouting';
import { getApiUrl, getOsrmUrl } from '../lib/apiConfig';

const CARRIERS = [
  {
    id: 'cruz-sur',
    name: 'Cruz del Sur',
    logo: 'CS',
    type: 'Carga General y Peligrosa (RN3)',
    status: 'active',
    ratePerKm: 2350,
    transitFactor: 1.0,
    rate: 'Base $2.350/km camión · LTL desde $85/kg',
  },
  {
    id: 'andreani',
    name: 'Andreani B2B',
    logo: 'AN',
    type: 'Paquetería Express B2B & Bio',
    status: 'active',
    ratePerKm: 2680,
    transitFactor: 0.85,
    rate: 'Express 24-48 hs · Desde $12.000/bulto',
  },
  {
    id: 'oro-negro',
    name: 'Oro Negro',
    logo: 'ON',
    type: 'Servicio Petrolero / Carretones',
    status: 'active',
    ratePerKm: 2950,
    transitFactor: 1.15,
    rate: 'Cuenca Neuquina y Golfo San Jorge',
  },
];

const SHIPMENTS = [
  {
    id: 'ENV-100234',
    from: 'Buenos Aires',
    to: 'Neuquén (Añelo)',
    carrier: 'Cruz del Sur',
    date: '22 Oct, 2026',
    status: 'En Tránsito',
    weight: '450 kg · 1.240 km',
  },
  {
    id: 'ENV-100235',
    from: 'Córdoba',
    to: 'Comodoro Rivadavia',
    carrier: 'Andreani B2B',
    date: '21 Oct, 2026',
    status: 'Entregado',
    weight: '250 kg · 1.985 km',
  },
];

export default function LogisticsModule() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<
    | 'rutas'
    | 'cotizador'
    | 'colaborativa'
    | 'monitoreo'
    | 'transportistas'
    | 'envios'
    | 'flotas'
    | 'guias'
  >('rutas');

  // Route & Distance OSRM state
  const [routeOrigin, setRouteOrigin] = useState('Rosario (Polo Industrial)');
  const [routeDest, setRouteDest] = useState('Añelo (Hub Vaca Muerta)');
  const [routeWeight, setRouteWeight] = useState('14000');
  const [fuelConsumption, setFuelConsumption] = useState('34');
  const [fuelPrice, setFuelPrice] = useState('1380');
  const [truckType, setTruckType] = useState<'semirremolque' | 'termico' | 'chasis' | 'carreton'>('semirremolque');
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [calculatedRoute, setCalculatedRoute] = useState<RouteCalculationResult | null>(null);
  const [osrmInput, setOsrmInput] = useState(getOsrmUrl());
  const [showOsrmConfig, setShowOsrmConfig] = useState(false);

  // Quick Quote state
  const [quoteOrigin, setQuoteOrigin] = useState('Buenos Aires (CABA / Puerto)');
  const [quoteDest, setQuoteDest] = useState('Comodoro Rivadavia (Golfo San Jorge)');
  const [quoteWeight, setQuoteWeight] = useState('4500');
  const [quoteRouteResult, setQuoteRouteResult] = useState<RouteCalculationResult | null>(null);
  const [isQuoting, setIsQuoting] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Collaborative / Empty Returns (Bolsa de Cargas)
  const [emptyReturns, setEmptyReturns] = useState<EmptyReturnOffer[]>(INITIAL_EMPTY_RETURNS);
  const [returnSearch, setReturnSearch] = useState('');
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [newTruckOrigin, setNewTruckOrigin] = useState('Comodoro Rivadavia (Golfo San Jorge)');
  const [newTruckDest, setNewTruckDest] = useState('Buenos Aires (CABA / Puerto)');
  const [newTruckType, setNewTruckType] = useState('Semirremolque 28t');
  const [newTruckTons, setNewTruckTons] = useState('22');
  const [newTruckDiscount, setNewTruckDiscount] = useState('35');

  const [locations, setLocations] = useState<string[]>(
    PATAGONIA_LOGISTIC_NODES.map((n) => n.name)
  );
  const [userCategory, setUserCategory] = useState<string>('');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const notify = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 4500);
  };

  // Sync URL query params (?tab=rutas&origin=...&dest=...)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const originParam = searchParams.get('origin');
    const destParam = searchParams.get('dest');

    if (
      tabParam === 'rutas' ||
      tabParam === 'cotizador' ||
      tabParam === 'colaborativa' ||
      tabParam === 'monitoreo'
    ) {
      setActiveTab(tabParam);
    }
    const o = originParam || routeOrigin;
    const d = destParam || routeDest;
    if (originParam) setRouteOrigin(originParam);
    if (destParam) setRouteDest(destParam);

    // Run initial calculation on mount
    runRouteCalculation(o, d);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    const unsubContacts = onSnapshot(collection(db, 'crm_contacts'), (snapshot) => {
      const allLocations = new Set<string>(PATAGONIA_LOGISTIC_NODES.map((n) => n.name));
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.location) allLocations.add(data.location);
      });
      setLocations(Array.from(allLocations));
    });

    const fetchUser = async () => {
      if (auth.currentUser) {
        const docSnap = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (docSnap.exists()) {
          setUserCategory(docSnap.data().category || '');
        }
      }
    };
    fetchUser();

    return () => unsubContacts();
  }, []);

  const isLogisticsProvider = userCategory === 'LOGISTICA';

  const runRouteCalculation = async (orig = routeOrigin, dst = routeDest) => {
    setIsCalculatingRoute(true);
    try {
      const res = await calculatePatagoniaRoute({
        originQuery: orig,
        destQuery: dst,
        weightKg: Number(routeWeight) || 12000,
        fuelConsumptionL100: Number(fuelConsumption) || 34,
        fuelPriceArs: Number(fuelPrice) || 1380,
        truckType,
      });
      setCalculatedRoute(res);
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  const handleRouteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runRouteCalculation(routeOrigin, routeDest);
  };

  const handleSaveOsrmEndpoint = () => {
    setShowOsrmConfig(false);
    notify('Las rutas de producción utilizan OSRM del servidor (/api/logistics/route).');
    runRouteCalculation();
  };

  const handleSelectMapNode = (node: LogisticNode) => {
    if (routeOrigin === node.name) return;
    setRouteDest(node.name);
    runRouteCalculation(routeOrigin, node.name);
  };

  const handleQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsQuoting(true);
    try {
      const res = await calculatePatagoniaRoute({
        originQuery: quoteOrigin,
        destQuery: quoteDest,
        weightKg: Number(quoteWeight) || 4500,
      });
      setQuoteRouteResult(res);
      setShowResults(true);
    } finally {
      setIsQuoting(false);
    }
  };

  const handleTriggerReverseAuction = async (routeData: RouteCalculationResult | null, weightKg: number) => {
    if (!routeData) return;
    try {
      await fetch(`${getApiUrl()}/api/logistics/reverse-auction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: routeData.origin.name,
          destination: routeData.destination.name,
          distanceKm: routeData.distanceKm,
          corridor: routeData.corridor,
          weightKg,
          estimatedBaseArs: routeData.estimatedFreightArs,
        }),
      });
    } catch {
      // Offline / local mode still succeeds visually
    }
    notify(
      `Licitación inversa abierta: ${routeData.origin.shortName} → ${routeData.destination.shortName} (${routeData.distanceKm} km) enviada a transportistas del corredor ${routeData.corridor}.`
    );
  };

  const handlePublishEmptyTruck = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await calculatePatagoniaRoute({
      originQuery: newTruckOrigin,
      destQuery: newTruckDest,
      weightKg: (Number(newTruckTons) || 20) * 1000,
    });
    const offer: EmptyReturnOffer = {
      id: `ret-${Date.now()}`,
      carrier: 'Mi Flota Registrada (xPatagonia)',
      origin: res.origin.name,
      destination: res.destination.name,
      corridor: res.corridor,
      truckType: newTruckType,
      availableTons: Number(newTruckTons) || 20,
      distanceKm: res.distanceKm,
      departureWindow: 'Salida Programada 24hs',
      discountPercent: Number(newTruckDiscount) || 35,
      pricePerTonArs: Math.round(res.emptyReturnFreightArs / Math.max(1, Number(newTruckTons) || 20)),
      verified: true,
    };
    setEmptyReturns((prev) => [offer, ...prev]);
    setShowPublishModal(false);
    notify(`Camión vacío publicado: ${res.origin.shortName} → ${res.destination.shortName} (${res.distanceKm} km, -${offer.discountPercent}% retorno).`);
  };

  const filteredReturns = emptyReturns.filter((r) => {
    if (!returnSearch.trim()) return true;
    const q = returnSearch.toLowerCase();
    return (
      r.origin.toLowerCase().includes(q) ||
      r.destination.toLowerCase().includes(q) ||
      r.carrier.toLowerCase().includes(q) ||
      r.corridor.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A080C] pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                <Truck className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 dark:text-white">
                  Logística, Rutas OSRM & Bolsa de Cargas
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Cálculo real de distancias sobre OpenStreetMap (costo $0), consolidación LTL y licitación inversa de fletes Norte ↔ Patagonia.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowOsrmConfig(!showOsrmConfig)}
            className="self-start md:self-auto px-3.5 py-2 rounded-xl bg-white dark:bg-[#1A1625] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-orange-500/50 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            <Server className="w-3.5 h-3.5 text-orange-500" />
            <span>Motor: {osrmInput.includes('rutas.') ? 'Supermicro OSRM' : 'OpenStreetMap OSRM'}</span>
          </button>
        </div>

        {/* Optional Supermicro OSRM Endpoint Config Bar */}
        <AnimatePresence>
          {showOsrmConfig && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="bg-white dark:bg-[#1A1625] border border-orange-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Endpoint OSRM / VROOM (Túnel Supermicro Proxmox)
                  </label>
                  <input
                    type="url"
                    value={osrmInput}
                    onChange={(e) => setOsrmInput(e.target.value)}
                    placeholder="https://rutas.xpatagonia.online"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10 text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>
                <div className="flex items-center gap-2 sm:pt-5">
                  <button
                    onClick={() => setOsrmInput('https://rutas.xpatagonia.online')}
                    className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 whitespace-nowrap"
                  >
                    Usar rutas.xpatagonia.online
                  </button>
                  <button
                    onClick={handleSaveOsrmEndpoint}
                    className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold whitespace-nowrap"
                  >
                    Aplicar Motor
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Tabs */}
        <div className="flex gap-2 overflow-x-auto mb-8 bg-white dark:bg-[#1A1625] p-2 rounded-2xl border border-slate-200 dark:border-white/5">
          <button
            onClick={() => setActiveTab('rutas')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 ${
              activeTab === 'rutas'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Route className="w-4 h-4" />
            Rutas & Distancias (OSRM)
          </button>

          <button
            onClick={() => setActiveTab('colaborativa')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 ${
              activeTab === 'colaborativa'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Truck className="w-4 h-4" />
            Bolsa de Cargas & Retorno Vacío
          </button>

          <button
            onClick={() => {
              setActiveTab('cotizador');
            }}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'cotizador'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Cotizador Multi-Tramo
          </button>

          <button
            onClick={() => setActiveTab('monitoreo')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 ${
              activeTab === 'monitoreo'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Radio className="w-4 h-4" />
            Telemetría Satelital
          </button>

          <button
            onClick={() => setActiveTab('transportistas')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'transportistas'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Transportistas
          </button>

          <button
            onClick={() => setActiveTab('envios')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'envios'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Mis Envíos
          </button>

          {isLogisticsProvider && (
            <>
              <button
                onClick={() => setActiveTab('flotas')}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === 'flotas'
                    ? 'bg-orange-500 text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Flota
              </button>
              <button
                onClick={() => setActiveTab('guias')}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === 'guias'
                    ? 'bg-orange-500 text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Guías
              </button>
            </>
          )}
        </div>

        {/* Shared Datalist of all Patagonian & Supply Hubs */}
        <datalist id="locations-list">
          {locations.map((loc, i) => (
            <option key={i} value={loc} />
          ))}
        </datalist>

        {/* Tab Contents */}
        <AnimatePresence mode="wait">
          {/* 1. RUTAS & DISTANCIAS (OSRM) */}
          {activeTab === 'rutas' && (
            <motion.div
              key="tab-rutas"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
            >
              {/* Left Form & KPI Output */}
              <div className="lg:col-span-6 space-y-5">
                <div className="bg-white dark:bg-[#1A1625] border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      Calculador Vial de Rutas (OSRM / OSM)
                    </h2>
                    <span className="text-[11px] font-mono text-slate-500">
                      Costo API: $0
                    </span>
                  </div>

                  <form onSubmit={handleRouteSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Origen (Norte o Patagonia)
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500" />
                          <input
                            type="text"
                            list="locations-list"
                            value={routeOrigin}
                            onChange={(e) => setRouteOrigin(e.target.value)}
                            required
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Destino Final
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                          <input
                            type="text"
                            list="locations-list"
                            value={routeDest}
                            onChange={(e) => setRouteDest(e.target.value)}
                            required
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Carga (kg)
                        </label>
                        <input
                          type="number"
                          value={routeWeight}
                          onChange={(e) => setRouteWeight(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-sm font-mono tabular-nums text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Unidad
                        </label>
                        <select
                          value={truckType}
                          onChange={(e) => setTruckType(e.target.value as any)}
                          className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-xs font-medium text-slate-900 dark:text-white"
                        >
                          <option value="semirremolque">Semirremolque</option>
                          <option value="termico">Térmico -25°C</option>
                          <option value="chasis">Chasis Liviano</option>
                          <option value="carreton">Carretón Petrolero</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          L / 100 km
                        </label>
                        <input
                          type="number"
                          value={fuelConsumption}
                          onChange={(e) => setFuelConsumption(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-sm font-mono tabular-nums text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Gasoil $/L
                        </label>
                        <input
                          type="number"
                          value={fuelPrice}
                          onChange={(e) => setFuelPrice(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-sm font-mono tabular-nums text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* Quick Presets */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[
                        { label: 'Rosario → Añelo', o: 'Rosario (Polo Industrial)', d: 'Añelo (Hub Vaca Muerta)' },
                        { label: 'CABA → Comodoro', o: 'Buenos Aires (CABA / Puerto)', d: 'Comodoro Rivadavia (Golfo San Jorge)' },
                        { label: 'Córdoba → Neuquén', o: 'Córdoba Capital (Parque Industrial)', d: 'Neuquén Capital (Parque Industrial)' },
                        { label: 'Madryn → Ushuaia', o: 'Puerto Madryn (Puerto / Aluar)', d: 'Ushuaia (Puerto Austral)' },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            setRouteOrigin(preset.o);
                            setRouteDest(preset.d);
                            runRouteCalculation(preset.o, preset.d);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-orange-500/15 text-[11px] font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    <button
                      type="submit"
                      disabled={isCalculatingRoute}
                      className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                    >
                      {isCalculatingRoute ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Route className="w-4 h-4" />
                      )}
                      <span>{isCalculatingRoute ? 'Calculando ruta vial...' : 'Calcular Distancia y Costo Operativo'}</span>
                    </button>
                  </form>
                </div>

                {/* Route Metrics Summary */}
                {calculatedRoute && (
                  <div className="bg-white dark:bg-[#1A1625] border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-white/5 pb-3">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-orange-500 block">
                          {calculatedRoute.corridor}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          {calculatedRoute.origin.shortName} → {calculatedRoute.destination.shortName}
                        </h3>
                      </div>
                      <span className="text-[11px] font-mono text-slate-500">
                        {calculatedRoute.engineUsed}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono tabular-nums">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200/70 dark:border-white/5">
                        <span className="text-[10px] font-sans uppercase text-slate-500 block">Distancia Vial</span>
                        <span className="text-lg font-bold text-slate-900 dark:text-white">
                          {calculatedRoute.distanceKm.toLocaleString('es-AR')} km
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200/70 dark:border-white/5">
                        <span className="text-[10px] font-sans uppercase text-slate-500 block">Tránsito Camión</span>
                        <span className="text-lg font-bold text-slate-900 dark:text-white">
                          {calculatedRoute.durationHours} hs
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200/70 dark:border-white/5">
                        <span className="text-[10px] font-sans uppercase text-slate-500 block">Combustible</span>
                        <span className="text-lg font-bold text-slate-900 dark:text-white">
                          {calculatedRoute.fuelLiters} L
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200/70 dark:border-white/5">
                        <span className="text-[10px] font-sans uppercase text-slate-500 block">Huella CO₂</span>
                        <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                          {calculatedRoute.co2Kg} kg
                        </span>
                      </div>
                    </div>

                    {/* Economic Breakdown: Direct vs Empty Return */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10">
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                          <span>Costo Base Flete Directo</span>
                          <span className="font-mono tabular-nums">${calculatedRoute.ratePerKmArs.toLocaleString('es-AR')}/km</span>
                        </div>
                        <div className="text-xl font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                          ${calculatedRoute.estimatedFreightArs.toLocaleString('es-AR')}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Incluye combustible est. ${calculatedRoute.fuelCostArs.toLocaleString('es-AR')}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30">
                        <div className="flex items-center justify-between text-xs text-indigo-600 dark:text-indigo-300 font-semibold mb-1">
                          <span>Consolidado / Retorno Vacío</span>
                          <span className="font-mono">-35%</span>
                        </div>
                        <div className="text-xl font-mono font-bold tabular-nums text-indigo-600 dark:text-indigo-300">
                          ${calculatedRoute.emptyReturnFreightArs.toLocaleString('es-AR')}
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                          Matchea bodega ociosa en {calculatedRoute.corridor.split('(')[0]}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => handleTriggerReverseAuction(calculatedRoute, Number(routeWeight) || 12000)}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold uppercase tracking-wider hover:opacity-90 transition flex items-center justify-center gap-2 whitespace-nowrap"
                      >
                        <Truck className="w-4 h-4" />
                        Abrir Licitación Inversa de Flete
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('colaborativa')}
                        className="py-2.5 px-4 rounded-xl border border-indigo-500/40 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-500/10 transition whitespace-nowrap"
                      >
                        Ver Retornos Vacíos
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Live OSRM GeoJSON Patagonia Corridor Map */}
              <div className="lg:col-span-6">
                <PatagoniaRouteMap
                  route={calculatedRoute}
                  onSelectHub={handleSelectMapNode}
                />
              </div>
            </motion.div>
          )}

          {/* 2. BOLSA DE CARGAS & RETORNO VACÍO (CONSOLIDACIÓN LTL) */}
          {activeTab === 'colaborativa' && (
            <motion.div
              key="tab-colaborativa"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-6"
            >
              <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 sm:p-8 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="max-w-2xl">
                  <span className="text-xs font-bold uppercase tracking-wider text-orange-400 block mb-2">
                    Motor VROOM + OSRM · Eliminación de "Flete Falso"
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-display font-bold mb-2">
                    Bolsa de Cargas & Consolidación de Retornos Vacíos
                  </h2>
                  <p className="text-sm text-slate-300">
                    Conectamos camiones que bajan con insumos desde Buenos Aires, Rosario o Córdoba hacia yacimientos y puertos patagónicos con productores regionales que necesitan despachar hacia el norte con hasta <strong className="text-white">42% de descuento</strong>.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 shrink-0">
                  <button
                    onClick={() => setShowPublishModal(true)}
                    className="px-5 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center gap-2 whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" /> Publicar Camión Vacío
                  </button>
                  <button
                    onClick={() => setActiveTab('rutas')}
                    className="px-5 py-3 bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center gap-2 whitespace-nowrap"
                  >
                    <Route className="w-4 h-4" /> Simular Ruta OSRM
                  </button>
                </div>
              </div>

              {/* Filter Search */}
              <div className="bg-white dark:bg-[#1A1625] border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={returnSearch}
                    onChange={(e) => setReturnSearch(e.target.value)}
                    placeholder="Filtrar por origen, destino, corredor (RN3, RN22) o transportista..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div className="text-xs text-slate-500 font-mono tabular-nums">
                  {filteredReturns.length} viajes con bodega disponible
                </div>
              </div>

              {/* Live Empty Return Offers */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredReturns.map((offer) => (
                  <div
                    key={offer.id}
                    className="bg-white dark:bg-[#1A1625] border border-slate-200 dark:border-white/10 rounded-2xl p-5 flex flex-col justify-between gap-4 hover:border-indigo-500/40 transition-colors shadow-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                          {offer.corridor}
                        </span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          -{offer.discountPercent}% Retorno
                        </span>
                      </div>

                      <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">
                        {offer.origin.split('(')[0].trim()} → {offer.destination.split('(')[0].trim()}
                      </h3>
                      <p className="text-xs text-slate-500 mb-3">{offer.carrier}</p>

                      <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-[#110E17] p-3 rounded-xl font-mono tabular-nums">
                        <div>
                          <span className="text-[10px] font-sans text-slate-400 block">Distancia</span>
                          <span className="font-bold text-slate-900 dark:text-white">{offer.distanceKm} km</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-sans text-slate-400 block">Bodega Libre</span>
                          <span className="font-bold text-slate-900 dark:text-white">{offer.availableTons} tn</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-sans text-slate-400 block">Unidad</span>
                          <span className="font-sans font-medium text-slate-700 dark:text-slate-300 truncate block">
                            {offer.truckType}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-sans text-slate-400 block">Tarifa Ref.</span>
                          <span className="font-bold text-orange-500">${offer.pricePerTonArs.toLocaleString('es-AR')}/tn</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {offer.departureWindow}
                      </span>
                      <button
                        onClick={() =>
                          notify(
                            `Solicitud enviada a ${offer.carrier} para reservar bodega (${offer.origin.split('(')[0]} → ${offer.destination.split('(')[0]}).`
                          )
                        }
                        className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition whitespace-nowrap"
                      >
                        Reservar Bodega
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* 3. COTIZADOR MULTI-TRAMO (CONECTADO A OSRM) */}
          {activeTab === 'cotizador' && (
            <motion.div
              key="tab-cotizador"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              <div className="lg:col-span-5">
                <div className="bg-white dark:bg-[#1A1625] border border-slate-200 dark:border-white/10 rounded-2xl p-6 md:p-8 shadow-sm">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                    Cotizar Envío por Kilómetro Real
                  </h2>

                  <form onSubmit={handleQuote} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Origen
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          list="locations-list"
                          required
                          value={quoteOrigin}
                          onChange={(e) => setQuoteOrigin(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Destino
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          list="locations-list"
                          required
                          value={quoteDest}
                          onChange={(e) => setQuoteDest(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Peso Estimado (kg)
                        </label>
                        <div className="relative">
                          <Package className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="number"
                            required
                            value={quoteWeight}
                            onChange={(e) => setQuoteWeight(e.target.value)}
                            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-sm font-mono tabular-nums text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Valor Declarado
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                            $
                          </span>
                          <input
                            type="number"
                            placeholder="ARS"
                            defaultValue={15000000}
                            className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-sm font-mono tabular-nums text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isQuoting}
                      className="w-full py-3.5 mt-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-2"
                    >
                      {isQuoting ? 'Calculando kilómetros OSRM...' : 'Generar Cotizaciones Reales'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>

              <div className="lg:col-span-7">
                {showResults && quoteRouteResult ? (
                  <div className="space-y-4">
                    <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="text-orange-400 font-bold uppercase tracking-wider block">
                          {quoteRouteResult.corridor}
                        </span>
                        <span className="font-semibold">
                          {quoteRouteResult.origin.shortName} → {quoteRouteResult.destination.shortName}
                        </span>
                      </div>
                      <div className="flex items-center gap-5 font-mono tabular-nums">
                        <span>{quoteRouteResult.distanceKm.toLocaleString('es-AR')} km</span>
                        <span className="text-emerald-400">{quoteRouteResult.formattedDuration}</span>
                      </div>
                    </div>

                    {CARRIERS.map((carrier, idx) => {
                      const weightFactor = Math.min(1, Math.max(0.25, (Number(quoteWeight) || 2000) / 26000));
                      const quoteAmount = Math.round(
                        quoteRouteResult.distanceKm * carrier.ratePerKm * weightFactor
                      );
                      const estHours = Math.round(quoteRouteResult.durationHours * carrier.transitFactor);

                      return (
                        <div
                          key={carrier.id}
                          className={`bg-white dark:bg-[#1A1625] rounded-2xl p-5 border ${
                            idx === 0
                              ? 'border-orange-500 shadow-sm'
                              : 'border-slate-200 dark:border-white/10'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#110E17] flex items-center justify-center border border-slate-200 dark:border-white/5 font-bold text-base text-slate-900 dark:text-white">
                                {carrier.logo}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-slate-900 dark:text-white text-base">
                                    {carrier.name}
                                  </h4>
                                  {idx === 0 && (
                                    <span className="text-[10px] font-bold uppercase text-orange-500">
                                      · Mejor Tarifa
                                    </span>
                                  )}
                                </div>
                                <p className="text-slate-500 text-xs">{carrier.type}</p>
                                <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-600 dark:text-slate-400">
                                  <span>Tránsito est.: {estHours} hs</span>
                                  <span>·</span>
                                  <span className="flex items-center gap-1">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Seguro incluido
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="text-left sm:text-right w-full sm:w-auto">
                              <div className="text-[11px] font-bold text-slate-400 uppercase">
                                Costo Total Estimado
                              </div>
                              <div className="text-xl font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                                ${quoteAmount.toLocaleString('es-AR')}
                              </div>
                              <button
                                onClick={() =>
                                  handleTriggerReverseAuction(quoteRouteResult, Number(quoteWeight) || 4500)
                                }
                                className="mt-2 w-full sm:w-auto px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs rounded-lg hover:opacity-90 transition"
                              >
                                Solicitar Reserva / Remito
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-10 bg-white dark:bg-[#1A1625] border border-slate-200 dark:border-white/10 rounded-2xl border-dashed">
                    <MapPin className="w-10 h-10 text-slate-400 mb-3" />
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                      Cotización Basada en Kilometraje Vial Real
                    </h3>
                    <p className="text-slate-500 text-sm max-w-sm">
                      Ingresa origen, destino y kilos de tu carga para calcular la distancia por ruta nacional y comparar tarifas de transportistas habilitados.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* 4. TELEMETRÍA EN VIVO */}
          {activeTab === 'monitoreo' && (
            <motion.div
              key="tab-monitoreo"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <LogisticsLiveMonitoring />
            </motion.div>
          )}

          {/* 5. TRANSPORTISTAS */}
          {activeTab === 'transportistas' && (
            <motion.div
              key="tab-transportistas"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {CARRIERS.map((carrier) => (
                <div
                  key={carrier.id}
                  className="bg-white dark:bg-[#1A1625] border border-slate-200 dark:border-white/10 rounded-2xl p-6"
                >
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-black/20 flex items-center justify-center border border-slate-200 dark:border-white/5 font-bold text-lg text-slate-900 dark:text-white">
                      {carrier.logo}
                    </div>
                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4" /> Vinculado
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                    {carrier.name}
                  </h3>
                  <p className="text-slate-500 text-sm mb-4">{carrier.type}</p>

                  <div className="pt-4 border-t border-slate-100 dark:border-white/10">
                    <div className="text-[11px] font-bold text-slate-400 uppercase mb-1">
                      Referencia Operativa
                    </div>
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {carrier.rate}
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('cotizador')}
                    className="w-full mt-5 py-2.5 bg-slate-50 dark:bg-[#110E17] hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4" /> Cotizar con {carrier.name}
                  </button>
                </div>
              ))}
            </motion.div>
          )}

          {/* 6. MIS ENVÍOS */}
          {activeTab === 'envios' && (
            <motion.div
              key="tab-envios"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="bg-white dark:bg-[#1A1625] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-slate-200 dark:border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex gap-2 relative w-full sm:w-auto">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Buscar por Tracking ID..."
                      className="w-full sm:w-64 pl-10 pr-4 py-2 bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                  <button
                    onClick={() => setActiveTab('monitoreo')}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300"
                  >
                    <ListFilter className="w-4 h-4" /> Ver Telemetría GPS
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-[#110E17]">
                      <tr>
                        <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Tracking ID
                        </th>
                        <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Transportista
                        </th>
                        <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Ruta
                        </th>
                        <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Carga / Km
                        </th>
                        <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-sm">
                      {SHIPMENTS.map((shipment) => (
                        <tr key={shipment.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                          <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-white">
                            {shipment.id}
                          </td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                            {shipment.carrier}
                          </td>
                          <td className="px-6 py-4 text-slate-900 dark:text-white font-medium">
                            {shipment.from} → {shipment.to}
                          </td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-mono text-xs">
                            {shipment.weight} · {shipment.date}
                          </td>
                          <td className="px-6 py-4 text-xs font-bold">
                            <span
                              className={
                                shipment.status === 'Entregado'
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-amber-600 dark:text-amber-400'
                              }
                            >
                              {shipment.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* 7. FLOTAS & GUÍAS (LOGÍSTICA HABILITADA) */}
          {activeTab === 'flotas' && (
            <motion.div
              key="tab-flotas"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {[
                { name: 'Tractor Iveco Stralis', plate: 'AF-123-BC', driver: 'Marcos Ruiz', cap: '28 Toneladas', status: 'Operativo' },
                { name: 'Camión Scania G410', plate: 'AE-456-XY', driver: 'Juan Pérez', cap: '30 Toneladas', status: 'Operativo' },
                { name: 'Furgón VW Delivery', plate: 'AD-789-ZW', driver: 'En Taller', cap: '9 Toneladas', status: 'Mantenimiento' },
              ].map((v) => (
                <div key={v.plate} className="bg-white dark:bg-[#1A1625] rounded-2xl p-6 border border-slate-200 dark:border-white/10">
                  <div className="flex justify-between items-center mb-3">
                    <Truck className="w-5 h-5 text-orange-500" />
                    <span className="text-xs font-bold text-emerald-500">{v.status}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white">{v.name}</h3>
                  <p className="text-xs font-mono text-slate-500 mb-3">Dominio: {v.plate}</p>
                  <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                    <div>Chofer: {v.driver}</div>
                    <div>Capacidad: {v.cap}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'guias' && (
            <motion.div
              key="tab-guias"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white dark:bg-[#1A1625] rounded-2xl p-6 border border-slate-200 dark:border-white/10"
            >
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                Guías de Remisión Electrónicas
              </h2>
              <p className="text-sm text-slate-500">
                Sincronización automática de remitos con Odoo ERP vía webhook n8n (`flujos.xpatagonia.online`).
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal Publicar Camión Vacío */}
      <AnimatePresence>
        {showPublishModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
              onClick={() => setShowPublishModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#1A1625] rounded-2xl border border-slate-200 dark:border-white/10 p-6 shadow-2xl z-10"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Publicar Retorno Vacío (Flete Ocioso)
                </h3>
                <button
                  onClick={() => setShowPublishModal(false)}
                  className="text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handlePublishEmptyTruck} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Origen de Salida
                  </label>
                  <input
                    type="text"
                    list="locations-list"
                    value={newTruckOrigin}
                    onChange={(e) => setNewTruckOrigin(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Destino de Retorno
                  </label>
                  <input
                    type="text"
                    list="locations-list"
                    value={newTruckDest}
                    onChange={(e) => setNewTruckDest(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                      Toneladas
                    </label>
                    <input
                      type="number"
                      value={newTruckTons}
                      onChange={(e) => setNewTruckTons(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10 text-sm font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                      Dto. %
                    </label>
                    <input
                      type="number"
                      value={newTruckDiscount}
                      onChange={(e) => setNewTruckDiscount(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10 text-sm font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                      Unidad
                    </label>
                    <input
                      type="text"
                      value={newTruckType}
                      onChange={(e) => setNewTruckType(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition"
                >
                  Publicar en Bolsa de Cargas (Cálculo Automático Km)
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Action Feedback Toast */}
      <AnimatePresence>
        {actionFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-6 right-6 z-[120] bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-white/15 flex items-center gap-3 max-w-md text-xs"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{actionFeedback}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
