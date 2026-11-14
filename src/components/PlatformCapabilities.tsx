import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, Users, Truck, ArrowRight, CheckCircle2, Mail, Route, ShieldCheck } from 'lucide-react';

interface CapabilityPillar {
  id: 'arn' | 'pyme' | 'fleet';
  index: string;
  title: string;
  tagline: string;
  description: string;
  highlights: string[];
  ctaLabel: string;
  ctaPath: string;
  secondaryLabel: string;
  secondaryPath: string;
  metricValue: string;
  metricCaption: string;
  icon: typeof Bot;
}

const PILLARS: CapabilityPillar[] = [
  {
    id: 'arn',
    index: '01.',
    title: 'Motor Comercial ARN IA + CRM Híbrido',
    tagline: 'Automatización comercial bidireccional y escucha de correos 24/7',
    description:
      'Cada correo comercial o consulta del directorio ingresa automáticamente al motor ARN IA, crea o actualiza el contacto en tu CRM, calcula scoring de oportunidad y redacta borradores con reglas híbridas de aprobación o auto-envío según monto.',
    highlights: [
      'Escucha continua IMAP 24/7 (mail.xpatagonia.online) sin pérdida de leads',
      'Cola híbrida: aprobación humana con un clic o ejecución automática por umbral USD',
      'Sincronización bidireccional con Contactos CRM, Odoo y flujos de n8n',
    ],
    ctaLabel: 'Abrir ARN IA & CRM',
    ctaPath: '/dashboard?area=arn_crm',
    secondaryLabel: 'Ver Correo Integrado',
    secondaryPath: '/inbox',
    metricValue: '24/7',
    metricCaption: 'Ingesta autónoma + Cola híbrida por reglas',
    icon: Bot,
  },
  {
    id: 'pyme',
    index: '02.',
    title: 'Suite PyME Multi-Usuario por Asientos',
    tagline: 'Equipos comerciales y operativos trabajando sobre una misma cartera',
    description:
      'Centraliza compradores, vendedores y supervisores bajo una sola organización en Patagonia. Gestiona invitaciones, roles internos y visibilidad unificada de RFQs, catálogo industrial y oportunidades comerciales.',
    highlights: [
      'Plan Gratis: hasta 2 usuarios para validar demandas y red B2B',
      'Plan Pro Industria: hasta 5 usuarios con ARN IA híbrido y prioridad de exposición',
      'Plan Corporativo: hasta 10 usuarios, licitaciones y auditoría comercial completa',
    ],
    ctaLabel: 'Gestionar Equipo y Asientos',
    ctaPath: '/dashboard?area=team',
    secondaryLabel: 'Comparar Planes PyME',
    secondaryPath: '/planes',
    metricValue: '2 / 5 / 10',
    metricCaption: 'Asientos verificados según suscripción PyME',
    icon: Users,
  },
  {
    id: 'fleet',
    index: '03.',
    title: 'Membresía Logística & Control de Flota',
    tagline: 'Infraestructura dedicada para transportistas y operadores viales',
    description:
      'Una membresía independiente enfocada en empresas de logística patagónica y transporte de cargas especiales. Controla unidades, vencimientos críticos, choferes con licencia LINTI y toma contratos directos con cálculo de rutas reales OSRM.',
    highlights: [
      'Alertas tempranas a 15 días antes del vencimiento de VTV, seguros y LINTI',
      'Bolsa de Cargas, retornos vacíos RN 3 / RN 22 / RN 40 y contratos trazables',
      'Calculadora vial OSRM real por corredores patagónicos y extra-regionales',
    ],
    ctaLabel: 'Abrir Centro de Flota',
    ctaPath: '/logistica?tab=flotas',
    secondaryLabel: 'Ver Membresía Logística',
    secondaryPath: '/planes',
    metricValue: '15 días',
    metricCaption: 'Antelación automática en alertas VTV / LINTI',
    icon: Truck,
  },
];

export default function PlatformCapabilities() {
  const [selectedId, setSelectedId] = useState<CapabilityPillar['id']>('arn');
  const active = PILLARS.find((p) => p.id === selectedId) || PILLARS[0];
  const ActiveIcon = active.icon;

  return (
    <section
      id="servicios-plataforma"
      className="py-16 md:py-20 px-4 sm:px-6 md:px-12 bg-white dark:bg-[#0D0A13] border-t border-slate-200 dark:border-white/5"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 mb-2">
              Infraestructura Operativa B2B en Producción
            </p>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 dark:text-white tracking-tight text-balance">
              Tres motores diseñados para operar la industria patagónica
            </h2>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md">
            Desde la automatización comercial con inteligencia artificial hasta el control de flotas y la operación multi-usuario de tu PyME.
          </p>
        </div>

        {/* Asymmetric Split: Left Pillar Selector List / Right Active Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-5 flex flex-col gap-3">
            {PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              const isSelected = pillar.id === active.id;
              return (
                <button
                  key={pillar.id}
                  type="button"
                  onClick={() => setSelectedId(pillar.id)}
                  className={`text-left p-5 rounded-2xl border transition-colors flex items-start gap-4 ${
                    isSelected
                      ? 'bg-slate-900 dark:bg-[#1A1625] text-white border-orange-500/60'
                      : 'bg-slate-50 dark:bg-[#14111C] text-slate-800 dark:text-slate-200 border-slate-200 dark:border-white/10 hover:border-purple-500/40'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected
                        ? 'bg-orange-500 text-white'
                        : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span
                        className={`text-xs font-mono tabular-nums font-bold ${
                          isSelected ? 'text-orange-400' : 'text-slate-400'
                        }`}
                      >
                        {pillar.index}
                      </span>
                      <span
                        className={`text-xs font-mono tabular-nums font-bold ${
                          isSelected ? 'text-emerald-400' : 'text-slate-500'
                        }`}
                      >
                        {pillar.metricValue}
                      </span>
                    </div>
                    <h3 className="text-base font-bold mt-1 leading-snug">{pillar.title}</h3>
                    <p
                      className={`text-xs mt-1 leading-relaxed ${
                        isSelected ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {pillar.tagline}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-7 bg-slate-50 dark:bg-[#1A1625] border border-slate-200 dark:border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-4 pb-5 mb-6 border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                    <ActiveIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-mono tabular-nums font-semibold text-purple-600 dark:text-purple-400">
                      {active.index} Módulo Integrado
                    </span>
                    <h3 className="text-xl sm:text-2xl font-display font-bold text-slate-900 dark:text-white">
                      {active.title}
                    </h3>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <div className="text-2xl font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                    {active.metricValue}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {active.metricCaption}
                  </div>
                </div>
              </div>

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                {active.description}
              </p>

              <ul className="space-y-3 mb-8">
                {active.highlights.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-200"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-5 border-t border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-purple-500" /> Correo IMAP + ARN
                </span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <Route className="w-3.5 h-3.5 text-orange-500" /> Corredores OSRM
                </span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Validación KYB
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to={active.secondaryPath}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-white/15 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-orange-500 transition-colors whitespace-nowrap"
                >
                  {active.secondaryLabel}
                </Link>
                <Link
                  to={active.ctaPath}
                  className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <span>{active.ctaLabel}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
