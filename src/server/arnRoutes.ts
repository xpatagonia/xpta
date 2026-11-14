import type { Express } from "express";
import { createClient } from "@supabase/supabase-js";
import { pool, hasDatabaseConfig, formatPgError } from "../db/index.ts";
import {
  requireAuth,
  resolveUserRoleAndMembership,
  type AuthRequest,
} from "../middleware/auth.ts";
import { ensureProductionTables } from "../services/arnSchema.ts";
import {
  DEFAULT_ARN_POLICY,
  evaluateHybridDecision,
  analyzeOpportunityWithArn,
  generateAdnEmbedding,
  askArnCopilot,
  type ArnPolicyRule,
  type ArnActionType,
} from "../services/arnAiService.ts";
import {
  B2B_COMPANIES,
  sortCompaniesBySubscriptionTier,
} from "../lib/b2bDirectoryData.ts";
import { haversineKm } from "../lib/patagoniaRouting.ts";

export function validateArgentineCuit(cuit: string): boolean {
  const clean = String(cuit || "").replace(/\D/g, "");
  if (clean.length !== 11) return false;
  const digits = clean.slice(0, 10).split("").map(Number);
  const verifier = Number(clean[10]);
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const sum = digits.reduce((acc, d, idx) => acc + d * weights[idx], 0);
  const mod = sum % 11;
  const expected = mod === 0 ? 0 : mod === 1 ? 9 : 11 - mod;
  return expected === verifier;
}

async function resolveOptionalMember(req: any): Promise<{
  authenticated: boolean;
  uid?: string;
  email?: string;
  membershipName?: string;
  roleName?: string;
}> {
  const authHeader = req.headers?.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return { authenticated: false };
  }
  const token = authHeader.slice("Bearer ".length).trim();
  const rawUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "").trim();
  const rawKey = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "").trim();
  if (!rawUrl || !rawKey || !token) return { authenticated: false };

  try {
    const sb = createClient(rawUrl, rawKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const {
      data: { user },
      error,
    } = await sb.auth.getUser(token);
    if (error || !user) return { authenticated: false };
    const { roleName, membershipName } = await resolveUserRoleAndMembership(user.id, user.email);
    return {
      authenticated: true,
      uid: user.id,
      email: user.email,
      roleName,
      membershipName,
    };
  } catch {
    return { authenticated: false };
  }
}

export async function getUserArnRule(uid: string): Promise<ArnPolicyRule> {
  if (!hasDatabaseConfig()) return { ...DEFAULT_ARN_POLICY };
  await ensureProductionTables();
  const res = await pool.query(`SELECT * FROM public.arn_rules WHERE user_uid = $1`, [uid]);
  const row = res.rows?.[0];
  if (!row) return { ...DEFAULT_ARN_POLICY };
  return {
    mode: (row.mode as ArnPolicyRule["mode"]) || "hybrid",
    autoApproveMaxUsd: Number(row.auto_approve_max_usd ?? 1500),
    minConfidenceScore: Number(row.min_confidence_score ?? 82),
    autoSendEmails: Boolean(row.auto_send_emails),
    autoCreateLogistics: Boolean(row.auto_create_logistics),
    autoReserveInventory: Boolean(row.auto_reserve_inventory),
  };
}

export async function executeArnAction(actionRow: any): Promise<{ executed: boolean; note: string }> {
  const actionType = String(actionRow.action_type || "") as ArnActionType;

  if (
    (actionType === "send_quote_email" ||
      actionType === "send_followup_email" ||
      actionType === "notify_providers") &&
    actionRow.target_email
  ) {
    try {
      const { sendEmail } = await import("../services/emailService.ts");
      const mailResult = await sendEmail(
        String(actionRow.target_email),
        String(actionRow.draft_subject || "Propuesta Comercial xPatagonia"),
        String(actionRow.draft_body || "")
      );
      return {
        executed: true,
        note: `Correo enviado vía ${mailResult?.provider || "Resend"} a ${actionRow.target_email}`,
      };
    } catch (mailErr: any) {
      return {
        executed: false,
        note: `Envío diferido: ${mailErr?.message || "credenciales de correo no disponibles"}`,
      };
    }
  }

  if (actionType === "create_logistics_load" && hasDatabaseConfig()) {
    await ensureProductionTables();
    const meta = actionRow.metadata || {};
    await pool.query(
      `INSERT INTO public.logistics_loads (
        company_uid, load_type, origin_name, destination_name, corridor, truck_type, status
      ) VALUES ($1, 'cargo_tender', $2, $3, $4, $5, 'open')`,
      [
        actionRow.owner_uid,
        meta.originName || "Hub Origen",
        meta.destinationName || "Patagonia Destino",
        meta.corridor || "RN 22 / Añelo",
        meta.truckType || "Semirremolque 28t",
      ]
    );
    return { executed: true, note: "Licitación de carga generada automáticamente en Bolsa de Cargas." };
  }

  if (actionType === "reserve_inventory" && hasDatabaseConfig()) {
    await ensureProductionTables();
    const meta = actionRow.metadata || {};
    if (meta.sku) {
      await pool.query(
        `UPDATE public.inventory_items
         SET quantity = GREATEST(0, quantity - $1), last_updated = now()
         WHERE user_uid = $2 AND sku = $3`,
        [Math.max(1, Number(meta.qty) || 1), actionRow.owner_uid, String(meta.sku)]
      );
      return { executed: true, note: `Stock reservado para SKU ${meta.sku}.` };
    }
    return { executed: true, note: "Reserva de inventario registrada en bitácora ARN." };
  }

  return { executed: true, note: "Acción registrada en flujo autónomo ARN." };
}

export async function runArnPipelineForEvent(params: {
  ownerUid: string;
  source: string;
  companyName?: string;
  contactName?: string;
  contactEmail?: string;
  category?: string;
  rawText: string;
  metadata?: Record<string, any>;
}) {
  const rule = await getUserArnRule(params.ownerUid);

  let catalogSummary = "";
  if (hasDatabaseConfig()) {
    await ensureProductionTables();
    const prodRes = await pool.query(
      `SELECT name, sku, category, price_base FROM public.products WHERE user_uid = $1 LIMIT 8`,
      [params.ownerUid]
    );
    if (prodRes.rows.length > 0) {
      catalogSummary = prodRes.rows
        .map((p: any) => `- ${p.name} (${p.sku || "S/SKU"}) · ${p.category} · Base: ${p.price_base || "Consultar"}`)
        .join("\n");
    }
  }

  const analysis = await analyzeOpportunityWithArn({
    source: params.source,
    companyName: params.companyName,
    contactName: params.contactName,
    contactEmail: params.contactEmail,
    category: params.category,
    rawText: params.rawText,
    catalogSummary,
  });

  const decision = evaluateHybridDecision(
    rule,
    analysis.actionType,
    analysis.estimatedAmountUsd,
    analysis.aiScore
  );

  if (!hasDatabaseConfig()) {
    return { opportunity: null, action: null, analysis, decision };
  }

  await ensureProductionTables();

  const oppRes = await pool.query(
    `INSERT INTO public.arn_opportunities (
      owner_uid, company_name, contact_name, contact_email, cuit, category, corridor,
      source, stage, ai_score, estimated_amount_usd, urgency, summary, recommended_action, raw_context
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15::jsonb)
    RETURNING *`,
    [
      params.ownerUid,
      analysis.companyName,
      analysis.contactName,
      analysis.contactEmail || null,
      analysis.cuit || null,
      analysis.category,
      analysis.corridor,
      params.source,
      decision.shouldAutoExecute ? "quoted" : "qualified",
      analysis.aiScore,
      analysis.estimatedAmountUsd,
      analysis.urgency,
      analysis.summary,
      analysis.recommendedAction,
      JSON.stringify({ rawText: params.rawText.slice(0, 1200), ...(params.metadata || {}) }),
    ]
  );

  const opp = oppRes.rows[0];
  let status = decision.shouldAutoExecute ? "approved" : "pending_approval";
  let executedAt: Date | null = null;
  let execNote = decision.reason;

  const actRes = await pool.query(
    `INSERT INTO public.arn_actions_queue (
      owner_uid, opportunity_id, action_type, title, target_email,
      draft_subject, draft_body, estimated_amount_usd, confidence_score,
      execution_mode, status, metadata
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb)
    RETURNING *`,
    [
      params.ownerUid,
      opp.id,
      analysis.actionType,
      analysis.actionTitle,
      analysis.contactEmail || null,
      analysis.draftSubject,
      analysis.draftBody,
      analysis.estimatedAmountUsd,
      analysis.aiScore,
      decision.executionMode,
      status,
      JSON.stringify({ reason: decision.reason, corridor: analysis.corridor, ...(params.metadata || {}) }),
    ]
  );

  let action = actRes.rows[0];

  if (decision.shouldAutoExecute) {
    try {
      const exec = await executeArnAction(action);
      status = exec.executed ? "executed" : "pending_approval";
      execNote = exec.note;
      executedAt = exec.executed ? new Date() : null;
      const upd = await pool.query(
        `UPDATE public.arn_actions_queue
         SET status = $1, executed_at = $2,
             metadata = metadata || $3::jsonb
         WHERE id = $4 RETURNING *`,
        [status, executedAt, JSON.stringify({ executionNote: execNote }), action.id]
      );
      action = upd.rows[0];
    } catch (execErr: any) {
      await pool.query(
        `UPDATE public.arn_actions_queue SET status = 'failed', metadata = metadata || $1::jsonb WHERE id = $2`,
        [JSON.stringify({ error: execErr?.message || "Execution error" }), action.id]
      );
    }
  }

  return { opportunity: opp, action, analysis, decision };
}

export function registerArnAndModuleRoutes(
  app: Express,
  recordAutomationEvent: (
    direction: "outbound_n8n" | "inbound_odoo",
    event: string,
    status: string,
    payload: any
  ) => Promise<any>
) {
  // ==========================================
  // 1. ARN IA HYBRID MOTOR (REEMPLAZA CRM MANUAL)
  // ==========================================
  app.get("/api/arn/overview", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      if (!hasDatabaseConfig()) {
        return res.json({
          rules: DEFAULT_ARN_POLICY,
          opportunities: [],
          actions: [],
          metrics: { totalOpportunities: 0, pendingApprovals: 0, autoExecuted: 0, pipelineUsd: 0 },
        });
      }
      await ensureProductionTables();
      const [rules, oppRes, actRes] = await Promise.all([
        getUserArnRule(uid),
        pool.query(
          `SELECT * FROM public.arn_opportunities WHERE owner_uid = $1 ORDER BY updated_at DESC LIMIT 60`,
          [uid]
        ),
        pool.query(
          `SELECT * FROM public.arn_actions_queue WHERE owner_uid = $1 ORDER BY created_at DESC LIMIT 60`,
          [uid]
        ),
      ]);

      const opportunities = oppRes.rows || [];
      const actions = actRes.rows || [];
      const pendingApprovals = actions.filter((a: any) => a.status === "pending_approval").length;
      const autoExecuted = actions.filter(
        (a: any) => a.execution_mode === "auto_approved" && a.status === "executed"
      ).length;
      const pipelineUsd = opportunities
        .filter((o: any) => o.stage !== "archived")
        .reduce((sum: number, o: any) => sum + (Number(o.estimated_amount_usd) || 0), 0);

      res.json({
        rules,
        opportunities,
        actions,
        metrics: {
          totalOpportunities: opportunities.length,
          pendingApprovals,
          autoExecuted,
          pipelineUsd,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });

  app.put("/api/arn/rules", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const body = req.body || {};
      const mode = ["hybrid", "manual", "auto"].includes(body.mode) ? body.mode : "hybrid";
      const autoApproveMaxUsd = Math.max(0, Math.min(1000000, Number(body.autoApproveMaxUsd) || 1500));
      const minConfidenceScore = Math.max(50, Math.min(100, Number(body.minConfidenceScore) || 82));
      const autoSendEmails = Boolean(body.autoSendEmails);
      const autoCreateLogistics = body.autoCreateLogistics !== false;
      const autoReserveInventory = body.autoReserveInventory !== false;

      if (!hasDatabaseConfig()) {
        return res.status(500).json({ error: "Base de datos no configurada" });
      }
      await ensureProductionTables();

      await pool.query(
        `INSERT INTO public.arn_rules (
          user_uid, mode, auto_approve_max_usd, min_confidence_score,
          auto_send_emails, auto_create_logistics, auto_reserve_inventory, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,now())
        ON CONFLICT (user_uid) DO UPDATE SET
          mode = EXCLUDED.mode,
          auto_approve_max_usd = EXCLUDED.auto_approve_max_usd,
          min_confidence_score = EXCLUDED.min_confidence_score,
          auto_send_emails = EXCLUDED.auto_send_emails,
          auto_create_logistics = EXCLUDED.auto_create_logistics,
          auto_reserve_inventory = EXCLUDED.auto_reserve_inventory,
          updated_at = now()`,
        [
          uid,
          mode,
          autoApproveMaxUsd,
          minConfidenceScore,
          autoSendEmails,
          autoCreateLogistics,
          autoReserveInventory,
        ]
      );

      res.json({
        success: true,
        rules: {
          mode,
          autoApproveMaxUsd,
          minConfidenceScore,
          autoSendEmails,
          autoCreateLogistics,
          autoReserveInventory,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });

  app.post("/api/arn/ingest", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      const { source = "manual", companyName, contactName, contactEmail, category, rawText, metadata } =
        req.body || {};
      if (!rawText || String(rawText).trim().length < 5) {
        return res.status(400).json({ error: "Describe el requerimiento o texto comercial a analizar." });
      }
      const result = await runArnPipelineForEvent({
        ownerUid: req.user!.uid,
        source: String(source),
        companyName,
        contactName,
        contactEmail,
        category,
        rawText: String(rawText),
        metadata,
      });

      await recordAutomationEvent("outbound_n8n", "arn.opportunity.ingested", "processed", {
        uid: req.user!.uid,
        source,
        companyName: result.analysis.companyName,
        autoExecuted: result.decision.shouldAutoExecute,
      });

      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Error procesando ingesta ARN IA" });
    }
  });

  app.post("/api/arn/triage-inbox", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      const { fetchEmails } = await import("../services/emailService.ts");
      const emails = await fetchEmails();
      const recent = Array.isArray(emails) ? emails.slice(0, 5) : [];
      const created: any[] = [];

      for (const mail of recent) {
        const senderRaw = String(mail.from || "");
        const emailMatch = senderRaw.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        const senderEmail = emailMatch ? emailMatch[0] : "";
        const senderName = senderRaw.replace(/<[^>]+>/g, "").trim() || senderEmail;

        const out = await runArnPipelineForEvent({
          ownerUid: req.user!.uid,
          source: "email_imap",
          companyName: senderName,
          contactName: senderName,
          contactEmail: senderEmail,
          rawText: `Asunto: ${mail.subject}\n\n${mail.text || mail.snippet || ""}`,
          metadata: { emailId: mail.id, emailDate: mail.date },
        });
        created.push(out.opportunity);
      }

      res.json({
        success: true,
        analyzedCount: recent.length,
        opportunitiesCreated: created.filter(Boolean).length,
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "No se pudo analizar la bandeja IMAP" });
    }
  });

  app.post("/api/arn/actions/:id/approve", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      if (!hasDatabaseConfig()) return res.status(500).json({ error: "DB no configurada" });
      await ensureProductionTables();
      const actionId = Number(req.params.id);
      const { draftSubject, draftBody } = req.body || {};

      const existing = await pool.query(
        `SELECT * FROM public.arn_actions_queue WHERE id = $1 AND owner_uid = $2`,
        [actionId, req.user!.uid]
      );
      const row = existing.rows?.[0];
      if (!row) return res.status(404).json({ error: "Acción no encontrada" });

      const updatedRow = {
        ...row,
        draft_subject: draftSubject !== undefined ? String(draftSubject) : row.draft_subject,
        draft_body: draftBody !== undefined ? String(draftBody) : row.draft_body,
      };

      const execResult = await executeArnAction(updatedRow);
      const nextStatus = execResult.executed ? "executed" : "approved";

      const upd = await pool.query(
        `UPDATE public.arn_actions_queue
         SET status = $1,
             draft_subject = $2,
             draft_body = $3,
             executed_at = now(),
             metadata = metadata || $4::jsonb
         WHERE id = $5 AND owner_uid = $6
         RETURNING *`,
        [
          nextStatus,
          updatedRow.draft_subject,
          updatedRow.draft_body,
          JSON.stringify({ executionNote: execResult.note }),
          actionId,
          req.user!.uid,
        ]
      );

      if (row.opportunity_id && execResult.executed) {
        await pool.query(
          `UPDATE public.arn_opportunities SET stage = 'quoted', updated_at = now() WHERE id = $1 AND owner_uid = $2`,
          [row.opportunity_id, req.user!.uid]
        );
      }

      await recordAutomationEvent("outbound_n8n", "arn.action.approved", nextStatus, {
        actionId,
        actionType: row.action_type,
        note: execResult.note,
      });

      res.json({ success: true, action: upd.rows[0], note: execResult.note });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Error ejecutando acción ARN" });
    }
  });

  app.post("/api/arn/actions/:id/dismiss", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      if (!hasDatabaseConfig()) return res.status(500).json({ error: "DB no configurada" });
      await ensureProductionTables();
      const actionId = Number(req.params.id);
      await pool.query(
        `UPDATE public.arn_actions_queue SET status = 'dismissed' WHERE id = $1 AND owner_uid = $2`,
        [actionId, req.user!.uid]
      );
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });

  app.post("/api/arn/opportunities/:id/stage", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      if (!hasDatabaseConfig()) return res.status(500).json({ error: "DB no configurada" });
      await ensureProductionTables();
      const id = Number(req.params.id);
      const stage = String(req.body?.stage || "qualified");
      const allowed = ["detected", "qualified", "quoted", "negotiating", "awarded", "archived"];
      if (!allowed.includes(stage)) {
        return res.status(400).json({ error: "Etapa inválida" });
      }
      const upd = await pool.query(
        `UPDATE public.arn_opportunities SET stage = $1, updated_at = now() WHERE id = $2 AND owner_uid = $3 RETURNING *`,
        [stage, id, req.user!.uid]
      );
      res.json({ success: true, opportunity: upd.rows?.[0] || null });
    } catch (err: any) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });

  app.post("/api/arn/copilot", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const question = String(req.body?.question || "").trim();
      if (!question) return res.status(400).json({ error: "Escribí tu consulta para ARN IA." });

      let snapshot = {
        opportunitiesCount: 0,
        pendingActionsCount: 0,
        topOpportunities: [] as any[],
        inventoryLowStock: [] as any[],
        openRfqsCount: 0,
        policy: DEFAULT_ARN_POLICY,
      };

      if (hasDatabaseConfig()) {
        await ensureProductionTables();
        const [policy, oppRes, actRes, invRes, rfqRes] = await Promise.all([
          getUserArnRule(uid),
          pool.query(
            `SELECT company_name, stage, ai_score, estimated_amount_usd, summary FROM public.arn_opportunities WHERE owner_uid = $1 ORDER BY ai_score DESC LIMIT 5`,
            [uid]
          ),
          pool.query(
            `SELECT count(*)::int AS cnt FROM public.arn_actions_queue WHERE owner_uid = $1 AND status = 'pending_approval'`,
            [uid]
          ),
          pool.query(
            `SELECT name, sku, quantity, location FROM public.inventory_items WHERE user_uid = $1 AND quantity <= 15 LIMIT 5`,
            [uid]
          ),
          pool.query(
            `SELECT count(*)::int AS cnt FROM public.rfqs WHERE user_uid = $1 AND status != 'awarded'`,
            [uid]
          ),
        ]);
        snapshot = {
          opportunitiesCount: oppRes.rows.length,
          pendingActionsCount: actRes.rows?.[0]?.cnt || 0,
          topOpportunities: oppRes.rows.map((r: any) => ({
            companyName: r.company_name,
            stage: r.stage,
            aiScore: r.ai_score,
            estimatedAmountUsd: r.estimated_amount_usd,
            summary: r.summary,
          })),
          inventoryLowStock: invRes.rows,
          openRfqsCount: rfqRes.rows?.[0]?.cnt || 0,
          policy,
        };
      }

      const answer = await askArnCopilot(question, snapshot);
      res.json({ success: true, answer });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Error consultando Copiloto ARN" });
    }
  });

  // ==========================================
  // 2. DIRECTORIO B2B REAL (SERVER-GATED) & ADN VECTORIAL
  // ==========================================
  app.get("/api/directory", async (req, res) => {
    try {
      res.setHeader("Cache-Control", "no-store");
      const member = await resolveOptionalMember(req);
      const revealProtected = Boolean(member.authenticated);

      let dbCompanies: any[] = [];
      if (hasDatabaseConfig()) {
        try {
          const rows = await pool.query(`
            SELECT cp.*, u.email AS user_email
            FROM public.company_profiles cp
            LEFT JOIN public.users u ON u.uid = cp.user_uid
            WHERE cp.company_name IS NOT NULL AND cp.company_name != ''
            ORDER BY cp.trust_score DESC, cp.updated_at DESC
            LIMIT 80
          `);
          dbCompanies = rows.rows.map((r: any) => ({
            id: `db-${r.id}`,
            name: r.company_name,
            cuit: r.cuit || "",
            tier: (r.trust_score || 50) >= 85 ? "corporativo" : (r.trust_score || 50) >= 65 ? "pro" : "inicial",
            tierPriority: (r.trust_score || 50) >= 85 ? 1 : (r.trust_score || 50) >= 65 ? 2 : 3,
            tierLabel:
              (r.trust_score || 50) >= 85
                ? "Plan Corporativo"
                : (r.trust_score || 50) >= 65
                ? "Plan Pro Industrial"
                : "Plan Inicial",
            verified: r.verification_status === "verified",
            category: r.industry || "Servicios Industriales",
            subcategories: Array.isArray(r.services) ? r.services : [],
            province: r.province || "Chubut",
            city: r.city || "Comodoro Rivadavia",
            employeeCount: r.employee_count || "11-50",
            publicSummary: r.description || "Empresa registrada en la red B2B xPatagonia.",
            contactName: r.contact_name || "",
            contactRole: r.contact_role || "",
            email: r.email || r.user_email || "",
            phone: r.phone || "",
            whatsapp: r.whatsapp || "",
            website: r.website || "",
            certifications: Array.isArray(r.certifications) ? r.certifications : [],
            paymentTerms: r.payment_terms || "A convenir",
            creditRating: r.verification_status === "verified" ? "Verificada KYB" : "Pendiente KYB",
            adnComercial: {
              ofrece: Array.isArray(r.adn_ofrece) ? r.adn_ofrece : [],
              demanda: Array.isArray(r.adn_demanda) ? r.adn_demanda : [],
              corredorLogistico: Array.isArray(r.corredores_logisticos)
                ? r.corredores_logisticos[0] || "Patagonia Sur"
                : "Patagonia Sur",
              ciudadBase: r.city || "Patagonia",
              lat: Number(r.base_lat) || -45.8641,
              lng: Number(r.base_lng) || -67.4965,
            },
          }));
        } catch {
          // Optional DB query
        }
      }

      const merged = sortCompaniesBySubscriptionTier([...dbCompanies, ...B2B_COMPANIES]).map((c) => {
        if (revealProtected) return { ...c, protectedMasked: false };
        return {
          ...c,
          cuit: "••-••••••••-•",
          contactName: "Reservado para Miembros",
          contactRole: "Suscripción Activa",
          email: "",
          phone: "",
          whatsapp: "",
          paymentTerms: "Visible con membresía",
          creditRating: "Acceso Miembro",
          protectedMasked: true,
        };
      });

      res.json({
        companies: merged,
        isMemberAuthorized: revealProtected,
        membershipName: member.membershipName || null,
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to load directory" });
    }
  });

  app.get("/api/company/profile", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      if (!hasDatabaseConfig()) return res.json({ profile: null });
      const result = await pool.query(
        `SELECT * FROM public.company_profiles WHERE user_uid = $1`,
        [req.user!.uid]
      );
      res.json({ profile: result.rows?.[0] || null });
    } catch (err: any) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });

  app.put("/api/company/profile", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      const b = req.body || {};
      if (b.cuit && !validateArgentineCuit(String(b.cuit))) {
        return res.status(400).json({ error: "El CUIT ingresado no supera la validación de dígito verificador ARCA." });
      }
      if (!hasDatabaseConfig()) {
        return res.status(500).json({ error: "Base de datos no configurada" });
      }
      await ensureProductionTables();

      const { getOrCreateUser } = await import("../db/users.ts");
      await getOrCreateUser(req.user!.uid, req.user!.email || "");

      const offers = Array.isArray(b.adnOfrece) ? b.adnOfrece : [];
      const demands = Array.isArray(b.adnDemanda) ? b.adnDemanda : [];
      const adnText = `${b.companyName || ""} ${b.industry || ""} ${b.description || ""} Ofrece: ${offers.join(", ")} Demanda: ${demands.join(", ")}`;
      const embedding = await generateAdnEmbedding(adnText);

      const upsertParams = [
        req.user!.uid,
        b.companyName || "",
        b.description || "",
        b.address || "",
        b.province || "Chubut",
        b.city || "Comodoro Rivadavia",
        b.cuit || "",
        b.employeeCount || "1-10",
        b.contactEmail || req.user!.email || "",
        b.contactPhone || "",
        b.whatsapp || "",
        b.website || "",
        b.industry || (Array.isArray(b.categories) ? b.categories[0] : "") || "Servicios Industriales",
        JSON.stringify(Array.isArray(b.categories) ? b.categories : []),
        offers,
        demands,
        Number(b.lat) || -45.8641,
        Number(b.lng) || -67.4965,
      ];

      await pool.query(
        `INSERT INTO public.company_profiles (
          user_uid, company_name, description, address, province, city, cuit,
          employee_count, email, phone, whatsapp, website, industry, services,
          adn_ofrece, adn_demanda, base_lat, base_lng, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::jsonb,$15,$16,$17,$18,now())
        ON CONFLICT (user_uid) DO UPDATE SET
          company_name = EXCLUDED.company_name,
          description = EXCLUDED.description,
          address = EXCLUDED.address,
          province = EXCLUDED.province,
          city = EXCLUDED.city,
          cuit = EXCLUDED.cuit,
          employee_count = EXCLUDED.employee_count,
          email = EXCLUDED.email,
          phone = EXCLUDED.phone,
          whatsapp = EXCLUDED.whatsapp,
          website = EXCLUDED.website,
          industry = EXCLUDED.industry,
          services = EXCLUDED.services,
          adn_ofrece = EXCLUDED.adn_ofrece,
          adn_demanda = EXCLUDED.adn_demanda,
          base_lat = EXCLUDED.base_lat,
          base_lng = EXCLUDED.base_lng,
          updated_at = now()`,
        upsertParams
      );

      if (embedding) {
        try {
          await pool.query(
            `UPDATE public.company_profiles SET adn_embedding = $1::vector WHERE user_uid = $2`,
            [`[${embedding.join(",")}]`, req.user!.uid]
          );
        } catch {
          // pgvector column optional if extension wasn't enabled yet
        }
      }

      res.json({ success: true, embeddingGenerated: Boolean(embedding) });
    } catch (err: any) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });

  app.post("/api/adn/match", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      const offers = Array.isArray(req.body?.offers)
        ? req.body.offers
        : String(req.body?.offers || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
      const demands = Array.isArray(req.body?.demands)
        ? req.body.demands
        : String(req.body?.demands || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);

      let vectorMatches: any[] = [];
      if (hasDatabaseConfig()) {
        const embedding = await generateAdnEmbedding(
          `Ofrece: ${offers.join(", ")}. Demanda: ${demands.join(", ")}.`
        );
        if (embedding) {
          try {
            const vecRes = await pool.query(
              `SELECT * FROM public.match_adn_empresas($1::vector, 0.35, 8)`,
              [`[${embedding.join(",")}]`]
            );
            vectorMatches = vecRes.rows || [];
          } catch {
            // pgvector RPC fallback
          }
        }
      }

      const offerLower = offers.map((o: string) => o.toLowerCase());
      const demandLower = demands.map((d: string) => d.toLowerCase());
      const matches = sortCompaniesBySubscriptionTier(B2B_COMPANIES)
        .map((comp) => {
          const vecRow = vectorMatches.find((v: any) => v.company_name === comp.name);
          let score = vecRow ? Math.round(Number(vecRow.similarity) * 100) : 52;
          const reasons: string[] = [];

          comp.adnComercial.ofrece.forEach((o) => {
            if (demandLower.some((d) => o.toLowerCase().includes(d) || d.includes(o.toLowerCase()))) {
              score += 24;
              reasons.push(`Provee "${o}" que demandas`);
            }
          });
          comp.adnComercial.demanda.forEach((d) => {
            if (offerLower.some((o) => d.toLowerCase().includes(o) || o.includes(d.toLowerCase()))) {
              score += 22;
              reasons.push(`Demanda "${d}" que ofreces`);
            }
          });
          if (comp.tier === "corporativo") score += 6;

          const roadKm = Math.round(
            haversineKm(comp.adnComercial.lat, comp.adnComercial.lng, -38.3522, -68.7897) * 1.28
          );
          return {
            company: comp,
            compatibilityPercent: Math.min(99, score),
            matchReason:
              reasons.length > 0
                ? reasons.join(" · ")
                : `Sinergia estratégica en ${comp.adnComercial.corredorLogistico}`,
            corridorSynergy: comp.adnComercial.corredorLogistico,
            estimatedRoadKm: Math.max(85, roadKm),
            engine: vecRow ? "pgvector_cosine" : "semantic_corridor",
          };
        })
        .sort((a, b) => b.compatibilityPercent - a.compatibilityPercent)
        .slice(0, 6);

      res.json({ success: true, matches });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Error calculando ADN matches" });
    }
  });

  // ==========================================
  // 3. PRODUCTOS UNIFICADOS (E-COMMERCE + DASHBOARD)
  // ==========================================
  app.get("/api/products", async (req, res) => {
    try {
      res.setHeader("Cache-Control", "no-store");
      if (!hasDatabaseConfig()) return res.json({ products: [] });
      await ensureProductionTables();
      const member = await resolveOptionalMember(req);
      const mineOnly = req.query.mine === "1" && member.authenticated && member.uid;

      const result = mineOnly
        ? await pool.query(`SELECT * FROM public.products WHERE user_uid = $1 ORDER BY created_at DESC`, [
            member.uid,
          ])
        : await pool.query(`SELECT * FROM public.products ORDER BY created_at DESC LIMIT 100`);

      res.json({ products: result.rows || [] });
    } catch (err: any) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });

  app.post("/api/products", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      const b = req.body || {};
      if (!b.name || !b.category) {
        return res.status(400).json({ error: "Nombre y categoría del producto son obligatorios." });
      }
      if (!hasDatabaseConfig()) return res.status(500).json({ error: "DB no configurada" });
      await ensureProductionTables();

      const inserted = await pool.query(
        `INSERT INTO public.products (
          user_uid, sku, name, category, subcategory, brand, model, condition,
          price_base, price_wholesale, stock, moq, description, certifications,
          payment_methods, shipping_conditions, lead_time, location, supplier, image, status
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::jsonb,$15::jsonb,$16::jsonb,$17,$18,$19,$20,'active')
        RETURNING *`,
        [
          req.user!.uid,
          b.sku || `SKU-${Date.now().toString().slice(-5)}`,
          b.name,
          b.category,
          b.subcategory || "",
          b.brand || "",
          b.model || "",
          b.condition || "Nuevo",
          String(b.priceBase ?? ""),
          String(b.priceWholesale ?? ""),
          String(b.stock ?? "0"),
          String(b.moq ?? "1"),
          b.description || "",
          JSON.stringify(Array.isArray(b.certifications) ? b.certifications : []),
          JSON.stringify(Array.isArray(b.paymentMethods) ? b.paymentMethods : []),
          JSON.stringify(Array.isArray(b.shippingConditions) ? b.shippingConditions : []),
          b.leadTime || "",
          b.location || "",
          b.supplier || req.user!.email || "",
          b.image || null,
        ]
      );
      res.json({ success: true, product: inserted.rows[0] });
    } catch (err: any) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });

  app.delete("/api/products/:id", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      if (!hasDatabaseConfig()) return res.status(500).json({ error: "DB no configurada" });
      await ensureProductionTables();
      await pool.query(`DELETE FROM public.products WHERE id = $1 AND user_uid = $2`, [
        Number(req.params.id),
        req.user!.uid,
      ]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });

  // ==========================================
  // 4. WAREHOUSING INVENTARIO REAL
  // ==========================================
  app.get("/api/warehousing/inventory", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      if (!hasDatabaseConfig()) return res.json({ items: [] });
      await ensureProductionTables();
      const rows = await pool.query(
        `SELECT * FROM public.inventory_items WHERE user_uid = $1 ORDER BY last_updated DESC`,
        [req.user!.uid]
      );
      res.json({ items: rows.rows || [] });
    } catch (err: any) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });

  app.post("/api/warehousing/inventory", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      const { sku, name, category, quantity, location } = req.body || {};
      if (!name) return res.status(400).json({ error: "Nombre de ítem requerido" });
      if (!hasDatabaseConfig()) return res.status(500).json({ error: "DB no configurada" });
      await ensureProductionTables();
      const qty = Math.max(0, Number(quantity) || 0);
      const status = qty === 0 ? "out-of-stock" : qty < 20 ? "low-stock" : "in-stock";
      const inserted = await pool.query(
        `INSERT INTO public.inventory_items (user_uid, sku, name, category, quantity, location, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [
          req.user!.uid,
          sku || `SKU-${Date.now().toString().slice(-5)}`,
          name,
          category || "Insumos",
          qty,
          location || "Parque Ind. Comodoro",
          status,
        ]
      );
      res.json({ success: true, item: inserted.rows[0] });
    } catch (err: any) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });

  // ==========================================
  // 5. LOGÍSTICA: BOLSA DE CARGAS REAL (logistics_loads)
  // ==========================================
  app.get("/api/logistics/loads", async (req, res) => {
    try {
      res.setHeader("Cache-Control", "no-store");
      if (!hasDatabaseConfig()) return res.json({ loads: [] });
      await ensureProductionTables();
      const rows = await pool.query(
        `SELECT * FROM public.logistics_loads ORDER BY created_at DESC LIMIT 50`
      );
      res.json({ loads: rows.rows || [] });
    } catch (err: any) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });

  app.post("/api/logistics/loads", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      const b = req.body || {};
      if (!b.originName || !b.destinationName) {
        return res.status(400).json({ error: "Origen y destino son obligatorios." });
      }
      if (!hasDatabaseConfig()) return res.status(500).json({ error: "DB no configurada" });
      await ensureProductionTables();
      const inserted = await pool.query(
        `INSERT INTO public.logistics_loads (
          company_uid, load_type, origin_name, destination_name, corridor,
          distance_km, weight_kg, truck_type, discount_percent, target_price_ars, status
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'open') RETURNING *`,
        [
          req.user!.uid,
          b.loadType === "cargo_tender" ? "cargo_tender" : "empty_return",
          b.originName,
          b.destinationName,
          b.corridor || "RN 3 / Patagónica",
          Number(b.distanceKm) || null,
          Number(b.weightKg) || 18000,
          b.truckType || "Semirremolque 28t",
          Number(b.discountPercent) || 35,
          Number(b.targetPriceArs) || null,
        ]
      );
      res.json({ success: true, load: inserted.rows[0] });
    } catch (err: any) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });

  // ==========================================
  // 6. B2B MESSENGER PERSISTENTE
  // ==========================================
  app.get("/api/chat/messages", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      res.setHeader("Cache-Control", "no-store");
      const channelId = String(req.query.channelId || "chan-logistica");
      if (!hasDatabaseConfig()) return res.json({ messages: [] });
      await ensureProductionTables();
      const rows = await pool.query(
        `SELECT * FROM public.chat_messages WHERE channel_id = $1 ORDER BY created_at ASC LIMIT 80`,
        [channelId]
      );
      res.json({ messages: rows.rows || [] });
    } catch (err: any) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });

  app.post("/api/chat/messages", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      const { channelId, text, senderCompany, msgType = "text", metadata = {} } = req.body || {};
      if (!channelId || !text || !String(text).trim()) {
        return res.status(400).json({ error: "channelId y mensaje requeridos" });
      }
      if (!hasDatabaseConfig()) return res.status(500).json({ error: "DB no configurada" });
      await ensureProductionTables();
      const inserted = await pool.query(
        `INSERT INTO public.chat_messages (
          channel_id, sender_uid, sender_name, sender_company, text, msg_type, metadata
        ) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb) RETURNING *`,
        [
          String(channelId),
          req.user!.uid,
          req.user!.email?.split("@")[0] || "Miembro",
          senderCompany || "Empresa xPatagonia",
          String(text).trim(),
          msgType,
          JSON.stringify(metadata || {}),
        ]
      );
      res.json({ success: true, message: inserted.rows[0] });
    } catch (err: any) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });
}
