import React, { useState, useEffect } from 'react';
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
  FileBadge,
  Phone,
  Mail,
  ArrowUpRight,
  Database,
  Crown,
  Zap,
  Filter,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  B2B_COMPANIES,
  B2BCompanyRecord,
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
];

export default function Services() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedProvince, setSelectedProvince] = useState('Todas');
  const [selectedTier, setSelectedTier] = useState<'all' | SubscriptionTier>('all');
  const [isSubscribedMember, setIsSubscribedMember] = useState(false);
  const [syncedIds, setSyncedIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedCompanyModal, setSelectedCompanyModal] = useState<B2BCompanyRecord | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setIsSubscribedMember(true);
      }
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setIsSubscribedMember(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const categories = [
    'Todas',
    ...Array.from(new Set(B2B_COMPANIES.map((c) => c.category))),
  ];

  // Strictly order companies by Subscription Plan Tier (Corporativo -> Pro Industrial -> Inicial)
  const orderedCompanies = sortCompaniesBySubscriptionTier(B2B_COMPANIES).filter(
    (company) => {
      const matchesCat =
        selectedCategory === 'Todas' || company.category === selectedCategory;
      const matchesProv =
        selectedProvince === 'Todas' || company.province === selectedProvince;
      const matchesTier =
        selectedTier === 'all' || company.tier === selectedTier;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        company.name.toLowerCase().includes(q) ||
        company.category.toLowerCase().includes(q) ||
        company.city.toLowerCase().includes(q) ||
        company.subcategories.some((s) => s.toLowerCase().includes(q));
      return matchesCat && matchesProv && matchesTier && matchesSearch;
    }
  );

  const handleSyncCRM = async (company: B2BCompanyRecord) => {
    if (!isSubscribedMember) {
      navigate('/planes');
      return;
    }
    const res = await syncCompanyToUserCRM(company);
    if (res.success) {
      setSyncedIds((prev) =>
        prev.includes(company.id) ? prev : [...prev, company.id]
      );
      setToastMessage(res.message);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A080C] pt-20 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
        {/* Top Access Control Banner: Explains Public Limitation vs. Member CRM Integration */}
        <div className="mb-8 rounded-2xl bg-slate-900 text-white p-4 sm:p-5 border border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-lg">
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
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  {isSubscribedMember
                    ? 'Acceso Miembro Suscripto Activo (Datos Completos + Sincronización CRM)'
                    : 'Vista Pública Limitada (Solo Información General)'}
                </span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/10 text-slate-300">
                  Ordenado por Plan de Suscripción
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {isSubscribedMember
                  ? 'Visualizando CUIT, decisores de compra, contacto directo y botón de inyección directa de empresas a tu CRM.'
                  : 'Los datos fiscales (CUIT), decisores comerciales, contacto directo e integración al CRM están reservados para empresas registradas con suscripción activa.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsSubscribedMember(!isSubscribedMember)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 ${
                isSubscribedMember
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                  : 'bg-white/10 border-white/15 text-white hover:bg-white/20'
              }`}
            >
              {isSubscribedMember ? (
                <>
                  <Lock className="w-3.5 h-3.5" /> Cambiar a Vista Pública
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5 text-orange-400" /> Simular Vista Miembro Suscripto
                </>
              )}
            </button>
            {!isSubscribedMember && (
              <Link
                to="/planes"
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Ver Planes de Suscripción
              </Link>
            )}
          </div>
        </div>

        {/* Header & Search */}
        <div className="mb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-orange-500 mb-2">
              <Building2 className="w-4 h-4" /> Directorio Corporativo B2B
            </span>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-slate-900 dark:text-white tracking-tight">
              Empresas y Proveedores de la Patagonia
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2 max-w-2xl text-sm sm:text-base">
              Las empresas se listan según su nivel de validación y plan de suscripción (Corporativo &rarr; Pro Industrial &rarr; Inicial) y se sincronizan en un clic con el módulo CRM.
            </p>
          </div>

          {/* Subscription Plan Hierarchy Filter */}
          <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-[#1A1625] p-1.5 rounded-xl border border-slate-200 dark:border-white/10 self-start lg:self-end">
            <button
              onClick={() => setSelectedTier('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedTier === 'all'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Todos ({B2B_COMPANIES.length})
            </button>
            <button
              onClick={() => setSelectedTier('corporativo')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                selectedTier === 'corporativo'
                  ? 'bg-purple-600 text-white'
                  : 'text-purple-600 dark:text-purple-400 hover:bg-purple-500/10'
              }`}
            >
              <Crown className="w-3.5 h-3.5" /> Corporativo
            </button>
            <button
              onClick={() => setSelectedTier('pro')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                selectedTier === 'pro'
                  ? 'bg-orange-500 text-white'
                  : 'text-orange-600 dark:text-orange-400 hover:bg-orange-500/10'
              }`}
            >
              <Zap className="w-3.5 h-3.5" /> Pro Industrial
            </button>
            <button
              onClick={() => setSelectedTier('inicial')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedTier === 'inicial'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              Inicial
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white dark:bg-[#1A1625] p-4 rounded-2xl border border-slate-200 dark:border-white/10 mb-8 grid grid-cols-1 md:grid-cols-12 gap-4 items-center shadow-sm">
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por razón social, rubro, servicio o ciudad..."
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

        {/* Company Directory Cards (Ordered by Subscription Tier) */}
        <div className="space-y-4">
          {orderedCompanies.map((company, index) => {
            const tierMeta = TIER_CONFIG[company.tier];
            const isSynced = syncedIds.includes(company.id);

            return (
              <motion.div
                key={company.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className={`bg-white dark:bg-[#1A1625] rounded-2xl p-6 border ${tierMeta.borderAccent} shadow-sm hover:shadow-md transition-all`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                  {/* Left: Public Identity & Tier Priority */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${tierMeta.badgeBg} ${tierMeta.badgeText}`}
                      >
                        {company.tier === 'corporativo' && (
                          <Crown className="w-3 h-3" />
                        )}
                        {company.tier === 'pro' && <Zap className="w-3 h-3" />}
                        {company.tierLabel}
                      </span>

                      {company.verified && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">
                          <ShieldCheck className="w-3.5 h-3.5" /> Verificada
                        </span>
                      )}

                      <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 text-[10px] font-bold uppercase tracking-wider">
                        {company.category}
                      </span>

                      <span className="text-xs text-slate-500 flex items-center gap-1 ml-auto lg:ml-0">
                        <MapPin className="w-3.5 h-3.5 text-orange-500" />
                        {company.city}, {company.province}
                      </span>
                    </div>

                    <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white mb-2">
                      {company.name}
                    </h2>

                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 max-w-3xl leading-relaxed">
                      {company.publicSummary}
                    </p>

                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {company.subcategories.map((sub) => (
                        <span
                          key={sub}
                          className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/5 text-xs font-medium text-slate-600 dark:text-slate-300"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>

                    {/* Commercial & CRM Data Strip: Gated for Public vs Unlocked for Subscribed Members */}
                    {isSubscribedMember ? (
                      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50/80 dark:bg-[#110E17]/70 p-3.5 rounded-xl">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            CUIT & Scoring
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                            {company.cuit}
                          </span>
                          <span className="block text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                            {company.creditRating}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Decisor Comercial (CRM)
                          </span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white block">
                            {company.contactName}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {company.contactRole}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Contacto Directo
                          </span>
                          <span className="text-xs font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1 truncate">
                            <Mail className="w-3 h-3 text-orange-500 shrink-0" />
                            {company.email}
                          </span>
                          <span className="text-xs font-mono text-slate-600 dark:text-slate-400 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-emerald-500 shrink-0" />
                            {company.phone}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Condiciones B2B
                          </span>
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300 block">
                            {company.paymentTerms}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-[#110E17]/60 px-4 py-2.5 rounded-xl">
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1.5 font-mono">
                            <Lock className="w-3.5 h-3.5 text-orange-500" />
                            CUIT: 30-••••••••-•
                          </span>
                          <span className="hidden sm:inline">•</span>
                          <span className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-purple-500" />
                            Decisor de Compras y Datos CRM: <strong className="text-slate-700 dark:text-slate-300">Solo Miembros Suscriptos</strong>
                          </span>
                        </div>
                        <Link
                          to="/planes"
                          className="text-xs font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1"
                        >
                          Desbloquear con Suscripción <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Right Action Column: Connect & Sync CRM */}
                  <div className="w-full lg:w-60 shrink-0 flex flex-col gap-2.5 justify-center border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-white/5 pt-4 lg:pt-0 lg:pl-6">
                    {isSubscribedMember ? (
                      <>
                        <button
                          onClick={() => handleSyncCRM(company)}
                          className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                            isSynced
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              : 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm'
                          }`}
                        >
                          {isSynced ? (
                            <>
                              <CheckCircle2 className="w-4 h-4" /> En tu CRM
                            </>
                          ) : (
                            <>
                              <Database className="w-4 h-4" /> Integrar al CRM
                            </>
                          )}
                        </button>

                        <Link
                          to="/chat"
                          className="w-full py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                        >
                          <MessageSquare className="w-4 h-4" /> Conectar (Chat B2B)
                        </Link>

                        <button
                          onClick={() => setSelectedCompanyModal(company)}
                          className="w-full py-2 px-4 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors"
                        >
                          Ver Legajo Completo
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/planes"
                          className="w-full py-3 px-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                        >
                          <Lock className="w-3.5 h-3.5 text-orange-500" />
                          Conectar & CRM
                        </Link>
                        <button
                          onClick={() => setIsSubscribedMember(true)}
                          className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-white/10 text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:text-orange-500 hover:border-orange-500/40 transition-colors"
                        >
                          Previsualizar como Miembro
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Company Full Legajo Modal (For Subscribed Members) */}
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
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-500 block mb-1">
                    Legajo Corporativo Auditado • {selectedCompanyModal.tierLabel}
                  </span>
                  <h3 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
                    {selectedCompanyModal.name}
                  </h3>
                  <p className="text-xs font-mono text-slate-500 mt-1">
                    CUIT: {selectedCompanyModal.cuit} • Dotación: {selectedCompanyModal.employeeCount} empleados
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-[#110E17] p-4 rounded-xl border border-slate-200 dark:border-white/5">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      Contacto Principal en CRM
                    </span>
                    <p className="font-bold text-slate-900 dark:text-white">
                      {selectedCompanyModal.contactName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {selectedCompanyModal.contactRole}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      Canales Directos Verificados
                    </span>
                    <p className="text-xs font-mono text-slate-800 dark:text-slate-200">
                      {selectedCompanyModal.email}
                    </p>
                    <p className="text-xs font-mono text-slate-600 dark:text-slate-400">
                      {selectedCompanyModal.phone}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      Certificaciones Homologadas
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedCompanyModal.certifications.map((c) => (
                        <span
                          key={c}
                          className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
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
                  onClick={() => {
                    handleSyncCRM(selectedCompanyModal);
                    setSelectedCompanyModal(null);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                >
                  <Database className="w-4 h-4" /> Guardar en mi CRM
                </button>
                <Link
                  to="/dashboard"
                  className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider"
                >
                  Abrir Panel CRM
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CRM Sync Toast Notification */}
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
              <p className="font-bold text-white mb-0.5">Sincronización CRM Completada</p>
              <p className="text-slate-300">{toastMessage}</p>
            </div>
            <Link
              to="/dashboard"
              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold uppercase tracking-wider shrink-0"
            >
              Ver CRM
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
