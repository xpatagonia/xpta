import crypto from "crypto";
import type { Express } from "express";
import { pool, hasDatabaseConfig, formatPgError } from "../db/index.ts";
import { requireAuth, requireRoles, type AuthRequest } from "../middleware/auth.ts";
import { ensureProductionTables } from "../services/arnSchema.ts";
import { resolveTenantContext } from "./saasAndFleetRoutes.ts";
import {
  BILLING_CATALOG,
  getBankTransferInstructions,
  isMercadoPagoConfigured,
  verifyMercadoPagoWebhookSignature,
  applyApprovedBillingUpgrade,
} from "../services/billingService.ts";
import { verifyCuitKyb } from "../services/kybService.ts";

export function registerBillingAndKybRoutes(
  app: Express,
  recordAutomationEvent: (
    direction: "outbound_n8n" | "inbound_odoo",
    event: string,
    status: string,
    payload: any
  ) => Promise<any>
) {
  // ==========================================
  // 1. FACTURACIÓN REAL: MERCADOPAGO + TRANSFERENCIA AUDITADA
  // ==========================================
  app.get("/api/billing/config", (_req, res) => {
    res.json({
      mercadopagoConfigured: isMercadoPagoConfigured(),
      bankTransfer: getBankTransferInstructions(),
      catalog: Object.values(BILLING_CATALOG),
    });
  });

  app.get("/api/billing/transactions", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      res.setHeader("Cache-Control", "no-store");
      if (!hasDatabaseConfig()) return res.json({ transactions: [] });
      await ensureProductionTables();

      const isAdmin = ["system_admin", "support_operator"].includes(req.user?.roleName || "");
      const statusFilter = String(req.query.status || "").trim().toLowerCase();

      if (isAdmin && req.query.scope === "all") {
        const rows = await pool.query(
          `SELECT * FROM public.billing_transactions
           WHERE ($1 = '' OR status = $1)
           ORDER BY created_at DESC LIMIT 100`,
          [statusFilter]
        );
        return res.json({ transactions: rows.rows || [] });
      }

      const tenant = await resolveTenantContext(
        req.user!.uid,
        req.user!.email,
        req.user!.membershipName,
        req.user!.roleName
      );
      const rows = await pool.query(
        `SELECT * FROM public.billing_transactions
         WHERE (organization_id = $1 OR user_uid = $2)
           AND ($3 = '' OR status = $3)
         ORDER BY created_at DESC LIMIT 50`,
        [tenant?.organizationId || null, req.user!.uid, statusFilter]
      );
      res.json({ transactions: rows.rows || [] });
    } catch (err: any) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });

  app.post("/api/billing/checkout", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      if (!hasDatabaseConfig()) {
        return res.status(500).json({ error: "Base de datos no configurada para facturación." });
      }
      await ensureProductionTables();

      const tenant = await resolveTenantContext(
        req.user!.uid,
        req.user!.email,
        req.user!.membershipName,
        req.user!.roleName
      );
      if (!tenant) return res.status(500).json({ error: "No se pudo resolver la organización." });

      const targetSlug = String(req.body?.targetSlug || "").trim().toLowerCase();
      const provider = req.body?.provider === "mercadopago" ? "mercadopago" : "bank_transfer";
      const receiptReference = String(req.body?.receiptReference || "").trim();

      const item = BILLING_CATALOG[targetSlug];
      if (!item) {
        return res.status(400).json({ error: "Plan o módulo de facturación inválido." });
      }

      if (provider === "bank_transfer" && !receiptReference) {
        return res.status(400).json({
          error: "Ingresá el número de operación, comprobante o CBU origen de la transferencia.",
        });
      }

      const externalReference = `XPT-${tenant.organizationId}-${targetSlug.toUpperCase()}-${Date.now()}-${crypto
        .randomBytes(3)
        .toString("hex")}`;

      if (provider === "mercadopago") {
        const mpToken = String(process.env.MP_ACCESS_TOKEN || "").trim();
        if (!mpToken) {
          return res.status(400).json({
            error:
              "MercadoPago no tiene credenciales configuradas en este entorno. Seleccioná Transferencia Bancaria para emitir orden de pago auditable.",
            mercadopagoConfigured: false,
          });
        }

        const appUrl = String(process.env.APP_URL || "https://www.xpatagonia.online").replace(/\/$/, "");
        const prefRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${mpToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            items: [
              {
                id: item.slug,
                title: `xPatagonia B2B · ${item.title}`,
                quantity: 1,
                currency_id: "ARS",
                unit_price: item.amountArs,
              },
            ],
            payer: { email: req.user!.email },
            external_reference: externalReference,
            notification_url: `${appUrl}/api/webhooks/mercadopago`,
            back_urls: {
              success: `${appUrl}/dashboard?area=team&payment=success`,
              pending: `${appUrl}/dashboard?area=team&payment=pending`,
              failure: `${appUrl}/planes?payment=failure`,
            },
            auto_return: "approved",
          }),
          signal: AbortSignal.timeout(8000),
        });

        const prefData: any = await prefRes.json().catch(() => ({}));
        if (!prefRes.ok || !prefData?.init_point) {
          return res.status(502).json({
            error: prefData?.message || "No se pudo crear la preferencia en MercadoPago.",
          });
        }

        const inserted = await pool.query(
          `INSERT INTO public.billing_transactions (
            organization_id, user_uid, user_email, target_type, target_slug,
            provider, external_reference, amount_ars, status, metadata
          ) VALUES ($1,$2,$3,$4,$5,'mercadopago',$6,$7,'pending',$8)
          RETURNING *`,
          [
            tenant.organizationId,
            req.user!.uid,
            req.user!.email || null,
            item.targetType,
            item.slug,
            externalReference,
            item.amountArs,
            JSON.stringify({ preferenceId: prefData.id, orgName: tenant.orgName }),
          ]
        );

        return res.json({
          success: true,
          provider: "mercadopago",
          initPoint: prefData.init_point,
          transaction: inserted.rows[0],
        });
      }

      // Bank transfer (pending audit approval)
      const inserted = await pool.query(
        `INSERT INTO public.billing_transactions (
          organization_id, user_uid, user_email, target_type, target_slug,
          provider, external_reference, receipt_reference, amount_ars, status, metadata
        ) VALUES ($1,$2,$3,$4,$5,'bank_transfer',$6,$7,$8,'pending',$9)
        RETURNING *`,
        [
          tenant.organizationId,
          req.user!.uid,
          req.user!.email || null,
          item.targetType,
          item.slug,
          externalReference,
          receiptReference,
          item.amountArs,
          JSON.stringify({ orgName: tenant.orgName, title: item.title }),
        ]
      );

      await recordAutomationEvent("outbound_n8n", "billing.transfer.pending", "processed", {
        transactionId: inserted.rows[0].id,
        organizationId: tenant.organizationId,
        targetSlug: item.slug,
        amountArs: item.amountArs,
        receiptReference,
      });

      res.json({
        success: true,
        provider: "bank_transfer",
        transaction: inserted.rows[0],
        message: "Comprobante registrado. La activación queda pendiente de conciliación administrativa.",
      });
    } catch (err: any) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });

  app.post("/api/webhooks/mercadopago", async (req, res) => {
    try {
      const paymentId = String(req.body?.data?.id || req.query?.["data.id"] || req.query?.id || "").trim();
      const validSig = verifyMercadoPagoWebhookSignature({
        signatureHeader: String(req.headers["x-signature"] || ""),
        requestIdHeader: String(req.headers["x-request-id"] || ""),
        dataId: paymentId,
      });
      if (!validSig) {
        return res.status(401).json({ error: "Invalid MercadoPago webhook signature" });
      }

      if (!paymentId || !isMercadoPagoConfigured() || !hasDatabaseConfig()) {
        return res.status(200).json({ received: true, processed: false });
      }

      const mpToken = String(process.env.MP_ACCESS_TOKEN || "").trim();
      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${mpToken}` },
        signal: AbortSignal.timeout(6000),
      });
      if (!mpRes.ok) {
        return res.status(200).json({ received: true, processed: false });
      }

      const payment: any = await mpRes.json();
      const extRef = String(payment?.external_reference || "").trim();
      if (!extRef) return res.status(200).json({ received: true, processed: false });

      await ensureProductionTables();
      const nextStatus =
        payment.status === "approved"
          ? "approved"
          : payment.status === "rejected" || payment.status === "cancelled"
          ? "rejected"
          : "pending";

      const upd = await pool.query(
        `UPDATE public.billing_transactions
         SET status = $1, external_payment_id = $2, updated_at = now()
         WHERE external_reference = $3
         RETURNING *`,
        [nextStatus, paymentId, extRef]
      );
      const txRow = upd.rows?.[0];
      if (txRow && nextStatus === "approved") {
        await applyApprovedBillingUpgrade(txRow);
        await recordAutomationEvent("outbound_n8n", "billing.mercadopago.approved", "processed", {
          transactionId: txRow.id,
          paymentId,
          targetSlug: txRow.target_slug,
        });
      }

      res.status(200).json({ received: true, status: nextStatus });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Webhook error" });
    }
  });

  app.post(
    "/api/admin/billing/:id/approve",
    requireAuth as any,
    requireRoles(["system_admin"]) as any,
    async (req: AuthRequest, res) => {
      try {
        await ensureProductionTables();
        const txId = Number(req.params.id);
        const upd = await pool.query(
          `UPDATE public.billing_transactions
           SET status = 'approved', reviewed_by_uid = $1, updated_at = now()
           WHERE id = $2 RETURNING *`,
          [req.user!.uid, txId]
        );
        const txRow = upd.rows?.[0];
        if (!txRow) return res.status(404).json({ error: "Transacción no encontrada." });

        await applyApprovedBillingUpgrade(txRow);
        await recordAutomationEvent("outbound_n8n", "billing.transfer.approved", "processed", {
          transactionId: txRow.id,
          targetSlug: txRow.target_slug,
          organizationId: txRow.organization_id,
        });
        res.json({ success: true, transaction: txRow });
      } catch (err: any) {
        res.status(500).json({ error: formatPgError(err) });
      }
    }
  );

  app.post(
    "/api/admin/billing/:id/reject",
    requireAuth as any,
    requireRoles(["system_admin"]) as any,
    async (req: AuthRequest, res) => {
      try {
        await ensureProductionTables();
        const txId = Number(req.params.id);
        const upd = await pool.query(
          `UPDATE public.billing_transactions
           SET status = 'rejected', reviewed_by_uid = $1, updated_at = now()
           WHERE id = $2 RETURNING *`,
          [req.user!.uid, txId]
        );
        if (!upd.rows?.[0]) return res.status(404).json({ error: "Transacción no encontrada." });
        res.json({ success: true, transaction: upd.rows[0] });
      } catch (err: any) {
        res.status(500).json({ error: formatPgError(err) });
      }
    }
  );

  // ==========================================
  // 2. VERIFICACIÓN KYB AUTOMÁTICA POR CUIT (ARCA + BCRA)
  // ==========================================
  app.post("/api/kyb/verify-cuit", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      const cuit = String(req.body?.cuit || "").trim();
      const applyToProfile = req.body?.applyToProfile !== false;
      const result = await verifyCuitKyb(cuit);

      if (!result.validFormat) {
        return res.status(400).json({ error: result.message, result });
      }

      if (applyToProfile && hasDatabaseConfig()) {
        await ensureProductionTables();
        await pool.query(
          `INSERT INTO public.company_profiles (
            user_uid, cuit, legal_name, fiscal_condition, arca_clae_codes,
            bcra_situation, arca_verified_at, verification_status, trust_score, updated_at
          ) VALUES ($1,$2,$3,$4,$5,$6,now(),$7,$8,now())
          ON CONFLICT (user_uid) DO UPDATE SET
            cuit = EXCLUDED.cuit,
            legal_name = COALESCE(EXCLUDED.legal_name, company_profiles.legal_name),
            fiscal_condition = COALESCE(EXCLUDED.fiscal_condition, company_profiles.fiscal_condition),
            arca_clae_codes = CASE
              WHEN jsonb_array_length(EXCLUDED.arca_clae_codes) > 0 THEN EXCLUDED.arca_clae_codes
              ELSE company_profiles.arca_clae_codes
            END,
            bcra_situation = EXCLUDED.bcra_situation,
            arca_verified_at = now(),
            verification_status = CASE WHEN $7 = 'verified' THEN 'verified' ELSE company_profiles.verification_status END,
            trust_score = GREATEST(COALESCE(company_profiles.trust_score, 50), $8),
            updated_at = now()`,
          [
            req.user!.uid,
            result.cuitFormatted,
            result.legalName,
            result.fiscalCondition,
            JSON.stringify(result.claeCodes || []),
            result.bcraSituation,
            result.verifiedBadge ? "verified" : "pending",
            result.verifiedBadge ? 84 : 64,
          ]
        ).catch(() => {});
      }

      res.json({ success: true, result });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Error verificando CUIT" });
    }
  });

  // ==========================================
  // 3. COMPARADOR DE COTIZACIONES RFQ
  // ==========================================
  app.get("/api/rfqs/:id/quotes", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      res.setHeader("Cache-Control", "no-store");
      if (!hasDatabaseConfig()) return res.json({ quotes: [] });
      await ensureProductionTables();
      const rfqId = Number(req.params.id);
      const rows = await pool.query(
        `SELECT * FROM public.rfq_quotes WHERE rfq_id = $1 ORDER BY total_price_ars ASC, delivery_days ASC`,
        [rfqId]
      );
      res.json({ quotes: rows.rows || [] });
    } catch (err: any) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });

  app.post("/api/rfqs/:id/quotes", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      if (!hasDatabaseConfig()) return res.status(500).json({ error: "DB no configurada" });
      await ensureProductionTables();
      const rfqId = Number(req.params.id);
      const tenant = await resolveTenantContext(
        req.user!.uid,
        req.user!.email,
        req.user!.membershipName,
        req.user!.roleName
      );
      const b = req.body || {};
      const supplierName = String(b.supplierName || tenant?.orgName || "Proveedor B2B").trim();
      const totalPriceArs = Math.max(0, Number(b.totalPriceArs) || 0);
      if (!totalPriceArs) {
        return res.status(400).json({ error: "El importe total de la cotización debe ser mayor a 0." });
      }

      const inserted = await pool.query(
        `INSERT INTO public.rfq_quotes (
          rfq_id, supplier_uid, supplier_org_id, supplier_name, supplier_location,
          verified, unit_price_ars, total_price_ars, currency, delivery_days,
          payment_terms, distance_km, notes, status
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'submitted')
        RETURNING *`,
        [
          rfqId,
          req.user!.uid,
          tenant?.organizationId || null,
          supplierName,
          String(b.supplierLocation || "Patagonia"),
          Boolean(b.verified),
          Math.max(0, Number(b.unitPriceArs) || totalPriceArs),
          totalPriceArs,
          String(b.currency || "ARS"),
          Math.max(1, Number(b.deliveryDays) || 7),
          String(b.paymentTerms || "Factura A 30 días"),
          Math.max(0, Number(b.distanceKm) || 0),
          b.notes ? String(b.notes) : null,
        ]
      );
      res.json({ success: true, quote: inserted.rows[0] });
    } catch (err: any) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });

  // ==========================================
  // 4. PORTAL PÚBLICO DE TRACKING LOGÍSTICO (/tracking/:code)
  // ==========================================
  app.get("/api/public/tracking/:code", async (req, res) => {
    try {
      res.setHeader("Cache-Control", "no-store");
      const code = String(req.params.code || "").trim().toUpperCase();
      if (!code || code.length < 4) {
        return res.status(400).json({ error: "Código de seguimiento inválido." });
      }
      if (!hasDatabaseConfig()) {
        return res.status(404).json({ error: "Envío no encontrado." });
      }
      await ensureProductionTables();

      const rows = await pool.query(
        `SELECT lc.tracking_code, lc.origin_name, lc.destination_name, lc.carrier_name,
                lc.status, lc.notes, lc.created_at, lc.updated_at,
                fv.name AS vehicle_name, fv.vehicle_type, fv.corridor
         FROM public.logistics_contracts lc
         LEFT JOIN public.fleet_vehicles fv ON fv.id = lc.vehicle_id
         WHERE upper(lc.tracking_code) = $1
         ORDER BY lc.updated_at DESC LIMIT 1`,
        [code]
      );
      const row = rows.rows?.[0];
      if (!row) {
        return res.status(404).json({ error: `No se encontró el envío ${code}.` });
      }

      res.json({
        tracking: {
          trackingCode: row.tracking_code,
          originName: row.origin_name,
          destinationName: row.destination_name,
          carrierName: row.carrier_name,
          status: row.status,
          vehicleLabel: row.vehicle_name
            ? `${row.vehicle_name} (${row.vehicle_type || "Unidad habilitada"})`
            : "Unidad asignada por transportista",
          corridor: row.corridor || "Red Vial Patagónica",
          notes: row.notes || null,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });
}
