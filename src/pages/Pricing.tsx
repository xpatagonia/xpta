import { motion } from 'motion/react';
import { Check, X, Shield, Zap, Crown, CreditCard, Database, Lock, Unlock } from 'lucide-react';
import { Link } from 'react-router-dom';

const tiers = [
  {
    name: 'Plan Inicial',
    id: 'tier-basic',
    badge: 'Prioridad Nivel 3',
    priceMonthly: '$25.000',
    currency: 'ARS',
    billingPeriod: '/mes',
    description: 'Para PyMEs y proveedores que inician su posicionamiento en el directorio patagónico.',
    features: [
      'Presencia en el directorio (Orden Nivel 3)',
      'Ficha comercial básica de empresa',
      'Hasta 3 respuestas a Cotizaciones (RFQs) / mes',
      'Acceso a bandeja de correo corporativo básico',
    ],
    notIncluded: [
      'Desbloqueo total de base de datos en CRM (CUIT y decisores)',
      'Sincronización en 1 clic de empresas al CRM',
      'Posicionamiento prioritario en Directorio y Marketplace',
      'Insignia de Empresa Verificada y Auditada',
    ],
    cta: 'Suscribirse al Plan Inicial',
    popular: false,
    icon: Shield,
    color: 'text-slate-500',
    bg: 'bg-white dark:bg-[#1A1625]',
  },
  {
    name: 'Plan Pro Industrial',
    id: 'tier-pro',
    badge: 'Prioridad Nivel 2 • Más Elegido',
    priceMonthly: '$65.000',
    currency: 'ARS',
    billingPeriod: '/mes',
    description: 'Para empresas proveedoras e industriales que buscan conectar, cotizar e integrar clientes al CRM.',
    features: [
      'Posicionamiento Destacado (Orden Nivel 2 en Directorio)',
      'Desbloqueo de datos completos (CUIT, Decisores, Teléfonos)',
      'Sincronización directa de empresas al CRM',
      'Respuestas a RFQs y Chat B2B ilimitados',
      'Insignia de Empresa Verificada en Catálogo',
      'Sistema de Correo Corporativo y Plantillas CRM',
    ],
    notIncluded: [
      'Máxima prioridad Nivel 1 en cabeceras de rubro',
      'Integración API con ERP externo y multi-usuario ilimitado',
    ],
    cta: 'Activar Plan Pro Industrial',
    popular: true,
    icon: Zap,
    color: 'text-orange-500',
    bg: 'bg-white dark:bg-[#1A1625]',
  },
  {
    name: 'Plan Corporativo',
    id: 'tier-corp',
    badge: 'Prioridad Nivel 1 • Máxima Visibilidad',
    priceMonthly: '$140.000',
    currency: 'ARS',
    billingPeriod: '/mes',
    description: 'Para operadoras, contratistas regionales y grandes proveedores con operación multi-provincia.',
    features: [
      'Máxima prioridad en resultados (Orden Nivel 1 Corporativo)',
      'Acceso total a base de datos B2B precargada en el CRM',
      'Módulos Logística, Warehousing y E-commerce B2B incluidos',
      'Usuarios de equipo ilimitados en el Panel y CRM',
      'Publicación destacada de novedades en Patagonia Insights',
      'Ejecutivo de cuenta y soporte técnico dedicado',
    ],
    notIncluded: [],
    cta: 'Activar Plan Corporativo',
    popular: false,
    icon: Crown,
    color: 'text-purple-500',
    bg: 'bg-white dark:bg-[#1A1625]',
  },
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A080C] pt-24 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-wider border border-purple-500/20 mb-4">
            <Database className="w-3.5 h-3.5" /> Membresías B2B + CRM Integrado
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
            Planes de Suscripción y Posicionamiento
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400">
            Mientras la sección <strong>Insights</strong> es abierta al público, el acceso a datos fiscales (CUIT), contactos de compras, emisión de cotizaciones e integración con el <strong>CRM</strong> es exclusivo para empresas suscriptas.
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
                Acceso libre a <strong>Patagonia Insights</strong> (noticias, reportes y videos de YouTube), indicadores económicos y vista general limitada del directorio sin datos de contacto ni CRM.
              </p>
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900 text-white border border-purple-500/30 flex items-start gap-3.5">
            <Unlock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-white mb-1">
                Miembro Registrado con Suscripción Activa
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Posicionamiento jerárquico de tu empresa en el directorio, desbloqueo de CUIT y decisores comerciales, Chat B2B, correo corporativo y sincronización en 1 clic con el <strong>CRM</strong>.
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
                  <div className="flex items-baseline gap-1.5 font-mono">
                    <span className="text-3xl font-bold text-slate-900 dark:text-white">
                      {tier.priceMonthly}
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
                  to="/dashboard"
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
      </div>
    </div>
  );
}
