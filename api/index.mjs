var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  automationLogs: () => automationLogs,
  companyProfiles: () => companyProfiles,
  contacts: () => contacts,
  insights: () => insights,
  inventoryItems: () => inventoryItems,
  memberships: () => memberships,
  moduleRequests: () => moduleRequests,
  permissions: () => permissions,
  products: () => products,
  rfqs: () => rfqs,
  rolePermissions: () => rolePermissions,
  roles: () => roles,
  siteSettings: () => siteSettings,
  userMemberships: () => userMemberships,
  userRoles: () => userRoles,
  users: () => users
});
import { pgTable, serial, text, timestamp, integer, jsonb, boolean } from "drizzle-orm/pg-core";
var users, companyProfiles, products, rfqs, contacts, insights, inventoryItems, moduleRequests, roles, permissions, rolePermissions, userRoles, memberships, userMemberships, siteSettings, automationLogs;
var init_schema = __esm({
  "src/db/schema.ts"() {
    users = pgTable("users", {
      id: serial("id").primaryKey(),
      uid: text("uid").notNull().unique(),
      email: text("email").notNull(),
      cuit: text("cuit"),
      category: text("category"),
      isEmailVerified: boolean("is_email_verified").default(false),
      lastLogin: timestamp("last_login"),
      createdAt: timestamp("created_at").defaultNow()
    });
    companyProfiles = pgTable("company_profiles", {
      id: serial("id").primaryKey(),
      userId: text("user_uid").references(() => users.uid).notNull().unique(),
      companyName: text("company_name"),
      legalName: text("legal_name"),
      cuit: text("cuit"),
      website: text("website"),
      industry: text("industry"),
      yearFounded: text("year_founded"),
      employeeCount: text("employee_count"),
      description: text("description"),
      certifications: jsonb("certifications").default("[]"),
      services: jsonb("services").default("[]"),
      city: text("city"),
      province: text("province"),
      address: text("address"),
      phone: text("phone"),
      email: text("email"),
      whatsapp: text("whatsapp"),
      contactName: text("contact_name"),
      contactRole: text("contact_role"),
      bankName: text("bank_name"),
      cbu: text("cbu"),
      alias: text("alias"),
      paymentTerms: text("payment_terms"),
      billingEmail: text("billing_email"),
      logoUrl: text("logo_url"),
      bannerUrl: text("banner_url"),
      presentationUrl: text("presentation_url"),
      // Innovative Trust & AI Features
      trustScore: integer("trust_score").default(50),
      // 0-100 AI-calculated score based on profile completion and successful transactions
      verificationStatus: text("verification_status").default("unverified"),
      // unverified, pending, verified (KYC/KYB)
      networkingTags: jsonb("networking_tags").default("[]"),
      // AI extracted interests/capabilities for smart B2B matchmaking
      sustainabilityIndex: text("sustainability_index"),
      // ESG categorization, e.g., 'Eco-Level 1'
      updatedAt: timestamp("updated_at").defaultNow()
    });
    products = pgTable("products", {
      id: serial("id").primaryKey(),
      userId: text("user_uid"),
      // Not making it NOT NULL to allow loose creation from the mock initially
      sku: text("sku"),
      name: text("name").notNull(),
      category: text("category").notNull(),
      subcategory: text("subcategory"),
      brand: text("brand"),
      model: text("model"),
      condition: text("condition"),
      year: text("year"),
      usageHours: text("usage_hours"),
      warranty: text("warranty"),
      priceBase: text("price_base"),
      priceWholesale: text("price_wholesale"),
      stock: text("stock"),
      moq: text("moq"),
      description: text("description"),
      certifications: jsonb("certifications").default("[]"),
      paymentMethods: jsonb("payment_methods").default("[]"),
      shippingConditions: jsonb("shipping_conditions").default("[]"),
      leadTime: text("lead_time"),
      location: text("location"),
      supplier: text("supplier"),
      videoUrl: text("video_url"),
      taxRate: text("tax_rate"),
      image: text("image"),
      status: text("status").default("active"),
      companyId: text("company_id"),
      createdAt: timestamp("created_at").defaultNow()
    });
    rfqs = pgTable("rfqs", {
      id: serial("id").primaryKey(),
      userId: text("user_uid"),
      title: text("title").notNull(),
      category: text("category").notNull(),
      priority: text("priority").notNull(),
      description: text("description").notNull(),
      status: text("status").default("pending").notNull(),
      createdAt: timestamp("created_at").defaultNow()
    });
    contacts = pgTable("contacts", {
      id: serial("id").primaryKey(),
      userId: text("user_uid"),
      entityType: text("entity_type").default("contact"),
      name: text("name").notNull(),
      company: text("company"),
      role: text("role"),
      email: text("email"),
      phone: text("phone"),
      type: text("type"),
      status: text("status"),
      website: text("website"),
      cuitRut: text("cuit_rut"),
      socialMedia: text("social_media"),
      industry: text("industry"),
      location: text("location"),
      createdAt: timestamp("created_at").defaultNow()
    });
    insights = pgTable("insights", {
      id: serial("id").primaryKey(),
      title: text("title").notNull(),
      category: text("category").notNull(),
      content: text("content").notNull(),
      author: text("author").notNull().default("Redacci\xF3n"),
      image: text("image"),
      videoUrl: text("video_url"),
      sourceUrl: text("source_url"),
      createdAt: timestamp("created_at").defaultNow()
    });
    inventoryItems = pgTable("inventory_items", {
      id: serial("id").primaryKey(),
      userId: text("user_uid"),
      sku: text("sku"),
      name: text("name"),
      category: text("category"),
      quantity: integer("quantity").default(0),
      location: text("location"),
      status: text("status"),
      lastUpdated: timestamp("last_updated").defaultNow(),
      createdAt: timestamp("created_at").defaultNow()
    });
    moduleRequests = pgTable("module_requests", {
      id: serial("id").primaryKey(),
      userId: text("user_uid"),
      userEmail: text("user_email"),
      moduleId: text("module_id"),
      moduleName: text("module_name"),
      status: text("status").default("pending"),
      createdAt: timestamp("created_at").defaultNow()
    });
    roles = pgTable("roles", {
      id: serial("id").primaryKey(),
      name: text("name").notNull().unique(),
      // e.g., 'system_admin', 'company_admin', 'buyer', 'vendor', 'investor'
      description: text("description"),
      createdAt: timestamp("created_at").defaultNow()
    });
    permissions = pgTable("permissions", {
      id: serial("id").primaryKey(),
      action: text("action").notNull().unique(),
      // e.g., 'rfqs:create', 'analytics:view', 'memberships:manage'
      description: text("description"),
      createdAt: timestamp("created_at").defaultNow()
    });
    rolePermissions = pgTable("role_permissions", {
      roleId: integer("role_id").references(() => roles.id).notNull(),
      permissionId: integer("permission_id").references(() => permissions.id).notNull()
    });
    userRoles = pgTable("user_roles", {
      userId: text("user_uid").references(() => users.uid).notNull(),
      roleId: integer("role_id").references(() => roles.id).notNull()
    });
    memberships = pgTable("memberships", {
      id: serial("id").primaryKey(),
      name: text("name").notNull(),
      // e.g., 'Basic', 'Premium', 'Enterprise'
      tier: integer("tier").notNull(),
      // 1, 2, 3
      price: integer("price").notNull().default(0),
      // Monthly price in cents/pesos
      features: jsonb("features").default("[]"),
      // List of features enabled
      maxProducts: integer("max_products").default(10),
      maxRfqsMonthly: integer("max_rfqs_monthly").default(3),
      aiAccessLevel: text("ai_access_level").default("standard"),
      // 'standard', 'advanced', 'predictive'
      createdAt: timestamp("created_at").defaultNow()
    });
    userMemberships = pgTable("user_memberships", {
      id: serial("id").primaryKey(),
      userId: text("user_uid").references(() => users.uid).notNull(),
      membershipId: integer("membership_id").references(() => memberships.id).notNull(),
      status: text("status").default("active"),
      // active, cancelled, expired, past_due
      startDate: timestamp("start_date").defaultNow(),
      endDate: timestamp("end_date"),
      // Null means lifetime/auto-renews until cancelled
      autoRenew: boolean("auto_renew").default(true),
      createdAt: timestamp("created_at").defaultNow()
    });
    siteSettings = pgTable("site_settings", {
      key: text("key").primaryKey(),
      // e.g., 'global_site_config'
      value: jsonb("value").notNull(),
      updatedBy: text("updated_by"),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    automationLogs = pgTable("automation_logs", {
      id: serial("id").primaryKey(),
      direction: text("direction").notNull(),
      // 'outbound_n8n' | 'inbound_odoo'
      event: text("event").notNull(),
      status: text("status").notNull().default("processed"),
      payload: jsonb("payload").default("{}"),
      createdAt: timestamp("created_at").defaultNow()
    });
  }
});

// src/db/index.ts
var db_exports = {};
__export(db_exports, {
  createPool: () => createPool,
  db: () => db,
  hasDatabaseConfig: () => hasDatabaseConfig
});
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
var Pool, hasDatabaseConfig, createPool, pool, db;
var init_db = __esm({
  "src/db/index.ts"() {
    init_schema();
    ({ Pool } = pg);
    hasDatabaseConfig = () => {
      return Boolean(
        process.env.DATABASE_URL || process.env.SQL_HOST && process.env.SQL_DB_NAME && process.env.SQL_USER
      );
    };
    createPool = () => {
      if (process.env.DATABASE_URL) {
        let dbUrl = process.env.DATABASE_URL.replace(/@+db\./, "@db.").trim();
        let isLocal = false;
        try {
          const url = new URL(dbUrl);
          isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
          if (process.env.SUPABASE_POOLER_HOST && url.hostname.endsWith(".supabase.co")) {
            const projectRef = url.hostname.split(".")[1];
            url.hostname = process.env.SUPABASE_POOLER_HOST;
            url.port = process.env.SUPABASE_POOLER_PORT || "6543";
            if (projectRef && !url.username.includes(".")) {
              url.username = `${url.username}.${projectRef}`;
            }
            dbUrl = url.toString();
          }
        } catch {
          console.warn("[XPATAGONIA] Could not parse DATABASE_URL");
        }
        const maxConnections = process.env.VERCEL ? 5 : 10;
        return new Pool({
          connectionString: dbUrl,
          max: maxConnections,
          idleTimeoutMillis: 1e4,
          connectionTimeoutMillis: 15e3,
          ssl: isLocal ? false : { rejectUnauthorized: false }
        });
      }
      return new Pool({
        host: process.env.SQL_HOST,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        database: process.env.SQL_DB_NAME,
        max: process.env.VERCEL ? 5 : 10,
        idleTimeoutMillis: 1e4,
        connectionTimeoutMillis: 15e3,
        ssl: !process.env.SQL_HOST || process.env.SQL_HOST === "localhost" || process.env.SQL_HOST === "127.0.0.1" ? false : { rejectUnauthorized: false }
      });
    };
    pool = createPool();
    pool.on("error", (err) => {
      console.error("Unexpected error on idle SQL pool client:", err);
    });
    db = drizzle(pool, { schema: schema_exports });
  }
});

// src/db/users.ts
var users_exports = {};
__export(users_exports, {
  getAllUsersWithRoles: () => getAllUsersWithRoles,
  getOrCreateUser: () => getOrCreateUser,
  registerUserSetup: () => registerUserSetup,
  updateUserMembership: () => updateUserMembership,
  updateUserRole: () => updateUserRole
});
import { eq } from "drizzle-orm";
async function getOrCreateUser(uid, email) {
  const result = await db.insert(users).values({
    uid,
    email
  }).onConflictDoUpdate({
    target: users.uid,
    set: {
      email
    }
  }).returning();
  return result[0];
}
async function registerUserSetup(uid, email, cuit, category) {
  const result = await db.insert(users).values({ uid, email, cuit, category }).onConflictDoUpdate({ target: users.uid, set: { email, cuit, category } }).returning();
  const user = result[0];
  let roleRes = await db.select().from(roles).where(eq(roles.name, "vendor"));
  if (roleRes.length === 0) {
    roleRes = await db.insert(roles).values({ name: "vendor", description: "Proveedor" }).returning();
  }
  const roleId = roleRes[0].id;
  const userRoleRes = await db.select().from(userRoles).where(eq(userRoles.userId, uid));
  if (userRoleRes.length === 0) {
    await db.insert(userRoles).values({ userId: uid, roleId });
  }
  let memRes = await db.select().from(memberships).where(eq(memberships.name, "Basic"));
  if (memRes.length === 0) {
    memRes = await db.insert(memberships).values({ name: "Basic", tier: 1, price: 0, maxProducts: 10, maxRfqsMonthly: 3, aiAccessLevel: "standard" }).returning();
  }
  const memId = memRes[0].id;
  const userMemRes = await db.select().from(userMemberships).where(eq(userMemberships.userId, uid));
  if (userMemRes.length === 0) {
    await db.insert(userMemberships).values({ userId: uid, membershipId: memId, status: "active" });
  }
  const companyRes = await db.select().from(companyProfiles).where(eq(companyProfiles.userId, uid));
  if (companyRes.length === 0) {
    await db.insert(companyProfiles).values({ userId: uid, email, cuit, industry: category, companyName: "" });
  }
  return user;
}
async function getAllUsersWithRoles() {
  const allUsers = await db.select().from(users);
  const result = [];
  for (const user of allUsers) {
    const roleRows = await db.select().from(userRoles).leftJoin(roles, eq(userRoles.roleId, roles.id)).where(eq(userRoles.userId, user.uid));
    const memRows = await db.select().from(userMemberships).leftJoin(memberships, eq(userMemberships.membershipId, memberships.id)).where(eq(userMemberships.userId, user.uid));
    const profileRows = await db.select().from(companyProfiles).where(eq(companyProfiles.userId, user.uid));
    result.push({
      ...user,
      roleName: roleRows[0]?.roles?.name || "vendor",
      membershipName: memRows[0]?.memberships?.name || "Basic",
      companyName: profileRows[0]?.companyName || user.email
    });
  }
  return result;
}
async function updateUserRole(uid, roleName) {
  let roleRes = await db.select().from(roles).where(eq(roles.name, roleName));
  if (roleRes.length === 0) {
    roleRes = await db.insert(roles).values({ name: roleName, description: roleName }).returning();
  }
  const roleId = roleRes[0].id;
  await db.delete(userRoles).where(eq(userRoles.userId, uid));
  await db.insert(userRoles).values({ userId: uid, roleId });
  return true;
}
async function updateUserMembership(uid, membershipName) {
  let memRes = await db.select().from(memberships).where(eq(memberships.name, membershipName));
  if (memRes.length === 0) {
    const tier = membershipName === "Premium" ? 2 : membershipName === "Enterprise" ? 3 : 1;
    memRes = await db.insert(memberships).values({ name: membershipName, tier, price: 0, maxProducts: 10, maxRfqsMonthly: 3, aiAccessLevel: "standard" }).returning();
  }
  const memId = memRes[0].id;
  await db.delete(userMemberships).where(eq(userMemberships.userId, uid));
  await db.insert(userMemberships).values({ userId: uid, membershipId: memId, status: "active" });
  return true;
}
var init_users = __esm({
  "src/db/users.ts"() {
    init_db();
    init_schema();
  }
});

// src/services/emailService.ts
var emailService_exports = {};
__export(emailService_exports, {
  fetchEmails: () => fetchEmails,
  sendEmail: () => sendEmail
});
import { ImapFlow } from "imapflow";
import nodemailer from "nodemailer";
import { simpleParser } from "mailparser";
function sanitizeEnvValue(raw, fallback = "") {
  return (raw || fallback).replace(/^["']|["']$/g, "").trim();
}
function sanitizeHost(raw, fallback) {
  return sanitizeEnvValue(raw, fallback).replace(/^https?:\/\//, "").split(":")[0].split("/")[0].trim();
}
async function fetchEmails() {
  const imapHost = sanitizeHost(process.env.IMAP_HOST, "mail.xpatagonia.online");
  const imapUser = sanitizeEnvValue(process.env.IMAP_USER, "notificaciones@xpatagonia.online");
  const imapPass = sanitizeEnvValue(process.env.IMAP_PASSWORD);
  const imapPort = parseInt(process.env.IMAP_PORT || "993", 10);
  if (!imapPass) {
    throw new Error("IMAP_PASSWORD no est\xE1 configurada en las variables de entorno del servidor.");
  }
  console.log(`[fetchEmails] Starting fetch. Host: ${imapHost}, Port: ${imapPort}, User: ${imapUser}, Secure: ${imapPort === 993}`);
  const client = new ImapFlow({
    host: imapHost,
    port: imapPort,
    secure: imapPort === 993,
    auth: {
      user: imapUser,
      pass: imapPass
    },
    tls: {
      rejectUnauthorized: false
    },
    logger: false,
    connectionTimeout: 1e4,
    greetingTimeout: 1e4
  });
  const emails = [];
  let connected = false;
  try {
    await client.connect();
    connected = true;
    const lock = await client.getMailboxLock("INBOX");
    try {
      const status = await client.status("INBOX", { messages: true });
      if (!status.messages || status.messages === 0) {
        return [];
      }
      const startSeq = Math.max(1, status.messages - 19);
      const messages = await client.fetch(`${startSeq}:*`, { envelope: true, source: true }, { uid: true });
      const rawMessages = [];
      for await (const message of messages) {
        rawMessages.push(message);
      }
      const recentMessages = rawMessages.reverse();
      for (const message of recentMessages) {
        const parsed = await simpleParser(message.source);
        emails.push({
          id: message.uid.toString(),
          uid: message.uid,
          subject: parsed.subject || "(No Subject)",
          from: parsed.from?.text || "Unknown",
          date: parsed.date ? parsed.date.toISOString() : (/* @__PURE__ */ new Date()).toISOString(),
          snippet: parsed.text ? parsed.text.substring(0, 100) + "..." : "",
          text: parsed.text,
          html: parsed.html || parsed.textAsHtml
        });
      }
    } finally {
      lock.release();
    }
  } catch (error) {
    console.error("[fetchEmails] ERROR fetching emails:", error);
    const detail = error.responseText || error.message || "Fallo al conectar";
    const authFailed = error.authenticationFailed ? " (Authentication Failed)" : "";
    throw new Error(`IMAP Error al conectar con ${imapHost} como ${imapUser}: ${detail}${authFailed}. Verifica tus variables de entorno.`);
  } finally {
    if (connected) {
      await client.logout();
    }
  }
  return emails;
}
async function sendEmail(to, subject, text2, html) {
  const resendApiKey = sanitizeEnvValue(process.env.RESEND_API_KEY);
  const resendFrom = sanitizeEnvValue(
    process.env.RESEND_FROM_EMAIL,
    "xPatagonia <notificaciones@xpatagonia.online>"
  );
  if (resendApiKey) {
    const recipients = to.split(",").map((addr) => addr.trim()).filter(Boolean);
    const payload = {
      from: resendFrom,
      to: recipients,
      subject
    };
    if (text2) payload.text = text2;
    if (html) payload.html = html;
    console.log(`[sendEmail] Sending via Resend HTTPS to ${recipients.join(", ")} from ${resendFrom}`);
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15e3)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(`Resend Error (${res.status}): ${data?.message || data?.name || "Fallo al enviar correo"}`);
    }
    console.log(`[sendEmail] Resend sent successfully. Id: ${data.id}`);
    return { messageId: data.id, provider: "resend" };
  }
  const smtpHost = sanitizeHost(process.env.SMTP_HOST, "mail.xpatagonia.online");
  const smtpUser = sanitizeEnvValue(process.env.SMTP_USER, "notificaciones@xpatagonia.online");
  const smtpPass = sanitizeEnvValue(process.env.SMTP_PASSWORD);
  const smtpPort = parseInt(process.env.SMTP_PORT || "465", 10);
  if (!smtpPass) {
    throw new Error("Configura RESEND_API_KEY o SMTP_PASSWORD en las variables de entorno (Settings > Secrets).");
  }
  console.log(`[sendEmail] Starting SMTP send to ${to}. Host: ${smtpHost}, Port: ${smtpPort}, User: ${smtpUser}, Secure: ${smtpPort === 465}`);
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass
    },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 15e3,
    greetingTimeout: 15e3
  });
  try {
    const info = await transporter.sendMail({
      from: smtpUser,
      to,
      subject,
      text: text2,
      html
    });
    console.log(`[sendEmail] Successfully sent email via SMTP to ${to}. MessageId: ${info.messageId}`);
    return { ...info, provider: "smtp" };
  } catch (error) {
    console.error("[sendEmail] ERROR sending email:", error);
    throw new Error(`SMTP Error al conectar con ${smtpHost} como ${smtpUser}: ${error.message || "Fallo al enviar"}.`);
  }
}
var init_emailService = __esm({
  "src/services/emailService.ts"() {
  }
});

// src/server/vercelEntry.ts
import "dotenv/config";

// src/server/createApp.ts
import fs from "fs";
import express from "express";
import path from "path";
import crypto from "crypto";
import cors from "cors";
import { createClient as createClient2 } from "@supabase/supabase-js";

// src/middleware/auth.ts
import { createClient } from "@supabase/supabase-js";
var rawUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "").trim();
var rawKey = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "").trim();
var isSupabaseConfigured = (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) && rawKey.length > 20 && !rawKey.includes("placeholder");
var supabase = isSupabaseConfigured ? createClient(rawUrl, rawKey) : null;
var BOOTSTRAP_ADMINS = (process.env.ADMIN_EMAILS || "xpatagonia.com@gmail.com,admin@xpatagonia.com").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
async function resolveUserRoleAndMembership(uid, email) {
  let roleName = "vendor";
  let membershipName = "Basic";
  try {
    const { db: db2, hasDatabaseConfig: hasDatabaseConfig2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    if (hasDatabaseConfig2()) {
      const { userRoles: userRoles2, roles: roles2, userMemberships: userMemberships2, memberships: memberships2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eq4 } = await import("drizzle-orm");
      const roleRows = await db2.select().from(userRoles2).leftJoin(roles2, eq4(userRoles2.roleId, roles2.id)).where(eq4(userRoles2.userId, uid));
      if (roleRows[0]?.roles?.name) {
        roleName = roleRows[0].roles.name;
      }
      const memRows = await db2.select().from(userMemberships2).leftJoin(memberships2, eq4(userMemberships2.membershipId, memberships2.id)).where(eq4(userMemberships2.userId, uid));
      if (memRows[0]?.memberships?.name) {
        membershipName = memRows[0].memberships.name;
      }
    }
  } catch {
  }
  if (email && BOOTSTRAP_ADMINS.includes(email.toLowerCase()) && roleName === "vendor") {
    roleName = "system_admin";
  }
  return { roleName, membershipName };
}
var requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized: Missing token" });
    return;
  }
  if (!supabase) {
    res.status(503).json({ error: "Authentication service not configured in this environment" });
    return;
  }
  const token = authHeader.split("Bearer ")[1];
  try {
    const {
      data: { user },
      error
    } = await supabase.auth.getUser(token);
    if (error || !user) {
      res.status(401).json({ error: "Unauthorized: Invalid token" });
      return;
    }
    const { roleName, membershipName } = await resolveUserRoleAndMembership(user.id, user.email);
    req.user = {
      ...user,
      uid: user.id,
      roleName,
      membershipName
    };
    next();
  } catch (error) {
    console.error("Error verifying Supabase ID token:", error);
    res.status(401).json({ error: "Unauthorized: Invalid token" });
    return;
  }
};
var requireRoles = (allowedRoles) => {
  return async (req, res, next) => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const email = (req.user.email || "").toLowerCase();
    const userRole = req.user.roleName || "vendor";
    const isBootstrapAdmin = BOOTSTRAP_ADMINS.includes(email);
    if (allowedRoles.includes(userRole) || isBootstrapAdmin) {
      next();
      return;
    }
    res.status(403).json({ error: `Forbidden: Requires role ${allowedRoles.join(" or ")}` });
  };
};

// src/server/createApp.ts
init_users();

// src/db/rfqs.ts
init_db();
init_schema();
import { eq as eq2, desc } from "drizzle-orm";
async function getUserRfqs(userId) {
  return await db.select().from(rfqs).where(eq2(rfqs.userId, userId)).orderBy(desc(rfqs.createdAt));
}
async function createRfq(userId, data) {
  const result = await db.insert(rfqs).values({
    userId,
    title: data.title,
    category: data.category,
    priority: data.priority,
    description: data.description
  }).returning();
  return result[0];
}

// src/services/notificationService.ts
var MOCK_PROVIDERS = [
  { id: "1", name: "PatagoniaTech Solutions", email: "contacto@patagoniatech.local", category: "Servicios Industriales" },
  { id: "2", name: "Metal\xFArgica del C\xE9firo", email: "ventas@metalurgicacefiro.local", category: "Servicios Industriales" },
  { id: "3", name: "Log\xEDstica Austral S.A.", email: "operaciones@logisticaaustral.local", category: "Log\xEDstica y Transporte" },
  { id: "4", name: "Transportes Cruz del Sur", email: "cotizaciones@cruz-sur.local", category: "Log\xEDstica y Transporte" },
  { id: "5", name: "NorteSur Inspecciones", email: "cotizaciones@nortesur.local", category: "Hidrocarburos" },
  { id: "6", name: "Servicios Petroleros del Golfo", email: "ventas@spg.local", category: "Hidrocarburos" },
  { id: "7", name: "RenovaPatagonia", email: "proyectos@renovapatagonia.local", category: "Energ\xEDas Renovables" },
  { id: "8", name: "E\xF3lica Sur", email: "comercial@eolicasur.local", category: "Energ\xEDas Renovables" }
];
async function notifyProvidersForRfq(rfqCategory, rfqTitle, rfqId) {
  console.log(`
======================================================`);
  console.log(`[Notificaci\xF3n Inteligente] Iniciando proceso de Match...`);
  console.log(`RFQ Categor\xEDa Buscada: "${rfqCategory}"`);
  const matchedProviders = MOCK_PROVIDERS.filter((p) => p.category === rfqCategory);
  console.log(`\u2705 [Match Directo] Se encontraron ${matchedProviders.length} proveedores verificados para la categor\xEDa.`);
  console.log(`======================================================
`);
  for (const provider of matchedProviders) {
    console.log(`[Email Service] Preparando env\xEDo para: ${provider.name} <${provider.email}>`);
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log(`[Email Service] \u2709\uFE0F ENVIADO - Asunto: "Nueva Oportunidad de Negocio #${rfqId} - ${rfqTitle}"
`);
  }
  console.log(`[Proceso Completado] Se notificaron ${matchedProviders.length} proveedores exitosamente.`);
  return {
    success: true,
    providersNotified: matchedProviders.length
  };
}

// src/server/createApp.ts
init_db();
init_schema();
import { eq as eq3, desc as desc2 } from "drizzle-orm";
var cachedSupabaseAdmin;
function getSupabaseAdminClient() {
  if (cachedSupabaseAdmin !== void 0) return cachedSupabaseAdmin;
  const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "").trim();
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if ((supabaseUrl.startsWith("http://") || supabaseUrl.startsWith("https://")) && serviceRoleKey.length > 20) {
    cachedSupabaseAdmin = createClient2(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  } else {
    cachedSupabaseAdmin = null;
  }
  return cachedSupabaseAdmin;
}
var DEFAULT_HERO_SUGGESTIONS = [
  "Log\xEDstica de Fr\xEDo -25\xB0C",
  "V\xE1lvulas Esf\xE9ricas API 6D",
  "Mantenimiento de Parques E\xF3licos",
  "Inspecci\xF3n No Destructiva NDT"
];
var isUsableGeminiKey = (key) => {
  return Boolean(key && key.trim().length > 10 && !key.includes("MY_GEMINI_API_KEY"));
};
function createApiApp() {
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
  const TMP_UPLOADS_DIR = path.join("/tmp", "xpatagonia-uploads");
  const SITE_SETTINGS_CACHE_FILE = path.join("/tmp", "xpatagonia-site-settings.json");
  for (const dir of [UPLOADS_DIR, TMP_UPLOADS_DIR]) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch {
    }
  }
  app.use("/uploads", express.static(UPLOADS_DIR));
  app.use("/uploads", express.static(TMP_UPLOADS_DIR));
  let inMemorySiteSettings = null;
  const inMemoryAutomationLogs = [];
  async function recordAutomationEvent(direction, event, status, payload) {
    const entry = {
      id: Date.now(),
      direction,
      event,
      status,
      payload,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    inMemoryAutomationLogs.unshift(entry);
    if (inMemoryAutomationLogs.length > 50) inMemoryAutomationLogs.pop();
    let persistedInPg = false;
    if (hasDatabaseConfig()) {
      try {
        await db.insert(automationLogs).values({ direction, event, status, payload });
        persistedInPg = true;
      } catch {
      }
    }
    if (!persistedInPg) {
      const sbAdmin = getSupabaseAdminClient();
      if (sbAdmin) {
        try {
          await sbAdmin.from("automation_logs").insert({ direction, event, status, payload });
        } catch {
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
    "http://localhost:5173"
  ];
  app.use(
    cors({
      origin: function(origin, callback) {
        if (!origin || allowedOrigins.includes(origin) || origin.includes(".run.app") || origin.includes(".onrender.com") || origin.includes(".vercel.app") || origin.includes(".pages.dev") || origin.includes("xpatagonia.online")) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true
    })
  );
  app.get("/api/health", (req, res) => {
    const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "").trim();
    const supabaseAnon = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "").trim();
    const geminiKey = process.env.CUSTOM_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    const resendConfigured = Boolean(
      process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim().length > 5
    );
    const smtpConfigured = Boolean(process.env.SMTP_PASSWORD);
    const imapConfigured = Boolean(process.env.IMAP_PASSWORD);
    res.json({
      status: "ok",
      runtime: process.env.VERCEL ? "vercel_serverless" : "node_server",
      environment: process.env.NODE_ENV || "development",
      databaseConfigured: hasDatabaseConfig(),
      supabaseConfigured: Boolean(supabaseUrl && supabaseAnon),
      supabaseAdminConfigured: Boolean(getSupabaseAdminClient()),
      geminiConfigured: isUsableGeminiKey(geminiKey),
      resendConfigured,
      emailOutboundProvider: resendConfigured ? "resend_https" : smtpConfigured ? "cyberpanel_smtp" : "none",
      mailHost: process.env.IMAP_HOST || "mail.xpatagonia.online",
      mailConfigured: Boolean(imapConfigured && (resendConfigured || smtpConfigured)),
      osrmConfigured: Boolean(process.env.OSRM_BASE_URL),
      osrmMode: process.env.OSRM_BASE_URL ? "supermicro" : "public_fallback",
      n8nConfigured: Boolean(process.env.N8N_WEBHOOK_URL),
      n8nMode: process.env.N8N_WEBHOOK_URL ? "active" : "local_queue",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app.post("/api/register-setup", requireAuth, async (req, res) => {
    try {
      if (!req.user || !req.user.uid || !req.user.email) {
        res.status(400).json({ error: "Invalid user data" });
        return;
      }
      const { cuit, category } = req.body;
      const { registerUserSetup: registerUserSetup2 } = await Promise.resolve().then(() => (init_users(), users_exports));
      const user = await registerUserSetup2(req.user.uid, req.user.email, cuit, category);
      res.json({ user });
    } catch (error) {
      console.error("Error setting up new user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app.get("/api/me/access", requireAuth, (req, res) => {
    const roleName = req.user?.roleName || "vendor";
    res.json({
      uid: req.user?.uid,
      email: req.user?.email,
      roleName,
      membershipName: req.user?.membershipName || "Basic",
      isAdmin: ["system_admin", "content_editor"].includes(roleName)
    });
  });
  app.get(
    "/api/admin/users",
    requireAuth,
    requireRoles(["system_admin", "support_operator"]),
    async (req, res) => {
      try {
        const { getAllUsersWithRoles: getAllUsersWithRoles2 } = await Promise.resolve().then(() => (init_users(), users_exports));
        const users2 = await getAllUsersWithRoles2();
        res.json(users2);
      } catch (error) {
        console.error("Error getting users:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    }
  );
  app.post(
    "/api/admin/users/:uid/role",
    requireAuth,
    requireRoles(["system_admin"]),
    async (req, res) => {
      try {
        const { updateUserRole: updateUserRole2 } = await Promise.resolve().then(() => (init_users(), users_exports));
        await updateUserRole2(req.params.uid, req.body.role);
        res.json({ success: true });
      } catch (error) {
        console.error("Error updating role:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    }
  );
  app.post(
    "/api/admin/users/:uid/membership",
    requireAuth,
    requireRoles(["system_admin", "support_operator"]),
    async (req, res) => {
      try {
        const { updateUserMembership: updateUserMembership2 } = await Promise.resolve().then(() => (init_users(), users_exports));
        await updateUserMembership2(req.params.uid, req.body.membership);
        res.json({ success: true });
      } catch (error) {
        console.error("Error updating membership:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    }
  );
  app.post(
    "/api/admin/users/create",
    requireAuth,
    requireRoles(["system_admin"]),
    async (req, res) => {
      try {
        const { email, password, roleName, membershipName, companyName } = req.body;
        if (!email || !password) {
          res.status(400).json({ error: "Email and password are required" });
          return;
        }
        const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
        const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;
        const sbAdmin = createClient2(supabaseUrl, serviceKey);
        let uid = "";
        if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
          const { data, error } = await sbAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true
          });
          if (error) throw error;
          uid = data.user.id;
        } else {
          const { data, error } = await sbAdmin.auth.signUp({
            email,
            password
          });
          if (error) throw error;
          uid = data.user?.id || "";
        }
        if (!uid) {
          throw new Error("Failed to get user ID after creation");
        }
        const { getOrCreateUser: ensureUser, updateUserRole: updateUserRole2, updateUserMembership: updateUserMembership2 } = await Promise.resolve().then(() => (init_users(), users_exports));
        await ensureUser(uid, email);
        await updateUserRole2(uid, roleName);
        await updateUserMembership2(uid, membershipName);
        const { companyProfiles: companyProfiles2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
        if (companyName) {
          await db.update(companyProfiles2).set({ companyName }).where(eq3(companyProfiles2.userId, uid));
        }
        res.json({ success: true, uid });
      } catch (error) {
        console.error("Error creating internal user:", error);
        res.status(500).json({ error: error.message || "Internal server error" });
      }
    }
  );
  app.post("/api/sync-user", requireAuth, async (req, res) => {
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
  app.get("/api/rfqs", requireAuth, async (req, res) => {
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
  app.post("/api/rfqs", requireAuth, async (req, res) => {
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
      res.json(newRfq);
    } catch (error) {
      console.error("Error creating RFQ:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app.get("/api/emails", requireAuth, async (req, res) => {
    try {
      const { fetchEmails: fetchEmails2 } = await Promise.resolve().then(() => (init_emailService(), emailService_exports));
      const emails = await fetchEmails2();
      res.json(emails);
    } catch (error) {
      console.error("Error fetching emails:", error);
      res.status(500).json({ error: error.message || "Failed to fetch emails" });
    }
  });
  app.post("/api/emails/send", requireAuth, async (req, res) => {
    try {
      const { to, subject, text: text2, html } = req.body;
      if (!to || !subject || !text2 && !html) {
        res.status(400).json({ error: "Missing required fields: to, subject, text/html" });
        return;
      }
      const { sendEmail: sendEmail2 } = await Promise.resolve().then(() => (init_emailService(), emailService_exports));
      const result = await sendEmail2(to, subject, text2, html);
      res.json({
        success: true,
        messageId: result.messageId,
        provider: result.provider,
        mocked: result.mocked
      });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ error: error.message || "Failed to send email" });
    }
  });
  app.post("/api/generate-insights", async (req, res) => {
    try {
      const apiKey = process.env.CUSTOM_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (!isUsableGeminiKey(apiKey)) {
        return res.json({
          insights: `## Resumen Estrat\xE9gico Patagonia B2B

- **Cuenca Neuquina & Golfo San Jorge**: Incremento del 38% en licitaciones de v\xE1lvulas API 6D, montaje electromec\xE1nico y servicios ambientales.
- **Log\xEDstica Portuaria Austral**: Modernizaci\xF3n de terminales de fr\xEDo (-25\xB0C) en Puerto Madryn, Comodoro Rivadavia y Ushuaia.
- **Transici\xF3n Energ\xE9tica**: Nuevos proyectos de parques e\xF3licos demandan proveedores locales certificados bajo normas ISO 9001 e ISO 14001.`
        });
      }
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } }
      });
      const prompt = `Crea un resumen semanal estrat\xE9gico curado y formateado en Markdown sobre actualidad empresarial, startups e innovaci\xF3n en la regi\xF3n patag\xF3nica (Chubut, R\xEDo Negro, Neuqu\xE9n, Santa Cruz y Tierra del Fuego). Enf\xF3cate en negocios, inversiones, energ\xEDa, log\xEDstica y desarrollo econ\xF3mico industrial.`;
      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: prompt
      });
      res.json({ insights: response.text });
    } catch {
      res.json({
        insights: `## Resumen Estrat\xE9gico Patagonia B2B

- **Energ\xEDa e Hidrocarburos**: Expansi\xF3n de capacidad de transporte y demanda de servicios metalmec\xE1nicos certificados.
- **Log\xEDstica Multimodal**: Integraci\xF3n de corredores en Ruta Nacional 3 y Ruta 40 con trazabilidad satelital.
- **Ecosistema PyME**: Sincronizaci\xF3n de proveedores regionales en el directorio corporativo y CRM.`
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
          reason: "Gemini API key not configured for background cron"
        };
      }
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } }
      });
      const prompt = `Busca informaci\xF3n p\xFAblica reciente y noticias de las provincias de la Patagonia Argentina (Chubut, Santa Cruz, R\xEDo Negro, Neuqu\xE9n, Tierra del Fuego).
Selecciona una noticia relevante sobre producci\xF3n, energ\xEDa, log\xEDstica, pesca o industria y devuelve un objeto JSON con:
{
  "title": "T\xEDtulo conciso de la noticia",
  "category": "Actualidad",
  "location": "Provincia patag\xF3nica",
  "content": "Resumen de 2 p\xE1rrafos.",
  "source_name": "Fuente oficial",
  "url": "https://xpatagonia.online/insights"
}`;
      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
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
        content: (data.location ? `__LOC__${data.location}__LOC__ ` : "") + data.content + (data.url ? `

**Fuente:** [${data.source_name || "Leer noticia completa"}](${data.url})` : ""),
        image: null,
        videoUrl: null,
        author: "IA Reportero",
        sourceUrl: data.url || null,
        createdAt: /* @__PURE__ */ new Date()
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
            created_at: insight.createdAt.toISOString()
          });
        }
      }
      return { success: true, insight };
    } catch (error) {
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
        const supabaseAnon = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "").trim();
        if (supabaseUrl && supabaseAnon) {
          const sb = createClient2(supabaseUrl, supabaseAnon, {
            auth: { persistSession: false, autoRefreshToken: false }
          });
          const {
            data: { user },
            error
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
    } catch (error) {
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
        httpOptions: { headers: { "User-Agent": "aistudio-build" } }
      });
      const prompt = `Eres el asistente inteligente de xPatagonia, el Hub de Servicios para la Industria Sostenible.
Genera 3 sugerencias breves de b\xFAsqueda de servicios B2B o insumos industriales relevantes para la regi\xF3n (ej. "Auditor\xEDa Ambiental", "Ingenier\xEDa Naval", "Log\xEDstica de Fr\xEDo").
Devuelve \xDANICAMENTE un array JSON v\xE1lido de 3 strings, sin markdown.`;
      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
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
  let marketDataCache = null;
  const MARKET_CACHE_TTL = 60 * 1e3;
  app.get("/api/market-data", async (req, res) => {
    const now = Date.now();
    if (marketDataCache && now - marketDataCache.timestamp < MARKET_CACHE_TTL) {
      return res.json(marketDataCache.data);
    }
    try {
      let dolares = [];
      try {
        const dolaresRes = await fetch("https://dolarapi.com/v1/dolares", {
          signal: AbortSignal.timeout(4e3)
        });
        if (dolaresRes.ok) {
          dolares = await dolaresRes.json();
        }
      } catch (err) {
        console.warn("DolarApi dolares fetch warning:", err);
      }
      let cotizaciones = [];
      try {
        const cotiRes = await fetch("https://dolarapi.com/v1/cotizaciones", {
          signal: AbortSignal.timeout(4e3)
        });
        if (cotiRes.ok) {
          cotizaciones = await cotiRes.json();
        }
      } catch (err) {
        console.warn("DolarApi cotizaciones fetch warning:", err);
      }
      let btc = {
        usd: 81450,
        usd_24h_change: 1.25,
        ars: 125e6,
        ars_24h_change: 1.18,
        source: "CoinGecko / Coinbase"
      };
      try {
        const cgRes = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,ars&include_24hr_change=true",
          { signal: AbortSignal.timeout(4e3) }
        );
        if (cgRes.ok) {
          const cgData = await cgRes.json();
          if (cgData.bitcoin?.usd) {
            btc = {
              usd: cgData.bitcoin.usd,
              usd_24h_change: Number((cgData.bitcoin.usd_24h_change || 0).toFixed(2)),
              ars: cgData.bitcoin.ars || Math.round(cgData.bitcoin.usd * 1540),
              ars_24h_change: Number(
                (cgData.bitcoin.ars_24h_change || cgData.bitcoin.usd_24h_change || 0).toFixed(2)
              ),
              source: "CoinGecko"
            };
          }
        } else {
          const cbRes = await fetch("https://api.coinbase.com/v2/prices/spot?currency=USD", {
            signal: AbortSignal.timeout(3e3)
          });
          if (cbRes.ok) {
            const cbData = await cbRes.json();
            const val = parseFloat(cbData.data?.amount);
            if (!isNaN(val)) {
              btc.usd = val;
              btc.ars = Math.round(val * 1540);
              btc.source = "Coinbase";
            }
          }
        }
      } catch (err) {
        console.warn("BTC fetch warning:", err);
      }
      const blue = dolares.find((d) => d.casa === "blue") || { compra: 1545, venta: 1565 };
      const oficial = dolares.find((d) => d.casa === "oficial") || { compra: 1500, venta: 1550 };
      const mep = dolares.find((d) => d.casa === "bolsa") || { compra: 1520, venta: 1535 };
      const ccl = dolares.find((d) => d.casa === "contadoconliqui") || { compra: 1570, venta: 1585 };
      const mayorista = dolares.find((d) => d.casa === "mayorista") || { compra: 1495, venta: 1515 };
      const eur = cotizaciones.find((c) => c.moneda === "EUR") || { compra: 1700, venta: 1715 };
      const brl = cotizaciones.find((c) => c.moneda === "BRL") || { compra: 275, venta: 288 };
      const payload = {
        updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        btc: {
          symbol: "BTC",
          name: "Bitcoin",
          usd: btc.usd,
          ars: btc.ars,
          change24h: btc.usd_24h_change,
          isPositive: btc.usd_24h_change >= 0,
          source: btc.source
        },
        currencies: [
          { symbol: "USD BLUE", name: "D\xF3lar Blue", buy: blue.compra, sell: blue.venta, change: "+0.6%", isPositive: true, source: "DolarApi / \xC1mbito" },
          { symbol: "USD MEP", name: "D\xF3lar Bolsa MEP", buy: mep.compra, sell: mep.venta, change: "-0.2%", isPositive: false, source: "DolarApi / BVC" },
          { symbol: "USD CCL", name: "Contado con Liqui", buy: ccl.compra, sell: ccl.venta, change: "+0.4%", isPositive: true, source: "DolarApi / BYMA" },
          { symbol: "USD OFIC", name: "D\xF3lar Oficial", buy: oficial.compra, sell: oficial.venta, change: "+0.1%", isPositive: true, source: "DolarApi / BCRA" },
          { symbol: "USD MAY", name: "D\xF3lar Mayorista", buy: mayorista.compra, sell: mayorista.venta, change: "+0.1%", isPositive: true, source: "DolarApi / MAE" },
          { symbol: "EUR/ARS", name: "Euro Oficial", buy: eur.compra, sell: eur.venta, change: "+0.3%", isPositive: true, source: "DolarApi / Banco Naci\xF3n" },
          { symbol: "BRL/ARS", name: "Real Brasile\xF1o", buy: brl.compra, sell: brl.venta, change: "-0.1%", isPositive: false, source: "DolarApi" }
        ],
        patagonia: [
          { symbol: "BRENT", name: "Petr\xF3leo Brent Ref.", value: "USD 74.80/bbl", change: "+0.9%", isPositive: true, unit: "USD/barril", source: "ICE Benchmark" },
          { symbol: "MEDANITO", name: "Crudo Medanito Neuqu\xE9n", value: "USD 69.40/bbl", change: "+1.2%", isPositive: true, unit: "USD/barril", source: "Secretar\xEDa de Energ\xEDa / Cuenca Neuquina" },
          { symbol: "GAS PGY", name: "Gas Natural Cuenca Neuquina", value: "USD 3.52/MMBtu", change: "+0.4%", isPositive: true, unit: "USD/MMBtu", source: "Plan Gas.Ar / Cammesa" },
          { symbol: "PESCA", name: "Langostino L1/L2 Congelado", value: "USD 6.85/kg", change: "+1.5%", isPositive: true, unit: "USD/kg FOB", source: "C\xE1mara Pesquera Patag\xF3nica" },
          { symbol: "E\xD3LICA", name: "Potencia E\xF3lica Activa", value: "1.580 MW", change: "+120 MW", isPositive: true, unit: "Factor 51.2%", source: "CAMMESA / Parques Chubut-Santa Cruz" },
          { symbol: "LANA", name: "Lana Merino Fina 19.5u", value: "USD 6.45/kg", change: "-0.3%", isPositive: false, unit: "USD/kg base limpia", source: "Federaci\xF3n Lanera Argentina" },
          { symbol: "LITIO", name: "Carbonato de Litio Li2CO3", value: "USD 10,850/tn", change: "+2.4%", isPositive: true, unit: "USD/tonelada", source: "Mercado Internacional Minero" }
        ]
      };
      marketDataCache = { timestamp: now, data: payload };
      res.json(payload);
    } catch (error) {
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
      }
      res.json({
        usd: usdData.venta,
        eur: eurData.venta,
        brl: brlData.venta,
        cny: cnyArs
      });
    } catch (error) {
      console.error("Error fetching currencies:", error);
      res.status(500).json({ error: "Failed to fetch currency rates" });
    }
  });
  app.get("/api/logistics/route", async (req, res) => {
    try {
      const from = String(req.query.from || "");
      const to = String(req.query.to || "");
      if (!from || !to) {
        return res.status(400).json({ error: "Missing from/to coordinates (lng,lat)" });
      }
      const candidates = [];
      if (process.env.OSRM_BASE_URL) {
        candidates.push({
          base: process.env.OSRM_BASE_URL.replace(/\/+$/, ""),
          label: "Supermicro OSRM"
        });
      }
      candidates.push({ base: "https://router.project-osrm.org", label: "OpenStreetMap OSRM" });
      for (const candidate of candidates) {
        try {
          const url = `${candidate.base}/route/v1/driving/${from};${to}?overview=full&geometries=geojson`;
          const headers = {};
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
        }
      }
      res.status(502).json({ error: "OSRM endpoints temporarily unreachable" });
    } catch (error) {
      res.status(500).json({ error: error.message || "Failed to calculate route" });
    }
  });
  app.post("/api/logistics/reverse-auction", async (req, res) => {
    try {
      const payload = {
        event: "logistics.reverse_auction.created",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        ...req.body
      };
      let forwardedToN8n = false;
      if (process.env.N8N_WEBHOOK_URL) {
        try {
          const whRes = await fetch(process.env.N8N_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(3500)
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
        payload
      });
    } catch (error) {
      res.status(500).json({ error: error.message || "Error creating reverse auction" });
    }
  });
  app.post("/api/crm/sync-odoo", async (req, res) => {
    try {
      const payload = {
        event: "crm.company.sync_odoo",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        ...req.body
      };
      let forwardedToN8n = false;
      if (process.env.N8N_WEBHOOK_URL) {
        try {
          const whRes = await fetch(process.env.N8N_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(3500)
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
        target: forwardedToN8n ? "n8n \u2192 Odoo VPS" : "Cola Local CRM (pendiente de n8n)"
      });
    } catch (error) {
      res.status(500).json({ error: error.message || "Error syncing to Odoo" });
    }
  });
  app.get("/api/site-settings", async (req, res) => {
    try {
      if (inMemorySiteSettings) {
        return res.json({ settings: inMemorySiteSettings, source: "memory" });
      }
      if (hasDatabaseConfig()) {
        try {
          const rows = await db.select().from(siteSettings).where(eq3(siteSettings.key, "global_site_config"));
          if (rows[0]?.value) {
            inMemorySiteSettings = rows[0].value;
            return res.json({ settings: inMemorySiteSettings, source: "postgres" });
          }
        } catch {
        }
      }
      const sbAdmin = getSupabaseAdminClient();
      if (sbAdmin) {
        try {
          const { data } = await sbAdmin.from("site_settings").select("value").eq("key", "global_site_config").maybeSingle();
          if (data?.value) {
            inMemorySiteSettings = data.value;
            return res.json({ settings: inMemorySiteSettings, source: "supabase" });
          }
        } catch {
        }
      }
      if (fs.existsSync(SITE_SETTINGS_CACHE_FILE)) {
        const parsed = JSON.parse(fs.readFileSync(SITE_SETTINGS_CACHE_FILE, "utf-8"));
        inMemorySiteSettings = parsed;
        return res.json({ settings: parsed, source: "file" });
      }
      res.json({ settings: null, source: "defaults" });
    } catch (error) {
      res.status(500).json({ error: error.message || "Failed to read site settings" });
    }
  });
  app.put(
    "/api/site-settings",
    requireAuth,
    requireRoles(["system_admin", "content_editor"]),
    async (req, res) => {
      try {
        const updatedSettings = {
          ...req.body || {},
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        inMemorySiteSettings = updatedSettings;
        try {
          fs.writeFileSync(
            SITE_SETTINGS_CACHE_FILE,
            JSON.stringify(updatedSettings, null, 2),
            "utf-8"
          );
        } catch {
        }
        let persistedInPg = false;
        if (hasDatabaseConfig()) {
          try {
            await db.insert(siteSettings).values({
              key: "global_site_config",
              value: updatedSettings,
              updatedBy: req.user?.email || req.user?.uid || "admin",
              updatedAt: /* @__PURE__ */ new Date()
            }).onConflictDoUpdate({
              target: siteSettings.key,
              set: {
                value: updatedSettings,
                updatedBy: req.user?.email || req.user?.uid || "admin",
                updatedAt: /* @__PURE__ */ new Date()
              }
            });
            persistedInPg = true;
          } catch {
          }
        }
        if (!persistedInPg) {
          const sbAdmin = getSupabaseAdminClient();
          if (sbAdmin) {
            try {
              await sbAdmin.from("site_settings").upsert({
                key: "global_site_config",
                value: updatedSettings,
                updated_by: req.user?.email || req.user?.uid || "admin",
                updated_at: (/* @__PURE__ */ new Date()).toISOString()
              });
            } catch {
            }
          }
        }
        res.json({ success: true, settings: updatedSettings });
      } catch (error) {
        res.status(500).json({ error: error.message || "Failed to update site settings" });
      }
    }
  );
  app.post(
    "/api/admin/upload-media",
    requireAuth,
    requireRoles(["system_admin", "content_editor"]),
    async (req, res) => {
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
          try {
            const storagePath = `hero/${safeName}`;
            const { error: uploadError } = await sbAdmin.storage.from("site-media").upload(storagePath, buffer, {
              contentType: resolvedMime,
              upsert: true
            });
            if (!uploadError) {
              const { data: pub } = sbAdmin.storage.from("site-media").getPublicUrl(storagePath);
              if (pub?.publicUrl) {
                return res.json({
                  success: true,
                  url: pub.publicUrl,
                  storage: "supabase",
                  mimeType: resolvedMime,
                  sizeBytes: buffer.length
                });
              }
            }
          } catch (storageErr) {
            console.warn("Supabase Storage upload fallback to local:", storageErr);
          }
        }
        try {
          const targetPath = path.join(UPLOADS_DIR, safeName);
          fs.writeFileSync(targetPath, buffer);
          return res.json({
            success: true,
            url: `/uploads/${safeName}`,
            storage: "local",
            mimeType: resolvedMime,
            sizeBytes: buffer.length
          });
        } catch {
          const tmpPath = path.join(TMP_UPLOADS_DIR, safeName);
          fs.writeFileSync(tmpPath, buffer);
          return res.json({
            success: true,
            url: `/uploads/${safeName}`,
            storage: "tmp",
            mimeType: resolvedMime,
            sizeBytes: buffer.length
          });
        }
      } catch (error) {
        res.status(500).json({ error: error.message || "Upload failed" });
      }
    }
  );
  app.post("/api/webhooks/odoo", async (req, res) => {
    try {
      const configuredSecret = process.env.N8N_SHARED_SECRET || process.env.ODOO_WEBHOOK_SECRET;
      if (configuredSecret) {
        const incomingSecret = req.headers["x-odoo-webhook-secret"] || req.headers["x-n8n-secret"];
        if (incomingSecret !== configuredSecret) {
          return res.status(403).json({ error: "Invalid webhook signature" });
        }
      }
      const { event = "odoo.event", uid, membership, verificationStatus, invoiceRef } = req.body || {};
      if (uid && membership) {
        try {
          const { updateUserMembership: updateUserMembership2 } = await Promise.resolve().then(() => (init_users(), users_exports));
          await updateUserMembership2(String(uid), String(membership));
        } catch (err) {
          console.warn("Odoo webhook membership DB skip:", err);
        }
      }
      const logEntry = await recordAutomationEvent("inbound_odoo", event, "processed", {
        uid,
        membership,
        verificationStatus,
        invoiceRef,
        raw: req.body
      });
      res.json({ success: true, received: logEntry });
    } catch (error) {
      res.status(500).json({ error: error.message || "Webhook error" });
    }
  });
  app.get(
    "/api/admin/automation-logs",
    requireAuth,
    requireRoles(["system_admin", "support_operator"]),
    async (req, res) => {
      try {
        let dbLogs = [];
        if (hasDatabaseConfig()) {
          try {
            dbLogs = await db.select().from(automationLogs).orderBy(desc2(automationLogs.createdAt)).limit(30);
          } catch {
          }
        }
        if (dbLogs.length === 0) {
          const sbAdmin = getSupabaseAdminClient();
          if (sbAdmin) {
            try {
              const { data } = await sbAdmin.from("automation_logs").select("*").order("created_at", { ascending: false }).limit(30);
              if (Array.isArray(data) && data.length > 0) {
                dbLogs = data.map((row) => ({
                  id: row.id,
                  direction: row.direction,
                  event: row.event,
                  status: row.status,
                  payload: row.payload,
                  createdAt: row.created_at
                }));
              }
            } catch {
            }
          }
        }
        res.json({
          logs: dbLogs.length > 0 ? dbLogs : inMemoryAutomationLogs,
          n8nConfigured: Boolean(process.env.N8N_WEBHOOK_URL)
        });
      } catch (error) {
        res.status(500).json({ error: error.message || "Failed to fetch automation logs" });
      }
    }
  );
  app.get("/api/maps-key", (req, res) => {
    res.json({ key: process.env.GOOGLE_MAPS_PLATFORM_KEY || "" });
  });
  return { app, runAutoInsight };
}

// src/server/vercelEntry.ts
var cachedApp = null;
function handler(req, res) {
  try {
    if (!cachedApp) {
      cachedApp = createApiApp().app;
    }
    return cachedApp(req, res);
  } catch (err) {
    console.error("Vercel API initialization error:", err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        error: "Serverless function initialization failed",
        message: err?.message || String(err)
      })
    );
  }
}
export {
  handler as default
};
