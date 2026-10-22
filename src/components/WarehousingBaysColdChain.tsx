import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building, Thermometer, ShieldAlert, CheckCircle2, 
  Layers, Package, AlertTriangle, Clock, RefreshCw, 
  Sparkles, Plus, Check, Info, Box
} from 'lucide-react';

interface Bay {
  id: string;
  name: string;
  type: 'frozen' | 'chilled' | 'dry';
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  tenant?: string;
  cargoDescription?: string;
  tempExpected?: string;
}

const WAREHOUSE_CHAMBERS = [
  {
    id: 'wh-comodoro',
    name: 'Parque Industrial Comodoro Rivadavia (Chubut)',
    totalCapacity: 650,
    occupiedPallets: 430,
    chambers: [
      { name: 'Cámara A (Supercongelados)', currentTemp: -22.4, targetTemp: '-20°C a -25°C', status: 'optimal' },
      { name: 'Cámara B (Refrigerados / Lácteos)', currentTemp: 3.1, targetTemp: '+2°C a +5°C', status: 'optimal' },
      { name: 'Nave C (Carga Seca & Herramental)', currentTemp: 16.8, targetTemp: 'Climatizado', status: 'optimal' },
    ]
  },
  {
    id: 'wh-neuquen',
    name: 'Almacenes del Sur Neuquén Capital',
    totalCapacity: 850,
    occupiedPallets: 780,
    chambers: [
      { name: 'Cámara Bio (Reactivos & Enzimas)', currentTemp: 4.2, targetTemp: '+2°C a +6°C', status: 'optimal' },
      { name: 'Nave Industrial Vaca Muerta', currentTemp: 18.2, targetTemp: 'Ambiente Seco', status: 'optimal' },
    ]
  },
  {
    id: 'wh-madryn',
    name: 'Hub Pesquero y Logístico Puerto Madryn',
    totalCapacity: 420,
    occupiedPallets: 310,
    chambers: [
      { name: 'Túnel de Congelado Rápido', currentTemp: -28.1, targetTemp: '-25°C a -30°C', status: 'optimal' },
      { name: 'Cámara Mantenimiento Langostino', currentTemp: -21.9, targetTemp: '-20°C a -24°C', status: 'optimal' },
    ]
  }
];

const INITIAL_BAYS: Bay[] = [
  { id: 'A-01', name: 'Bahía A-01', type: 'frozen', status: 'occupied', tenant: 'Austral Frío S.A.', cargoDescription: '32 Pallets Merluza', tempExpected: '-22°C' },
  { id: 'A-02', name: 'Bahía A-02', type: 'frozen', status: 'occupied', tenant: 'Pesquera del Atlántico', cargoDescription: '28 Pallets Langostino L1', tempExpected: '-22°C' },
  { id: 'A-03', name: 'Bahía A-03', type: 'frozen', status: 'available', tempExpected: '-22°C' },
  { id: 'A-04', name: 'Bahía A-04', type: 'frozen', status: 'reserved', tenant: 'BioPatagonia Foods', cargoDescription: 'Reserva para ingreso jueves', tempExpected: '-22°C' },
  { id: 'B-01', name: 'Bahía B-01', type: 'chilled', status: 'occupied', tenant: 'Frutícola Río Negro', cargoDescription: '40 Pallets Cerezas Premium', tempExpected: '+3°C' },
  { id: 'B-02', name: 'Bahía B-02', type: 'chilled', status: 'available', tempExpected: '+3°C' },
  { id: 'B-03', name: 'Bahía B-03', type: 'chilled', status: 'available', tempExpected: '+3°C' },
  { id: 'B-04', name: 'Bahía B-04', type: 'chilled', status: 'maintenance', cargoDescription: 'Desinfección programada' },
  { id: 'C-01', name: 'Bahía C-01', type: 'dry', status: 'occupied', tenant: 'Metalúrgica Patagónica SRL', cargoDescription: 'Válvulas esféricas y bridas' },
  { id: 'C-02', name: 'Bahía C-02', type: 'dry', status: 'occupied', tenant: 'PetroSur Energía', cargoDescription: 'Motores trifásicos y bombas' },
  { id: 'C-03', name: 'Bahía C-03', type: 'dry', status: 'available' },
  { id: 'C-04', name: 'Bahía C-04', type: 'dry', status: 'available' },
];

export default function WarehousingBaysColdChain() {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(WAREHOUSE_CHAMBERS[0].id);
  const [bays, setBays] = useState<Bay[]>(INITIAL_BAYS);
  const [selectedBay, setSelectedBay] = useState<Bay | null>(null);
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
  const [companyName, setCompanyName] = useState('Mi Empresa Patagónica');
  const [palletCount, setPalletCount] = useState(15);
  const [daysCount, setDaysCount] = useState(10);
  const [simulatedAlarm, setSimulatedAlarm] = useState(false);
  const [reserveSuccess, setReserveSuccess] = useState(false);

  const currentWh = WAREHOUSE_CHAMBERS.find(w => w.id === selectedWarehouseId) || WAREHOUSE_CHAMBERS[0];

  const handleOpenReserve = (bay: Bay) => {
    setSelectedBay(bay);
    setIsReserveModalOpen(true);
    setReserveSuccess(false);
  };

  const handleConfirmReservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBay) return;

    setBays(prev => prev.map(b => {
      if (b.id === selectedBay.id) {
        return {
          ...b,
          status: 'reserved',
          tenant: companyName,
          cargoDescription: `${palletCount} Pallets reservados por ${daysCount} días`,
        };
      }
      return b;
    }));

    setReserveSuccess(true);
    setTimeout(() => {
      setIsReserveModalOpen(false);
      setSelectedBay(null);
    }, 1500);
  };

  const availableCount = bays.filter(b => b.status === 'available').length;
  const occupiedCount = bays.filter(b => b.status === 'occupied').length;
  const reservedCount = bays.filter(b => b.status === 'reserved').length;

  return (
    <div className="space-y-6">
      
      {/* Selector de Depósitos y Cámaras */}
      <div className="bg-white dark:bg-[#1A1625] rounded-3xl p-6 border border-slate-200 dark:border-white/5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-orange-500 font-mono">
            Centro de Distribución y Depósitos B2B
          </span>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
            Gestión de Bahías y Sensores de Frío
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Monitoreo en vivo de cámaras frigoríficas con semáforo térmico y reserva de posiciones de pallets en tiempo real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {WAREHOUSE_CHAMBERS.map(wh => (
            <button
              key={wh.id}
              onClick={() => setSelectedWarehouseId(wh.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedWarehouseId === wh.id 
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' 
                  : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
              }`}
            >
              {wh.name.split(' (')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Monitor Térmico de Cámaras */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {currentWh.chambers.map((chamber, idx) => {
          const isWarmWarning = simulatedAlarm && idx === 0;
          const displayTemp = isWarmWarning ? -13.5 : chamber.currentTemp;

          return (
            <div 
              key={idx}
              className={`p-5 rounded-3xl border transition-all shadow-sm ${
                isWarmWarning
                  ? 'bg-red-500/10 border-red-500/40 text-red-200 ring-2 ring-red-500/30'
                  : 'bg-white dark:bg-[#1A1625] border-slate-200 dark:border-white/5'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <Thermometer className={`w-4 h-4 ${isWarmWarning ? 'text-red-500' : 'text-blue-500'}`} />
                  {chamber.name}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isWarmWarning 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                }`}>
                  {isWarmWarning ? 'ALERTA TÉRMICA' : 'Normal'}
                </span>
              </div>

              <div className="flex items-baseline gap-2 mt-2">
                <span className={`text-3xl font-extrabold font-mono ${isWarmWarning ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
                  {displayTemp > 0 ? `+${displayTemp}` : displayTemp}
                </span>
                <span className="text-base font-bold text-slate-400">°C</span>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-slate-500">
                <span>Rango Seguro:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{chamber.targetTemp}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Control de Simulacro de Alarma */}
      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-white/5 text-xs">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-orange-500" />
          <span className="text-slate-600 dark:text-slate-400">
            Prueba de contingencia: Simula una interrupción en el suministro eléctrico para verificar el protocolo de generadores de frío.
          </span>
        </div>
        <button
          onClick={() => setSimulatedAlarm(!simulatedAlarm)}
          className={`px-3 py-1.5 rounded-xl font-bold transition text-[11px] ${
            simulatedAlarm 
              ? 'bg-red-600 text-white' 
              : 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-300'
          }`}
        >
          {simulatedAlarm ? 'Restablecer Normalidad' : 'Test Alarma Térmica'}
        </button>
      </div>

      {/* Matriz Visual de Bahías / Posiciones de Pallets */}
      <div className="bg-white dark:bg-[#1A1625] rounded-3xl p-6 border border-slate-200 dark:border-white/5 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-orange-500" />
              Matriz de Bahías de Pallets en Depósito
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Haz clic en cualquier bahía disponible para reservar posiciones de pallets de inmediato.
            </p>
          </div>

          {/* Leyenda de Estados */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="w-3 h-3 rounded-md bg-emerald-500"></span> Disponible ({availableCount})
            </span>
            <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium">
              <span className="w-3 h-3 rounded-md bg-blue-500"></span> Ocupado ({occupiedCount})
            </span>
            <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
              <span className="w-3 h-3 rounded-md bg-amber-500"></span> Reservado ({reservedCount})
            </span>
          </div>
        </div>

        {/* Grilla Interactiva de Bahías */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {bays.map((bay) => {
            const isAvailable = bay.status === 'available';
            const statusBg = {
              available: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 hover:border-emerald-500 text-emerald-900 dark:text-emerald-200 cursor-pointer',
              occupied: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-900 dark:text-blue-200',
              reserved: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-900 dark:text-amber-200',
              maintenance: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 opacity-60',
            }[bay.status];

            return (
              <button
                key={bay.id}
                onClick={() => isAvailable ? handleOpenReserve(bay) : setSelectedBay(bay)}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all min-h-[115px] shadow-sm ${statusBg}`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-mono font-bold text-xs">{bay.id}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {bay.type === 'frozen' ? '❄️ Frío' : bay.type === 'chilled' ? '🍎 Ref.' : '📦 Seco'}
                  </span>
                </div>

                <div className="my-1">
                  {bay.tenant ? (
                    <span className="text-[11px] font-bold block truncate">{bay.tenant}</span>
                  ) : (
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block">
                      + Reservar Bahía
                    </span>
                  )}
                  {bay.cargoDescription && (
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate block">
                      {bay.cargoDescription}
                    </span>
                  )}
                </div>

                <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                  {bay.status === 'available' ? 'Capacidad: 30 Pallets' : 'Estado: ' + bay.status}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* MODAL DE RESERVA DE BAHÍA */}
      <AnimatePresence>
        {isReserveModalOpen && selectedBay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="bg-white dark:bg-[#1A1625] border border-slate-200 dark:border-white/10 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col">
              <div className="p-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50 dark:bg-white/5">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-orange-500" />
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Reserva de Bahía {selectedBay.id}
                  </h3>
                </div>
                <button 
                  onClick={() => setIsReserveModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  ✕
                </button>
              </div>

              {reserveSuccess ? (
                <div className="p-8 text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                    <Check className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">¡Reserva Confirmada!</h4>
                  <p className="text-xs text-slate-500">
                    Se asignó la bahía {selectedBay.id} en {currentWh.name}. La orden de ingreso fue enviada al WMS del depósito.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleConfirmReservation} className="p-6 space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] mb-1">
                      Empresa Solicitante
                    </label>
                    <input 
                      type="text" 
                      value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] mb-1">
                        Cantidad de Pallets
                      </label>
                      <input 
                        type="number" 
                        min={1} 
                        max={30} 
                        value={palletCount}
                        onChange={e => setPalletCount(Number(e.target.value))}
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] mb-1">
                        Estadía Estimada (Días)
                      </label>
                      <input 
                        type="number" 
                        min={1} 
                        max={90} 
                        value={daysCount}
                        onChange={e => setDaysCount(Number(e.target.value))}
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded-xl text-orange-800 dark:text-orange-300">
                    <span className="font-bold block mb-0.5">Condición Térmica Garantizada:</span>
                    <span>Temperatura objetivo: {selectedBay.tempExpected || 'Ambiente Seguro'}. Monitoreo 24/7 con alarma satelital.</span>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsReserveModalOpen(false)}
                      className="px-4 py-2.5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-500/20 transition"
                    >
                      Confirmar Reserva
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
