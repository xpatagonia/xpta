import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Truck, Thermometer, Radio, Gauge, Clock, ShieldCheck, 
  MapPin, AlertCircle, RefreshCw, Sparkles, QrCode, FileText, 
  CheckCircle2, ArrowRight, Activity, Download, Copy, Check
} from 'lucide-react';

interface ActiveTruck {
  id: string;
  carrier: string;
  plate: string;
  driver: string;
  cargo: string;
  weight: string;
  origin: string;
  destination: string;
  corridor: string;
  progressPercent: number;
  currentLocationName: string;
  speedKmH: number;
  tempCelsius: number;
  targetTemp: string;
  tempStatus: 'optimal' | 'warning' | 'dry';
  odometerKm: number;
  eta: string;
  senasaSeal: string;
  co2EstimatedKg: number;
  checkpoints: { name: string; time: string; passed: boolean }[];
}

const TRUCKS_DATA: ActiveTruck[] = [
  {
    id: 'TRK-901',
    carrier: 'Cruz del Sur Logística Frío',
    plate: 'AF-482-PZ',
    driver: 'Raúl Domínguez (Lic. Profesional E1)',
    cargo: 'Langostino y Merluza Congelada para Exportación',
    weight: '19.400 kg',
    origin: 'Puerto Madryn, Chubut',
    destination: 'Ushuaia, Tierra del Fuego',
    corridor: 'Ruta Nacional 3 (Corredor Atlántico Austral)',
    progressPercent: 68,
    currentLocationName: 'Cerca de Comandante Luis Piedrabuena (Santa Cruz)',
    speedKmH: 78,
    tempCelsius: -21.6,
    targetTemp: '-18°C a -24°C',
    tempStatus: 'optimal',
    odometerKm: 1395,
    eta: '5h 20m restante',
    senasaSeal: 'SENASA-PAT-884219-X',
    co2EstimatedKg: 840,
    checkpoints: [
      { name: 'Puerto Madryn (Salida / Carga)', time: '06:00 hs', passed: true },
      { name: 'Trelew (Control Fitosanitario)', time: '07:15 hs', passed: true },
      { name: 'Comodoro Rivadavia (Relevo / Check)', time: '12:30 hs', passed: true },
      { name: 'Río Gallegos (Paso Austral)', time: '19:40 hs', passed: false },
      { name: 'Ushuaia (Depósito Fiscal)', time: '02:00 hs', passed: false },
    ]
  },
  {
    id: 'TRK-902',
    carrier: 'Andreani Pharma & Bio Logística',
    plate: 'AE-319-KL',
    driver: 'Marcos Saldivia',
    cargo: 'Enzimas Biológicas y Reactivos para Biocombustibles',
    weight: '2.800 kg',
    origin: 'Bahía Blanca, Buenos Aires',
    destination: 'Neuquén Capital / Añelo',
    corridor: 'Ruta Nacional 22 (Corredor de los Valles / Vaca Muerta)',
    progressPercent: 82,
    currentLocationName: 'Cipolletti (Río Negro) hacia Puente Neuquén',
    speedKmH: 84,
    tempCelsius: 3.8,
    targetTemp: '+2°C a +8°C',
    tempStatus: 'optimal',
    odometerKm: 512,
    eta: '55 min restante',
    senasaSeal: 'ANMAT-BIO-44910',
    co2EstimatedKg: 310,
    checkpoints: [
      { name: 'Bahía Blanca (Despacho Central)', time: '09:00 hs', passed: true },
      { name: 'Río Colorado (Ingreso Patagónico)', time: '11:45 hs', passed: true },
      { name: 'Choele Choel (Monitoreo Térmico)', time: '13:20 hs', passed: true },
      { name: 'Neuquén Capital (Entrega)', time: '15:15 hs', passed: false },
      { name: 'Añelo (Hub Vaca Muerta)', time: '16:45 hs', passed: false },
    ]
  },
  {
    id: 'TRK-903',
    carrier: 'Oro Negro Servicios Especiales',
    plate: 'AD-904-TT',
    driver: 'Javier Albarracín',
    cargo: 'Herramientas de Perforación y Válvulas Submarinas',
    weight: '26.500 kg',
    origin: 'Comodoro Rivadavia, Chubut',
    destination: 'Pico Truncado / Las Heras, Santa Cruz',
    corridor: 'Ruta Provincial 12 / RN 3 (Cuenca Golfo San Jorge)',
    progressPercent: 45,
    currentLocationName: 'Caleta Olivia (Acceso Norte)',
    speedKmH: 68,
    tempCelsius: 14.2,
    targetTemp: 'Carga General Seca',
    tempStatus: 'dry',
    odometerKm: 82,
    eta: '2h 10m restante',
    senasaSeal: 'GUIA-MIN-00913',
    co2EstimatedKg: 190,
    checkpoints: [
      { name: 'Comodoro Rivadavia (Parque Industrial)', time: '13:00 hs', passed: true },
      { name: 'Ramón Santos (Límite Chubut/Santa Cruz)', time: '13:40 hs', passed: true },
      { name: 'Caleta Olivia (En Tránsito)', time: '14:20 hs', passed: true },
      { name: 'Pico Truncado (Parada Intermedia)', time: '15:30 hs', passed: false },
      { name: 'Las Heras (Yacimiento)', time: '16:30 hs', passed: false },
    ]
  }
];

export default function LogisticsLiveMonitoring() {
  const [trucks, setTrucks] = useState<ActiveTruck[]>(TRUCKS_DATA);
  const [selectedTruckId, setSelectedTruckId] = useState<string>(TRUCKS_DATA[0].id);
  const [isPinging, setIsPinging] = useState(false);
  const [pingSuccess, setPingSuccess] = useState(false);
  const [showManifestModal, setShowManifestModal] = useState(false);
  const [copiedTracking, setCopiedTracking] = useState(false);

  const activeTruck = trucks.find(t => t.id === selectedTruckId) || trucks[0];

  const handleSimulatePing = () => {
    setIsPinging(true);
    setPingSuccess(false);

    setTimeout(() => {
      setTrucks(prev => prev.map(trk => {
        if (trk.id === selectedTruckId) {
          const deltaTemp = (Math.random() * 0.4 - 0.2);
          const newSpeed = Math.min(88, Math.max(65, trk.speedKmH + Math.floor(Math.random() * 6 - 3)));
          return {
            ...trk,
            speedKmH: newSpeed,
            tempCelsius: Number((trk.tempCelsius + deltaTemp).toFixed(1)),
            progressPercent: Math.min(99, trk.progressPercent + 1),
            odometerKm: trk.odometerKm + 8,
          };
        }
        return trk;
      }));
      setIsPinging(false);
      setPingSuccess(true);
      setTimeout(() => setPingSuccess(false), 2500);
    }, 900);
  };

  const handleCopyTracking = () => {
    navigator.clipboard.writeText(activeTruck.id);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Banner de Monitoreo Satelital y Red de Telemetría */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-700/80 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-orange-400 font-mono">
              Red Satelital IoT Patagónica • Frecuencia en Vivo
            </span>
          </div>
          <h2 className="text-2xl font-bold font-display text-white">Telemetría y Rutas en Tiempo Real</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Trazabilidad continua de temperatura en furgón térmico, velocidad GPS, precinto SENASA y cálculo de emisiones para los corredores de la Patagonia Austral.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSimulatePing}
            disabled={isPinging}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-orange-500/20"
          >
            <RefreshCw className={`w-4 h-4 ${isPinging ? 'animate-spin' : ''}`} />
            <span>{isPinging ? 'Consultando satélite...' : 'Ping Satelital GPS'}</span>
          </button>

          <button
            onClick={() => setShowManifestModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 rounded-xl text-xs font-bold transition-all"
          >
            <FileText className="w-4 h-4 text-orange-400" />
            <span>Ver Manifiesto (e-Manifest)</span>
          </button>
        </div>
      </div>

      {pingSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Telemetría actualizada con éxito desde baliza satelital Iridium / LoRaWAN en ruta.</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400">Latencia: 142ms</span>
        </motion.div>
      )}

      {/* Selector de Unidades en Ruta */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {trucks.map((truck) => {
          const isSelected = truck.id === selectedTruckId;
          return (
            <button
              key={truck.id}
              onClick={() => setSelectedTruckId(truck.id)}
              className={`p-4 rounded-2xl text-left transition-all border ${
                isSelected 
                  ? 'bg-white dark:bg-[#1A1625] border-orange-500 shadow-md ring-2 ring-orange-500/20' 
                  : 'bg-white dark:bg-[#1A1625] border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-orange-500">{truck.id}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  truck.tempStatus === 'optimal' 
                    ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                    : truck.tempStatus === 'dry'
                    ? 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    : 'bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                }`}>
                  {truck.tempStatus === 'optimal' ? '❄️ Frío Seguro' : truck.tempStatus === 'dry' ? '📦 Carga Seca' : '⚠️ Atención'}
                </span>
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{truck.carrier}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{truck.cargo}</p>
              
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs font-medium">
                <span className="text-slate-500 dark:text-slate-400 font-mono">{truck.speedKmH} km/h</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">{truck.tempCelsius}°C</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Detalle Integral del Camión Seleccionado */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Métricas de Telemetría (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Tarjeta de Temperatura del Furgón Térmico */}
          <div className="bg-white dark:bg-[#1A1625] rounded-3xl p-6 border border-slate-200 dark:border-white/5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Thermometer className="w-4 h-4 text-blue-500" /> Sensor de Frío
              </span>
              <span className="text-[11px] font-semibold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">
                En Rango SENASA
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold font-mono text-slate-900 dark:text-white">
                {activeTruck.tempCelsius > 0 ? `+${activeTruck.tempCelsius}` : activeTruck.tempCelsius}
              </span>
              <span className="text-lg font-bold text-slate-400">°C</span>
            </div>

            <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex justify-between">
                <span>Rango Establecido:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">{activeTruck.targetTemp}</span>
              </div>
              <div className="flex justify-between">
                <span>Precinto Termógrafo:</span>
                <span className="font-mono text-[11px] text-slate-700 dark:text-slate-200">{activeTruck.senasaSeal}</span>
              </div>
            </div>
          </div>

          {/* Tarjeta de Velocidad y Odómetro */}
          <div className="bg-white dark:bg-[#1A1625] rounded-3xl p-6 border border-slate-200 dark:border-white/5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-orange-500" /> Telemetría GPS
              </span>
              <span className="text-[11px] font-mono text-slate-400">Patente {activeTruck.plate}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 dark:bg-[#110E17] p-3 rounded-xl border border-slate-100 dark:border-white/5">
                <span className="text-[11px] text-slate-400 block">Velocidad</span>
                <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">{activeTruck.speedKmH}</span>
                <span className="text-[10px] text-slate-500 ml-1">km/h</span>
              </div>
              <div className="bg-slate-50 dark:bg-[#110E17] p-3 rounded-xl border border-slate-100 dark:border-white/5">
                <span className="text-[11px] text-slate-400 block">Odómetro Ruta</span>
                <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">{activeTruck.odometerKm}</span>
                <span className="text-[10px] text-slate-500 ml-1">km</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
              <span>Tiempo Estimado (ETA):</span>
              <span className="font-bold text-orange-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {activeTruck.eta}
              </span>
            </div>
          </div>

          {/* Tarjeta de Huella de Carbono del Viaje */}
          <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-3xl p-5 text-xs text-emerald-300">
            <div className="flex items-center gap-2 mb-2 font-bold text-emerald-400">
              <Sparkles className="w-4 h-4" />
              <span>Cálculo ESG • Huella del Tramo</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Emisión estimada: <strong className="text-white font-mono">{activeTruck.co2EstimatedKg} kg CO2e</strong>. 
              Al consolidar carga colaborativa en retorno patagónico, se ahorra hasta un 38% de combustible.
            </p>
          </div>
        </div>

        {/* Mapa y Bitácora de Ruta con Checkpoints (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-[#1A1625] rounded-3xl p-6 border border-slate-200 dark:border-white/5 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-white/5">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-orange-500">
                {activeTruck.corridor}
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                {activeTruck.origin} <span className="text-slate-400 font-normal">➔</span> {activeTruck.destination}
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-mono bg-slate-100 dark:bg-white/10 px-2.5 py-1 rounded-lg text-slate-800 dark:text-slate-200 font-bold">
                {activeTruck.weight}
              </span>
            </div>
          </div>

          {/* Barra de Progreso del Viaje */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold mb-2">
              <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-orange-500" />
                Posición Actual: <span className="text-slate-900 dark:text-white font-bold">{activeTruck.currentLocationName}</span>
              </span>
              <span className="font-mono text-orange-500 font-bold">{activeTruck.progressPercent}% completado</span>
            </div>
            <div className="w-full h-3 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-700"
                style={{ width: `${activeTruck.progressPercent}%` }}
              />
            </div>
          </div>

          {/* Checkpoints de la Ruta Patagónica */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
              Puntos de Control y Postas de Telemetría
            </h4>
            <div className="space-y-3">
              {activeTruck.checkpoints.map((cp, idx) => (
                <div 
                  key={idx}
                  className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                    cp.passed 
                      ? 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-800 dark:text-slate-200' 
                      : 'bg-transparent border-dashed border-slate-200 dark:border-white/10 text-slate-400 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                      cp.passed ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                    }`}>
                      {cp.passed ? '✓' : idx + 1}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">{cp.name}</span>
                      <span className="text-[11px] text-slate-500">{cp.passed ? 'Paso registrado con sensor de furgón' : 'Arribo estimado'}</span>
                    </div>
                  </div>
                  <span className="font-mono font-semibold text-slate-600 dark:text-slate-400">{cp.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Datos del Chofer y Certificación */}
          <div className="p-4 bg-slate-50 dark:bg-[#110E17] rounded-2xl border border-slate-100 dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Conductor a Cargo:</span>
              <span className="font-bold text-slate-900 dark:text-white">{activeTruck.driver}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Seguro de Carga Activo
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE MANIFIESTO ELECTRÓNICO (e-Manifest) */}
      <AnimatePresence>
        {showManifestModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="bg-white dark:bg-[#1A1625] border border-slate-200 dark:border-white/10 w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl flex flex-col">
              <div className="p-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50 dark:bg-white/5">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-orange-500" />
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Manifiesto Electrónico de Carga (e-Manifest)</h3>
                </div>
                <button 
                  onClick={() => setShowManifestModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div className="flex items-center justify-between bg-slate-50 dark:bg-[#110E17] p-3 rounded-xl border border-slate-200 dark:border-white/5">
                  <div>
                    <span className="text-slate-400 block text-[10px]">CÓDIGO DE SEGUIMIENTO</span>
                    <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">{activeTruck.id}</span>
                  </div>
                  <button 
                    onClick={handleCopyTracking}
                    className="flex items-center gap-1 px-3 py-1.5 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 transition"
                  >
                    {copiedTracking ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedTracking ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Transportista</span>
                    <span className="font-bold text-slate-900 dark:text-white">{activeTruck.carrier}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Unidad / Patente</span>
                    <span className="font-bold text-slate-900 dark:text-white">{activeTruck.plate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Origen</span>
                    <span className="font-bold text-slate-900 dark:text-white">{activeTruck.origin}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Destino</span>
                    <span className="font-bold text-slate-900 dark:text-white">{activeTruck.destination}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Naturaleza de Carga</span>
                    <span className="font-bold text-slate-900 dark:text-white">{activeTruck.cargo}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Peso Bruto</span>
                    <span className="font-bold text-slate-900 dark:text-white">{activeTruck.weight}</span>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl text-blue-700 dark:text-blue-300">
                  <span className="font-bold block mb-0.5">Certificación Fitosanitaria y Térmica:</span>
                  <span>{activeTruck.senasaSeal} • Temperatura monitoreada satelitalmente sin roturas de cadena de frío.</span>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 flex items-center justify-end gap-2">
                <button
                  onClick={() => setShowManifestModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    alert('El Manifiesto de Carga Electrónica ha sido generado y preparado para impresión / PDF.');
                    setShowManifestModal(false);
                  }}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-orange-500/20"
                >
                  <Download className="w-3.5 h-3.5" />
                  Descargar Copia Oficial
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
