import type { Express } from "express";
import { pool, hasDatabaseConfig, formatPgError } from "../db/index.ts";
import { requireAuth, requireRoles, type AuthRequest } from "../middleware/auth.ts";
import { ensureProductionTables } from "../services/arnSchema.ts";
import {
  B2B_COMPANIES,
  B2BCompanyRecord,
  DirectoryEntityType,
  SubscriptionTier,
  TIER_CONFIG,
  sortCompaniesBySubscriptionTier,
} from "../lib/b2bDirectoryData.ts";
import {
  CompanyServiceItem,
  TaxDisplayMode,
  calculateTaxBreakdownFromGross,
  calculateTaxBreakdownFromNet,
  getDefaultSeedServicesForCompany,
  normalizeTaxDisplayMode,
  normalizeTaxRatePercent,
  taxRateBpsToPercent,
  taxRatePercentToBps,
} from "../lib/taxPricing.ts";

// Fallback in-memory storage when PostgreSQL is not configured (e.g. unit tests / preview)
const memoryOverrides = new Map<string, Record<string, any>>();
const memoryServices = new Map<string, CompanyServiceItem[]>();
let memoryServiceSeq = 5000;

function mapDbServiceRow(row: any): CompanyServiceItem {
  const netPrice = Number(row.net_price_cents || 0) / 100;
  const taxRatePercent = taxRateBpsToPercent(Number(row.tax_rate_bps ?? 2100));
  const breakdown = calculateTaxBreakdownFromNet(netPrice, taxRatePercent);
  return {
    id: Number(row.id),
    companyKey: String(row.company_key),
    serviceName: String(row.service_name || ""),
    category: String(row.category || "Servicios"),
    unitLabel: String(row.unit_label || "Servicio"),
    currency: row.currency === "USD" ? "USD" : "ARS",
    netPrice: breakdown.netPrice,
    taxRatePercent: breakdown.taxRatePercent,
    taxRateBps: breakdown.taxRateBps,
    taxAmount: breakdown.taxAmount,
    grossPrice: breakdown.grossPrice,
    taxDisplayMode: normalizeTaxDisplayMode(row.tax_display_mode),
    active: row.active !== false,
  };
}

function resolveTierMeta(tierInput?: string | null): {
  tier: SubscriptionTier;
  tierPriority: number;
  tierLabel: string;
} {
  const t = String(tierInput || "").toLowerCase();
  if (t === "corporativo") {
    return { tier: "corporativo", tierPriority: 1, tierLabel: TIER_CONFIG.corporativo.label };
  }
  if (t === "pro") {
    return { tier: "pro", tierPriority: 2, tierLabel: TIER_CONFIG.pro.label };
  }
  return { tier: "inicial", tierPriority: 3, tierLabel: TIER_CONFIG.inicial.label };
}

export async function loadMergedDirectoryRecords(options?: {
  includeInactive?: boolean;
}): Promise<B2BCompanyRecord[]> {
  let dbCompanies: B2BCompanyRecord[] = [];
  const overridesMap = new Map<string, any>(memoryOverrides);
  const servicesByCompany = new Map<string, CompanyServiceItem[]>();

  if (hasDatabaseConfig()) {
    try {
      await ensureProductionTables();
      const [profilesRes, overridesRes, servicesRes] = await Promise.all([
        pool.query(`
          SELECT cp.*, u.email AS user_email
          FROM public.company_profiles cp
          LEFT JOIN public.users u ON u.uid = cp.user_uid
          WHERE cp.company_name IS NOT NULL AND cp.company_name != ''
          ORDER BY cp.trust_score DESC, cp.updated_at DESC
          LIMIT 120
        `),
        pool.query(`SELECT * FROM public.company_admin_overrides`),
        pool.query(`SELECT * FROM public.company_service_items ORDER BY id ASC`),
      ]);

      dbCompanies = (profilesRes.rows || []).map((r: any) => {
        const normalizedType: DirectoryEntityType = [
          "empresa",
          "emprendimiento",
          "profesional",
          "servicio",
        ].includes(String(r.entity_type || "").toLowerCase())
          ? (String(r.entity_type).toLowerCase() as DirectoryEntityType)
          : "empresa";
        const tierMeta = resolveTierMeta(
          (r.trust_score || 50) >= 85
            ? "corporativo"
            : (r.trust_score || 50) >= 65
            ? "pro"
            : "inicial"
        );
        const companyKey = String(r.company_key || `db-${r.id}`);

        return {
          id: companyKey,
          entityType: normalizedType,
          name: r.company_name,
          cuit: r.cuit || "",
          tier: tierMeta.tier,
          tierPriority: tierMeta.tierPriority,
          tierLabel: tierMeta.tierLabel,
          verified: r.verification_status === "verified",
          category: r.industry || "Servicios Industriales",
          subcategories: Array.isArray(r.services) ? r.services : [],
          province: r.province || "Chubut",
          city: r.city || "Comodoro Rivadavia",
          employeeCount:
            r.employee_count ||
            (normalizedType === "profesional" ? "Profesional Matriculado" : "11-50"),
          credentialLabel: r.credential_label || undefined,
          serviceModality: r.service_modality || undefined,
          publicSummary: r.description || "Actor registrado en la red B2B xPatagonia.",
          contactName: r.contact_name || "",
          contactRole: r.contact_role || "",
          email: r.email || r.user_email || "",
          phone: r.phone || "",
          whatsapp: r.whatsapp || "",
          website: r.website || "",
          certifications: Array.isArray(r.certifications) ? r.certifications : [],
          paymentTerms: r.payment_terms || "A convenir",
          creditRating: r.verification_status === "verified" ? "Verificada KYB" : "Pendiente KYB",
          priceDisplayMode: normalizeTaxDisplayMode(r.price_display_mode),
          defaultTaxRatePercent: 21,
          active: true,
          adnComercial: {
            ofrece: Array.isArray(r.adn_ofrece) ? r.adn_ofrece : [],
            demanda: Array.isArray(r.adn_demanda) ? r.adn_demanda : [],
            corredorLogistico:
              r.corridor ||
              (Array.isArray(r.corredores_logisticos)
                ? r.corredores_logisticos[0] || "Patagonia Sur"
                : "Patagonia Sur"),
            ciudadBase: r.city || "Patagonia",
            lat: Number(r.base_lat) || -45.8641,
            lng: Number(r.base_lng) || -67.4965,
          },
        };
      });

      for (const ov of overridesRes.rows || []) {
        overridesMap.set(String(ov.company_key), ov);
      }

      for (const sRow of servicesRes.rows || []) {
        const mapped = mapDbServiceRow(sRow);
        const list = servicesByCompany.get(mapped.companyKey) || [];
        list.push(mapped);
        servicesByCompany.set(mapped.companyKey, list);
      }
    } catch (err) {
      console.warn("[DIRECTORY_CONTROL] DB query fallback:", err);
    }
  } else {
    for (const [key, list] of memoryServices.entries()) {
      servicesByCompany.set(key, [...list]);
    }
  }

  const baseCombined = [...dbCompanies, ...B2B_COMPANIES];
  const merged = baseCombined.map((company) => {
    const ov = overridesMap.get(company.id);
    const tierMeta = ov?.tier ? resolveTierMeta(ov.tier) : null;
    const dbServiceList = servicesByCompany.get(company.id);
    const hasOverride = Boolean(ov);
    const serviceItems =
      dbServiceList !== undefined
        ? dbServiceList
        : hasOverride
        ? []
        : getDefaultSeedServicesForCompany(company.id);

    return {
      ...company,
      name: ov?.name || company.name,
      entityType: (ov?.entity_type as DirectoryEntityType) || company.entityType || "empresa",
      tier: tierMeta ? tierMeta.tier : company.tier,
      tierPriority: tierMeta ? tierMeta.tierPriority : company.tierPriority,
      tierLabel: tierMeta ? tierMeta.tierLabel : company.tierLabel,
      category: ov?.category || company.category,
      province: ov?.province || company.province,
      city: ov?.city || company.city,
      serviceModality:
        ov?.service_modality !== undefined && ov?.service_modality !== null
          ? ov.service_modality
          : company.serviceModality,
      credentialLabel:
        ov?.credential_label !== undefined && ov?.credential_label !== null
          ? ov.credential_label
          : company.credentialLabel,
      verified: typeof ov?.verified === "boolean" ? ov.verified : company.verified,
      priceDisplayMode: normalizeTaxDisplayMode(ov?.price_display_mode || company.priceDisplayMode),
      defaultTaxRatePercent:
        ov?.default_tax_rate_bps !== undefined && ov?.default_tax_rate_bps !== null
          ? taxRateBpsToPercent(Number(ov.default_tax_rate_bps))
          : company.defaultTaxRatePercent ?? 21,
      active: typeof ov?.active === "boolean" ? ov.active : company.active !== false,
      adnComercial: {
        ...company.adnComercial,
        corredorLogistico: ov?.corridor || company.adnComercial.corredorLogistico,
        lat: Number.isFinite(Number(ov?.lat)) ? Number(ov.lat) : company.adnComercial.lat,
        lng: Number.isFinite(Number(ov?.lng)) ? Number(ov.lng) : company.adnComercial.lng,
      },
      serviceItems,
    } as B2BCompanyRecord;
  });

  const filtered = options?.includeInactive
    ? merged
    : merged.filter((item) => item.active !== false);

  return sortCompaniesBySubscriptionTier(filtered);
}

export function registerDirectoryControlRoutes(app: Express) {
  app.get(
    "/api/admin/directory-control",
    requireAuth as any,
    requireRoles(["system_admin", "support_operator"]) as any,
    async (_req: AuthRequest, res) => {
      try {
        res.setHeader("Cache-Control", "no-store");
        const companies = await loadMergedDirectoryRecords({ includeInactive: true });
        res.json({ companies });
      } catch (err: any) {
        res.status(500).json({ error: formatPgError(err) });
      }
    }
  );

  app.put(
    "/api/admin/directory-control/:companyKey",
    requireAuth as any,
    requireRoles(["system_admin", "support_operator"]) as any,
    async (req: AuthRequest, res) => {
      try {
        const companyKey = String(req.params.companyKey || "").trim();
        if (!companyKey) {
          return res.status(400).json({ error: "Identificador de empresa requerido." });
        }

        const body = req.body || {};
        const priceDisplayMode = normalizeTaxDisplayMode(body.priceDisplayMode);
        const defaultTaxRateBps = taxRatePercentToBps(
          normalizeTaxRatePercent(body.defaultTaxRatePercent ?? 21)
        );
        const entityType = ["empresa", "emprendimiento", "profesional", "servicio"].includes(
          String(body.entityType || "").toLowerCase()
        )
          ? String(body.entityType).toLowerCase()
          : null;
        const tier = ["corporativo", "pro", "inicial"].includes(String(body.tier || "").toLowerCase())
          ? String(body.tier).toLowerCase()
          : null;
        const lat = Number.isFinite(Number(body.lat)) ? Number(body.lat) : null;
        const lng = Number.isFinite(Number(body.lng)) ? Number(body.lng) : null;

        if (hasDatabaseConfig()) {
          await ensureProductionTables();
          await pool.query(
            `INSERT INTO public.company_admin_overrides (
              company_key, name, entity_type, tier, category, province, city, corridor,
              service_modality, credential_label, verified, lat, lng,
              price_display_mode, default_tax_rate_bps, active, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8,
              $9, $10, $11, $12, $13,
              $14, $15, $16, now()
            )
            ON CONFLICT (company_key) DO UPDATE SET
              name = COALESCE(EXCLUDED.name, public.company_admin_overrides.name),
              entity_type = COALESCE(EXCLUDED.entity_type, public.company_admin_overrides.entity_type),
              tier = COALESCE(EXCLUDED.tier, public.company_admin_overrides.tier),
              category = COALESCE(EXCLUDED.category, public.company_admin_overrides.category),
              province = COALESCE(EXCLUDED.province, public.company_admin_overrides.province),
              city = COALESCE(EXCLUDED.city, public.company_admin_overrides.city),
              corridor = COALESCE(EXCLUDED.corridor, public.company_admin_overrides.corridor),
              service_modality = COALESCE(EXCLUDED.service_modality, public.company_admin_overrides.service_modality),
              credential_label = COALESCE(EXCLUDED.credential_label, public.company_admin_overrides.credential_label),
              verified = COALESCE(EXCLUDED.verified, public.company_admin_overrides.verified),
              lat = COALESCE(EXCLUDED.lat, public.company_admin_overrides.lat),
              lng = COALESCE(EXCLUDED.lng, public.company_admin_overrides.lng),
              price_display_mode = EXCLUDED.price_display_mode,
              default_tax_rate_bps = EXCLUDED.default_tax_rate_bps,
              active = EXCLUDED.active,
              updated_at = now()`,
            [
              companyKey,
              body.name ? String(body.name).trim() : null,
              entityType,
              tier,
              body.category ? String(body.category).trim() : null,
              body.province ? String(body.province).trim() : null,
              body.city ? String(body.city).trim() : null,
              body.corridor ? String(body.corridor).trim() : null,
              body.serviceModality !== undefined ? String(body.serviceModality) : null,
              body.credentialLabel !== undefined ? String(body.credentialLabel) : null,
              typeof body.verified === "boolean" ? body.verified : null,
              lat,
              lng,
              priceDisplayMode,
              defaultTaxRateBps,
              body.active !== false,
            ]
          );

          // If this record matches a registered company_profile, keep coordinates & price mode aligned
          if (companyKey.startsWith("db-")) {
            const dbId = Number(companyKey.replace("db-", ""));
            if (Number.isFinite(dbId)) {
              await pool.query(
                `UPDATE public.company_profiles
                 SET entity_type = COALESCE($1, entity_type),
                     verification_status = CASE WHEN $2::boolean IS TRUE THEN 'verified' WHEN $2::boolean IS FALSE THEN 'unverified' ELSE verification_status END,
                     corridor = COALESCE($3, corridor),
                     service_modality = COALESCE($4, service_modality),
                     base_lat = COALESCE($5, base_lat),
                     base_lng = COALESCE($6, base_lng),
                     price_display_mode = $7,
                     updated_at = now()
                 WHERE id = $8`,
                [
                  entityType,
                  typeof body.verified === "boolean" ? body.verified : null,
                  body.corridor || null,
                  body.serviceModality ?? null,
                  lat,
                  lng,
                  priceDisplayMode,
                  dbId,
                ]
              ).catch(() => {});
            }
          }
        } else {
          memoryOverrides.set(companyKey, {
            company_key: companyKey,
            name: body.name || undefined,
            entity_type: entityType || undefined,
            tier: tier || undefined,
            category: body.category || undefined,
            province: body.province || undefined,
            city: body.city || undefined,
            corridor: body.corridor || undefined,
            service_modality: body.serviceModality,
            credential_label: body.credentialLabel,
            verified: typeof body.verified === "boolean" ? body.verified : undefined,
            lat: lat ?? undefined,
            lng: lng ?? undefined,
            price_display_mode: priceDisplayMode,
            default_tax_rate_bps: defaultTaxRateBps,
            active: body.active !== false,
          });
        }

        const updated = (await loadMergedDirectoryRecords({ includeInactive: true })).find(
          (c) => c.id === companyKey
        );
        res.json({ success: true, company: updated || null });
      } catch (err: any) {
        res.status(500).json({ error: formatPgError(err) });
      }
    }
  );

  app.post(
    "/api/admin/directory-control/:companyKey/services",
    requireAuth as any,
    requireRoles(["system_admin", "support_operator"]) as any,
    async (req: AuthRequest, res) => {
      try {
        const companyKey = String(req.params.companyKey || "").trim();
        const b = req.body || {};
        const serviceName = String(b.serviceName || "").trim();
        if (!companyKey || !serviceName) {
          return res.status(400).json({ error: "El nombre del servicio es obligatorio." });
        }

        const taxRatePercent = normalizeTaxRatePercent(b.taxRatePercent ?? 21);
        const inputMode = b.priceInputMode === "gross" ? "gross" : "net";
        const breakdown =
          inputMode === "gross"
            ? calculateTaxBreakdownFromGross(Number(b.grossPrice ?? 0), taxRatePercent)
            : calculateTaxBreakdownFromNet(Number(b.netPrice ?? 0), taxRatePercent);

        const netPriceCents = Math.round(breakdown.netPrice * 100);
        const taxRateBps = breakdown.taxRateBps;
        const taxDisplayMode = normalizeTaxDisplayMode(b.taxDisplayMode);
        const currency = b.currency === "USD" ? "USD" : "ARS";
        const unitLabel = String(b.unitLabel || "Servicio").trim();
        const category = String(b.category || "Servicios").trim();
        const active = b.active !== false;

        if (hasDatabaseConfig()) {
          await ensureProductionTables();
          // If admin adds first real item to a company that only had preview seed, materialize/replace cleanly
          const inserted = await pool.query(
            `INSERT INTO public.company_service_items (
              company_key, service_name, category, unit_label, currency,
              net_price_cents, tax_rate_bps, tax_display_mode, active, updated_at
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,now())
            RETURNING *`,
            [
              companyKey,
              serviceName,
              category,
              unitLabel,
              currency,
              netPriceCents,
              taxRateBps,
              taxDisplayMode,
              active,
            ]
          );
          return res.status(201).json({ success: true, service: mapDbServiceRow(inserted.rows[0]) });
        }

        const existing = memoryServices.get(companyKey) || [];
        const created: CompanyServiceItem = {
          id: ++memoryServiceSeq,
          companyKey,
          serviceName,
          category,
          unitLabel,
          currency,
          netPrice: breakdown.netPrice,
          taxRatePercent: breakdown.taxRatePercent,
          taxRateBps,
          taxAmount: breakdown.taxAmount,
          grossPrice: breakdown.grossPrice,
          taxDisplayMode,
          active,
        };
        memoryServices.set(companyKey, [...existing, created]);
        res.status(201).json({ success: true, service: created });
      } catch (err: any) {
        res.status(500).json({ error: formatPgError(err) });
      }
    }
  );

  app.put(
    "/api/admin/directory-control/services/:serviceId",
    requireAuth as any,
    requireRoles(["system_admin", "support_operator"]) as any,
    async (req: AuthRequest, res) => {
      try {
        const serviceId = Number(req.params.serviceId);
        if (!Number.isFinite(serviceId)) {
          return res.status(400).json({ error: "ID de servicio inválido." });
        }

        const b = req.body || {};
        const taxRatePercent = normalizeTaxRatePercent(b.taxRatePercent ?? 21);
        const inputMode = b.priceInputMode === "gross" ? "gross" : "net";
        const breakdown =
          inputMode === "gross"
            ? calculateTaxBreakdownFromGross(Number(b.grossPrice ?? 0), taxRatePercent)
            : calculateTaxBreakdownFromNet(Number(b.netPrice ?? 0), taxRatePercent);

        const netPriceCents = Math.round(breakdown.netPrice * 100);
        const taxRateBps = breakdown.taxRateBps;
        const taxDisplayMode = normalizeTaxDisplayMode(b.taxDisplayMode);
        const currency = b.currency === "USD" ? "USD" : "ARS";

        if (hasDatabaseConfig()) {
          await ensureProductionTables();
          const upd = await pool.query(
            `UPDATE public.company_service_items
             SET service_name = COALESCE($1, service_name),
                 category = COALESCE($2, category),
                 unit_label = COALESCE($3, unit_label),
                 currency = $4,
                 net_price_cents = $5,
                 tax_rate_bps = $6,
                 tax_display_mode = $7,
                 active = $8,
                 updated_at = now()
             WHERE id = $9
             RETURNING *`,
            [
              b.serviceName ? String(b.serviceName).trim() : null,
              b.category ? String(b.category).trim() : null,
              b.unitLabel ? String(b.unitLabel).trim() : null,
              currency,
              netPriceCents,
              taxRateBps,
              taxDisplayMode,
              b.active !== false,
              serviceId,
            ]
          );
          if (!upd.rows?.[0]) {
            return res.status(404).json({ error: "Servicio no encontrado." });
          }
          return res.json({ success: true, service: mapDbServiceRow(upd.rows[0]) });
        }

        for (const [key, list] of memoryServices.entries()) {
          const idx = list.findIndex((s) => s.id === serviceId);
          if (idx !== -1) {
            const nextItem: CompanyServiceItem = {
              ...list[idx],
              serviceName: b.serviceName ? String(b.serviceName).trim() : list[idx].serviceName,
              category: b.category ? String(b.category).trim() : list[idx].category,
              unitLabel: b.unitLabel ? String(b.unitLabel).trim() : list[idx].unitLabel,
              currency,
              netPrice: breakdown.netPrice,
              taxRatePercent: breakdown.taxRatePercent,
              taxRateBps,
              taxAmount: breakdown.taxAmount,
              grossPrice: breakdown.grossPrice,
              taxDisplayMode,
              active: b.active !== false,
            };
            const nextList = [...list];
            nextList[idx] = nextItem;
            memoryServices.set(key, nextList);
            return res.json({ success: true, service: nextItem });
          }
        }

        res.status(404).json({ error: "Servicio no encontrado." });
      } catch (err: any) {
        res.status(500).json({ error: formatPgError(err) });
      }
    }
  );

  app.delete(
    "/api/admin/directory-control/services/:serviceId",
    requireAuth as any,
    requireRoles(["system_admin", "support_operator"]) as any,
    async (req: AuthRequest, res) => {
      try {
        const serviceId = Number(req.params.serviceId);
        if (!Number.isFinite(serviceId)) {
          return res.status(400).json({ error: "ID de servicio inválido." });
        }

        if (hasDatabaseConfig()) {
          await ensureProductionTables();
          await pool.query(`DELETE FROM public.company_service_items WHERE id = $1`, [serviceId]);
          return res.json({ success: true });
        }

        for (const [key, list] of memoryServices.entries()) {
          memoryServices.set(
            key,
            list.filter((s) => s.id !== serviceId)
          );
        }
        res.json({ success: true });
      } catch (err: any) {
        res.status(500).json({ error: formatPgError(err) });
      }
    }
  );

  app.post(
    "/api/admin/directory-control/bulk-tax-mode",
    requireAuth as any,
    requireRoles(["system_admin", "support_operator"]) as any,
    async (req: AuthRequest, res) => {
      try {
        const mode: TaxDisplayMode = normalizeTaxDisplayMode(req.body?.mode);
        if (hasDatabaseConfig()) {
          await ensureProductionTables();
          await pool.query(
            `UPDATE public.company_admin_overrides SET price_display_mode = $1, updated_at = now()`,
            [mode]
          );
          await pool.query(
            `UPDATE public.company_service_items SET tax_display_mode = $1, updated_at = now()`,
            [mode]
          );
        } else {
          for (const [k, v] of memoryOverrides.entries()) {
            memoryOverrides.set(k, { ...v, price_display_mode: mode });
          }
        }
        res.json({ success: true, mode });
      } catch (err: any) {
        res.status(500).json({ error: formatPgError(err) });
      }
    }
  );
}
