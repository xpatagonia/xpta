import { Link } from 'react-router-dom';
import { Search, FileText, Bot, Truck, ArrowRight } from 'lucide-react';
import ConfigurableSection, {
  getSectionCardClass,
  getSectionGridClass,
  getSectionHeadingSizeClass,
} from './ConfigurableSection';
import { HomeSectionDesignConfig } from '../lib/siteSettings';

const STEPS = [
  {
    id: '01.',
    title: 'Busca por Perfil y Corredor',
    description:
      'Filtra Empresas, Emprendimientos, Profesionales matriculados o Servicios técnicos según provincia y especialidad.',
    icon: Search,
    href: '/servicios',
  },
  {
    id: '02.',
    title: 'Califica con ARN IA + CRM',
    description:
      'Cada lead o correo comercial entra al CRM y a la cola híbrida de ARN IA con reglas automáticas por monto y confianza.',
    icon: Bot,
    href: '/dashboard?area=arn_crm',
  },
  {
    id: '03.',
    title: 'Cotiza con tu Equipo PyME',
    description:
      'Opera pedidos RFQ y presupuestos con hasta 2, 5 o 10 usuarios integrados en tu espacio organizacional.',
    icon: FileText,
    href: '/dashboard?area=team',
  },
  {
    id: '04.',
    title: 'Despacha con Flota & OSRM',
    description:
      'Calcula kilómetros reales, asigna transportistas con LINTI y controla contratos y retornos vacíos por Ruta 3, 22 y 40.',
    icon: Truck,
    href: '/logistica?tab=rutas',
  },
];

export default function HowItWorks({ config }: { config?: HomeSectionDesignConfig }) {
  const accentColor = config?.accentColor || '#f97316';
  const hasDarkMedia =
    config?.backgroundType === 'image' ||
    config?.backgroundType === 'video' ||
    config?.backgroundType === 'gradient';
  const gridClass = getSectionGridClass(
    config?.columnStyle,
    'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'
  );
  const cardSurfaceClass = getSectionCardClass(config?.cardStyle, hasDarkMedia);
  const headingSizeClass = getSectionHeadingSizeClass(config?.headingScale);
  const isBento = config?.columnStyle === 'bento';

  return (
    <ConfigurableSection
      id="como-funciona"
      config={config}
      defaultClassName="bg-white dark:bg-[#110E17] border-t border-slate-200 dark:border-white/5"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold mb-2" style={{ color: accentColor }}>
            {config?.eyebrowOverride || 'Ciclo Operativo Unificado'}
          </p>
          <h2 className={`${headingSizeClass} font-display font-bold tracking-tight text-balance`}>
            {config?.titleOverride || 'Cómo opera tu empresa dentro de xPatagonia'}
          </h2>
          {config?.subtitleOverride && (
            <p className="mt-2.5 text-sm sm:text-base opacity-80">{config.subtitleOverride}</p>
          )}
        </div>
        <Link
          to="/planes"
          className="inline-flex items-center gap-2 text-xs font-bold hover:opacity-80 transition-opacity whitespace-nowrap"
          style={{ color: accentColor }}
        >
          <span>Ver membresías PyME y Logística</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className={gridClass}>
        {STEPS.map((step, idx) => (
          <Link
            key={step.id}
            to={step.href}
            className={`group p-6 rounded-2xl flex flex-col justify-between transition-colors ${cardSurfaceClass} ${
              isBento ? (idx === 0 || idx === 3 ? 'md:col-span-4' : 'md:col-span-2') : ''
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-10 h-10 rounded-xl bg-slate-500/10 border border-slate-300/30 dark:border-white/10 flex items-center justify-center transition-colors">
                  <step.icon className="w-5 h-5" style={{ color: accentColor }} />
                </div>
                <span className="text-xs font-mono tabular-nums font-bold opacity-60">
                  {step.id}
                </span>
              </div>
              <h3 className="text-base font-bold mb-2">{step.title}</h3>
              <p className="text-xs sm:text-sm opacity-80 leading-relaxed">{step.description}</p>
            </div>
            <div
              className="pt-4 mt-5 border-t border-slate-200/60 dark:border-white/10 flex items-center gap-1.5 text-xs font-bold"
              style={{ color: accentColor }}
            >
              <span>Ir al módulo</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
        ))}
      </div>
    </ConfigurableSection>
  );
}
