export type PymePlanSlug = "gratis" | "autonomo" | "pro" | "corporativo";

export type SaasModuleSlug =
  | "logistica_flota"
  | "warehousing"
  | "kyb_compliance"
  | "erp_sync"
  | "ecommerce_b2b"
  | "chat_b2b";

export interface SaasPlanConfig {
  slug: PymePlanSlug;
  membershipLabel: string;
  displayName: string;
  seatLimit: number;
  priceMonthlyArs: number;
  priceLabel: string;
  tier: number;
}

export interface SaasModuleConfig {
  slug: SaasModuleSlug;
  billingSlug: string;
  title: string;
  shortName: string;
  priceMonthlyArs: number;
  priceLabel: string;
  includedInPlans: PymePlanSlug[];
  routePath: string;
  description: string;
  highlights: string[];
}

export const SAAS_PLANS: Record<PymePlanSlug, SaasPlanConfig> = {
  gratis: {
    slug: "gratis",
    membershipLabel: "Basic",
    displayName: "Plan Gratis / Inicial",
    seatLimit: 2,
    priceMonthlyArs: 0,
    priceLabel: "Gratis (hasta 2 usuarios)",
    tier: 1,
  },
  autonomo: {
    slug: "autonomo",
    membershipLabel: "Autónomo",
    displayName: "Plan Autónomos & Profesionales",
    seatLimit: 1,
    priceMonthlyArs: 24900,
    priceLabel: "$24.900 ARS/mes",
    tier: 2,
  },
  pro: {
    slug: "pro",
    membershipLabel: "Pro Industria",
    displayName: "Plan Pro Industria",
    seatLimit: 5,
    priceMonthlyArs: 65000,
    priceLabel: "$65.000 ARS/mes",
    tier: 2,
  },
  corporativo: {
    slug: "corporativo",
    membershipLabel: "Corporativo",
    displayName: "Plan Corporativo",
    seatLimit: 10,
    priceMonthlyArs: 140000,
    priceLabel: "$140.000 ARS/mes",
    tier: 3,
  },
};

export const LOGISTICS_MEMBERSHIP = {
  slug: "logistica_flota",
  displayName: "Membresía Logística & Control de Flota",
  priceMonthlyArs: 95000,
  priceLabel: "$95.000 ARS/mes",
  seatLimit: 10,
};

export const PLAN_RESOURCE_LIMITS: Record<
  PymePlanSlug,
  { maxProducts: number; maxRfqsMonthly: number; aiAccessLevel: "standard" | "advanced" | "predictive" }
> = {
  gratis: { maxProducts: 10, maxRfqsMonthly: 3, aiAccessLevel: "standard" },
  autonomo: { maxProducts: 25, maxRfqsMonthly: 10, aiAccessLevel: "standard" },
  pro: { maxProducts: 100, maxRfqsMonthly: 25, aiAccessLevel: "advanced" },
  corporativo: { maxProducts: 999999, maxRfqsMonthly: 999999, aiAccessLevel: "predictive" },
};

export const INCLUDED_MODULES_BY_PLAN: Record<PymePlanSlug, SaasModuleSlug[]> = {
  gratis: ["chat_b2b"],
  autonomo: ["chat_b2b"],
  pro: ["ecommerce_b2b", "chat_b2b"],
  corporativo: ["warehousing", "kyb_compliance", "erp_sync", "ecommerce_b2b", "chat_b2b"],
};

export const SAAS_MODULES: Record<SaasModuleSlug, SaasModuleConfig> = {
  logistica_flota: {
    slug: "logistica_flota",
    billingSlug: "logistica_flota",
    title: "Logística Pro, Rutas OSRM & Bolsa de Cargas",
    shortName: "Logística Pro & OSRM",
    priceMonthlyArs: 95000,
    priceLabel: "$95.000 ARS/mes",
    includedInPlans: [],
    routePath: "/logistica",
    description:
      "Motor vial OSRM real sobre Patagonia, cálculo de diésel y peajes, Bolsa de Cargas y Retornos Vacíos (-35%), padrón de flota/choferes LINTI y remitos QR.",
    highlights: [
      "Cálculo vial OSRM dedicado y OpenStreetMap",
      "Publicación y postulación directa en Bolsa de Cargas",
      "Alertas de VTV 15 días, licencias LINTI y contratos digitales",
    ],
  },
  warehousing: {
    slug: "warehousing",
    billingSlug: "warehousing",
    title: "Warehousing WMS & Cámaras de Frío",
    shortName: "Warehousing WMS",
    priceMonthlyArs: 45000,
    priceLabel: "$45.000 ARS/mes",
    includedInPlans: ["corporativo"],
    routePath: "/warehousing",
    description:
      "Control multi-depósito (CABA, Comodoro, Neuquén), gestión de SKUs, alertas de quiebre de stock, reserva de bahías de frío y despacho PDF.",
    highlights: [
      "Inventario multi-sede en tiempo real conectado a Postgres",
      "Reserva de muelles de carga y monitoreo de cámaras frigoríficas",
      "Incluido sin cargo en Plan Corporativo",
    ],
  },
  kyb_compliance: {
    slug: "kyb_compliance",
    billingSlug: "kyb_compliance",
    title: "Validación KYB (ARCA/BCRA) & Vendor Pack PDF",
    shortName: "Compliance KYB",
    priceMonthlyArs: 35000,
    priceLabel: "$35.000 ARS/mes",
    includedInPlans: ["corporativo"],
    routePath: "/perfil-empresa",
    description:
      "Auditoría fiscal por CUIT ante ARCA, situación crediticia BCRA en tiempo real, extracción de códigos CLAE y descarga oficial de Vendor Pack PDF.",
    highlights: [
      "Consulta fiscal ARCA y central de deudores BCRA",
      "Emisión de sello Verificado oficial y legajo de proveedor",
      "Incluido sin cargo en Plan Corporativo",
    ],
  },
  erp_sync: {
    slug: "erp_sync",
    billingSlug: "erp_sync",
    title: "ADN Vectorial pgvector & Conector Odoo / n8n",
    shortName: "Odoo ERP & ADN IA",
    priceMonthlyArs: 55000,
    priceLabel: "$55.000 ARS/mes",
    includedInPlans: ["corporativo"],
    routePath: "/dashboard",
    description:
      "Matching semántico vectorial entre oferta y demanda industrial patagónica junto a sincronización bidireccional de clientes y oportunidades con Odoo ERP.",
    highlights: [
      "Webhooks en tiempo real hacia Odoo VPS y flujos n8n",
      "Matching vectorial de contratos por similitud productiva",
      "Incluido sin cargo en Plan Corporativo",
    ],
  },
  ecommerce_b2b: {
    slug: "ecommerce_b2b",
    billingSlug: "ecommerce_b2b",
    title: "E-commerce Mayorista & Portal de Ventas B2B",
    shortName: "E-commerce B2B",
    priceMonthlyArs: 29900,
    priceLabel: "$29.900 ARS/mes",
    includedInPlans: ["pro", "corporativo"],
    routePath: "/ecommerce",
    description:
      "Publicación de catálogo mayorista con precios escalonados, pedidos de reposición recurrente, licitaciones y control de stock mínimo.",
    highlights: [
      "Precios base y mayoristas diferenciados por CUIT",
      "Catálogo indexado en Marketplace B2B y comparador RFQ",
      "Incluido sin cargo en Plan Pro Industria y Corporativo",
    ],
  },
  chat_b2b: {
    slug: "chat_b2b",
    billingSlug: "chat_b2b",
    title: "Patagonia Link · Mensajería & Mesas de Negociación",
    shortName: "Chat B2B",
    priceMonthlyArs: 19900,
    priceLabel: "$19.900 ARS/mes",
    includedInPlans: ["gratis", "autonomo", "pro", "corporativo"],
    routePath: "/chat",
    description:
      "Comunicación directa entre empresas registradas en Zona de Miembros con tarjetas de licitación RFQ vinculadas y salas sectoriales.",
    highlights: [
      "Exclusivo para empresas y profesionales registrados (oculto al público)",
      "Hilos persistentes por corredor, logística y compras",
      "Salas privadas y videollamadas para miembros verificados",
    ],
  },
};

export const ALL_MODULE_SLUGS: SaasModuleSlug[] = [
  "logistica_flota",
  "warehousing",
  "kyb_compliance",
  "erp_sync",
  "ecommerce_b2b",
  "chat_b2b",
];

export function resolvePlanConfig(input?: string | null): SaasPlanConfig {
  const normalized = String(input || "gratis").trim().toLowerCase();
  if (
    normalized === "corporativo" ||
    normalized === "enterprise" ||
    normalized.includes("corporativo")
  ) {
    return SAAS_PLANS.corporativo;
  }
  if (
    normalized === "autonomo" ||
    normalized === "autónomo" ||
    normalized === "independiente" ||
    normalized.includes("autonom") ||
    normalized.includes("autónom")
  ) {
    return SAAS_PLANS.autonomo;
  }
  if (
    normalized === "pro" ||
    normalized === "premium" ||
    normalized.includes("pro")
  ) {
    return SAAS_PLANS.pro;
  }
  return SAAS_PLANS.gratis;
}

export function canAddOrganizationSeat(
  currentUsedSeats: number,
  seatLimit: number
): { allowed: boolean; remaining: number; reason?: string } {
  const used = Math.max(0, Number(currentUsedSeats) || 0);
  const limit = Math.max(1, Number(seatLimit) || 2);
  const remaining = Math.max(0, limit - used);
  if (used >= limit) {
    return {
      allowed: false,
      remaining: 0,
      reason: `Alcanzaste el límite de ${limit} usuarios de tu plan actual. Actualizá tu plan o liberá un asiento para invitar a otro miembro.`,
    };
  }
  return { allowed: true, remaining };
}

export function normalizeModuleSlug(raw?: string | null): SaasModuleSlug | null {
  const clean = String(raw || "")
    .trim()
    .toLowerCase();
  if (!clean) return null;
  if (clean === "logistica" || clean === "logistica_flota" || clean === "fleet") {
    return "logistica_flota";
  }
  if (clean === "warehousing" || clean === "wms") return "warehousing";
  if (clean === "kyb" || clean === "kyb_compliance" || clean === "compliance") {
    return "kyb_compliance";
  }
  if (clean === "erp" || clean === "erp_sync" || clean === "odoo") return "erp_sync";
  if (clean === "ecommerce" || clean === "ecommerce_b2b") return "ecommerce_b2b";
  if (clean === "chat" || clean === "chat_b2b") return "chat_b2b";
  return null;
}

export function canAccessLogisticsSuite(params: {
  logisticsPlanActive?: boolean;
  membershipName?: string | null;
  userCategory?: string | null;
  roleName?: string | null;
  rawActiveModules?: unknown;
}): boolean {
  if (params.logisticsPlanActive) return true;
  if (Array.isArray(params.rawActiveModules)) {
    for (const item of params.rawActiveModules) {
      if (normalizeModuleSlug(String(item || "")) === "logistica_flota") return true;
    }
  }
  const membership = String(params.membershipName || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (membership.includes("logist")) return true;
  if (params.roleName === "system_admin") return true;
  return false;
}

export function resolveEffectiveModules(params: {
  planSlug?: string | null;
  logisticsPlanActive?: boolean;
  rawActiveModules?: unknown;
  membershipName?: string | null;
  roleName?: string | null;
}): SaasModuleSlug[] {
  if (params.roleName === "system_admin") {
    return [...ALL_MODULE_SLUGS];
  }

  const resolvedPlan = resolvePlanConfig(params.planSlug || params.membershipName);
  const set = new Set<SaasModuleSlug>(INCLUDED_MODULES_BY_PLAN[resolvedPlan.slug] || []);

  if (Array.isArray(params.rawActiveModules)) {
    for (const entry of params.rawActiveModules) {
      const normalized = normalizeModuleSlug(String(entry || ""));
      if (normalized) set.add(normalized);
    }
  } else if (typeof params.rawActiveModules === "string") {
    try {
      const parsed = JSON.parse(params.rawActiveModules);
      if (Array.isArray(parsed)) {
        for (const entry of parsed) {
          const normalized = normalizeModuleSlug(String(entry || ""));
          if (normalized) set.add(normalized);
        }
      }
    } catch {
      // ignore invalid JSON
    }
  }

  if (
    canAccessLogisticsSuite({
      logisticsPlanActive: params.logisticsPlanActive,
      membershipName: params.membershipName,
      roleName: params.roleName,
      rawActiveModules: params.rawActiveModules,
    })
  ) {
    set.add("logistica_flota");
  }

  return ALL_MODULE_SLUGS.filter((slug) => set.has(slug));
}

export function buildEntitlementsMap(
  modules: SaasModuleSlug[]
): Record<SaasModuleSlug, boolean> {
  const set = new Set(modules);
  return {
    logistica_flota: set.has("logistica_flota"),
    warehousing: set.has("warehousing"),
    kyb_compliance: set.has("kyb_compliance"),
    erp_sync: set.has("erp_sync"),
    ecommerce_b2b: set.has("ecommerce_b2b"),
    chat_b2b: set.has("chat_b2b"),
  };
}

export function hasModuleEntitlement(
  params: {
    planSlug?: string | null;
    logisticsPlanActive?: boolean;
    rawActiveModules?: unknown;
    activeModules?: SaasModuleSlug[];
    membershipName?: string | null;
    roleName?: string | null;
  },
  moduleSlug: SaasModuleSlug
): boolean {
  if (params.roleName === "system_admin") return true;
  if (Array.isArray(params.activeModules)) {
    return params.activeModules.includes(moduleSlug);
  }
  return resolveEffectiveModules(params).includes(moduleSlug);
}
