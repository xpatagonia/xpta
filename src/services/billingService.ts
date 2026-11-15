import crypto from "crypto";
import { pool, hasDatabaseConfig } from "../db/index.ts";
import {
  SAAS_PLANS,
  LOGISTICS_MEMBERSHIP,
  SAAS_MODULES,
  resolvePlanConfig,
  normalizeModuleSlug,
} from "./saasPlans.ts";
import { ensureProductionTables } from "./arnSchema.ts";

export interface BillingCatalogItem {
  targetType: "plan" | "logistics" | "module";
  slug: string;
  title: string;
  amountArs: number;
}

export const BILLING_CATALOG: Record<string, BillingCatalogItem> = {
  pro: {
    targetType: "plan",
    slug: "pro",
    title: SAAS_PLANS.pro.displayName,
    amountArs: SAAS_PLANS.pro.priceMonthlyArs,
  },
  corporativo: {
    targetType: "plan",
    slug: "corporativo",
    title: SAAS_PLANS.corporativo.displayName,
    amountArs: SAAS_PLANS.corporativo.priceMonthlyArs,
  },
  logistica_flota: {
    targetType: "logistics",
    slug: "logistica_flota",
    title: LOGISTICS_MEMBERSHIP.displayName,
    amountArs: LOGISTICS_MEMBERSHIP.priceMonthlyArs,
  },
  logistica: {
    targetType: "module",
    slug: "logistica",
    title: "Módulo Logística Integral y Transporte",
    amountArs: 29900,
  },
  warehousing: {
    targetType: "module",
    slug: "warehousing",
    title: SAAS_MODULES.warehousing.title,
    amountArs: SAAS_MODULES.warehousing.priceMonthlyArs,
  },
  kyb_compliance: {
    targetType: "module",
    slug: "kyb_compliance",
    title: SAAS_MODULES.kyb_compliance.title,
    amountArs: SAAS_MODULES.kyb_compliance.priceMonthlyArs,
  },
  erp_sync: {
    targetType: "module",
    slug: "erp_sync",
    title: SAAS_MODULES.erp_sync.title,
    amountArs: SAAS_MODULES.erp_sync.priceMonthlyArs,
  },
  ecommerce_b2b: {
    targetType: "module",
    slug: "ecommerce_b2b",
    title: SAAS_MODULES.ecommerce_b2b.title,
    amountArs: SAAS_MODULES.ecommerce_b2b.priceMonthlyArs,
  },
  chat_b2b: {
    targetType: "module",
    slug: "chat_b2b",
    title: SAAS_MODULES.chat_b2b.title,
    amountArs: SAAS_MODULES.chat_b2b.priceMonthlyArs,
  },
};

export interface BankTransferInstructions {
  configured: boolean;
  bank: string;
  holder: string;
  cbu: string;
  alias: string;
  note: string;
}

export function getBankTransferInstructions(): BankTransferInstructions {
  const cbu = String(process.env.BANK_TRANSFER_CBU || "").trim();
  const alias = String(process.env.BANK_TRANSFER_ALIAS || "").trim();
  const holder = String(process.env.BANK_TRANSFER_HOLDER || "xPatagonia B2B").trim();
  const bank = String(process.env.BANK_TRANSFER_BANK || "Banco Corporativo").trim();

  const configured = Boolean(cbu || alias);
  return {
    configured,
    bank,
    holder,
    cbu: cbu || "Solicitar CBU verificado en administración",
    alias: alias || "Solicitar Alias verificado en administración",
    note: configured
      ? "Transferí el importe exacto e informá el número de comprobante o COELSA para activación."
      : "Cargá el número de referencia de transferencia o solicitá los datos bancarios oficiales a pagos@xpatagonia.online.",
  };
}

export function isMercadoPagoConfigured(): boolean {
  const token = String(process.env.MP_ACCESS_TOKEN || "").trim();
  return token.length > 15;
}

export function verifyMercadoPagoWebhookSignature(params: {
  signatureHeader?: string;
  requestIdHeader?: string;
  dataId?: string;
  secret?: string;
}): boolean {
  const secret = String(params.secret || process.env.MP_WEBHOOK_SECRET || "").trim();
  if (!secret) return false; // Fail-closed: webhook secret required for HMAC verification
  const header = String(params.signatureHeader || "").trim();
  if (!header || !params.dataId) return false;

  let ts = "";
  let v1 = "";
  for (const part of header.split(",")) {
    const [k, v] = part.split("=").map((s) => s.trim());
    if (k === "ts") ts = v || "";
    if (k === "v1") v1 = v || "";
  }
  if (!ts || !v1) return false;

  const manifest = `id:${params.dataId};request-id:${params.requestIdHeader || ""};ts:${ts};`;
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(v1);
  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

export async function applyApprovedBillingUpgrade(txRow: {
  id: number;
  organization_id: number | null;
  user_uid: string;
  target_type: string;
  target_slug: string;
}): Promise<void> {
  if (!hasDatabaseConfig()) return;
  await ensureProductionTables();

  let orgId = txRow.organization_id;
  if (!orgId) {
    const orgRes = await pool.query(
      `SELECT id FROM public.organizations WHERE owner_uid = $1 LIMIT 1`,
      [txRow.user_uid]
    );
    orgId = orgRes.rows?.[0]?.id ? Number(orgRes.rows[0].id) : null;
  }

  if (txRow.target_type === "plan" && orgId) {
    const plan = resolvePlanConfig(txRow.target_slug);
    await pool.query(
      `UPDATE public.organizations
       SET plan_slug = $1, seat_limit = $2, updated_at = now()
       WHERE id = $3`,
      [plan.slug, plan.seatLimit, orgId]
    );
  } else if ((txRow.target_type === "logistics" || txRow.target_type === "module") && orgId) {
    const canonicalSlug = normalizeModuleSlug(txRow.target_slug) || txRow.target_slug;
    const orgRes = await pool.query(
      `SELECT active_modules, logistics_plan_active FROM public.organizations WHERE id = $1`,
      [orgId]
    );
    const existingRaw = Array.isArray(orgRes.rows?.[0]?.active_modules)
      ? orgRes.rows[0].active_modules
      : [];
    const nextSet = new Set<string>(existingRaw.map((s: any) => String(s)));
    nextSet.add(canonicalSlug);
    const activatesLogistics =
      txRow.target_type === "logistics" || canonicalSlug === "logistica_flota";

    await pool.query(
      `UPDATE public.organizations
       SET active_modules = $1::jsonb,
           logistics_plan_active = (logistics_plan_active OR $2),
           updated_at = now()
       WHERE id = $3`,
      [JSON.stringify(Array.from(nextSet)), activatesLogistics, orgId]
    );

    await pool.query(
      `UPDATE public.module_requests
       SET status = 'approved'
       WHERE user_uid = $1 AND (module_id = $2 OR module_id = $3) AND status = 'pending'`,
      [txRow.user_uid, txRow.target_slug, canonicalSlug]
    ).catch(() => {});
  } else if (txRow.target_type === "module") {
    await pool.query(
      `UPDATE public.module_requests
       SET status = 'approved'
       WHERE user_uid = $1 AND module_id = $2 AND status = 'pending'`,
      [txRow.user_uid, txRow.target_slug]
    ).catch(() => {});
  }
}

export async function hasApprovedPaidEntitlement(params: {
  organizationId: number;
  userUid: string;
  targetType: "plan" | "logistics" | "module";
  targetSlug: string;
}): Promise<boolean> {
  if (!hasDatabaseConfig()) return false;
  await ensureProductionTables();
  const canonical = normalizeModuleSlug(params.targetSlug);
  const res = await pool.query(
    `SELECT id FROM public.billing_transactions
     WHERE status = 'approved'
       AND (target_type = $1 OR ($1 IN ('logistics', 'module') AND target_type IN ('logistics', 'module')))
       AND (target_slug = $2 OR ($5::text IS NOT NULL AND target_slug = $5))
       AND (organization_id = $3 OR user_uid = $4)
     ORDER BY updated_at DESC LIMIT 1`,
    [params.targetType, params.targetSlug, params.organizationId, params.userUid, canonical]
  );
  return (res.rows || []).length > 0;
}
