import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  ShoppingCart,
  Building2,
  MapPin,
  Package,
  Shield,
  Settings,
  Check,
  Trash2,
  Send,
  Video,
  Droplets,
  Anchor,
  Utensils,
  Pickaxe,
  Zap,
  Cpu,
  Hammer,
  Sprout,
  Wrench,
  Truck,
  Flame,
  MessageSquare,
  Lock,
  Unlock,
  Crown,
  Database,
  CheckCircle2,
} from 'lucide-react';
import { db, collection, query, onSnapshot } from '../lib/db';
import { supabase } from '../lib/supabase';
import { MAIN_CATEGORIES } from '../lib/categories';
import {
  B2B_COMPANIES,
  TIER_CONFIG,
  syncCompanyToUserCRM,
  SubscriptionTier,
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

const CATEGORIES = [
  { id: 'all', name: 'Todos los sectores' },
  ...MAIN_CATEGORIES.map((cat) => ({
    id: cat,
    name: cat,
    icon: CATEGORY_ICONS[cat] || Package,
  })),
];

const DEFAULT_TIERED_PRODUCTS = [
  {
    id: 'prod-corp-1',
    name: 'Válvula Esférica Acero Forjado 4" Serie ANSI 600 API 6D',
    sku: 'PS-API6D-400',
    brand: 'PetroSur Flow',
    category: 'Hidrocarburos (Oil & Gas)',
    supplier: 'PetroSur Ingeniería & Fluidos S.A.',
    companyId: 'comp-petrosur',
    tier: 'corporativo' as SubscriptionTier,
    tierPriority: 1,
    verified: true,
    location: 'Añelo, Neuquén',
    description:
      'Válvula de bloqueo de paso total certificada API 6D para líneas de alta presión en yacimientos de gas y petróleo no convencional.',
    condition: 'Nuevo',
    warranty: '24 meses',
    priceBase: 3850000,
    taxRate: 21,
    moq: 2,
    leadTime: 'Inmediata (Base Añelo)',
    paymentMethods: ['Cta. Cte. 30/60d', 'Echeq', 'Factura MiPyME'],
    shippingConditions: ['Flete Propio a Yacimiento', 'Retiro en Base'],
    videoUrl: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
    image:
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=700',
  },
  {
    id: 'prod-corp-2',
    name: 'Servicio de Transporte Refrigerado -25°C y Consolidación Portuaria',
    sku: 'LA-FRIO-25',
    brand: 'Logística Austral',
    category: 'Logística',
    supplier: 'Logística Austral Multimodal S.R.L.',
    companyId: 'comp-logistica-austral',
    tier: 'corporativo' as SubscriptionTier,
    tierPriority: 1,
    verified: true,
    location: 'Puerto Madryn / Comodoro, Chubut',
    description:
      'Tramo completo o consolidado de contenedores reefer con telemetría satelital de temperatura para exportación pesquera e insumos críticos.',
    condition: 'Nuevo',
    warranty: 'Seguro Total de Carga',
    priceBase: 1920000,
    taxRate: 21,
    moq: 1,
    leadTime: 'Programación 24 hs',
    paymentMethods: ['Convenio Corporativo', 'Echeq 30 días'],
    shippingConditions: ['Corredor Ruta 3 / Ruta 40', 'Puertos Patagónicos'],
    image:
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=700',
  },
  {
    id: 'prod-corp-3',
    name: 'Tablero de Transferencia y Subestación Compacta 500 kVA',
    sku: 'RP-SUB-500',
    brand: 'RenovaPatagonia',
    category: 'Energías Renovables',
    supplier: 'RenovaPatagonia Electromecánica S.A.',
    companyId: 'comp-eolica-sur',
    tier: 'corporativo' as SubscriptionTier,
    tierPriority: 1,
    verified: true,
    location: 'Río Gallegos, Santa Cruz',
    description:
      'Unidad compacta para integración de generación híbrida eólica-solar en campamentos mineros, petroleros y plantas industriales.',
    condition: 'Nuevo',
    warranty: '36 meses',
    priceBase: 14500000,
    taxRate: 10.5,
    moq: 1,
    leadTime: '15 días hábiles',
    paymentMethods: ['Certificación de Obra', 'Transferencia'],
    shippingConditions: ['Carretón Especial Incluido'],
    image:
      'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&q=80&w=700',
  },
  {
    id: 'prod-pro-1',
    name: 'Skid Metálico de Bombeo Certificado ASME IX',
    sku: 'MG-SKID-09',
    brand: 'MetalGolfo',
    category: 'Metalúrgica',
    supplier: 'Metalúrgica Golfo San Jorge S.A.',
    companyId: 'comp-metalurgica-andina',
    tier: 'pro' as SubscriptionTier,
    tierPriority: 2,
    verified: true,
    location: 'Comodoro Rivadavia, Chubut',
    description:
      'Estructura metálica granallada con esquema epoxi marino y colectores soldados bajo norma ASME IX con ensayos no destructivos.',
    condition: 'Nuevo',
    warranty: '12 meses',
    priceBase: 6400000,
    taxRate: 21,
    moq: 1,
    leadTime: '20 días',
    paymentMethods: ['50% Anticipo / 50% Echeq'],
    shippingConditions: ['FOB Parque Industrial Comodoro'],
    image:
      'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&q=80&w=700',
  },
  {
    id: 'prod-pro-2',
    name: 'Kit de Envases Isotérmicos y Pallets Plásticos Grado Alimenticio',
    sku: 'NP-ISO-100',
    brand: 'Navales Australes',
    category: 'Industria Pesquera',
    supplier: 'Servicios Navales & Pesqueros Australes S.R.L.',
    companyId: 'comp-austral-naval',
    tier: 'pro' as SubscriptionTier,
    tierPriority: 2,
    verified: true,
    location: 'Ushuaia, Tierra del Fuego',
    description:
      'Lote de contenedores isotérmicos tricapa aprobados por SENASA para procesamiento de langostino, merluza y centolla en planta o buque.',
    condition: 'Nuevo',
    warranty: '12 meses',
    priceBase: 980000,
    taxRate: 21,
    moq: 10,
    leadTime: 'Stock Inmediato',
    paymentMethods: ['Cta. Cte. 30 días', 'Transferencia'],
    shippingConditions: ['Despacho Austral'],
    image:
      'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&q=80&w=700',
  },
  {
    id: 'prod-ini-1',
    name: 'Mameluco Ignífugo Certificado NFPA 2112 Arco Eléctrico',
    sku: 'EPP-IGN-2112',
    brand: 'EPP Sur',
    category: 'Seguridad e Higiene (EPP)',
    supplier: 'Seguridad Industrial Sur & EPP S.R.L.',
    companyId: 'comp-seguridad-epp',
    tier: 'inicial' as SubscriptionTier,
    tierPriority: 3,
    verified: false,
    location: 'Neuquén Capital',
    description:
      'Indumentaria ignífuga inherente para operarios de pozo, refinería y mantenimiento eléctrico con cintas reflectivas de alta visibilidad.',
    condition: 'Nuevo',
    warranty: '6 meses',
    priceBase: 185000,
    taxRate: 21,
    moq: 15,
    leadTime: '48 hs',
    paymentMethods: ['Contado', 'Echeq 15 días'],
    shippingConditions: ['Envío a Sucursal / Base'],
    image:
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=700',
  },
];

export default function Marketplace() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeBrand, setActiveBrand] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [crmToast, setCrmToast] = useState<string | null>(null);
  const [isSubscribedMember, setIsSubscribedMember] = useState(false);
  const [productsDb, setProductsDb] = useState<any[]>(DEFAULT_TIERED_PRODUCTS);
  const [sortBy, setSortBy] = useState('Jerarquía de Plan');
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setIsSubscribedMember(true);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) setIsSubscribedMember(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const prods: any[] = [];
        querySnapshot.forEach((doc) => {
          const d = doc.data();
          prods.push({
            id: doc.id,
            tier: d.tier || 'pro',
            tierPriority: d.tierPriority || 2,
            ...d,
          });
        });
        const existingIds = new Set(prods.map((p) => p.id));
        const merged = [
          ...prods,
          ...DEFAULT_TIERED_PRODUCTS.filter((p) => !existingIds.has(p.id)),
        ];
        setProductsDb(merged);
      },
      (error) => {
        console.error('Error fetching products', error);
      }
    );

    return () => unsubscribe();
  }, []);

  const uniqueBrands = Array.from(
    new Set(productsDb.filter((p) => !!p.brand).map((p) => p.brand))
  ).sort();

  const filteredProducts = productsDb
    .filter((product) => {
      const matchesCategory =
        activeCategory === 'all' || product.category === activeCategory;
      const matchesBrand =
        activeBrand === 'all' || product.brand === activeBrand;
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.supplier &&
          product.supplier.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (product.brand &&
          product.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (product.sku &&
          product.sku.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesBrand && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'Jerarquía de Plan') {
        const prioA = a.tierPriority ?? 2;
        const prioB = b.tierPriority ?? 2;
        if (prioA !== prioB) return prioA - prioB;
        return 0;
      }
      if (sortBy === 'Menor Precio') {
        return (a.priceBase || 0) - (b.priceBase || 0);
      }
      if (sortBy === 'Mayor Precio') {
        return (b.priceBase || 0) - (a.priceBase || 0);
      }
      return 0;
    });

  const handleQuoteRequest = (product: any) => {
    if (!isSubscribedMember) {
      navigate('/planes');
      return;
    }
    if (!cartItems.find((item) => item.id === product.id)) {
      setCartItems([...cartItems, { ...product, quantity: 1 }]);
    }
  };

  const handleSyncSupplierCRM = async (product: any) => {
    if (!isSubscribedMember) {
      navigate('/planes');
      return;
    }
    const matchedCompany =
      B2B_COMPANIES.find(
        (c) => c.id === product.companyId || c.name === product.supplier
      ) || B2B_COMPANIES[0];
    const res = await syncCompanyToUserCRM(matchedCompany);
    if (res.success) {
      setCrmToast(res.message);
      setTimeout(() => setCrmToast(null), 4000);
    }
  };

  const handleRemoveFromCart = (id: string) => {
    setCartItems(cartItems.filter((item) => item.id !== id));
  };

  const handleSubmitRFQ = () => {
    setCartItems([]);
    setIsCartOpen(false);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A080C] pt-20 pb-16">
      {/* Top Member Access Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 mb-6">
        <div className="rounded-2xl bg-slate-900 text-white p-4 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isSubscribedMember
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-orange-500/20 text-orange-400'
              }`}
            >
              {isSubscribedMember ? (
                <Unlock className="w-4 h-4" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
            </div>
            <div className="text-xs">
              <span className="font-bold uppercase tracking-wider block">
                {isSubscribedMember
                  ? 'Catálogo B2B Desbloqueado: Precios Mayoristas + Emisión RFQ + Sync CRM'
                  : 'Vista Pública Limitada: Precios Netos y Emisión de RFQs Reservados para Miembros'}
              </span>
              <span className="text-slate-400">
                Proveedores ordenados por jerarquía de suscripción (Plan Corporativo &rarr; Plan Pro Industrial &rarr; Plan Inicial).
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsSubscribedMember(!isSubscribedMember)}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold uppercase tracking-wider transition-colors"
            >
              {isSubscribedMember
                ? 'Ver como Visitante Público'
                : 'Simular Acceso Miembro Suscripto'}
            </button>
          </div>
        </div>
      </div>

      {/* Header Section */}
      <div className="bg-white dark:bg-[#1A1625] border-y border-slate-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-2">
                Marketplace & Suministros B2B
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
                Catálogo técnico conectado al CRM corporativo. Emite solicitudes multiproveedor (RFQ) e integra proveedores validados.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-3 bg-slate-100 dark:bg-black/20 rounded-xl hover:bg-slate-200 dark:hover:bg-black/40 transition-colors text-slate-700 dark:text-slate-300"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                    {cartItems.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setIsCartOpen(true)}
                className="px-5 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold uppercase tracking-wider transition-colors text-xs"
              >
                Borrador RFQ ({cartItems.length})
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-6 relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por equipo, repuesto, código SKU o empresa proveedora..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-orange-500/50 outline-none transition-all text-sm text-slate-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar / Filters */}
          <div className="w-full lg:w-64 shrink-0 space-y-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Filter className="w-4 h-4 text-orange-500" /> Rubros Industriales
              </h3>
              <div className="space-y-1.5">
                {CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`w-full text-left px-3.5 py-2 rounded-xl text-xs transition-colors ${
                      activeCategory === category.id
                        ? 'bg-orange-500 text-white font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200 dark:border-white/10">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-purple-500" /> Marcas / Fabricantes
              </h3>
              <select
                value={activeBrand}
                onChange={(e) => setActiveBrand(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-[#1A1625] border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white outline-none"
              >
                <option value="all">Todas las marcas</option>
                {uniqueBrands.map((brand) => (
                  <option key={brand as string} value={brand as string}>
                    {brand}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1">
            <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
              <p className="text-xs text-slate-500">
                Mostrando{' '}
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  {filteredProducts.length}
                </span>{' '}
                suministros ordenados por plan de suscripción
              </p>

              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                <span>Ordenar por:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-white dark:bg-[#1A1625] border border-slate-200 dark:border-white/10 px-3 py-1.5 rounded-lg font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
                >
                  <option value="Jerarquía de Plan">
                    Jerarquía de Plan (Corporativo &rarr; Inicial)
                  </option>
                  <option value="Menor Precio">Menor Precio</option>
                  <option value="Mayor Precio">Mayor Precio</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredProducts.map((product) => {
                const tierKey: SubscriptionTier =
                  product.tier || 'pro';
                const tierMeta = TIER_CONFIG[tierKey] || TIER_CONFIG.pro;

                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-white dark:bg-[#1A1625] rounded-2xl overflow-hidden border ${tierMeta.borderAccent} shadow-sm hover:shadow-md transition-all flex flex-col justify-between group`}
                  >
                    <div>
                      <div className="h-48 overflow-hidden relative bg-slate-900">
                        <img
                          src={
                            product.image ||
                            'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=600'
                          }
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 left-3 flex items-center gap-1.5">
                          <span
                            className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-md bg-black/75 text-white flex items-center gap-1`}
                          >
                            {tierKey === 'corporativo' && (
                              <Crown className="w-3 h-3 text-purple-400" />
                            )}
                            {tierMeta.label}
                          </span>
                        </div>
                        {product.sku && (
                          <div className="absolute top-3 right-3">
                            <span className="px-2 py-1 bg-black/75 backdrop-blur-sm text-[10px] font-mono font-bold uppercase rounded-md text-slate-200">
                              {product.sku}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="p-5">
                        <h3 className="text-base font-display font-bold text-slate-900 dark:text-white leading-snug mb-2 line-clamp-2">
                          {product.name}
                        </h3>

                        <div className="flex flex-col gap-1 mb-3">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                            <span className="text-xs text-slate-700 dark:text-slate-200 font-bold flex items-center gap-1">
                              {product.supplier || 'Proveedor Verificado'}
                              {product.verified && (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              )}
                            </span>
                          </div>
                          {product.location && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="text-[11px] text-slate-500">
                                {product.location}
                              </span>
                            </div>
                          )}
                        </div>

                        {product.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">
                            {product.description}
                          </p>
                        )}

                        {product.videoUrl && (
                          <div className="mb-4">
                            <a
                              href={product.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-600 dark:text-red-400 text-[11px] font-bold rounded-lg border border-red-500/20 hover:bg-red-500/20 transition-colors"
                            >
                              <Video className="w-3.5 h-3.5" />
                              Video Técnico (YouTube)
                            </a>
                          </div>
                        )}

                        {/* Pricing & Commercial Terms Block: Member Gated */}
                        {isSubscribedMember ? (
                          <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/5 mb-4">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-500">
                                Precio Neto Mayorista
                              </span>
                              <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                                {product.priceBase
                                  ? `$${product.priceBase.toLocaleString('es-AR')} ARS`
                                  : 'A cotizar'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-500">MOQ / Entrega</span>
                              <span className="font-mono text-slate-700 dark:text-slate-300">
                                Mín. {product.moq || 1} u. •{' '}
                                {product.leadTime || 'A coordinar'}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/5 mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Lock className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                              <span>Precio Neto y Condiciones CRM</span>
                            </div>
                            <Link
                              to="/planes"
                              className="text-[11px] font-bold text-orange-500 hover:underline"
                            >
                              Solo Suscriptos &rarr;
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="px-5 pb-5 pt-0 space-y-2">
                      {isSubscribedMember ? (
                        <>
                          <button
                            onClick={() => handleQuoteRequest(product)}
                            disabled={!!cartItems.find((i) => i.id === product.id)}
                            className={`w-full py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs transition-colors flex items-center justify-center gap-2 ${
                              cartItems.find((i) => i.id === product.id)
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : 'bg-orange-500 hover:bg-orange-600 text-white'
                            }`}
                          >
                            <ShoppingCart className="w-4 h-4" />
                            {cartItems.find((i) => i.id === product.id)
                              ? 'En Borrador RFQ'
                              : 'Agregar a Solicitud (RFQ)'}
                          </button>

                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => handleSyncSupplierCRM(product)}
                              className="py-2 px-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/20 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <Database className="w-3.5 h-3.5" /> Sync CRM
                            </button>
                            <Link
                              to="/chat"
                              className="py-2 px-3 rounded-xl border border-slate-200 dark:border-white/10 hover:border-orange-500 text-slate-700 dark:text-slate-300 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-orange-500" />
                              Chat B2B
                            </Link>
                          </div>
                        </>
                      ) : (
                        <Link
                          to="/planes"
                          className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                        >
                          <Lock className="w-3.5 h-3.5 text-orange-500" />
                          Suscribirse para Operar y Cotizar
                        </Link>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Cart / RFQ Drawer Modal */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-[9998] flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsCartOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              className="relative w-full max-w-md h-full z-[9999] bg-white dark:bg-[#1A1625] shadow-2xl border-l border-slate-200 dark:border-white/10 flex flex-col"
            >
              <div className="p-6 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-orange-500" />
                  Borrador de Solicitud (RFQ)
                </h2>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white"
                >
                  Cerrar
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cartItems.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <p className="text-sm font-bold text-slate-500">
                      No hay suministros en tu solicitud RFQ.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-slate-500 bg-orange-500/10 p-3 rounded-xl border border-orange-500/20">
                      Al emitir esta solicitud, se notificará directamente al correo corporativo y bandeja CRM de cada empresa proveedora.
                    </p>
                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex gap-3 items-center bg-slate-50 dark:bg-[#110E17] p-3 rounded-xl border border-slate-200 dark:border-white/5"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-14 h-14 object-cover rounded-lg"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {item.name}
                          </h4>
                          <p className="text-[10px] font-bold text-slate-500 truncate">
                            {item.supplier}
                          </p>
                          <p className="text-xs font-mono font-bold text-orange-500">
                            ${(item.priceBase || 0).toLocaleString('es-AR')}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveFromCart(item.id)}
                          className="p-2 text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </div>

              <div className="p-6 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17]">
                <button
                  onClick={handleSubmitRFQ}
                  disabled={cartItems.length === 0}
                  className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-bold uppercase tracking-wider text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" /> Emitir Solicitudes al CRM
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toasts */}
      <AnimatePresence>
        {(showSuccessToast || crmToast) && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-6 right-6 z-[9999] bg-slate-900 text-white px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/15 max-w-md"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="text-xs">
              <p className="font-bold">
                {crmToast ? 'Proveedor Integrado al CRM' : 'RFQ Emitido con Éxito'}
              </p>
              <p className="text-slate-300">
                {crmToast ||
                  'Las empresas proveedoras han recibido tu solicitud en su bandeja de entrada.'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
