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

export default function Categories() {
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
      ? // Show a balanced cross-section (1 of each profile prioritized by subscription plan)
        [
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

  return (
    <section
      id="directorio"
      className="py-16 md:py-20 px-4 sm:px-6 md:px-12 bg-slate-50 dark:bg-[#110E17]/70 border-t border-slate-200 dark:border-white/5"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 gap-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-2">
              Directorio Unificado e Integrado a ARN IA + CRM
            </p>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 dark:text-white tracking-tight text-balance">
              Empresas, Emprendimientos, Profesionales y Servicios Industriales
            </h2>
            <p className="mt-2.5 text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
              Ordenados según nivel de suscripción (<strong className="text-slate-900 dark:text-white">Corporativo → Pro Industria → Inicial</strong>). Los miembros suscriptos desbloquean CUIT, matrícula y contacto directo y envían cada ficha al motor ARN IA en un clic.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/planes"
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/15 text-slate-800 dark:text-white text-xs font-bold hover:border-orange-500 transition-colors whitespace-nowrap"
            >
              Ver Planes PyME y Flota
            </Link>
            <Link
              to={activeEntityTab === 'all' ? '/servicios' : `/servicios?type=${activeEntityTab}`}
              className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors flex items-center gap-2 whitespace-nowrap"
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
                activeEntityTab === tab.id
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  : 'bg-white dark:bg-[#1A1625] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:border-purple-500/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Ordered Preview Cards (Single-Elevation, Zero-Pill Metadata) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {visiblePreview.map((company) => {
            const typeKey = company.entityType || 'empresa';
            const TypeIcon = ENTITY_ICONS[typeKey] || Building2;
            const typeMeta = ENTITY_TYPE_CONFIG[typeKey];

            return (
              <div
                key={company.id}
                className="bg-white dark:bg-[#1A1625] rounded-2xl p-5 border border-slate-200 dark:border-white/10 flex flex-col justify-between hover:border-orange-500/40 transition-colors"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
                      <TypeIcon className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                      {typeMeta.label}
                      <span aria-hidden="true">·</span>
                      <span>{company.tierLabel}</span>
                      {company.verified && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <ShieldCheck className="w-3.5 h-3.5" /> Verificado
                          </span>
                        </>
                      )}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-orange-500" />
                      {company.province}
                    </span>
                  </div>

                  <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white mb-1 leading-snug">
                    {company.name}
                  </h3>
                  <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-2">
                    {company.category}
                    {company.serviceModality ? ` · ${company.serviceModality}` : ''}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                    {company.publicSummary}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-2 text-xs">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-mono truncate">
                    <Lock className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                    CUIT / Matrícula & Contacto CRM: Solo Miembros
                  </span>
                  <Link
                    to={`/servicios?type=${typeKey}`}
                    className="font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 shrink-0 whitespace-nowrap"
                  >
                    Ver ficha <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Rubros Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Rubros Industriales & Profesionales ({MAIN_CATEGORIES.length})
            </h3>
            <Link
              to="/servicios"
              className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline whitespace-nowrap"
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
                  className="group p-3.5 bg-white dark:bg-[#1A1625] border border-slate-200 dark:border-white/10 rounded-xl hover:border-orange-500/40 transition-colors flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-lg bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-orange-500 transition-colors shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate group-hover:text-orange-500 transition-colors">
                      {cat}
                    </h4>
                    <p className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      {activeCount > 0 ? `${activeCount} activos` : 'Disponible'}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
