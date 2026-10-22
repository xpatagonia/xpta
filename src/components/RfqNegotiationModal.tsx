import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, CheckCircle2, XCircle, ArrowRight, MessageSquare, 
  Sparkles, DollarSign, Calendar, Truck, ShieldCheck, Leaf, 
  Send, FileCheck, ExternalLink, AlertCircle, ChevronDown, Award
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export interface RfqProposal {
  id: string;
  providerName: string;
  providerCompany: string;
  providerLocation: string;
  verified: boolean;
  price: string;
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
    priceCurrency: 'USD',
    deliveryTimeDays: 4,
    paymentTerms: 'Transferencia bancaria directa / Carta de crédito',
    co2ImpactKg: 95,
    distanceKm: 90,
    notes: 'Provisión ecológica local con la menor huella de transporte de la región.',
    status: 'pending',
  }
];

export default function RfqNegotiationModal({ rfq, isOpen, onClose, onAward }: RfqNegotiationModalProps) {
  const [proposals, setProposals] = useState<RfqProposal[]>(SAMPLE_PROPOSALS);
  const [selectedProposalId, setSelectedProposalId] = useState<string>(SAMPLE_PROPOSALS[0].id);
  const [isCountering, setIsCountering] = useState(false);
  const [counterPrice, setCounterPrice] = useState('9.000');
  const [counterTerms, setCounterTerms] = useState('Pago contra entrega e-Cheq 45 días');
  const [awardedSuccess, setAwardedSuccess] = useState(false);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const activeProposal = proposals.find(p => p.id === selectedProposalId) || proposals[0];

  const handleSendCounter = (e: React.FormEvent) => {
    e.preventDefault();
    setProposals(prev => prev.map(p => {
      if (p.id === selectedProposalId) {
        return {
          ...p,
          status: 'countered',
          counterOffer: {
            price: counterPrice,
            terms: counterTerms,
            date: new Date().toLocaleDateString(),
          }
        };
      }
      return p;
    }));
    setIsCountering(false);
  };

  const handleAcceptProposal = (propId: string) => {
    setProposals(prev => prev.map(p => ({
      ...p,
      status: p.id === propId ? 'accepted' : 'rejected'
    })));
    setAwardedSuccess(true);
    onAward(propId);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-[#1A1625] border border-slate-200 dark:border-white/10 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col my-8"
      >
        {/* Cabecera del Requerimiento */}
        <div className="p-6 bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                RFQ #{String(rfq.id).padStart(5, '0')}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{rfq.category}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{rfq.title}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">{rfq.description}</p>
          </div>

          <button
            onClick={onClose}
            className="self-start sm:self-center p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition"
          >
            ✕
          </button>
        </div>

        {awardedSuccess ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <Award className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">¡Acuerdo Comercial Cerrado con Éxito!</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Se ha adjudicado la provisión a <strong>{activeProposal.providerCompany}</strong>. Se generó la Orden de Compra B2B con número de trazabilidad electrónica.
            </p>
            <div className="pt-4 flex justify-center gap-3">
              <button
                onClick={() => navigate('/chat')}
                className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-orange-500/20"
              >
                <MessageSquare className="w-4 h-4" /> Abrir Chat B2B con la Empresa
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
          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Lista Comparativa de Propuestas Recibidas (5 cols) */}
            <div className="lg:col-span-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span>Propuestas Recibidas ({proposals.length})</span>
                <span className="text-[10px] text-orange-500 font-semibold">Comparador B2B</span>
              </h3>

              <div className="space-y-2.5">
                {proposals.map(prop => {
                  const isSelected = prop.id === selectedProposalId;
                  return (
                    <button
                      key={prop.id}
                      onClick={() => { setSelectedProposalId(prop.id); setIsCountering(false); }}
                      className={`w-full text-left p-4 rounded-2xl border transition-all ${
                        isSelected 
                          ? 'bg-orange-50/60 dark:bg-orange-500/10 border-orange-500 shadow-sm ring-2 ring-orange-500/20' 
                          : 'bg-white dark:bg-[#110E17] border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-slate-900 dark:text-white truncate flex items-center gap-1">
                          {prop.providerCompany}
                          {prop.verified && (
                            <span title="Verificado">
                              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                            </span>
                          )}
                        </span>
                        <span className="font-extrabold text-sm font-mono text-orange-600 dark:text-orange-400">
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
                          Contraoferta enviada: {prop.counterOffer?.price} USD
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Detalle de la Propuesta Seleccionada y Opciones de Negociación (7 cols) */}
            <div className="lg:col-span-7 bg-slate-50 dark:bg-[#110E17] p-6 rounded-3xl border border-slate-200 dark:border-white/5 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Proveedor Seleccionado</span>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                      {activeProposal.providerCompany}
                      <ShieldCheck className="w-4 h-4 text-blue-500" />
                    </h4>
                    <span className="text-xs text-slate-500">{activeProposal.providerName} • {activeProposal.providerLocation}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Presupuesto Final</span>
                    <span className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white">
                      {activeProposal.priceCurrency} {activeProposal.price}
                    </span>
                  </div>
                </div>

                {/* Métricas de Decisión: Plazo, Términos y Huella ESG */}
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
                  <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Condición de Pago Ofertada:</span>
                  <span className="text-slate-600 dark:text-slate-400">{activeProposal.paymentTerms}</span>
                </div>

                <div className="p-3.5 bg-white dark:bg-[#1A1625] rounded-xl border border-slate-200 dark:border-white/5 text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Notas Técnicas del Proveedor:</span>
                  <p className="text-slate-600 dark:text-slate-400 italic">"{activeProposal.notes}"</p>
                </div>

                {/* Formulario de Contraoferta si está desplegado */}
                {isCountering && (
                  <form onSubmit={handleSendCounter} className="p-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-500/30 rounded-2xl space-y-3 text-xs">
                    <h5 className="font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      Enviar Contraoferta Directa
                    </h5>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Precio Objetivo ({activeProposal.priceCurrency})</label>
                        <input
                          type="text"
                          value={counterPrice}
                          onChange={e => setCounterPrice(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-purple-200 dark:border-white/10 bg-white dark:bg-[#1A1625] text-slate-900 dark:text-white font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Términos de Pago Propuestos</label>
                        <input
                          type="text"
                          value={counterTerms}
                          onChange={e => setCounterTerms(e.target.value)}
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
                        className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold shadow-md shadow-purple-600/20"
                      >
                        Enviar al Proveedor
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Botonera de Acción */}
              <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
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
                </div>

                <button
                  type="button"
                  onClick={() => handleAcceptProposal(activeProposal.id)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/20 transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Aceptar y Emitir Orden de Compra</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
