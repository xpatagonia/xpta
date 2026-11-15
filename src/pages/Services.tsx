import { useEffect, useMemo, useRef, useState } from 'react';
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
  Map as MapIcon,
  List,
  LayoutGrid,
  LocateFixed,
  Smartphone,
  Bookmark,
  BookmarkCheck,
  Navigation,
  ExternalLink,
  X,
  Compass,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { auth } from '../lib/db';
import { getApiUrl } from '../lib/apiConfig';
import { generateVendorPackPdf } from '../lib/pdfDocuments';
import { haversineKm } from '../lib/patagoniaRouting';
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
import {
  TaxDisplayMode,
  resolvePrimaryPriceLabel,
} from '../lib/taxPricing';
import {
  buildCompanyGeoJson,
  buildCompanyGpx,
  buildCompanyVCard,
  getNavigationDeepLinks,
  getOfflineFavoriteCompanies,
  toggleOfflineFavoriteCompany,
  triggerTextFileDownload,
} from '../lib/mobileDirectoryDownloads';
import PatagoniaDirectoryMap from '../components/PatagoniaDirectoryMap';
import PWAInstallButton from '../components/PWAInstallButton';

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

const REFERENCE_HUBS: Array<{ id: string; label: string; lat: number; lng: number }> = [
  { id: 'comodoro', label: 'Comodoro Rivadavia (Chubut)', lat: -45.8641, lng: -67.4966 },
  { id: 'neuquen', label: 'Neuquén Capital', lat: -38.9516, lng: -68.0591 },
  { id: 'anelo', label: 'Añelo (Hub Vaca Muerta)', lat: -38.3522, lng: -68.7897 },
  { id: 'madryn', label: 'Puerto Madryn', lat: -42.7692, lng: -65.0385 },
  { id: 'bariloche', label: 'San Carlos de Bariloche', lat: -41.1335, lng: -71.3103 },
  { id: 'gallegos', label: 'Río Gallegos (Santa Cruz)', lat: -51.6226, lng: -69.2181 },
  { id: 'ushuaia', label: 'Ushuaia (Tierra del Fuego)', lat: -54.8019, lng: -68.303 },
];

type SortOption = 'tier' | 'distance' | 'verified' | 'name';
type ViewMode = 'split' | 'list' | 'grid';

const ENTITY_ICONS: Record<DirectoryEntityType, typeof Building2> = {
  empresa: Building2,
  emprendimiento: Rocket,
  profesional: GraduationCap,
  servicio: Briefcase,
};

function matchesCorridorFilter(corridorText: string, selectedCorridor: string): boolean {
  if (selectedCorridor === 'all') return true;
  const upper = (corridorText || '').toUpperCase();
  if (selectedCorridor === 'RN3') return upper.includes('RN 3') || upper.includes('RN3');
  if (selectedCorridor === 'RN22') return upper.includes('RN 22') || upper.includes('RN22');
  if (selectedCorridor === 'RN40') return upper.includes('RN 40') || upper.includes('RN40');
  if (selectedCorridor === 'VACA_MUERTA') {
    return upper.includes('RN 7') || upper.includes('VACA MUERTA') || upper.includes('AÑELO');
  }
  if (selectedCorridor === 'CENTRO_NORTE') {
    return upper.includes('CENTRO') || upper.includes('CORREDOR') && !upper.includes('RN 3') && !upper.includes('RN 40');
  }
  return true;
}

function matchesModalityFilter(modalityText: string | undefined, selected: string): boolean {
  if (selected === 'all') return true;
  const text = (modalityText || '').toLowerCase();
  if (selected === 'remoto') return text.includes('remoto') || text.includes('virtual') || text.includes('digital');
  if (selected === 'mixta') return text.includes('mixt') || text.includes('cobertura') || text.includes('híbrid');
  if (selected === 'presencial') {
    return !text || text.includes('presencial') || text.includes('campo') || text.includes('locación') || text.includes('taller') || text.includes('ruta');
  }
  return true;
}

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
  const [selectedCorridor, setSelectedCorridor] = useState('all');
  const [selectedModality, setSelectedModality] = useState('all');
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [onlyOfflineSaved, setOnlyOfflineSaved] = useState(
    searchParams.get('offline') === '1'
  );
  const [sortBy, setSortBy] = useState<SortOption>('tier');
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [priceMode, setPriceMode] = useState<TaxDisplayMode>('net');

  const [companies, setCompanies] = useState<B2BCompanyRecord[]>(() =>
    sortCompaniesBySubscriptionTier(B2B_COMPANIES)
  );
  const [offlineFavorites, setOfflineFavorites] = useState<B2BCompanyRecord[]>(() =>
    getOfflineFavoriteCompanies()
  );
  const [selectedMapCompanyId, setSelectedMapCompanyId] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number; label: string } | null>(
    () => ({
      lat: REFERENCE_HUBS[0].lat,
      lng: REFERENCE_HUBS[0].lng,
      label: 'Comodoro Rivadavia',
    })
  );
  const [isSubscribedMember, setIsSubscribedMember] = useState(false);
  const [syncedIds, setSyncedIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedCompanyModal, setSelectedCompanyModal] = useState<B2BCompanyRecord | null>(null);
  const [mobileSheetCompany, setMobileSheetCompany] = useState<B2BCompanyRecord | null>(null);
  const qrCanvasRef = useRef<HTMLDivElement | null>(null);
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
    if (searchParams.get('offline') === '1') {
      setOnlyOfflineSaved(true);
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
        // Offline / cache fallback: combine cached offline saved companies when network unavailable
        const offlineSaved = getOfflineFavoriteCompanies();
        if (offlineSaved.length > 0 && active) {
          setCompanies((prev) => {
            const byId = new Map(prev.map((c) => [c.id, c]));
            for (const saved of offlineSaved) {
              byId.set(saved.id, saved);
            }
            return sortCompaniesBySubscriptionTier(Array.from(byId.values()));
          });
        }
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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  const handleRequestGps = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      showToast('GPS del navegador no disponible; elegí un Hub patagónico de referencia.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: 'Mi GPS Actual',
        });
        setSortBy('distance');
        showToast('Ubicación GPS detectada. Ordenado por cercanía real.');
      },
      () => {
        showToast('No se concedió permiso GPS. Podés seleccionar un Hub en la barra superior.');
      },
      { enableHighAccuracy: false, timeout: 6000 }
    );
  };

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
    setSelectedCorridor('all');
    setSelectedModality('all');
    setOnlyVerified(false);
    setOnlyOfflineSaved(false);
    setSearchQuery('');
    setSearchParams({}, { replace: true });
  };

  const sourceList = useMemo(() => {
    if (!onlyOfflineSaved) return companies;
    const savedIds = new Set(offlineFavorites.map((f) => f.id));
    const mergedOffline = companies.filter((c) => savedIds.has(c.id));
    if (mergedOffline.length > 0) return mergedOffline;
    return offlineFavorites;
  }, [onlyOfflineSaved, companies, offlineFavorites]);

  const entityCounts = useMemo(
    () => ({
      all: sourceList.length,
      empresa: sourceList.filter((c) => (c.entityType || 'empresa') === 'empresa').length,
      emprendimiento: sourceList.filter((c) => c.entityType === 'emprendimiento').length,
      profesional: sourceList.filter((c) => c.entityType === 'profesional').length,
      servicio: sourceList.filter((c) => c.entityType === 'servicio').length,
    }),
    [sourceList]
  );

  const categories = useMemo(
    () => ['Todas', ...Array.from(new Set(companies.map((c) => c.category)))],
    [companies]
  );

  const offlineSavedIds = useMemo(
    () => new Set(offlineFavorites.map((f) => f.id)),
    [offlineFavorites]
  );

  const orderedCompanies = useMemo(() => {
    const filtered = sourceList.filter((company) => {
      const companyType = company.entityType || 'empresa';
      const matchesEntityType =
        selectedEntityType === 'all' || companyType === selectedEntityType;
      const matchesCat =
        selectedCategory === 'Todas' || company.category === selectedCategory;
      const matchesProv =
        selectedProvince === 'Todas' || company.province === selectedProvince;
      const matchesTier = selectedTier === 'all' || company.tier === selectedTier;
      const matchesVer = !onlyVerified || Boolean(company.verified);
      const matchesCorr = matchesCorridorFilter(
        company.adnComercial?.corredorLogistico || '',
        selectedCorridor
      );
      const matchesMod = matchesModalityFilter(company.serviceModality, selectedModality);
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        company.name.toLowerCase().includes(q) ||
        company.category.toLowerCase().includes(q) ||
        company.city.toLowerCase().includes(q) ||
        (company.adnComercial?.corredorLogistico || '').toLowerCase().includes(q) ||
        (company.credentialLabel || '').toLowerCase().includes(q) ||
        (company.serviceModality || '').toLowerCase().includes(q) ||
        company.subcategories.some((s) => s.toLowerCase().includes(q)) ||
        (company.serviceItems || []).some((s) => s.serviceName.toLowerCase().includes(q));
      return (
        matchesEntityType &&
        matchesCat &&
        matchesProv &&
        matchesTier &&
        matchesVer &&
        matchesCorr &&
        matchesMod &&
        matchesSearch
      );
    });

    const withDistance = filtered.map((company) => {
      const distKm = userCoords
        ? Math.round(
            haversineKm(
              userCoords.lat,
              userCoords.lng,
              Number(company.adnComercial?.lat ?? -45.8641),
              Number(company.adnComercial?.lng ?? -67.4966)
            ) * 1.24
          )
        : 0;
      return { company, distKm };
    });

    withDistance.sort((a, b) => {
      if (sortBy === 'distance') {
        if (a.distKm !== b.distKm) return a.distKm - b.distKm;
      } else if (sortBy === 'verified') {
        if (Boolean(a.company.verified) !== Boolean(b.company.verified)) {
          return a.company.verified ? -1 : 1;
        }
      } else if (sortBy === 'name') {
        return a.company.name.localeCompare(b.company.name);
      }
      // Default tiebreaker & 'tier' sort
      const prioA = a.company.tierPriority ?? 3;
      const prioB = b.company.tierPriority ?? 3;
      if (prioA !== prioB) return prioA - prioB;
      if (Boolean(a.company.verified) !== Boolean(b.company.verified)) {
        return a.company.verified ? -1 : 1;
      }
      return a.company.name.localeCompare(b.company.name);
    });

    return withDistance;
  }, [
    sourceList,
    selectedEntityType,
    selectedCategory,
    selectedProvince,
    selectedTier,
    onlyVerified,
    selectedCorridor,
    selectedModality,
    searchQuery,
    userCoords,
    sortBy,
  ]);

  const handleSyncCRM = async (company: B2BCompanyRecord) => {
    if (!isSubscribedMember) {
      navigate('/planes');
      return;
    }
    const res = await syncCompanyToUserCRM(company);
    if (res.success) {
      setSyncedIds((prev) => (prev.includes(company.id) ? prev : [...prev, company.id]));
    }
    showToast(res.message);
  };

  const handleToggleOfflineSave = (company: B2BCompanyRecord) => {
    const res = toggleOfflineFavoriteCompany(company);
    setOfflineFavorites(res.items);
    showToast(
      res.saved
        ? `"${company.name}" guardada para acceso offline sin señal.`
        : `"${company.name}" quitada de fichas offline.`
    );
  };

  const handleExportPdfWithQr = (company: B2BCompanyRecord) => {
    let qrDataUrl: string | undefined;
    try {
      const canvas = qrCanvasRef.current?.querySelector('canvas');
      if (canvas) qrDataUrl = canvas.toDataURL('image/png');
    } catch {
      // Optional QR embed
    }

    generateVendorPackPdf({
      companyName: company.name,
      entityType: company.entityType || 'empresa',
      cuit: company.cuit,
      province: company.province,
      city: company.city,
      corridor: company.adnComercial.corredorLogistico,
      lat: company.adnComercial.lat,
      lng: company.adnComercial.lng,
      qrDataUrl,
      credentialLabel: company.credentialLabel,
      serviceModality: company.serviceModality,
      description: company.publicSummary,
      categories: [company.category, ...company.subcategories],
      certifications: company.certifications,
      contactEmail: company.email,
      phone: company.phone,
      website: company.website,
      serviceItems: isSubscribedMember ? company.serviceItems : undefined,
    });
    showToast('Vendor Pack PDF descargado con coordenadas GPS y QR.');
  };

  const activeChips: Array<{ key: string; label: string; onClear: () => void }> = [];
  if (selectedEntityType !== 'all') {
    activeChips.push({
      key: 'entity',
      label: `Perfil: ${ENTITY_TYPE_CONFIG[selectedEntityType].label}`,
      onClear: () => handleSelectEntityType('all'),
    });
  }
  if (selectedCategory !== 'Todas') {
    activeChips.push({
      key: 'cat',
      label: `Rubro: ${selectedCategory}`,
      onClear: () => setSelectedCategory('Todas'),
    });
  }
  if (selectedProvince !== 'Todas') {
    activeChips.push({
      key: 'prov',
      label: `Provincia: ${selectedProvince}`,
      onClear: () => setSelectedProvince('Todas'),
    });
  }
  if (selectedCorridor !== 'all') {
    activeChips.push({
      key: 'corr',
      label: `Corredor: ${selectedCorridor}`,
      onClear: () => setSelectedCorridor('all'),
    });
  }
  if (selectedModality !== 'all') {
    activeChips.push({
      key: 'mod',
      label: `Modalidad: ${selectedModality}`,
      onClear: () => setSelectedModality('all'),
    });
  }
  if (onlyVerified) {
    activeChips.push({
      key: 'ver',
      label: 'Solo Verificadas KYB',
      onClear: () => setOnlyVerified(false),
    });
  }
  if (onlyOfflineSaved) {
    activeChips.push({
      key: 'off',
      label: 'Guardadas Offline',
      onClear: () => setOnlyOfflineSaved(false),
    });
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A080C] pt-20 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10">
        {/* Access Control Banner */}
        <div className="mb-6 rounded-2xl bg-slate-900 text-white p-4 sm:p-5 border border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
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
                  ? 'Acceso Miembro Activo · Coordenadas GPS, Tarifarios y Descargas Móviles'
                  : 'Vista Pública Limitada · Validación Servidor Activa'}
              </p>
              <p className="text-xs text-slate-300 mt-0.5">
                {isSubscribedMember
                  ? 'Descargá tarjetas .vcf para tu celular, waypoints .gpx offline y tarifas con/sin IVA.'
                  : 'Suscribite como Empresa o Autónomo ($24.900/mes) para descargar coordenadas GPS, tarifas y contacto directo.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
            <PWAInstallButton compact />
            {!isSubscribedMember && (
              <Link
                to="/planes"
                className="min-h-[44px] px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors whitespace-nowrap shrink-0 inline-flex items-center"
              >
                Ver Planes (Desde $24.900)
              </Link>
            )}
          </div>
        </div>

        {/* Header & Tier Filter + View Mode */}
        <div className="mb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div>
            <p className="text-xs font-semibold text-orange-500 mb-1.5">
              Red Productiva &amp; Industrial Georreferenciada
            </p>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-slate-900 dark:text-white tracking-tight text-balance">
              Directorio B2B Multi-Perfil &amp; Mapa
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2 max-w-2xl text-sm">
              Localizá Empresas, Emprendimientos, Profesionales Autónomos y Servicios por corredor vial, cercanía GPS y tarifario.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start lg:self-end">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-white dark:bg-[#1A1625] p-1 rounded-xl border border-slate-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  viewMode === 'split'
                    ? 'bg-orange-500 text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" /> Mapa + Lista
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  viewMode === 'list'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <List className="w-3.5 h-3.5" /> Lista
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Grilla
              </button>
            </div>

            {/* Tier Switch */}
            <div className="flex flex-wrap items-center gap-1 bg-white dark:bg-[#1A1625] p-1 rounded-xl border border-slate-200 dark:border-white/10">
              <button
                onClick={() => setSelectedTier('all')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                  selectedTier === 'all'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Todos ({companies.length})
              </button>
              <button
                onClick={() => setSelectedTier('corporativo')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 whitespace-nowrap ${
                  selectedTier === 'corporativo'
                    ? 'bg-purple-600 text-white'
                    : 'text-purple-600 dark:text-purple-400 hover:bg-purple-500/10'
                }`}
              >
                <Crown className="w-3.5 h-3.5" /> Corp
              </button>
              <button
                onClick={() => setSelectedTier('pro')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 whitespace-nowrap ${
                  selectedTier === 'pro'
                    ? 'bg-orange-500 text-white'
                    : 'text-orange-600 dark:text-orange-400 hover:bg-orange-500/10'
                }`}
              >
                <Zap className="w-3.5 h-3.5" /> Pro
              </button>
              <button
                onClick={() => setSelectedTier('inicial')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                  selectedTier === 'inicial'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                Inicial / Autón.
              </button>
            </div>
          </div>
        </div>

        {/* Entity Type Segmented Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4">
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
                className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 ${
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

          <button
            type="button"
            onClick={() => setOnlyOfflineSaved((v) => !v)}
            className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 ml-auto ${
              onlyOfflineSaved
                ? 'bg-emerald-600 text-white'
                : 'bg-white dark:bg-[#1A1625] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:border-emerald-500/40'
            }`}
          >
            <BookmarkCheck className="w-3.5 h-3.5 shrink-0" />
            <span>Guardadas Offline ({offlineFavorites.length})</span>
          </button>
        </div>

        {/* Search, Facet Filters & GPS Proximity Bar */}
        <div className="bg-white dark:bg-[#1A1625] p-4 rounded-2xl border border-slate-200 dark:border-white/10 mb-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            <div className="md:col-span-5 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar empresa, servicio, ciudad, matrícula o ruta..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              />
            </div>

            <div className="md:col-span-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'Todas' ? 'Todos los Rubros' : cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <select
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none"
              >
                {PROVINCES.map((prov) => (
                  <option key={prov} value={prov}>
                    {prov === 'Todas' ? 'Todas Provincias' : prov}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="tier">Orden: Prioridad Plan</option>
                <option value="distance">Orden: Cercanía GPS (km)</option>
                <option value="verified">Orden: Verificadas KYB</option>
                <option value="name">Orden: Alfabético A-Z</option>
              </select>
            </div>
          </div>

          {/* Secondary Operational Controls: Corridor, Modality, KYB Toggle, GPS Hub & Tax Toggle */}
          <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex flex-wrap items-center gap-2.5 text-xs">
            <select
              value={selectedCorridor}
              onChange={(e) => setSelectedCorridor(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white"
            >
              <option value="all">Corredor Vial: Todos</option>
              <option value="RN3">RN 3 (Atlántico)</option>
              <option value="RN22">RN 22 (Alto Valle)</option>
              <option value="VACA_MUERTA">RN 7 / Añelo Vaca Muerta</option>
              <option value="RN40">RN 40 (Cordillera)</option>
              <option value="CENTRO_NORTE">Centro-Norte / Envío</option>
            </select>

            <select
              value={selectedModality}
              onChange={(e) => setSelectedModality(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white"
            >
              <option value="all">Modalidad: Todas</option>
              <option value="presencial">Presencial / Campo</option>
              <option value="remoto">Remoto / Digital</option>
              <option value="mixta">Mixta / Cobertura</option>
            </select>

            <button
              type="button"
              onClick={() => setOnlyVerified((v) => !v)}
              className={`min-h-[38px] px-3 py-1.5 rounded-xl font-bold inline-flex items-center gap-1.5 border transition-colors ${
                onlyVerified
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                  : 'bg-slate-50 dark:bg-[#110E17] border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Solo Verificadas KYB
            </button>

            <div className="flex items-center gap-1.5 ml-auto flex-wrap">
              <button
                type="button"
                onClick={handleRequestGps}
                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold inline-flex items-center gap-1.5 hover:opacity-90"
              >
                <LocateFixed className="w-3.5 h-3.5 text-orange-500" />
                {userCoords?.label === 'Mi GPS Actual' ? 'GPS Activo' : 'Usar mi GPS'}
              </button>

              <select
                value={
                  REFERENCE_HUBS.find((h) => h.label === userCoords?.label)?.id || 'custom'
                }
                onChange={(e) => {
                  const found = REFERENCE_HUBS.find((h) => h.id === e.target.value);
                  if (found) {
                    setUserCoords({ lat: found.lat, lng: found.lng, label: found.label });
                  }
                }}
                aria-label="Hub de referencia de distancia"
                className="px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-slate-200"
              >
                <option value="custom" disabled>
                  Desde Mi GPS Actual
                </option>
                {REFERENCE_HUBS.map((hub) => (
                  <option key={hub.id} value={hub.id}>
                    Desde: {hub.label}
                  </option>
                ))}
              </select>

              {isSubscribedMember && (
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#110E17] p-1 rounded-xl border border-slate-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setPriceMode('net')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                      priceMode === 'net'
                        ? 'bg-orange-500 text-white'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Neto s/IVA
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriceMode('gross')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                      priceMode === 'gross'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Final c/IVA
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        {activeChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-6 text-xs">
            <span className="text-slate-500 font-medium">Filtros activos:</span>
            {activeChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={chip.onClear}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-200/80 dark:bg-white/10 text-slate-800 dark:text-slate-200 font-semibold hover:bg-red-500/15 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                <span>{chip.label}</span>
                <X className="w-3 h-3" />
              </button>
            ))}
            <button
              type="button"
              onClick={resetFilters}
              className="text-orange-600 dark:text-orange-400 font-bold hover:underline ml-1"
            >
              Limpiar todo
            </button>
          </div>
        )}

        {/* Directory Content: Empty State OR Split / List / Grid */}
        {orderedCompanies.length === 0 ? (
          <div className="bg-white dark:bg-[#1A1625] rounded-2xl border border-slate-200 dark:border-white/10 p-12 text-center">
            <p className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Sin coincidencias para los filtros actuales
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              Probá limpiando los filtros o cambiando el corredor vial o tipo de entidad.
            </p>
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Restablecer filtros
            </button>
          </div>
        ) : (
          <div className={viewMode === 'split' ? 'grid grid-cols-1 lg:grid-cols-12 gap-6 items-start' : ''}>
            {/* Left Split Column: Interactive SVG Patagonia Map */}
            {viewMode === 'split' && (
              <div className="lg:col-span-5 lg:sticky lg:top-24">
                <PatagoniaDirectoryMap
                  companies={orderedCompanies.map((o) => o.company)}
                  selectedCompanyId={selectedMapCompanyId || orderedCompanies[0]?.company.id || null}
                  onSelectCompany={(company) => {
                    setSelectedMapCompanyId(company.id);
                    const el = document.getElementById(`dir-card-${company.id}`);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                  }}
                  userCoords={userCoords}
                  onRequestGps={handleRequestGps}
                  isMemberAuthorized={isSubscribedMember}
                />
              </div>
            )}

            {/* Right Split / Full Cards */}
            <div
              className={
                viewMode === 'split'
                  ? 'lg:col-span-7 space-y-4'
                  : viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
                  : 'space-y-4'
              }
            >
              {orderedCompanies.map(({ company, distKm }) => {
                const tierMeta = TIER_CONFIG[company.tier];
                const typeKey = company.entityType || 'empresa';
                const typeMeta = ENTITY_TYPE_CONFIG[typeKey];
                const TypeIcon = ENTITY_ICONS[typeKey] || Building2;
                const isSynced = syncedIds.includes(company.id);
                const isMapActive =
                  viewMode === 'split' &&
                  (selectedMapCompanyId === company.id ||
                    (!selectedMapCompanyId && orderedCompanies[0]?.company.id === company.id));
                const isSavedOffline = offlineSavedIds.has(company.id);
                const activeServiceItems = (company.serviceItems || []).filter(
                  (s) => s.active !== false
                );
                const leadService = activeServiceItems[0];

                return (
                  <div
                    key={company.id}
                    id={`dir-card-${company.id}`}
                    onClick={() => setSelectedMapCompanyId(company.id)}
                    className={`bg-white dark:bg-[#1A1625] rounded-2xl p-5 sm:p-6 border transition-all ${
                      isMapActive
                        ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                        : tierMeta.borderAccent
                    }`}
                  >
                    <div
                      className={`flex flex-col ${
                        viewMode === 'list' ? 'lg:flex-row lg:items-start justify-between' : ''
                      } gap-5`}
                    >
                      <div className="flex-1 min-w-0">
                        {/* Clean Unboxed Typographic Metadata with dot separators */}
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mb-2">
                          <span className="inline-flex items-center gap-1 font-bold text-orange-600 dark:text-orange-400">
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
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-orange-500" />
                            {company.city}, {company.province}
                          </span>
                          {userCoords && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono tabular-nums font-bold text-slate-800 dark:text-slate-200">
                                ~{distKm.toLocaleString('es-AR')} km
                              </span>
                            </>
                          )}
                        </div>

                        <div className="flex items-start justify-between gap-3">
                          <h2 className="text-lg sm:text-xl font-display font-bold text-slate-900 dark:text-white mb-1">
                            {company.name}
                          </h2>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleOfflineSave(company);
                            }}
                            title={isSavedOffline ? 'Quitar de offline' : 'Guardar ficha offline'}
                            className={`min-h-[38px] min-w-[38px] rounded-xl flex items-center justify-center border transition-colors shrink-0 ${
                              isSavedOffline
                                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                                : 'border-slate-200 dark:border-white/10 text-slate-400 hover:text-orange-500'
                            }`}
                          >
                            {isSavedOffline ? (
                              <BookmarkCheck className="w-4 h-4" />
                            ) : (
                              <Bookmark className="w-4 h-4" />
                            )}
                          </button>
                        </div>

                        {(company.serviceModality || company.credentialLabel) && (
                          <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-2">
                            {[company.credentialLabel, company.serviceModality]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                        )}

                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
                          {company.publicSummary}
                        </p>

                        {/* Service Tariff Preview */}
                        {leadService && isSubscribedMember && leadService.netPrice > 0 && (
                          <div className="mb-3 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="min-w-0">
                              <span className="text-[11px] font-semibold text-slate-400 block">
                                Tarifario de Referencia ({activeServiceItems.length} servicios)
                              </span>
                              <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                                {leadService.serviceName}
                              </span>
                            </div>
                            <div className="text-right font-mono tabular-nums">
                              {(() => {
                                const priceMeta = resolvePrimaryPriceLabel(leadService, priceMode);
                                return (
                                  <>
                                    <span className="font-bold text-slate-900 dark:text-white block">
                                      {priceMeta.primary}
                                    </span>
                                    <span className="text-[10px] text-slate-500">
                                      {priceMeta.secondary}
                                    </span>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1 font-medium text-slate-800 dark:text-slate-200">
                            <Route className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                            {company.adnComercial.corredorLogistico}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>
                            <strong className="text-slate-700 dark:text-slate-300">Ofrece:</strong>{' '}
                            {company.adnComercial.ofrece.slice(0, 2).join(', ') || 'Consultar ficha'}
                          </span>
                        </div>

                        {isSubscribedMember ? (
                          <div className="mt-3.5 pt-3.5 border-t border-slate-200 dark:border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                            <div>
                              <span className="text-[11px] font-semibold text-slate-400 block">
                                CUIT &amp; Contacto CRM
                              </span>
                              <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                                {company.cuit || 'Registrado'}
                              </span>
                              <span className="block text-[11px] text-slate-500">
                                {company.contactName}
                              </span>
                            </div>
                            <div>
                              <span className="text-[11px] font-semibold text-slate-400 block">
                                Canales Directos
                              </span>
                              <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1 truncate">
                                <Mail className="w-3 h-3 text-orange-500 shrink-0" />
                                {company.email}
                              </span>
                              <span className="font-mono tabular-nums text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                <Phone className="w-3 h-3 text-emerald-500 shrink-0" />
                                {company.phone || 'Ver en ficha'}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                            <span className="flex items-center gap-1.5 font-mono tabular-nums">
                              <Lock className="w-3.5 h-3.5 text-orange-500" />
                              CUIT, GPS exacto y tarifas: Solo Miembros
                            </span>
                            <Link
                              to="/planes"
                              className="font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 whitespace-nowrap"
                            >
                              Activar Acceso <ArrowUpRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div
                        className={
                          viewMode === 'list'
                            ? 'w-full lg:w-56 shrink-0 flex flex-col gap-2 justify-center border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-white/5 pt-4 lg:pt-0 lg:pl-5'
                            : 'grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-100 dark:border-white/5'
                        }
                      >
                        {isSubscribedMember ? (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSyncCRM(company);
                              }}
                              className={`min-h-[42px] px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
                                isSynced
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                  : 'bg-purple-600 hover:bg-purple-700 text-white'
                              }`}
                            >
                              {isSynced ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5" /> En CRM
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3.5 h-3.5" /> ARN IA
                                </>
                              )}
                            </button>

                            <Link
                              to="/chat"
                              onClick={(e) => e.stopPropagation()}
                              className="min-h-[42px] px-3 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
                            >
                              <MessageSquare className="w-3.5 h-3.5" /> Chat B2B
                            </Link>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMobileSheetCompany(company);
                              }}
                              className="min-h-[42px] px-3 py-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
                            >
                              <Smartphone className="w-3.5 h-3.5" /> Móvil &amp; GPS
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCompanyModal(company);
                              }}
                              className="min-h-[42px] px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors whitespace-nowrap"
                            >
                              Ver Legajo
                            </button>
                          </>
                        ) : (
                          <>
                            <Link
                              to="/planes"
                              className="col-span-2 min-h-[42px] px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 text-xs font-bold transition-opacity flex items-center justify-center gap-2 whitespace-nowrap"
                            >
                              <Lock className="w-3.5 h-3.5 text-orange-500" />
                              Desbloquear Contacto &amp; GPS
                            </Link>
                            <Link
                              to={`/logistica?tab=rutas&origin=${encodeURIComponent(
                                company.adnComercial.ciudadBase
                              )}&dest=${encodeURIComponent('Añelo (Hub Vaca Muerta)')}`}
                              className="col-span-2 min-h-[42px] px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
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
          </div>
        )}
      </div>

      {/* Mobile Downloads & GPS Coordinates Drawer / Modal */}
      <AnimatePresence>
        {mobileSheetCompany && (
          <div className="fixed inset-0 z-[115] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
              onClick={() => setMobileSheetCompany(null)}
            />
            <motion.div
              initial={{ opacity: 0, y: 36 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 36 }}
              className="relative w-full sm:max-w-lg bg-white dark:bg-[#1A1625] rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-white/10 p-6 shadow-2xl z-10 space-y-5"
            >
              <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto sm:hidden" />

              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    Descarga Móvil &amp; Campo Offline
                  </p>
                  <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white">
                    {mobileSheetCompany.name}
                  </h3>
                  <p className="text-xs font-mono tabular-nums text-slate-500 mt-0.5">
                    GPS: {Number(mobileSheetCompany.adnComercial.lat).toFixed(5)},{' '}
                    {Number(mobileSheetCompany.adnComercial.lng).toFixed(5)} ·{' '}
                    {mobileSheetCompany.city}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileSheetCompany(null)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Hidden/Small QR Canvas for PDF & Scan */}
              <div className="flex items-center gap-4 p-3.5 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10">
                <div ref={qrCanvasRef} className="bg-white p-1.5 rounded-lg shrink-0">
                  <QRCodeCanvas
                    value={getNavigationDeepLinks(mobileSheetCompany).googleMaps}
                    size={76}
                    includeMargin={false}
                  />
                </div>
                <div className="text-xs space-y-1">
                  <p className="font-bold text-slate-900 dark:text-white">
                    QR de Ubicación Directa
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                    Escaneá desde otro teléfono en planta para abrir las coordenadas GPS sin tipear.
                  </p>
                </div>
              </div>

              {/* 44px Touch Action Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    triggerTextFileDownload(
                      `${mobileSheetCompany.id}.vcf`,
                      buildCompanyVCard(mobileSheetCompany),
                      'text/vcard'
                    );
                    showToast('Tarjeta .vcf descargada para agendar en el celular.');
                  }}
                  className="min-h-[46px] px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center justify-center gap-2"
                >
                  <Smartphone className="w-4 h-4 shrink-0" />
                  Agendar Contacto (.vcf)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerTextFileDownload(
                      `${mobileSheetCompany.id}.gpx`,
                      buildCompanyGpx(mobileSheetCompany),
                      'application/gpx+xml'
                    );
                    showToast('Waypoint .gpx descargado para Garmin / OsmAnd.');
                  }}
                  className="min-h-[46px] px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 text-xs font-bold flex items-center justify-center gap-2"
                >
                  <Compass className="w-4 h-4 shrink-0" />
                  Waypoint GPS (.gpx)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerTextFileDownload(
                      `${mobileSheetCompany.id}.geojson`,
                      buildCompanyGeoJson(mobileSheetCompany),
                      'application/geo+json'
                    );
                    showToast('GeoJSON de ubicación descargado.');
                  }}
                  className="min-h-[46px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2"
                >
                  <MapPin className="w-4 h-4 text-purple-500 shrink-0" />
                  Archivo GeoJSON
                </button>

                <button
                  type="button"
                  onClick={() => handleExportPdfWithQr(mobileSheetCompany)}
                  className="min-h-[46px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2"
                >
                  <FileDown className="w-4 h-4 text-orange-500 shrink-0" />
                  Legajo PDF + QR
                </button>
              </div>

              {/* External Map Navigation Links */}
              {(() => {
                const links = getNavigationDeepLinks(mobileSheetCompany);
                return (
                  <div className="pt-3 border-t border-slate-100 dark:border-white/10 space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Navigation className="w-3.5 h-3.5 text-emerald-500" /> Abrir en Navegador GPS
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={links.googleMaps}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-white/5 text-xs font-semibold text-slate-800 dark:text-slate-200 inline-flex items-center gap-1 hover:border-orange-500"
                      >
                        Google Maps <ExternalLink className="w-3 h-3" />
                      </a>
                      <a
                        href={links.waze}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-white/5 text-xs font-semibold text-slate-800 dark:text-slate-200 inline-flex items-center gap-1"
                      >
                        Waze <ExternalLink className="w-3 h-3" />
                      </a>
                      <a
                        href={links.appleMaps}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-white/5 text-xs font-semibold text-slate-800 dark:text-slate-200 inline-flex items-center gap-1"
                      >
                        Apple Maps <ExternalLink className="w-3 h-3" />
                      </a>
                      <a
                        href={links.openStreetMap}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-white/5 text-xs font-semibold text-slate-800 dark:text-slate-200 inline-flex items-center gap-1"
                      >
                        OpenStreetMap <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#1A1625] rounded-2xl border border-slate-200 dark:border-white/10 p-6 md:p-8 shadow-2xl z-10"
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
                    CUIT / CUIL: {selectedCompanyModal.cuit} · GPS:{' '}
                    {Number(selectedCompanyModal.adnComercial.lat).toFixed(4)},{' '}
                    {Number(selectedCompanyModal.adnComercial.lng).toFixed(4)}
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

                {/* Company Service Tariff Breakdown inside Modal */}
                {isSubscribedMember &&
                  selectedCompanyModal.serviceItems &&
                  selectedCompanyModal.serviceItems.length > 0 && (
                    <div className="bg-slate-50 dark:bg-[#110E17] p-4 rounded-xl border border-slate-200 dark:border-white/10 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Tarifario de Servicios
                        </span>
                        <span className="text-[11px] font-semibold text-orange-500">
                          {priceMode === 'gross' ? 'Precios con IVA incluido' : 'Precios Netos (+ IVA)'}
                        </span>
                      </div>
                      <div className="divide-y divide-slate-200 dark:divide-white/10 text-xs">
                        {selectedCompanyModal.serviceItems
                          .filter((s) => s.active !== false)
                          .map((srv, idx) => {
                            const p = resolvePrimaryPriceLabel(srv, priceMode);
                            return (
                              <div
                                key={srv.id ?? idx}
                                className="py-2 flex items-center justify-between gap-3"
                              >
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                  {srv.serviceName}
                                </span>
                                <div className="text-right font-mono tabular-nums shrink-0">
                                  <span className="font-bold text-slate-900 dark:text-white block">
                                    {p.primary}
                                  </span>
                                  <span className="text-[10px] text-slate-500">{p.secondary}</span>
                                </div>
                              </div>
                            );
                          })}
                      </div>
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

              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-white/10 flex flex-wrap justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    const target = selectedCompanyModal;
                    setSelectedCompanyModal(null);
                    setMobileSheetCompany(target);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 whitespace-nowrap"
                >
                  <Smartphone className="w-4 h-4" /> Descargar al Celular (.vcf / .gpx)
                </button>
                <button
                  type="button"
                  onClick={() => handleExportPdfWithQr(selectedCompanyModal)}
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
                  <Sparkles className="w-4 h-4" /> Enviar a ARN IA &amp; CRM
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sync / Download Toast */}
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
              <p className="font-bold text-white mb-0.5">Directorio B2B xPatagonia</p>
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
