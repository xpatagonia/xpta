import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  CheckCircle2,
  MessageSquare,
  Sparkles,
  Calendar,
  ShieldCheck,
  Leaf,
  Award,
  FileDown,
  Table2,
  Plus,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/db';
import { getApiUrl } from '../lib/apiConfig';
import { generatePurchaseOrderPdf } from '../lib/pdfDocuments';

export interface RfqProposal {
  id: string;
  providerName: string;
  providerCompany: string;
  providerLocation: string;
  verified: boolean;
  price: string;
  priceNumeric: number;
  priceCurrency: string;
  deliveryTimeDays: number;
  paymentTerms: string;
  co2ImpactKg: number;
  distanceKm: number;
  notes: string;
  status: 'pending' | 'accepted' | 'countered' | 'rejected';
  counterOffer?: {
    price: string;
    terms: string;
    date: string;
  };
}

interface RfqNegotiationModalProps {
  rfq: {
    id: number | string;
    title: string;
    category: string;
    priority: string;
    description: string;
    status: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onAward: (proposalId: string) => void;
}

const SAMPLE_PROPOSALS: RfqProposal[] = [
  {
    id: 'prop-1',
    providerName: 'Ing. Lucas Valenzuela',
    providerCompany: 'Austral Frío Logística S.A.',
    providerLocation: 'Puerto Madryn, Chubut',
    verified: true,
    price: '9.450',
    priceNumeric: 9450,
    priceCurrency: 'USD',
    deliveryTimeDays: 5,
    paymentTerms: 'Anticipo 30% + Saldo contra entrega SENASA',
    co2ImpactKg: 140,
    distanceKm: 180,
    notes: 'Incluye flete con termógrafos satelitales en vivo y seguro de mercadería en tránsito.',
    status: 'pending',
  },
  {
    id: 'prop-2',
    providerName: 'Carlos Benítez',
    providerCompany: 'Metalúrgica Patagónica SRL',
    providerLocation: 'Comodoro Rivadavia, Chubut',
    verified: true,
    price: '8.800',
    priceNumeric: 8800,
    priceCurrency: 'USD',
    deliveryTimeDays: 9,
    paymentTerms: 'Factura A a 30 días con E-Cheq',
    co2ImpactKg: 390,
    distanceKm: 520,
    notes: 'Fabricación certificada bajo norma IRAM-ISO 9001. Cotización llave en mano con precinto de seguridad.',
    status: 'pending',
  },
  {
    id: 'prop-3',
    providerName: 'Mariana Quiroga',
    providerCompany: 'Alpat Biotecnología',
    providerLocation: 'San Antonio Oeste, Río Negro',
    verified: true,
    price: '10.200',
    priceNumeric: 10200,
    priceCurrency: 'USD',
    deliveryTimeDays: 4,
    paymentTerms: 'Transferencia bancaria directa / Carta de crédito',
    co2ImpactKg: 95,
    distanceKm: 90,
    notes: 'Provisión ecológica local con la menor huella de transporte de la región.',
    status: 'pending',
  },
];

export default function RfqNegotiationModal({ rfq, isOpen, onClose, onAward }: RfqNegotiationModalProps) {
  const [proposals, setProposals] = useState<RfqProposal[]>(SAMPLE_PROPOSALS);
  const [selectedProposalId, setSelectedProposalId] = useState<string>(SAMPLE_PROPOSALS[0].id);
  const [viewMode, setViewMode] = useState<'table' | 'detail'>('table');
  const [isPersistedQuotes, setIsPersistedQuotes] = useState(false);

  const [showAddQuote, setShowAddQuote] = useState(false);
  const [newQuote, setNewQuote] = useState({
    supplierName: '',
    supplierLocation: 'Neuquén',
    totalPriceArs: '',
    currency: 'ARS',
    deliveryDays: '7',
    paymentTerms: 'Factura A 30 días',
    distanceKm: '250',
    notes: '',
  });
  const [savingQuote, setSavingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const [isCountering, setIsCountering] = useState(false);
  const [counterPrice, setCounterPrice] = useState('9.000');
  const [counterTerms, setCounterTerms] = useState('Pago contra entrega e-Cheq 45 días');
  const [awardedSuccess, setAwardedSuccess] = useState(false);
  const navigate = useNavigate();

  const loadQuotes = useCallback(async () => {
    if (!isOpen || !rfq?.id) return;
    try {
      const token = await auth.getToken();
      if (!token) return;
      const res = await fetch(`${getApiUrl()}/api/rfqs/${rfq.id}/quotes`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.quotes) && data.quotes.length > 0) {
        const mapped: RfqProposal[] = data.quotes.map((q: any) => {
          const priceNum = Number(q.total_price_ars) || 0;
          const dist = Number(q.distance_km) || 0;
          return {
            id: `db-${q.id}`,
            providerName: q.supplier_name || 'Proveedor B2B',
            providerCompany: q.supplier_name || 'Proveedor B2B',
            providerLocation: q.supplier_location || 'Patagonia',
            verified: Boolean(q.verified),
            price: priceNum.toLocaleString('es-AR'),
            priceNumeric: priceNum,
            priceCurrency: q.currency || 'ARS',
            deliveryTimeDays: Number(q.delivery_days) || 7,
            paymentTerms: q.payment_terms || 'Factura A 30 días',
            co2ImpactKg: Math.max(40, Math.round(dist * 0.65)),
            distanceKm: dist,
            notes: q.notes || 'Propuesta registrada en comparador B2B.',
            status: q.status === 'awarded' ? 'accepted' : 'pending',
          };
        });
        setProposals(mapped);
        setSelectedProposalId(mapped[0].id);
        setIsPersistedQuotes(true);
      } else {
        setProposals(SAMPLE_PROPOSALS);
        setSelectedProposalId(SAMPLE_PROPOSALS[0].id);
        setIsPersistedQuotes(false);
      }
    } catch {
      // keep fallback
    }
  }, [isOpen, rfq?.id]);

  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);

  if (!isOpen) return null;

  const activeProposal = proposals.find((p) => p.id === selectedProposalId) || proposals[0];

  const handleAddQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuoteError(null);
    const totalPrice = Number(newQuote.totalPriceArs);
    if (!newQuote.supplierName.trim() || !totalPrice || totalPrice <= 0) {
      setQuoteError('Completá razón social e importe válido mayor a 0.');
      return;
    }
    setSavingQuote(true);
    try {
      const token = await auth.getToken();
      if (!token) throw new Error('Sesión requerida.');
      const res = await fetch(`${getApiUrl()}/api/rfqs/${rfq.id}/quotes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          supplierName: newQuote.supplierName.trim(),
          supplierLocation: newQuote.supplierLocation.trim(),
          totalPriceArs: totalPrice,
          currency: newQuote.currency,
          deliveryDays: Number(newQuote.deliveryDays) || 7,
          paymentTerms: newQuote.paymentTerms.trim(),
          distanceKm: Number(newQuote.distanceKm) || 0,
          notes: newQuote.notes.trim(),
          verified: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Error guardando cotización.');
      setShowAddQuote(false);
      setNewQuote({
        supplierName: '',
        supplierLocation: 'Neuquén',
        totalPriceArs: '',
        currency: 'ARS',
        deliveryDays: '7',
        paymentTerms: 'Factura A 30 días',
        distanceKm: '250',
        notes: '',
      });
      await loadQuotes();
    } catch (err: any) {
      setQuoteError(err?.message || 'Error guardando cotización.');
    } finally {
      setSavingQuote(false);
    }
  };

  const handleSendCounter = (e: React.FormEvent) => {
    e.preventDefault();
    setProposals((prev) =>
      prev.map((p) => {
        if (p.id === selectedProposalId) {
          return {
            ...p,
            status: 'countered',
            counterOffer: {
              price: counterPrice,
              terms: counterTerms,
              date: new Date().toLocaleDateString('es-AR'),
            },
          };
        }
        return p;
      })
    );
    setIsCountering(false);
  };

  const handleAcceptProposal = (propId: string) => {
    setSelectedProposalId(propId);
    setProposals((prev) =>
      prev.map((p) => ({
        ...p,
        status: p.id === propId ? 'accepted' : 'rejected',
      }))
    );
    setAwardedSuccess(true);
    onAward(propId);
  };

  const handleDownloadPurchaseOrder = (proposal: RfqProposal) => {
    generatePurchaseOrderPdf({
      rfqId: rfq.id,
      rfqTitle: rfq.title,
      rfqCategory: rfq.category,
      supplierCompany: proposal.providerCompany,
      supplierLocation: proposal.providerLocation,
      priceLabel: `${proposal.priceCurrency} ${proposal.price}`,
      deliveryDays: proposal.deliveryTimeDays,
      paymentTerms: proposal.paymentTerms,
      notes: proposal.notes,
      buyerEmail: auth.currentUser?.email || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-[#1A1625] border border-slate-200 dark:border-white/10 w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl flex flex-col my-8 max-h-[90vh]"
      >
        {/* Cabecera del Requerimiento */}
        <div className="p-5 sm:p-6 bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 font-mono">
                RFQ #{String(rfq.id).padStart(5, '0')}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{rfq.category}</span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                {isPersistedQuotes ? 'Cotizaciones Reales DB' : 'Matriz Comparativa Referencial'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{rfq.title}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">{rfq.description}</p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            {!awardedSuccess && (
              <>
                <button
                  type="button"
                  onClick={() => setViewMode(viewMode === 'table' ? 'detail' : 'table')}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#110E17] text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5"
                >
                  <Table2 className="w-3.5 h-3.5 text-orange-500" />
                  {viewMode === 'table' ? 'Ver Detalle / Contraoferta' : 'Tabla Comparativa'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddQuote(!showAddQuote)}
                  className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Cargar Cotización
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {awardedSuccess ? (
            <div className="p-10 sm:p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <Award className="w-9 h-9" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                ¡Orden Adjudicada con Éxito!
              </h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Se adjudicó la provisión a <strong>{activeProposal.providerCompany}</strong> por{' '}
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {activeProposal.priceCurrency} {activeProposal.price}
                </span>
                . Descargá la Orden de Compra formal en PDF o coordiná por Chat B2B.
              </p>
              <div className="pt-4 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => handleDownloadPurchaseOrder(activeProposal)}
                  className="px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 rounded-xl text-xs font-bold flex items-center gap-2"
                >
                  <FileDown className="w-4 h-4" /> Descargar Orden de Compra (PDF)
                </button>
                <button
                  onClick={() => navigate('/chat')}
                  className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" /> Abrir Chat B2B
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  Finalizar
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {showAddQuote && (
                <form
                  onSubmit={handleAddQuote}
                  className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/20 border border-purple-500/30 space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-800 dark:text-purple-300">
                      Registrar Cotización Real en Comparador
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddQuote(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  </div>
                  {quoteError && (
                    <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 font-semibold">
                      {quoteError}
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <input
                      required
                      type="text"
                      placeholder="Empresa / Proveedor *"
                      value={newQuote.supplierName}
                      onChange={(e) => setNewQuote({ ...newQuote, supplierName: e.target.value })}
                      className="sm:col-span-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1A1625] text-slate-900 dark:text-white"
                    />
                    <input
                      required
                      type="number"
                      placeholder="Importe Total *"
                      value={newQuote.totalPriceArs}
                      onChange={(e) => setNewQuote({ ...newQuote, totalPriceArs: e.target.value })}
                      className="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1A1625] font-mono text-slate-900 dark:text-white"
                    />
                    <select
                      value={newQuote.currency}
                      onChange={(e) => setNewQuote({ ...newQuote, currency: e.target.value })}
                      className="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1A1625] text-slate-900 dark:text-white"
                    >
                      <option value="ARS">ARS</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <input
                      type="text"
                      placeholder="Ciudad / Provincia"
                      value={newQuote.supplierLocation}
                      onChange={(e) => setNewQuote({ ...newQuote, supplierLocation: e.target.value })}
                      className="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1A1625] text-slate-900 dark:text-white"
                    />
                    <input
                      type="number"
                      placeholder="Plazo (días)"
                      value={newQuote.deliveryDays}
                      onChange={(e) => setNewQuote({ ...newQuote, deliveryDays: e.target.value })}
                      className="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1A1625] font-mono text-slate-900 dark:text-white"
                    />
                    <input
                      type="text"
                      placeholder="Condición de pago"
                      value={newQuote.paymentTerms}
                      onChange={(e) => setNewQuote({ ...newQuote, paymentTerms: e.target.value })}
                      className="sm:col-span-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1A1625] text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="submit"
                      disabled={savingQuote}
                      className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold"
                    >
                      {savingQuote ? 'Guardando...' : 'Guardar en Matriz Comparativa'}
                    </button>
                  </div>
                </form>
              )}

              {viewMode === 'table' ? (
                <div className="space-y-4">
                  <div className="overflow-x-auto border border-slate-200 dark:border-white/10 rounded-2xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-[#110E17] border-b border-slate-200 dark:border-white/10 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          <th className="px-4 py-3">Proveedor</th>
                          <th className="px-4 py-3 text-right">Importe Total</th>
                          <th className="px-4 py-3 text-right">Plazo</th>
                          <th className="px-4 py-3">Condición de Pago</th>
                          <th className="px-4 py-3 text-right">Distancia / CO2</th>
                          <th className="px-4 py-3 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {proposals.map((prop) => {
                          const isSelected = prop.id === selectedProposalId;
                          return (
                            <tr
                              key={prop.id}
                              onClick={() => setSelectedProposalId(prop.id)}
                              className={`cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-orange-500/10'
                                  : 'hover:bg-slate-50 dark:hover:bg-white/5'
                              }`}
                            >
                              <td className="px-4 py-3.5">
                                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                  {prop.providerCompany}
                                  {prop.verified && <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />}
                                </div>
                                <div className="text-slate-500 text-[11px]">{prop.providerLocation}</div>
                              </td>
                              <td className="px-4 py-3.5 text-right font-mono font-bold tabular-nums text-orange-600 dark:text-orange-400 whitespace-nowrap">
                                {prop.priceCurrency} {prop.price}
                              </td>
                              <td className="px-4 py-3.5 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200 whitespace-nowrap">
                                {prop.deliveryTimeDays} días
                              </td>
                              <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 max-w-[220px]">
                                {prop.paymentTerms}
                              </td>
                              <td className="px-4 py-3.5 text-right font-mono tabular-nums text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                                {prop.distanceKm} km · {prop.co2ImpactKg} kg CO2
                              </td>
                              <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownloadPurchaseOrder(prop);
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 font-bold"
                                    title="Exportar Orden de Compra PDF"
                                  >
                                    OC PDF
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAcceptProposal(prop.id);
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                                  >
                                    Adjudicar
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Lista Comparativa de Propuestas Recibidas (5 cols) */}
                  <div className="lg:col-span-5 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                      <span>Propuestas Recibidas ({proposals.length})</span>
                      <span className="text-[10px] text-orange-500 font-semibold">Comparador B2B</span>
                    </h3>

                    <div className="space-y-2.5">
                      {proposals.map((prop) => {
                        const isSelected = prop.id === selectedProposalId;
                        return (
                          <button
                            key={prop.id}
                            onClick={() => {
                              setSelectedProposalId(prop.id);
                              setIsCountering(false);
                            }}
                            className={`w-full text-left p-4 rounded-2xl border transition-all ${
                              isSelected
                                ? 'bg-orange-50/60 dark:bg-orange-500/10 border-orange-500 shadow-sm ring-2 ring-orange-500/20'
                                : 'bg-white dark:bg-[#110E17] border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-xs text-slate-900 dark:text-white truncate flex items-center gap-1">
                                {prop.providerCompany}
                                {prop.verified && <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />}
                              </span>
                              <span className="font-extrabold text-sm font-mono tabular-nums text-orange-600 dark:text-orange-400">
                                {prop.priceCurrency} {prop.price}
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between mt-1">
                              <span>Plazo: {prop.deliveryTimeDays} días</span>
                              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                                <Leaf className="w-3 h-3" /> {prop.co2ImpactKg} kg CO2
                              </span>
                            </div>

                            {prop.status === 'countered' && (
                              <div className="mt-2 text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 px-2 py-0.5 rounded">
                                Contraoferta enviada: {prop.counterOffer?.price} {prop.priceCurrency}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Detalle de la Propuesta Seleccionada y Opciones de Negociación (7 cols) */}
                  <div className="lg:col-span-7 bg-slate-50 dark:bg-[#110E17] p-6 rounded-2xl border border-slate-200 dark:border-white/5 flex flex-col justify-between space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Proveedor Seleccionado
                          </span>
                          <h4 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                            {activeProposal.providerCompany}
                            <ShieldCheck className="w-4 h-4 text-blue-500" />
                          </h4>
                          <span className="text-xs text-slate-500">
                            {activeProposal.providerName} • {activeProposal.providerLocation}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Presupuesto Final
                          </span>
                          <span className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
                            {activeProposal.priceCurrency} {activeProposal.price}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-white dark:bg-[#1A1625] p-3 rounded-xl border border-slate-200 dark:border-white/5">
                          <span className="text-slate-400 block text-[11px] mb-0.5">Plazo de Entrega</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-orange-500" /> {activeProposal.deliveryTimeDays} días corridos
                          </span>
                        </div>
                        <div className="bg-white dark:bg-[#1A1625] p-3 rounded-xl border border-slate-200 dark:border-white/5">
                          <span className="text-slate-400 block text-[11px] mb-0.5">Huella Logística ESG</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Leaf className="w-3.5 h-3.5" /> {activeProposal.co2ImpactKg} kg CO2 ({activeProposal.distanceKm} km)
                          </span>
                        </div>
                      </div>

                      <div className="p-3.5 bg-white dark:bg-[#1A1625] rounded-xl border border-slate-200 dark:border-white/5 text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Condición de Pago Ofertada:
                        </span>
                        <span className="text-slate-600 dark:text-slate-400">{activeProposal.paymentTerms}</span>
                      </div>

                      <div className="p-3.5 bg-white dark:bg-[#1A1625] rounded-xl border border-slate-200 dark:border-white/5 text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Notas Técnicas del Proveedor:
                        </span>
                        <p className="text-slate-600 dark:text-slate-400 italic">"{activeProposal.notes}"</p>
                      </div>

                      {isCountering && (
                        <form
                          onSubmit={handleSendCounter}
                          className="p-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-500/30 rounded-2xl space-y-3 text-xs"
                        >
                          <h5 className="font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-purple-500" />
                            Enviar Contraoferta Directa
                          </h5>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                                Precio Objetivo ({activeProposal.priceCurrency})
                              </label>
                              <input
                                type="text"
                                value={counterPrice}
                                onChange={(e) => setCounterPrice(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-purple-200 dark:border-white/10 bg-white dark:bg-[#1A1625] text-slate-900 dark:text-white font-mono font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                                Términos de Pago Propuestos
                              </label>
                              <input
                                type="text"
                                value={counterTerms}
                                onChange={(e) => setCounterTerms(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-purple-200 dark:border-white/10 bg-white dark:bg-[#1A1625] text-slate-900 dark:text-white"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setIsCountering(false)}
                              className="px-3 py-1.5 text-slate-500 hover:text-slate-700 font-bold"
                            >
                              Cancelar
                            </button>
                            <button
                              type="submit"
                              className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold"
                            >
                              Enviar al Proveedor
                            </button>
                          </div>
                        </form>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => navigate('/chat')}
                          className="flex items-center gap-1.5 px-3 py-2 bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 rounded-xl font-bold transition"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-orange-500" />
                          <span>Chat B2B</span>
                        </button>

                        {!isCountering && activeProposal.status !== 'countered' && (
                          <button
                            type="button"
                            onClick={() => setIsCountering(true)}
                            className="flex items-center gap-1.5 px-3 py-2 border border-purple-500/40 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 rounded-xl font-bold transition"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Contraofertar</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDownloadPurchaseOrder(activeProposal)}
                          className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl font-bold transition"
                        >
                          <FileDown className="w-3.5 h-3.5 text-orange-500" />
                          <span>OC PDF</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAcceptProposal(activeProposal.id)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/20 transition"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Adjudicar y Emitir OC</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
