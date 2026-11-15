import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  CreditCard,
  Building2,
  Wallet,
  CheckCircle,
  Shield,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { auth } from '../lib/db';
import { getApiUrl } from '../lib/apiConfig';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (result: { provider: string; status: 'pending' | 'redirected'; message: string }) => void;
  moduleName: string;
  price: string;
  targetSlug?: string;
}

interface BillingConfig {
  mercadopagoConfigured: boolean;
  bankTransfer: {
    configured: boolean;
    bank: string;
    holder: string;
    cbu: string;
    alias: string;
    note: string;
  };
}

export default function CheckoutModal({
  isOpen,
  onClose,
  onConfirm,
  moduleName,
  price,
  targetSlug = 'pro',
}: CheckoutModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'mercadopago' | 'bank_transfer'>('bank_transfer');
  const [receiptReference, setReceiptReference] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [billingConfig, setBillingConfig] = useState<BillingConfig | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    fetch(`${getApiUrl()}/api/billing/config`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        setBillingConfig(data);
        if (data?.mercadopagoConfigured) {
          setPaymentMethod('mercadopago');
        } else {
          setPaymentMethod('bank_transfer');
        }
      })
      .catch(() => {});
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (paymentMethod === 'bank_transfer' && !receiptReference.trim()) {
      setErrorMsg('Ingresá el número de operación o referencia de transferencia.');
      return;
    }

    setIsProcessing(true);
    try {
      const token = await auth.getToken();
      if (!token) {
        setErrorMsg('Iniciá sesión para continuar con la contratación.');
        return;
      }

      const res = await fetch(`${getApiUrl()}/api/billing/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetSlug,
          provider: paymentMethod,
          receiptReference: receiptReference.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || 'No se pudo procesar la orden de pago.');
      }

      if (data.provider === 'mercadopago' && data.initPoint) {
        onConfirm({
          provider: 'mercadopago',
          status: 'redirected',
          message: 'Redirigiendo a MercadoPago para completar el pago...',
        });
        window.location.assign(data.initPoint);
        return;
      }

      setReceiptReference('');
      onConfirm({
        provider: 'bank_transfer',
        status: 'pending',
        message:
          data?.message ||
          'Comprobante registrado. La activación se habilitará al conciliarse la transferencia.',
      });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al registrar el pago.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 14 }}
            className="relative w-full max-w-lg bg-white dark:bg-[#1A1625] rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10"
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-white/10">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-orange-500" />
                Contratación & Facturación Real
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 bg-slate-50 dark:bg-[#110E17] border-b border-slate-200 dark:border-white/10">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Concepto</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{moduleName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Importe Mensual</span>
                <span className="text-2xl font-mono tabular-nums font-bold text-orange-500">{price}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-semibold text-red-700 dark:text-red-300">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-2.5">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Medio de Pago Verificable
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('mercadopago')}
                    className={`p-3.5 rounded-xl border flex flex-col gap-1.5 text-left transition-colors ${
                      paymentMethod === 'mercadopago'
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10'
                        : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                    }`}
                  >
                    <CreditCard
                      className={`w-5 h-5 ${
                        paymentMethod === 'mercadopago' ? 'text-orange-500' : 'text-slate-400'
                      }`}
                    />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      MercadoPago
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {billingConfig?.mercadopagoConfigured
                        ? 'Activación automática vía webhook'
                        : 'Requiere token MP en servidor'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank_transfer')}
                    className={`p-3.5 rounded-xl border flex flex-col gap-1.5 text-left transition-colors ${
                      paymentMethod === 'bank_transfer'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/10'
                        : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                    }`}
                  >
                    <Building2
                      className={`w-5 h-5 ${
                        paymentMethod === 'bank_transfer' ? 'text-purple-500' : 'text-slate-400'
                      }`}
                    />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Transferencia Bancaria
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Conciliación con nº de operación
                    </span>
                  </button>
                </div>
              </div>

              {paymentMethod === 'mercadopago' ? (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10 text-xs text-slate-600 dark:text-slate-300 space-y-2">
                  <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ExternalLink className="w-4 h-4 text-orange-500" />
                    Checkout Seguro MercadoPago Argentina
                  </p>
                  <p>
                    {billingConfig?.mercadopagoConfigured
                      ? 'Al continuar serás redirigido a MercadoPago. Tu plan o membresía se habilitará automáticamente al confirmarse el webhook de pago.'
                      : 'Las credenciales de MercadoPago aún no están cargadas en el entorno de producción. Cambiá a Transferencia Bancaria para emitir una orden de activación auditable.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 rounded-xl text-xs space-y-1.5 text-slate-700 dark:text-slate-200">
                    <div className="flex items-center gap-2 font-bold text-purple-800 dark:text-purple-300">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      Datos para Transferencia / E-Cheq
                    </div>
                    <p>
                      <strong>Titular:</strong> {billingConfig?.bankTransfer?.holder || 'xPatagonia B2B'}
                    </p>
                    <p>
                      <strong>Banco:</strong> {billingConfig?.bankTransfer?.bank || 'A confirmar'}
                    </p>
                    <p className="font-mono tabular-nums">
                      <strong>CBU/CVU:</strong> {billingConfig?.bankTransfer?.cbu || 'Solicitar en administración'}
                    </p>
                    <p className="font-mono">
                      <strong>Alias:</strong> {billingConfig?.bankTransfer?.alias || 'Solicitar en administración'}
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 pt-1">
                      {billingConfig?.bankTransfer?.note}
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                      Nº de Comprobante / Referencia COELSA / CBU Origen
                    </label>
                    <input
                      type="text"
                      required
                      value={receiptReference}
                      onChange={(e) => setReceiptReference(e.target.value)}
                      placeholder="Ej. TRF-8849201 · Banco Galicia"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/40"
                    />
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 dark:border-white/10 space-y-3">
                <button
                  type="submit"
                  disabled={
                    isProcessing ||
                    (paymentMethod === 'mercadopago' && !billingConfig?.mercadopagoConfigured)
                  }
                  className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors"
                >
                  {isProcessing ? (
                    'Registrando orden...'
                  ) : paymentMethod === 'mercadopago' ? (
                    <>
                      <ExternalLink className="w-4 h-4" /> Continuar en MercadoPago
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" /> Informar Comprobante para Activación
                    </>
                  )}
                </button>
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
                  <Shield className="w-3.5 h-3.5" />
                  Activación auditable mediante webhook o conciliación bancaria
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
