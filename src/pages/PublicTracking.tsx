import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Truck,
  MapPin,
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ArrowRight,
  PackageCheck,
  AlertCircle,
} from 'lucide-react';
import { getApiUrl } from '../lib/apiConfig';

interface PublicTrackingData {
  trackingCode: string;
  originName: string;
  destinationName: string;
  carrierName: string;
  status: 'ofertado' | 'adjudicado' | 'en_transito' | 'entregado' | 'cancelado';
  vehicleLabel: string;
  corridor: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

const STEPS: { key: PublicTrackingData['status']; label: string; desc: string }[] = [
  { key: 'ofertado', label: 'Contrato Emitido', desc: 'Orden registrada en Bolsa de Cargas' },
  { key: 'adjudicado', label: 'Unidad Adjudicada', desc: 'Transportista y equipo confirmados' },
  { key: 'en_transito', label: 'En Tránsito', desc: 'Circulando por corredor patagónico' },
  { key: 'entregado', label: 'Entregado en Destino', desc: 'Conformidad registrada' },
];

export default function PublicTracking() {
  const { code } = useParams<{ code?: string }>();
  const navigate = useNavigate();

  const [lookupInput, setLookupInput] = useState(code || '');
  const [tracking, setTracking] = useState<PublicTrackingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchTracking = useCallback(async (targetCode: string) => {
    const clean = targetCode.trim().toUpperCase();
    if (!clean) {
      setTracking(null);
      setErrorMsg(null);
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`${getApiUrl()}/api/public/tracking/${encodeURIComponent(clean)}`, {
        cache: 'no-store',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.tracking) {
        setTracking(null);
        setErrorMsg(data?.error || `No encontramos información para el código ${clean}.`);
        return;
      }
      setTracking(data.tracking);
    } catch {
      setErrorMsg('No se pudo consultar el estado del envío en este momento.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (code) {
      setLookupInput(code);
      fetchTracking(code);
    } else {
      setTracking(null);
      setErrorMsg(null);
    }
  }, [code, fetchTracking]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = lookupInput.trim().toUpperCase();
    if (!clean) return;
    navigate(`/tracking/${encodeURIComponent(clean)}`);
  };

  const currentStepIndex = tracking
    ? STEPS.findIndex((s) => s.key === tracking.status)
    : -1;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A080C] pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="bg-white dark:bg-[#1A1625] border border-slate-200 dark:border-white/10 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-orange-500">
                <Truck className="w-4 h-4" /> Portal Público de Trazabilidad xPatagonia
              </span>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 dark:text-white mt-1">
                Seguimiento de Cargas y Remito QR
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Ingresá el código de seguimiento impreso en tu Remito Digital para validar el estado del traslado en tiempo real.
              </p>
            </div>
            <Link
              to="/logistica"
              className="text-xs font-bold text-orange-500 hover:underline whitespace-nowrap shrink-0"
            >
              Ir a Bolsa de Cargas →
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={lookupInput}
                onChange={(e) => setLookupInput(e.target.value.toUpperCase())}
                placeholder="Ej. TRK-742910"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] font-mono uppercase text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/40"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !lookupInput.trim()}
              className="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {loading ? 'Buscando...' : 'Consultar Estado'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 flex items-start gap-3 text-sm text-red-700 dark:text-red-300">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Código no localizado</p>
              <p className="text-xs mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        {tracking && (
          <div className="bg-white dark:bg-[#1A1625] border border-slate-200 dark:border-white/10 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-white/10">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 font-mono text-xs font-bold">
                    {tracking.trackingCode}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">{tracking.corridor}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-2 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-orange-500 shrink-0" />
                  {tracking.originName} → {tracking.destinationName}
                </h2>
              </div>

              <div className="text-left sm:text-right shrink-0">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase">
                  <ShieldCheck className="w-4 h-4" />
                  {tracking.status === 'cancelado'
                    ? 'Cancelado'
                    : STEPS.find((s) => s.key === tracking.status)?.label || tracking.status}
                </span>
                <p className="text-[11px] font-mono tabular-nums text-slate-500 mt-1.5">
                  Actualizado: {new Date(tracking.updatedAt).toLocaleString('es-AR')}
                </p>
              </div>
            </div>

            {tracking.status === 'cancelado' ? (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-700 dark:text-red-300 font-semibold">
                Este contrato de traslado fue marcado como cancelado por el operador o dador de carga.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {STEPS.map((step, idx) => {
                  const completed = currentStepIndex >= idx;
                  const isCurrent = currentStepIndex === idx;
                  return (
                    <div
                      key={step.key}
                      className={`p-4 rounded-xl border transition-colors ${
                        completed
                          ? 'bg-emerald-500/10 border-emerald-500/30'
                          : 'bg-slate-50 dark:bg-[#110E17] border-slate-200 dark:border-white/10 opacity-65'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-[11px] font-bold text-slate-500">
                          0{idx + 1}
                        </span>
                        {completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <p
                        className={`text-xs font-bold ${
                          isCurrent
                            ? 'text-emerald-700 dark:text-emerald-300'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {step.label}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{step.desc}</p>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-[#110E17] p-5 rounded-xl border border-slate-200 dark:border-white/10 text-xs">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Empresa Transportista
                </span>
                <p className="font-bold text-slate-900 dark:text-white text-sm">{tracking.carrierName}</p>
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Unidad Asignada
                </span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{tracking.vehicleLabel}</p>
              </div>
              {tracking.notes && (
                <div className="sm:col-span-2 pt-2 border-t border-slate-200 dark:border-white/10">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Observaciones Operativas
                  </span>
                  <p className="text-slate-600 dark:text-slate-300">{tracking.notes}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2">
              <span className="flex items-center gap-1.5">
                <PackageCheck className="w-4 h-4 text-orange-500" />
                Trazabilidad pública verificable · Datos fiscales y comerciales reservados.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
