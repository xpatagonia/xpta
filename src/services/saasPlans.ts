export type PymePlanSlug = "gratis" | "pro" | "corporativo";

export interface SaasPlanConfig {
  slug: PymePlanSlug;
  membershipLabel: string;
  displayName: string;
  seatLimit: number;
  priceMonthlyArs: number;
  priceLabel: string;
  tier: number;
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

export function canAccessLogisticsSuite(params: {
  logisticsPlanActive?: boolean;
  membershipName?: string | null;
  userCategory?: string | null;
  roleName?: string | null;
}): boolean {
  if (params.logisticsPlanActive) return true;
  const membership = String(params.membershipName || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (membership.includes("logist")) return true;
  if (params.roleName === "system_admin") return true;
  return false;
}
