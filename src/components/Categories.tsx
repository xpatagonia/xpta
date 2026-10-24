import { motion } from 'motion/react';
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
  Crown,
  MapPin,
  Database,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { MAIN_CATEGORIES } from '../lib/categories';
import {
  B2B_COMPANIES,
  TIER_CONFIG,
  sortCompaniesBySubscriptionTier,
} from '../lib/b2bDirectoryData';

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
};

const SECTOR_COUNTS: Record<string, number> = {
  'Hidrocarburos (Oil & Gas)': 342,
  Logística: 289,
  Construcción: 412,
  Metalúrgica: 231,
  'Energías Renovables': 124,
  'Industria Pesquera': 156,
  'Seguridad e Higiene (EPP)': 215,
  Agroindustria: 180,
  'Tecnología e Innovación': 87,
  'Equipamiento Industrial': 194,
  Servicios: 260,
  'Alimentación y Bebidas': 85,
  Minería: 112,
  'Repuestos y Metalmecánica': 178,
  'Insumos y Consumibles': 145,
};

export default function Categories() {
  const featuredOrderedCompanies = sortCompaniesBySubscriptionTier(B2B_COMPANIES).slice(0, 4);

  return (
    <section
      id="categorias"
      className="py-16 md:py-20 px-4 sm:px-6 md:px-12 bg-slate-50 dark:bg-[#110E17]/60 border-t border-slate-200 dark:border-white/5"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header explaining the B2B Member-Gated Model + CRM Sync */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-10 gap-6">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-bold uppercase tracking-wider border border-purple-500/20">
                <Database className="w-3 h-3" />
                Integración Directa al CRM
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[10px] font-bold uppercase tracking-wider border border-orange-500/20">
                <Lock className="w-3 h-3" />
                Vista Pública Limitada
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 dark:text-white tracking-tight">
              Directorio Corporativo & Conexión B2B
            </h2>
            <p className="mt-2.5 text-slate-600 dark:text-slate-400 text-base">
              Las empresas se posicionan según su plan de suscripción (<strong className="text-slate-900 dark:text-white">Corporativo &rarr; Pro Industrial &rarr; Inicial</strong>). Los miembros suscriptos desbloquean datos fiscales, decisores y sincronizan proveedores en su CRM.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/planes"
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/15 text-slate-800 dark:text-white text-xs font-bold uppercase tracking-wider hover:border-orange-500 transition-colors"
            >
              Planes de Suscripción
            </Link>
            <Link
              to="/servicios"
              className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2"
            >
              <span>Abrir Directorio B2B</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Ordered Company Preview Cards (Public Preview with Locked CRM Data) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {featuredOrderedCompanies.map((company, idx) => {
            const tierMeta = TIER_CONFIG[company.tier];
            return (
              <motion.div
                key={company.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.06 }}
                className={`bg-white dark:bg-[#1A1625] rounded-2xl p-5 border ${tierMeta.borderAccent} flex flex-col justify-between shadow-sm hover:shadow-md transition-all`}
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${tierMeta.badgeBg} ${tierMeta.badgeText}`}
                      >
                        {company.tier === 'corporativo' ? (
                          <Crown className="w-3 h-3" />
                        ) : (
                          <Zap className="w-3 h-3" />
                        )}
                        {company.tierLabel}
                      </span>
                      {company.verified && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          <ShieldCheck className="w-3.5 h-3.5" /> Verificada
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-orange-500" />
                      {company.province}
                    </span>
                  </div>

                  <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white mb-1">
                    {company.name}
                  </h3>
                  <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 mb-2">
                    {company.category}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-4">
                    {company.publicSummary}
                  </p>
                </div>

                {/* Locked CRM Bar for Public Front */}
                <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-slate-500 flex items-center gap-1.5 font-mono">
                    <Lock className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                    CUIT & Contacto CRM: Solo Miembros
                  </span>
                  <Link
                    to="/servicios"
                    className="font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 shrink-0"
                  >
                    Conectar <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Compact Industrial Sectors Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Rubros Industriales Sincronizados con CRM ({MAIN_CATEGORIES.length})
            </h3>
            <Link
              to="/servicios"
              className="text-xs font-bold text-orange-500 hover:underline"
            >
              Ver todas las empresas &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {MAIN_CATEGORIES.slice(0, 10).map((cat) => {
              const Icon = CATEGORY_ICONS[cat] || Package;
              const count = SECTOR_COUNTS[cat] || 120;
              return (
                <Link
                  key={cat}
                  to="/servicios"
                  className="group p-3.5 bg-white dark:bg-[#1A1625] border border-slate-200 dark:border-white/10 rounded-xl hover:border-orange-500/40 transition-all flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-lg bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-orange-500 group-hover:bg-orange-500/10 transition-colors shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate group-hover:text-orange-500 transition-colors">
                      {cat}
                    </h4>
                    <p className="text-[10px] font-mono text-slate-500">
                      {count} empresas
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
