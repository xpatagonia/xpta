import { useState, useEffect } from 'react';
import {
  Search,
  Building2,
  MapPin,
  ShieldCheck,
  Lock,
  Unlock,
  Users,
  CheckCircle2,
  MessageSquare,
  Phone,
  Mail,
  ArrowUpRight,
  Crown,
  Zap,
  Route,
  Sparkles,
  Rocket,
  GraduationCap,
  Briefcase,
  RotateCcw,
  FileDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { auth } from '../lib/db';
import { getApiUrl } from '../lib/apiConfig';
import { generateVendorPackPdf } from '../lib/pdfDocuments';
import {
  B2B_COMPANIES,
  B2BCompanyRecord,
  DirectoryEntityType,
  ENTITY_TYPE_CONFIG,
  TIER_CONFIG,
  sortCompaniesBySubscriptionTier,
  syncCompanyToUserCRM,
  SubscriptionTier,
} from '../lib/b2bDirectoryData';

const PROVINCES = [
  'Todas',
  'Neuquén',
  'Chubut',
  'Río Negro',
  'Santa Cruz',
  'Tierra del Fuego',
  'Santa Fe (Envío Patagonia)',
  'Córdoba (Envío Patagonia)',
];

const ENTITY_ICONS: Record<DirectoryEntityType, typeof Building2> = {
  empresa: Building2,
  emprendimiento: Rocket,
  profesional: GraduationCap,
  servicio: Briefcase,
};

export default function Services() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTypeParam = searchParams.get('type') || 'all';
  const validInitialType = ['all', 'empresa', 'emprendimiento', 'profesional', 'servicio'].includes(
    initialTypeParam
  )
    ? (initialTypeParam as 'all' | DirectoryEntityType)
    : 'all';

  const [selectedEntityType, setSelectedEntityType] = useState<'all' | DirectoryEntityType>(
    validInitialType
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get('category') || 'Todas'
  );
  const [selectedProvince, setSelectedProvince] = useState('Todas');
  const [selectedTier, setSelectedTier] = useState<'all' | SubscriptionTier>('all');
  const [companies, setCompanies] = useState<B2BCompanyRecord[]>(() =>
    sortCompaniesBySubscriptionTier(B2B_COMPANIES)
  );
  const [isSubscribedMember, setIsSubscribedMember] = useState(false);
  const [syncedIds, setSyncedIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedCompanyModal, setSelectedCompanyModal] = useState<B2BCompanyRecord | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const paramType = searchParams.get('type');
    if (
      paramType &&
      ['all', 'empresa', 'emprendimiento', 'profesional', 'servicio'].includes(paramType)
    ) {
      setSelectedEntityType(paramType as 'all' | DirectoryEntityType);
    }
    const paramCat = searchParams.get('category');
    if (paramCat) {
      setSelectedCategory(paramCat);
    }
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    const loadDirectory = async () => {
      try {
        const token = await auth.getToken();
        const res = await fetch(`${getApiUrl()}/api/directory`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          cache: 'no-store',
        });
        if (!res.ok || !active) return;
        const data = await res.json();
        if (Array.isArray(data.companies) && active) {
          setCompanies(data.companies);
          setIsSubscribedMember(Boolean(data.isMemberAuthorized));
        }
      } catch {
        // Fallback already populated cleanly
      }
    };

    loadDirectory();
    const unsubscribe = auth.onAuthStateChanged((user: any) => {
      if (!active) return;
      setIsSubscribedMember(Boolean(user));
      loadDirectory();
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const handleSelectEntityType = (nextType: 'all' | DirectoryEntityType) => {
    setSelectedEntityType(nextType);
    const nextParams = new URLSearchParams(searchParams);
    if (nextType === 'all') nextParams.delete('type');
    else nextParams.set('type', nextType);
    setSearchParams(nextParams, { replace: true });
  };

  const resetFilters = () => {
    setSelectedEntityType('all');
    setSelectedCategory('Todas');
    setSelectedProvince('Todas');
    setSelectedTier('all');
    setSearchQuery('');
    setSearchParams({}, { replace: true });
  };

  const entityCounts = {
    all: companies.length,
    empresa: companies.filter((c) => (c.entityType || 'empresa') === 'empresa').length,
    emprendimiento: companies.filter((c) => c.entityType === 'emprendimiento').length,
    profesional: companies.filter((c) => c.entityType === 'profesional').length,
    servicio: companies.filter((c) => c.entityType === 'servicio').length,
  };

  const categories = ['Todas', ...Array.from(new Set(companies.map((c) => c.category)))];

  const orderedCompanies = sortCompaniesBySubscriptionTier(companies).filter((company) => {
    const companyType = company.entityType || 'empresa';
    const matchesEntityType =
      selectedEntityType === 'all' || companyType === selectedEntityType;
    const matchesCat =
      selectedCategory === 'Todas' || company.category === selectedCategory;
    const matchesProv =
      selectedProvince === 'Todas' || company.province === selectedProvince;
    const matchesTier = selectedTier === 'all' || company.tier === selectedTier;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      company.name.toLowerCase().includes(q) ||
      company.category.toLowerCase().includes(q) ||
      company.city.toLowerCase().includes(q) ||
      (company.credentialLabel || '').toLowerCase().includes(q) ||
      (company.serviceModality || '').toLowerCase().includes(q) ||
      company.subcategories.some((s) => s.toLowerCase().includes(q));
    return matchesEntityType && matchesCat && matchesProv && matchesTier && matchesSearch;
  });

  const handleSyncCRM = async (company: B2BCompanyRecord) => {
    if (!isSubscribedMember) {
      navigate('/planes');
      return;
    }
    const res = await syncCompanyToUserCRM(company);
    if (res.success) {
      setSyncedIds((prev) => (prev.includes(company.id) ? prev : [...prev, company.id]));
    }
    setToastMessage(res.message);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A080C] pt-20 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
        {/* Access Control Banner */}
        <div className="mb-8 rounded-2xl bg-slate-900 text-white p-4 sm:p-5 border border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isSubscribedMember
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
              }`}
            >
              {isSubscribedMember ? (
                <Unlock className="w-5 h-5" />
              ) : (
                <Lock className="w-5 h-5" />
              )}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white">
                {isSubscribedMember
                  ? 'Acceso Miembro Suscripto Activo · Datos Completos + Ingesta ARN IA'
                  : 'Vista Pública Limitada · Validación Servidor Activa'}
              </p>
              <p className="text-xs text-slate-300 mt-0.5">
                {isSubscribedMember
                  ? 'Visualizando CUIT, matrícula profesional, contacto directo y envío en 1 clic a Contactos CRM + ARN IA.'
                  : 'Los datos fiscales (CUIT), matrículas sensibles y contacto directo de Empresas, Emprendimientos, Profesionales y Servicios están protegidos para miembros suscriptos.'}
              </p>
            </div>
          </div>

          {!isSubscribedMember && (
            <Link
              to="/planes"
              className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors whitespace-nowrap shrink-0 self-start lg:self-auto"
            >
              Desbloquear con Membresía
            </Link>
          )}
        </div>

        {/* Header & Tier Filter */}
        <div className="mb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <p className="text-xs font-semibold text-orange-500 mb-1.5">
              Red Productiva & Industrial de Patagonia
            </p>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-slate-900 dark:text-white tracking-tight text-balance">
              Directorio B2B Multi-Perfil
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2 max-w-2xl text-sm sm:text-base">
              Encuentra Empresas, Emprendimientos, Profesionales matriculados y Servicios Técnicos ordenados por plan de suscripción e integrados a tu motor ARN IA.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-white dark:bg-[#1A1625] p-1.5 rounded-xl border border-slate-200 dark:border-white/10 self-start lg:self-end">
            <button
              onClick={() => setSelectedTier('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                selectedTier === 'all'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Todos ({companies.length})
            </button>
            <button
              onClick={() => setSelectedTier('corporativo')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 whitespace-nowrap ${
                selectedTier === 'corporativo'
                  ? 'bg-purple-600 text-white'
                  : 'text-purple-600 dark:text-purple-400 hover:bg-purple-500/10'
              }`}
            >
              <Crown className="w-3.5 h-3.5" /> Corporativo
            </button>
            <button
              onClick={() => setSelectedTier('pro')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 whitespace-nowrap ${
                selectedTier === 'pro'
                  ? 'bg-orange-500 text-white'
                  : 'text-orange-600 dark:text-orange-400 hover:bg-orange-500/10'
              }`}
            >
              <Zap className="w-3.5 h-3.5" /> Pro Industrial
            </button>
            <button
              onClick={() => setSelectedTier('inicial')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                selectedTier === 'inicial'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              Inicial
            </button>
          </div>
        </div>

        {/* Entity Type Segmented Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-5">
          {(
            [
              { id: 'all', label: `Todos (${entityCounts.all})`, icon: Sparkles },
              { id: 'empresa', label: `Empresas (${entityCounts.empresa})`, icon: Building2 },
              {
                id: 'emprendimiento',
                label: `Emprendimientos (${entityCounts.emprendimiento})`,
                icon: Rocket,
              },
              {
                id: 'profesional',
                label: `Profesionales (${entityCounts.profesional})`,
                icon: GraduationCap,
              },
              {
                id: 'servicio',
                label: `Servicios Industriales (${entityCounts.servicio})`,
                icon: Briefcase,
              },
            ] as const
          ).map((tab) => {
            const TabIcon = tab.icon;
            const active = selectedEntityType === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleSelectEntityType(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-orange-500 text-white'
                    : 'bg-white dark:bg-[#1A1625] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:border-purple-500/40'
                }`}
              >
                <TabIcon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search & Facet Filter Bar */}
        <div className="bg-white dark:bg-[#1A1625] p-4 rounded-2xl border border-slate-200 dark:border-white/10 mb-8 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar empresa, emprendimiento, profesional, matrícula o servicio..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            />
          </div>
          <div className="md:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white focus:outline-none"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'Todas' ? 'Todos los Rubros' : cat}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-3">
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white focus:outline-none"
            >
              {PROVINCES.map((prov) => (
                <option key={prov} value={prov}>
                  {prov === 'Todas' ? 'Todas las Provincias' : prov}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Empty State */}
        {orderedCompanies.length === 0 ? (
          <div className="bg-white dark:bg-[#1A1625] rounded-2xl border border-slate-200 dark:border-white/10 p-12 text-center">
            <p className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Sin coincidencias para los filtros actuales
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              Prueba limpiando la búsqueda o cambiando de perfil entre Empresas, Emprendimientos, Profesionales y Servicios.
            </p>
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Restablecer filtros
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orderedCompanies.map((company) => {
              const tierMeta = TIER_CONFIG[company.tier];
              const typeKey = company.entityType || 'empresa';
              const typeMeta = ENTITY_TYPE_CONFIG[typeKey];
              const TypeIcon = ENTITY_ICONS[typeKey] || Building2;
              const isSynced = syncedIds.includes(company.id);

              return (
                <div
                  key={company.id}
                  className={`bg-white dark:bg-[#1A1625] rounded-2xl p-6 border ${tierMeta.borderAccent} transition-colors`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    <div className="flex-1 min-w-0">
                      {/* Clean Unboxed Typographic Metadata */}
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mb-2">
                        <span className="inline-flex items-center gap-1.5 font-bold text-orange-600 dark:text-orange-400">
                          <TypeIcon className="w-3.5 h-3.5" />
                          {typeMeta.label}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                          {company.tierLabel}
                        </span>
                        {company.verified && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                              <ShieldCheck className="w-3.5 h-3.5" /> Verificado
                            </span>
                          </>
                        )}
                        <span aria-hidden="true">·</span>
                        <span>{company.category}</span>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-orange-500" />
                          {company.city}, {company.province}
                        </span>
                      </div>

                      <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white mb-1.5">
                        {company.name}
                      </h2>

                      {(company.serviceModality || company.credentialLabel) && (
                        <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-2.5">
                          {[company.credentialLabel, company.serviceModality]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      )}

                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 max-w-3xl leading-relaxed">
                        {company.publicSummary}
                      </p>

                      {company.subcategories.length > 0 && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
                          <strong className="text-slate-800 dark:text-white">Especialidades:</strong>{' '}
                          {company.subcategories.join(' · ')}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                          <Route className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                          {company.adnComercial.corredorLogistico}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          <strong className="text-slate-700 dark:text-slate-300">Ofrece:</strong>{' '}
                          {company.adnComercial.ofrece.slice(0, 2).join(', ') || 'Consultar ficha'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          <strong className="text-slate-700 dark:text-slate-300">Demanda:</strong>{' '}
                          {company.adnComercial.demanda.slice(0, 2).join(', ') || 'Abierto'}
                        </span>
                      </div>

                      {isSubscribedMember ? (
                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                          <div>
                            <span className="text-[11px] font-semibold text-slate-400 block">
                              CUIT & Scoring
                            </span>
                            <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                              {company.cuit || 'Registrado'}
                            </span>
                            <span className="block text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                              {company.creditRating}
                            </span>
                          </div>
                          <div>
                            <span className="text-[11px] font-semibold text-slate-400 block">
                              Decisor / Titular (CRM)
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {company.contactName}
                            </span>
                            <span className="text-[11px] text-slate-500">{company.contactRole}</span>
                          </div>
                          <div>
                            <span className="text-[11px] font-semibold text-slate-400 block">
                              Contacto Directo
                            </span>
                            <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1 truncate">
                              <Mail className="w-3 h-3 text-orange-500 shrink-0" />
                              {company.email}
                            </span>
                            <span className="font-mono tabular-nums text-slate-600 dark:text-slate-400 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-emerald-500 shrink-0" />
                              {company.phone || 'Consultar en ficha'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[11px] font-semibold text-slate-400 block">
                              Condiciones Comerciales
                            </span>
                            <span className="font-medium text-slate-700 dark:text-slate-300 block">
                              {company.paymentTerms}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="flex items-center gap-1.5 font-mono tabular-nums">
                              <Lock className="w-3.5 h-3.5 text-orange-500" />
                              CUIT / CUIL: ••-••••••••-•
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-purple-500" />
                              Contacto directo, matrícula y envío a ARN IA:{' '}
                              <strong className="text-slate-700 dark:text-slate-300">
                                Solo Miembros
                              </strong>
                            </span>
                          </div>
                          <Link
                            to="/planes"
                            className="font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 whitespace-nowrap"
                          >
                            Desbloquear con Suscripción <ArrowUpRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      )}
                    </div>

                    {/* Action Column */}
                    <div className="w-full lg:w-60 shrink-0 flex flex-col gap-2.5 justify-center border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-white/5 pt-4 lg:pt-0 lg:pl-6">
                      {isSubscribedMember ? (
                        <>
                          <button
                            onClick={() => handleSyncCRM(company)}
                            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${
                              isSynced
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                : 'bg-purple-600 hover:bg-purple-700 text-white'
                            }`}
                          >
                            {isSynced ? (
                              <>
                                <CheckCircle2 className="w-4 h-4" /> En Contactos & ARN
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4" /> Enviar a ARN IA & CRM
                              </>
                            )}
                          </button>

                          <Link
                            to="/chat"
                            className="w-full py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                          >
                            <MessageSquare className="w-4 h-4" /> Conectar (Chat B2B)
                          </Link>

                          <Link
                            to={`/logistica?tab=rutas&origin=${encodeURIComponent(
                              company.adnComercial.ciudadBase
                            )}&dest=${encodeURIComponent('Añelo (Hub Vaca Muerta)')}`}
                            className="w-full py-2 px-4 rounded-xl border border-slate-200 dark:border-white/10 hover:border-orange-500/40 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
                          >
                            <Route className="w-3.5 h-3.5 text-orange-500" />
                            Calcular Flete OSRM
                          </Link>

                          <button
                            onClick={() => setSelectedCompanyModal(company)}
                            className="w-full py-2 px-4 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors whitespace-nowrap"
                          >
                            {typeKey === 'profesional' ? 'Ver Ficha Profesional' : 'Ver Legajo Completo'}
                          </button>
                        </>
                      ) : (
                        <>
                          <Link
                            to="/planes"
                            className="w-full py-3 px-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 text-xs font-bold transition-opacity flex items-center justify-center gap-2 whitespace-nowrap"
                          >
                            <Lock className="w-3.5 h-3.5 text-orange-500" />
                            Conectar & ARN IA
                          </Link>
                          <Link
                            to={`/logistica?tab=rutas&origin=${encodeURIComponent(
                              company.adnComercial.ciudadBase
                            )}&dest=${encodeURIComponent('Añelo (Hub Vaca Muerta)')}`}
                            className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                          >
                            <Route className="w-3.5 h-3.5 text-orange-500" />
                            Simular Distancia (OSRM)
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Legajo / Ficha Técnica */}
      <AnimatePresence>
        {selectedCompanyModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setSelectedCompanyModal(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl bg-white dark:bg-[#1A1625] rounded-2xl border border-slate-200 dark:border-white/10 p-6 md:p-8 shadow-2xl z-10"
            >
              <div className="flex items-start justify-between gap-4 mb-6 border-b border-slate-200 dark:border-white/10 pb-4">
                <div>
                  <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 block mb-1">
                    {ENTITY_TYPE_CONFIG[selectedCompanyModal.entityType || 'empresa'].label} ·{' '}
                    {selectedCompanyModal.tierLabel}
                  </span>
                  <h3 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
                    {selectedCompanyModal.name}
                  </h3>
                  <p className="text-xs font-mono tabular-nums text-slate-500 mt-1">
                    CUIT / CUIL: {selectedCompanyModal.cuit} · Estructura:{' '}
                    {selectedCompanyModal.employeeCount}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedCompanyModal(null)}
                  className="text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-sm">
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {selectedCompanyModal.publicSummary}
                </p>

                {selectedCompanyModal.credentialLabel && (
                  <div className="text-xs text-slate-700 dark:text-slate-200">
                    <strong>Acreditación / Matrícula:</strong> {selectedCompanyModal.credentialLabel}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-[#110E17] p-4 rounded-xl border border-slate-200 dark:border-white/5">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block">
                      Titular / Contacto Principal
                    </span>
                    <p className="font-bold text-slate-900 dark:text-white">
                      {selectedCompanyModal.contactName}
                    </p>
                    <p className="text-xs text-slate-500">{selectedCompanyModal.contactRole}</p>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block">
                      Canales Directos Verificados
                    </span>
                    <p className="text-xs font-mono text-slate-800 dark:text-slate-200">
                      {selectedCompanyModal.email}
                    </p>
                    <p className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-400">
                      {selectedCompanyModal.phone}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block">
                      Certificaciones Homologadas
                    </span>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                      {selectedCompanyModal.certifications.join(' · ') || 'Verificada en red'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block">
                      Condiciones Comerciales
                    </span>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1">
                      {selectedCompanyModal.paymentTerms}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-white/10 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() =>
                    generateVendorPackPdf({
                      companyName: selectedCompanyModal.name,
                      entityType: selectedCompanyModal.entityType || 'empresa',
                      cuit: selectedCompanyModal.cuit,
                      province: selectedCompanyModal.province,
                      city: selectedCompanyModal.city,
                      credentialLabel: selectedCompanyModal.credentialLabel,
                      serviceModality: selectedCompanyModal.serviceModality,
                      description: selectedCompanyModal.publicSummary,
                      categories: [selectedCompanyModal.category, ...selectedCompanyModal.subcategories],
                      certifications: selectedCompanyModal.certifications,
                      contactEmail: selectedCompanyModal.email,
                      phone: selectedCompanyModal.phone,
                    })
                  }
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-2 whitespace-nowrap"
                >
                  <FileDown className="w-4 h-4 text-orange-500" /> Exportar Legajo (PDF)
                </button>
                <button
                  onClick={() => {
                    handleSyncCRM(selectedCompanyModal);
                    setSelectedCompanyModal(null);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-2 whitespace-nowrap"
                >
                  <Sparkles className="w-4 h-4" /> Enviar a ARN IA & CRM
                </button>
                <Link
                  to="/dashboard?area=arn_crm"
                  className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold whitespace-nowrap"
                >
                  Abrir Panel ARN IA
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sync Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-6 right-6 z-[120] bg-slate-900 text-white px-5 py-4 rounded-2xl shadow-2xl border border-white/15 flex items-center gap-3.5 max-w-md"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="text-xs">
              <p className="font-bold text-white mb-0.5">Sincronización ARN IA & CRM</p>
              <p className="text-slate-300">{toastMessage}</p>
            </div>
            <Link
              to="/dashboard?area=arn_crm"
              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold whitespace-nowrap shrink-0"
            >
              Ver ARN IA
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
