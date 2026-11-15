import fs from "fs";
import express from "express";
import path from "path";
import crypto from "crypto";
import cors from "cors";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  requireAuth,
  requireRoles,
  resolveUserRoleAndMembership,
  type AuthRequest,
} from "../middleware/auth.ts";
import { getOrCreateUser } from "../db/users.ts";
import { getUserRfqs, createRfq, updateRfqStatus } from "../db/rfqs.ts";
import { notifyProvidersForRfq } from "../services/notificationService.ts";
import { db, pool, hasDatabaseConfig, formatPgError } from "../db/index.ts";
import { insights, siteSettings, automationLogs, contacts } from "../db/schema.ts";
import { eq, desc } from "drizzle-orm";
import { registerArnAndModuleRoutes, runArnPipelineForEvent } from "./arnRoutes.ts";
import { registerWorkerAndWebhookRoutes } from "./workerAndWebhookRoutes.ts";
import { registerBillingAndKybRoutes } from "./billingAndKybRoutes.ts";
import { computeNextRetryDate } from "../services/vpsWorkerService.ts";
import { getMarketSnapshot } from "../services/marketService.ts";

let cachedSupabaseAdmin: SupabaseClient | null = null;
export function getSupabaseAdminClient(): SupabaseClient | null {
  if (cachedSupabaseAdmin) return cachedSupabaseAdmin;
  const supabaseUrl = (
    process.env.VITE_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ""
  )
    .trim()
    .replace(/^['"]|['"]$/g, "");
  const serviceRoleKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    ""
  )
    .trim()
    .replace(/^['"]|['"]$/g, "");

  if (
    (supabaseUrl.startsWith("http://") || supabaseUrl.startsWith("https://")) &&
    serviceRoleKey.length > 20
  ) {
    cachedSupabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    return cachedSupabaseAdmin;
  }
  return null;
}

const DEFAULT_HERO_SUGGESTIONS = [
  "Logística de Frío -25°C",
  "Válvulas Esféricas API 6D",
  "Mantenimiento de Parques Eólicos",
  "Inspección No Destructiva NDT",
];

const isUsableGeminiKey = (key?: string): key is string => {
  return Boolean(key && key.trim().length > 10 && !key.includes("MY_GEMINI_API_KEY"));
};

export function createApiApp() {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });

  app.use(express.json({ limit: "25mb" }));

  const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
  if (!process.env.VERCEL) {
    try {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      app.use("/uploads", express.static(UPLOADS_DIR));
    } catch {
      // ignore read-only dir edge cases
    }
  }

  const inMemoryAutomationLogs: any[] = [];

  async function recordAutomationEvent(
    direction: "outbound_n8n" | "inbound_odoo",
    event: string,
    status: string,
    payload: any
  ) {
    let resolvedStatus = status;
    let attempts = 0;
    let nextRetryAt: Date | null = null;
    let lastError: string | null = null;

    const n8nUrl = String(process.env.N8N_WEBHOOK_URL || "").trim();
    if (direction === "outbound_n8n" && n8nUrl && status !== "processed") {
      try {
        const sharedSecret = String(process.env.N8N_SHARED_SECRET || "").trim();
        const fwRes = await fetch(n8nUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(sharedSecret ? { "x-n8n-secret": sharedSecret } : {}),
          },
          body: JSON.stringify({ event, direction, payload, timestamp: new Date().toISOString() }),
          signal: AbortSignal.timeout(5000),
        });
        if (fwRes.ok) {
          resolvedStatus = "processed";
        } else {
          resolvedStatus = "retry_pending";
          attempts = 1;
          nextRetryAt = computeNextRetryDate(1);
          lastError = `n8n HTTP ${fwRes.status}`;
        }
      } catch (fwErr: any) {
        resolvedStatus = "retry_pending";
        attempts = 1;
        nextRetryAt = computeNextRetryDate(1);
        lastError = fwErr?.message || "n8n unreachable";
      }
    } else if (direction === "outbound_n8n" && !n8nUrl && status === "local_queue") {
      nextRetryAt = computeNextRetryDate(1);
    }

    const entry = {
      id: Date.now(),
      direction,
      event,
      status: resolvedStatus,
      payload,
      attempts,
      createdAt: new Date().toISOString(),
    };
    inMemoryAutomationLogs.unshift(entry);
    if (inMemoryAutomationLogs.length > 50) inMemoryAutomationLogs.pop();

    let persistedInPg = false;
    if (hasDatabaseConfig()) {
      try {
        await db.insert(automationLogs).values({
          direction,
          event,
          status: resolvedStatus,
          payload,
          attempts,
          nextRetryAt,
          lastError,
        });
        persistedInPg = true;
      } catch {
        // Optional DB persistence
      }
    }

    if (!persistedInPg) {
      const sbAdmin = getSupabaseAdminClient();
      if (sbAdmin) {
        try {
          await sbAdmin.from("automation_logs").insert({
            direction,
            event,
            status: resolvedStatus,
            payload,
          });
        } catch {
          // Optional Supabase REST persistence
        }
      }
    }

    return entry;
  }

  const allowedOrigins = [
    "https://xpatagonia.online",
    "https://www.xpatagonia.online",
    "https://api.xpatagonia.online",
    "http://localhost:3000",
    "http://localhost:5173",
  ];

  app.use(
    cors({
      origin: function (origin, callback) {
        if (
          !origin ||
          allowedOrigins.includes(origin) ||
          origin.includes(".run.app") ||
          origin.includes(".onrender.com") ||
          origin.includes(".vercel.app") ||
          origin.includes(".pages.dev") ||
          origin.includes("xpatagonia.online")
        ) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
    })
  );

  // ==========================================
  // HEALTH & DIAGNOSTICS
  // ==========================================
  app.get("/api/health", async (req, res) => {
    const supabaseUrl = (
      process.env.VITE_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      ""
    )
      .trim()
      .replace(/^['"]|['"]$/g, "");
    const supabaseAnon = (
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      ""
    )
      .trim()
      .replace(/^['"]|['"]$/g, "");
    const serviceRoleKey = (
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_KEY ||
      process.env.SUPABASE_SECRET_KEY ||
      ""
    )
      .trim()
      .replace(/^['"]|['"]$/g, "");
    const geminiKey = process.env.CUSTOM_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    const resendConfigured = Boolean(
      process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim().length > 5
    );
    const smtpConfigured = Boolean(process.env.SMTP_PASSWORD);
    const imapConfigured = Boolean(process.env.IMAP_PASSWORD);

    let dbDiagnostics: { ok: boolean; error?: string; siteSettingsTable?: boolean } | undefined;
    if (req.query.checkDb === "1" && hasDatabaseConfig()) {
      try {
        await pool.query("SELECT 1");
        const tbl = await pool.query("SELECT to_regclass('public.site_settings') IS NOT NULL AS exists");
        dbDiagnostics = { ok: true, siteSettingsTable: Boolean(tbl.rows?.[0]?.exists) };
      } catch (dbErr: any) {
        dbDiagnostics = { ok: false, error: formatPgError(dbErr) };
      }
    }

    res.json({
      status: "ok",
      runtime: process.env.VERCEL ? "vercel_serverless" : "node_server",
      environment: process.env.NODE_ENV || "development",
      vercelEnv: process.env.VERCEL_ENV || null,
      databaseConfigured: hasDatabaseConfig(),
      ...(dbDiagnostics ? { dbDiagnostics } : {}),
      supabaseConfigured: Boolean(supabaseUrl && supabaseAnon),
      supabaseAdminConfigured: Boolean(getSupabaseAdminClient()),
      supabaseServiceRolePresent: serviceRoleKey.length > 20,
      geminiConfigured: isUsableGeminiKey(geminiKey),
      resendConfigured,
      emailOutboundProvider: resendConfigured
        ? "resend_https"
        : smtpConfigured
        ? "cyberpanel_smtp"
        : "none",
      mailHost: process.env.IMAP_HOST || "mail.xpatagonia.online",
      mailConfigured: Boolean(imapConfigured && (resendConfigured || smtpConfigured)),
      osrmConfigured: Boolean(process.env.OSRM_BASE_URL),
      osrmMode: process.env.OSRM_BASE_URL ? "supermicro" : "public_fallback",
      n8nConfigured: Boolean(process.env.N8N_WEBHOOK_URL),
      n8nMode: process.env.N8N_WEBHOOK_URL ? "active" : "local_queue",
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/api/public-config", (req, res) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    res.setHeader("CDN-Cache-Control", "no-store");
    const supabaseUrl = (
      process.env.VITE_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      ""
    ).trim();
    const supabaseAnonKey = (
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      ""
    ).trim();
    res.json({
      supabaseUrl,
      supabaseAnonKey,
    });
  });

  // ==========================================
  // AUTH, RBAC & USERS
  // ==========================================
  app.post("/api/register-setup", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      if (!req.user || !req.user.uid || !req.user.email) {
        res.status(400).json({ error: "Invalid user data" });
        return;
      }

      const { cuit, category } = req.body;
      const { registerUserSetup } = await import("../db/users.ts");
      const user = await registerUserSetup(req.user.uid, req.user.email, cuit, category);
      res.json({ user });
    } catch (error) {
      console.error("Error setting up new user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/me/access", requireAuth as any, (req: AuthRequest, res) => {
    const roleName = req.user?.roleName || "vendor";
    res.json({
      uid: req.user?.uid,
      email: req.user?.email,
      roleName,
      membershipName: req.user?.membershipName || "Basic",
      isAdmin: ["system_admin", "content_editor"].includes(roleName),
    });
  });

  app.get(
    "/api/admin/users",
    requireAuth as any,
    requireRoles(["system_admin", "support_operator"]) as any,
    async (req: AuthRequest, res) => {
      try {
        const { getAllUsersWithRoles } = await import("../db/users.ts");
        const users = await getAllUsersWithRoles();
        res.json(users);
      } catch (error) {
        console.error("Error getting users:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    }
  );

  app.post(
    "/api/admin/users/:uid/role",
    requireAuth as any,
    requireRoles(["system_admin"]) as any,
    async (req: AuthRequest, res) => {
      try {
        const { updateUserRole } = await import("../db/users.ts");
        await updateUserRole(req.params.uid, req.body.role);
        res.json({ success: true });
      } catch (error) {
        console.error("Error updating role:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    }
  );

  app.post(
    "/api/admin/users/:uid/membership",
    requireAuth as any,
    requireRoles(["system_admin", "support_operator"]) as any,
    async (req: AuthRequest, res) => {
      try {
        const { updateUserMembership } = await import("../db/users.ts");
        await updateUserMembership(req.params.uid, req.body.membership);
        res.json({ success: true });
      } catch (error) {
        console.error("Error updating membership:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    }
  );

  app.post(
    "/api/admin/users/create",
    requireAuth as any,
    requireRoles(["system_admin"]) as any,
    async (req: AuthRequest, res) => {
      try {
        const { email, password, roleName, membershipName, companyName } = req.body;

        if (!email || !password) {
          res.status(400).json({ error: "Email and password are required" });
          return;
        }

        const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
        const supabaseAnonKey =
          process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;
        const sbAdmin = createClient(supabaseUrl, serviceKey);

        let uid = "";

        if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
          const { data, error } = await sbAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
          });
          if (error) throw error;
          uid = data.user.id;
        } else {
          const { data, error } = await sbAdmin.auth.signUp({
            email,
            password,
          });
          if (error) throw error;
          uid = data.user?.id || "";
        }

        if (!uid) {
          throw new Error("Failed to get user ID after creation");
        }

        const { getOrCreateUser: ensureUser, updateUserRole, updateUserMembership } =
          await import("../db/users.ts");
        await ensureUser(uid, email);
        await updateUserRole(uid, roleName);
        await updateUserMembership(uid, membershipName);

        const { companyProfiles } = await import("../db/schema.ts");
        if (companyName) {
          await db.update(companyProfiles).set({ companyName }).where(eq(companyProfiles.userId, uid));
        }

        res.json({ success: true, uid });
      } catch (error: any) {
        console.error("Error creating internal user:", error);
        res.status(500).json({ error: error.message || "Internal server error" });
      }
    }
  );

  app.post("/api/sync-user", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      if (!req.user || !req.user.uid || !req.user.email) {
        res.status(400).json({ error: "Invalid user data" });
        return;
      }

      const user = await getOrCreateUser(req.user.uid, req.user.email);
      res.json({ user });
    } catch (error) {
      console.error("Error syncing user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ==========================================
  // RFQS & EMAILS (RESEND + CYBERPANEL IMAP)
  // ==========================================
  app.get("/api/rfqs", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      if (!req.user || !req.user.uid || !req.user.email) {
        res.status(400).json({ error: "Invalid user data" });
        return;
      }
      const user = await getOrCreateUser(req.user.uid, req.user.email);
      const userRfqs = await getUserRfqs(user.uid);
      res.json(userRfqs);
    } catch (error) {
      console.error("Error fetching RFQs:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/rfqs", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      if (!req.user || !req.user.uid || !req.user.email) {
        res.status(400).json({ error: "Invalid user data" });
        return;
      }
      const user = await getOrCreateUser(req.user.uid, req.user.email);
      const newRfq = await createRfq(user.uid, req.body);

      notifyProvidersForRfq(newRfq.category, newRfq.title, newRfq.id).catch((err) => {
        console.error("Failed to notify providers:", err);
      });

      runArnPipelineForEvent({
        ownerUid: user.uid,
        source: "rfq",
        companyName: user.email,
        contactEmail: user.email,
        category: newRfq.category,
        rawText: `RFQ #${newRfq.id}: ${newRfq.title}\nPrioridad: ${newRfq.priority}\n${newRfq.description}`,
        metadata: { rfqId: newRfq.id },
      }).catch((err) => console.warn("ARN RFQ ingest warning:", err));

      res.json(newRfq);
    } catch (error) {
      console.error("Error creating RFQ:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/rfqs/:id/award", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const rfqId = Number(req.params.id);
      if (!Number.isFinite(rfqId)) {
        return res.status(400).json({ error: "Invalid RFQ id" });
      }
      if (!hasDatabaseConfig()) {
        return res.status(503).json({ error: "Database not configured" });
      }
      const updated = await updateRfqStatus(rfqId, req.user.uid, "awarded");
      if (!updated) {
        return res.status(404).json({ error: "RFQ not found for current user" });
      }

      // Cross-module ARN trigger: prepare logistics dispatch & record automation
      runArnPipelineForEvent({
        ownerUid: req.user.uid,
        source: "rfq_award",
        companyName: req.user.email,
        contactEmail: req.user.email,
        category: updated.category,
        rawText: `RFQ #${updated.id} adjudicada (${updated.title}). Coordinar despacho logístico y reserva de inventario.`,
        metadata: { rfqId: updated.id, originName: "Hub Origen", destinationName: "Destino Patagonia" },
      }).catch((err) => console.warn("ARN award dispatch warning:", err));

      res.json({ success: true, rfq: updated, crossModuleTriggered: true });
    } catch (error: any) {
      console.error("Error awarding RFQ:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  app.post("/api/public/rfq-lead", async (req, res) => {
    try {
      const { company, email, category, budget, details } = req.body || {};
      if (!company || !email || !details) {
        return res.status(400).json({ error: "Completa empresa, email corporativo y detalles." });
      }

      const cleanCompany = String(company).trim();
      const cleanEmail = String(email).trim();
      const cleanCategory = String(category || "General").trim();
      const cleanBudget = String(budget || "Consultar").trim();
      const cleanDetails = String(details).trim();

      let persisted = false;
      if (hasDatabaseConfig()) {
        try {
          await db.insert(contacts).values({
            entityType: "rfq_lead",
            name: cleanCompany,
            company: cleanCompany,
            email: cleanEmail,
            industry: cleanCategory,
            status: "lead",
            type: "inbound_home_rfq",
            socialMedia: `Presupuesto: ${cleanBudget}`,
          });
          persisted = true;
        } catch (dbErr) {
          console.warn("PG lead insert warning:", dbErr);
        }
      }

      if (!persisted) {
        const sbAdmin = getSupabaseAdminClient();
        if (sbAdmin) {
          const { error: sbErr } = await sbAdmin.from("contacts").insert({
            entity_type: "rfq_lead",
            name: cleanCompany,
            company: cleanCompany,
            email: cleanEmail,
            industry: cleanCategory,
            status: "lead",
            type: "inbound_home_rfq",
            social_media: `Presupuesto: ${cleanBudget}`,
          });
          if (!sbErr) persisted = true;
        }
      }

      await recordAutomationEvent("outbound_n8n", "public.rfq_lead.created", persisted ? "saved" : "received", {
        company: cleanCompany,
        email: cleanEmail,
        category: cleanCategory,
        budget: cleanBudget,
      });

      const opsTargets = (process.env.ADMIN_EMAILS || "xpatagonia.com@gmail.com")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      if ((process.env.RESEND_API_KEY || process.env.SMTP_PASSWORD) && opsTargets.length > 0) {
        try {
          const { sendEmail } = await import("../services/emailService.ts");
          await sendEmail(
            opsTargets.join(","),
            `Nuevo Lead RFQ Home - ${cleanCompany} (${cleanCategory})`,
            `Empresa: ${cleanCompany}\nEmail: ${cleanEmail}\nCategoría: ${cleanCategory}\nPresupuesto: ${cleanBudget}\n\nDetalles:\n${cleanDetails}`
          );
        } catch (mailErr) {
          console.warn("RFQ lead email warning:", mailErr);
        }
      }

      if (process.env.N8N_WEBHOOK_URL) {
        fetch(process.env.N8N_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "public.rfq_lead.created",
            company: cleanCompany,
            email: cleanEmail,
            category: cleanCategory,
            budget: cleanBudget,
            details: cleanDetails,
          }),
          signal: AbortSignal.timeout(3000),
        }).catch(() => {});
      }

      res.json({ success: true, persisted });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Error registrando solicitud" });
    }
  });

  app.get("/api/insights", async (req, res) => {
    try {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
      if (hasDatabaseConfig()) {
        try {
          const rows = await db.select().from(insights).orderBy(desc(insights.createdAt)).limit(50);
          return res.json({ insights: rows, source: "postgres" });
        } catch {
          // fallback to Supabase Admin REST
        }
      }
      const sbAdmin = getSupabaseAdminClient();
      if (sbAdmin) {
        const { data, error } = await sbAdmin
          .from("insights")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);
        if (!error && Array.isArray(data)) {
          return res.json({
            insights: data.map((row: any) => ({
              id: row.id,
              title: row.title,
              category: row.category,
              content: row.content,
              author: row.author,
              image: row.image,
              videoUrl: row.video_url,
              sourceUrl: row.source_url,
              createdAt: row.created_at,
            })),
            source: "supabase",
          });
        }
      }
      res.json({ insights: [], source: "empty" });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch insights" });
    }
  });

  app.post(
    "/api/admin/insights",
    requireAuth as any,
    requireRoles(["system_admin", "content_editor"]) as any,
    async (req: AuthRequest, res) => {
      try {
        const { title, category, content, image, videoUrl, sourceUrl } = req.body || {};
        if (!title || !content) {
          return res.status(400).json({ error: "Título y contenido son obligatorios" });
        }
        const author = req.user?.email || "Redacción";

        if (hasDatabaseConfig()) {
          try {
            const inserted = await db
              .insert(insights)
              .values({
                title,
                category: category || "Actualidad",
                content,
                image: image || null,
                videoUrl: videoUrl || null,
                sourceUrl: sourceUrl || null,
                author,
              })
              .returning();
            return res.json({ success: true, insight: inserted[0] });
          } catch (pgErr) {
            console.warn("PG insight insert fallback to Supabase REST:", pgErr);
          }
        }

        const sbAdmin = getSupabaseAdminClient();
        if (sbAdmin) {
          const { data, error } = await sbAdmin
            .from("insights")
            .insert({
              title,
              category: category || "Actualidad",
              content,
              image: image || null,
              video_url: videoUrl || null,
              source_url: sourceUrl || null,
              author,
            })
            .select()
            .single();
          if (error) throw new Error(error.message);
          return res.json({
            success: true,
            insight: {
              id: data.id,
              title: data.title,
              category: data.category,
              content: data.content,
              author: data.author,
              image: data.image,
              videoUrl: data.video_url,
              sourceUrl: data.source_url,
              createdAt: data.created_at,
            },
          });
        }

        res.status(500).json({ error: "No hay base de datos configurada para guardar el artículo." });
      } catch (error: any) {
        res.status(500).json({ error: error.message || "Error al publicar insight" });
      }
    }
  );

  app.delete(
    "/api/admin/insights/:id",
    requireAuth as any,
    requireRoles(["system_admin", "content_editor"]) as any,
    async (req: AuthRequest, res) => {
      try {
        const insightId = Number(req.params.id);
        if (!Number.isFinite(insightId)) {
          return res.status(400).json({ error: "ID de insight inválido" });
        }
        if (hasDatabaseConfig()) {
          try {
            await db.delete(insights).where(eq(insights.id, insightId));
            return res.json({ success: true });
          } catch (pgErr) {
            console.warn("PG insight delete fallback to Supabase REST:", pgErr);
          }
        }
        const sbAdmin = getSupabaseAdminClient();
        if (sbAdmin) {
          const { error } = await sbAdmin.from("insights").delete().eq("id", insightId);
          if (error) throw new Error(error.message);
          return res.json({ success: true });
        }
        res.status(500).json({ error: "No hay base de datos configurada." });
      } catch (error: any) {
        res.status(500).json({ error: error.message || "Error eliminando insight" });
      }
    }
  );

  app.get("/api/emails", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      const { fetchEmails } = await import("../services/emailService.ts");
      const emails = await fetchEmails();
      res.json(emails);
    } catch (error: any) {
      console.error("Error fetching emails:", error);
      res.status(500).json({ error: error.message || "Failed to fetch emails" });
    }
  });

  app.post("/api/emails/send", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      const { to, subject, text, html } = req.body;
      if (!to || !subject || (!text && !html)) {
        res.status(400).json({ error: "Missing required fields: to, subject, text/html" });
        return;
      }
      const { sendEmail } = await import("../services/emailService.ts");
      const result = await sendEmail(to, subject, text, html);
      res.json({
        success: true,
        messageId: result.messageId,
        provider: (result as any).provider,
        mocked: (result as any).mocked,
      });
    } catch (error: any) {
      console.error("Error sending email:", error);
      res.status(500).json({ error: error.message || "Failed to send email" });
    }
  });

  // ==========================================
  // GEMINI AI (INSIGHTS, CRON, SUGGESTIONS)
  // ==========================================
  app.post("/api/generate-insights", async (req, res) => {
    try {
      const apiKey = process.env.CUSTOM_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (!isUsableGeminiKey(apiKey)) {
        return res.json({
          insights: `## Resumen Estratégico Patagonia B2B\n\n- **Cuenca Neuquina & Golfo San Jorge**: Incremento del 38% en licitaciones de válvulas API 6D, montaje electromecánico y servicios ambientales.\n- **Logística Portuaria Austral**: Modernización de terminales de frío (-25°C) en Puerto Madryn, Comodoro Rivadavia y Ushuaia.\n- **Transición Energética**: Nuevos proyectos de parques eólicos demandan proveedores locales certificados bajo normas ISO 9001 e ISO 14001.`,
        });
      }

      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } },
      });

      const prompt = `Crea un resumen semanal estratégico curado y formateado en Markdown sobre actualidad empresarial, startups e innovación en la región patagónica (Chubut, Río Negro, Neuquén, Santa Cruz y Tierra del Fuego). Enfócate en negocios, inversiones, energía, logística y desarrollo económico industrial.`;

      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: prompt,
      });

      res.json({ insights: response.text });
    } catch {
      res.json({
        insights: `## Resumen Estratégico Patagonia B2B\n\n- **Energía e Hidrocarburos**: Expansión de capacidad de transporte y demanda de servicios metalmecánicos certificados.\n- **Logística Multimodal**: Integración de corredores en Ruta Nacional 3 y Ruta 40 con trazabilidad satelital.\n- **Ecosistema PyME**: Sincronización de proveedores regionales en el directorio corporativo y CRM.`,
      });
    }
  });

  const runAutoInsight = async () => {
    try {
      const apiKey = process.env.CUSTOM_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (!isUsableGeminiKey(apiKey)) {
        return {
          success: false,
          skipped: true,
          reason: "Gemini API key not configured for background cron",
        };
      }

      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } },
      });

      const prompt = `Busca información pública reciente y noticias de las provincias de la Patagonia Argentina (Chubut, Santa Cruz, Río Negro, Neuquén, Tierra del Fuego).
Selecciona una noticia relevante sobre producción, energía, logística, pesca o industria y devuelve un objeto JSON con:
{
  "title": "Título conciso de la noticia",
  "category": "Actualidad",
  "location": "Provincia patagónica",
  "content": "Resumen de 2 párrafos.",
  "source_name": "Fuente oficial",
  "url": "https://xpatagonia.online/insights"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      let rawText = response.text || "{}";
      rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
      const data = JSON.parse(rawText);

      if (!data.title || !data.content) {
        return { success: false, error: "Incomplete response" };
      }

      const insight = {
        title: data.title,
        category: data.category || "Actualidad",
        content:
          (data.location ? `__LOC__${data.location}__LOC__ ` : "") +
          data.content +
          (data.url
            ? `\n\n**Fuente:** [${data.source_name || "Leer noticia completa"}](${data.url})`
            : ""),
        image: null,
        videoUrl: null,
        author: "IA Reportero",
        sourceUrl: data.url || null,
        createdAt: new Date(),
      };

      if (hasDatabaseConfig()) {
        await db.insert(insights).values(insight);
      } else {
        const sbAdmin = getSupabaseAdminClient();
        if (sbAdmin) {
          await sbAdmin.from("insights").insert({
            title: insight.title,
            category: insight.category,
            content: insight.content,
            image: insight.image,
            video_url: insight.videoUrl,
            author: insight.author,
            source_url: insight.sourceUrl,
            created_at: insight.createdAt.toISOString(),
          });
        }
      }
      return { success: true, insight };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  };

  app.post("/api/cron/publish-insight", async (req, res) => {
    try {
      const authHeader = req.headers.authorization || "";
      if (!authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized: Missing Bearer token" });
      }

      const token = authHeader.slice("Bearer ".length).trim();
      const cronSecret = (process.env.CRON_SECRET || "").trim();
      let authorized = Boolean(cronSecret && token === cronSecret);

      if (!authorized) {
        const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "").trim();
        const supabaseAnon = (
          process.env.VITE_SUPABASE_ANON_KEY ||
          process.env.SUPABASE_ANON_KEY ||
          ""
        ).trim();
        if (supabaseUrl && supabaseAnon) {
          const sb = createClient(supabaseUrl, supabaseAnon, {
            auth: { persistSession: false, autoRefreshToken: false },
          });
          const {
            data: { user },
            error,
          } = await sb.auth.getUser(token);
          if (!error && user) {
            const { roleName } = await resolveUserRoleAndMembership(user.id, user.email);
            if (["system_admin", "content_editor"].includes(roleName)) {
              authorized = true;
            }
          }
        }
      }

      if (!authorized) {
        return res.status(403).json({ error: "Forbidden: Invalid cron secret or admin token" });
      }

      const result = await runAutoInsight();
      if (result?.error) {
        return res.status(500).json({ error: result.error });
      }
      res.json({ success: true, message: "Automation triggered", result });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to trigger automation" });
    }
  });

  app.post("/api/hero-suggestions", async (req, res) => {
    try {
      const apiKey = process.env.CUSTOM_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (!isUsableGeminiKey(apiKey)) {
        return res.json({ suggestions: DEFAULT_HERO_SUGGESTIONS.slice(0, 3) });
      }

      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } },
      });

      const prompt = `Eres el asistente inteligente de xPatagonia, el Hub de Servicios para la Industria Sostenible.
Genera 3 sugerencias breves de búsqueda de servicios B2B o insumos industriales relevantes para la región (ej. "Auditoría Ambiental", "Ingeniería Naval", "Logística de Frío").
Devuelve ÚNICAMENTE un array JSON válido de 3 strings, sin markdown.`;

      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      let rawText = response.text || "[]";
      rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();

      const suggestions = JSON.parse(rawText);
      if (Array.isArray(suggestions) && suggestions.length > 0) {
        return res.json({ suggestions: suggestions.slice(0, 3) });
      }
      return res.json({ suggestions: DEFAULT_HERO_SUGGESTIONS.slice(0, 3) });
    } catch {
      return res.json({ suggestions: DEFAULT_HERO_SUGGESTIONS.slice(0, 3) });
    }
  });

  // ==========================================
  // MARKET DATA & CURRENCIES (LIVE + REFERENCIA)
  // ==========================================
  app.get("/api/market-data", async (req, res) => {
    try {
      const force = req.query.refresh === "1" || req.query.refresh === "true";
      const payload = await getMarketSnapshot(force);
      res.setHeader("Cache-Control", "public, max-age=30, stale-while-revalidate=30");
      res.json(payload);
    } catch (error: any) {
      console.error("Error generating market data:", error);
      res.status(500).json({ error: "Failed to fetch market data" });
    }
  });

  app.get("/api/currencies", async (req, res) => {
    try {
      const usdRes = await fetch("https://dolarapi.com/v1/dolares/mayorista");
      const usdData = await usdRes.json();
      const eurRes = await fetch("https://dolarapi.com/v1/cotizaciones/eur");
      const eurData = await eurRes.json();
      const brlRes = await fetch("https://dolarapi.com/v1/cotizaciones/brl");
      const brlData = await brlRes.json();

      let cnyArs = 208.5;
      try {
        const openRes = await fetch("https://open.er-api.com/v6/latest/USD");
        const openData = await openRes.json();
        const cnyRate = openData.rates?.CNY || 7.23;
        cnyArs = usdData.venta / cnyRate;
      } catch {
        // fallback
      }

      res.json({
        usd: usdData.venta,
        eur: eurData.venta,
        brl: brlData.venta,
        cny: cnyArs,
      });
    } catch (error) {
      console.error("Error fetching currencies:", error);
      res.status(500).json({ error: "Failed to fetch currency rates" });
    }
  });

  // ==========================================
  // LOGÍSTICA OSRM & WEBHOOKS N8N / ODOO
  // ==========================================
  app.get("/api/logistics/route", async (req, res) => {
    try {
      const from = String(req.query.from || "");
      const to = String(req.query.to || "");
      if (!from || !to) {
        return res.status(400).json({ error: "Missing from/to coordinates (lng,lat)" });
      }

      const candidates: { base: string; label: string }[] = [];
      if (process.env.OSRM_BASE_URL) {
        candidates.push({
          base: process.env.OSRM_BASE_URL.replace(/\/+$/, ""),
          label: "Supermicro OSRM",
        });
      }
      candidates.push({ base: "https://router.project-osrm.org", label: "OpenStreetMap OSRM" });

      for (const candidate of candidates) {
        try {
          const url = `${candidate.base}/route/v1/driving/${from};${to}?overview=full&geometries=geojson`;
          const headers: Record<string, string> = {};
          if (process.env.CF_ACCESS_CLIENT_ID && process.env.CF_ACCESS_CLIENT_SECRET) {
            headers["CF-Access-Client-Id"] = process.env.CF_ACCESS_CLIENT_ID;
            headers["CF-Access-Client-Secret"] = process.env.CF_ACCESS_CLIENT_SECRET;
          }
          const osrmRes = await fetch(url, { headers, signal: AbortSignal.timeout(4500) });
          if (!osrmRes.ok) continue;
          const data = await osrmRes.json();
          if (data?.routes?.[0]) {
            return res.json({ routes: data.routes, engineUsed: candidate.label });
          }
        } catch {
          // try next OSRM endpoint
        }
      }
      res.status(502).json({ error: "OSRM endpoints temporarily unreachable" });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to calculate route" });
    }
  });

  app.post("/api/logistics/reverse-auction", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      const payload = {
        event: "logistics.reverse_auction.created",
        timestamp: new Date().toISOString(),
        uid: req.user?.uid,
        ...req.body,
      };
      let forwardedToN8n = false;
      if (process.env.N8N_WEBHOOK_URL) {
        try {
          const whRes = await fetch(process.env.N8N_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(3500),
          });
          forwardedToN8n = whRes.ok;
        } catch (err) {
          console.warn("n8n webhook warning:", err);
        }
      }
      const auctionId = `LIC-${Date.now().toString().slice(-6)}`;
      await recordAutomationEvent(
        "outbound_n8n",
        "logistics.reverse_auction.created",
        forwardedToN8n ? "delivered" : "queued_local",
        { auctionId, ...payload }
      );
      res.json({
        success: true,
        auctionId,
        forwardedToN8n,
        payload,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Error creating reverse auction" });
    }
  });

  app.post("/api/crm/sync-odoo", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      const payload = {
        event: "crm.company.sync_odoo",
        timestamp: new Date().toISOString(),
        ...req.body,
      };
      let forwardedToN8n = false;
      if (process.env.N8N_WEBHOOK_URL) {
        try {
          const whRes = await fetch(process.env.N8N_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(3500),
          });
          forwardedToN8n = whRes.ok;
        } catch (err) {
          console.warn("n8n Odoo sync warning:", err);
        }
      }
      await recordAutomationEvent(
        "outbound_n8n",
        "crm.company.sync_odoo",
        forwardedToN8n ? "delivered" : "queued_local",
        payload
      );
      res.json({
        success: true,
        forwardedToN8n,
        target: forwardedToN8n ? "n8n → Odoo VPS" : "Cola Local CRM (pendiente de n8n)",
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Error syncing to Odoo" });
    }
  });

  // ==========================================
  // CMS GLOBAL DEL SITIO & MEDIA HERO
  // ==========================================
  app.get("/api/site-settings", async (req, res) => {
    try {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
      res.setHeader("CDN-Cache-Control", "no-store");

      if (hasDatabaseConfig()) {
        try {
          const rows = await db
            .select()
            .from(siteSettings)
            .where(eq(siteSettings.key, "global_site_config"));
          if (rows[0]?.value) {
            return res.json({ settings: rows[0].value, source: "postgres" });
          }
        } catch (pgErr) {
          console.warn("site_settings PG read fallback to Supabase REST:", pgErr);
        }
      }

      const sbAdmin = getSupabaseAdminClient();
      if (sbAdmin) {
        const { data, error } = await sbAdmin
          .from("site_settings")
          .select("value")
          .eq("key", "global_site_config")
          .maybeSingle();
        if (error) {
          console.warn("site_settings Supabase REST read error:", error.message);
        } else if (data?.value) {
          return res.json({ settings: data.value, source: "supabase" });
        }
      }

      res.json({ settings: null, source: "defaults" });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to read site settings" });
    }
  });

  app.put(
    "/api/site-settings",
    requireAuth as any,
    requireRoles(["system_admin", "content_editor"]) as any,
    async (req: AuthRequest, res) => {
      try {
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
        const incoming = req.body || {};
        const hero = incoming.hero || {};
        if (
          (typeof hero.videoUrl === "string" && hero.videoUrl.startsWith("data:")) ||
          (typeof hero.imageUrl === "string" && hero.imageUrl.startsWith("data:")) ||
          (typeof hero.posterUrl === "string" && hero.posterUrl.startsWith("data:"))
        ) {
          return res.status(400).json({
            error:
              "No se permite guardar media en base64 dentro de la configuración global. Usa una URL pública (Cloudflare R2/Stream) o sube el archivo a Supabase Storage.",
          });
        }

        const updatedSettings = {
          ...incoming,
          updatedAt: new Date().toISOString(),
        };

        const updatedBy = req.user?.email || req.user?.uid || "admin";
        let persistedSource: "postgres" | "supabase" | null = null;
        const persistenceErrors: string[] = [];

        if (hasDatabaseConfig()) {
          const runSiteSettingsUpsert = async () => {
            await pool.query(
              `INSERT INTO public.site_settings ("key", "value", "updated_by", "updated_at")
               VALUES ($1, $2::jsonb, $3, $4)
               ON CONFLICT ("key") DO UPDATE
               SET "value" = EXCLUDED."value",
                   "updated_by" = EXCLUDED."updated_by",
                   "updated_at" = EXCLUDED."updated_at"`,
              ["global_site_config", JSON.stringify(updatedSettings), updatedBy, new Date()]
            );
          };

          try {
            await runSiteSettingsUpsert();
            persistedSource = "postgres";
          } catch (pgErr: any) {
            const pgCode = pgErr?.cause?.code || pgErr?.code;
            if (pgCode === "42P01") {
              try {
                await pool.query(`
                  CREATE TABLE IF NOT EXISTS public.site_settings (
                    key text PRIMARY KEY,
                    value jsonb NOT NULL DEFAULT '{}'::jsonb,
                    updated_by text,
                    updated_at timestamptz DEFAULT now()
                  );
                `);
                await runSiteSettingsUpsert();
                persistedSource = "postgres";
              } catch (retryErr: any) {
                persistenceErrors.push(`Postgres: ${formatPgError(retryErr)}`);
              }
            } else {
              persistenceErrors.push(`Postgres: ${formatPgError(pgErr)}`);
            }
          }
        }

        if (!persistedSource) {
          const sbAdmin = getSupabaseAdminClient();
          if (sbAdmin) {
            const { error: sbErr } = await sbAdmin.from("site_settings").upsert(
              {
                key: "global_site_config",
                value: updatedSettings,
                updated_by: updatedBy,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "key" }
            );
            if (!sbErr) {
              persistedSource = "supabase";
            } else {
              persistenceErrors.push(`Supabase: ${sbErr.message}`);
            }
          } else {
            const vercelEnv = process.env.VERCEL_ENV || "unknown";
            persistenceErrors.push(
              `SUPABASE_SERVICE_ROLE_KEY no disponible en este entorno (vercelEnv=${vercelEnv})`
            );
          }
        }

        if (!persistedSource) {
          return res.status(500).json({
            success: false,
            error: `No se pudo persistir en base de datos de producción (${persistenceErrors.join(" | ")})`,
          });
        }

        res.json({ success: true, persistedSource, settings: updatedSettings });
      } catch (error: any) {
        res.status(500).json({ error: error.message || "Failed to update site settings" });
      }
    }
  );

  app.post(
    "/api/admin/upload-media",
    requireAuth as any,
    requireRoles(["system_admin", "content_editor"]) as any,
    async (req: AuthRequest, res) => {
      try {
        const { filename, mimeType, base64Data } = req.body || {};
        if (!filename || !base64Data || typeof base64Data !== "string") {
          return res.status(400).json({ error: "Missing filename or base64Data" });
        }

        const cleanExt = path.extname(filename).replace(/[^a-zA-Z0-9.]/g, "") || ".bin";
        const safeName = `hero-${Date.now()}-${crypto.randomBytes(4).toString("hex")}${cleanExt}`;
        const rawBase64 = base64Data.includes(",") ? base64Data.split(",")[1] : base64Data;
        const buffer = Buffer.from(rawBase64, "base64");
        const resolvedMime = mimeType || "application/octet-stream";

        const sbAdmin = getSupabaseAdminClient();
        if (sbAdmin) {
          const storagePath = `hero/${safeName}`;
          const { error: uploadError } = await sbAdmin.storage
            .from("site-media")
            .upload(storagePath, buffer, {
              contentType: resolvedMime,
              upsert: true,
            });

          if (uploadError) {
            return res.status(500).json({
              error: `Error subiendo a Supabase Storage (site-media): ${uploadError.message}`,
            });
          }

          const { data: pub } = sbAdmin.storage.from("site-media").getPublicUrl(storagePath);
          if (pub?.publicUrl) {
            return res.json({
              success: true,
              url: pub.publicUrl,
              storage: "supabase",
              mimeType: resolvedMime,
              sizeBytes: buffer.length,
            });
          }
        }

        if (process.env.VERCEL) {
          return res.status(500).json({
            error:
              "SUPABASE_SERVICE_ROLE_KEY o bucket 'site-media' no disponibles en producción. Configura Supabase Storage o pega la URL pública de Cloudflare R2/Stream.",
          });
        }

        // Local filesystem allowed only on non-serverless dev/Node server
        const targetPath = path.join(UPLOADS_DIR, safeName);
        fs.writeFileSync(targetPath, buffer);
        return res.json({
          success: true,
          url: `/uploads/${safeName}`,
          storage: "local",
          mimeType: resolvedMime,
          sizeBytes: buffer.length,
        });
      } catch (error: any) {
        res.status(500).json({ error: error.message || "Upload failed" });
      }
    }
  );

  // ==========================================
  // WEBHOOK BIDIRECCIONAL ODOO <-> N8N
  // ==========================================
  app.post("/api/webhooks/odoo", async (req, res) => {
    try {
      const configuredSecret = process.env.N8N_SHARED_SECRET || process.env.ODOO_WEBHOOK_SECRET;
      if (configuredSecret) {
        const incomingSecret = req.headers["x-odoo-webhook-secret"] || req.headers["x-n8n-secret"];
        if (incomingSecret !== configuredSecret) {
          return res.status(403).json({ error: "Invalid webhook signature" });
        }
      }

      const { event = "odoo.event", uid, membership, verificationStatus, invoiceRef } =
        req.body || {};

      if (uid && membership) {
        try {
          const { updateUserMembership } = await import("../db/users.ts");
          await updateUserMembership(String(uid), String(membership));
        } catch (err) {
          console.warn("Odoo webhook membership DB skip:", err);
        }
      }

      const logEntry = await recordAutomationEvent("inbound_odoo", event, "processed", {
        uid,
        membership,
        verificationStatus,
        invoiceRef,
        raw: req.body,
      });

      res.json({ success: true, received: logEntry });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Webhook error" });
    }
  });

  app.get(
    "/api/admin/automation-logs",
    requireAuth as any,
    requireRoles(["system_admin", "support_operator"]) as any,
    async (req, res) => {
      try {
        let dbLogs: any[] = [];
        if (hasDatabaseConfig()) {
          try {
            dbLogs = await db
              .select()
              .from(automationLogs)
              .orderBy(desc(automationLogs.createdAt))
              .limit(30);
          } catch {
            // Optional DB fallback
          }
        }
        if (dbLogs.length === 0) {
          const sbAdmin = getSupabaseAdminClient();
          if (sbAdmin) {
            try {
              const { data } = await sbAdmin
                .from("automation_logs")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(30);
              if (Array.isArray(data) && data.length > 0) {
                dbLogs = data.map((row: any) => ({
                  id: row.id,
                  direction: row.direction,
                  event: row.event,
                  status: row.status,
                  payload: row.payload,
                  createdAt: row.created_at,
                }));
              }
            } catch {
              // Optional Supabase REST fallback
            }
          }
        }
        res.json({
          logs: dbLogs.length > 0 ? dbLogs : inMemoryAutomationLogs,
          n8nConfigured: Boolean(process.env.N8N_WEBHOOK_URL),
        });
      } catch (error: any) {
        res.status(500).json({ error: error.message || "Failed to fetch automation logs" });
      }
    }
  );

  app.get("/api/maps-key", (req, res) => {
    res.json({ key: process.env.GOOGLE_MAPS_PLATFORM_KEY || "" });
  });

  registerArnAndModuleRoutes(app, recordAutomationEvent);
  registerWorkerAndWebhookRoutes(app);
  registerBillingAndKybRoutes(app, recordAutomationEvent);

  return { app, runAutoInsight };
}
