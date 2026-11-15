import { useState, useEffect } from 'react';
import {
  Building2,
  Sprout,
  Hammer,
  Wrench,
  Truck,
  Flame,
  Anchor,
  Utensils,
  Pickaxe,
  Zap,
  Cpu,
  Package,
  Shield,
  Settings,
  Droplets,
  Lock,
  ShieldCheck,
  MapPin,
  ArrowRight,
  Briefcase,
  Rocket,
  GraduationCap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { MAIN_CATEGORIES } from '../lib/categories';
import {
  B2B_COMPANIES,
  B2BCompanyRecord,
  DirectoryEntityType,
  ENTITY_TYPE_CONFIG,
  sortCompaniesBySubscriptionTier,
} from '../lib/b2bDirectoryData';
import { getApiUrl } from '../lib/apiConfig';
import ConfigurableSection, {
  getSectionCardClass,
  getSectionGridClass,
  getSectionHeadingSizeClass,
  resolveSectionSurfaceTone,
} from './ConfigurableSection';
import { HomeSectionDesignConfig } from '../lib/siteSettings';

const CATEGORY_ICONS: Record<string, any> = {
  Construcción: Building2,
  Agroindustria: Sprout,
  Metalúrgica: Hammer,
  Servicios: Wrench,
  Logística: Truck,
  'Hidrocarburos (Oil & Gas)': Flame,
  'Industria Pesquera': Anchor,
  'Alimentación y Bebidas': Utensils,
  Minería: Pickaxe,
  'Energías Renovables': Zap,
  'Tecnología e Innovación': Cpu,
  'Equipamiento Industrial': Package,
  'Seguridad e Higiene (EPP)': Shield,
  'Repuestos y Metalmecánica': Settings,
  'Insumos y Consumibles': Droplets,
  'Servicios Profesionales': GraduationCap,
  'Medio Ambiente y Sustentabilidad': Sprout,
};

const ENTITY_ICONS: Record<DirectoryEntityType, any> = {
  empresa: Building2,
  emprendimiento: Rocket,
  profesional: GraduationCap,
  servicio: Briefcase,
};

export default function Categories({ config }: { config?: HomeSectionDesignConfig }) {
  const [activeEntityTab, setActiveEntityTab] = useState<'all' | DirectoryEntityType>('all');
  const [directoryRecords, setDirectoryRecords] = useState<B2BCompanyRecord[]>(() =>
    sortCompaniesBySubscriptionTier(B2B_COMPANIES)
  );

  useEffect(() => {
    let mounted = true;
    fetch(`${getApiUrl()}/api/directory`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (mounted && Array.isArray(data?.companies) && data.companies.length > 0) {
          setDirectoryRecords(sortCompaniesBySubscriptionTier(data.companies));
        }
      })
      .catch(() => {
        // fallback already loaded
      });
    return () => {
      mounted = false;
    };
  }, []);

  const counts = {
    all: directoryRecords.length,
    empresa: directoryRecords.filter((r) => (r.entityType || 'empresa') === 'empresa').length,
    emprendimiento: directoryRecords.filter((r) => r.entityType === 'emprendimiento').length,
    profesional: directoryRecords.filter((r) => r.entityType === 'profesional').length,
    servicio: directoryRecords.filter((r) => r.entityType === 'servicio').length,
  };

  const visiblePreview =
    activeEntityTab === 'all'
      ? [
          directoryRecords.find((r) => (r.entityType || 'empresa') === 'empresa'),
          directoryRecords.find((r) => r.entityType === 'servicio'),
          directoryRecords.find((r) => r.entityType === 'profesional'),
          directoryRecords.find((r) => r.entityType === 'emprendimiento'),
        ]
          .filter((x): x is B2BCompanyRecord => Boolean(x))
          .slice(0, 4)
      : directoryRecords
          .filter((r) => (r.entityType || 'empresa') === activeEntityTab)
          .slice(0, 4);

  const sectorCountMap = MAIN_CATEGORIES.reduce<Record<string, number>>((acc, cat) => {
    const dynamicCount = directoryRecords.filter((c) => c.category === cat).length;
    acc[cat] = dynamicCount;
    return acc;
  }, {});

  const accentColor = config?.accentColor || '#f97316';
  const surfaceTone = resolveSectionSurfaceTone(config);
  const blockOverrides = config?.blockOverrides || {};
  const cardsGridClass = getSectionGridClass(
    config?.columnStyle,
    'grid grid-cols-1 md:grid-cols-2 gap-4'
  );
  const cardSurfaceClass = getSectionCardClass(config?.cardStyle, surfaceTone);
  const headingSizeClass = getSectionHeadingSizeClass(config?.headingScale);
  const isBento = config?.columnStyle === 'bento';

  const inactiveTabClass =
    surfaceTone === 'light'
      ? 'bg-white text-slate-700 border border-slate-300 hover:border-purple-500/40'
      : surfaceTone === 'dark'
      ? 'bg-[#1A1625] text-slate-200 border border-white/15 hover:border-purple-500/40'
      : 'bg-white dark:bg-[#1A1625] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:border-purple-500/40';

  return (
    <ConfigurableSection
      id="directorio"
      config={config}
      defaultClassName="bg-slate-50 dark:bg-[#110E17]/70 border-t border-slate-200 dark:border-white/5"
    >
      <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 gap-6">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold mb-2" style={{ color: accentColor }}>
            {config?.eyebrowOverride || 'Directorio Unificado e Integrado a ARN IA + CRM'}
          </p>
          <h2 className={`${headingSizeClass} font-display font-bold tracking-tight text-balance`}>
            {config?.titleOverride ||
              'Empresas, Emprendimientos, Profesionales y Servicios Industriales'}
          </h2>
          <p className="mt-2.5 opacity-80 text-sm sm:text-base leading-relaxed">
            {config?.subtitleOverride ||
              'Ordenados según nivel de suscripción (Corporativo → Pro Industria → Inicial). Los miembros suscriptos desbloquean CUIT, matrícula y contacto directo y envían cada ficha al motor ARN IA en un clic.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            to="/planes"
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/15 text-xs font-bold hover:border-orange-500 transition-colors whitespace-nowrap"
          >
            Ver Planes PyME y Flota
          </Link>
          <Link
            to={activeEntityTab === 'all' ? '/servicios' : `/servicios?type=${activeEntityTab}`}
            className="px-5 py-2.5 rounded-xl text-white text-xs font-bold transition-opacity hover:opacity-90 flex items-center gap-2 whitespace-nowrap"
            style={{ backgroundColor: accentColor }}
          >
            <span>Abrir Directorio Completo</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Interactive Profile Segmented Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-6">
        {(
          [
            { id: 'all', label: `Vista Mixta (${counts.all})` },
            { id: 'empresa', label: `Empresas (${counts.empresa})` },
            { id: 'emprendimiento', label: `Emprendimientos (${counts.emprendimiento})` },
            { id: 'profesional', label: `Profesionales (${counts.profesional})` },
            { id: 'servicio', label: `Servicios Industriales (${counts.servicio})` },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveEntityTab(tab.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
              activeEntityTab === tab.id ? 'text-white' : inactiveTabClass
            }`}
            style={activeEntityTab === tab.id ? { backgroundColor: accentColor } : undefined}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Ordered Preview Cards */}
      <div className={`${cardsGridClass} mb-12`}>
        {visiblePreview.map((company, idx) => {
          const ov = blockOverrides[`preview-${idx}`];
          if (ov?.hidden) return null;
          const typeKey = company.entityType || 'empresa';
          const TypeIcon = ENTITY_ICONS[typeKey] || Building2;
          const typeMeta = ENTITY_TYPE_CONFIG[typeKey];

          const displayTitle = ov?.title || company.name;
          const displayTag = ov?.tagline || `${typeMeta.label} · ${company.tierLabel}`;
          const displayDesc = ov?.description || company.publicSummary;
          const displayCta = ov?.ctaLabel || 'Ver ficha';
          const displayPath = ov?.ctaPath || `/servicios?type=${typeKey}`;

          return (
            <div
              key={company.id}
              className={`rounded-2xl p-5 flex flex-col justify-between transition-colors overflow-hidden ${cardSurfaceClass} ${
                isBento && idx === 0 ? 'md:col-span-4' : isBento ? 'md:col-span-2' : ''
              }`}
            >
              <div>
                {ov?.imageUrl && (
                  <div className="-mx-5 -mt-5 mb-4 h-40 overflow-hidden bg-slate-900">
                    <img
                      src={ov.imageUrl}
                      alt={displayTitle}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs opacity-75 mb-2">
                  <span className="inline-flex items-center gap-1.5 font-semibold">
                    <TypeIcon className="w-3.5 h-3.5 shrink-0" style={{ color: accentColor }} />
                    <span>{displayTag}</span>
                    {company.verified && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1 text-emerald-500">
                          <ShieldCheck className="w-3.5 h-3.5" /> Verificado
                        </span>
                      </>
                    )}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3" style={{ color: accentColor }} />
                    {company.province}
                  </span>
                </div>

                <h3 className="text-lg font-display font-bold mb-1 leading-snug">
                  {displayTitle}
                </h3>
                <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-2">
                  {company.category}
                  {company.serviceModality ? ` · ${company.serviceModality}` : ''}
                </p>
                <p className="text-xs sm:text-sm opacity-80 line-clamp-2 mb-4 leading-relaxed">
                  {displayDesc}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between gap-2 text-xs">
                <span className="opacity-70 flex items-center gap-1.5 font-mono truncate">
                  <Lock className="w-3.5 h-3.5 shrink-0" style={{ color: accentColor }} />
                  CUIT / Matrícula &amp; Contacto CRM: Solo Miembros
                </span>
                <Link
                  to={displayPath}
                  className="font-bold hover:underline flex items-center gap-1 shrink-0 whitespace-nowrap"
                  style={{ color: accentColor }}
                >
                  {displayCta} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rubros Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider opacity-70">
            Rubros Industriales &amp; Profesionales ({MAIN_CATEGORIES.length})
          </h3>
          <Link
            to="/servicios"
            className="text-xs font-bold hover:underline whitespace-nowrap"
            style={{ color: accentColor }}
          >
            Explorar todo el directorio &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {MAIN_CATEGORIES.slice(0, 10).map((cat) => {
            const Icon = CATEGORY_ICONS[cat] || Package;
            const activeCount = sectorCountMap[cat] || 0;
            return (
              <Link
                key={cat}
                to={`/servicios?category=${encodeURIComponent(cat)}`}
                className={`group p-3.5 rounded-xl transition-colors flex items-center gap-3 ${cardSurfaceClass}`}
              >
                <div className="w-9 h-9 rounded-lg bg-slate-500/10 flex items-center justify-center opacity-75 group-hover:opacity-100 transition-opacity shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-xs truncate">{cat}</h4>
                  <p className="text-[11px] font-mono tabular-nums opacity-70">
                    {activeCount > 0 ? `${activeCount} activos` : 'Disponible'}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </ConfigurableSection>
  );
}
