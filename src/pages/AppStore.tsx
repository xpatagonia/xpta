import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check,
  Truck,
  PackageCheck,
  ShieldCheck,
  Database,
  ShoppingBag,
  MessageSquare,
  ExternalLink,
  CreditCard,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/db';
import { getApiUrl } from '../lib/apiConfig';
import {
  ALL_MODULE_SLUGS,
  SAAS_MODULES,
  SAAS_PLANS,
  SaasModuleConfig,
  SaasModuleSlug,
  PymePlanSlug,
} from '../services/saasPlans';
import CheckoutModal from '../components/CheckoutModal';
import AuthModal from '../components/AuthModal';

const MODULE_META: Record<
  SaasModuleSlug,
  { icon: React.ComponentType<{ className?: string }>; category: string }
> = {
  logistica_flota: { icon: Truck, category: 'Operaciones & Flota' },
  warehousing: { icon: PackageCheck, category: 'Infraestructura WMS' },
  kyb_compliance: { icon: ShieldCheck, category: 'Compliance Fiscal' },
  erp_sync: { icon: Database, category: 'Integración ERP & IA' },
  ecommerce_b2b: { icon: ShoppingBag, category: 'Comercial & Ventas' },
  chat_b2b: { icon: MessageSquare, category: 'Comunicaciones' },
};

export default function AppStore() {
  const [selectedModule, setSelectedModule] = useState<SaasModuleConfig | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState<any>(() => auth.currentUser);
  const [planSlug, setPlanSlug] = useState<PymePlanSlug>('gratis');
  const [entitlements, setEntitlements] = useState<Record<string, boolean>>({});
  const [loadingAccess, setLoadingAccess] = useState(true);
  const [notice, setNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const navigate = useNavigate();

  const showNotice = (type: 'ok' | 'err', text: string) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 6500);
  };

  const loadOrganizationModules = useCallback(async () => {
    setLoadingAccess(true);
    try {
      const token = await auth.getToken();
      if (!token) {
        setEntitlements({});
        setPlanSlug('gratis');
        return;
      }
      const res = await fetch(`${getApiUrl()}/api/org/team`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (!res.ok) return;
      const data = await res.json().catch(() => ({}));
      const org = data?.organization;
      if (org) {
        setPlanSlug((org.planSlug as PymePlanSlug) || 'gratis');
        setEntitlements(org.entitlements || {});
      }
    } catch {
      // ignore network error cleanly
    } finally {
      setLoadingAccess(false);
    }
  }, []);

  useEffect(() => {
    loadOrganizationModules();
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      loadOrganizationModules();
    });
    return () => unsubscribe();
  }, [loadOrganizationModules]);

  const handleHireModule = (mod: SaasModuleConfig) => {
    setSelectedModule(mod);
    if (!user) {
      setIsAuthOpen(true);
      return;
    }
    setIsCheckoutOpen(true);
  };

  const modulesList = ALL_MODULE_SLUGS.map((slug) => SAAS_MODULES[slug]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A080C] pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-6">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">
              Catálogo Modular SaaS · {user ? `Plan actual: ${SAAS_PLANS[planSlug].displayName}` : 'Zona de Miembros'}
            </p>
            <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white tracking-tight text-balance">
              Módulos Operativos y Servicios B2B
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 max-w-2xl">
              Activá capacidades especializadas por empresa para logística con motor OSRM, almacenamiento WMS, auditoría fiscal KYB e integración Odoo ERP.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/planes')}
            className="self-start md:self-auto px-4 py-2 rounded-xl border border-slate-300 dark:border-white/15 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-white/5 transition whitespace-nowrap shrink-0"
          >
            Comparar Planes PyME (2 / 5 / 10 usuarios)
          </button>
        </div>

        {notice && (
          <div
            className={`mb-6 px-4 py-3 rounded-xl border text-xs font-semibold ${
              notice.type === 'ok'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300'
            }`}
          >
            {notice.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modulesList.map((mod) => {
            const meta = MODULE_META[mod.slug];
            const Icon = meta.icon;
            const isEntitled = Boolean(entitlements[mod.slug]);
            const includedInCurrentPlan = mod.includedInPlans.includes(planSlug);
            const includedHint =
              mod.includedInPlans.length > 0
                ? `Incluido en ${mod.includedInPlans.map((p) => SAAS_PLANS[p].membershipLabel).join(' / ')}`
                : 'Membresía dedicada';

            return (
              <div
                key={mod.slug}
                className="bg-white dark:bg-[#1A1625] rounded-2xl p-6 border border-slate-200 dark:border-white/10 flex flex-col h-full"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                    <span>{meta.category}</span>
                    {user && !loadingAccess && (
                      <>
                        <span aria-hidden="true"> · </span>
                        <span
                          className={
                            isEntitled
                              ? 'font-semibold text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-500 dark:text-slate-400'
                          }
                        >
                          {isEntitled ? 'Habilitado' : 'Disponible'}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white mb-2">
                  {mod.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-5 flex-1">
                  {mod.description}
                </p>

                <ul className="space-y-1.5 mb-5 pt-4 border-t border-slate-100 dark:border-white/10">
                  {mod.highlights.slice(0, 2).map((feat, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-4 border-t border-slate-100 dark:border-white/10 mt-auto space-y-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {includedHint}
                    </span>
                    <span className="text-sm font-mono tabular-nums font-bold text-slate-900 dark:text-white whitespace-nowrap shrink-0">
                      {includedInCurrentPlan && user ? 'Incluido' : mod.priceLabel}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isEntitled ? (
                      <button
                        type="button"
                        onClick={() => navigate(mod.routePath)}
                        className="flex-1 py-2.5 px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Abrir Módulo
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleHireModule(mod)}
                        className="flex-1 py-2.5 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        Contratar Módulo
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedModule(mod)}
                      className="py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition whitespace-nowrap shrink-0"
                    >
                      Detalles
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {selectedModule && !isCheckoutOpen && !isAuthOpen && (
          <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setSelectedModule(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              className="relative w-full max-w-2xl z-[9999] bg-white dark:bg-[#1A1625] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-start justify-between gap-4 p-6 border-b border-slate-200 dark:border-white/10">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                    {React.createElement(MODULE_META[selectedModule.slug].icon, {
                      className: 'w-6 h-6 text-orange-500',
                    })}
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      {MODULE_META[selectedModule.slug].category} · {selectedModule.shortName}
                    </p>
                    <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white">
                      {selectedModule.title}
                    </h2>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedModule(null)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
                  aria-label="Cerrar detalles"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {selectedModule.description}
                </p>

                <div className="rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10 p-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                    Alcance Funcional en Producción
                  </h3>
                  <ul className="space-y-2.5">
                    {selectedModule.highlights.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-200">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedModule.includedInPlans.length > 0 ? (
                    <span>
                      Incluido automáticamente en:{' '}
                      <strong className="text-slate-800 dark:text-slate-200">
                        {selectedModule.includedInPlans
                          .map((p) => SAAS_PLANS[p].displayName)
                          .join(', ')}
                      </strong>
                    </span>
                  ) : (
                    <span>
                      Este módulo se contrata como membresía independiente para operadores y flotas.
                    </span>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-500">Arancel Mensual</p>
                  <p className="text-2xl font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                    {selectedModule.priceLabel}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedModule(null)}
                    className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white whitespace-nowrap shrink-0"
                  >
                    Cerrar
                  </button>
                  {entitlements[selectedModule.slug] ? (
                    <button
                      type="button"
                      onClick={() => navigate(selectedModule.routePath)}
                      className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold whitespace-nowrap shrink-0 flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Ir al Módulo
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleHireModule(selectedModule)}
                      className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold whitespace-nowrap shrink-0 flex items-center gap-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      Contratar Módulo
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {selectedModule && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          moduleName={selectedModule.title}
          price={selectedModule.priceLabel}
          targetSlug={selectedModule.billingSlug}
          onConfirm={async (result) => {
            setIsCheckoutOpen(false);
            setSelectedModule(null);
            await loadOrganizationModules();
            showNotice('ok', result.message);
          }}
        />
      )}

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode="login"
      />
    </div>
  );
}
