import React, { useState, useEffect, useCallback } from 'react';
import {
  Truck,
  Users,
  FileCheck,
  Plus,
  Trash2,
  ShieldCheck,
  ArrowRight,
  Lock,
  CheckCircle2,
  X,
} from 'lucide-react';
import { auth } from '../lib/db';
import { getApiUrl } from '../lib/apiConfig';

interface FleetVehicle {
  id: number;
  name: string;
  plate: string;
  vehicle_type: string;
  capacity_tons: number;
  corridor: string;
  vtv_expiry: string | null;
  insurance_expiry: string | null;
  status: 'disponible' | 'en_ruta' | 'mantenimiento';
}

interface FleetDriver {
  id: number;
  full_name: string;
  dni: string | null;
  linti_license: string | null;
  phone: string | null;
  assigned_vehicle_id: number | null;
  status: string;
}

interface LogisticsContract {
  id: number;
  load_id: string;
  origin_name: string;
  destination_name: string;
  carrier_name: string;
  agreed_price_ars: number;
  status: 'ofertado' | 'adjudicado' | 'en_transito' | 'entregado' | 'cancelado';
  tracking_code: string;
  notes: string | null;
}

interface Props {
  onMembershipActivated?: () => void;
}

export default function FleetControlCenter({ onMembershipActivated }: Props) {
  const [subTab, setSubTab] = useState<'vehicles' | 'drivers' | 'contracts'>('vehicles');
  const [hasLogisticsMembership, setHasLogisticsMembership] = useState(false);
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([]);
  const [drivers, setDrivers] = useState<FleetDriver[]>([]);
  const [contracts, setContracts] = useState<LogisticsContract[]>([]);
  const [openLoads, setOpenLoads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [notice, setNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Add Vehicle modal
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [vForm, setVForm] = useState({
    name: '',
    plate: '',
    vehicleType: 'Semirremolque 28t',
    capacityTons: '28',
    corridor: 'RN 3 / Patagónica',
    vtvExpiry: '',
    insuranceExpiry: '',
  });

  // Add Driver modal
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [dForm, setDForm] = useState({
    fullName: '',
    dni: '',
    lintiLicense: '',
    phone: '',
    assignedVehicleId: '',
  });

  // Bid / Contract modal on a load
  const [bidLoad, setBidLoad] = useState<any | null>(null);
  const [bidForm, setBidForm] = useState({
    vehicleId: '',
    driverId: '',
    agreedPriceArs: '850000',
    notes: '',
  });

  const notify = (type: 'ok' | 'err', text: string) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 5000);
  };

  const loadOverview = useCallback(async () => {
    setLoading(true);
    try {
      const token = await auth.getToken();
      if (!token) return;
      const res = await fetch(`${getApiUrl()}/api/fleet/overview`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const data = await res.json();
      if (res.ok) {
        setHasLogisticsMembership(Boolean(data.hasLogisticsMembership));
        setVehicles(Array.isArray(data.vehicles) ? data.vehicles : []);
        setDrivers(Array.isArray(data.drivers) ? data.drivers : []);
        setContracts(Array.isArray(data.contracts) ? data.contracts : []);
        setOpenLoads(Array.isArray(data.openLoads) ? data.openLoads : []);
      }
    } catch {
      notify('err', 'No se pudo cargar el Centro de Control de Flota.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const handleActivateLogistics = async () => {
    setActivating(true);
    try {
      const token = await auth.getToken();
      const res = await fetch(`${getApiUrl()}/api/org/plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ logisticsPlanActive: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'No se pudo activar la membresía logística');
      await loadOverview();
      onMembershipActivated?.();
      notify('ok', 'Membresía Logística & Control de Flota activada.');
    } catch (err: any) {
      notify('err', err?.message || 'Error activando membresía logística');
    } finally {
      setActivating(false);
    }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await auth.getToken();
      const res = await fetch(`${getApiUrl()}/api/fleet/vehicles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(vForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Error registrando unidad');
      setShowVehicleModal(false);
      setVForm({
        name: '',
        plate: '',
        vehicleType: 'Semirremolque 28t',
        capacityTons: '28',
        corridor: 'RN 3 / Patagónica',
        vtvExpiry: '',
        insuranceExpiry: '',
      });
      await loadOverview();
      notify('ok', 'Unidad incorporada a la flota.');
    } catch (err: any) {
      notify('err', err?.message || 'No se pudo registrar el vehículo.');
    }
  };

  const handleVehicleStatus = async (id: number, status: string) => {
    try {
      const token = await auth.getToken();
      await fetch(`${getApiUrl()}/api/fleet/vehicles/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      await loadOverview();
    } catch {
      notify('err', 'Error actualizando estado de unidad.');
    }
  };

  const handleDeleteVehicle = async (id: number) => {
    try {
      const token = await auth.getToken();
      await fetch(`${getApiUrl()}/api/fleet/vehicles/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      await loadOverview();
      notify('ok', 'Unidad removida de la flota.');
    } catch {
      notify('err', 'No se pudo eliminar la unidad.');
    }
  };

  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await auth.getToken();
      const res = await fetch(`${getApiUrl()}/api/fleet/drivers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Error registrando chofer');
      setShowDriverModal(false);
      setDForm({ fullName: '', dni: '', lintiLicense: '', phone: '', assignedVehicleId: '' });
      await loadOverview();
      notify('ok', 'Chofer registrado correctamente.');
    } catch (err: any) {
      notify('err', err?.message || 'No se pudo registrar el chofer.');
    }
  };

  const handleDeleteDriver = async (id: number) => {
    try {
      const token = await auth.getToken();
      await fetch(`${getApiUrl()}/api/fleet/drivers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      await loadOverview();
    } catch {
      notify('err', 'No se pudo remover el chofer.');
    }
  };

  const handleCreateContractBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bidLoad) return;
    try {
      const token = await auth.getToken();
      const res = await fetch(`${getApiUrl()}/api/logistics/contracts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          loadId: bidLoad.id,
          originName: bidLoad.origin_name,
          destinationName: bidLoad.destination_name,
          shipperUid: bidLoad.company_uid,
          vehicleId: bidForm.vehicleId || null,
          driverId: bidForm.driverId || null,
          agreedPriceArs: Number(bidForm.agreedPriceArs) || 0,
          notes: bidForm.notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Error enviando propuesta de transporte');
      setBidLoad(null);
      setSubTab('contracts');
      await loadOverview();
      notify('ok', `Contrato propuesto (${data.contract?.tracking_code || 'TRK'}).`);
    } catch (err: any) {
      notify('err', err?.message || 'Error creando contrato de flete.');
    }
  };

  const handleContractStatus = async (contractId: number, status: string) => {
    try {
      const token = await auth.getToken();
      const res = await fetch(`${getApiUrl()}/api/logistics/contracts/${contractId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Error actualizando contrato');
      await loadOverview();
      notify('ok', `Contrato actualizado a estado: ${status}.`);
    } catch (err: any) {
      notify('err', err?.message || 'No se pudo actualizar el contrato.');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Cargando Control de Flota y Contratos...</div>;
  }

  if (!hasLogisticsMembership) {
    return (
      <div className="space-y-6">
        {notice && (
          <div className="px-4 py-3 rounded-xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
            {notice.text}
          </div>
        )}
        <div className="bg-white dark:bg-[#1A1625] border border-orange-500/30 rounded-2xl p-8 space-y-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
              <Lock className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-orange-500">
                Membresía Aparte para Empresas de Logística
              </span>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                Gestión y Control de Flota + Contratación de Fletes
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-2xl">
                Esta suite especializada está separada de los planes PyME comerciales para ofrecer herramientas dedicadas a empresas de transporte: alta de unidades, vencimientos VTV/seguros, choferes con LINTI, postulación a licitaciones de carga y operación contractual en ruta.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10">
              <Truck className="w-5 h-5 text-orange-500 mb-2" />
              <div className="font-bold text-sm text-slate-900 dark:text-white">Control de Flota &amp; VTV</div>
              <p className="text-xs text-slate-500 mt-1">Dominio, tipo de equipo, capacidad en toneladas y alertas documentales.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10">
              <Users className="w-5 h-5 text-orange-500 mb-2" />
              <div className="font-bold text-sm text-slate-900 dark:text-white">Padrón de Choferes LINTI</div>
              <p className="text-xs text-slate-500 mt-1">Asignación directa de conductor habilitado por camión y corredor.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10">
              <FileCheck className="w-5 h-5 text-orange-500 mb-2" />
              <div className="font-bold text-sm text-slate-900 dark:text-white">Contratos de Transporte</div>
              <p className="text-xs text-slate-500 mt-1">Ofertá en Bolsa de Cargas, adjudicá viajes y confirmá entregas con tracking.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleActivateLogistics}
              disabled={activating}
              className="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              {activating ? 'Activando...' : 'Activar Membresía Logística ($95.000 ARS/mes)'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {notice && (
        <div
          className={`px-4 py-3 rounded-xl border text-xs font-semibold ${
            notice.type === 'ok'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300'
          }`}
        >
          {notice.text}
        </div>
      )}

      {/* Sub-navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#1A1625] border border-slate-200 dark:border-white/10 rounded-2xl p-4">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-black/30">
          {[
            { id: 'vehicles', label: `Unidades (${vehicles.length})` },
            { id: 'drivers', label: `Choferes (${drivers.length})` },
            { id: 'contracts', label: `Cargas & Contratos (${contracts.length})` },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id as any)}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                subTab === t.id
                  ? 'bg-white dark:bg-[#1A1625] text-orange-600 dark:text-orange-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowDriverModal(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" /> Alta Chofer
          </button>
          <button
            onClick={() => setShowVehicleModal(true)}
            className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" /> Registrar Unidad
          </button>
        </div>
      </div>

      {/* 1. VEHICLES */}
      {subTab === 'vehicles' && (
        <div className="bg-white dark:bg-[#1A1625] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden">
          {vehicles.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <Truck className="w-9 h-9 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Aún no registraste unidades en tu flota</h3>
              <p className="text-xs text-slate-500">Cargá tus tractores, semirremolques o carretones para asignarlos a cargas patagónicas.</p>
              <button
                onClick={() => setShowVehicleModal(true)}
                className="px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Registrar Primera Unidad
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3.5">Unidad &amp; Dominio</th>
                    <th className="px-5 py-3.5">Tipo &amp; Capacidad</th>
                    <th className="px-5 py-3.5">Documentación (VTV / Seguro)</th>
                    <th className="px-5 py-3.5">Estado Operativo</th>
                    <th className="px-5 py-3.5 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
                  {vehicles.map((v) => (
                    <tr key={v.id}>
                      <td className="px-5 py-4">
                        <div className="font-bold text-sm text-slate-900 dark:text-white">{v.name}</div>
                        <div className="font-mono text-slate-500 mt-0.5">Dominio {v.plate} · {v.corridor}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{v.vehicle_type}</div>
                        <div className="font-mono tabular-nums text-slate-500">{v.capacity_tons} Tn máx.</div>
                      </td>
                      <td className="px-5 py-4 font-mono tabular-nums text-slate-500">
                        <div>VTV: {v.vtv_expiry || 'Cargar vencimiento'}</div>
                        <div>Seguro: {v.insurance_expiry || 'Cargar vencimiento'}</div>
                      </td>
                      <td className="px-5 py-4">
                        <select
                          value={v.status}
                          onChange={(e) => handleVehicleStatus(v.id, e.target.value)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-xs font-semibold text-slate-900 dark:text-white"
                        >
                          <option value="disponible">Disponible</option>
                          <option value="en_ruta">En Ruta</option>
                          <option value="mantenimiento">Mantenimiento</option>
                        </select>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => handleDeleteVehicle(v.id)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10"
                          title="Eliminar unidad"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 2. DRIVERS */}
      {subTab === 'drivers' && (
        <div className="bg-white dark:bg-[#1A1625] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden">
          {drivers.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <Users className="w-9 h-9 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Sin choferes cargados</h3>
              <p className="text-xs text-slate-500">Registrá tus conductores con licencia LINTI para asignarlos a viajes.</p>
              <button
                onClick={() => setShowDriverModal(true)}
                className="px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Registrar Chofer
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {drivers.map((d) => (
                <div key={d.id} className="px-5 py-4 flex items-center justify-between gap-4 text-xs">
                  <div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white">{d.full_name}</div>
                    <div className="text-slate-500 font-mono tabular-nums mt-0.5">
                      DNI {d.dni || 'S/D'} · LINTI {d.linti_license || 'Vigente'} · Tel {d.phone || 'S/D'}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteDriver(d.id)}
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. OPEN LOADS & CONTRACTS */}
      {subTab === 'contracts' && (
        <div className="space-y-6">
          {/* Open loads available for bidding */}
          <div className="bg-white dark:bg-[#1A1625] border border-slate-200 dark:border-white/10 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Cargas Abiertas para Contratación Directa ({openLoads.length})
            </h3>
            {openLoads.length === 0 ? (
              <p className="text-xs text-slate-500">No hay cargas abiertas en Bolsa de Cargas actualmente.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {openLoads.slice(0, 6).map((load) => (
                  <div
                    key={load.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {load.origin_name} → {load.destination_name}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono tabular-nums mt-0.5">
                        {load.truck_type || 'Semirremolque'} · {Math.round((Number(load.weight_kg) || 20000) / 1000)} Tn · {load.distance_km || 1100} km
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setBidLoad(load);
                        setBidForm({
                          vehicleId: vehicles[0] ? String(vehicles[0].id) : '',
                          driverId: drivers[0] ? String(drivers[0].id) : '',
                          agreedPriceArs: String(load.target_price_ars || 950000),
                          notes: '',
                        });
                      }}
                      className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold whitespace-nowrap flex items-center gap-1"
                    >
                      Ofertar Unidad <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contracts table */}
          <div className="bg-white dark:bg-[#1A1625] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-white/10">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Contratos de Transporte en Plataforma ({contracts.length})
              </h3>
            </div>
            {contracts.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Todavía no emitiste ofertas ni contratos de transporte.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-white/5">
                {contracts.map((c) => (
                  <div key={c.id} className="px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-mono font-bold text-slate-900 dark:text-white">
                        {c.tracking_code} · {c.origin_name} → {c.destination_name}
                      </div>
                      <div className="text-slate-500 mt-0.5 font-mono tabular-nums">
                        Transportista: {c.carrier_name} · Tarifa: ${Number(c.agreed_price_ars).toLocaleString()} ARS · Estado: {c.status}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {c.status === 'ofertado' && (
                        <button
                          onClick={() => handleContractStatus(c.id, 'adjudicado')}
                          className="px-3 py-1.5 rounded-lg bg-purple-600 text-white font-bold"
                        >
                          Adjudicar
                        </button>
                      )}
                      {(c.status === 'ofertado' || c.status === 'adjudicado') && (
                        <button
                          onClick={() => handleContractStatus(c.id, 'en_transito')}
                          className="px-3 py-1.5 rounded-lg bg-orange-500 text-white font-bold"
                        >
                          Iniciar Viaje
                        </button>
                      )}
                      {c.status === 'en_transito' && (
                        <button
                          onClick={() => handleContractStatus(c.id, 'entregado')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Confirmar Entrega
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vehicle Modal */}
      {showVehicleModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={() => setShowVehicleModal(false)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-[#1A1625] border border-slate-200 dark:border-white/10 rounded-2xl p-6 z-10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Registrar Unidad de Flota</h3>
              <button onClick={() => setShowVehicleModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAddVehicle} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  required
                  type="text"
                  value={vForm.name}
                  onChange={(e) => setVForm({ ...vForm, name: e.target.value })}
                  placeholder="Equipo (ej. Scania R450)"
                  className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-sm text-slate-900 dark:text-white"
                />
                <input
                  required
                  type="text"
                  value={vForm.plate}
                  onChange={(e) => setVForm({ ...vForm, plate: e.target.value })}
                  placeholder="Dominio (ej. AG-412-KP)"
                  className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-sm font-mono uppercase text-slate-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={vForm.vehicleType}
                  onChange={(e) => setVForm({ ...vForm, vehicleType: e.target.value })}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-sm text-slate-900 dark:text-white"
                >
                  <option>Semirremolque 28t</option>
                  <option>Carretón Petrolero 45t</option>
                  <option>Térmico -25°C</option>
                  <option>Chasis Liviano 10t</option>
                </select>
                <input
                  type="number"
                  value={vForm.capacityTons}
                  onChange={(e) => setVForm({ ...vForm, capacityTons: e.target.value })}
                  placeholder="Toneladas"
                  className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-sm font-mono text-slate-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={vForm.vtvExpiry}
                  onChange={(e) => setVForm({ ...vForm, vtvExpiry: e.target.value })}
                  placeholder="Vencimiento VTV (ej. 08/2027)"
                  className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-sm text-slate-900 dark:text-white"
                />
                <input
                  type="text"
                  value={vForm.insuranceExpiry}
                  onChange={(e) => setVForm({ ...vForm, insuranceExpiry: e.target.value })}
                  placeholder="Vencimiento Seguro"
                  className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-sm text-slate-900 dark:text-white"
                />
              </div>
              <input
                type="text"
                value={vForm.corridor}
                onChange={(e) => setVForm({ ...vForm, corridor: e.target.value })}
                placeholder="Corredor Habitual"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-sm text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider"
              >
                Guardar Unidad
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Driver Modal */}
      {showDriverModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={() => setShowDriverModal(false)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-[#1A1625] border border-slate-200 dark:border-white/10 rounded-2xl p-6 z-10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Registrar Chofer</h3>
              <button onClick={() => setShowDriverModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAddDriver} className="space-y-3">
              <input
                required
                type="text"
                value={dForm.fullName}
                onChange={(e) => setDForm({ ...dForm, fullName: e.target.value })}
                placeholder="Nombre completo del conductor"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-sm text-slate-900 dark:text-white"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={dForm.dni}
                  onChange={(e) => setDForm({ ...dForm, dni: e.target.value })}
                  placeholder="DNI"
                  className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-sm font-mono text-slate-900 dark:text-white"
                />
                <input
                  type="text"
                  value={dForm.lintiLicense}
                  onChange={(e) => setDForm({ ...dForm, lintiLicense: e.target.value })}
                  placeholder="Licencia LINTI / Cargas Pelig."
                  className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-sm text-slate-900 dark:text-white"
                />
              </div>
              <input
                type="text"
                value={dForm.phone}
                onChange={(e) => setDForm({ ...dForm, phone: e.target.value })}
                placeholder="Teléfono de guardia"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-sm text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider"
              >
                Guardar Chofer
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Contract Bid Modal */}
      {bidLoad && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={() => setBidLoad(null)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-[#1A1625] border border-slate-200 dark:border-white/10 rounded-2xl p-6 z-10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Ofertar Contratación: {bidLoad.origin_name} → {bidLoad.destination_name}
              </h3>
              <button onClick={() => setBidLoad(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateContractBid} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Unidad Asignada</label>
                <select
                  value={bidForm.vehicleId}
                  onChange={(e) => setBidForm({ ...bidForm, vehicleId: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-sm text-slate-900 dark:text-white"
                >
                  <option value="">Seleccionar de tu flota...</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.plate})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Chofer Asignado</label>
                <select
                  value={bidForm.driverId}
                  onChange={(e) => setBidForm({ ...bidForm, driverId: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-sm text-slate-900 dark:text-white"
                >
                  <option value="">Seleccionar chofer...</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Tarifa Propuesta (ARS)</label>
                <input
                  required
                  type="number"
                  value={bidForm.agreedPriceArs}
                  onChange={(e) => setBidForm({ ...bidForm, agreedPriceArs: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-sm font-mono text-slate-900 dark:text-white"
                />
              </div>
              <input
                type="text"
                value={bidForm.notes}
                onChange={(e) => setBidForm({ ...bidForm, notes: e.target.value })}
                placeholder="Condiciones de carga, ventana horaria o seguro..."
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-sm text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider"
              >
                Emitir Oferta y Generar Contrato
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
