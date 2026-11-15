import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Lock, ArrowRight, Check, Shield, CreditCard } from 'lucide-react';
import { auth } from '../lib/db';
import { getApiUrl } from '../lib/apiConfig';
import {
  SAAS_MODULES,
  SAAS_PLANS,
  SaasModuleSlug,
  PymePlanSlug,
} from '../services/saasPlans';
import AuthModal from './AuthModal';
import CheckoutModal from './CheckoutModal';

export interface ModuleEntitlementState {
  loading: boolean;
  isAuthenticated: boolean;
  allowed: boolean;
  planSlug: PymePlanSlug;
  orgName: string;
  activeModules: SaasModuleSlug[];
  entitlements: Record<string, boolean>;
  refresh: () => Promise<void>;
}

export function useModuleEntitlement(moduleSlug: SaasModuleSlug): ModuleEntitlementState {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(auth.currentUser));
  const [allowed, setAllowed] = useState(false);
  const [planSlug, setPlanSlug] = useState<PymePlanSlug>('gratis');
  const [orgName, setOrgName] = useState('');
  const [activeModules, setActiveModules] = useState<SaasModuleSlug[]>([]);
  const [entitlements, setEntitlements] = useState<Record<string, boolean>>({});

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const token = await auth.getToken();
      if (!token) {
        setIsAuthenticated(false);
        setAllowed(false);
        setActiveModules([]);
        setEntitlements({});
        return;
      }

      setIsAuthenticated(true);
      const res = await fetch(`${getApiUrl()}/api/org/team`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });

      if (res.status === 401) {
        setIsAuthenticated(false);
        setAllowed(false);
        return;
      }

      const data = await res.json().catch(() => ({}));
      const org = data?.organization || {};
      const resolvedModules: SaasModuleSlug[] = Array.isArray(org.activeModules)
        ? org.activeModules
        : [];
      const resolvedEntitlements: Record<string, boolean> =
        org.entitlements && typeof org.entitlements === 'object' ? org.entitlements : {};

      setPlanSlug((org.planSlug as PymePlanSlug) || 'gratis');
      setOrgName(org.orgName || '');
      setActiveModules(resolvedModules);
      setEntitlements(resolvedEntitlements);
      setAllowed(
        Boolean(
          resolvedEntitlements[moduleSlug] ||
            resolvedModules.includes(moduleSlug) ||
            (moduleSlug === 'logistica_flota' && org.hasLogisticsAccess)
        )
      );
    } catch {
      setAllowed(false);
    } finally {
      setLoading(false);
    }
  }, [moduleSlug]);

  useEffect(() => {
    refresh();
    const unsub = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(Boolean(user));
      refresh();
    });
    return () => unsub();
  }, [refresh]);

  return {
    loading,
    isAuthenticated,
    allowed,
    planSlug,
    orgName,
    activeModules,
    entitlements,
    refresh,
  };
}

interface ModuleAccessGateProps {
  moduleSlug: SaasModuleSlug;
  children: React.ReactNode;
}

export default function ModuleAccessGate({ moduleSlug, children }: ModuleAccessGateProps) {
  const {
    loading,
    isAuthenticated,
    allowed,
    planSlug,
    orgName,
    refresh,
  } = useModuleEntitlement(moduleSlug);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutNotice, setCheckoutNotice] = useState<string | null>(null);

  const moduleConfig = SAAS_MODULES[moduleSlug];
  const currentPlan = SAAS_PLANS[planSlug] || SAAS_PLANS.gratis;
  const includedPlansText =
    moduleConfig.includedInPlans.length > 0
      ? moduleConfig.includedInPlans.map((p) => SAAS_PLANS[p].displayName).join(' / ')
      : 'Membresía Operador Independiente';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0A080C] pt-28 pb-16 px-4">
        <div className="max-w-3xl mx-auto rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#14111A] p-8 space-y-4">
          <div className="h-4 w-48 bg-slate-200 dark:bg-white/10 rounded animate-pulse" />
          <div className="h-8 w-3/4 bg-slate-200 dark:bg-white/10 rounded animate-pulse" />
          <div className="h-4 w-full bg-slate-100 dark:bg-white/5 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (allowed) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A080C] pt-28 pb-20 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#14111A] p-6 sm:p-10">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-3">
          <Lock className="w-3.5 h-3.5 text-orange-500 shrink-0" />
          <span>Zona de Miembros</span>
          <span aria-hidden="true">·</span>
          <span>{moduleConfig.shortName}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">{moduleConfig.priceLabel}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 dark:text-white tracking-tight text-balance mb-3">
          {moduleConfig.title}
        </h1>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
          {!isAuthenticated
            ? `Esta herramienta forma parte de la zona operativa privada de xPatagonia. Iniciá sesión con tu cuenta empresarial o registrá tu empresa para habilitar ${moduleConfig.shortName}.`
            : `${moduleConfig.description}`}
        </p>

        <div className="border-t border-b border-slate-200 dark:border-white/10 py-5 mb-6 space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Capacidades incluidas al activar
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {includedPlansText}
            </span>
          </div>
          <ul className="space-y-2">
            {moduleConfig.highlights.map((item, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-200"
              >
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {isAuthenticated && (
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300">
            <div>
              <span>Organización: </span>
              <strong className="text-slate-900 dark:text-white">
                {orgName || 'Empresa Registrada'}
              </strong>
              <span aria-hidden="true"> · </span>
              <span>Plan actual: </span>
              <strong className="text-slate-900 dark:text-white">
                {currentPlan.displayName}
              </strong>
            </div>
            <div className="font-mono tabular-nums font-bold text-base text-slate-900 dark:text-white">
              {moduleConfig.priceLabel}
            </div>
          </div>
        )}

        {checkoutNotice && (
          <div className="mb-6 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs font-medium text-emerald-700 dark:text-emerald-300">
            {checkoutNotice}
          </div>
        )}

        {!isAuthenticated ? (
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setAuthModalOpen(true);
              }}
              className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 flex items-center gap-2"
            >
              <Shield className="w-4 h-4" />
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setAuthModalOpen(true);
              }}
              className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-white/15 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-white/5 text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              Registrar Empresa
            </button>
            <Link
              to="/planes"
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5"
            >
              Ver Planes y Módulos
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setCheckoutOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Activar Módulo ({moduleConfig.priceLabel})
            </button>
            <Link
              to="/planes"
              className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-white/15 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-white/5 text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              Comparar Planes SaaS
            </Link>
            <Link
              to="/dashboard?area=team"
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Ir a Mi Organización
            </Link>
          </div>
        )}
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />

      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        moduleName={moduleConfig.title}
        price={moduleConfig.priceLabel}
        targetSlug={moduleConfig.billingSlug}
        onConfirm={async (result) => {
          setCheckoutOpen(false);
          setCheckoutNotice(result.message);
          await refresh();
        }}
      />
    </div>
  );
}
