import crypto from "crypto";
import type { Express } from "express";
import { pool, hasDatabaseConfig, formatPgError } from "../db/index.ts";
import { requireAuth, type AuthRequest } from "../middleware/auth.ts";
import { ensureProductionTables } from "../services/arnSchema.ts";
import {
  SAAS_PLANS,
  LOGISTICS_MEMBERSHIP,
  resolvePlanConfig,
  canAddOrganizationSeat,
  canAccessLogisticsSuite,
  type PymePlanSlug,
} from "../services/saasPlans.ts";

export interface TenantContext {
  organizationId: number;
  ownerUid: string;
  orgName: string;
  planSlug: PymePlanSlug;
  planName: string;
  seatLimit: number;
  usedSeats: number;
  activeMembersCount: number;
  pendingInvitesCount: number;
  orgRole: string;
  logisticsPlanActive: boolean;
  hasLogisticsAccess: boolean;
}

export async function resolveTenantContext(
  uid: string,
  email?: string,
  membershipName?: string,
  roleName?: string
): Promise<TenantContext | null> {
  if (!hasDatabaseConfig()) return null;
  await ensureProductionTables();

  const normalizedEmail = String(email || "").trim().toLowerCase();

  // 1. Check if user has a pending invitation by email and accept it automatically
  if (normalizedEmail) {
    const inviteRes = await pool.query(
      `SELECT * FROM public.org_invitations
       WHERE lower(email) = $1 AND status = 'pending'
       ORDER BY created_at DESC LIMIT 1`,
      [normalizedEmail]
    );
    const pendingInvite = inviteRes.rows?.[0];
    if (pendingInvite) {
      await pool.query(
        `INSERT INTO public.org_members (organization_id, user_uid, email, org_role, status)
         VALUES ($1, $2, $3, $4, 'active')
         ON CONFLICT (organization_id, user_uid) DO UPDATE SET
           status = 'active',
           org_role = EXCLUDED.org_role`,
        [pendingInvite.organization_id, uid, normalizedEmail, pendingInvite.org_role || "comercial"]
      );
      await pool.query(
        `UPDATE public.org_invitations SET status = 'accepted' WHERE id = $1`,
        [pendingInvite.id]
      );
    }
  }

  // 2. Check existing active org membership
  const memberRes = await pool.query(
    `SELECT o.*, om.org_role
     FROM public.org_members om
     JOIN public.organizations o ON o.id = om.organization_id
     WHERE om.user_uid = $1 AND om.status = 'active'
     ORDER BY om.id ASC LIMIT 1`,
    [uid]
  );

  let orgRow = memberRes.rows?.[0];
  let orgRole = orgRow?.org_role || "company_admin";

  // 3. If not in org_members yet, ensure personal/owner organization exists
  if (!orgRow) {
    const plan = resolvePlanConfig(membershipName);
    const profileRes = await pool
      .query(`SELECT company_name, industry FROM public.company_profiles WHERE user_uid = $1`, [uid])
      .catch(() => ({ rows: [] as any[] }));
    const profileRow = profileRes.rows?.[0];
    const orgName =
      profileRow?.company_name?.trim() ||
      (normalizedEmail ? `${normalizedEmail.split("@")[0]} · PyME` : "Mi Empresa B2B");
    const isLogCat =
      String(profileRow?.industry || "").toUpperCase().includes("LOGIST") ||
      String(membershipName || "").toLowerCase().includes("logist");

    const insertedOrg = await pool.query(
      `INSERT INTO public.organizations (owner_uid, name, plan_slug, seat_limit, logistics_plan_active)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (owner_uid) DO UPDATE SET updated_at = now()
       RETURNING *`,
      [uid, orgName, plan.slug, plan.seatLimit, isLogCat]
    );
    orgRow = insertedOrg.rows[0];
    orgRole = "company_admin";

    await pool.query(
      `INSERT INTO public.org_members (organization_id, user_uid, email, org_role, status)
       VALUES ($1, $2, $3, 'company_admin', 'active')
       ON CONFLICT (organization_id, user_uid) DO NOTHING`,
      [orgRow.id, uid, normalizedEmail || uid]
    );

    // Backfill legacy records belonging to owner_uid with organization_id
    await pool.query(
      `UPDATE public.contacts SET organization_id = $1 WHERE user_uid = $2 AND organization_id IS NULL`,
      [orgRow.id, uid]
    ).catch(() => {});
    await pool.query(
      `UPDATE public.arn_opportunities SET organization_id = $1 WHERE owner_uid = $2 AND organization_id IS NULL`,
      [orgRow.id, uid]
    ).catch(() => {});
    await pool.query(
      `UPDATE public.arn_actions_queue SET organization_id = $1 WHERE owner_uid = $2 AND organization_id IS NULL`,
      [orgRow.id, uid]
    ).catch(() => {});
  }

  // 4. Count seats used (active members + pending invites)
  const [membersCountRes, invitesCountRes] = await Promise.all([
    pool.query(
      `SELECT count(*)::int AS cnt FROM public.org_members WHERE organization_id = $1 AND status = 'active'`,
      [orgRow.id]
    ),
    pool.query(
      `SELECT count(*)::int AS cnt FROM public.org_invitations WHERE organization_id = $1 AND status = 'pending'`,
      [orgRow.id]
    ),
  ]);

  const activeMembersCount = Number(membersCountRes.rows?.[0]?.cnt || 1);
  const pendingInvitesCount = Number(invitesCountRes.rows?.[0]?.cnt || 0);
  const plan = resolvePlanConfig(orgRow.plan_slug || membershipName);
  const seatLimit = Number(orgRow.seat_limit) || plan.seatLimit;
  const hasLogisticsAccess = canAccessLogisticsSuite({
    logisticsPlanActive: Boolean(orgRow.logistics_plan_active),
    membershipName,
    roleName,
  });

  return {
    organizationId: Number(orgRow.id),
    ownerUid: String(orgRow.owner_uid),
    orgName: String(orgRow.name),
    planSlug: plan.slug,
    planName: plan.displayName,
    seatLimit,
    usedSeats: activeMembersCount + pendingInvitesCount,
    activeMembersCount,
    pendingInvitesCount,
    orgRole,
    logisticsPlanActive: Boolean(orgRow.logistics_plan_active),
    hasLogisticsAccess,
  };
}

export async function upsertLinkedContactFromArn(params: {
  ownerUid: string;
  organizationId?: number | null;
  contactId?: number | null;
  opportunityId: number;
  companyName: string;
  contactName?: string | null;
  contactEmail?: string | null;
  cuit?: string | null;
  category?: string | null;
  corridor?: string | null;
  aiScore: number;
  stage: string;
  source?: string;
}): Promise<number | null> {
  if (!hasDatabaseConfig()) return null;
  await ensureProductionTables();

  const cleanEmail = String(params.contactEmail || "").trim().toLowerCase();
  const cleanCompany = String(params.companyName || "").trim();
  const orgId = params.organizationId || null;

  let existingId = params.contactId || null;

  if (!existingId && cleanEmail) {
    const byEmail = await pool.query(
      `SELECT id FROM public.contacts
       WHERE ($1::int IS NOT NULL AND organization_id = $1 OR user_uid = $2)
         AND lower(email) = $3
       ORDER BY id DESC LIMIT 1`,
      [orgId, params.ownerUid, cleanEmail]
    );
    if (byEmail.rows?.[0]?.id) existingId = Number(byEmail.rows[0].id);
  }

  if (!existingId && cleanCompany) {
    const byCompany = await pool.query(
      `SELECT id FROM public.contacts
       WHERE ($1::int IS NOT NULL AND organization_id = $1 OR user_uid = $2)
         AND lower(company) = lower($3)
       ORDER BY id DESC LIMIT 1`,
      [orgId, params.ownerUid, cleanCompany]
    );
    if (byCompany.rows?.[0]?.id) existingId = Number(byCompany.rows[0].id);
  }

  if (existingId) {
    await pool.query(
      `UPDATE public.contacts
       SET organization_id = COALESCE(organization_id, $1),
           arn_opportunity_id = $2,
           ai_score = $3,
           lead_stage = $4,
           last_arn_sync_at = now(),
           industry = COALESCE(NULLIF($5, ''), industry),
           location = COALESCE(NULLIF($6, ''), location),
           cuit_rut = COALESCE(NULLIF($7, ''), cuit_rut)
       WHERE id = $8`,
      [
        orgId,
        params.opportunityId,
        params.aiScore,
        params.stage,
        params.category || "",
        params.corridor || "",
        params.cuit || "",
        existingId,
      ]
    );
    await pool.query(
      `UPDATE public.arn_opportunities SET contact_id = $1 WHERE id = $2`,
      [existingId, params.opportunityId]
    );
    return existingId;
  }

  const inserted = await pool.query(
    `INSERT INTO public.contacts (
      user_uid, organization_id, entity_type, name, company, role, email,
      type, status, cuit_rut, industry, location,
      arn_opportunity_id, ai_score, lead_stage, last_arn_sync_at
    ) VALUES ($1,$2,'contact',$3,$4,'Contacto Comercial',$5,$6,'active',$7,$8,$9,$10,$11,$12,now())
    RETURNING id`,
    [
      params.ownerUid,
      orgId,
      params.contactName || cleanCompany || "Contacto B2B",
      cleanCompany || "Empresa Detectada",
      cleanEmail || null,
      params.source === "rfq" ? "Cliente / Comprador" : "Prospecto ARN",
      params.cuit || null,
      params.category || "Servicios Industriales",
      params.corridor || "Patagonia",
      params.opportunityId,
      params.aiScore,
      params.stage,
    ]
  );

  const newContactId = Number(inserted.rows[0].id);
  await pool.query(
    `UPDATE public.arn_opportunities SET contact_id = $1 WHERE id = $2`,
    [newContactId, params.opportunityId]
  );
  return newContactId;
}

export function registerSaasAndFleetRoutes(
  app: Express,
  deps: {
    runArnPipelineForEvent: (params: {
      ownerUid: string;
      organizationId?: number | null;
      contactId?: number | null;
      source: string;
      companyName?: string;
      contactName?: string;
      contactEmail?: string;
      category?: string;
      rawText: string;
      metadata?: Record<string, any>;
    }) => Promise<any>;
    recordAutomationEvent: (
      direction: "outbound_n8n" | "inbound_odoo",
      event: string,
      status: string,
      payload: any
    ) => Promise<any>;
  }
) {
  // ==========================================
  // 1. MULTI-USER SAAS: ORGANIZACIÓN, EQUIPO Y PLANES (2 / 5 / 10 USUARIOS)
  // ==========================================
  app.get("/api/org/team", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      const tenant = await resolveTenantContext(
        req.user!.uid,
        req.user!.email,
        req.user!.membershipName,
        req.user!.roleName
      );
      if (!tenant) {
        return res.json({
          organization: {
            id: 0,
            name: "Mi Empresa B2B",
            planSlug: "gratis",
            planName: SAAS_PLANS.gratis.displayName,
            seatLimit: 2,
            usedSeats: 1,
            logisticsPlanActive: false,
            hasLogisticsAccess: false,
          },
          members: [
            {
              user_uid: req.user!.uid,
              email: req.user!.email,
              org_role: "company_admin",
              status: "active",
            },
          ],
          invitations: [],
          plansCatalog: Object.values(SAAS_PLANS),
          logisticsMembership: LOGISTICS_MEMBERSHIP,
        });
      }

      const [membersRes, invitesRes] = await Promise.all([
        pool.query(
          `SELECT id, user_uid, email, org_role, status, joined_at
           FROM public.org_members
           WHERE organization_id = $1 AND status = 'active'
           ORDER BY joined_at ASC`,
          [tenant.organizationId]
        ),
        pool.query(
          `SELECT id, email, org_role, status, created_at
           FROM public.org_invitations
           WHERE organization_id = $1 AND status = 'pending'
           ORDER BY created_at DESC`,
          [tenant.organizationId]
        ),
      ]);

      res.json({
        organization: tenant,
        members: membersRes.rows || [],
        invitations: invitesRes.rows || [],
        plansCatalog: Object.values(SAAS_PLANS),
        logisticsMembership: LOGISTICS_MEMBERSHIP,
      });
    } catch (err: any) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });

  app.post("/api/org/invitations", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      const tenant = await resolveTenantContext(
        req.user!.uid,
        req.user!.email,
        req.user!.membershipName,
        req.user!.roleName
      );
      if (!tenant) return res.status(500).json({ error: "Base de datos no configurada" });

      if (tenant.orgRole !== "company_admin" && req.user!.roleName !== "system_admin") {
        return res.status(403).json({
          error: "Solo el Administrador de la Empresa puede invitar nuevos usuarios.",
        });
      }

      const inviteEmail = String(req.body?.email || "").trim().toLowerCase();
      const orgRole = ["company_admin", "comercial", "operador"].includes(req.body?.orgRole)
        ? req.body.orgRole
        : "comercial";

      if (!inviteEmail || !inviteEmail.includes("@")) {
        return res.status(400).json({ error: "Ingresa un email corporativo válido." });
      }

      const duplicateMember = await pool.query(
        `SELECT id FROM public.org_members WHERE organization_id = $1 AND lower(email) = $2 AND status = 'active'`,
        [tenant.organizationId, inviteEmail]
      );
      if (duplicateMember.rows.length > 0) {
        return res.status(400).json({ error: "Este usuario ya forma parte del equipo de la empresa." });
      }

      const duplicateInvite = await pool.query(
        `SELECT id FROM public.org_invitations WHERE organization_id = $1 AND lower(email) = $2 AND status = 'pending'`,
        [tenant.organizationId, inviteEmail]
      );
      if (duplicateInvite.rows.length > 0) {
        return res.status(400).json({ error: "Ya existe una invitación pendiente para ese email." });
      }

      const seatCheck = canAddOrganizationSeat(tenant.usedSeats, tenant.seatLimit);
      if (!seatCheck.allowed) {
        return res.status(403).json({
          error: seatCheck.reason,
          code: "SEAT_LIMIT_REACHED",
          seatLimit: tenant.seatLimit,
          usedSeats: tenant.usedSeats,
        });
      }

      const token = crypto.randomBytes(16).toString("hex");
      const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

      const inserted = await pool.query(
        `INSERT INTO public.org_invitations (organization_id, email, org_role, invited_by_uid, token, status, expires_at)
         VALUES ($1, $2, $3, $4, $5, 'pending', $6)
         RETURNING *`,
        [tenant.organizationId, inviteEmail, orgRole, req.user!.uid, token, expiresAt]
      );

      if (process.env.RESEND_API_KEY || process.env.SMTP_PASSWORD) {
        try {
          const { sendEmail } = await import("../services/emailService.ts");
          await sendEmail(
            inviteEmail,
            `Invitación a ${tenant.orgName} en xPatagonia B2B`,
            `Hola,\n\nTe invitaron a sumarte al espacio de trabajo de ${tenant.orgName} en xPatagonia con rol "${orgRole}".\n\nIngresá o registrate en https://www.xpatagonia.online con este correo (${inviteEmail}) para acceder automáticamente al CRM, ARN IA y los módulos de tu empresa.`
          );
        } catch {
          // Non-blocking email notification
        }
      }

      await deps.recordAutomationEvent("outbound_n8n", "org.member.invited", "processed", {
        organizationId: tenant.organizationId,
        email: inviteEmail,
        orgRole,
      });

      res.json({ success: true, invitation: inserted.rows[0] });
    } catch (err: any) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });

  app.delete("/api/org/invitations/:id", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      const tenant = await resolveTenantContext(
        req.user!.uid,
        req.user!.email,
        req.user!.membershipName,
        req.user!.roleName
      );
      if (!tenant) return res.status(500).json({ error: "DB no configurada" });
      if (tenant.orgRole !== "company_admin" && req.user!.roleName !== "system_admin") {
        return res.status(403).json({ error: "Permisos insuficientes" });
      }
      await pool.query(
        `UPDATE public.org_invitations SET status = 'revoked' WHERE id = $1 AND organization_id = $2`,
        [Number(req.params.id), tenant.organizationId]
      );
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });

  app.patch("/api/org/members/:uid/role", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      const tenant = await resolveTenantContext(
        req.user!.uid,
        req.user!.email,
        req.user!.membershipName,
        req.user!.roleName
      );
      if (!tenant) return res.status(500).json({ error: "DB no configurada" });
      if (tenant.orgRole !== "company_admin" && req.user!.roleName !== "system_admin") {
        return res.status(403).json({ error: "Permisos insuficientes" });
      }
      const nextRole = ["company_admin", "comercial", "operador"].includes(req.body?.orgRole)
        ? req.body.orgRole
        : "comercial";
      await pool.query(
        `UPDATE public.org_members SET org_role = $1 WHERE organization_id = $2 AND user_uid = $3`,
        [nextRole, tenant.organizationId, req.params.uid]
      );
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });

  app.delete("/api/org/members/:uid", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      const tenant = await resolveTenantContext(
        req.user!.uid,
        req.user!.email,
        req.user!.membershipName,
        req.user!.roleName
      );
      if (!tenant) return res.status(500).json({ error: "DB no configurada" });
      if (tenant.orgRole !== "company_admin" && req.user!.roleName !== "system_admin") {
        return res.status(403).json({ error: "Permisos insuficientes" });
      }
      if (req.params.uid === tenant.ownerUid) {
        return res.status(400).json({ error: "No podés eliminar al titular principal de la empresa." });
      }
      await pool.query(
        `DELETE FROM public.org_members WHERE organization_id = $1 AND user_uid = $2`,
        [tenant.organizationId, req.params.uid]
      );
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });

  app.post("/api/org/plan", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      const tenant = await resolveTenantContext(
        req.user!.uid,
        req.user!.email,
        req.user!.membershipName,
        req.user!.roleName
      );
      if (!tenant) return res.status(500).json({ error: "DB no configurada" });
      if (tenant.orgRole !== "company_admin" && req.user!.roleName !== "system_admin") {
        return res.status(403).json({ error: "Solo el Administrador de la Empresa puede cambiar el plan." });
      }

      const body = req.body || {};
      const nextPlan = body.planSlug ? resolvePlanConfig(body.planSlug) : resolvePlanConfig(tenant.planSlug);
      const nextLogistics =
        typeof body.logisticsPlanActive === "boolean"
          ? body.logisticsPlanActive
          : tenant.logisticsPlanActive;
      const nextName = typeof body.orgName === "string" && body.orgName.trim() ? body.orgName.trim() : tenant.orgName;

      if (tenant.usedSeats > nextPlan.seatLimit) {
        return res.status(400).json({
          error: `Actualmente tenés ${tenant.usedSeats} asientos ocupados. Liberá miembros o invitaciones antes de bajar a un plan de ${nextPlan.seatLimit} usuarios.`,
        });
      }

      await pool.query(
        `UPDATE public.organizations
         SET plan_slug = $1, seat_limit = $2, logistics_plan_active = $3, name = $4, updated_at = now()
         WHERE id = $5`,
        [nextPlan.slug, nextPlan.seatLimit, nextLogistics, nextName, tenant.organizationId]
      );

      await deps.recordAutomationEvent("outbound_n8n", "saas.plan.updated", "processed", {
        organizationId: tenant.organizationId,
        planSlug: nextPlan.slug,
        seatLimit: nextPlan.seatLimit,
        logisticsPlanActive: nextLogistics,
      });

      const updatedTenant = await resolveTenantContext(
        req.user!.uid,
        req.user!.email,
        nextPlan.membershipLabel,
        req.user!.roleName
      );
      res.json({ success: true, organization: updatedTenant });
    } catch (err: any) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });

  // ==========================================
  // 2. PANEL DE CONTACTOS CRM <-> ARN IA (BIDIRECCIONAL)
  // ==========================================
  app.get("/api/crm/contacts", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      res.setHeader("Cache-Control", "no-store");
      const tenant = await resolveTenantContext(
        req.user!.uid,
        req.user!.email,
        req.user!.membershipName,
        req.user!.roleName
      );
      if (!tenant) return res.json({ contacts: [] });

      const rows = await pool.query(
        `SELECT c.*,
                ao.stage AS opp_stage,
                ao.ai_score AS opp_ai_score,
                ao.estimated_amount_usd AS opp_amount_usd,
                ao.recommended_action AS opp_recommended_action
         FROM public.contacts c
         LEFT JOIN public.arn_opportunities ao ON ao.id = c.arn_opportunity_id
         WHERE c.organization_id = $1 OR c.user_uid = $2
         ORDER BY c.created_at DESC
         LIMIT 200`,
        [tenant.organizationId, req.user!.uid]
      );
      res.json({ contacts: rows.rows || [] });
    } catch (err: any) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });

  app.post("/api/crm/contacts", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      const tenant = await resolveTenantContext(
        req.user!.uid,
        req.user!.email,
        req.user!.membershipName,
        req.user!.roleName
      );
      if (!tenant) return res.status(500).json({ error: "DB no configurada" });

      const b = req.body || {};
      if (!b.name && !b.company) {
        return res.status(400).json({ error: "Nombre o empresa del contacto es obligatorio." });
      }

      const inserted = await pool.query(
        `INSERT INTO public.contacts (
          user_uid, organization_id, entity_type, name, company, role, email, phone,
          type, status, website, cuit_rut, industry, location, lead_stage
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'nuevo')
        RETURNING *`,
        [
          req.user!.uid,
          tenant.organizationId,
          b.entityType || "contact",
          String(b.name || b.company).trim(),
          String(b.company || b.name).trim(),
          b.role || "Compras / Comercial",
          b.email || null,
          b.phone || null,
          b.type || "Cliente",
          b.status || "active",
          b.website || null,
          b.cuitRut || null,
          b.industry || "Servicios Industriales",
          b.location || "Patagonia",
        ]
      );

      let contact = inserted.rows[0];
      let arnResult: any = null;

      if (b.autoActivateArn) {
        arnResult = await deps.runArnPipelineForEvent({
          ownerUid: req.user!.uid,
          organizationId: tenant.organizationId,
          contactId: contact.id,
          source: "crm_contact",
          companyName: contact.company || contact.name,
          contactName: contact.name,
          contactEmail: contact.email || undefined,
          category: contact.industry || undefined,
          rawText:
            b.arnNote ||
            `Nuevo contacto CRM registrado: ${contact.name} (${contact.company}). Rubro: ${contact.industry}. Ubicación: ${contact.location}. Evaluar oportunidad comercial y preparar primer acercamiento.`,
        });
        const refreshed = await pool.query(`SELECT * FROM public.contacts WHERE id = $1`, [contact.id]);
        if (refreshed.rows?.[0]) contact = refreshed.rows[0];
      }

      res.json({ success: true, contact, arnResult });
    } catch (err: any) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });

  app.patch("/api/crm/contacts/:id", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      const tenant = await resolveTenantContext(
        req.user!.uid,
        req.user!.email,
        req.user!.membershipName,
        req.user!.roleName
      );
      if (!tenant) return res.status(500).json({ error: "DB no configurada" });
      const id = Number(req.params.id);
      const b = req.body || {};

      const updated = await pool.query(
        `UPDATE public.contacts
         SET name = COALESCE($1, name),
             company = COALESCE($2, company),
             role = COALESCE($3, role),
             email = COALESCE($4, email),
             phone = COALESCE($5, phone),
             type = COALESCE($6, type),
             status = COALESCE($7, status),
             cuit_rut = COALESCE($8, cuit_rut),
             industry = COALESCE($9, industry),
             location = COALESCE($10, location),
             odoo_synced = COALESCE($11, odoo_synced)
         WHERE id = $12 AND (organization_id = $13 OR user_uid = $14)
         RETURNING *`,
        [
          b.name ?? null,
          b.company ?? null,
          b.role ?? null,
          b.email ?? null,
          b.phone ?? null,
          b.type ?? null,
          b.status ?? null,
          b.cuitRut ?? null,
          b.industry ?? null,
          b.location ?? null,
          typeof b.odooSynced === "boolean" ? b.odooSynced : null,
          id,
          tenant.organizationId,
          req.user!.uid,
        ]
      );
      if (!updated.rows?.[0]) return res.status(404).json({ error: "Contacto no encontrado" });
      res.json({ success: true, contact: updated.rows[0] });
    } catch (err: any) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });

  app.delete("/api/crm/contacts/:id", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      const tenant = await resolveTenantContext(
        req.user!.uid,
        req.user!.email,
        req.user!.membershipName,
        req.user!.roleName
      );
      if (!tenant) return res.status(500).json({ error: "DB no configurada" });
      await pool.query(
        `DELETE FROM public.contacts WHERE id = $1 AND (organization_id = $2 OR user_uid = $3)`,
        [Number(req.params.id), tenant.organizationId, req.user!.uid]
      );
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });

  app.post("/api/crm/contacts/:id/activate-arn", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      const tenant = await resolveTenantContext(
        req.user!.uid,
        req.user!.email,
        req.user!.membershipName,
        req.user!.roleName
      );
      if (!tenant) return res.status(500).json({ error: "DB no configurada" });
      const contactId = Number(req.params.id);

      const contactRes = await pool.query(
        `SELECT * FROM public.contacts WHERE id = $1 AND (organization_id = $2 OR user_uid = $3)`,
        [contactId, tenant.organizationId, req.user!.uid]
      );
      const contact = contactRes.rows?.[0];
      if (!contact) return res.status(404).json({ error: "Contacto no encontrado en tu organización." });

      const note = String(req.body?.note || "").trim();
      const result = await deps.runArnPipelineForEvent({
        ownerUid: req.user!.uid,
        organizationId: tenant.organizationId,
        contactId: contact.id,
        source: "crm_contact",
        companyName: contact.company || contact.name,
        contactName: contact.name,
        contactEmail: contact.email || undefined,
        category: contact.industry || undefined,
        rawText:
          note ||
          `Activación desde CRM Contactos: ${contact.name} (${contact.company || "Sin empresa"}), Cargo: ${contact.role || "Compras"}, Rubro: ${contact.industry || "General"}, Zona: ${contact.location || "Patagonia"}. Preparar propuesta comercial B2B y seguimiento.`,
        metadata: { cuit: contact.cuit_rut || "", phone: contact.phone || "" },
      });

      const refreshed = await pool.query(`SELECT * FROM public.contacts WHERE id = $1`, [contactId]);
      res.json({ success: true, contact: refreshed.rows?.[0] || contact, ...result });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || formatPgError(err) });
    }
  });

  // ==========================================
  // 3. MEMBRESÍA LOGÍSTICA: FLOTA, CHOFERES Y CONTRATOS
  // ==========================================
  app.get("/api/fleet/overview", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      res.setHeader("Cache-Control", "no-store");
      const tenant = await resolveTenantContext(
        req.user!.uid,
        req.user!.email,
        req.user!.membershipName,
        req.user!.roleName
      );
      if (!tenant) {
        return res.json({
          hasLogisticsMembership: false,
          vehicles: [],
          drivers: [],
          contracts: [],
          openLoads: [],
        });
      }

      const [loadsRes, shipperContractsRes] = await Promise.all([
        pool.query(`SELECT * FROM public.logistics_loads ORDER BY created_at DESC LIMIT 40`),
        pool.query(
          `SELECT * FROM public.logistics_contracts
           WHERE shipper_org_id = $1 OR carrier_org_id = $1
           ORDER BY updated_at DESC LIMIT 40`,
          [tenant.organizationId]
        ),
      ]);

      if (!tenant.hasLogisticsAccess) {
        return res.json({
          hasLogisticsMembership: false,
          organization: tenant,
          vehicles: [],
          drivers: [],
          contracts: shipperContractsRes.rows || [],
          openLoads: loadsRes.rows || [],
        });
      }

      const [vehiclesRes, driversRes] = await Promise.all([
        pool.query(
          `SELECT * FROM public.fleet_vehicles WHERE organization_id = $1 ORDER BY created_at DESC`,
          [tenant.organizationId]
        ),
        pool.query(
          `SELECT * FROM public.fleet_drivers WHERE organization_id = $1 ORDER BY created_at DESC`,
          [tenant.organizationId]
        ),
      ]);

      res.json({
        hasLogisticsMembership: true,
        organization: tenant,
        vehicles: vehiclesRes.rows || [],
        drivers: driversRes.rows || [],
        contracts: shipperContractsRes.rows || [],
        openLoads: loadsRes.rows || [],
      });
    } catch (err: any) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });

  app.post("/api/fleet/vehicles", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      const tenant = await resolveTenantContext(
        req.user!.uid,
        req.user!.email,
        req.user!.membershipName,
        req.user!.roleName
      );
      if (!tenant) return res.status(500).json({ error: "DB no configurada" });
      if (!tenant.hasLogisticsAccess) {
        return res.status(403).json({
          error: "Requiere Membresía Logística & Control de Flota activa para registrar unidades.",
          requiresLogisticsMembership: true,
        });
      }

      const b = req.body || {};
      if (!b.name || !b.plate) {
        return res.status(400).json({ error: "Nombre de unidad y dominio/patente son obligatorios." });
      }
      const inserted = await pool.query(
        `INSERT INTO public.fleet_vehicles (
          organization_id, owner_uid, name, plate, vehicle_type, capacity_tons,
          corridor, vtv_expiry, insurance_expiry, status, gps_label
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        RETURNING *`,
        [
          tenant.organizationId,
          req.user!.uid,
          String(b.name).trim(),
          String(b.plate).trim().toUpperCase(),
          b.vehicleType || "Semirremolque 28t",
          Math.max(1, Number(b.capacityTons) || 28),
          b.corridor || "RN 3 / Patagónica",
          b.vtvExpiry || null,
          b.insuranceExpiry || null,
          b.status || "disponible",
          b.gpsLabel || "Activo en corredor",
        ]
      );
      res.json({ success: true, vehicle: inserted.rows[0] });
    } catch (err: any) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });

  app.patch("/api/fleet/vehicles/:id", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      const tenant = await resolveTenantContext(
        req.user!.uid,
        req.user!.email,
        req.user!.membershipName,
        req.user!.roleName
      );
      if (!tenant) return res.status(500).json({ error: "DB no configurada" });
      if (!tenant.hasLogisticsAccess) {
        return res.status(403).json({ error: "Requiere Membresía Logística activa." });
      }
      const nextStatus = ["disponible", "en_ruta", "mantenimiento"].includes(req.body?.status)
        ? req.body.status
        : "disponible";
      const updated = await pool.query(
        `UPDATE public.fleet_vehicles SET status = $1 WHERE id = $2 AND organization_id = $3 RETURNING *`,
        [nextStatus, Number(req.params.id), tenant.organizationId]
      );
      res.json({ success: true, vehicle: updated.rows?.[0] || null });
    } catch (err: any) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });

  app.delete("/api/fleet/vehicles/:id", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      const tenant = await resolveTenantContext(
        req.user!.uid,
        req.user!.email,
        req.user!.membershipName,
        req.user!.roleName
      );
      if (!tenant) return res.status(500).json({ error: "DB no configurada" });
      if (!tenant.hasLogisticsAccess) {
        return res.status(403).json({ error: "Requiere Membresía Logística activa." });
      }
      await pool.query(
        `DELETE FROM public.fleet_vehicles WHERE id = $1 AND organization_id = $2`,
        [Number(req.params.id), tenant.organizationId]
      );
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });

  app.post("/api/fleet/drivers", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      const tenant = await resolveTenantContext(
        req.user!.uid,
        req.user!.email,
        req.user!.membershipName,
        req.user!.roleName
      );
      if (!tenant) return res.status(500).json({ error: "DB no configurada" });
      if (!tenant.hasLogisticsAccess) {
        return res.status(403).json({
          error: "Requiere Membresía Logística & Control de Flota activa para registrar choferes.",
          requiresLogisticsMembership: true,
        });
      }
      const b = req.body || {};
      if (!b.fullName) {
        return res.status(400).json({ error: "El nombre completo del chofer es obligatorio." });
      }
      const inserted = await pool.query(
        `INSERT INTO public.fleet_drivers (
          organization_id, owner_uid, full_name, dni, linti_license, phone, assigned_vehicle_id, status
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        RETURNING *`,
        [
          tenant.organizationId,
          req.user!.uid,
          String(b.fullName).trim(),
          b.dni || null,
          b.lintiLicense || null,
          b.phone || null,
          b.assignedVehicleId ? Number(b.assignedVehicleId) : null,
          b.status || "disponible",
        ]
      );
      res.json({ success: true, driver: inserted.rows[0] });
    } catch (err: any) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });

  app.delete("/api/fleet/drivers/:id", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      const tenant = await resolveTenantContext(
        req.user!.uid,
        req.user!.email,
        req.user!.membershipName,
        req.user!.roleName
      );
      if (!tenant) return res.status(500).json({ error: "DB no configurada" });
      if (!tenant.hasLogisticsAccess) {
        return res.status(403).json({ error: "Requiere Membresía Logística activa." });
      }
      await pool.query(
        `DELETE FROM public.fleet_drivers WHERE id = $1 AND organization_id = $2`,
        [Number(req.params.id), tenant.organizationId]
      );
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });

  app.post("/api/logistics/contracts", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      const tenant = await resolveTenantContext(
        req.user!.uid,
        req.user!.email,
        req.user!.membershipName,
        req.user!.roleName
      );
      if (!tenant) return res.status(500).json({ error: "DB no configurada" });
      if (!tenant.hasLogisticsAccess) {
        return res.status(403).json({
          error: "Solo empresas con Membresía Logística & Flota pueden postular unidades y operar contratos de transporte.",
          requiresLogisticsMembership: true,
        });
      }

      const b = req.body || {};
      if (!b.loadId || !b.originName || !b.destinationName) {
        return res.status(400).json({ error: "Carga, origen y destino son obligatorios." });
      }

      const trackingCode = `TRK-${Date.now().toString().slice(-6)}`;
      const inserted = await pool.query(
        `INSERT INTO public.logistics_contracts (
          load_id, origin_name, destination_name, shipper_org_id, shipper_uid,
          carrier_org_id, carrier_uid, carrier_name, vehicle_id, driver_id,
          agreed_price_ars, status, tracking_code, notes
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'ofertado',$12,$13)
        RETURNING *`,
        [
          String(b.loadId),
          String(b.originName),
          String(b.destinationName),
          b.shipperOrgId ? Number(b.shipperOrgId) : null,
          b.shipperUid || null,
          tenant.organizationId,
          req.user!.uid,
          tenant.orgName,
          b.vehicleId ? Number(b.vehicleId) : null,
          b.driverId ? Number(b.driverId) : null,
          Math.max(0, Number(b.agreedPriceArs) || 0),
          trackingCode,
          b.notes || null,
        ]
      );

      await deps.recordAutomationEvent("outbound_n8n", "logistics.contract.bid_submitted", "processed", {
        contractId: inserted.rows[0].id,
        trackingCode,
        carrierOrgId: tenant.organizationId,
      });

      res.json({ success: true, contract: inserted.rows[0] });
    } catch (err: any) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });

  app.patch("/api/logistics/contracts/:id/status", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      const tenant = await resolveTenantContext(
        req.user!.uid,
        req.user!.email,
        req.user!.membershipName,
        req.user!.roleName
      );
      if (!tenant) return res.status(500).json({ error: "DB no configurada" });
      const contractId = Number(req.params.id);
      const nextStatus = String(req.body?.status || "");
      const allowed = ["ofertado", "adjudicado", "en_transito", "entregado", "cancelado"];
      if (!allowed.includes(nextStatus)) {
        return res.status(400).json({ error: "Estado de contrato inválido" });
      }

      const existingRes = await pool.query(
        `SELECT * FROM public.logistics_contracts
         WHERE id = $1 AND (carrier_org_id = $2 OR shipper_org_id = $2 OR carrier_uid = $3 OR shipper_uid = $3)`,
        [contractId, tenant.organizationId, req.user!.uid]
      );
      const existing = existingRes.rows?.[0];
      if (!existing) return res.status(404).json({ error: "Contrato no encontrado" });

      const updated = await pool.query(
        `UPDATE public.logistics_contracts SET status = $1, updated_at = now() WHERE id = $2 RETURNING *`,
        [nextStatus, contractId]
      );

      if (existing.vehicle_id && (nextStatus === "en_transito" || nextStatus === "entregado")) {
        await pool.query(
          `UPDATE public.fleet_vehicles SET status = $1 WHERE id = $2`,
          [nextStatus === "en_transito" ? "en_ruta" : "disponible", existing.vehicle_id]
        ).catch(() => {});
      }

      await deps.recordAutomationEvent("outbound_n8n", "logistics.contract.status_changed", "processed", {
        contractId,
        status: nextStatus,
        trackingCode: existing.tracking_code,
      });

      res.json({ success: true, contract: updated.rows[0] });
    } catch (err: any) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });
}
