import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth, doc, getDoc, collection, onSnapshot } from '../lib/db';
import {
  Plus,
  FileText,
  Clock,
  CheckCircle,
  ChevronRight,
  LayoutDashboard,
  Send,
  Users,
  Package,
  Truck,
  Shield,
  Route,
  Sparkles,
  Database,
  Menu,
  X,
  Building2,
  Warehouse,
  ShoppingBag,
  MessageSquare,
  ExternalLink,
  Mail,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import CompanyProducts from '../components/CompanyProducts';
import CompanyInbox from '../components/CompanyInbox';
import RfqNegotiationModal from '../components/RfqNegotiationModal';
import FleetControlCenter from '../components/FleetControlCenter';
import TeamSeatsManager, { OrganizationInfo } from '../components/TeamSeatsManager';
import { getApiUrl } from '../lib/apiConfig';
import { computeAdnMatches, syncCompanyToUserCRM } from '../lib/b2bDirectoryData';

interface RFQ {
  id: number;
  title: string;
  category: string;
  priority: string;
  description: string;
  status: string;
  createdAt: string;
}

type OperativeView =
  | 'overview'
  | 'arn_crm'
  | 'rfqs'
  | 'adn'
  | 'products'
  | 'fleet'
  | 'team';

const VALID_VIEWS: OperativeView[] = [
  'overview',
  'arn_crm',
  'rfqs',
  'adn',
  'products',
  'fleet',
  'team',
];

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialArea = searchParams.get('area') as OperativeView | null;
  const [activeView, setActiveView] = useState<OperativeView>(
    initialArea && VALID_VIEWS.includes(initialArea) ? initialArea : 'overview'
  );
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [orgInfo, setOrgInfo] = useState<OrganizationInfo | null>(null);
  const [arnSummary, setArnSummary] = useState({
    totalOpportunities: 0,
    pendingApprovals: 0,
    pipelineUsd: 0,
  });
  const [contactsCount, setContactsCount] = useState(0);

  const [myOffersInput, setMyOffersInput] = useState(
    'Mecanizado CNC, Estructuras Metálicas, Servicios Petroleros'
  );
  const [myDemandsInput, setMyDemandsInput] = useState(
    'Bridas Forjadas, Transformadores MT, Flete Consolidado'
  );
  const [odooSyncStatus, setOdooSyncStatus] = useState<string | null>(null);
  const [adnMatches, setAdnMatches] = useState<any[]>(() =>
    computeAdnMatches({
      myOffers: ['Mecanizado CNC', 'Estructuras Metálicas', 'Servicios Petroleros'],
      myDemands: ['Bridas Forjadas', 'Transformadores MT', 'Flete Consolidado'],
    })
  );
  const [isMatchingAdn, setIsMatchingAdn] = useState(false);

  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [negotiationRfq, setNegotiationRfq] = useState<RFQ | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [installedModules, setInstalledModules] = useState<string[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  // New RFQ form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Servicios Industriales');
  const [priority, setPriority] = useState('medium');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    const areaParam = searchParams.get('area') as OperativeView | null;
    if (areaParam && VALID_VIEWS.includes(areaParam) && areaParam !== activeView) {
      setActiveView(areaParam);
    }
  }, [searchParams, activeView]);

  const selectView = (view: OperativeView) => {
    setActiveView(view);
    setMobileNavOpen(false);
    setSearchParams({ area: view }, { replace: true });
  };

  const loadWorkspaceMeta = useCallback(async () => {
    try {
      const token = await auth.getToken();
      if (!token) return;
      const headers = { Authorization: `Bearer ${token}` };

      const [orgRes, arnRes, crmRes] = await Promise.all([
        fetch(`${getApiUrl()}/api/org/team`, { headers, cache: 'no-store' }),
        fetch(`${getApiUrl()}/api/arn/overview`, { headers, cache: 'no-store' }),
        fetch(`${getApiUrl()}/api/crm/contacts`, { headers, cache: 'no-store' }),
      ]);

      if (orgRes.ok) {
        const orgData = await orgRes.json();
        if (orgData.organization) setOrgInfo(orgData.organization);
      }
      if (arnRes.ok) {
        const arnData = await arnRes.json();
        if (arnData.metrics) {
          setArnSummary({
            totalOpportunities: Number(arnData.metrics.totalOpportunities || 0),
            pendingApprovals: Number(arnData.metrics.pendingApprovals || 0),
            pipelineUsd: Number(arnData.metrics.pipelineUsd || 0),
          });
        }
      }
      if (crmRes.ok) {
        const crmData = await crmRes.json();
        if (Array.isArray(crmData.contacts)) {
          setContactsCount(crmData.contacts.length);
        }
      }
    } catch {
      // ignore transient telemetry errors
    }
  }, []);

  useEffect(() => {
    const fetchRfqs = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate('/');
        return;
      }
      try {
        const token = await auth.getToken();
        const res = await fetch(`${getApiUrl()}/api/rfqs`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setRfqs(data);
        }
      } catch (error) {
        console.error('Error fetching RFQs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchModules = async (user: any) => {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        let userCategory = '';
        if (userDocSnap.exists()) {
          userCategory = userDocSnap.data().category || '';
        }

        const docRef = doc(db, 'users', user.uid, 'settings', 'modules');
        const docSnap = await getDoc(docRef);
        let ids: string[] = [];
        if (docSnap.exists()) {
          const data = docSnap.data();
          ids = data.installed || [];
        }
        if (userCategory === 'LOGISTICA' && !ids.includes('logistics')) {
          ids.push('logistics');
        }
        setInstalledModules(ids);
      } catch (e) {
        console.error(e);
      }
    };

    const isRecoveryFlow =
      typeof window !== 'undefined' &&
      (window.location.hash.includes('type=recovery') ||
        window.location.hash.includes('access_token=') ||
        window.location.search.includes('recovery=1') ||
        window.location.search.includes('code='));

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchRfqs();
        fetchModules(user);
        loadWorkspaceMeta();
      } else if (!isRecoveryFlow) {
        navigate('/');
      }
    });

    return () => unsubscribe();
  }, [navigate, loadWorkspaceMeta]);

  useEffect(() => {
    if (installedModules.includes('warehousing')) {
      const unsubscribe = onSnapshot(collection(db, 'inventory_items'), (snapshot) => {
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setInventory(items);
      });
      return () => unsubscribe();
    }
  }, [installedModules]);

  const handleCreateRfq = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const user = auth.currentUser;
    if (!user) return;

    try {
      const token = await auth.getToken();
      const res = await fetch(`${getApiUrl()}/api/rfqs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, category, priority, description }),
      });

      if (res.ok) {
        const newRfq = await res.json();
        setRfqs([newRfq, ...rfqs]);
        setIsNewModalOpen(false);
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 5000);
        setTitle('');
        setCategory('Servicios Industriales');
        setPriority('medium');
        setDescription('');
      }
    } catch (error) {
      console.error('Error creating RFQ:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateWarehouseData = () => {
    const warehouseMap: Record<string, any> = {};
    inventory.forEach((item) => {
      const loc =
        item.location === 'Central CABA'
          ? 'Central CABA'
          : item.location === 'Parque Ind. Comodoro'
          ? 'PQ Comodoro'
          : 'Sur Neuquén';

      if (!warehouseMap[loc])
        warehouseMap[loc] = { name: loc, Componentes: 0, Insumos: 0, Maquinaria: 0 };
      if (['Componentes', 'Insumos', 'Maquinaria'].includes(item.category)) {
        warehouseMap[loc][item.category] += Number(item.stock) || 0;
      }
    });
    return Object.values(warehouseMap);
  };

  const VIEW_META: Record<
    OperativeView,
    { areaTag: string; title: string; subtitle: string; accent: string }
  > = {
    overview: {
      areaTag: '01 · Dirección Operativa',
      title: 'Resumen Ejecutivo B2B',
      subtitle:
        'Tablero consolidado por área operativa con pulso en tiempo real de ARN IA, Contactos CRM, Cotizaciones y Capacidad del Equipo.',
      accent: 'text-orange-600 dark:text-orange-400',
    },
    arn_crm: {
      areaTag: '02 · Área Comercial',
      title: 'ARN IA + CRM & Contactos',
      subtitle:
        'Motor autónomo híbrido y agenda de Contactos CRM trabajando en conjunto con sincronización a Odoo y correo.',
      accent: 'text-purple-600 dark:text-purple-400',
    },
    rfqs: {
      areaTag: '02 · Área Comercial',
      title: 'Licitaciones & Cotizaciones (RFQs)',
      subtitle:
        'Emisión directa de requerimientos hacia proveedores validados y negociación de ofertas recibidas.',
      accent: 'text-orange-600 dark:text-orange-400',
    },
    adn: {
      areaTag: '02 · Área Comercial',
      title: 'ADN Vectorial & Sincronización Odoo',
      subtitle:
        'Matching semántico pgvector Norte ↔ Patagonia entre capacidades ofrecidas e insumos demandados.',
      accent: 'text-emerald-600 dark:text-emerald-400',
    },
    products: {
      areaTag: '03 · Operaciones & Catálogo',
      title: 'Catálogo de Productos B2B',
      subtitle:
        'Gestión centralizada de SKUs industriales, precios mayoristas, normas ISO/API y stock disponible.',
      accent: 'text-orange-600 dark:text-orange-400',
    },
    fleet: {
      areaTag: '04 · Logística & Flota',
      title: 'Gestión y Control de Flota & Contratos',
      subtitle:
        'Suite dedicada para empresas de transporte y operadores con Membresía Logística: unidades, choferes LINTI y contratación de fletes.',
      accent: 'text-orange-600 dark:text-orange-400',
    },
    team: {
      areaTag: '05 · Organización & Plan SaaS',
      title: 'Equipo PyME, Asientos y Membresías',
      subtitle:
        'Administración de usuarios por plan (2 Gratis · 5 Pro · 10 Corporativo) y activación de Membresía Logística.',
      accent: 'text-purple-600 dark:text-purple-400',
    },
  };

  const isAdminUser =
    auth.currentUser?.email === 'xpatagonia.com@gmail.com' ||
    auth.currentUser?.email === 'admin@xpatagonia.com';

  const modalContent = (
    <AnimatePresence>
      {isNewModalOpen && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
          <motion.div
            initial={{ backgroundColor: 'transparent' }}
            animate={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            exit={{ backgroundColor: 'transparent' }}
            className="absolute inset-0 backdrop-blur-sm"
            onClick={() => setIsNewModalOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-xl z-[9999] bg-white dark:bg-[#1A1625] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden"
          >
            <div className="p-6 md:p-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Solicitar Cotización (Match Directo)
                </h2>
                <p className="text-sm text-slate-500 mb-6">
                  Su solicitud se enviará en tiempo real a los proveedores validados de nuestro directorio que coincidan con la categoría.
                </p>
              </div>
              <form onSubmit={handleCreateRfq} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Título Breve
                  </label>
                  <input
                    required
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej: Provisión de ropa de trabajo ignífuga"
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Categoría
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    >
                      <option>Servicios Industriales</option>
                      <option>Hidrocarburos</option>
                      <option>Sector Metalúrgico y Metalmecánico</option>
                      <option>Puertos y Logística Terrestre / Almacenamiento</option>
                      <option>Energías Renovables (Eólica, Solar)</option>
                      <option>Construcción Civil e Infraestructura</option>
                      <option>Tecnología e Innovación</option>
                      <option>Seguridad e Higiene Integral</option>
                      <option>Alimentación</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Prioridad
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    >
                      <option value="low">Baja (Normal)</option>
                      <option value="medium">Media</option>
                      <option value="high">Alta / Urgente</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Descripción Detallada
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Especificaciones técnicas, cantidades, plazos de entrega..."
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none"
                  />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsNewModalOpen(false)}
                    className="px-6 py-3 font-bold text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-lg transition disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Enviar a Proveedores
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  const sidebarContent = (
    <div className="flex flex-col h-full py-5 px-4 space-y-5">
      {/* Workspace Brand Context */}
      <div className="px-2 pb-3 border-b border-slate-200 dark:border-white/10">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Workspace Operativo PyME
        </p>
        <p className="text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">
          {orgInfo?.orgName || auth.currentUser?.email || 'Mi Empresa B2B'}
        </p>
        {orgInfo && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[11px] font-mono tabular-nums">
            <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 font-semibold">
              {orgInfo.planName} · {orgInfo.usedSeats}/{orgInfo.seatLimit} us.
            </span>
            {orgInfo.hasLogisticsAccess && (
              <span className="px-2 py-0.5 rounded bg-orange-500/15 text-orange-700 dark:text-orange-300 font-semibold">
                Flota Activa
              </span>
            )}
          </div>
        )}
      </div>

      {/* AREA 01: RESUMEN EJECUTIVO */}
      <div>
        <div className="px-2 mb-1.5 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            01 · Resumen Ejecutivo
          </span>
        </div>
        <div className="space-y-1">
          <button
            onClick={() => selectView('overview')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition text-left ${
              activeView === 'overview'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            <span>Panel General B2B</span>
          </button>
        </div>
      </div>

      {/* AREA 02: COMERCIAL · ARN & CRM */}
      <div className="rounded-2xl bg-purple-500/[0.06] dark:bg-purple-500/[0.08] border border-purple-500/20 p-2.5">
        <div className="px-1.5 mb-2 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-purple-700 dark:text-purple-300">
            02 · Comercial · ARN &amp; CRM
          </span>
          {arnSummary.pendingApprovals > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-purple-600 text-white text-[10px] font-mono font-bold tabular-nums">
              {arnSummary.pendingApprovals}
            </span>
          )}
        </div>
        <div className="space-y-1">
          <button
            onClick={() => selectView('arn_crm')}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition text-left ${
              activeView === 'arn_crm'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-700 dark:text-slate-200 hover:bg-white/70 dark:hover:bg-white/5'
            }`}
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0" />
              ARN IA + Contactos CRM
            </span>
          </button>
          <button
            onClick={() => selectView('rfqs')}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition text-left ${
              activeView === 'rfqs'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-700 dark:text-slate-200 hover:bg-white/70 dark:hover:bg-white/5'
            }`}
          >
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4 shrink-0" />
              Mis Cotizaciones (RFQs)
            </span>
            <span className="text-[10px] font-mono tabular-nums opacity-75">
              {rfqs.length}
            </span>
          </button>
          <button
            onClick={() => selectView('adn')}
            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold transition text-left ${
              activeView === 'adn'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-700 dark:text-slate-200 hover:bg-white/70 dark:hover:bg-white/5'
            }`}
          >
            <Database className="w-4 h-4 shrink-0" />
            <span>ADN Vector &amp; Odoo</span>
          </button>
          <button
            onClick={() => navigate('/chat')}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-white/5 transition text-left"
          >
            <span className="flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
              Mensajería B2B
            </span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </button>
        </div>
      </div>

      {/* AREA 03: OPERACIONES & CATÁLOGO */}
      <div className="rounded-2xl bg-emerald-500/[0.05] dark:bg-emerald-500/[0.07] border border-emerald-500/20 p-2.5">
        <div className="px-1.5 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
            03 · Operaciones &amp; Catálogo
          </span>
        </div>
        <div className="space-y-1">
          <button
            onClick={() => selectView('products')}
            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold transition text-left ${
              activeView === 'products'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-700 dark:text-slate-200 hover:bg-white/70 dark:hover:bg-white/5'
            }`}
          >
            <Package className="w-4 h-4 shrink-0" />
            <span>Mis Productos &amp; SKUs</span>
          </button>
          <button
            onClick={() => navigate('/warehousing')}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-white/5 transition text-left"
          >
            <span className="flex items-center gap-2">
              <Warehouse className="w-3.5 h-3.5 shrink-0" />
              Almacenamiento WMS
            </span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </button>
          <button
            onClick={() => navigate('/ecommerce')}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-white/5 transition text-left"
          >
            <span className="flex items-center gap-2">
              <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
              E-commerce B2B
            </span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </button>
        </div>
      </div>

      {/* AREA 04: LOGÍSTICA & CONTROL DE FLOTA */}
      <div className="rounded-2xl bg-orange-500/[0.06] dark:bg-orange-500/[0.08] border border-orange-500/25 p-2.5">
        <div className="px-1.5 mb-2 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-orange-700 dark:text-orange-300">
            04 · Logística &amp; Flota
          </span>
        </div>
        <div className="space-y-1">
          <button
            onClick={() => selectView('fleet')}
            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold transition text-left ${
              activeView === 'fleet'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-700 dark:text-slate-200 hover:bg-white/70 dark:hover:bg-white/5'
            }`}
          >
            <Truck className="w-4 h-4 shrink-0" />
            <span>Flota, Choferes &amp; Contratos</span>
          </button>
          <button
            onClick={() => navigate('/logistica')}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-white/5 transition text-left"
          >
            <span className="flex items-center gap-2">
              <Route className="w-3.5 h-3.5 shrink-0" />
              Rutas OSRM &amp; Bolsa
            </span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </button>
        </div>
      </div>

      {/* AREA 05: ORGANIZACIÓN & PLAN SAAS */}
      <div className="rounded-2xl bg-slate-100/80 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 p-2.5">
        <div className="px-1.5 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            05 · Organización &amp; Plan
          </span>
        </div>
        <div className="space-y-1">
          <button
            onClick={() => selectView('team')}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition text-left ${
              activeView === 'team'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                : 'text-slate-700 dark:text-slate-200 hover:bg-white/80 dark:hover:bg-white/5'
            }`}
          >
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4 shrink-0" />
              Equipo &amp; Plan SaaS
            </span>
            {orgInfo && (
              <span className="text-[10px] font-mono tabular-nums opacity-80">
                {orgInfo.usedSeats}/{orgInfo.seatLimit}
              </span>
            )}
          </button>
          <button
            onClick={() => navigate('/perfil-empresa')}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-white/5 transition text-left"
          >
            <span className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              Perfil Fiscal Empresa
            </span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </button>
          {isAdminUser && (
            <button
              onClick={() => navigate('/admin?tab=sitio')}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 transition text-left"
            >
              <span className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 shrink-0" />
                Admin CMS &amp; Hero
              </span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const meta = VIEW_META[activeView];

  return (
    <div className="min-h-[calc(100vh-4.25rem)] bg-slate-50 dark:bg-[#0A080C] flex">
      {/* Desktop Fixed-Height Sticky Sidebar */}
      <aside className="hidden lg:block w-[276px] shrink-0 bg-white dark:bg-[#110E17] border-r border-slate-200 dark:border-white/10 lg:sticky lg:top-[65px] lg:h-[calc(100vh-65px)] overflow-y-auto">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileNavOpen && (
          <div className="fixed inset-0 z-[120] lg:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileNavOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="relative z-10 w-[290px] max-w-[85vw] bg-white dark:bg-[#110E17] h-full overflow-y-auto border-r border-slate-200 dark:border-white/10"
            >
              <div className="flex items-center justify-between px-4 pt-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Áreas Operativas
                </span>
                <button
                  onClick={() => setMobileNavOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {sidebarContent}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main Workspace Canvas */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Contextual Top Bar */}
        <header className="sticky top-[65px] z-30 bg-white/95 dark:bg-[#110E17]/95 backdrop-blur-md border-b border-slate-200 dark:border-white/10 px-4 sm:px-6 lg:px-8 py-4">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <button
                onClick={() => setMobileNavOpen(true)}
                className="lg:hidden p-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 shrink-0"
                aria-label="Abrir navegación por áreas"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <span
                  className={`text-[11px] font-bold uppercase tracking-widest block ${meta.accent}`}
                >
                  {meta.areaTag}
                </span>
                <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900 dark:text-white truncate">
                  {meta.title}
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {orgInfo && (
                <button
                  onClick={() => selectView('team')}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-purple-500/40 transition flex items-center gap-2 whitespace-nowrap font-mono tabular-nums"
                >
                  <Users className="w-3.5 h-3.5 text-purple-500" />
                  <span>
                    {orgInfo.planName} · {orgInfo.usedSeats}/{orgInfo.seatLimit}
                  </span>
                </button>
              )}

              <button
                onClick={() => setIsNewModalOpen(true)}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs uppercase tracking-wider font-bold rounded-xl transition flex items-center gap-1.5 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" /> Nueva Solicitud RFQ
              </button>
            </div>
          </div>
          <p className="max-w-7xl mx-auto text-xs text-slate-500 mt-1.5 hidden sm:block">
            {meta.subtitle}
          </p>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* AREA 01: OVERVIEW */}
            {activeView === 'overview' && (
              <div className="space-y-6">
                {/* Executive KPI Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 font-mono tabular-nums">
                  <div
                    onClick={() => selectView('arn_crm')}
                    className="cursor-pointer bg-white dark:bg-[#1A1625] p-5 rounded-2xl border border-slate-200 dark:border-white/10 hover:border-purple-500/40 transition"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-slate-500">
                        Pipeline ARN IA
                      </span>
                      <Sparkles className="w-4 h-4 text-purple-500" />
                    </div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      USD {arnSummary.pipelineUsd.toLocaleString('es-AR')}
                    </p>
                    <p className="text-[11px] font-sans text-slate-500 mt-1">
                      {arnSummary.totalOpportunities} oportunidades · {arnSummary.pendingApprovals} por aprobar
                    </p>
                  </div>

                  <div
                    onClick={() => selectView('arn_crm')}
                    className="cursor-pointer bg-white dark:bg-[#1A1625] p-5 rounded-2xl border border-slate-200 dark:border-white/10 hover:border-orange-500/40 transition"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-slate-500">
                        Contactos CRM
                      </span>
                      <Mail className="w-4 h-4 text-orange-500" />
                    </div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {contactsCount}
                    </p>
                    <p className="text-[11px] font-sans text-slate-500 mt-1">
                      Agenda sincronizada bidireccionalmente con ARN IA
                    </p>
                  </div>

                  <div
                    onClick={() => selectView('rfqs')}
                    className="cursor-pointer bg-white dark:bg-[#1A1625] p-5 rounded-2xl border border-slate-200 dark:border-white/10 hover:border-orange-500/40 transition"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-slate-500">
                        Cotizaciones (RFQs)
                      </span>
                      <FileText className="w-4 h-4 text-orange-500" />
                    </div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {rfqs.length}
                    </p>
                    <p className="text-[11px] font-sans text-slate-500 mt-1">
                      Emisión y negociación en tiempo real
                    </p>
                  </div>

                  <div
                    onClick={() => selectView('team')}
                    className="cursor-pointer bg-white dark:bg-[#1A1625] p-5 rounded-2xl border border-slate-200 dark:border-white/10 hover:border-purple-500/40 transition"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-slate-500">
                        Capacidad SaaS PyME
                      </span>
                      <Users className="w-4 h-4 text-emerald-500" />
                    </div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {orgInfo ? `${orgInfo.usedSeats}/${orgInfo.seatLimit}` : '1/2'}
                    </p>
                    <p className="text-[11px] font-sans text-slate-500 mt-1">
                      {orgInfo ? orgInfo.planName : 'Plan Gratis'} {orgInfo?.hasLogisticsAccess ? '· Flota Activa' : ''}
                    </p>
                  </div>
                </div>

                {/* Operative Areas Quick Launch Matrix */}
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
                    Accesos por Área Operativa
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <div
                      onClick={() => selectView('arn_crm')}
                      className="cursor-pointer bg-white dark:bg-[#1A1625] border border-purple-500/25 hover:border-purple-500/60 rounded-2xl p-5 transition flex flex-col justify-between"
                    >
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                          Área Comercial
                        </span>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                          ARN IA + Contactos CRM
                        </h3>
                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                          Calificación autónoma, cola híbrida de aprobación, RFQs e agenda CRM integrada.
                        </p>
                      </div>
                      <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-purple-600 dark:text-purple-400">
                        Abrir Centro Comercial <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>

                    <div
                      onClick={() => selectView('products')}
                      className="cursor-pointer bg-white dark:bg-[#1A1625] border border-emerald-500/25 hover:border-emerald-500/60 rounded-2xl p-5 transition flex flex-col justify-between"
                    >
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          Operaciones &amp; Stock
                        </span>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                          Catálogo B2B &amp; WMS
                        </h3>
                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                          Publicación de SKUs, reservas automáticas de inventario y e-commerce industrial.
                        </p>
                      </div>
                      <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        Gestionar Productos <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>

                    <div
                      onClick={() => selectView('fleet')}
                      className="cursor-pointer bg-white dark:bg-[#1A1625] border border-orange-500/25 hover:border-orange-500/60 rounded-2xl p-5 transition flex flex-col justify-between"
                    >
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                          Logística &amp; Transporte
                        </span>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                          Control de Flota &amp; Contratos
                        </h3>
                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                          Unidades, choferes LINTI, vencimientos VTV y contratación directa de cargas.
                        </p>
                      </div>
                      <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-orange-600 dark:text-orange-400">
                        {orgInfo?.hasLogisticsAccess ? 'Operar Flota' : 'Ver Membresía Logística'}{' '}
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>

                    <div
                      onClick={() => selectView('team')}
                      className="cursor-pointer bg-white dark:bg-[#1A1625] border border-slate-200 dark:border-white/10 hover:border-slate-400 dark:hover:border-white/30 rounded-2xl p-5 transition flex flex-col justify-between"
                    >
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Organización SaaS
                        </span>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                          Usuarios, Roles &amp; Plan
                        </h3>
                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                          Invitá miembros según tu plan (2 Gratis · 5 Pro · 10 Corporativo) y gestioná roles.
                        </p>
                      </div>
                      <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-slate-900 dark:text-white">
                        Administrar Equipo <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Active Warehouse Chart Snapshot if enabled */}
                {installedModules.includes('warehousing') && inventory.length > 0 && (
                  <div className="bg-white dark:bg-[#1A1625] p-6 rounded-2xl border border-slate-200 dark:border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          Distribución de Stock WMS por Base Operativa
                        </h3>
                        <p className="text-xs text-slate-500">
                          {inventory.length} SKUs registrados en depósitos patagónicos y CABA
                        </p>
                      </div>
                      <button
                        onClick={() => navigate('/warehousing')}
                        className="text-xs font-bold text-orange-500 hover:underline whitespace-nowrap"
                      >
                        Abrir WMS Completo
                      </button>
                    </div>
                    <div className="h-[190px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={calculateWarehouseData()}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} opacity={0.2} />
                          <XAxis dataKey="name" tick={{ fill: '#888', fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: '#888', fontSize: 10 }} axisLine={false} tickLine={false} />
                          <RechartsTooltip
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{
                              backgroundColor: '#1A1625',
                              borderColor: '#333',
                              color: '#fff',
                              borderRadius: '8px',
                            }}
                          />
                          <Bar dataKey="Componentes" stackId="a" fill="#f97316" radius={[0, 0, 4, 4]} />
                          <Bar dataKey="Insumos" stackId="a" fill="#eab308" />
                          <Bar dataKey="Maquinaria" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* AREA 02A: ARN IA + CRM & CONTACTOS */}
            {activeView === 'arn_crm' && <CompanyInbox />}

            {/* AREA 02B: RFQs */}
            {activeView === 'rfqs' && (
              <div className="space-y-4">
                {isLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="w-8 h-8 border-t-2 border-r-2 border-orange-500 rounded-full animate-spin" />
                  </div>
                ) : rfqs.length === 0 ? (
                  <div className="bg-white dark:bg-[#110E17] border border-slate-200 dark:border-white/10 rounded-2xl p-12 text-center shadow-sm">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <FileText className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                      No tienes cotizaciones activas
                    </h3>
                    <p className="text-slate-500 mb-6 max-w-md mx-auto text-sm">
                      Envía tu primer Requerimiento de Cotización (RFQ) para notificar en tiempo real a proveedores verificados.
                    </p>
                    <button
                      onClick={() => setIsNewModalOpen(true)}
                      className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white text-xs uppercase tracking-widest font-bold rounded-lg transition"
                    >
                      Crear mi primer RFQ
                    </button>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-[#110E17] border border-slate-200 dark:border-white/10 shadow-sm rounded-2xl overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-white/5 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-white/10">
                          <th className="px-6 py-4 font-semibold">Requerimiento</th>
                          <th className="px-6 py-4 font-semibold">Categoría</th>
                          <th className="px-6 py-4 font-semibold">Estado</th>
                          <th className="px-6 py-4 font-semibold text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rfqs.map((rfq) => (
                          <tr
                            key={rfq.id}
                            className="border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                          >
                            <td className="px-6 py-5">
                              <p className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                                {rfq.title}
                              </p>
                              <p className="text-xs text-slate-500 font-mono tabular-nums">
                                #{rfq.id.toString().padStart(5, '0')} ·{' '}
                                {new Date(rfq.createdAt).toLocaleDateString('es-AR')}
                              </p>
                            </td>
                            <td className="px-6 py-5">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                                {rfq.category}
                              </span>
                            </td>
                            <td className="px-6 py-5">
                              {rfq.status === 'pending' && (
                                <span className="inline-flex items-center text-orange-500 text-xs font-semibold">
                                  <Clock className="w-3.5 h-3.5 mr-1" /> Notificando Proveedores
                                </span>
                              )}
                              {rfq.status === 'quoted' && (
                                <span className="inline-flex items-center text-purple-500 text-xs font-semibold">
                                  <FileText className="w-3.5 h-3.5 mr-1" /> Cotizaciones Recibidas
                                </span>
                              )}
                              {rfq.status === 'awarded' && (
                                <span className="inline-flex items-center text-emerald-500 text-xs font-semibold">
                                  <CheckCircle className="w-3.5 h-3.5 mr-1" /> Adjudicado
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-5 text-right">
                              <button
                                onClick={() => setNegotiationRfq(rfq)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-orange-500/10 hover:bg-orange-500 text-orange-600 dark:text-orange-400 hover:text-white rounded-xl text-xs font-bold transition whitespace-nowrap"
                              >
                                <span>Negociar Ofertas</span>
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* AREA 02C: ADN VECTORIAL & ODOO */}
            {activeView === 'adn' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-[#1A1625] border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-500 block mb-1">
                        Motor pgvector + Corredores OSRM
                      </span>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        ADN Empresarial (Matching Norte ↔ Patagonia)
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Define qué ofrece tu empresa y qué insumos demanda para detectar contrapartes compatibles y enviarlas a Contactos CRM + ARN IA.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <button
                        onClick={async () => {
                          setIsMatchingAdn(true);
                          try {
                            const token = await auth.getToken();
                            const res = await fetch(`${getApiUrl()}/api/adn/match`, {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token}`,
                              },
                              body: JSON.stringify({
                                offers: myOffersInput,
                                demands: myDemandsInput,
                              }),
                            });
                            const data = await res.json();
                            if (res.ok && Array.isArray(data.matches) && data.matches.length > 0) {
                              setAdnMatches(data.matches);
                              setOdooSyncStatus(
                                'Matching vectorial pgvector + corredores OSRM actualizado desde servidor.'
                              );
                            } else {
                              setAdnMatches(
                                computeAdnMatches({
                                  myOffers: myOffersInput
                                    .split(',')
                                    .map((s) => s.trim())
                                    .filter(Boolean),
                                  myDemands: myDemandsInput
                                    .split(',')
                                    .map((s) => s.trim())
                                    .filter(Boolean),
                                })
                              );
                            }
                          } catch {
                            setAdnMatches(
                              computeAdnMatches({
                                myOffers: myOffersInput
                                  .split(',')
                                  .map((s) => s.trim())
                                  .filter(Boolean),
                                myDemands: myDemandsInput
                                  .split(',')
                                  .map((s) => s.trim())
                                  .filter(Boolean),
                              })
                            );
                          } finally {
                            setIsMatchingAdn(false);
                            setTimeout(() => setOdooSyncStatus(null), 4000);
                          }
                        }}
                        disabled={isMatchingAdn}
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
                      >
                        <Sparkles className="w-4 h-4" />
                        {isMatchingAdn ? 'Calculando pgvector...' : 'Calcular Match IA'}
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const token = await auth.getToken();
                            const res = await fetch(`${getApiUrl()}/api/crm/sync-odoo`, {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token}`,
                              },
                              body: JSON.stringify({
                                offers: myOffersInput,
                                demands: myDemandsInput,
                                userEmail: auth.currentUser?.email || 'miembro@xpatagonia.online',
                              }),
                            });
                            const data = await res.json();
                            if (res.status === 403 && data?.code === 'MODULE_ENTITLEMENT_REQUIRED') {
                              setOdooSyncStatus(
                                'El conector Odoo ERP & ADN requiere Plan Corporativo o contratar el módulo Odoo ERP & ADN IA ($55.000 ARS/mes) en Módulos (/apps).'
                              );
                              return;
                            }
                            if (!res.ok) throw new Error(data?.error || 'Error de sincronización');
                            setOdooSyncStatus(
                              data.forwardedToN8n
                                ? 'Sincronizado en vivo con Odoo VPS vía n8n.'
                                : 'Perfil ADN guardado en servidor y registrado en bitácora n8n.'
                            );
                          } catch (err: any) {
                            setOdooSyncStatus(
                              `No se pudo sincronizar con el servidor: ${err?.message || 'reintentar'}`
                            );
                          }
                          setTimeout(() => setOdooSyncStatus(null), 5000);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold uppercase tracking-wider hover:opacity-90 transition flex items-center gap-2 whitespace-nowrap"
                      >
                        <Database className="w-4 h-4" />
                        Sincronizar Odoo (n8n)
                      </button>
                    </div>
                  </div>

                  {odooSyncStatus && (
                    <div className="mb-4 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {odooSyncStatus}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Capacidades / Productos que Ofrecemos
                      </label>
                      <input
                        type="text"
                        value={myOffersInput}
                        onChange={(e) => setMyOffersInput(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Insumos / Servicios que Demandamos
                      </label>
                      <input
                        type="text"
                        value={myDemandsInput}
                        onChange={(e) => setMyDemandsInput(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {adnMatches.map((match) => (
                    <div
                      key={match.company.id}
                      className="bg-white dark:bg-[#1A1625] border border-slate-200 dark:border-white/10 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                            {match.compatibilityPercent}% Match ADN
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-purple-600 dark:text-purple-400">
                            {match.company.tierLabel}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="text-slate-500 font-mono tabular-nums">
                            ~{match.estimatedRoadKm} km por {match.corridorSynergy}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          {match.company.name}
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {match.matchReason} · Base: {match.company.city}, {match.company.province}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          onClick={() =>
                            navigate(
                              `/logistica?tab=rutas&origin=${encodeURIComponent(
                                match.company.adnComercial.ciudadBase
                              )}&dest=${encodeURIComponent('Añelo (Hub Vaca Muerta)')}`
                            )
                          }
                          className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:border-orange-500/40 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <Route className="w-3.5 h-3.5 text-orange-500" />
                          Calcular Flete
                        </button>
                        <button
                          onClick={async () => {
                            const res = await syncCompanyToUserCRM(match.company);
                            setOdooSyncStatus(res.message);
                            loadWorkspaceMeta();
                            setTimeout(() => setOdooSyncStatus(null), 4000);
                          }}
                          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          CRM + ARN IA
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AREA 03: PRODUCTOS */}
            {activeView === 'products' && <CompanyProducts />}

            {/* AREA 04: LOGÍSTICA & CONTROL DE FLOTA */}
            {activeView === 'fleet' && (
              <FleetControlCenter onMembershipActivated={loadWorkspaceMeta} />
            )}

            {/* AREA 05: ORGANIZACIÓN, EQUIPO & PLAN SAAS */}
            {activeView === 'team' && (
              <TeamSeatsManager onOrganizationUpdated={(updated) => setOrgInfo(updated)} />
            )}
          </div>
        </main>
      </div>

      {mounted && createPortal(modalContent, document.body)}

      {negotiationRfq && (
        <RfqNegotiationModal
          rfq={negotiationRfq}
          isOpen={Boolean(negotiationRfq)}
          onClose={() => setNegotiationRfq(null)}
          onAward={async () => {
            try {
              const token = await auth.getToken();
              const res = await fetch(`${getApiUrl()}/api/rfqs/${negotiationRfq.id}/award`, {
                method: 'POST',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
              });
              if (res.ok) {
                setRfqs((prev) =>
                  prev.map((r) => (r.id === negotiationRfq.id ? { ...r, status: 'awarded' } : r))
                );
              }
            } catch (err) {
              console.error('Error awarding RFQ in production DB:', err);
            }
          }}
        />
      )}

      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 z-[9999] bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 dark:border-white/20"
          >
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <div>
              <p className="font-bold text-sm">Match Directo Exitoso</p>
              <p className="text-xs opacity-80">Notificando a proveedores verificados...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
