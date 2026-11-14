import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Check, X, Shield, Zap, Crown, CreditCard, Database, Lock, Unlock, Truck, Users, FileCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SiteSettings, fetchSiteSettings, getCachedSiteSettings, SITE_SETTINGS_EVENT } from '../lib/siteSettings';

const tiers = [
  {
    name: 'Plan Gratis / Inicial',
    id: 'tier-basic',
    badge: 'Hasta 2 Usuarios PyME',
    priceMonthly: 'Gratis',
    currency: 'Base / $25.000 ARS',
    billingPeriod: '/mes opcional destacado',
    description: 'Para PyMEs que inician operación comercial en Patagonia con hasta 2 miembros de equipo.',
    features: [
      'Hasta 2 usuarios de equipo en el Panel y CRM',
      'Agenda de Contactos CRM + enlace básico con ARN IA',
      'Presencia en el directorio (Orden Nivel 3)',
      'Hasta 3 respuestas a Cotizaciones (RFQs) / mes',
      'Acceso a bandeja de correo corporativo básico',
    ],
    notIncluded: [
      'Desbloqueo total de base de datos en CRM (CUIT y decisores)',
      'Automatización híbrida ilimitada ARN IA + Odoo n8n',
      'Gestión de Flota y Contratos de Transporte (Membresía Logística)',
    ],
    cta: 'Comenzar Plan Gratis (2 Usuarios)',
    popular: false,
    icon: Shield,
    color: 'text-slate-500',
    bg: 'bg-white dark:bg-[#1A1625]',
  },
  {
    name: 'Plan Pro Industria',
    id: 'tier-pro',
    badge: 'Hasta 5 Usuarios • Más Elegido',
    priceMonthly: '$65.000',
    currency: 'ARS',
    billingPeriod: '/mes',
    description: 'Para empresas proveedoras e industriales con equipos de compras y ventas operando ARN IA + CRM.',
    features: [
      'Hasta 5 usuarios de equipo (Admin, Comercial, Operador)',
      'ARN IA Híbrido + Contactos CRM bidireccionales completos',
      'Posicionamiento Destacado (Orden Nivel 2 en Directorio)',
      'Desbloqueo de datos completos (CUIT, Decisores, Teléfonos)',
      'Respuestas a RFQs, Chat B2B y Plantillas ilimitadas',
      'Insignia de Empresa Verificada en Catálogo',
    ],
    notIncluded: [
      'Hasta 10 usuarios multi-área y prioridad Nivel 1',
      'Suite de Control de Flota (requiere Membresía Logística)',
    ],
    cta: 'Activar Plan Pro (5 Usuarios)',
    popular: true,
    icon: Zap,
    color: 'text-orange-500',
    bg: 'bg-white dark:bg-[#1A1625]',
  },
  {
    name: 'Plan Corporativo',
    id: 'tier-corp',
    badge: 'Hasta 10 Usuarios • Nivel 1',
    priceMonthly: '$140.000',
    currency: 'ARS',
    billingPeriod: '/mes',
    description: 'Para operadoras, contratistas regionales y proveedores multi-provincia con equipos de hasta 10 usuarios.',
    features: [
      'Hasta 10 usuarios de equipo con roles por área operativa',
      'Máxima prioridad en resultados (Orden Nivel 1 Corporativo)',
      'ARN IA Autónomo + CRM + Sincronización Odoo ERP (n8n)',
      'Acceso total a base de datos B2B y Matching ADN pgvector',
      'Módulos Warehousing WMS y E-commerce B2B incluidos',
      'Soporte técnico dedicado y publicación en Insights',
    ],
    notIncluded: [],
    cta: 'Activar Corporativo (10 Usuarios)',
    popular: false,
    icon: Crown,
    color: 'text-purple-500',
    bg: 'bg-white dark:bg-[#1A1625]',
  },
];

export default function Pricing() {
  const [settings, setSettings] = useState<SiteSettings>(() => getCachedSiteSettings());

  useEffect(() => {
    fetchSiteSettings().then(setSettings);
    const handler = (e: Event) => {
      const custom = e as CustomEvent<SiteSettings>;
      setSettings(custom.detail || getCachedSiteSettings());
    };
    window.addEventListener(SITE_SETTINGS_EVENT, handler);
    return () => window.removeEventListener(SITE_SETTINGS_EVENT, handler);
  }, []);

  const dynamicPrices: Record<string, string> = {
    'tier-basic': settings.platform.basicPrice || 'Gratis',
    'tier-pro': settings.platform.proPrice || '$65.000',
    'tier-corp': settings.platform.corpPrice || '$140.000',
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A080C] pt-24 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-wider border border-purple-500/20 mb-4">
            <Database className="w-3.5 h-3.5" /> SaaS B2B Multi-Usuario · ARN IA + CRM
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
            Planes PyME y Membresía Logística
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400">
            Escalá tu equipo comercial según la capacidad de tu empresa (<strong>2, 5 o 10 usuarios</strong>) con ARN IA y CRM unificados, o activá la membresía dedicada para empresas de transporte y logística.
          </p>
        </div>

        {/* Public vs Subscribed Comparison Banner */}
        <div className="max-w-5xl mx-auto mb-12 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-[#1A1625] border border-slate-200 dark:border-white/10 flex items-start gap-3.5">
            <Lock className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                Usuario Público (Sin Suscripción)
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Acceso libre a <strong>Patagonia Insights</strong> (noticias y reportes), indicadores económicos y vista general del directorio sin datos fiscales ni herramientas SaaS.
              </p>
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900 text-white border border-purple-500/30 flex items-start gap-3.5">
            <Unlock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-white mb-1">
                Empresa Miembro (2 / 5 / 10 Asientos)
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Espacio compartido multi-usuario con invitaciones por email, desbloqueo de CUIT y decisores, agenda <strong>Contactos CRM</strong> y automatización híbrida <strong>ARN IA</strong>.
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {tiers.map((tier, index) => {
            const Icon = tier.icon;
            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className={`relative flex flex-col p-7 rounded-2xl ${tier.bg} border ${
                  tier.popular
                    ? 'border-orange-500 shadow-xl'
                    : 'border-slate-200 dark:border-white/10 shadow-sm'
                }`}
              >
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                      <Icon className={`w-5 h-5 ${tier.color}`} />
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${
                        tier.popular
                          ? 'bg-orange-500 text-white'
                          : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {tier.badge}
                    </span>
                  </div>
                  <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white mb-1.5">
                    {tier.name}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed min-h-[36px]">
                    {tier.description}
                  </p>
                </div>

                <div className="mb-6 pb-6 border-b border-slate-100 dark:border-white/5">
                  <div className="flex items-baseline gap-1.5 font-mono tabular-nums">
                    <span className="text-3xl font-bold text-slate-900 dark:text-white">
                      {dynamicPrices[tier.id] || tier.priceMonthly}
                    </span>
                    <span className="text-xs font-bold text-slate-500 uppercase">
                      {tier.currency}
                    </span>
                    <span className="text-xs text-slate-500">
                      {tier.billingPeriod}
                    </span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {tier.features.map((feature, i) => (
                    <li
                      key={i}
                      className="flex gap-2.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed"
                    >
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                  {tier.notIncluded.map((feature, i) => (
                    <li
                      key={`not-${i}`}
                      className="flex gap-2.5 text-xs text-slate-400 dark:text-slate-600 leading-relaxed"
                    >
                      <X className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/dashboard?area=team"
                  className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${
                    tier.popular
                      ? 'bg-orange-500 text-white hover:bg-orange-600'
                      : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  {tier.cta}
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Dedicated Separate Membership for Logistics Companies */}
        <div className="max-w-6xl mx-auto mt-10 bg-white dark:bg-[#1A1625] border border-orange-500/40 rounded-2xl p-7 sm:p-8 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[11px] font-bold uppercase tracking-wider border border-orange-500/20">
                <Truck className="w-3.5 h-3.5" /> Membresía Aparte · Empresas de Logística y Transporte
              </div>
              <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
                Suite Logística: Gestión, Control de Flota y Contratación de Fletes
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Membresía independiente diseñada para transportistas, flotas de carretones, carga refrigerada y operadores patagónicos que operan licitaciones y contratación directa desde la plataforma.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-slate-700 dark:text-slate-300">
                <div className="flex items-start gap-2">
                  <Truck className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <span><strong>Control de Flota:</strong> Unidades, patentes, vencimientos de VTV, seguros y estados en ruta.</span>
                </div>
                <div className="flex items-start gap-2">
                  <Users className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <span><strong>Choferes LINTI:</strong> Legajo de conductores habilitados y asignación por unidad.</span>
                </div>
                <div className="flex items-start gap-2">
                  <FileCheck className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <span><strong>Contratación Activa:</strong> Oferta y adjudicación directa sobre cargas y retornos vacíos.</span>
                </div>
              </div>
            </div>

            <div className="shrink-0 bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10 rounded-xl p-5 flex flex-col justify-between min-w-[260px]">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Arancel Mensual Operador</p>
                <p className="text-3xl font-mono font-bold tabular-nums text-slate-900 dark:text-white mt-1">
                  $95.000 <span className="text-xs font-sans font-bold text-slate-500">ARS/mes</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-1">Incluye hasta 10 usuarios operativos de tráfico y despacho.</p>
              </div>
              <Link
                to="/dashboard?area=fleet"
                className="mt-5 w-full py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Truck className="w-4 h-4" /> Activar Membresía Logística
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
