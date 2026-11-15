import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  CheckCircle2,
  XCircle,
  MapPin,
  Calculator,
} from 'lucide-react';
import { auth } from '../../lib/db';
import { getApiUrl } from '../../lib/apiConfig';
import type { B2BCompanyRecord, DirectoryEntityType, SubscriptionTier } from '../../lib/b2bDirectoryData';
import {
  ALLOWED_TAX_RATES,
  CompanyServiceItem,
  TaxDisplayMode,
  calculateTaxBreakdownFromGross,
  calculateTaxBreakdownFromNet,
  formatServicePrice,
} from '../../lib/taxPricing';

interface DraftServiceRow {
  serviceName: string;
  category: string;
  unitLabel: string;
  currency: 'ARS' | 'USD';
  netPrice: string;
  grossPrice: string;
  taxRatePercent: number;
  active: boolean;
}

const EMPTY_NEW_SERVICE: DraftServiceRow = {
  serviceName: '',
  category: 'Servicios Industriales',
  unitLabel: 'Servicio',
  currency: 'ARS',
  netPrice: '',
  grossPrice: '',
  taxRatePercent: 21,
  active: true,
};

export default function AdminCompanyServicesTable({
  onNotify,
}: {
  onNotify: (type: 'ok' | 'err', text: string) => void;
}) {
  const [companies, setCompanies] = useState<B2BCompanyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState<'all' | DirectoryEntityType>('all');
  const [verifiedFilter, setVerifiedFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [globalTaxView, setGlobalTaxView] = useState<TaxDisplayMode>('net');
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savingServiceId, setSavingServiceId] = useState<string | null>(null);

  // Per-company metadata draft edits
  const [companyDrafts, setCompanyDrafts] = useState<
    Record<
      string,
      {
        entityType: DirectoryEntityType;
        tier: SubscriptionTier;
        verified: boolean;
        active: boolean;
        serviceModality: string;
        corridor: string;
        lat: string;
        lng: string;
        priceDisplayMode: TaxDisplayMode;
        defaultTaxRatePercent: number;
      }
    >
  >({});

  // Per-service inline drafts keyed by `${companyKey}:${serviceId}`
  const [serviceDrafts, setServiceDrafts] = useState<Record<string, DraftServiceRow>>({});
  // New service inline row keyed by companyKey
  const [newServiceDrafts, setNewServiceDrafts] = useState<Record<string, DraftServiceRow>>({});

  const hydrateDrafts = (list: B2BCompanyRecord[]) => {
    const nextCompanyDrafts: typeof companyDrafts = {};
    const nextServiceDrafts: typeof serviceDrafts = {};

    for (const c of list) {
      nextCompanyDrafts[c.id] = {
        entityType: (c.entityType || 'empresa') as DirectoryEntityType,
        tier: (c.tier || 'inicial') as SubscriptionTier,
        verified: Boolean(c.verified),
        active: c.active !== false,
        serviceModality: c.serviceModality || '',
        corridor: c.adnComercial?.corredorLogistico || 'Patagonia Sur',
        lat: String(c.adnComercial?.lat ?? -45.8641),
        lng: String(c.adnComercial?.lng ?? -67.4966),
        priceDisplayMode: c.priceDisplayMode || 'net',
        defaultTaxRatePercent: c.defaultTaxRatePercent ?? 21,
      };

      for (const s of c.serviceItems || []) {
        const key = `${c.id}:${s.id}`;
        nextServiceDrafts[key] = {
          serviceName: s.serviceName,
          category: s.category,
          unitLabel: s.unitLabel,
          currency: s.currency === 'USD' ? 'USD' : 'ARS',
          netPrice: String(s.netPrice),
          grossPrice: String(s.grossPrice),
          taxRatePercent: s.taxRatePercent,
          active: s.active !== false,
        };
      }
    }

    setCompanyDrafts(nextCompanyDrafts);
    setServiceDrafts(nextServiceDrafts);
  };

  const loadControlData = async () => {
    setLoading(true);
    try {
      const token = await auth.getToken();
      const res = await fetch(`${getApiUrl()}/api/admin/directory-control`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('No se pudo cargar la tabla de control');
      const data = await res.json();
      if (Array.isArray(data.companies)) {
        setCompanies(data.companies);
        hydrateDrafts(data.companies);
        // Auto-expand first company for immediate clarity
        if (data.companies[0] && Object.keys(expandedKeys).length === 0) {
          setExpandedKeys({ [data.companies[0].id]: true });
        }
      }
    } catch (err: any) {
      onNotify('err', err?.message || 'Error cargando tabla de control comercial');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadControlData();
  }, []);

  const toggleExpand = (companyKey: string) => {
    setExpandedKeys((prev) => ({ ...prev, [companyKey]: !prev[companyKey] }));
  };

  const handleBulkTaxMode = async (mode: TaxDisplayMode) => {
    setGlobalTaxView(mode);
    try {
      const token = await auth.getToken();
      const res = await fetch(`${getApiUrl()}/api/admin/directory-control/bulk-tax-mode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ mode }),
      });
      if (res.ok) {
        setCompanyDrafts((prev) => {
          const next = { ...prev };
          for (const k of Object.keys(next)) {
            next[k] = { ...next[k], priceDisplayMode: mode };
          }
          return next;
        });
        onNotify(
          'ok',
          mode === 'net'
            ? 'Visualización comercial fijada en Neto (sin impuestos).'
            : mode === 'gross'
            ? 'Visualización comercial fijada en Final (IVA incluido).'
            : 'Visualización comercial fijada en Comparativa Dual (Neto + IVA).'
        );
      }
    } catch {
      // Visual view still updates smoothly
    }
  };

  const handleSaveCompanyMeta = async (companyKey: string) => {
    const draft = companyDrafts[companyKey];
    if (!draft) return;
    setSavingKey(companyKey);
    try {
      const token = await auth.getToken();
      const res = await fetch(
        `${getApiUrl()}/api/admin/directory-control/${encodeURIComponent(companyKey)}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            entityType: draft.entityType,
            tier: draft.tier,
            verified: draft.verified,
            active: draft.active,
            serviceModality: draft.serviceModality,
            corridor: draft.corridor,
            lat: Number(draft.lat),
            lng: Number(draft.lng),
            priceDisplayMode: draft.priceDisplayMode,
            defaultTaxRatePercent: draft.defaultTaxRatePercent,
          }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Error guardando ficha');
      if (data.company) {
        setCompanies((prev) => prev.map((c) => (c.id === companyKey ? data.company : c)));
      }
      onNotify('ok', 'Configuración fiscal, ubicación y estado de empresa guardados.');
    } catch (err: any) {
      onNotify('err', err?.message || 'Error al guardar empresa');
    } finally {
      setSavingKey(null);
    }
  };

  const updateServiceDraftNet = (
    draftKey: string,
    nextNetRaw: string,
    taxRatePercent: number,
    isNew = false
  ) => {
    const numNet = Number(nextNetRaw) || 0;
    const calc = calculateTaxBreakdownFromNet(numNet, taxRatePercent);
    const updater = (prev: Record<string, DraftServiceRow>) => ({
      ...prev,
      [draftKey]: {
        ...(prev[draftKey] || EMPTY_NEW_SERVICE),
        netPrice: nextNetRaw,
        taxRatePercent,
        grossPrice: nextNetRaw === '' ? '' : String(calc.grossPrice),
      },
    });
    if (isNew) setNewServiceDrafts(updater);
    else setServiceDrafts(updater);
  };

  const updateServiceDraftGross = (
    draftKey: string,
    nextGrossRaw: string,
    taxRatePercent: number,
    isNew = false
  ) => {
    const numGross = Number(nextGrossRaw) || 0;
    const calc = calculateTaxBreakdownFromGross(numGross, taxRatePercent);
    const updater = (prev: Record<string, DraftServiceRow>) => ({
      ...prev,
      [draftKey]: {
        ...(prev[draftKey] || EMPTY_NEW_SERVICE),
        grossPrice: nextGrossRaw,
        taxRatePercent,
        netPrice: nextGrossRaw === '' ? '' : String(calc.netPrice),
      },
    });
    if (isNew) setNewServiceDrafts(updater);
    else setServiceDrafts(updater);
  };

  const updateServiceDraftTaxRate = (draftKey: string, nextRate: number, isNew = false) => {
    const updater = (prev: Record<string, DraftServiceRow>) => {
      const current = prev[draftKey] || EMPTY_NEW_SERVICE;
      const calc = calculateTaxBreakdownFromNet(Number(current.netPrice) || 0, nextRate);
      return {
        ...prev,
        [draftKey]: {
          ...current,
          taxRatePercent: nextRate,
          grossPrice: current.netPrice === '' ? '' : String(calc.grossPrice),
        },
      };
    };
    if (isNew) setNewServiceDrafts(updater);
    else setServiceDrafts(updater);
  };

  const handleSaveExistingService = async (companyKey: string, item: CompanyServiceItem) => {
    const draftKey = `${companyKey}:${item.id}`;
    const draft = serviceDrafts[draftKey];
    if (!draft || !draft.serviceName.trim()) {
      onNotify('err', 'Ingresá el nombre del servicio.');
      return;
    }

    setSavingServiceId(draftKey);
    try {
      const token = await auth.getToken();
      const companyTaxMode = companyDrafts[companyKey]?.priceDisplayMode || globalTaxView;
      const isSeedItem = !item.id || item.id < 0;
      const url = isSeedItem
        ? `${getApiUrl()}/api/admin/directory-control/${encodeURIComponent(companyKey)}/services`
        : `${getApiUrl()}/api/admin/directory-control/services/${item.id}`;
      const method = isSeedItem ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          serviceName: draft.serviceName,
          category: draft.category,
          unitLabel: draft.unitLabel,
          currency: draft.currency,
          netPrice: Number(draft.netPrice) || 0,
          taxRatePercent: draft.taxRatePercent,
          taxDisplayMode: companyTaxMode,
          active: draft.active,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Error guardando tarifa');
      onNotify('ok', `Servicio "${draft.serviceName}" guardado en tarifario.`);
      await loadControlData();
    } catch (err: any) {
      onNotify('err', err?.message || 'Error al guardar servicio');
    } finally {
      setSavingServiceId(null);
    }
  };

  const handleAddService = async (companyKey: string) => {
    const draft = newServiceDrafts[companyKey];
    if (!draft || !draft.serviceName.trim()) {
      onNotify('err', 'Ingresá el nombre del nuevo servicio.');
      return;
    }

    setSavingServiceId(`new:${companyKey}`);
    try {
      const token = await auth.getToken();
      const companyTaxMode = companyDrafts[companyKey]?.priceDisplayMode || globalTaxView;
      const res = await fetch(
        `${getApiUrl()}/api/admin/directory-control/${encodeURIComponent(companyKey)}/services`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            serviceName: draft.serviceName,
            category: draft.category || 'Servicios',
            unitLabel: draft.unitLabel || 'Servicio',
            currency: draft.currency || 'ARS',
            netPrice: Number(draft.netPrice) || 0,
            taxRatePercent: draft.taxRatePercent,
            taxDisplayMode: companyTaxMode,
            active: true,
          }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'No se pudo agregar servicio');
      setNewServiceDrafts((prev) => ({
        ...prev,
        [companyKey]: { ...EMPTY_NEW_SERVICE },
      }));
      onNotify('ok', `Servicio "${draft.serviceName}" agregado con éxito.`);
      await loadControlData();
    } catch (err: any) {
      onNotify('err', err?.message || 'Error agregando servicio');
    } finally {
      setSavingServiceId(null);
    }
  };

  const handleDeleteService = async (companyKey: string, serviceId?: number) => {
    if (!serviceId || serviceId < 0) return;
    setSavingServiceId(`del:${companyKey}:${serviceId}`);
    try {
      const token = await auth.getToken();
      const res = await fetch(
        `${getApiUrl()}/api/admin/directory-control/services/${serviceId}`,
        {
          method: 'DELETE',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      if (!res.ok) throw new Error('Error eliminando servicio');
      onNotify('ok', 'Ítem tarifario eliminado.');
      await loadControlData();
    } catch (err: any) {
      onNotify('err', err?.message || 'No se pudo eliminar');
    } finally {
      setSavingServiceId(null);
    }
  };

  const filteredCompanies = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return companies.filter((c) => {
      const matchEntity = entityFilter === 'all' || c.entityType === entityFilter;
      const matchVer =
        verifiedFilter === 'all' ||
        (verifiedFilter === 'verified' ? c.verified : !c.verified);
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        (c.serviceItems || []).some((s) => s.serviceName.toLowerCase().includes(q));
      return matchEntity && matchVer && matchSearch;
    });
  }, [companies, searchQuery, entityFilter, verifiedFilter]);

  const totalServicesCount = useMemo(
    () => companies.reduce((acc, c) => acc + (c.serviceItems?.length || 0), 0),
    [companies]
  );
  const verifiedCount = useMemo(
    () => companies.filter((c) => c.verified).length,
    [companies]
  );

  return (
    <div className="space-y-5">
      {/* Compact KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#1A1625] border border-slate-200 dark:border-white/10 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">Actores en Tabla de Control</p>
          <p className="text-2xl font-mono font-bold tabular-nums text-slate-900 dark:text-white mt-1">
            {companies.length}
          </p>
        </div>
        <div className="bg-white dark:bg-[#1A1625] border border-slate-200 dark:border-white/10 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">Servicios Tarifados (Neto + IVA)</p>
          <p className="text-2xl font-mono font-bold tabular-nums text-orange-600 dark:text-orange-400 mt-1">
            {totalServicesCount}
          </p>
        </div>
        <div className="bg-white dark:bg-[#1A1625] border border-slate-200 dark:border-white/10 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">Verificadas KYB Activas</p>
          <p className="text-2xl font-mono font-bold tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
            {verifiedCount}
          </p>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="bg-white dark:bg-[#1A1625] border border-slate-200 dark:border-white/10 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calculator className="w-5 h-5 text-orange-500" />
              Tabla de Control: Empresas, Servicios y Precios (Con / Sin Impuestos)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Expandí cualquier empresa o profesional para editar su grilla de servicios, alícuotas de IVA y alternar entre Precio Neto o Final con impuestos.
            </p>
          </div>

          {/* Global Tax Display Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#110E17] p-1 rounded-xl border border-slate-200 dark:border-white/10 self-start">
            {(
              [
                { id: 'net', label: 'Sin Impuestos (Neto)' },
                { id: 'gross', label: 'Con IVA Incluido' },
                { id: 'both', label: 'Comparativa Dual' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleBulkTaxMode(opt.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                  globalTaxView === opt.id
                    ? 'bg-orange-500 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search & Filters */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar empresa, profesional, ciudad o nombre de servicio..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
            />
          </div>
          <div className="md:col-span-3">
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white"
            >
              <option value="all">Todas las Entidades</option>
              <option value="empresa">Empresas</option>
              <option value="emprendimiento">Emprendimientos</option>
              <option value="profesional">Profesionales Autónomos</option>
              <option value="servicio">Servicios Industriales</option>
            </select>
          </div>
          <div className="md:col-span-3">
            <select
              value={verifiedFilter}
              onChange={(e) => setVerifiedFilter(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white"
            >
              <option value="all">Todo Estado KYB</option>
              <option value="verified">Solo Verificadas KYB</option>
              <option value="unverified">Pendientes KYB</option>
            </select>
          </div>
        </div>

        {/* Main High-Density Data Table */}
        {loading ? (
          <div className="py-10 text-center text-xs text-slate-500">Cargando tabla de control...</div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 dark:border-white/10 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-[#110E17] text-slate-500 border-b border-slate-200 dark:border-white/10">
                <tr>
                  <th className="px-3 py-3 w-8"></th>
                  <th className="px-3 py-3 font-semibold">Empresa / Profesional</th>
                  <th className="px-3 py-3 font-semibold">Entidad & Plan</th>
                  <th className="px-3 py-3 font-semibold">Servicios</th>
                  <th className="px-3 py-3 font-semibold text-right">Referencia Tarifaria</th>
                  <th className="px-3 py-3 font-semibold text-center">Modo Fiscal</th>
                  <th className="px-3 py-3 font-semibold text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                {filteredCompanies.map((company) => {
                  const isExpanded = Boolean(expandedKeys[company.id]);
                  const draft = companyDrafts[company.id];
                  const items = company.serviceItems || [];
                  const activeMode: TaxDisplayMode =
                    draft?.priceDisplayMode || company.priceDisplayMode || globalTaxView;
                  const firstActiveItem = items.find((i) => i.active !== false) || items[0];
                  const newRowDraft = newServiceDrafts[company.id] || EMPTY_NEW_SERVICE;

                  const refPriceText = firstActiveItem
                    ? activeMode === 'gross'
                      ? `${formatServicePrice(firstActiveItem.grossPrice, firstActiveItem.currency)} c/IVA`
                      : `${formatServicePrice(firstActiveItem.netPrice, firstActiveItem.currency)} Neto`
                    : 'Sin tarifario';

                  return (
                    <Fragment key={company.id}>
                      <tr
                        onClick={() => toggleExpand(company.id)}
                        className={`cursor-pointer transition-colors ${
                          isExpanded
                            ? 'bg-orange-50/70 dark:bg-orange-500/5'
                            : 'hover:bg-slate-50 dark:hover:bg-white/[0.03]'
                        }`}
                      >
                        <td className="px-3 py-3 text-slate-400">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-orange-500" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{company.name}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <MapPin className="w-3 h-3 text-orange-500 shrink-0" />
                            <span>
                              {company.city}, {company.province} · {company.adnComercial.corredorLogistico}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize block">
                            {draft?.entityType || company.entityType}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {company.tierLabel}
                          </span>
                        </td>
                        <td className="px-3 py-3 font-mono tabular-nums font-semibold text-slate-700 dark:text-slate-300">
                          {items.length} ítems
                        </td>
                        <td className="px-3 py-3 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          {refPriceText}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="font-semibold text-purple-600 dark:text-purple-400 uppercase text-[10px]">
                            {activeMode === 'gross'
                              ? 'IVA Incl.'
                              : activeMode === 'both'
                              ? 'Dual'
                              : 'Neto s/IVA'}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right whitespace-nowrap">
                          {draft?.verified ?? company.verified ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                              <ShieldCheck className="w-3.5 h-3.5" /> Verificada
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Estándar</span>
                          )}
                        </td>
                      </tr>

                      {/* Expanded Row: Company Control + Per-Service Pricing Table */}
                      {isExpanded && draft && (
                        <tr key={`${company.id}-detail`} className="bg-slate-50/80 dark:bg-[#110E17]/80">
                          <td colSpan={7} className="p-4 sm:p-5 border-t border-slate-200 dark:border-white/10">
                            <div className="space-y-4">
                              {/* Master Company Parameters */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 bg-white dark:bg-[#1A1625] p-3.5 rounded-xl border border-slate-200 dark:border-white/10">
                                <div>
                                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                                    Entidad
                                  </label>
                                  <select
                                    value={draft.entityType}
                                    onChange={(e) =>
                                      setCompanyDrafts((prev) => ({
                                        ...prev,
                                        [company.id]: {
                                          ...draft,
                                          entityType: e.target.value as DirectoryEntityType,
                                        },
                                      }))
                                    }
                                    className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white"
                                  >
                                    <option value="empresa">Empresa</option>
                                    <option value="emprendimiento">Emprendimiento</option>
                                    <option value="profesional">Profesional</option>
                                    <option value="servicio">Servicio</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                                    Plan
                                  </label>
                                  <select
                                    value={draft.tier}
                                    onChange={(e) =>
                                      setCompanyDrafts((prev) => ({
                                        ...prev,
                                        [company.id]: {
                                          ...draft,
                                          tier: e.target.value as SubscriptionTier,
                                        },
                                      }))
                                    }
                                    className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white"
                                  >
                                    <option value="corporativo">Corporativo</option>
                                    <option value="pro">Pro Industrial</option>
                                    <option value="inicial">Inicial / Autónomo</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                                    Publicar Precios
                                  </label>
                                  <select
                                    value={draft.priceDisplayMode}
                                    onChange={(e) =>
                                      setCompanyDrafts((prev) => ({
                                        ...prev,
                                        [company.id]: {
                                          ...draft,
                                          priceDisplayMode: e.target.value as TaxDisplayMode,
                                        },
                                      }))
                                    }
                                    className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white"
                                  >
                                    <option value="net">Neto s/IVA</option>
                                    <option value="gross">Final c/IVA</option>
                                    <option value="both">Dual (Ambos)</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                                    Corredor Vial
                                  </label>
                                  <input
                                    type="text"
                                    value={draft.corridor}
                                    onChange={(e) =>
                                      setCompanyDrafts((prev) => ({
                                        ...prev,
                                        [company.id]: { ...draft, corridor: e.target.value },
                                      }))
                                    }
                                    className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                                    Latitud GPS
                                  </label>
                                  <input
                                    type="text"
                                    value={draft.lat}
                                    onChange={(e) =>
                                      setCompanyDrafts((prev) => ({
                                        ...prev,
                                        [company.id]: { ...draft, lat: e.target.value },
                                      }))
                                    }
                                    className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10 text-xs font-mono tabular-nums text-slate-900 dark:text-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                                    Longitud GPS
                                  </label>
                                  <input
                                    type="text"
                                    value={draft.lng}
                                    onChange={(e) =>
                                      setCompanyDrafts((prev) => ({
                                        ...prev,
                                        [company.id]: { ...draft, lng: e.target.value },
                                      }))
                                    }
                                    className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10 text-xs font-mono tabular-nums text-slate-900 dark:text-white"
                                  />
                                </div>
                                <div className="flex flex-col justify-end gap-1.5">
                                  <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={draft.verified}
                                      onChange={(e) =>
                                        setCompanyDrafts((prev) => ({
                                          ...prev,
                                          [company.id]: { ...draft, verified: e.target.checked },
                                        }))
                                      }
                                      className="rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                                    />
                                    KYB Verificada
                                  </label>
                                  <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={draft.active}
                                      onChange={(e) =>
                                        setCompanyDrafts((prev) => ({
                                          ...prev,
                                          [company.id]: { ...draft, active: e.target.checked },
                                        }))
                                      }
                                      className="rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                                    />
                                    Visible
                                  </label>
                                </div>
                                <div className="flex items-end">
                                  <button
                                    type="button"
                                    disabled={savingKey === company.id}
                                    onClick={() => handleSaveCompanyMeta(company.id)}
                                    className="w-full py-2 px-3 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold flex items-center justify-center gap-1.5 hover:opacity-90 disabled:opacity-50"
                                  >
                                    <Save className="w-3.5 h-3.5" />
                                    {savingKey === company.id ? 'Guardando...' : 'Guardar Ficha'}
                                  </button>
                                </div>
                              </div>

                              {/* Per-Service Pricing Table */}
                              <div className="bg-white dark:bg-[#1A1625] rounded-xl border border-slate-200 dark:border-white/10 overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                  <thead className="bg-slate-50 dark:bg-[#110E17] text-slate-500 border-b border-slate-200 dark:border-white/10">
                                    <tr>
                                      <th className="px-3 py-2.5 font-semibold">Servicio Asignado</th>
                                      <th className="px-3 py-2.5 font-semibold">Unidad</th>
                                      <th className="px-3 py-2.5 font-semibold">Moneda</th>
                                      <th className="px-3 py-2.5 font-semibold text-right">
                                        Precio Neto (sin IVA)
                                      </th>
                                      <th className="px-3 py-2.5 font-semibold">IVA %</th>
                                      <th className="px-3 py-2.5 font-semibold text-right">
                                        IVA Calculado
                                      </th>
                                      <th className="px-3 py-2.5 font-semibold text-right">
                                        Precio Final (c/ IVA)
                                      </th>
                                      <th className="px-3 py-2.5 font-semibold text-center">Estado</th>
                                      <th className="px-3 py-2.5 font-semibold text-right">Acciones</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                    {items.map((srv) => {
                                      const dKey = `${company.id}:${srv.id}`;
                                      const rowDraft = serviceDrafts[dKey] || {
                                        serviceName: srv.serviceName,
                                        category: srv.category,
                                        unitLabel: srv.unitLabel,
                                        currency: srv.currency,
                                        netPrice: String(srv.netPrice),
                                        grossPrice: String(srv.grossPrice),
                                        taxRatePercent: srv.taxRatePercent,
                                        active: srv.active,
                                      };
                                      const liveBreakdown = calculateTaxBreakdownFromNet(
                                        Number(rowDraft.netPrice) || 0,
                                        rowDraft.taxRatePercent
                                      );

                                      return (
                                        <tr key={dKey}>
                                          <td className="px-3 py-2 min-w-[200px]">
                                            <input
                                              type="text"
                                              value={rowDraft.serviceName}
                                              onChange={(e) =>
                                                setServiceDrafts((prev) => ({
                                                  ...prev,
                                                  [dKey]: { ...rowDraft, serviceName: e.target.value },
                                                }))
                                              }
                                              className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white"
                                            />
                                          </td>
                                          <td className="px-3 py-2 w-24">
                                            <input
                                              type="text"
                                              value={rowDraft.unitLabel}
                                              onChange={(e) =>
                                                setServiceDrafts((prev) => ({
                                                  ...prev,
                                                  [dKey]: { ...rowDraft, unitLabel: e.target.value },
                                                }))
                                              }
                                              className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white"
                                            />
                                          </td>
                                          <td className="px-3 py-2 w-20">
                                            <select
                                              value={rowDraft.currency}
                                              onChange={(e) =>
                                                setServiceDrafts((prev) => ({
                                                  ...prev,
                                                  [dKey]: {
                                                    ...rowDraft,
                                                    currency: e.target.value as 'ARS' | 'USD',
                                                  },
                                                }))
                                              }
                                              className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white"
                                            >
                                              <option value="ARS">ARS</option>
                                              <option value="USD">USD</option>
                                            </select>
                                          </td>
                                          <td className="px-3 py-2 w-32">
                                            <input
                                              type="number"
                                              min="0"
                                              step="any"
                                              value={rowDraft.netPrice}
                                              onChange={(e) =>
                                                updateServiceDraftNet(
                                                  dKey,
                                                  e.target.value,
                                                  rowDraft.taxRatePercent,
                                                  false
                                                )
                                              }
                                              className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10 text-xs font-mono tabular-nums text-right text-slate-900 dark:text-white"
                                            />
                                          </td>
                                          <td className="px-3 py-2 w-24">
                                            <select
                                              value={rowDraft.taxRatePercent}
                                              onChange={(e) =>
                                                updateServiceDraftTaxRate(
                                                  dKey,
                                                  Number(e.target.value),
                                                  false
                                                )
                                              }
                                              className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10 text-xs font-mono tabular-nums text-slate-900 dark:text-white"
                                            >
                                              {ALLOWED_TAX_RATES.map((rate) => (
                                                <option key={rate} value={rate}>
                                                  {rate === 0 ? '0% Ex.' : `${rate}%`}
                                                </option>
                                              ))}
                                            </select>
                                          </td>
                                          <td className="px-3 py-2 text-right font-mono tabular-nums text-slate-500 whitespace-nowrap">
                                            {formatServicePrice(
                                              liveBreakdown.taxAmount,
                                              rowDraft.currency
                                            )}
                                          </td>
                                          <td className="px-3 py-2 w-32">
                                            <input
                                              type="number"
                                              min="0"
                                              step="any"
                                              value={rowDraft.grossPrice}
                                              onChange={(e) =>
                                                updateServiceDraftGross(
                                                  dKey,
                                                  e.target.value,
                                                  rowDraft.taxRatePercent,
                                                  false
                                                )
                                              }
                                              className="w-full px-2 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono font-bold tabular-nums text-right text-emerald-700 dark:text-emerald-300"
                                            />
                                          </td>
                                          <td className="px-3 py-2 text-center">
                                            <button
                                              type="button"
                                              onClick={() =>
                                                setServiceDrafts((prev) => ({
                                                  ...prev,
                                                  [dKey]: { ...rowDraft, active: !rowDraft.active },
                                                }))
                                              }
                                              className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                                                rowDraft.active
                                                  ? 'text-emerald-600 dark:text-emerald-400'
                                                  : 'text-slate-400'
                                              }`}
                                            >
                                              {rowDraft.active ? (
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                              ) : (
                                                <XCircle className="w-3.5 h-3.5" />
                                              )}
                                              {rowDraft.active ? 'Activo' : 'Pausado'}
                                            </button>
                                          </td>
                                          <td className="px-3 py-2 text-right whitespace-nowrap">
                                            <div className="inline-flex items-center gap-1.5">
                                              <button
                                                type="button"
                                                disabled={savingServiceId === dKey}
                                                onClick={() =>
                                                  handleSaveExistingService(company.id, srv)
                                                }
                                                className="px-2.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-[11px] disabled:opacity-50"
                                              >
                                                Guardar
                                              </button>
                                              {srv.id && srv.id > 0 && (
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    handleDeleteService(company.id, srv.id)
                                                  }
                                                  className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10"
                                                  title="Eliminar servicio"
                                                >
                                                  <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                              )}
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })}

                                    {/* Add New Service Row */}
                                    <tr className="bg-slate-50/70 dark:bg-white/[0.02]">
                                      <td className="px-3 py-2.5">
                                        <input
                                          type="text"
                                          placeholder="+ Nuevo servicio de esta empresa..."
                                          value={newRowDraft.serviceName}
                                          onChange={(e) =>
                                            setNewServiceDrafts((prev) => ({
                                              ...prev,
                                              [company.id]: {
                                                ...newRowDraft,
                                                serviceName: e.target.value,
                                              },
                                            }))
                                          }
                                          className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-[#110E17] border border-dashed border-slate-300 dark:border-white/20 text-xs text-slate-900 dark:text-white"
                                        />
                                      </td>
                                      <td className="px-3 py-2.5">
                                        <input
                                          type="text"
                                          placeholder="Hora/Serv."
                                          value={newRowDraft.unitLabel}
                                          onChange={(e) =>
                                            setNewServiceDrafts((prev) => ({
                                              ...prev,
                                              [company.id]: {
                                                ...newRowDraft,
                                                unitLabel: e.target.value,
                                              },
                                            }))
                                          }
                                          className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-[#110E17] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white"
                                        />
                                      </td>
                                      <td className="px-3 py-2.5">
                                        <select
                                          value={newRowDraft.currency}
                                          onChange={(e) =>
                                            setNewServiceDrafts((prev) => ({
                                              ...prev,
                                              [company.id]: {
                                                ...newRowDraft,
                                                currency: e.target.value as 'ARS' | 'USD',
                                              },
                                            }))
                                          }
                                          className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-[#110E17] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white"
                                        >
                                          <option value="ARS">ARS</option>
                                          <option value="USD">USD</option>
                                        </select>
                                      </td>
                                      <td className="px-3 py-2.5">
                                        <input
                                          type="number"
                                          min="0"
                                          step="any"
                                          placeholder="Neto"
                                          value={newRowDraft.netPrice}
                                          onChange={(e) =>
                                            updateServiceDraftNet(
                                              company.id,
                                              e.target.value,
                                              newRowDraft.taxRatePercent,
                                              true
                                            )
                                          }
                                          className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-[#110E17] border border-slate-200 dark:border-white/10 text-xs font-mono tabular-nums text-right text-slate-900 dark:text-white"
                                        />
                                      </td>
                                      <td className="px-3 py-2.5">
                                        <select
                                          value={newRowDraft.taxRatePercent}
                                          onChange={(e) =>
                                            updateServiceDraftTaxRate(
                                              company.id,
                                              Number(e.target.value),
                                              true
                                            )
                                          }
                                          className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-[#110E17] border border-slate-200 dark:border-white/10 text-xs font-mono tabular-nums text-slate-900 dark:text-white"
                                        >
                                          {ALLOWED_TAX_RATES.map((rate) => (
                                            <option key={rate} value={rate}>
                                              {rate === 0 ? '0% Ex.' : `${rate}%`}
                                            </option>
                                          ))}
                                        </select>
                                      </td>
                                      <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-500 whitespace-nowrap">
                                        {formatServicePrice(
                                          calculateTaxBreakdownFromNet(
                                            Number(newRowDraft.netPrice) || 0,
                                            newRowDraft.taxRatePercent
                                          ).taxAmount,
                                          newRowDraft.currency
                                        )}
                                      </td>
                                      <td className="px-3 py-2.5">
                                        <input
                                          type="number"
                                          min="0"
                                          step="any"
                                          placeholder="Final c/IVA"
                                          value={newRowDraft.grossPrice}
                                          onChange={(e) =>
                                            updateServiceDraftGross(
                                              company.id,
                                              e.target.value,
                                              newRowDraft.taxRatePercent,
                                              true
                                            )
                                          }
                                          className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-[#110E17] border border-slate-200 dark:border-white/10 text-xs font-mono tabular-nums text-right text-slate-900 dark:text-white"
                                        />
                                      </td>
                                      <td className="px-3 py-2.5 text-center text-[11px] text-slate-400">
                                        Nuevo
                                      </td>
                                      <td className="px-3 py-2.5 text-right">
                                        <button
                                          type="button"
                                          disabled={savingServiceId === `new:${company.id}`}
                                          onClick={() => handleAddService(company.id)}
                                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] inline-flex items-center gap-1 whitespace-nowrap disabled:opacity-50"
                                        >
                                          <Plus className="w-3.5 h-3.5" /> Agregar
                                        </button>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
                {filteredCompanies.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      No hay empresas ni profesionales que coincidan con el filtro actual.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
