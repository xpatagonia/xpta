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
  arnActionsQueue: () => arnActionsQueue,
  arnOpportunities: () => arnOpportunities,
  arnRules: () => arnRules,
  automationLogs: () => automationLogs,
  chatMessages: () => chatMessages,
  companyProfiles: () => companyProfiles,
  contacts: () => contacts,
  fleetDrivers: () => fleetDrivers,
  fleetExpiryAlerts: () => fleetExpiryAlerts,
  fleetVehicles: () => fleetVehicles,
  insights: () => insights,
  inventoryItems: () => inventoryItems,
  logisticsContracts: () => logisticsContracts,
  memberships: () => memberships,
  moduleRequests: () => moduleRequests,
  orgInvitations: () => orgInvitations,
  orgMembers: () => orgMembers,
  organizations: () => organizations,
  permissions: () => permissions,
  processedEmailUids: () => processedEmailUids,
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
var users, companyProfiles, products, rfqs, contacts, insights, inventoryItems, moduleRequests, roles, permissions, rolePermissions, userRoles, memberships, userMemberships, organizations, orgMembers, orgInvitations, siteSettings, automationLogs, processedEmailUids, fleetExpiryAlerts, arnRules, arnOpportunities, arnActionsQueue, chatMessages, fleetVehicles, fleetDrivers, logisticsContracts;
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
      // Multi-profile Directory classification (Empresa | Emprendimiento | Profesional | Servicio)
      entityType: text("entity_type").default("empresa"),
      credentialLabel: text("credential_label"),
      serviceModality: text("service_modality"),
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
      organizationId: integer("organization_id"),
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
      arnOpportunityId: integer("arn_opportunity_id"),
      aiScore: integer("ai_score").default(0),
      leadStage: text("lead_stage").default("nuevo"),
      lastArnSyncAt: timestamp("last_arn_sync_at"),
      odooSynced: boolean("odoo_synced").default(false),
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
      organizationId: integer("organization_id"),
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
      // e.g., 'Basic', 'Pro Industria', 'Corporativo', 'Logística & Flota'
      tier: integer("tier").notNull(),
      // 1, 2, 3
      price: integer("price").notNull().default(0),
      // Monthly price in ARS
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
    organizations = pgTable("organizations", {
      id: serial("id").primaryKey(),
      ownerUid: text("owner_uid").notNull().unique(),
      name: text("name").notNull(),
      planSlug: text("plan_slug").notNull().default("gratis"),
      // 'gratis' (2) | 'pro' (5) | 'corporativo' (10)
      seatLimit: integer("seat_limit").notNull().default(2),
      logisticsPlanActive: boolean("logistics_plan_active").notNull().default(false),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    orgMembers = pgTable("org_members", {
      id: serial("id").primaryKey(),
      organizationId: integer("organization_id").notNull(),
      userUid: text("user_uid").notNull(),
      email: text("email").notNull(),
      orgRole: text("org_role").notNull().default("comercial"),
      // 'company_admin' | 'comercial' | 'operador'
      status: text("status").notNull().default("active"),
      joinedAt: timestamp("joined_at").defaultNow()
    });
    orgInvitations = pgTable("org_invitations", {
      id: serial("id").primaryKey(),
      organizationId: integer("organization_id").notNull(),
      email: text("email").notNull(),
      orgRole: text("org_role").notNull().default("comercial"),
      invitedByUid: text("invited_by_uid").notNull(),
      token: text("token").notNull(),
      status: text("status").notNull().default("pending"),
      // 'pending' | 'accepted' | 'revoked'
      expiresAt: timestamp("expires_at"),
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
      attempts: integer("attempts").notNull().default(0),
      nextRetryAt: timestamp("next_retry_at"),
      lastError: text("last_error"),
      updatedAt: timestamp("updated_at").defaultNow(),
      createdAt: timestamp("created_at").defaultNow()
    });
    processedEmailUids = pgTable("processed_email_uids", {
      id: serial("id").primaryKey(),
      mailbox: text("mailbox").notNull().default("INBOX"),
      emailUid: text("email_uid").notNull(),
      senderEmail: text("sender_email"),
      subject: text("subject"),
      organizationId: integer("organization_id"),
      arnOpportunityId: integer("arn_opportunity_id"),
      processedAt: timestamp("processed_at").defaultNow()
    });
    fleetExpiryAlerts = pgTable("fleet_expiry_alerts", {
      id: serial("id").primaryKey(),
      vehicleId: integer("vehicle_id").notNull(),
      alertType: text("alert_type").notNull(),
      // 'vtv' | 'insurance'
      expiryDate: text("expiry_date").notNull(),
      notifiedEmail: text("notified_email"),
      sentAt: timestamp("sent_at").defaultNow()
    });
    arnRules = pgTable("arn_rules", {
      userId: text("user_uid").primaryKey(),
      organizationId: integer("organization_id"),
      mode: text("mode").notNull().default("hybrid"),
      // 'hybrid' | 'manual' | 'auto'
      autoApproveMaxUsd: integer("auto_approve_max_usd").notNull().default(1500),
      minConfidenceScore: integer("min_confidence_score").notNull().default(82),
      autoSendEmails: boolean("auto_send_emails").notNull().default(false),
      autoCreateLogistics: boolean("auto_create_logistics").notNull().default(true),
      autoReserveInventory: boolean("auto_reserve_inventory").notNull().default(true),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    arnOpportunities = pgTable("arn_opportunities", {
      id: serial("id").primaryKey(),
      ownerUid: text("owner_uid").notNull(),
      organizationId: integer("organization_id"),
      contactId: integer("contact_id"),
      companyName: text("company_name").notNull(),
      contactName: text("contact_name"),
      contactEmail: text("contact_email"),
      cuit: text("cuit"),
      category: text("category").default("General"),
      corridor: text("corridor"),
      source: text("source").notNull().default("manual"),
      // 'rfq' | 'email_imap' | 'home_lead' | 'directory' | 'messenger' | 'crm_contact'
      stage: text("stage").notNull().default("detected"),
      // 'detected' | 'qualified' | 'quoted' | 'negotiating' | 'awarded' | 'archived'
      aiScore: integer("ai_score").notNull().default(70),
      estimatedAmountUsd: integer("estimated_amount_usd").notNull().default(0),
      urgency: text("urgency").notNull().default("medium"),
      summary: text("summary"),
      recommendedAction: text("recommended_action"),
      rawContext: jsonb("raw_context").default("{}"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    arnActionsQueue = pgTable("arn_actions_queue", {
      id: serial("id").primaryKey(),
      ownerUid: text("owner_uid").notNull(),
      organizationId: integer("organization_id"),
      opportunityId: integer("opportunity_id"),
      actionType: text("action_type").notNull(),
      // 'send_quote_email' | 'send_followup_email' | 'create_logistics_load' | 'reserve_inventory' | 'notify_providers'
      title: text("title").notNull(),
      targetEmail: text("target_email"),
      draftSubject: text("draft_subject"),
      draftBody: text("draft_body"),
      estimatedAmountUsd: integer("estimated_amount_usd").notNull().default(0),
      confidenceScore: integer("confidence_score").notNull().default(75),
      executionMode: text("execution_mode").notNull().default("manual_approval"),
      // 'auto_approved' | 'manual_approval'
      status: text("status").notNull().default("pending_approval"),
      // 'pending_approval' | 'approved' | 'executed' | 'dismissed' | 'failed'
      metadata: jsonb("metadata").default("{}"),
      executedAt: timestamp("executed_at"),
      createdAt: timestamp("created_at").defaultNow()
    });
    chatMessages = pgTable("chat_messages", {
      id: serial("id").primaryKey(),
      channelId: text("channel_id").notNull(),
      senderUid: text("sender_uid").notNull(),
      senderName: text("sender_name").notNull(),
      senderCompany: text("sender_company"),
      text: text("text").notNull(),
      msgType: text("msg_type").notNull().default("text"),
      metadata: jsonb("metadata").default("{}"),
      createdAt: timestamp("created_at").defaultNow()
    });
    fleetVehicles = pgTable("fleet_vehicles", {
      id: serial("id").primaryKey(),
      organizationId: integer("organization_id").notNull(),
      ownerUid: text("owner_uid").notNull(),
      name: text("name").notNull(),
      plate: text("plate").notNull(),
      vehicleType: text("vehicle_type").notNull().default("Semirremolque 28t"),
      capacityTons: integer("capacity_tons").notNull().default(28),
      corridor: text("corridor").default("RN 3 / Patag\xF3nica"),
      vtvExpiry: text("vtv_expiry"),
      insuranceExpiry: text("insurance_expiry"),
      status: text("status").notNull().default("disponible"),
      // 'disponible' | 'en_ruta' | 'mantenimiento'
      gpsLabel: text("gps_label"),
      createdAt: timestamp("created_at").defaultNow()
    });
    fleetDrivers = pgTable("fleet_drivers", {
      id: serial("id").primaryKey(),
      organizationId: integer("organization_id").notNull(),
      ownerUid: text("owner_uid").notNull(),
      fullName: text("full_name").notNull(),
      dni: text("dni"),
      lintiLicense: text("linti_license"),
      phone: text("phone"),
      assignedVehicleId: integer("assigned_vehicle_id"),
      status: text("status").notNull().default("disponible"),
      // 'disponible' | 'en_viaje' | 'licencia'
      createdAt: timestamp("created_at").defaultNow()
    });
    logisticsContracts = pgTable("logistics_contracts", {
      id: serial("id").primaryKey(),
      loadId: text("load_id").notNull(),
      originName: text("origin_name").notNull(),
      destinationName: text("destination_name").notNull(),
      shipperOrgId: integer("shipper_org_id"),
      shipperUid: text("shipper_uid"),
      carrierOrgId: integer("carrier_org_id").notNull(),
      carrierUid: text("carrier_uid").notNull(),
      carrierName: text("carrier_name").notNull(),
      vehicleId: integer("vehicle_id"),
      driverId: integer("driver_id"),
      agreedPriceArs: integer("agreed_price_ars").notNull().default(0),
      status: text("status").notNull().default("ofertado"),
      // 'ofertado' | 'adjudicado' | 'en_transito' | 'entregado' | 'cancelado'
      trackingCode: text("tracking_code"),
      notes: text("notes"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
  }
});

// src/db/index.ts
var db_exports = {};
__export(db_exports, {
  createPool: () => createPool,
  db: () => db,
  formatPgError: () => formatPgError,
  hasDatabaseConfig: () => hasDatabaseConfig,
  pool: () => pool
});
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
function cleanEnvUrl(raw) {
  return (raw || "").trim().replace(/^['"]|['"]$/g, "");
}
function formatPgError(err) {
  const cause = err?.cause || err;
  const code = cause?.code || err?.code;
  const msg = String(cause?.message || err?.message || err || "Unknown Postgres error");
  const detail = cause?.detail ? ` (${cause.detail})` : "";
  if (code === "42P01") {
    return `Tabla inexistente en Postgres (42P01): ${msg}`;
  }
  if (code === "28P01" || /password authentication failed/i.test(msg)) {
    return `Contrase\xF1a incorrecta en DATABASE_URL (28P01): verific\xE1 tu password de Postgres en Vercel.`;
  }
  if (/Tenant or user not found/i.test(msg)) {
    return `Usuario/Proyecto inv\xE1lido en Supabase Pooler ("Tenant or user not found"): verific\xE1 que el usuario sea postgres.<PROJECT_REF> en DATABASE_URL.`;
  }
  if (code === "ENETUNREACH" || code === "ECONNREFUSED" || code === "ETIMEDOUT") {
    return `No se pudo conectar a Postgres (${code}: ${msg}). Si us\xE1s Supabase en Vercel, deb\xE9s usar la URI del Transaction Pooler (puerto 6543, host *.pooler.supabase.com), no el host directo db.*.supabase.co:5432.`;
  }
  return `${code ? `[${code}] ` : ""}${msg}${detail}`;
}
var Pool, hasDatabaseConfig, createPool, pool, db;
var init_db = __esm({
  "src/db/index.ts"() {
    init_schema();
    ({ Pool } = pg);
    hasDatabaseConfig = () => {
      return Boolean(
        cleanEnvUrl(process.env.DATABASE_URL) || process.env.SQL_HOST && process.env.SQL_DB_NAME && process.env.SQL_USER
      );
    };
    createPool = () => {
      const rawDbUrl = cleanEnvUrl(process.env.DATABASE_URL);
      if (rawDbUrl) {
        let dbUrl = rawDbUrl.replace(/@+db\./, "@db.").trim();
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

// src/middleware/auth.ts
import { createClient } from "@supabase/supabase-js";
async function resolveUserRoleAndMembership(uid, email) {
  let roleName = "vendor";
  let membershipName = "Basic";
  try {
    const { db: db3, hasDatabaseConfig: hasDatabaseConfig2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    if (hasDatabaseConfig2()) {
      const { userRoles: userRoles2, roles: roles2, userMemberships: userMemberships2, memberships: memberships2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eq5 } = await import("drizzle-orm");
      const roleRows = await db3.select().from(userRoles2).leftJoin(roles2, eq5(userRoles2.roleId, roles2.id)).where(eq5(userRoles2.userId, uid));
      if (roleRows[0]?.roles?.name) {
        roleName = roleRows[0].roles.name;
      }
      const memRows = await db3.select().from(userMemberships2).leftJoin(memberships2, eq5(userMemberships2.membershipId, memberships2.id)).where(eq5(userMemberships2.userId, uid));
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
var rawUrl, rawKey, isSupabaseConfigured, supabase, BOOTSTRAP_ADMINS, requireAuth, requireRoles;
var init_auth = __esm({
  "src/middleware/auth.ts"() {
    rawUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "").trim();
    rawKey = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "").trim();
    isSupabaseConfigured = (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) && rawKey.length > 20 && !rawKey.includes("placeholder");
    supabase = isSupabaseConfigured ? createClient(rawUrl, rawKey) : null;
    BOOTSTRAP_ADMINS = (process.env.ADMIN_EMAILS || "xpatagonia.com@gmail.com,admin@xpatagonia.com").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
    requireAuth = async (req, res, next) => {
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
    requireRoles = (allowedRoles) => {
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

// src/services/arnSchema.ts
async function ensureProductionTables() {
  if (arnTablesEnsured || !hasDatabaseConfig()) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.arn_rules (
        user_uid text PRIMARY KEY,
        mode text NOT NULL DEFAULT 'hybrid',
        auto_approve_max_usd integer NOT NULL DEFAULT 1500,
        min_confidence_score integer NOT NULL DEFAULT 82,
        auto_send_emails boolean NOT NULL DEFAULT false,
        auto_create_logistics boolean NOT NULL DEFAULT true,
        auto_reserve_inventory boolean NOT NULL DEFAULT true,
        updated_at timestamptz DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS public.arn_opportunities (
        id serial PRIMARY KEY,
        owner_uid text NOT NULL,
        company_name text NOT NULL,
        contact_name text,
        contact_email text,
        cuit text,
        category text DEFAULT 'General',
        corridor text,
        source text NOT NULL DEFAULT 'manual',
        stage text NOT NULL DEFAULT 'detected',
        ai_score integer NOT NULL DEFAULT 70,
        estimated_amount_usd integer NOT NULL DEFAULT 0,
        urgency text NOT NULL DEFAULT 'medium',
        summary text,
        recommended_action text,
        raw_context jsonb DEFAULT '{}'::jsonb,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS public.arn_actions_queue (
        id serial PRIMARY KEY,
        owner_uid text NOT NULL,
        opportunity_id integer,
        action_type text NOT NULL,
        title text NOT NULL,
        target_email text,
        draft_subject text,
        draft_body text,
        estimated_amount_usd integer NOT NULL DEFAULT 0,
        confidence_score integer NOT NULL DEFAULT 75,
        execution_mode text NOT NULL DEFAULT 'manual_approval',
        status text NOT NULL DEFAULT 'pending_approval',
        metadata jsonb DEFAULT '{}'::jsonb,
        executed_at timestamptz,
        created_at timestamptz DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS public.chat_messages (
        id serial PRIMARY KEY,
        channel_id text NOT NULL,
        sender_uid text NOT NULL,
        sender_name text NOT NULL,
        sender_company text,
        text text NOT NULL,
        msg_type text NOT NULL DEFAULT 'text',
        metadata jsonb DEFAULT '{}'::jsonb,
        created_at timestamptz DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS public.products (
        id serial PRIMARY KEY,
        user_uid text,
        sku text,
        name text NOT NULL,
        category text NOT NULL,
        subcategory text,
        brand text,
        model text,
        condition text,
        year text,
        usage_hours text,
        warranty text,
        price_base text,
        price_wholesale text,
        stock text,
        moq text,
        description text,
        certifications jsonb DEFAULT '[]'::jsonb,
        payment_methods jsonb DEFAULT '[]'::jsonb,
        shipping_conditions jsonb DEFAULT '[]'::jsonb,
        lead_time text,
        location text,
        supplier text,
        video_url text,
        tax_rate text,
        image text,
        status text DEFAULT 'active',
        company_id text,
        created_at timestamptz DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS public.inventory_items (
        id serial PRIMARY KEY,
        user_uid text,
        sku text,
        name text,
        category text,
        quantity integer DEFAULT 0,
        location text,
        status text,
        last_updated timestamptz DEFAULT now(),
        created_at timestamptz DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS public.logistics_loads (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        company_uid text NOT NULL,
        load_type text NOT NULL CHECK (load_type IN ('empty_return', 'cargo_tender')),
        origin_name text NOT NULL,
        origin_lat double precision,
        origin_lng double precision,
        destination_name text NOT NULL,
        destination_lat double precision,
        destination_lng double precision,
        corridor text,
        distance_km integer,
        weight_kg integer,
        truck_type text,
        discount_percent integer DEFAULT 35,
        target_price_ars bigint,
        status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'bidding', 'assigned', 'completed')),
        created_at timestamptz DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS public.organizations (
        id serial PRIMARY KEY,
        owner_uid text NOT NULL UNIQUE,
        name text NOT NULL,
        plan_slug text NOT NULL DEFAULT 'gratis',
        seat_limit integer NOT NULL DEFAULT 2,
        logistics_plan_active boolean NOT NULL DEFAULT false,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS public.org_members (
        id serial PRIMARY KEY,
        organization_id integer NOT NULL,
        user_uid text NOT NULL,
        email text NOT NULL,
        org_role text NOT NULL DEFAULT 'comercial',
        status text NOT NULL DEFAULT 'active',
        joined_at timestamptz DEFAULT now(),
        UNIQUE (organization_id, user_uid)
      );

      CREATE TABLE IF NOT EXISTS public.org_invitations (
        id serial PRIMARY KEY,
        organization_id integer NOT NULL,
        email text NOT NULL,
        org_role text NOT NULL DEFAULT 'comercial',
        invited_by_uid text NOT NULL,
        token text NOT NULL,
        status text NOT NULL DEFAULT 'pending',
        expires_at timestamptz,
        created_at timestamptz DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS public.contacts (
        id serial PRIMARY KEY,
        user_uid text,
        organization_id integer,
        entity_type text DEFAULT 'contact',
        name text NOT NULL,
        company text,
        role text,
        email text,
        phone text,
        type text,
        status text,
        website text,
        cuit_rut text,
        social_media text,
        industry text,
        location text,
        arn_opportunity_id integer,
        ai_score integer DEFAULT 0,
        lead_stage text DEFAULT 'nuevo',
        last_arn_sync_at timestamptz,
        odoo_synced boolean DEFAULT false,
        created_at timestamptz DEFAULT now()
      );

      ALTER TABLE IF EXISTS public.contacts
        ADD COLUMN IF NOT EXISTS organization_id integer,
        ADD COLUMN IF NOT EXISTS arn_opportunity_id integer,
        ADD COLUMN IF NOT EXISTS ai_score integer DEFAULT 0,
        ADD COLUMN IF NOT EXISTS lead_stage text DEFAULT 'nuevo',
        ADD COLUMN IF NOT EXISTS last_arn_sync_at timestamptz,
        ADD COLUMN IF NOT EXISTS odoo_synced boolean DEFAULT false;

      ALTER TABLE IF EXISTS public.arn_rules
        ADD COLUMN IF NOT EXISTS organization_id integer;

      ALTER TABLE IF EXISTS public.arn_opportunities
        ADD COLUMN IF NOT EXISTS organization_id integer,
        ADD COLUMN IF NOT EXISTS contact_id integer;

      ALTER TABLE IF EXISTS public.arn_actions_queue
        ADD COLUMN IF NOT EXISTS organization_id integer;

      ALTER TABLE IF EXISTS public.inventory_items
        ADD COLUMN IF NOT EXISTS organization_id integer;

      CREATE TABLE IF NOT EXISTS public.fleet_vehicles (
        id serial PRIMARY KEY,
        organization_id integer NOT NULL,
        owner_uid text NOT NULL,
        name text NOT NULL,
        plate text NOT NULL,
        vehicle_type text NOT NULL DEFAULT 'Semirremolque 28t',
        capacity_tons integer NOT NULL DEFAULT 28,
        corridor text DEFAULT 'RN 3 / Patag\xF3nica',
        vtv_expiry text,
        insurance_expiry text,
        status text NOT NULL DEFAULT 'disponible',
        gps_label text,
        created_at timestamptz DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS public.fleet_drivers (
        id serial PRIMARY KEY,
        organization_id integer NOT NULL,
        owner_uid text NOT NULL,
        full_name text NOT NULL,
        dni text,
        linti_license text,
        phone text,
        assigned_vehicle_id integer,
        status text NOT NULL DEFAULT 'disponible',
        created_at timestamptz DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS public.logistics_contracts (
        id serial PRIMARY KEY,
        load_id text NOT NULL,
        origin_name text NOT NULL,
        destination_name text NOT NULL,
        shipper_org_id integer,
        shipper_uid text,
        carrier_org_id integer NOT NULL,
        carrier_uid text NOT NULL,
        carrier_name text NOT NULL,
        vehicle_id integer,
        driver_id integer,
        agreed_price_ars integer NOT NULL DEFAULT 0,
        status text NOT NULL DEFAULT 'ofertado',
        tracking_code text,
        notes text,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS public.processed_email_uids (
        id serial PRIMARY KEY,
        mailbox text NOT NULL DEFAULT 'INBOX',
        email_uid text NOT NULL,
        sender_email text,
        subject text,
        organization_id integer,
        arn_opportunity_id integer,
        processed_at timestamptz DEFAULT now(),
        UNIQUE (mailbox, email_uid)
      );

      CREATE TABLE IF NOT EXISTS public.fleet_expiry_alerts (
        id serial PRIMARY KEY,
        vehicle_id integer NOT NULL,
        alert_type text NOT NULL,
        expiry_date text NOT NULL,
        notified_email text,
        sent_at timestamptz DEFAULT now(),
        UNIQUE (vehicle_id, alert_type, expiry_date)
      );

      CREATE TABLE IF NOT EXISTS public.automation_logs (
        id bigserial PRIMARY KEY,
        direction text NOT NULL,
        event text NOT NULL,
        status text NOT NULL DEFAULT 'processed',
        payload jsonb NOT NULL DEFAULT '{}'::jsonb,
        attempts integer NOT NULL DEFAULT 0,
        next_retry_at timestamptz,
        last_error text,
        updated_at timestamptz DEFAULT now(),
        created_at timestamptz DEFAULT now()
      );

      ALTER TABLE IF EXISTS public.automation_logs
        ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS next_retry_at timestamptz,
        ADD COLUMN IF NOT EXISTS last_error text,
        ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

      ALTER TABLE IF EXISTS public.company_profiles
        ADD COLUMN IF NOT EXISTS entity_type text DEFAULT 'empresa',
        ADD COLUMN IF NOT EXISTS credential_label text,
        ADD COLUMN IF NOT EXISTS service_modality text;
    `);
    arnTablesEnsured = true;
  } catch (err) {
    console.warn("[ARN_SCHEMA] Table bootstrap skipped or deferred:", err);
  }
}
var arnTablesEnsured;
var init_arnSchema = __esm({
  "src/services/arnSchema.ts"() {
    init_db();
    arnTablesEnsured = false;
  }
});

// src/services/arnAiService.ts
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
function evaluateHybridDecision(rule, actionType, estimatedAmountUsd, confidenceScore) {
  if (rule.mode === "manual") {
    return {
      shouldAutoExecute: false,
      executionMode: "manual_approval",
      reason: "Modo manual activo: todas las acciones requieren aprobaci\xF3n humana."
    };
  }
  const isEmailAction = actionType === "send_quote_email" || actionType === "send_followup_email" || actionType === "notify_providers";
  if (isEmailAction && !rule.autoSendEmails && rule.mode !== "auto") {
    return {
      shouldAutoExecute: false,
      executionMode: "manual_approval",
      reason: "Env\xEDo autom\xE1tico de correos desactivado en tu regla h\xEDbrida (requiere 1 clic de aprobaci\xF3n)."
    };
  }
  if (actionType === "create_logistics_load" && !rule.autoCreateLogistics) {
    return {
      shouldAutoExecute: false,
      executionMode: "manual_approval",
      reason: "Creaci\xF3n autom\xE1tica de cargas desactivada en tu pol\xEDtica ARN."
    };
  }
  if (actionType === "reserve_inventory" && !rule.autoReserveInventory) {
    return {
      shouldAutoExecute: false,
      executionMode: "manual_approval",
      reason: "Reserva autom\xE1tica de stock desactivada en tu pol\xEDtica ARN."
    };
  }
  if (confidenceScore < rule.minConfidenceScore) {
    return {
      shouldAutoExecute: false,
      executionMode: "manual_approval",
      reason: `Confianza IA (${confidenceScore}%) por debajo del m\xEDnimo configurado (${rule.minConfidenceScore}%).`
    };
  }
  if (estimatedAmountUsd > rule.autoApproveMaxUsd) {
    return {
      shouldAutoExecute: false,
      executionMode: "manual_approval",
      reason: `Monto estimado (USD ${estimatedAmountUsd}) supera el tope autom\xE1tico (USD ${rule.autoApproveMaxUsd}).`
    };
  }
  return {
    shouldAutoExecute: true,
    executionMode: "auto_approved",
    reason: `Aprobado autom\xE1ticamente por regla h\xEDbrida (USD ${estimatedAmountUsd} <= USD ${rule.autoApproveMaxUsd}, confianza ${confidenceScore}%).`
  };
}
function getGeminiClient() {
  const apiKey = (process.env.CUSTOM_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey || apiKey.length < 10 || apiKey.includes("MY_GEMINI_API_KEY")) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { "User-Agent": "aistudio-build" } }
  });
}
function buildDeterministicFallback(input) {
  const text2 = input.rawText || "";
  const lower = text2.toLowerCase();
  const urgent = /urgente|inmediato|paro|parada|critico|crítico|hoy/i.test(lower);
  const amountMatch = text2.match(/(?:usd|u\$s|us\$|\$)\s*([0-9][0-9.,]{1,9})/i);
  const parsedAmount = amountMatch ? Math.min(5e5, Math.max(250, Number(amountMatch[1].replace(/[.,]/g, "")) || 1200)) : 1200;
  const corridor = /añelo|vaca muerta|neuqu/i.test(lower) ? "RN 22 / A\xF1elo (Vaca Muerta)" : /comodoro|golfo|chubut/i.test(lower) ? "RN 3 / Golfo San Jorge" : /madryn|pesca|puerto/i.test(lower) ? "Puerto Madryn / Corredor Atl\xE1ntico" : "Corredor Patag\xF3nico RN 3 / RN 22";
  const company = input.companyName?.trim() || "Cliente B2B Detectado";
  const contactEmail = input.contactEmail?.trim() || "";
  const category = input.category?.trim() || "Servicios Industriales";
  return {
    companyName: company,
    contactName: input.contactName?.trim() || "Responsable de Compras",
    contactEmail,
    cuit: "",
    category,
    corridor,
    urgency: urgent ? "high" : "medium",
    estimatedAmountUsd: parsedAmount,
    aiScore: contactEmail ? urgent ? 88 : 79 : 65,
    summary: `Oportunidad detectada desde ${input.source}: ${text2.slice(0, 180)}`,
    recommendedAction: contactEmail ? "Enviar cotizaci\xF3n t\xE9cnica inicial y validar disponibilidad log\xEDstica." : "Calificar empresa y solicitar email de contacto comercial.",
    actionType: contactEmail ? "send_quote_email" : "send_followup_email",
    actionTitle: `Responder oportunidad comercial \u2014 ${company}`,
    draftSubject: `Propuesta T\xE9cnica & Cotizaci\xF3n xPatagonia \u2014 ${category}`,
    draftBody: `Estimados ${company},

Recibimos su requerimiento en ${category} (${corridor}). Contamos con capacidad operativa y disponibilidad para avanzar con la cotizaci\xF3n formal.${input.catalogSummary ? `

Referencia de cat\xE1logo disponible:
${input.catalogSummary}` : ""}

Quedamos atentos a confirmar plazos de entrega y especificaciones finales.

Saludos cordiales,
Equipo Comercial xPatagonia`
  };
}
async function analyzeOpportunityWithArn(input) {
  const ai = getGeminiClient();
  if (!ai) {
    return buildDeterministicFallback(input);
  }
  try {
    const prompt = `Analiza el siguiente evento comercial B2B en Patagonia (Argentina) y extrae una oportunidad estructurada para ARN IA.
Fuente: ${input.source}
Empresa informada: ${input.companyName || "No especificada"}
Contacto informado: ${input.contactName || "No especificado"}
Email informado: ${input.contactEmail || "No especificado"}
Categor\xEDa informada: ${input.category || "General"}
Cat\xE1logo propio disponible de nuestra empresa:
${input.catalogSummary || "Sin productos cargados a\xFAn"}

Contenido / Requerimiento:
"""
${input.rawText.slice(0, 3500)}
"""

Instrucciones:
- Calcula aiScore (0-100) seg\xFAn claridad t\xE9cnica, fit comercial y presencia de contacto real.
- Estima estimatedAmountUsd en USD enteros realistas (si no se menciona monto expl\xEDcito, estima seg\xFAn tipo de servicio B2B entre 500 y 25000).
- Redacta un draftSubject y draftBody profesional en espa\xF1ol rioplatense/corporativo listo para enviar al cliente usando nuestro cat\xE1logo si coincide.
- Define actionType entre: send_quote_email, send_followup_email, create_logistics_load, reserve_inventory, notify_providers.`;
    const response = await ai.models.generateContent({
      model: "gemini-4-hydrogen",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            companyName: { type: Type.STRING },
            contactName: { type: Type.STRING },
            contactEmail: { type: Type.STRING },
            cuit: { type: Type.STRING },
            category: { type: Type.STRING },
            corridor: { type: Type.STRING },
            urgency: { type: Type.STRING },
            estimatedAmountUsd: { type: Type.INTEGER },
            aiScore: { type: Type.INTEGER },
            summary: { type: Type.STRING },
            recommendedAction: { type: Type.STRING },
            actionType: { type: Type.STRING },
            actionTitle: { type: Type.STRING },
            draftSubject: { type: Type.STRING },
            draftBody: { type: Type.STRING }
          },
          required: [
            "companyName",
            "category",
            "corridor",
            "urgency",
            "estimatedAmountUsd",
            "aiScore",
            "summary",
            "recommendedAction",
            "actionType",
            "actionTitle",
            "draftSubject",
            "draftBody"
          ]
        }
      }
    });
    const parsed = JSON.parse((response.text || "{}").trim());
    const allowedUrgencies = ["low", "medium", "high", "critical"];
    const allowedActions = [
      "send_quote_email",
      "send_followup_email",
      "create_logistics_load",
      "reserve_inventory",
      "notify_providers"
    ];
    return {
      companyName: parsed.companyName || input.companyName || "Cliente B2B",
      contactName: parsed.contactName || input.contactName || "Compras",
      contactEmail: parsed.contactEmail || input.contactEmail || "",
      cuit: parsed.cuit || "",
      category: parsed.category || input.category || "General",
      corridor: parsed.corridor || "Corredor Patag\xF3nico RN 3 / RN 22",
      urgency: allowedUrgencies.includes(parsed.urgency) ? parsed.urgency : "medium",
      estimatedAmountUsd: Math.max(0, Number(parsed.estimatedAmountUsd) || 1200),
      aiScore: Math.min(100, Math.max(1, Number(parsed.aiScore) || 75)),
      summary: parsed.summary || input.rawText.slice(0, 180),
      recommendedAction: parsed.recommendedAction || "Enviar propuesta comercial",
      actionType: allowedActions.includes(parsed.actionType) ? parsed.actionType : "send_quote_email",
      actionTitle: parsed.actionTitle || `Acci\xF3n comercial \u2014 ${parsed.companyName || "Cliente"}`,
      draftSubject: parsed.draftSubject || "Cotizaci\xF3n B2B xPatagonia",
      draftBody: parsed.draftBody || "Estimados, adjuntamos nuestra propuesta comercial."
    };
  } catch (err) {
    console.warn("[ARN_AI] Fallback heuristic used due to Gemini warning:", err);
    return buildDeterministicFallback(input);
  }
}
async function generateAdnEmbedding(text2) {
  const ai = getGeminiClient();
  if (!ai || !text2.trim()) return null;
  try {
    const res = await ai.models.embedContent({
      model: "gemini-embedding-2",
      contents: text2.slice(0, 2e3),
      config: { outputDimensionality: 768 }
    });
    const values = res.embeddings?.[0]?.values;
    if (Array.isArray(values) && values.length === 768) {
      return values;
    }
    return null;
  } catch (err) {
    console.warn("[ARN_AI] Embedding warning:", err);
    return null;
  }
}
async function askArnCopilot(question, contextSnapshot) {
  const ai = getGeminiClient();
  if (!ai) {
    return `Resumen ARN (sin clave Gemini activa): Ten\xE9s ${contextSnapshot.opportunitiesCount} oportunidades activas, ${contextSnapshot.pendingActionsCount} acciones esperando aprobaci\xF3n y ${contextSnapshot.openRfqsCount} RFQs abiertas bajo modo ${contextSnapshot.policy.mode}.`;
  }
  try {
    const response = await ai.models.generateContent({
      model: "gemini-4-hydrogen",
      contents: `Consulta del operador B2B: "${question}"

Estado real de su operaci\xF3n en xPatagonia:
${JSON.stringify(contextSnapshot, null, 2)}`,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        systemInstruction: "Eres ARN IA, el director de operaciones y negocios aut\xF3nomo de xPatagonia B2B. Responde en espa\xF1ol, de forma ejecutiva, accionable y directa en 3 a 6 l\xEDneas basadas \xFAnicamente en los datos reales provistos."
      }
    });
    return (response.text || "").trim() || "No se pudo generar respuesta.";
  } catch (err) {
    return `No se pudo consultar al Copiloto ARN en este momento (${err?.message || "error temporal"}).`;
  }
}
var DEFAULT_ARN_POLICY;
var init_arnAiService = __esm({
  "src/services/arnAiService.ts"() {
    DEFAULT_ARN_POLICY = {
      mode: "hybrid",
      autoApproveMaxUsd: 1500,
      minConfidenceScore: 82,
      autoSendEmails: false,
      autoCreateLogistics: true,
      autoReserveInventory: true
    };
  }
});

// src/lib/apiConfig.ts
function sanitizeApiBaseUrl(rawUrl2) {
  const cleaned = (rawUrl2 || "").trim().replace(/\/+$/, "");
  if (!cleaned) return "";
  if (/onrender\.com/i.test(cleaned)) return "";
  if (typeof window !== "undefined" && window.location?.protocol === "https:" && /^http:\/\/(localhost|127\.0\.0\.1)/i.test(cleaned)) {
    return "";
  }
  return cleaned;
}
function readDefineApiUrl() {
  try {
    if (typeof __XPATAGONIA_API_URL__ !== "undefined" && __XPATAGONIA_API_URL__) {
      return __XPATAGONIA_API_URL__;
    }
  } catch {
  }
  try {
    return (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "").trim();
  } catch {
    return "";
  }
}
var getApiUrl;
var init_apiConfig = __esm({
  "src/lib/apiConfig.ts"() {
    getApiUrl = () => {
      return sanitizeApiBaseUrl(readDefineApiUrl());
    };
  }
});

// src/lib/supabase.ts
import { createClient as createClient2 } from "@supabase/supabase-js";
function readBuildSupabaseUrl() {
  try {
    if (typeof __XPATAGONIA_SUPABASE_URL__ !== "undefined" && __XPATAGONIA_SUPABASE_URL__) {
      return __XPATAGONIA_SUPABASE_URL__.trim();
    }
  } catch {
  }
  try {
    return (import.meta.env.VITE_SUPABASE_URL || "").trim();
  } catch {
    return "";
  }
}
function readBuildSupabaseAnonKey() {
  try {
    if (typeof __XPATAGONIA_SUPABASE_ANON_KEY__ !== "undefined" && __XPATAGONIA_SUPABASE_ANON_KEY__) {
      return __XPATAGONIA_SUPABASE_ANON_KEY__.trim();
    }
  } catch {
  }
  try {
    return (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();
  } catch {
    return "";
  }
}
function isValidSupabaseConfig(url, key) {
  try {
    if (url && (url.startsWith("http://") || url.startsWith("https://")) && key.length > 20 && !key.includes("placeholder")) {
      new URL(url);
      return true;
    }
  } catch {
  }
  return false;
}
function createResilientFallbackClient() {
  const emptyListResult = { data: [], error: null };
  const emptySingleResult = { data: null, error: null };
  const createQueryBuilder = (isSingle = false) => {
    const promise = Promise.resolve(isSingle ? emptySingleResult : emptyListResult);
    const builder = {
      select: () => builder,
      eq: () => builder,
      neq: () => builder,
      lt: () => builder,
      lte: () => builder,
      gt: () => builder,
      gte: () => builder,
      in: () => builder,
      contains: () => builder,
      order: () => builder,
      limit: () => builder,
      single: () => createQueryBuilder(true),
      maybeSingle: () => createQueryBuilder(true),
      then: (onfulfilled, onrejected) => promise.then(onfulfilled, onrejected),
      catch: (onrejected) => promise.catch(onrejected),
      finally: (onfinally) => promise.finally(onfinally)
    };
    return builder;
  };
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {
      } } } }),
      signInWithPassword: async () => ({
        data: { user: null, session: null },
        error: new Error("Supabase no configurado en este entorno")
      }),
      signUp: async () => ({
        data: { user: null, session: null },
        error: new Error("Supabase no configurado en este entorno")
      }),
      signOut: async () => ({ error: null }),
      resetPasswordForEmail: async () => ({
        data: null,
        error: new Error(
          "Supabase Auth no est\xE1 configurado en este entorno (faltan SUPABASE_URL/VITE_SUPABASE_URL y SUPABASE_ANON_KEY/VITE_SUPABASE_ANON_KEY)."
        )
      }),
      signInWithOtp: async () => ({
        data: null,
        error: new Error(
          "Supabase Auth no est\xE1 configurado en este entorno (faltan SUPABASE_URL/VITE_SUPABASE_URL y SUPABASE_ANON_KEY/VITE_SUPABASE_ANON_KEY)."
        )
      }),
      updateUser: async () => ({
        data: { user: null },
        error: new Error("Supabase Auth no est\xE1 configurado en este entorno.")
      }),
      setSession: async () => ({ data: { user: null, session: null }, error: null }),
      exchangeCodeForSession: async () => ({ data: { user: null, session: null }, error: null })
    },
    from: () => ({
      select: () => createQueryBuilder(false),
      insert: () => createQueryBuilder(true),
      update: () => createQueryBuilder(false),
      delete: () => createQueryBuilder(false),
      upsert: () => createQueryBuilder(false)
    })
  };
}
function buildClient(url, key) {
  if (!isValidSupabaseConfig(url, key)) return null;
  try {
    return createClient2(url, key, {
      auth: {
        persistSession: typeof window !== "undefined",
        autoRefreshToken: typeof window !== "undefined"
      }
    });
  } catch (err) {
    console.warn("[XPATAGONIA] Could not initialize standard Supabase client:", err);
    return null;
  }
}
async function ensureSupabaseConfigured() {
  if (isSupabaseConfigured2) return true;
  if (typeof window === "undefined") return false;
  if (runtimeBootstrapPromise) return runtimeBootstrapPromise;
  runtimeBootstrapPromise = (async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/public-config`, {
        cache: "no-store",
        signal: AbortSignal.timeout(4e3)
      });
      if (!res.ok) return false;
      const cfg = await res.json().catch(() => null);
      const runtimeUrl = String(cfg?.supabaseUrl || "").trim();
      const runtimeKey = String(cfg?.supabaseAnonKey || "").trim();
      const nextClient = buildClient(runtimeUrl, runtimeKey);
      if (nextClient) {
        activeClient = nextClient;
        isSupabaseConfigured2 = true;
        window.dispatchEvent(new CustomEvent(SUPABASE_READY_EVENT, { detail: true }));
        return true;
      }
    } catch {
    } finally {
      if (!isSupabaseConfigured2) {
        runtimeBootstrapPromise = null;
      }
    }
    return false;
  })();
  return runtimeBootstrapPromise;
}
var initialUrl, initialKey, isSupabaseConfigured2, activeClient, SUPABASE_READY_EVENT, runtimeBootstrapPromise, supabase2;
var init_supabase = __esm({
  "src/lib/supabase.ts"() {
    init_apiConfig();
    initialUrl = readBuildSupabaseUrl();
    initialKey = readBuildSupabaseAnonKey();
    isSupabaseConfigured2 = isValidSupabaseConfig(initialUrl, initialKey);
    activeClient = buildClient(initialUrl, initialKey) || createResilientFallbackClient();
    SUPABASE_READY_EVENT = "xpatagonia:supabase-ready";
    runtimeBootstrapPromise = null;
    if (typeof window !== "undefined" && !isSupabaseConfigured2) {
      void ensureSupabaseConfigured();
    }
    supabase2 = new Proxy({}, {
      get(_target, prop) {
        const value = activeClient[prop];
        return typeof value === "function" ? value.bind(activeClient) : value;
      }
    });
  }
});

// src/lib/db.ts
var init_db2 = __esm({
  "src/lib/db.ts"() {
    init_supabase();
  }
});

// src/lib/patagoniaRouting.ts
function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => deg * Math.PI / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
var init_patagoniaRouting = __esm({
  "src/lib/patagoniaRouting.ts"() {
    init_apiConfig();
  }
});

// src/lib/b2bDirectoryData.ts
function sortCompaniesBySubscriptionTier(items) {
  return [...items].sort((a, b) => {
    const prioA = a.tierPriority ?? 3;
    const prioB = b.tierPriority ?? 3;
    if (prioA !== prioB) return prioA - prioB;
    if (Boolean(a.verified) !== Boolean(b.verified)) {
      return a.verified ? -1 : 1;
    }
    return (a.name || "").localeCompare(b.name || "");
  });
}
var B2B_COMPANIES;
var init_b2bDirectoryData = __esm({
  "src/lib/b2bDirectoryData.ts"() {
    init_db2();
    init_apiConfig();
    init_patagoniaRouting();
    B2B_COMPANIES = [
      {
        id: "comp-petrosur",
        entityType: "empresa",
        name: "PetroSur Ingenier\xEDa & Fluidos S.A.",
        cuit: "30-71489210-9",
        tier: "corporativo",
        tierPriority: 1,
        tierLabel: "Plan Corporativo",
        verified: true,
        category: "Hidrocarburos (Oil & Gas)",
        subcategories: ["V\xE1lvulas API 6D", "Montaje de Ductos", "Telemetr\xEDa de Pozos"],
        province: "Neuqu\xE9n",
        city: "A\xF1elo / Neuqu\xE9n Capital",
        employeeCount: "201-500",
        publicSummary: "Ingenier\xEDa de superficie, provisi\xF3n de v\xE1lvulas de alta presi\xF3n y mantenimiento integral para yacimientos en Cuenca Neuquina y Golfo San Jorge.",
        contactName: "Ing. Carlos Mendoza",
        contactRole: "Director Comercial & Licitaciones",
        email: "cmendoza@petrosur-b2b.com.ar",
        phone: "+54 9 299 482-9100",
        whatsapp: "+5492994829100",
        website: "https://petrosur-b2b.com.ar",
        certifications: ["ISO 9001", "ISO 14001", "API Spec Q1"],
        paymentTerms: "Cuenta Corriente 30/60 d\xEDas \u2022 Factura A / MiPyME",
        creditRating: "AAA+ (Riesgo Corporativo Auditado)",
        adnComercial: {
          ofrece: ["V\xE1lvulas API 6D", "Montaje de Ductos", "Telemetr\xEDa"],
          demanda: ["Mecanizado CNC", "Bridas Forjadas", "Flete Pesado desde Rosario"],
          corredorLogistico: "RN 22 / A\xF1elo (Vaca Muerta)",
          ciudadBase: "A\xF1elo (Hub Vaca Muerta)",
          lat: -38.3522,
          lng: -68.7897
        }
      },
      {
        id: "comp-logistica-austral",
        entityType: "empresa",
        name: "Log\xEDstica Austral Multimodal S.R.L.",
        cuit: "30-68923415-4",
        tier: "corporativo",
        tierPriority: 1,
        tierLabel: "Plan Corporativo",
        verified: true,
        category: "Log\xEDstica",
        subcategories: ["Cargas Especiales", "Cadena de Fr\xEDo -25\xB0C", "Dep\xF3sito Fiscal"],
        province: "Chubut",
        city: "Comodoro Rivadavia / Puerto Madryn",
        employeeCount: "51-200",
        publicSummary: "Operador log\xEDstico patag\xF3nico con flota propia de carretones, transporte refrigerado para exportaci\xF3n pesquera y bases operativas en Ruta 3 y Ruta 40.",
        contactName: "Lic. Valeria Albornoz",
        contactRole: "Gerente de Operaciones B2B",
        email: "valbornoz@logisticaaustral.com.ar",
        phone: "+54 9 297 431-8820",
        whatsapp: "+5492974318820",
        website: "https://logisticaaustral.com.ar",
        certifications: ["ISO 9001", "SENASA Hab. Fr\xEDo", "Cargas Peligrosas IMO"],
        paymentTerms: "Transferencia / Echeq 30 d\xEDas \u2022 Convenio Flota",
        creditRating: "AA+ (Cumplimiento Verificado)",
        adnComercial: {
          ofrece: ["Flete LTL Consolidado", "Retorno Vac\xEDo RN 3", "Cadena de Fr\xEDo -25\xB0C"],
          demanda: ["Cargas Norte \u2192 Sur", "Insumos de Flota", "Paletizado Isot\xE9rmico"],
          corredorLogistico: "Ruta Nacional 3 (Buenos Aires \u2194 Ushuaia)",
          ciudadBase: "Comodoro Rivadavia (Golfo San Jorge)",
          lat: -45.8641,
          lng: -67.4966
        }
      },
      {
        id: "comp-eolica-sur",
        entityType: "empresa",
        name: "RenovaPatagonia Electromec\xE1nica S.A.",
        cuit: "30-71550932-1",
        tier: "corporativo",
        tierPriority: 1,
        tierLabel: "Plan Corporativo",
        verified: true,
        category: "Energ\xEDas Renovables",
        subcategories: ["Subestaciones", "Mantenimiento Aerogeneradores", "Paneles Industriales"],
        province: "Santa Cruz",
        city: "R\xEDo Gallegos / Pico Truncado",
        employeeCount: "51-200",
        publicSummary: "Montaje electromec\xE1nico de parques e\xF3licos, tendido de l\xEDneas de media y alta tensi\xF3n e integraci\xF3n de sistemas h\xEDbridos industriales.",
        contactName: "Ing. Mart\xEDn Echeverr\xEDa",
        contactRole: "Jefe de Desarrollo de Negocios",
        email: "mecheverria@renovapatagonia.com.ar",
        phone: "+54 9 2966 55-1490",
        whatsapp: "+5492966551490",
        website: "https://renovapatagonia.com.ar",
        certifications: ["ISO 45001", "IRAM", "CAMMESA Homologado"],
        paymentTerms: "Certificaci\xF3n por Avance de Obra \u2022 15/45 d\xEDas",
        creditRating: "AAA (Proveedor Homologado)",
        adnComercial: {
          ofrece: ["Subestaciones MT/AT", "Tableros SCADA", "Montaje E\xF3lico"],
          demanda: ["Transformadores desde C\xF3rdoba", "Carretones Especiales", "EPP Altura"],
          corredorLogistico: "RN 3 / Pico Truncado - R\xEDo Gallegos",
          ciudadBase: "R\xEDo Gallegos",
          lat: -51.6226,
          lng: -69.2181
        }
      },
      {
        id: "comp-rosario-forja",
        entityType: "empresa",
        name: "Forja & V\xE1lvulas del Paran\xE1 S.A. (Proveedor Extra-Regional)",
        cuit: "30-70841299-8",
        tier: "corporativo",
        tierPriority: 1,
        tierLabel: "Plan Corporativo",
        verified: true,
        category: "Metal\xFArgica",
        subcategories: ["Bridas Forjadas ANSI", "Mecanizado CNC Pesado", "V\xE1lvulas de Proceso"],
        province: "Santa Fe (Env\xEDo Patagonia)",
        city: "Rosario, Santa Fe \u2192 Corredor Sur",
        employeeCount: "51-200",
        publicSummary: "Fabricante santafesino de bridas forjadas, cuerpos de v\xE1lvulas API y repuestos mecanizados CNC con despacho consolidado LTL hacia Cuenca Neuquina y Golfo San Jorge.",
        contactName: "Ing. Federico Brizuela",
        contactRole: "Gerente de Cuentas Patag\xF3nicas",
        email: "fbrizuela@forjaparana.com.ar",
        phone: "+54 9 341 590-4410",
        whatsapp: "+5493415904410",
        website: "https://forjaparana.com.ar",
        certifications: ["ISO 9001", "API 6A / 6D", "ASME VIII"],
        paymentTerms: "Cuenta Corriente 45 d\xEDas \u2022 Flete Consolidado LTL",
        creditRating: "AA+ (Exportador / Proveedor Industrial)",
        adnComercial: {
          ofrece: ["Bridas Forjadas", "Mecanizado CNC", "Cuerpos API 6D"],
          demanda: ["Flete Consolidado Rosario \u2192 A\xF1elo", "Dep\xF3sito Cross-Docking Neuqu\xE9n"],
          corredorLogistico: "Rosario \u2192 RN 152 \u2192 Neuqu\xE9n / A\xF1elo",
          ciudadBase: "Rosario (Polo Industrial)",
          lat: -32.9442,
          lng: -60.6505,
          isExtraRegional: true
        }
      },
      {
        id: "comp-metalurgica-andina",
        entityType: "empresa",
        name: "Metal\xFArgica Golfo San Jorge S.A.",
        cuit: "30-70112984-7",
        tier: "pro",
        tierPriority: 2,
        tierLabel: "Plan Pro Industrial",
        verified: true,
        category: "Metal\xFArgica",
        subcategories: ["Mecanizado CNC", "Estructuras Met\xE1licas", "Tanques API"],
        province: "Chubut",
        city: "Parque Industrial Comodoro Rivadavia",
        employeeCount: "11-50",
        publicSummary: "Fabricaci\xF3n de estructuras met\xE1licas pesadas, skids de bombeo, recipientes sometidos a presi\xF3n y torner\xEDa CNC de precisi\xF3n.",
        contactName: "T\xE9c. Roberto Mansilla",
        contactRole: "Responsable de Presupuestos",
        email: "cotizaciones@metalgolfo.com.ar",
        phone: "+54 9 297 492-3310",
        whatsapp: "+5492974923310",
        website: "https://metalgolfo.com.ar",
        certifications: ["ISO 9001", "Soldadura Calificada ASME IX"],
        paymentTerms: "50% Anticipo / 50% Contra Entrega (Echeq 30 d\xEDas)",
        creditRating: "AA (Verificado en Red)",
        adnComercial: {
          ofrece: ["Mecanizado CNC", "Skids de Bombeo", "Tanques API"],
          demanda: ["Chapa Naval / Acero F24", "Electrodos Especiales", "Flete LTL"],
          corredorLogistico: "RN 3 / Cuenca Golfo San Jorge",
          ciudadBase: "Comodoro Rivadavia (Golfo San Jorge)",
          lat: -45.8641,
          lng: -67.4966
        }
      },
      {
        id: "comp-cordoba-electromec",
        entityType: "empresa",
        name: "Potencia & Transformadores C\xF3rdoba S.A. (Proveedor Extra-Regional)",
        cuit: "30-69441822-3",
        tier: "pro",
        tierPriority: 2,
        tierLabel: "Plan Pro Industrial",
        verified: true,
        category: "Equipamiento Industrial",
        subcategories: ["Transformadores MT", "Celdas de Media Tensi\xF3n", "Grupos Electr\xF3genos"],
        province: "C\xF3rdoba (Env\xEDo Patagonia)",
        city: "C\xF3rdoba Capital \u2192 Corredor Patag\xF3nico",
        employeeCount: "51-200",
        publicSummary: "Ingenier\xEDa el\xE9ctrica industrial desde C\xF3rdoba para parques e\xF3licos, yacimientos y plantas pesqueras en Patagonia con despacho por carga consolidada.",
        contactName: "Ing. Marcos Villagra",
        contactRole: "Director Comercial Regional",
        email: "mvillagra@potenciacba.com.ar",
        phone: "+54 9 351 478-9200",
        whatsapp: "+5493514789200",
        website: "https://potenciacba.com.ar",
        certifications: ["ISO 9001", "IRAM 2250"],
        paymentTerms: "Anticipo 30% + Echeq 30/60 d\xEDas",
        creditRating: "AA (Verificado en Red)",
        adnComercial: {
          ofrece: ["Transformadores MT", "Grupos Electr\xF3genos", "Celdas El\xE9ctricas"],
          demanda: ["Carret\xF3n C\xF3rdoba \u2192 Santa Cruz", "Flete Retorno Vac\xEDo RN 40/RN 3"],
          corredorLogistico: "C\xF3rdoba \u2192 RN 158 / RN 35 \u2192 Patagonia",
          ciudadBase: "C\xF3rdoba Capital (Parque Industrial)",
          lat: -31.4201,
          lng: -64.1888,
          isExtraRegional: true
        }
      },
      {
        id: "comp-austral-naval",
        entityType: "empresa",
        name: "Servicios Navales & Pesqueros Australes S.R.L.",
        cuit: "30-71204918-3",
        tier: "pro",
        tierPriority: 2,
        tierLabel: "Plan Pro Industrial",
        verified: true,
        category: "Industria Pesquera",
        subcategories: ["Refrigeraci\xF3n Naval", "Insumos de Planta", "Envases Exportaci\xF3n"],
        province: "Tierra del Fuego",
        city: "Ushuaia / R\xEDo Grande",
        employeeCount: "11-50",
        publicSummary: "Provisi\xF3n de equipamiento frigor\xEDfico para buques factor\xEDa, repuestos navales y packaging isot\xE9rmico para plantas procesadoras.",
        contactName: "Hern\xE1n Giordano",
        contactRole: "Socio Gerente Comercial",
        email: "hgiordano@navalesaustrales.com.ar",
        phone: "+54 9 2901 61-2040",
        whatsapp: "+5492901612040",
        website: "https://navalesaustrales.com.ar",
        certifications: ["Prefectura Naval Reg.", "SENASA"],
        paymentTerms: "Cuenta Corriente 30 d\xEDas \u2022 USD Oficial",
        creditRating: "AA (Verificado en Red)",
        adnComercial: {
          ofrece: ["Refrigeraci\xF3n Industrial", "Packaging Isot\xE9rmico", "Repuestos Navales"],
          demanda: ["Cadena de Fr\xEDo -25\xB0C hacia Buenos Aires", "Gases Refrigerantes"],
          corredorLogistico: "RN 3 / Canal Beagle \u2192 Puerto Madryn / CABA",
          ciudadBase: "Ushuaia (Puerto Austral)",
          lat: -54.8019,
          lng: -68.303
        }
      },
      {
        id: "comp-constructora-valle",
        entityType: "empresa",
        name: "Obras Civiles & Movimiento de Suelos Alto Valle S.A.",
        cuit: "30-69884120-2",
        tier: "pro",
        tierPriority: 2,
        tierLabel: "Plan Pro Industrial",
        verified: true,
        category: "Construcci\xF3n",
        subcategories: ["Locaciones Petroleras", "Hormig\xF3n Elaborado", "Naves Industriales"],
        province: "R\xEDo Negro",
        city: "Cipolletti / General Roca",
        employeeCount: "51-200",
        publicSummary: "Construcci\xF3n de plateas industriales, apertura de trazas, movimiento de suelos con flota Caterpillar y montaje de galpones llave en mano.",
        contactName: "Arq. Luc\xEDa Ferreyra",
        contactRole: "Gerencia T\xE9cnica & Licitaciones",
        email: "lferreyra@obrasaltovalle.com.ar",
        phone: "+54 9 299 512-7740",
        whatsapp: "+5492995127740",
        website: "https://obrasaltovalle.com.ar",
        certifications: ["Registro Nacional de Constructores", "ISO 9001"],
        paymentTerms: "Certificaci\xF3n Quincenal / Mensual",
        creditRating: "AA (Verificado en Red)",
        adnComercial: {
          ofrece: ["Locaciones Petroleras", "Naves Industriales", "Hormig\xF3n Elaborado"],
          demanda: ["Estructuras Met\xE1licas", "Indumentaria Ign\xEDfuga", "Alquiler de Maquinaria"],
          corredorLogistico: "RN 22 / Alto Valle \u2192 Vaca Muerta",
          ciudadBase: "Cipolletti / General Roca (Alto Valle)",
          lat: -38.9339,
          lng: -67.9903
        }
      },
      {
        id: "comp-seguridad-epp",
        entityType: "empresa",
        name: "Seguridad Industrial Sur & EPP S.R.L.",
        cuit: "30-71609211-5",
        tier: "inicial",
        tierPriority: 3,
        tierLabel: "Plan Inicial",
        verified: false,
        category: "Seguridad e Higiene (EPP)",
        subcategories: ["Indumentaria Ign\xEDfuga", "Detectores de Gases", "Calzado Dielectrico"],
        province: "Neuqu\xE9n",
        city: "Neuqu\xE9n Capital",
        employeeCount: "1-10",
        publicSummary: "Distribuci\xF3n mayorista de indumentaria ign\xEDfuga certificada, protecci\xF3n respiratoria y elementos de seguridad en altura.",
        contactName: "Diego Quiroga",
        contactRole: "Ventas Corporativas",
        email: "ventas@eppsur.com.ar",
        phone: "+54 9 299 419-0023",
        whatsapp: "+5492994190023",
        website: "https://eppsur.com.ar",
        certifications: ["Sello IRAM"],
        paymentTerms: "Contado / Transferencia / Echeq 15 d\xEDas",
        creditRating: "A (Inicial)",
        adnComercial: {
          ofrece: ["Indumentaria Ign\xEDfuga", "EPP Altura", "Detectores de Gases"],
          demanda: ["Log\xEDstica \xDAltima Milla Vaca Muerta", "Stock T\xE9rmico"],
          corredorLogistico: "RN 22 / Neuqu\xE9n - A\xF1elo",
          ciudadBase: "Neuqu\xE9n Capital (Parque Industrial)",
          lat: -38.9516,
          lng: -68.0591
        }
      },
      {
        id: "comp-agro-patagonia",
        entityType: "empresa",
        name: "AgroTecnolog\xEDa Valle Inferior S.A.",
        cuit: "30-70991823-6",
        tier: "inicial",
        tierPriority: 3,
        tierLabel: "Plan Inicial",
        verified: false,
        category: "Agroindustria",
        subcategories: ["Riego Automatizado", "Insumos Ganaderos", "Telemetr\xEDa Rural"],
        province: "R\xEDo Negro",
        city: "Viedma",
        employeeCount: "11-50",
        publicSummary: "Sistemas de riego por pivote central, bombas solares sumergibles e insumos para establecimientos ovinos y bovinos.",
        contactName: "Ing. Agr. Sof\xEDa Peralta",
        contactRole: "Asesora T\xE9cnica Comercial",
        email: "speralta@agrovalle.com.ar",
        phone: "+54 9 2920 44-8910",
        whatsapp: "+5492920448910",
        website: "https://agrovalle.com.ar",
        certifications: ["INTI"],
        paymentTerms: "Canje Cereal / Tarjetas Agro / 30 d\xEDas",
        creditRating: "A (Inicial)",
        adnComercial: {
          ofrece: ["Bombas Solares", "Riego Automatizado", "Telemetr\xEDa Rural"],
          demanda: ["Retorno Vac\xEDo Viedma \u2192 Buenos Aires", "Tableros Solares"],
          corredorLogistico: "RN 3 / Viedma - Bah\xEDa Blanca",
          ciudadBase: "Viedma (Valle Inferior)",
          lat: -40.8135,
          lng: -62.9967
        }
      },
      {
        id: "emp-sensores-vaca-muerta",
        entityType: "emprendimiento",
        name: "Patagonia IoT & Telemetr\xEDa de Campo (Emprendimiento)",
        cuit: "30-71834012-4",
        tier: "pro",
        tierPriority: 2,
        tierLabel: "Plan Pro Industrial",
        verified: true,
        category: "Tecnolog\xEDa e Innovaci\xF3n",
        subcategories: ["Sensores LoRaWAN", "Monitoreo de Tanques", "Telemetr\xEDa Solar"],
        province: "Neuqu\xE9n",
        city: "Neuqu\xE9n Capital",
        employeeCount: "1-10",
        credentialLabel: "Incubado Polo Tecnol\xF3gico Neuqu\xE9n \xB7 Estadio Escalado",
        serviceModality: "Despliegue r\xE1pido en yacimientos y plantas",
        publicSummary: "Emprendimiento de base tecnol\xF3gica dedicado a sensores aut\xF3nomos con panel solar para medici\xF3n de nivel, presi\xF3n y temperatura en bater\xEDas y cisternas remotas.",
        contactName: "Ing. Tom\xE1s Ben\xEDtez",
        contactRole: "Co-fundador & Arquitectura IoT",
        email: "tbenitez@patagoniaiot.com.ar",
        phone: "+54 9 299 583-1190",
        whatsapp: "+5492995831190",
        website: "https://patagoniaiot.com.ar",
        certifications: ["ENACOM Homologado", "IP67 ATEX Zona 2"],
        paymentTerms: "Suscripci\xF3n Hardware-as-a-Service o Compra Directa",
        creditRating: "AA (Emprendimiento Validado)",
        adnComercial: {
          ofrece: ["Sensores LoRaWAN", "Telemetr\xEDa de Tanques", "Alertas en Campo"],
          demanda: ["Gabinetes Estancos", "Bater\xEDas LiFePO4", "Montaje El\xE9ctrico"],
          corredorLogistico: "RN 22 / Neuqu\xE9n - A\xF1elo",
          ciudadBase: "Neuqu\xE9n Capital",
          lat: -38.9516,
          lng: -68.0591
        }
      },
      {
        id: "emp-ecored-marina",
        entityType: "emprendimiento",
        name: "EcoRed Austral \xB7 Econom\xEDa Circular Pesquera",
        cuit: "30-71802914-9",
        tier: "inicial",
        tierPriority: 3,
        tierLabel: "Plan Inicial",
        verified: true,
        category: "Medio Ambiente y Sustentabilidad",
        subcategories: ["Reciclaje de Redes", "Pallets Pl\xE1sticos", "Trazabilidad Triple Impacto"],
        province: "Chubut",
        city: "Puerto Madryn",
        employeeCount: "1-10",
        credentialLabel: "Certificaci\xF3n Triple Impacto \xB7 Planta Piloto Madryn",
        serviceModality: "Retiro programado en puertos patag\xF3nicos",
        publicSummary: "Emprendimiento industrial que recupera cajones, cabos y redes pesqueras en desuso para fabricar pellets y pallets pl\xE1sticos industriales resistentes al fr\xEDo extremo.",
        contactName: "Lic. Camila Herrera",
        contactRole: "Directora Productiva",
        email: "cherrera@ecoredaustral.com.ar",
        phone: "+54 9 280 462-8830",
        whatsapp: "+5492804628830",
        website: "https://ecoredaustral.com.ar",
        certifications: ["Registro Ambiental Chubut", "Triple Impacto"],
        paymentTerms: "Canje por Gesti\xF3n de Residuo / Cuenta 15 d\xEDas",
        creditRating: "A+ (Verificado)",
        adnComercial: {
          ofrece: ["Pallets Pl\xE1sticos Fr\xEDo", "Certificados de Valorizaci\xF3n", "Recolecci\xF3n Portuaria"],
          demanda: ["Transporte Retorno Puerto Madryn \u2192 Rawson", "Molienda Industrial"],
          corredorLogistico: "RN 3 / Puerto Madryn - Rawson",
          ciudadBase: "Puerto Madryn",
          lat: -42.7692,
          lng: -65.0385
        }
      },
      {
        id: "prof-eia-bariloche",
        entityType: "profesional",
        name: "Ing. Amb. Mariana Ledesma \xB7 Consultora Ambiental",
        cuit: "27-31445908-3",
        tier: "corporativo",
        tierPriority: 1,
        tierLabel: "Plan Corporativo",
        verified: true,
        category: "Medio Ambiente y Sustentabilidad",
        subcategories: ["Estudios EIA", "Auditor\xEDa ISO 14001", "Gesti\xF3n de Efluentes"],
        province: "R\xEDo Negro",
        city: "San Carlos de Bariloche / Alto Valle",
        employeeCount: "Profesional Matriculado",
        credentialLabel: "Matr\xEDcula Profesional RN-4418 \xB7 Perito Ambiental",
        serviceModality: "Auditor\xEDa en campo y direcci\xF3n t\xE9cnica remota",
        publicSummary: "Ingeniera ambiental matriculada con 14 a\xF1os en evaluaci\xF3n de impacto ambiental, habilitaciones provinciales para locaciones hidrocarbur\xEDferas y planes de cierre.",
        contactName: "Ing. Mariana Ledesma",
        contactRole: "Titular & Auditora L\xEDder ISO 14001",
        email: "mledesma@consultora-andes.com.ar",
        phone: "+54 9 294 455-7120",
        whatsapp: "+5492944557120",
        website: "https://consultora-andes.com.ar",
        certifications: ["Registro Provincial EIA", "Auditora IRAM ISO 14001"],
        paymentTerms: "Honorarios por Etapa / Factura A",
        creditRating: "AAA (Matr\xEDcula Verificada)",
        adnComercial: {
          ofrece: ["Estudios de Impacto Ambiental", "Auditor\xEDa ISO 14001", "Habilitaciones"],
          demanda: ["Muestreo de Suelos Certificado", "Laboratorios Qu\xEDmicos", "Drones LiDAR"],
          corredorLogistico: "RN 40 / Bariloche - Neuqu\xE9n",
          ciudadBase: "San Carlos de Bariloche",
          lat: -41.1335,
          lng: -71.3103
        }
      },
      {
        id: "prof-aduanero-ushuaia",
        entityType: "profesional",
        name: "Lic. Esteban M\xE1rquez \xB7 Despachante de Aduana & Comex",
        cuit: "20-28903411-7",
        tier: "pro",
        tierPriority: 2,
        tierLabel: "Plan Pro Industrial",
        verified: true,
        category: "Servicios Profesionales",
        subcategories: ["Despacho Aduanero", "Subr\xE9gimen Tierra del Fuego", "Importaci\xF3n Temporal"],
        province: "Tierra del Fuego",
        city: "R\xEDo Grande / Ushuaia",
        employeeCount: "Profesional Matriculado",
        credentialLabel: "Matr\xEDcula ARCA/Aduana TDF-892 \xB7 Comex Austral",
        serviceModality: "Gesti\xF3n aduanera en puertos y pasos fronterizos",
        publicSummary: "Especialista en nacionalizaci\xF3n de maquinaria pesada, importaci\xF3n temporal de equipos para yacimientos y operatoria aduanera Ley 19.640 en Tierra del Fuego.",
        contactName: "Lic. Esteban M\xE1rquez",
        contactRole: "Despachante Matriculado",
        email: "emarquez@comexaustral.com.ar",
        phone: "+54 9 2964 41-8890",
        whatsapp: "+5492964418890",
        website: "https://comexaustral.com.ar",
        certifications: ["Registro Despachantes ARCA", "OEA Asesor"],
        paymentTerms: "Honorarios Mensuales o por Despacho",
        creditRating: "AA+ (Matr\xEDcula Verificada)",
        adnComercial: {
          ofrece: ["Importaci\xF3n Maquinaria", "Tr\xE1nsito Aduanero RN 3", "Subr\xE9gimen Industrial"],
          demanda: ["Transporte Carretero Internacional", "Dep\xF3sito Fiscal", "Seguros Cauci\xF3n"],
          corredorLogistico: "RN 3 / San Sebasti\xE1n - R\xEDo Grande - Ushuaia",
          ciudadBase: "R\xEDo Grande",
          lat: -53.7877,
          lng: -67.7095
        }
      },
      {
        id: "serv-ndt-golfo",
        entityType: "servicio",
        name: "Austral NDT \xB7 Ensayos No Destructivos & Calibraci\xF3n",
        cuit: "30-71330845-2",
        tier: "corporativo",
        tierPriority: 1,
        tierLabel: "Plan Corporativo",
        verified: true,
        category: "Servicios",
        subcategories: ["Ultrasonido Phased Array", "Gammagraf\xEDa Industrial", "Calibraci\xF3n V\xE1lvulas"],
        province: "Chubut",
        city: "Comodoro Rivadavia / Las Heras",
        employeeCount: "11-50",
        credentialLabel: "Laboratorio M\xF3vil ISO/IEC 17025 \xB7 Nivel III ASNT",
        serviceModality: "Unidades m\xF3viles 24/7 en boca de pozo y planta",
        publicSummary: "Servicio t\xE9cnico especializado en inspecci\xF3n de soldaduras en ductos, ultrasonido Phased Array, part\xEDculas magnetizables y calibraci\xF3n trazable de v\xE1lvulas de seguridad.",
        contactName: "Ing. Claudio Salgado",
        contactRole: "Gerente T\xE9cnico de Campo",
        email: "csalgado@australndt.com.ar",
        phone: "+54 9 297 444-6210",
        whatsapp: "+5492974446210",
        website: "https://australndt.com.ar",
        certifications: ["ARN Radioprotecci\xF3n", "ASNT Nivel III", "ISO 9001"],
        paymentTerms: "Certificaci\xF3n por Jornada / Contrato Marco 30 d\xEDas",
        creditRating: "AAA (Homologado Operadoras)",
        adnComercial: {
          ofrece: ["Ultrasonido Ductos", "Gammagraf\xEDa", "Calibraci\xF3n PSV In Situ"],
          demanda: ["Camionetas 4x4 Equipadas", "EPP Ign\xEDfugo", "Gases de Calibraci\xF3n"],
          corredorLogistico: "RN 3 / Comodoro Rivadavia - Pico Truncado - Las Heras",
          ciudadBase: "Comodoro Rivadavia (Golfo San Jorge)",
          lat: -45.8641,
          lng: -67.4966
        }
      },
      {
        id: "serv-izajes-neuquen",
        entityType: "servicio",
        name: "Gr\xFAas & Izajes T\xE9cnicos Vaca Muerta S.R.L.",
        cuit: "30-71510922-8",
        tier: "pro",
        tierPriority: 2,
        tierLabel: "Plan Pro Industrial",
        verified: true,
        category: "Log\xEDstica",
        subcategories: ["Gr\xFAas Hidr\xE1ulicas 120tn", "Montaje Industrial", "Transporte Sobredimensionado"],
        province: "Neuqu\xE9n",
        city: "A\xF1elo / Plottier",
        employeeCount: "11-50",
        credentialLabel: "Habilitaci\xF3n Vialidad Nacional + Certificaci\xF3n Gr\xFAas IRAM",
        serviceModality: "Cobertura en locaci\xF3n con operador certificado",
        publicSummary: "Servicio de izajes cr\xEDticos hasta 120 toneladas, movimiento de tanques, generadores y bombas de fractura con planes de izaje certificados.",
        contactName: "Facundo Quiroga",
        contactRole: "Coordinador de Despacho",
        email: "operaciones@izajesvacamuerta.com.ar",
        phone: "+54 9 299 470-3321",
        whatsapp: "+5492994703321",
        website: "https://izajesvacamuerta.com.ar",
        certifications: ["IRAM 3921 Operadores", "ART Yacimientos", "VTV/RTO Al D\xEDa"],
        paymentTerms: "Por Hora Operativa / Abono Mensual",
        creditRating: "AA (Flota Auditada)",
        adnComercial: {
          ofrece: ["Gr\xFAas hasta 120tn", "Planes de Izaje", "Carretones Cama Baja"],
          demanda: ["Eslingas y Grilletes Certificados", "Mantenimiento Hidr\xE1ulico", "Permisos Viales"],
          corredorLogistico: "RN 7 / Plottier - Centenario - A\xF1elo",
          ciudadBase: "A\xF1elo (Hub Vaca Muerta)",
          lat: -38.3522,
          lng: -68.7897
        }
      }
    ];
  }
});

// src/services/saasPlans.ts
function resolvePlanConfig(input) {
  const normalized = String(input || "gratis").trim().toLowerCase();
  if (normalized === "corporativo" || normalized === "enterprise" || normalized.includes("corporativo")) {
    return SAAS_PLANS.corporativo;
  }
  if (normalized === "pro" || normalized === "premium" || normalized.includes("pro")) {
    return SAAS_PLANS.pro;
  }
  return SAAS_PLANS.gratis;
}
function canAddOrganizationSeat(currentUsedSeats, seatLimit) {
  const used = Math.max(0, Number(currentUsedSeats) || 0);
  const limit = Math.max(1, Number(seatLimit) || 2);
  const remaining = Math.max(0, limit - used);
  if (used >= limit) {
    return {
      allowed: false,
      remaining: 0,
      reason: `Alcanzaste el l\xEDmite de ${limit} usuarios de tu plan actual. Actualiz\xE1 tu plan o liber\xE1 un asiento para invitar a otro miembro.`
    };
  }
  return { allowed: true, remaining };
}
function canAccessLogisticsSuite(params) {
  if (params.logisticsPlanActive) return true;
  const membership = String(params.membershipName || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (membership.includes("logist")) return true;
  if (params.roleName === "system_admin") return true;
  return false;
}
var SAAS_PLANS, LOGISTICS_MEMBERSHIP;
var init_saasPlans = __esm({
  "src/services/saasPlans.ts"() {
    SAAS_PLANS = {
      gratis: {
        slug: "gratis",
        membershipLabel: "Basic",
        displayName: "Plan Gratis / Inicial",
        seatLimit: 2,
        priceMonthlyArs: 0,
        priceLabel: "Gratis (hasta 2 usuarios)",
        tier: 1
      },
      pro: {
        slug: "pro",
        membershipLabel: "Pro Industria",
        displayName: "Plan Pro Industria",
        seatLimit: 5,
        priceMonthlyArs: 65e3,
        priceLabel: "$65.000 ARS/mes",
        tier: 2
      },
      corporativo: {
        slug: "corporativo",
        membershipLabel: "Corporativo",
        displayName: "Plan Corporativo",
        seatLimit: 10,
        priceMonthlyArs: 14e4,
        priceLabel: "$140.000 ARS/mes",
        tier: 3
      }
    };
    LOGISTICS_MEMBERSHIP = {
      slug: "logistica_flota",
      displayName: "Membres\xEDa Log\xEDstica & Control de Flota",
      priceMonthlyArs: 95e3,
      priceLabel: "$95.000 ARS/mes",
      seatLimit: 10
    };
  }
});

// src/server/saasAndFleetRoutes.ts
import crypto from "crypto";
async function resolveTenantContext(uid, email, membershipName, roleName) {
  if (!hasDatabaseConfig()) return null;
  await ensureProductionTables();
  const normalizedEmail = String(email || "").trim().toLowerCase();
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
  if (!orgRow) {
    const plan2 = resolvePlanConfig(membershipName);
    const profileRes = await pool.query(`SELECT company_name, industry FROM public.company_profiles WHERE user_uid = $1`, [uid]).catch(() => ({ rows: [] }));
    const profileRow = profileRes.rows?.[0];
    const orgName = profileRow?.company_name?.trim() || (normalizedEmail ? `${normalizedEmail.split("@")[0]} \xB7 PyME` : "Mi Empresa B2B");
    const isLogCat = String(profileRow?.industry || "").toUpperCase().includes("LOGIST") || String(membershipName || "").toLowerCase().includes("logist");
    const insertedOrg = await pool.query(
      `INSERT INTO public.organizations (owner_uid, name, plan_slug, seat_limit, logistics_plan_active)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (owner_uid) DO UPDATE SET updated_at = now()
       RETURNING *`,
      [uid, orgName, plan2.slug, plan2.seatLimit, isLogCat]
    );
    orgRow = insertedOrg.rows[0];
    orgRole = "company_admin";
    await pool.query(
      `INSERT INTO public.org_members (organization_id, user_uid, email, org_role, status)
       VALUES ($1, $2, $3, 'company_admin', 'active')
       ON CONFLICT (organization_id, user_uid) DO NOTHING`,
      [orgRow.id, uid, normalizedEmail || uid]
    );
    await pool.query(
      `UPDATE public.contacts SET organization_id = $1 WHERE user_uid = $2 AND organization_id IS NULL`,
      [orgRow.id, uid]
    ).catch(() => {
    });
    await pool.query(
      `UPDATE public.arn_opportunities SET organization_id = $1 WHERE owner_uid = $2 AND organization_id IS NULL`,
      [orgRow.id, uid]
    ).catch(() => {
    });
    await pool.query(
      `UPDATE public.arn_actions_queue SET organization_id = $1 WHERE owner_uid = $2 AND organization_id IS NULL`,
      [orgRow.id, uid]
    ).catch(() => {
    });
  }
  const [membersCountRes, invitesCountRes] = await Promise.all([
    pool.query(
      `SELECT count(*)::int AS cnt FROM public.org_members WHERE organization_id = $1 AND status = 'active'`,
      [orgRow.id]
    ),
    pool.query(
      `SELECT count(*)::int AS cnt FROM public.org_invitations WHERE organization_id = $1 AND status = 'pending'`,
      [orgRow.id]
    )
  ]);
  const activeMembersCount = Number(membersCountRes.rows?.[0]?.cnt || 1);
  const pendingInvitesCount = Number(invitesCountRes.rows?.[0]?.cnt || 0);
  const plan = resolvePlanConfig(orgRow.plan_slug || membershipName);
  const seatLimit = Number(orgRow.seat_limit) || plan.seatLimit;
  const hasLogisticsAccess = canAccessLogisticsSuite({
    logisticsPlanActive: Boolean(orgRow.logistics_plan_active),
    membershipName,
    roleName
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
    hasLogisticsAccess
  };
}
async function upsertLinkedContactFromArn(params) {
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
        existingId
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
      params.stage
    ]
  );
  const newContactId = Number(inserted.rows[0].id);
  await pool.query(
    `UPDATE public.arn_opportunities SET contact_id = $1 WHERE id = $2`,
    [newContactId, params.opportunityId]
  );
  return newContactId;
}
function registerSaasAndFleetRoutes(app, deps) {
  app.get("/api/org/team", requireAuth, async (req, res) => {
    try {
      const tenant = await resolveTenantContext(
        req.user.uid,
        req.user.email,
        req.user.membershipName,
        req.user.roleName
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
            hasLogisticsAccess: false
          },
          members: [
            {
              user_uid: req.user.uid,
              email: req.user.email,
              org_role: "company_admin",
              status: "active"
            }
          ],
          invitations: [],
          plansCatalog: Object.values(SAAS_PLANS),
          logisticsMembership: LOGISTICS_MEMBERSHIP
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
        )
      ]);
      res.json({
        organization: tenant,
        members: membersRes.rows || [],
        invitations: invitesRes.rows || [],
        plansCatalog: Object.values(SAAS_PLANS),
        logisticsMembership: LOGISTICS_MEMBERSHIP
      });
    } catch (err) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });
  app.post("/api/org/invitations", requireAuth, async (req, res) => {
    try {
      const tenant = await resolveTenantContext(
        req.user.uid,
        req.user.email,
        req.user.membershipName,
        req.user.roleName
      );
      if (!tenant) return res.status(500).json({ error: "Base de datos no configurada" });
      if (tenant.orgRole !== "company_admin" && req.user.roleName !== "system_admin") {
        return res.status(403).json({
          error: "Solo el Administrador de la Empresa puede invitar nuevos usuarios."
        });
      }
      const inviteEmail = String(req.body?.email || "").trim().toLowerCase();
      const orgRole = ["company_admin", "comercial", "operador"].includes(req.body?.orgRole) ? req.body.orgRole : "comercial";
      if (!inviteEmail || !inviteEmail.includes("@")) {
        return res.status(400).json({ error: "Ingresa un email corporativo v\xE1lido." });
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
        return res.status(400).json({ error: "Ya existe una invitaci\xF3n pendiente para ese email." });
      }
      const seatCheck = canAddOrganizationSeat(tenant.usedSeats, tenant.seatLimit);
      if (!seatCheck.allowed) {
        return res.status(403).json({
          error: seatCheck.reason,
          code: "SEAT_LIMIT_REACHED",
          seatLimit: tenant.seatLimit,
          usedSeats: tenant.usedSeats
        });
      }
      const token = crypto.randomBytes(16).toString("hex");
      const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1e3);
      const inserted = await pool.query(
        `INSERT INTO public.org_invitations (organization_id, email, org_role, invited_by_uid, token, status, expires_at)
         VALUES ($1, $2, $3, $4, $5, 'pending', $6)
         RETURNING *`,
        [tenant.organizationId, inviteEmail, orgRole, req.user.uid, token, expiresAt]
      );
      if (process.env.RESEND_API_KEY || process.env.SMTP_PASSWORD) {
        try {
          const { sendEmail: sendEmail2 } = await Promise.resolve().then(() => (init_emailService(), emailService_exports));
          await sendEmail2(
            inviteEmail,
            `Invitaci\xF3n a ${tenant.orgName} en xPatagonia B2B`,
            `Hola,

Te invitaron a sumarte al espacio de trabajo de ${tenant.orgName} en xPatagonia con rol "${orgRole}".

Ingres\xE1 o registrate en https://www.xpatagonia.online con este correo (${inviteEmail}) para acceder autom\xE1ticamente al CRM, ARN IA y los m\xF3dulos de tu empresa.`
          );
        } catch {
        }
      }
      await deps.recordAutomationEvent("outbound_n8n", "org.member.invited", "processed", {
        organizationId: tenant.organizationId,
        email: inviteEmail,
        orgRole
      });
      res.json({ success: true, invitation: inserted.rows[0] });
    } catch (err) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });
  app.delete("/api/org/invitations/:id", requireAuth, async (req, res) => {
    try {
      const tenant = await resolveTenantContext(
        req.user.uid,
        req.user.email,
        req.user.membershipName,
        req.user.roleName
      );
      if (!tenant) return res.status(500).json({ error: "DB no configurada" });
      if (tenant.orgRole !== "company_admin" && req.user.roleName !== "system_admin") {
        return res.status(403).json({ error: "Permisos insuficientes" });
      }
      await pool.query(
        `UPDATE public.org_invitations SET status = 'revoked' WHERE id = $1 AND organization_id = $2`,
        [Number(req.params.id), tenant.organizationId]
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });
  app.patch("/api/org/members/:uid/role", requireAuth, async (req, res) => {
    try {
      const tenant = await resolveTenantContext(
        req.user.uid,
        req.user.email,
        req.user.membershipName,
        req.user.roleName
      );
      if (!tenant) return res.status(500).json({ error: "DB no configurada" });
      if (tenant.orgRole !== "company_admin" && req.user.roleName !== "system_admin") {
        return res.status(403).json({ error: "Permisos insuficientes" });
      }
      const nextRole = ["company_admin", "comercial", "operador"].includes(req.body?.orgRole) ? req.body.orgRole : "comercial";
      await pool.query(
        `UPDATE public.org_members SET org_role = $1 WHERE organization_id = $2 AND user_uid = $3`,
        [nextRole, tenant.organizationId, req.params.uid]
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });
  app.delete("/api/org/members/:uid", requireAuth, async (req, res) => {
    try {
      const tenant = await resolveTenantContext(
        req.user.uid,
        req.user.email,
        req.user.membershipName,
        req.user.roleName
      );
      if (!tenant) return res.status(500).json({ error: "DB no configurada" });
      if (tenant.orgRole !== "company_admin" && req.user.roleName !== "system_admin") {
        return res.status(403).json({ error: "Permisos insuficientes" });
      }
      if (req.params.uid === tenant.ownerUid) {
        return res.status(400).json({ error: "No pod\xE9s eliminar al titular principal de la empresa." });
      }
      await pool.query(
        `DELETE FROM public.org_members WHERE organization_id = $1 AND user_uid = $2`,
        [tenant.organizationId, req.params.uid]
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });
  app.post("/api/org/plan", requireAuth, async (req, res) => {
    try {
      const tenant = await resolveTenantContext(
        req.user.uid,
        req.user.email,
        req.user.membershipName,
        req.user.roleName
      );
      if (!tenant) return res.status(500).json({ error: "DB no configurada" });
      if (tenant.orgRole !== "company_admin" && req.user.roleName !== "system_admin") {
        return res.status(403).json({ error: "Solo el Administrador de la Empresa puede cambiar el plan." });
      }
      const body = req.body || {};
      const nextPlan = body.planSlug ? resolvePlanConfig(body.planSlug) : resolvePlanConfig(tenant.planSlug);
      const nextLogistics = typeof body.logisticsPlanActive === "boolean" ? body.logisticsPlanActive : tenant.logisticsPlanActive;
      const nextName = typeof body.orgName === "string" && body.orgName.trim() ? body.orgName.trim() : tenant.orgName;
      if (tenant.usedSeats > nextPlan.seatLimit) {
        return res.status(400).json({
          error: `Actualmente ten\xE9s ${tenant.usedSeats} asientos ocupados. Liber\xE1 miembros o invitaciones antes de bajar a un plan de ${nextPlan.seatLimit} usuarios.`
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
        logisticsPlanActive: nextLogistics
      });
      const updatedTenant = await resolveTenantContext(
        req.user.uid,
        req.user.email,
        nextPlan.membershipLabel,
        req.user.roleName
      );
      res.json({ success: true, organization: updatedTenant });
    } catch (err) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });
  app.get("/api/crm/contacts", requireAuth, async (req, res) => {
    try {
      res.setHeader("Cache-Control", "no-store");
      const tenant = await resolveTenantContext(
        req.user.uid,
        req.user.email,
        req.user.membershipName,
        req.user.roleName
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
        [tenant.organizationId, req.user.uid]
      );
      res.json({ contacts: rows.rows || [] });
    } catch (err) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });
  app.post("/api/crm/contacts", requireAuth, async (req, res) => {
    try {
      const tenant = await resolveTenantContext(
        req.user.uid,
        req.user.email,
        req.user.membershipName,
        req.user.roleName
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
          req.user.uid,
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
          b.location || "Patagonia"
        ]
      );
      let contact = inserted.rows[0];
      let arnResult = null;
      if (b.autoActivateArn) {
        arnResult = await deps.runArnPipelineForEvent({
          ownerUid: req.user.uid,
          organizationId: tenant.organizationId,
          contactId: contact.id,
          source: "crm_contact",
          companyName: contact.company || contact.name,
          contactName: contact.name,
          contactEmail: contact.email || void 0,
          category: contact.industry || void 0,
          rawText: b.arnNote || `Nuevo contacto CRM registrado: ${contact.name} (${contact.company}). Rubro: ${contact.industry}. Ubicaci\xF3n: ${contact.location}. Evaluar oportunidad comercial y preparar primer acercamiento.`
        });
        const refreshed = await pool.query(`SELECT * FROM public.contacts WHERE id = $1`, [contact.id]);
        if (refreshed.rows?.[0]) contact = refreshed.rows[0];
      }
      res.json({ success: true, contact, arnResult });
    } catch (err) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });
  app.patch("/api/crm/contacts/:id", requireAuth, async (req, res) => {
    try {
      const tenant = await resolveTenantContext(
        req.user.uid,
        req.user.email,
        req.user.membershipName,
        req.user.roleName
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
          req.user.uid
        ]
      );
      if (!updated.rows?.[0]) return res.status(404).json({ error: "Contacto no encontrado" });
      res.json({ success: true, contact: updated.rows[0] });
    } catch (err) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });
  app.delete("/api/crm/contacts/:id", requireAuth, async (req, res) => {
    try {
      const tenant = await resolveTenantContext(
        req.user.uid,
        req.user.email,
        req.user.membershipName,
        req.user.roleName
      );
      if (!tenant) return res.status(500).json({ error: "DB no configurada" });
      await pool.query(
        `DELETE FROM public.contacts WHERE id = $1 AND (organization_id = $2 OR user_uid = $3)`,
        [Number(req.params.id), tenant.organizationId, req.user.uid]
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });
  app.post("/api/crm/contacts/:id/activate-arn", requireAuth, async (req, res) => {
    try {
      const tenant = await resolveTenantContext(
        req.user.uid,
        req.user.email,
        req.user.membershipName,
        req.user.roleName
      );
      if (!tenant) return res.status(500).json({ error: "DB no configurada" });
      const contactId = Number(req.params.id);
      const contactRes = await pool.query(
        `SELECT * FROM public.contacts WHERE id = $1 AND (organization_id = $2 OR user_uid = $3)`,
        [contactId, tenant.organizationId, req.user.uid]
      );
      const contact = contactRes.rows?.[0];
      if (!contact) return res.status(404).json({ error: "Contacto no encontrado en tu organizaci\xF3n." });
      const note = String(req.body?.note || "").trim();
      const result = await deps.runArnPipelineForEvent({
        ownerUid: req.user.uid,
        organizationId: tenant.organizationId,
        contactId: contact.id,
        source: "crm_contact",
        companyName: contact.company || contact.name,
        contactName: contact.name,
        contactEmail: contact.email || void 0,
        category: contact.industry || void 0,
        rawText: note || `Activaci\xF3n desde CRM Contactos: ${contact.name} (${contact.company || "Sin empresa"}), Cargo: ${contact.role || "Compras"}, Rubro: ${contact.industry || "General"}, Zona: ${contact.location || "Patagonia"}. Preparar propuesta comercial B2B y seguimiento.`,
        metadata: { cuit: contact.cuit_rut || "", phone: contact.phone || "" }
      });
      const refreshed = await pool.query(`SELECT * FROM public.contacts WHERE id = $1`, [contactId]);
      res.json({ success: true, contact: refreshed.rows?.[0] || contact, ...result });
    } catch (err) {
      res.status(500).json({ error: err?.message || formatPgError(err) });
    }
  });
  app.get("/api/fleet/overview", requireAuth, async (req, res) => {
    try {
      res.setHeader("Cache-Control", "no-store");
      const tenant = await resolveTenantContext(
        req.user.uid,
        req.user.email,
        req.user.membershipName,
        req.user.roleName
      );
      if (!tenant) {
        return res.json({
          hasLogisticsMembership: false,
          vehicles: [],
          drivers: [],
          contracts: [],
          openLoads: []
        });
      }
      const [loadsRes, shipperContractsRes] = await Promise.all([
        pool.query(`SELECT * FROM public.logistics_loads ORDER BY created_at DESC LIMIT 40`),
        pool.query(
          `SELECT * FROM public.logistics_contracts
           WHERE shipper_org_id = $1 OR carrier_org_id = $1
           ORDER BY updated_at DESC LIMIT 40`,
          [tenant.organizationId]
        )
      ]);
      if (!tenant.hasLogisticsAccess) {
        return res.json({
          hasLogisticsMembership: false,
          organization: tenant,
          vehicles: [],
          drivers: [],
          contracts: shipperContractsRes.rows || [],
          openLoads: loadsRes.rows || []
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
        )
      ]);
      res.json({
        hasLogisticsMembership: true,
        organization: tenant,
        vehicles: vehiclesRes.rows || [],
        drivers: driversRes.rows || [],
        contracts: shipperContractsRes.rows || [],
        openLoads: loadsRes.rows || []
      });
    } catch (err) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });
  app.post("/api/fleet/vehicles", requireAuth, async (req, res) => {
    try {
      const tenant = await resolveTenantContext(
        req.user.uid,
        req.user.email,
        req.user.membershipName,
        req.user.roleName
      );
      if (!tenant) return res.status(500).json({ error: "DB no configurada" });
      if (!tenant.hasLogisticsAccess) {
        return res.status(403).json({
          error: "Requiere Membres\xEDa Log\xEDstica & Control de Flota activa para registrar unidades.",
          requiresLogisticsMembership: true
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
          req.user.uid,
          String(b.name).trim(),
          String(b.plate).trim().toUpperCase(),
          b.vehicleType || "Semirremolque 28t",
          Math.max(1, Number(b.capacityTons) || 28),
          b.corridor || "RN 3 / Patag\xF3nica",
          b.vtvExpiry || null,
          b.insuranceExpiry || null,
          b.status || "disponible",
          b.gpsLabel || "Activo en corredor"
        ]
      );
      res.json({ success: true, vehicle: inserted.rows[0] });
    } catch (err) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });
  app.patch("/api/fleet/vehicles/:id", requireAuth, async (req, res) => {
    try {
      const tenant = await resolveTenantContext(
        req.user.uid,
        req.user.email,
        req.user.membershipName,
        req.user.roleName
      );
      if (!tenant) return res.status(500).json({ error: "DB no configurada" });
      if (!tenant.hasLogisticsAccess) {
        return res.status(403).json({ error: "Requiere Membres\xEDa Log\xEDstica activa." });
      }
      const nextStatus = ["disponible", "en_ruta", "mantenimiento"].includes(req.body?.status) ? req.body.status : "disponible";
      const updated = await pool.query(
        `UPDATE public.fleet_vehicles SET status = $1 WHERE id = $2 AND organization_id = $3 RETURNING *`,
        [nextStatus, Number(req.params.id), tenant.organizationId]
      );
      res.json({ success: true, vehicle: updated.rows?.[0] || null });
    } catch (err) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });
  app.delete("/api/fleet/vehicles/:id", requireAuth, async (req, res) => {
    try {
      const tenant = await resolveTenantContext(
        req.user.uid,
        req.user.email,
        req.user.membershipName,
        req.user.roleName
      );
      if (!tenant) return res.status(500).json({ error: "DB no configurada" });
      if (!tenant.hasLogisticsAccess) {
        return res.status(403).json({ error: "Requiere Membres\xEDa Log\xEDstica activa." });
      }
      await pool.query(
        `DELETE FROM public.fleet_vehicles WHERE id = $1 AND organization_id = $2`,
        [Number(req.params.id), tenant.organizationId]
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });
  app.post("/api/fleet/drivers", requireAuth, async (req, res) => {
    try {
      const tenant = await resolveTenantContext(
        req.user.uid,
        req.user.email,
        req.user.membershipName,
        req.user.roleName
      );
      if (!tenant) return res.status(500).json({ error: "DB no configurada" });
      if (!tenant.hasLogisticsAccess) {
        return res.status(403).json({
          error: "Requiere Membres\xEDa Log\xEDstica & Control de Flota activa para registrar choferes.",
          requiresLogisticsMembership: true
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
          req.user.uid,
          String(b.fullName).trim(),
          b.dni || null,
          b.lintiLicense || null,
          b.phone || null,
          b.assignedVehicleId ? Number(b.assignedVehicleId) : null,
          b.status || "disponible"
        ]
      );
      res.json({ success: true, driver: inserted.rows[0] });
    } catch (err) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });
  app.delete("/api/fleet/drivers/:id", requireAuth, async (req, res) => {
    try {
      const tenant = await resolveTenantContext(
        req.user.uid,
        req.user.email,
        req.user.membershipName,
        req.user.roleName
      );
      if (!tenant) return res.status(500).json({ error: "DB no configurada" });
      if (!tenant.hasLogisticsAccess) {
        return res.status(403).json({ error: "Requiere Membres\xEDa Log\xEDstica activa." });
      }
      await pool.query(
        `DELETE FROM public.fleet_drivers WHERE id = $1 AND organization_id = $2`,
        [Number(req.params.id), tenant.organizationId]
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });
  app.post("/api/logistics/contracts", requireAuth, async (req, res) => {
    try {
      const tenant = await resolveTenantContext(
        req.user.uid,
        req.user.email,
        req.user.membershipName,
        req.user.roleName
      );
      if (!tenant) return res.status(500).json({ error: "DB no configurada" });
      if (!tenant.hasLogisticsAccess) {
        return res.status(403).json({
          error: "Solo empresas con Membres\xEDa Log\xEDstica & Flota pueden postular unidades y operar contratos de transporte.",
          requiresLogisticsMembership: true
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
          req.user.uid,
          tenant.orgName,
          b.vehicleId ? Number(b.vehicleId) : null,
          b.driverId ? Number(b.driverId) : null,
          Math.max(0, Number(b.agreedPriceArs) || 0),
          trackingCode,
          b.notes || null
        ]
      );
      await deps.recordAutomationEvent("outbound_n8n", "logistics.contract.bid_submitted", "processed", {
        contractId: inserted.rows[0].id,
        trackingCode,
        carrierOrgId: tenant.organizationId
      });
      res.json({ success: true, contract: inserted.rows[0] });
    } catch (err) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });
  app.patch("/api/logistics/contracts/:id/status", requireAuth, async (req, res) => {
    try {
      const tenant = await resolveTenantContext(
        req.user.uid,
        req.user.email,
        req.user.membershipName,
        req.user.roleName
      );
      if (!tenant) return res.status(500).json({ error: "DB no configurada" });
      const contractId = Number(req.params.id);
      const nextStatus = String(req.body?.status || "");
      const allowed = ["ofertado", "adjudicado", "en_transito", "entregado", "cancelado"];
      if (!allowed.includes(nextStatus)) {
        return res.status(400).json({ error: "Estado de contrato inv\xE1lido" });
      }
      const existingRes = await pool.query(
        `SELECT * FROM public.logistics_contracts
         WHERE id = $1 AND (carrier_org_id = $2 OR shipper_org_id = $2 OR carrier_uid = $3 OR shipper_uid = $3)`,
        [contractId, tenant.organizationId, req.user.uid]
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
        ).catch(() => {
        });
      }
      await deps.recordAutomationEvent("outbound_n8n", "logistics.contract.status_changed", "processed", {
        contractId,
        status: nextStatus,
        trackingCode: existing.tracking_code
      });
      res.json({ success: true, contract: updated.rows[0] });
    } catch (err) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });
}
var init_saasAndFleetRoutes = __esm({
  "src/server/saasAndFleetRoutes.ts"() {
    init_db();
    init_auth();
    init_arnSchema();
    init_saasPlans();
  }
});

// src/server/arnRoutes.ts
var arnRoutes_exports = {};
__export(arnRoutes_exports, {
  executeArnAction: () => executeArnAction,
  getUserArnRule: () => getUserArnRule,
  registerArnAndModuleRoutes: () => registerArnAndModuleRoutes,
  runArnPipelineForEvent: () => runArnPipelineForEvent,
  validateArgentineCuit: () => validateArgentineCuit
});
import { createClient as createClient3 } from "@supabase/supabase-js";
function validateArgentineCuit(cuit) {
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
async function resolveOptionalMember(req) {
  const authHeader = req.headers?.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return { authenticated: false };
  }
  const token = authHeader.slice("Bearer ".length).trim();
  const rawUrl2 = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "").trim();
  const rawKey2 = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "").trim();
  if (!rawUrl2 || !rawKey2 || !token) return { authenticated: false };
  try {
    const sb = createClient3(rawUrl2, rawKey2, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const {
      data: { user },
      error
    } = await sb.auth.getUser(token);
    if (error || !user) return { authenticated: false };
    const { roleName, membershipName } = await resolveUserRoleAndMembership(user.id, user.email);
    return {
      authenticated: true,
      uid: user.id,
      email: user.email,
      roleName,
      membershipName
    };
  } catch {
    return { authenticated: false };
  }
}
async function getUserArnRule(uid, organizationId) {
  if (!hasDatabaseConfig()) return { ...DEFAULT_ARN_POLICY };
  await ensureProductionTables();
  const res = organizationId ? await pool.query(
    `SELECT * FROM public.arn_rules WHERE organization_id = $1 OR user_uid = $2 ORDER BY (organization_id = $1) DESC LIMIT 1`,
    [organizationId, uid]
  ) : await pool.query(`SELECT * FROM public.arn_rules WHERE user_uid = $1`, [uid]);
  const row = res.rows?.[0];
  if (!row) return { ...DEFAULT_ARN_POLICY };
  return {
    mode: row.mode || "hybrid",
    autoApproveMaxUsd: Number(row.auto_approve_max_usd ?? 1500),
    minConfidenceScore: Number(row.min_confidence_score ?? 82),
    autoSendEmails: Boolean(row.auto_send_emails),
    autoCreateLogistics: Boolean(row.auto_create_logistics),
    autoReserveInventory: Boolean(row.auto_reserve_inventory)
  };
}
async function executeArnAction(actionRow) {
  const actionType = String(actionRow.action_type || "");
  if ((actionType === "send_quote_email" || actionType === "send_followup_email" || actionType === "notify_providers") && actionRow.target_email) {
    try {
      const { sendEmail: sendEmail2 } = await Promise.resolve().then(() => (init_emailService(), emailService_exports));
      const mailResult = await sendEmail2(
        String(actionRow.target_email),
        String(actionRow.draft_subject || "Propuesta Comercial xPatagonia"),
        String(actionRow.draft_body || "")
      );
      return {
        executed: true,
        note: `Correo enviado v\xEDa ${mailResult?.provider || "Resend"} a ${actionRow.target_email}`
      };
    } catch (mailErr) {
      return {
        executed: false,
        note: `Env\xEDo diferido: ${mailErr?.message || "credenciales de correo no disponibles"}`
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
        meta.corridor || "RN 22 / A\xF1elo",
        meta.truckType || "Semirremolque 28t"
      ]
    );
    return { executed: true, note: "Licitaci\xF3n de carga generada autom\xE1ticamente en Bolsa de Cargas." };
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
    return { executed: true, note: "Reserva de inventario registrada en bit\xE1cora ARN." };
  }
  return { executed: true, note: "Acci\xF3n registrada en flujo aut\xF3nomo ARN." };
}
async function runArnPipelineForEvent(params) {
  let orgId = params.organizationId ?? null;
  if (!orgId && hasDatabaseConfig()) {
    const tenant = await resolveTenantContext(params.ownerUid).catch(() => null);
    orgId = tenant?.organizationId ?? null;
  }
  const rule = await getUserArnRule(params.ownerUid, orgId);
  let catalogSummary = "";
  if (hasDatabaseConfig()) {
    await ensureProductionTables();
    const prodRes = await pool.query(
      `SELECT name, sku, category, price_base FROM public.products WHERE user_uid = $1 LIMIT 8`,
      [params.ownerUid]
    );
    if (prodRes.rows.length > 0) {
      catalogSummary = prodRes.rows.map((p) => `- ${p.name} (${p.sku || "S/SKU"}) \xB7 ${p.category} \xB7 Base: ${p.price_base || "Consultar"}`).join("\n");
    }
  }
  const analysis = await analyzeOpportunityWithArn({
    source: params.source,
    companyName: params.companyName,
    contactName: params.contactName,
    contactEmail: params.contactEmail,
    category: params.category,
    rawText: params.rawText,
    catalogSummary
  });
  const decision = evaluateHybridDecision(
    rule,
    analysis.actionType,
    analysis.estimatedAmountUsd,
    analysis.aiScore
  );
  if (!hasDatabaseConfig()) {
    return { opportunity: null, action: null, analysis, decision, linkedContactId: null };
  }
  await ensureProductionTables();
  const initialStage = decision.shouldAutoExecute ? "quoted" : "qualified";
  const oppRes = await pool.query(
    `INSERT INTO public.arn_opportunities (
      owner_uid, organization_id, contact_id, company_name, contact_name, contact_email, cuit, category, corridor,
      source, stage, ai_score, estimated_amount_usd, urgency, summary, recommended_action, raw_context
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17::jsonb)
    RETURNING *`,
    [
      params.ownerUid,
      orgId,
      params.contactId || null,
      analysis.companyName,
      analysis.contactName,
      analysis.contactEmail || null,
      analysis.cuit || params.metadata?.cuit || null,
      analysis.category,
      analysis.corridor,
      params.source,
      initialStage,
      analysis.aiScore,
      analysis.estimatedAmountUsd,
      analysis.urgency,
      analysis.summary,
      analysis.recommendedAction,
      JSON.stringify({ rawText: params.rawText.slice(0, 1200), ...params.metadata || {} })
    ]
  );
  const opp = oppRes.rows[0];
  const linkedContactId = await upsertLinkedContactFromArn({
    ownerUid: params.ownerUid,
    organizationId: orgId,
    contactId: params.contactId,
    opportunityId: Number(opp.id),
    companyName: analysis.companyName,
    contactName: analysis.contactName,
    contactEmail: analysis.contactEmail,
    cuit: analysis.cuit || params.metadata?.cuit,
    category: analysis.category,
    corridor: analysis.corridor,
    aiScore: analysis.aiScore,
    stage: initialStage,
    source: params.source
  }).catch(() => null);
  let status = decision.shouldAutoExecute ? "approved" : "pending_approval";
  let executedAt = null;
  let execNote = decision.reason;
  const actRes = await pool.query(
    `INSERT INTO public.arn_actions_queue (
      owner_uid, organization_id, opportunity_id, action_type, title, target_email,
      draft_subject, draft_body, estimated_amount_usd, confidence_score,
      execution_mode, status, metadata
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb)
    RETURNING *`,
    [
      params.ownerUid,
      orgId,
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
      JSON.stringify({ reason: decision.reason, corridor: analysis.corridor, ...params.metadata || {} })
    ]
  );
  let action = actRes.rows[0];
  if (decision.shouldAutoExecute) {
    try {
      const exec = await executeArnAction(action);
      status = exec.executed ? "executed" : "pending_approval";
      execNote = exec.note;
      executedAt = exec.executed ? /* @__PURE__ */ new Date() : null;
      const upd = await pool.query(
        `UPDATE public.arn_actions_queue
         SET status = $1, executed_at = $2,
             metadata = metadata || $3::jsonb
         WHERE id = $4 RETURNING *`,
        [status, executedAt, JSON.stringify({ executionNote: execNote }), action.id]
      );
      action = upd.rows[0];
    } catch (execErr) {
      await pool.query(
        `UPDATE public.arn_actions_queue SET status = 'failed', metadata = metadata || $1::jsonb WHERE id = $2`,
        [JSON.stringify({ error: execErr?.message || "Execution error" }), action.id]
      );
    }
  }
  return { opportunity: opp, action, analysis, decision, linkedContactId };
}
function registerArnAndModuleRoutes(app, recordAutomationEvent) {
  app.get("/api/arn/overview", requireAuth, async (req, res) => {
    try {
      const uid = req.user.uid;
      if (!hasDatabaseConfig()) {
        return res.json({
          rules: DEFAULT_ARN_POLICY,
          opportunities: [],
          actions: [],
          metrics: { totalOpportunities: 0, pendingApprovals: 0, autoExecuted: 0, pipelineUsd: 0 }
        });
      }
      await ensureProductionTables();
      const tenant = await resolveTenantContext(
        uid,
        req.user.email,
        req.user.membershipName,
        req.user.roleName
      );
      const orgId = tenant?.organizationId || null;
      const [rules, oppRes, actRes] = await Promise.all([
        getUserArnRule(uid, orgId),
        pool.query(
          `SELECT * FROM public.arn_opportunities
           WHERE ($1::int IS NOT NULL AND organization_id = $1) OR owner_uid = $2
           ORDER BY updated_at DESC LIMIT 60`,
          [orgId, uid]
        ),
        pool.query(
          `SELECT * FROM public.arn_actions_queue
           WHERE ($1::int IS NOT NULL AND organization_id = $1) OR owner_uid = $2
           ORDER BY created_at DESC LIMIT 60`,
          [orgId, uid]
        )
      ]);
      const opportunities = oppRes.rows || [];
      const actions = actRes.rows || [];
      const pendingApprovals = actions.filter((a) => a.status === "pending_approval").length;
      const autoExecuted = actions.filter(
        (a) => a.execution_mode === "auto_approved" && a.status === "executed"
      ).length;
      const pipelineUsd = opportunities.filter((o) => o.stage !== "archived").reduce((sum, o) => sum + (Number(o.estimated_amount_usd) || 0), 0);
      res.json({
        rules,
        opportunities,
        actions,
        organization: tenant,
        metrics: {
          totalOpportunities: opportunities.length,
          pendingApprovals,
          autoExecuted,
          pipelineUsd
        }
      });
    } catch (err) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });
  app.put("/api/arn/rules", requireAuth, async (req, res) => {
    try {
      const uid = req.user.uid;
      const body = req.body || {};
      const mode = ["hybrid", "manual", "auto"].includes(body.mode) ? body.mode : "hybrid";
      const autoApproveMaxUsd = Math.max(0, Math.min(1e6, Number(body.autoApproveMaxUsd) || 1500));
      const minConfidenceScore = Math.max(50, Math.min(100, Number(body.minConfidenceScore) || 82));
      const autoSendEmails = Boolean(body.autoSendEmails);
      const autoCreateLogistics = body.autoCreateLogistics !== false;
      const autoReserveInventory = body.autoReserveInventory !== false;
      if (!hasDatabaseConfig()) {
        return res.status(500).json({ error: "Base de datos no configurada" });
      }
      await ensureProductionTables();
      const tenant = await resolveTenantContext(
        uid,
        req.user.email,
        req.user.membershipName,
        req.user.roleName
      );
      await pool.query(
        `INSERT INTO public.arn_rules (
          user_uid, organization_id, mode, auto_approve_max_usd, min_confidence_score,
          auto_send_emails, auto_create_logistics, auto_reserve_inventory, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,now())
        ON CONFLICT (user_uid) DO UPDATE SET
          organization_id = COALESCE(EXCLUDED.organization_id, public.arn_rules.organization_id),
          mode = EXCLUDED.mode,
          auto_approve_max_usd = EXCLUDED.auto_approve_max_usd,
          min_confidence_score = EXCLUDED.min_confidence_score,
          auto_send_emails = EXCLUDED.auto_send_emails,
          auto_create_logistics = EXCLUDED.auto_create_logistics,
          auto_reserve_inventory = EXCLUDED.auto_reserve_inventory,
          updated_at = now()`,
        [
          uid,
          tenant?.organizationId || null,
          mode,
          autoApproveMaxUsd,
          minConfidenceScore,
          autoSendEmails,
          autoCreateLogistics,
          autoReserveInventory
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
          autoReserveInventory
        }
      });
    } catch (err) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });
  app.post("/api/arn/ingest", requireAuth, async (req, res) => {
    try {
      const { source = "manual", companyName, contactName, contactEmail, category, rawText, metadata } = req.body || {};
      if (!rawText || String(rawText).trim().length < 5) {
        return res.status(400).json({ error: "Describe el requerimiento o texto comercial a analizar." });
      }
      const result = await runArnPipelineForEvent({
        ownerUid: req.user.uid,
        source: String(source),
        companyName,
        contactName,
        contactEmail,
        category,
        rawText: String(rawText),
        metadata
      });
      await recordAutomationEvent("outbound_n8n", "arn.opportunity.ingested", "processed", {
        uid: req.user.uid,
        source,
        companyName: result.analysis.companyName,
        autoExecuted: result.decision.shouldAutoExecute
      });
      res.json({ success: true, ...result });
    } catch (err) {
      res.status(500).json({ error: err?.message || "Error procesando ingesta ARN IA" });
    }
  });
  app.post("/api/arn/triage-inbox", requireAuth, async (req, res) => {
    try {
      const { fetchEmails: fetchEmails2 } = await Promise.resolve().then(() => (init_emailService(), emailService_exports));
      const emails = await fetchEmails2();
      const recent = Array.isArray(emails) ? emails.slice(0, 5) : [];
      const created = [];
      for (const mail of recent) {
        const senderRaw = String(mail.from || "");
        const emailMatch = senderRaw.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        const senderEmail = emailMatch ? emailMatch[0] : "";
        const senderName = senderRaw.replace(/<[^>]+>/g, "").trim() || senderEmail;
        const out = await runArnPipelineForEvent({
          ownerUid: req.user.uid,
          source: "email_imap",
          companyName: senderName,
          contactName: senderName,
          contactEmail: senderEmail,
          rawText: `Asunto: ${mail.subject}

${mail.text || mail.snippet || ""}`,
          metadata: { emailId: mail.id, emailDate: mail.date }
        });
        created.push(out.opportunity);
      }
      res.json({
        success: true,
        analyzedCount: recent.length,
        opportunitiesCreated: created.filter(Boolean).length
      });
    } catch (err) {
      res.status(500).json({ error: err?.message || "No se pudo analizar la bandeja IMAP" });
    }
  });
  app.post("/api/arn/actions/:id/approve", requireAuth, async (req, res) => {
    try {
      if (!hasDatabaseConfig()) return res.status(500).json({ error: "DB no configurada" });
      await ensureProductionTables();
      const actionId = Number(req.params.id);
      const { draftSubject, draftBody } = req.body || {};
      const tenant = await resolveTenantContext(
        req.user.uid,
        req.user.email,
        req.user.membershipName,
        req.user.roleName
      );
      const orgId = tenant?.organizationId || null;
      const existing = await pool.query(
        `SELECT * FROM public.arn_actions_queue WHERE id = $1 AND (($2::int IS NOT NULL AND organization_id = $2) OR owner_uid = $3)`,
        [actionId, orgId, req.user.uid]
      );
      const row = existing.rows?.[0];
      if (!row) return res.status(404).json({ error: "Acci\xF3n no encontrada" });
      const updatedRow = {
        ...row,
        draft_subject: draftSubject !== void 0 ? String(draftSubject) : row.draft_subject,
        draft_body: draftBody !== void 0 ? String(draftBody) : row.draft_body
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
         WHERE id = $5 AND (($6::int IS NOT NULL AND organization_id = $6) OR owner_uid = $7)
         RETURNING *`,
        [
          nextStatus,
          updatedRow.draft_subject,
          updatedRow.draft_body,
          JSON.stringify({ executionNote: execResult.note }),
          actionId,
          orgId,
          req.user.uid
        ]
      );
      if (row.opportunity_id && execResult.executed) {
        await pool.query(
          `UPDATE public.arn_opportunities SET stage = 'quoted', updated_at = now() WHERE id = $1`,
          [row.opportunity_id]
        );
        await pool.query(
          `UPDATE public.contacts SET lead_stage = 'quoted', last_arn_sync_at = now() WHERE arn_opportunity_id = $1`,
          [row.opportunity_id]
        ).catch(() => {
        });
      }
      await recordAutomationEvent("outbound_n8n", "arn.action.approved", nextStatus, {
        actionId,
        actionType: row.action_type,
        note: execResult.note
      });
      res.json({ success: true, action: upd.rows[0], note: execResult.note });
    } catch (err) {
      res.status(500).json({ error: err?.message || "Error ejecutando acci\xF3n ARN" });
    }
  });
  app.post("/api/arn/actions/:id/dismiss", requireAuth, async (req, res) => {
    try {
      if (!hasDatabaseConfig()) return res.status(500).json({ error: "DB no configurada" });
      await ensureProductionTables();
      const actionId = Number(req.params.id);
      const tenant = await resolveTenantContext(
        req.user.uid,
        req.user.email,
        req.user.membershipName,
        req.user.roleName
      );
      await pool.query(
        `UPDATE public.arn_actions_queue SET status = 'dismissed' WHERE id = $1 AND (($2::int IS NOT NULL AND organization_id = $2) OR owner_uid = $3)`,
        [actionId, tenant?.organizationId || null, req.user.uid]
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });
  app.post("/api/arn/opportunities/:id/stage", requireAuth, async (req, res) => {
    try {
      if (!hasDatabaseConfig()) return res.status(500).json({ error: "DB no configurada" });
      await ensureProductionTables();
      const id = Number(req.params.id);
      const stage = String(req.body?.stage || "qualified");
      const allowed = ["detected", "qualified", "quoted", "negotiating", "awarded", "archived"];
      if (!allowed.includes(stage)) {
        return res.status(400).json({ error: "Etapa inv\xE1lida" });
      }
      const tenant = await resolveTenantContext(
        req.user.uid,
        req.user.email,
        req.user.membershipName,
        req.user.roleName
      );
      const upd = await pool.query(
        `UPDATE public.arn_opportunities SET stage = $1, updated_at = now() WHERE id = $2 AND (($3::int IS NOT NULL AND organization_id = $3) OR owner_uid = $4) RETURNING *`,
        [stage, id, tenant?.organizationId || null, req.user.uid]
      );
      if (upd.rows?.[0]) {
        await pool.query(
          `UPDATE public.contacts SET lead_stage = $1, last_arn_sync_at = now() WHERE arn_opportunity_id = $2`,
          [stage, id]
        ).catch(() => {
        });
      }
      res.json({ success: true, opportunity: upd.rows?.[0] || null });
    } catch (err) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });
  app.post("/api/arn/copilot", requireAuth, async (req, res) => {
    try {
      const uid = req.user.uid;
      const question = String(req.body?.question || "").trim();
      if (!question) return res.status(400).json({ error: "Escrib\xED tu consulta para ARN IA." });
      let snapshot = {
        opportunitiesCount: 0,
        pendingActionsCount: 0,
        topOpportunities: [],
        inventoryLowStock: [],
        openRfqsCount: 0,
        policy: DEFAULT_ARN_POLICY
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
          )
        ]);
        snapshot = {
          opportunitiesCount: oppRes.rows.length,
          pendingActionsCount: actRes.rows?.[0]?.cnt || 0,
          topOpportunities: oppRes.rows.map((r) => ({
            companyName: r.company_name,
            stage: r.stage,
            aiScore: r.ai_score,
            estimatedAmountUsd: r.estimated_amount_usd,
            summary: r.summary
          })),
          inventoryLowStock: invRes.rows,
          openRfqsCount: rfqRes.rows?.[0]?.cnt || 0,
          policy
        };
      }
      const answer = await askArnCopilot(question, snapshot);
      res.json({ success: true, answer });
    } catch (err) {
      res.status(500).json({ error: err?.message || "Error consultando Copiloto ARN" });
    }
  });
  app.get("/api/directory", async (req, res) => {
    try {
      res.setHeader("Cache-Control", "no-store");
      const member = await resolveOptionalMember(req);
      const revealProtected = Boolean(member.authenticated);
      const requestedEntityType = String(req.query.entityType || "").trim().toLowerCase();
      let dbCompanies = [];
      if (hasDatabaseConfig()) {
        try {
          await ensureProductionTables();
          const rows = await pool.query(`
            SELECT cp.*, u.email AS user_email
            FROM public.company_profiles cp
            LEFT JOIN public.users u ON u.uid = cp.user_uid
            WHERE cp.company_name IS NOT NULL AND cp.company_name != ''
            ORDER BY cp.trust_score DESC, cp.updated_at DESC
            LIMIT 80
          `);
          dbCompanies = rows.rows.map((r) => {
            const normalizedType = ["empresa", "emprendimiento", "profesional", "servicio"].includes(
              String(r.entity_type || "").toLowerCase()
            ) ? String(r.entity_type).toLowerCase() : "empresa";
            return {
              id: `db-${r.id}`,
              entityType: normalizedType,
              name: r.company_name,
              cuit: r.cuit || "",
              tier: (r.trust_score || 50) >= 85 ? "corporativo" : (r.trust_score || 50) >= 65 ? "pro" : "inicial",
              tierPriority: (r.trust_score || 50) >= 85 ? 1 : (r.trust_score || 50) >= 65 ? 2 : 3,
              tierLabel: (r.trust_score || 50) >= 85 ? "Plan Corporativo" : (r.trust_score || 50) >= 65 ? "Plan Pro Industrial" : "Plan Inicial",
              verified: r.verification_status === "verified",
              category: r.industry || "Servicios Industriales",
              subcategories: Array.isArray(r.services) ? r.services : [],
              province: r.province || "Chubut",
              city: r.city || "Comodoro Rivadavia",
              employeeCount: r.employee_count || (normalizedType === "profesional" ? "Profesional Matriculado" : "11-50"),
              credentialLabel: r.credential_label || void 0,
              serviceModality: r.service_modality || void 0,
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
              adnComercial: {
                ofrece: Array.isArray(r.adn_ofrece) ? r.adn_ofrece : [],
                demanda: Array.isArray(r.adn_demanda) ? r.adn_demanda : [],
                corredorLogistico: Array.isArray(r.corredores_logisticos) ? r.corredores_logisticos[0] || "Patagonia Sur" : "Patagonia Sur",
                ciudadBase: r.city || "Patagonia",
                lat: Number(r.base_lat) || -45.8641,
                lng: Number(r.base_lng) || -67.4965
              }
            };
          });
        } catch {
        }
      }
      const combined = sortCompaniesBySubscriptionTier([...dbCompanies, ...B2B_COMPANIES]);
      const filteredByType = ["empresa", "emprendimiento", "profesional", "servicio"].includes(requestedEntityType) ? combined.filter((c) => (c.entityType || "empresa") === requestedEntityType) : combined;
      const merged = filteredByType.map((c) => {
        const entityType = c.entityType || "empresa";
        if (revealProtected) return { ...c, entityType, protectedMasked: false };
        return {
          ...c,
          entityType,
          cuit: "\u2022\u2022-\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022-\u2022",
          contactName: "Reservado para Miembros",
          contactRole: "Suscripci\xF3n Activa",
          credentialLabel: c.credentialLabel ? "Matr\xEDcula / Credencial \xB7 Verificada (Solo Miembros)" : void 0,
          email: "",
          phone: "",
          whatsapp: "",
          paymentTerms: "Visible con membres\xEDa",
          creditRating: "Acceso Miembro",
          protectedMasked: true
        };
      });
      res.json({
        companies: merged,
        isMemberAuthorized: revealProtected,
        membershipName: member.membershipName || null
      });
    } catch (err) {
      res.status(500).json({ error: err?.message || "Failed to load directory" });
    }
  });
  app.get("/api/company/profile", requireAuth, async (req, res) => {
    try {
      if (!hasDatabaseConfig()) return res.json({ profile: null });
      const result = await pool.query(
        `SELECT * FROM public.company_profiles WHERE user_uid = $1`,
        [req.user.uid]
      );
      res.json({ profile: result.rows?.[0] || null });
    } catch (err) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });
  app.put("/api/company/profile", requireAuth, async (req, res) => {
    try {
      const b = req.body || {};
      if (b.cuit && !validateArgentineCuit(String(b.cuit))) {
        return res.status(400).json({ error: "El CUIT ingresado no supera la validaci\xF3n de d\xEDgito verificador ARCA." });
      }
      if (!hasDatabaseConfig()) {
        return res.status(500).json({ error: "Base de datos no configurada" });
      }
      await ensureProductionTables();
      const { getOrCreateUser: getOrCreateUser2 } = await Promise.resolve().then(() => (init_users(), users_exports));
      await getOrCreateUser2(req.user.uid, req.user.email || "");
      const entityType = ["empresa", "emprendimiento", "profesional", "servicio"].includes(
        String(b.entityType || "").toLowerCase()
      ) ? String(b.entityType).toLowerCase() : "empresa";
      const offers = Array.isArray(b.adnOfrece) ? b.adnOfrece : [];
      const demands = Array.isArray(b.adnDemanda) ? b.adnDemanda : [];
      const adnText = `${entityType} ${b.companyName || ""} ${b.industry || ""} ${b.credentialLabel || ""} ${b.description || ""} Ofrece: ${offers.join(", ")} Demanda: ${demands.join(", ")}`;
      const embedding = await generateAdnEmbedding(adnText);
      const upsertParams = [
        req.user.uid,
        b.companyName || "",
        b.description || "",
        b.address || "",
        b.province || "Chubut",
        b.city || "Comodoro Rivadavia",
        b.cuit || "",
        b.employeeCount || "1-10",
        b.contactEmail || req.user.email || "",
        b.contactPhone || "",
        b.whatsapp || "",
        b.website || "",
        b.industry || (Array.isArray(b.categories) ? b.categories[0] : "") || "Servicios Industriales",
        JSON.stringify(Array.isArray(b.categories) ? b.categories : []),
        offers,
        demands,
        Number(b.lat) || -45.8641,
        Number(b.lng) || -67.4965,
        entityType,
        b.credentialLabel || "",
        b.serviceModality || ""
      ];
      await pool.query(
        `INSERT INTO public.company_profiles (
          user_uid, company_name, description, address, province, city, cuit,
          employee_count, email, phone, whatsapp, website, industry, services,
          adn_ofrece, adn_demanda, base_lat, base_lng, entity_type, credential_label, service_modality, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::jsonb,$15,$16,$17,$18,$19,$20,$21,now())
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
          entity_type = EXCLUDED.entity_type,
          credential_label = EXCLUDED.credential_label,
          service_modality = EXCLUDED.service_modality,
          updated_at = now()`,
        upsertParams
      );
      if (embedding) {
        try {
          await pool.query(
            `UPDATE public.company_profiles SET adn_embedding = $1::vector WHERE user_uid = $2`,
            [`[${embedding.join(",")}]`, req.user.uid]
          );
        } catch {
        }
      }
      res.json({ success: true, embeddingGenerated: Boolean(embedding), entityType });
    } catch (err) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });
  app.post("/api/adn/match", requireAuth, async (req, res) => {
    try {
      const offers = Array.isArray(req.body?.offers) ? req.body.offers : String(req.body?.offers || "").split(",").map((s) => s.trim()).filter(Boolean);
      const demands = Array.isArray(req.body?.demands) ? req.body.demands : String(req.body?.demands || "").split(",").map((s) => s.trim()).filter(Boolean);
      let vectorMatches = [];
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
          }
        }
      }
      const offerLower = offers.map((o) => o.toLowerCase());
      const demandLower = demands.map((d) => d.toLowerCase());
      const matches = sortCompaniesBySubscriptionTier(B2B_COMPANIES).map((comp) => {
        const vecRow = vectorMatches.find((v) => v.company_name === comp.name);
        let score = vecRow ? Math.round(Number(vecRow.similarity) * 100) : 52;
        const reasons = [];
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
          matchReason: reasons.length > 0 ? reasons.join(" \xB7 ") : `Sinergia estrat\xE9gica en ${comp.adnComercial.corredorLogistico}`,
          corridorSynergy: comp.adnComercial.corredorLogistico,
          estimatedRoadKm: Math.max(85, roadKm),
          engine: vecRow ? "pgvector_cosine" : "semantic_corridor"
        };
      }).sort((a, b) => b.compatibilityPercent - a.compatibilityPercent).slice(0, 6);
      res.json({ success: true, matches });
    } catch (err) {
      res.status(500).json({ error: err?.message || "Error calculando ADN matches" });
    }
  });
  app.get("/api/products", async (req, res) => {
    try {
      res.setHeader("Cache-Control", "no-store");
      if (!hasDatabaseConfig()) return res.json({ products: [] });
      await ensureProductionTables();
      const member = await resolveOptionalMember(req);
      const mineOnly = req.query.mine === "1" && member.authenticated && member.uid;
      const result = mineOnly ? await pool.query(`SELECT * FROM public.products WHERE user_uid = $1 ORDER BY created_at DESC`, [
        member.uid
      ]) : await pool.query(`SELECT * FROM public.products ORDER BY created_at DESC LIMIT 100`);
      res.json({ products: result.rows || [] });
    } catch (err) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });
  app.post("/api/products", requireAuth, async (req, res) => {
    try {
      const b = req.body || {};
      if (!b.name || !b.category) {
        return res.status(400).json({ error: "Nombre y categor\xEDa del producto son obligatorios." });
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
          req.user.uid,
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
          b.supplier || req.user.email || "",
          b.image || null
        ]
      );
      res.json({ success: true, product: inserted.rows[0] });
    } catch (err) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });
  app.delete("/api/products/:id", requireAuth, async (req, res) => {
    try {
      if (!hasDatabaseConfig()) return res.status(500).json({ error: "DB no configurada" });
      await ensureProductionTables();
      await pool.query(`DELETE FROM public.products WHERE id = $1 AND user_uid = $2`, [
        Number(req.params.id),
        req.user.uid
      ]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });
  app.get("/api/warehousing/inventory", requireAuth, async (req, res) => {
    try {
      if (!hasDatabaseConfig()) return res.json({ items: [] });
      await ensureProductionTables();
      const rows = await pool.query(
        `SELECT * FROM public.inventory_items WHERE user_uid = $1 ORDER BY last_updated DESC`,
        [req.user.uid]
      );
      res.json({ items: rows.rows || [] });
    } catch (err) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });
  app.post("/api/warehousing/inventory", requireAuth, async (req, res) => {
    try {
      const { sku, name, category, quantity, location } = req.body || {};
      if (!name) return res.status(400).json({ error: "Nombre de \xEDtem requerido" });
      if (!hasDatabaseConfig()) return res.status(500).json({ error: "DB no configurada" });
      await ensureProductionTables();
      const qty = Math.max(0, Number(quantity) || 0);
      const status = qty === 0 ? "out-of-stock" : qty < 20 ? "low-stock" : "in-stock";
      const inserted = await pool.query(
        `INSERT INTO public.inventory_items (user_uid, sku, name, category, quantity, location, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [
          req.user.uid,
          sku || `SKU-${Date.now().toString().slice(-5)}`,
          name,
          category || "Insumos",
          qty,
          location || "Parque Ind. Comodoro",
          status
        ]
      );
      res.json({ success: true, item: inserted.rows[0] });
    } catch (err) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });
  app.get("/api/logistics/loads", async (req, res) => {
    try {
      res.setHeader("Cache-Control", "no-store");
      if (!hasDatabaseConfig()) return res.json({ loads: [] });
      await ensureProductionTables();
      const rows = await pool.query(
        `SELECT * FROM public.logistics_loads ORDER BY created_at DESC LIMIT 50`
      );
      res.json({ loads: rows.rows || [] });
    } catch (err) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });
  app.post("/api/logistics/loads", requireAuth, async (req, res) => {
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
          req.user.uid,
          b.loadType === "cargo_tender" ? "cargo_tender" : "empty_return",
          b.originName,
          b.destinationName,
          b.corridor || "RN 3 / Patag\xF3nica",
          Number(b.distanceKm) || null,
          Number(b.weightKg) || 18e3,
          b.truckType || "Semirremolque 28t",
          Number(b.discountPercent) || 35,
          Number(b.targetPriceArs) || null
        ]
      );
      res.json({ success: true, load: inserted.rows[0] });
    } catch (err) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });
  app.get("/api/chat/messages", requireAuth, async (req, res) => {
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
    } catch (err) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });
  app.post("/api/chat/messages", requireAuth, async (req, res) => {
    try {
      const { channelId, text: text2, senderCompany, msgType = "text", metadata = {} } = req.body || {};
      if (!channelId || !text2 || !String(text2).trim()) {
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
          req.user.uid,
          req.user.email?.split("@")[0] || "Miembro",
          senderCompany || "Empresa xPatagonia",
          String(text2).trim(),
          msgType,
          JSON.stringify(metadata || {})
        ]
      );
      res.json({ success: true, message: inserted.rows[0] });
    } catch (err) {
      res.status(500).json({ error: formatPgError(err) });
    }
  });
  registerSaasAndFleetRoutes(app, {
    runArnPipelineForEvent,
    recordAutomationEvent
  });
}
var init_arnRoutes = __esm({
  "src/server/arnRoutes.ts"() {
    init_db();
    init_auth();
    init_arnSchema();
    init_arnAiService();
    init_b2bDirectoryData();
    init_patagoniaRouting();
    init_saasAndFleetRoutes();
  }
});

// src/server/vercelEntry.ts
import "dotenv/config";

// src/server/createApp.ts
init_auth();
init_users();
import fs from "fs";
import express from "express";
import path from "path";
import crypto2 from "crypto";
import cors from "cors";
import { createClient as createClient4 } from "@supabase/supabase-js";

// src/db/rfqs.ts
init_db();
init_schema();
import { and, eq as eq2, desc } from "drizzle-orm";
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
async function updateRfqStatus(rfqId, userId, status) {
  const result = await db.update(rfqs).set({ status }).where(and(eq2(rfqs.id, rfqId), eq2(rfqs.userId, userId))).returning();
  return result[0] || null;
}

// src/services/notificationService.ts
init_db();
init_schema();
init_emailService();
import { eq as eq3, ilike, or } from "drizzle-orm";
async function notifyProvidersForRfq(rfqCategory, rfqTitle, rfqId) {
  const matchedProviders = [];
  const seenEmails = /* @__PURE__ */ new Set();
  if (hasDatabaseConfig()) {
    try {
      const profiles = await db.select({
        userId: companyProfiles.userId,
        companyName: companyProfiles.companyName,
        email: companyProfiles.email,
        industry: companyProfiles.industry
      }).from(companyProfiles).where(
        or(
          eq3(companyProfiles.industry, rfqCategory),
          ilike(companyProfiles.industry, `%${rfqCategory}%`)
        )
      ).limit(20);
      for (const p of profiles) {
        if (p.email && !seenEmails.has(p.email.toLowerCase())) {
          seenEmails.add(p.email.toLowerCase());
          matchedProviders.push({
            uid: p.userId,
            name: p.companyName || p.email,
            email: p.email,
            category: p.industry || rfqCategory
          });
        }
      }
      if (matchedProviders.length === 0) {
        const userRows = await db.select({
          uid: users.uid,
          email: users.email,
          category: users.category
        }).from(users).where(ilike(users.category, `%${rfqCategory}%`)).limit(20);
        for (const u of userRows) {
          if (u.email && !seenEmails.has(u.email.toLowerCase())) {
            seenEmails.add(u.email.toLowerCase());
            matchedProviders.push({
              uid: u.uid,
              name: u.email,
              email: u.email,
              category: u.category || rfqCategory
            });
          }
        }
      }
    } catch (err) {
      console.warn("[notifyProvidersForRfq] DB query warning:", err);
    }
  }
  const opsEmails = (process.env.ADMIN_EMAILS || "").split(",").map((s) => s.trim()).filter(Boolean);
  for (const adminEmail of opsEmails) {
    if (!seenEmails.has(adminEmail.toLowerCase())) {
      seenEmails.add(adminEmail.toLowerCase());
      matchedProviders.push({
        uid: "ops-admin",
        name: "Mesa de Operaciones xPatagonia",
        email: adminEmail,
        category: rfqCategory
      });
    }
  }
  let sentCount = 0;
  const hasOutboundEmail = Boolean(process.env.RESEND_API_KEY || process.env.SMTP_PASSWORD);
  if (hasOutboundEmail && matchedProviders.length > 0) {
    for (const provider of matchedProviders) {
      try {
        await sendEmail(
          provider.email,
          `Nueva Oportunidad B2B #${rfqId} (${rfqCategory}) - ${rfqTitle}`,
          `Hola ${provider.name},

Se ha publicado una nueva Solicitud de Cotizaci\xF3n (RFQ #${rfqId}) en la categor\xEDa "${rfqCategory}":

${rfqTitle}

Ingresa a https://xpatagonia.online/dashboard para revisar especificaciones y enviar tu propuesta.`,
          `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:20px;">
            <h2 style="color:#111827;">Nueva Oportunidad B2B #${rfqId}</h2>
            <p>Hola <strong>${provider.name}</strong>,</p>
            <p>Se public\xF3 una nueva solicitud de cotizaci\xF3n compatible con tu rubro (<strong>${rfqCategory}</strong>):</p>
            <p style="padding:12px 16px;background:#f8fafc;border-left:4px solid #f97316;font-weight:600;">${rfqTitle}</p>
            <p><a href="https://xpatagonia.online/dashboard" style="display:inline-block;padding:10px 18px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Ver Solicitud en xPatagonia</a></p>
          </div>`
        );
        sentCount++;
      } catch (err) {
        console.warn(`[notifyProvidersForRfq] Failed sending to ${provider.email}:`, err);
      }
    }
  }
  if (hasDatabaseConfig()) {
    try {
      await db.insert(automationLogs).values({
        direction: "outbound_n8n",
        event: "rfq.providers_notified",
        status: sentCount > 0 ? "delivered" : "processed",
        payload: { rfqId, rfqCategory, matchedCount: matchedProviders.length, sentCount }
      });
    } catch {
    }
  }
  return {
    success: true,
    providersMatched: matchedProviders.length,
    providersNotified: sentCount
  };
}

// src/server/createApp.ts
init_db();
init_schema();
init_arnRoutes();
import { eq as eq4, desc as desc2 } from "drizzle-orm";

// src/services/vpsWorkerService.ts
init_db();
init_arnSchema();
init_emailService();
var RETRY_BACKOFF_MINUTES = [1, 5, 15, 30, 60];
function extractOrgAliasId(toHeader) {
  const raw = String(toHeader || "");
  const match = raw.match(/\+org(\d+)@/i);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}
function extractEmailAddress(rawHeader) {
  const raw = String(rawHeader || "").trim();
  const match = raw.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = match ? match[0].toLowerCase() : "";
  const cleanedName = raw.replace(/<[^>]+>/g, "").replace(/["']/g, "").trim();
  return {
    email,
    name: cleanedName || email || "Contacto Entrante"
  };
}
function computeNextRetryDate(attempts, now = /* @__PURE__ */ new Date()) {
  const idx = Math.max(0, Number(attempts) - 1);
  if (attempts <= 0) return new Date(now.getTime() + 6e4);
  if (idx >= RETRY_BACKOFF_MINUTES.length) return null;
  return new Date(now.getTime() + RETRY_BACKOFF_MINUTES[idx] * 6e4);
}
function parseExpiryDaysRemaining(dateStr, referenceDate = /* @__PURE__ */ new Date()) {
  const raw = String(dateStr || "").trim();
  if (!raw) return null;
  const ymd = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  let targetUtc;
  if (ymd) {
    targetUtc = Date.UTC(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));
  } else {
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return null;
    targetUtc = Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate());
  }
  const refUtc = Date.UTC(
    referenceDate.getUTCFullYear(),
    referenceDate.getUTCMonth(),
    referenceDate.getUTCDate()
  );
  return Math.floor((targetUtc - refUtc) / 864e5);
}
async function resolveEmailTenantTarget(params) {
  const fallbackUid = String(process.env.WORKER_DEFAULT_OWNER_UID || "system-arn-bootstrap").trim();
  if (!hasDatabaseConfig()) {
    return { ownerUid: fallbackUid, organizationId: null };
  }
  await ensureProductionTables();
  const aliasOrgId = extractOrgAliasId(params.toHeader);
  if (aliasOrgId) {
    const orgRes = await pool.query(
      `SELECT id, owner_uid FROM public.organizations WHERE id = $1 LIMIT 1`,
      [aliasOrgId]
    );
    if (orgRes.rows?.[0]) {
      return {
        ownerUid: orgRes.rows[0].owner_uid,
        organizationId: Number(orgRes.rows[0].id)
      };
    }
  }
  if (params.senderEmail) {
    const contactRes = await pool.query(
      `SELECT user_uid, organization_id FROM public.contacts
       WHERE LOWER(email) = LOWER($1)
       ORDER BY last_arn_sync_at DESC NULLS LAST, id DESC
       LIMIT 1`,
      [params.senderEmail]
    );
    if (contactRes.rows?.[0]) {
      return {
        ownerUid: contactRes.rows[0].user_uid || fallbackUid,
        organizationId: contactRes.rows[0].organization_id ? Number(contactRes.rows[0].organization_id) : null
      };
    }
  }
  const adminEmail = (process.env.ADMIN_EMAILS || "xpatagonia.com@gmail.com").split(",")[0].trim().toLowerCase();
  const adminOrgRes = await pool.query(
    `SELECT o.id, o.owner_uid
     FROM public.organizations o
     LEFT JOIN public.users u ON u.uid = o.owner_uid
     ORDER BY (LOWER(COALESCE(u.email, '')) = $1) DESC, o.id ASC
     LIMIT 1`,
    [adminEmail]
  );
  if (adminOrgRes.rows?.[0]) {
    return {
      ownerUid: adminOrgRes.rows[0].owner_uid,
      organizationId: Number(adminOrgRes.rows[0].id)
    };
  }
  const userRes = await pool.query(
    `SELECT uid FROM public.users WHERE LOWER(email) = $1 LIMIT 1`,
    [adminEmail]
  );
  return {
    ownerUid: userRes.rows?.[0]?.uid || fallbackUid,
    organizationId: null
  };
}
async function dispatchAutomationWebhook(direction, event, payload) {
  const n8nUrl = String(process.env.N8N_WEBHOOK_URL || "").trim();
  const sharedSecret = String(process.env.N8N_SHARED_SECRET || "").trim();
  let status = "local_queue";
  let attempts = 0;
  let nextRetryAt = null;
  let lastError = null;
  let forwarded = false;
  if (n8nUrl) {
    try {
      const response = await fetch(n8nUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...sharedSecret ? { "x-n8n-secret": sharedSecret } : {}
        },
        body: JSON.stringify({ event, direction, payload, timestamp: (/* @__PURE__ */ new Date()).toISOString() }),
        signal: AbortSignal.timeout(8e3)
      });
      if (response.ok) {
        status = "processed";
        forwarded = true;
      } else {
        attempts = 1;
        status = "retry_pending";
        nextRetryAt = computeNextRetryDate(attempts);
        lastError = `n8n HTTP ${response.status}`;
      }
    } catch (err) {
      attempts = 1;
      status = "retry_pending";
      nextRetryAt = computeNextRetryDate(attempts);
      lastError = err?.message || "n8n connection error";
    }
  } else {
    attempts = 0;
    status = "local_queue";
    nextRetryAt = computeNextRetryDate(1);
  }
  let logId;
  if (hasDatabaseConfig()) {
    await ensureProductionTables();
    const res = await pool.query(
      `INSERT INTO public.automation_logs (
        direction, event, status, payload, attempts, next_retry_at, last_error, updated_at
      ) VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7,now())
      RETURNING id`,
      [direction, event, status, JSON.stringify(payload || {}), attempts, nextRetryAt, lastError]
    );
    logId = res.rows?.[0]?.id ? Number(res.rows[0].id) : void 0;
  }
  return { status, forwarded, logId };
}
async function flushAutomationRetryQueue(limit = 20) {
  const n8nUrl = String(process.env.N8N_WEBHOOK_URL || "").trim();
  if (!n8nUrl) {
    return { checked: 0, succeeded: 0, rescheduled: 0, deadLettered: 0, skippedNoUrl: true };
  }
  if (!hasDatabaseConfig()) {
    return { checked: 0, succeeded: 0, rescheduled: 0, deadLettered: 0 };
  }
  await ensureProductionTables();
  const sharedSecret = String(process.env.N8N_SHARED_SECRET || "").trim();
  const pendingRes = await pool.query(
    `SELECT * FROM public.automation_logs
     WHERE direction = 'outbound_n8n'
       AND status IN ('retry_pending', 'local_queue')
       AND (next_retry_at IS NULL OR next_retry_at <= now())
     ORDER BY created_at ASC
     LIMIT $1`,
    [Math.max(1, Math.min(50, limit))]
  );
  const rows = pendingRes.rows || [];
  let succeeded = 0;
  let rescheduled = 0;
  let deadLettered = 0;
  for (const row of rows) {
    try {
      const response = await fetch(n8nUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...sharedSecret ? { "x-n8n-secret": sharedSecret } : {}
        },
        body: JSON.stringify({
          event: row.event,
          direction: row.direction,
          payload: row.payload || {},
          retryAttempt: Number(row.attempts || 0) + 1,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }),
        signal: AbortSignal.timeout(8e3)
      });
      if (response.ok) {
        await pool.query(
          `UPDATE public.automation_logs
           SET status = 'processed', last_error = NULL, next_retry_at = NULL, updated_at = now()
           WHERE id = $1`,
          [row.id]
        );
        succeeded += 1;
        continue;
      }
      throw new Error(`HTTP ${response.status}`);
    } catch (err) {
      const nextAttempts = Number(row.attempts || 0) + 1;
      const nextRetry = computeNextRetryDate(nextAttempts);
      if (!nextRetry) {
        await pool.query(
          `UPDATE public.automation_logs
           SET status = 'dead_letter', attempts = $1, next_retry_at = NULL, last_error = $2, updated_at = now()
           WHERE id = $3`,
          [nextAttempts, err?.message || "Max retries exceeded", row.id]
        );
        deadLettered += 1;
      } else {
        await pool.query(
          `UPDATE public.automation_logs
           SET status = 'retry_pending', attempts = $1, next_retry_at = $2, last_error = $3, updated_at = now()
           WHERE id = $4`,
          [nextAttempts, nextRetry, err?.message || "Retry scheduled", row.id]
        );
        rescheduled += 1;
      }
    }
  }
  return { checked: rows.length, succeeded, rescheduled, deadLettered };
}
async function processInboundEmailWithArn(mail) {
  if (!hasDatabaseConfig()) {
    return { skipped: true, reason: "no_database" };
  }
  await ensureProductionTables();
  const mailbox = String(mail.mailbox || "INBOX").trim() || "INBOX";
  const emailUid = String(mail.uid || "").trim();
  if (!emailUid) {
    return { skipped: true, reason: "missing_uid" };
  }
  const sender = extractEmailAddress(mail.from);
  const subject = String(mail.subject || "(Sin asunto)").slice(0, 300);
  const lockRes = await pool.query(
    `INSERT INTO public.processed_email_uids (mailbox, email_uid, sender_email, subject)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (mailbox, email_uid) DO NOTHING
     RETURNING id`,
    [mailbox, emailUid, sender.email || null, subject]
  );
  if (!lockRes.rows?.[0]) {
    return { skipped: true, reason: "duplicate_uid" };
  }
  try {
    const tenant = await resolveEmailTenantTarget({
      senderEmail: sender.email,
      toHeader: mail.to
    });
    const { runArnPipelineForEvent: runArnPipelineForEvent2 } = await Promise.resolve().then(() => (init_arnRoutes(), arnRoutes_exports));
    const result = await runArnPipelineForEvent2({
      ownerUid: tenant.ownerUid,
      organizationId: tenant.organizationId,
      source: "email_imap_worker",
      companyName: sender.name,
      contactName: sender.name,
      contactEmail: sender.email,
      rawText: `Asunto: ${subject}

${String(mail.text || "").slice(0, 3500)}`,
      metadata: {
        emailUid,
        mailbox,
        toHeader: mail.to || null,
        emailDate: mail.date || (/* @__PURE__ */ new Date()).toISOString()
      }
    });
    await pool.query(
      `UPDATE public.processed_email_uids
       SET organization_id = $1, arn_opportunity_id = $2
       WHERE id = $3`,
      [tenant.organizationId, result.opportunity?.id || null, lockRes.rows[0].id]
    );
    await dispatchAutomationWebhook("outbound_n8n", "arn.imap.opportunity_created", {
      emailUid,
      senderEmail: sender.email,
      organizationId: tenant.organizationId,
      opportunityId: result.opportunity?.id || null,
      linkedContactId: result.linkedContactId || null,
      autoExecuted: Boolean(result.decision?.shouldAutoExecute)
    });
    return {
      skipped: false,
      opportunityId: result.opportunity?.id ? Number(result.opportunity.id) : void 0,
      linkedContactId: result.linkedContactId ?? null,
      autoExecuted: Boolean(result.decision?.shouldAutoExecute)
    };
  } catch (err) {
    await pool.query(`DELETE FROM public.processed_email_uids WHERE id = $1`, [lockRes.rows[0].id]).catch(() => {
    });
    throw err;
  }
}
async function checkAndNotifyFleetExpiries(daysThreshold = 15) {
  if (!hasDatabaseConfig()) {
    return { scanned: 0, alertsSent: 0 };
  }
  await ensureProductionTables();
  const res = await pool.query(
    `SELECT fv.*, o.name AS org_name, u.email AS owner_email
     FROM public.fleet_vehicles fv
     LEFT JOIN public.organizations o ON o.id = fv.organization_id
     LEFT JOIN public.users u ON u.uid = fv.owner_uid
     WHERE COALESCE(fv.vtv_expiry, '') <> '' OR COALESCE(fv.insurance_expiry, '') <> ''`
  );
  const vehicles = res.rows || [];
  let alertsSent = 0;
  for (const v of vehicles) {
    const recipient = String(v.owner_email || "").trim();
    if (!recipient) continue;
    const checks = [
      { type: "vtv", label: "VTV / Verificaci\xF3n T\xE9cnica", dateVal: v.vtv_expiry },
      { type: "insurance", label: "Seguro Automotor / Carga", dateVal: v.insurance_expiry }
    ];
    for (const chk of checks) {
      if (!chk.dateVal) continue;
      const daysLeft = parseExpiryDaysRemaining(chk.dateVal);
      if (daysLeft === null || daysLeft > daysThreshold) continue;
      const claim = await pool.query(
        `INSERT INTO public.fleet_expiry_alerts (vehicle_id, alert_type, expiry_date, notified_email)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (vehicle_id, alert_type, expiry_date) DO NOTHING
         RETURNING id`,
        [v.id, chk.type, chk.dateVal, recipient]
      );
      if (!claim.rows?.[0]) continue;
      const statusText = daysLeft < 0 ? `VENCIDA hace ${Math.abs(daysLeft)} d\xEDas (${chk.dateVal})` : daysLeft === 0 ? `VENCE HOY (${chk.dateVal})` : `vence en ${daysLeft} d\xEDas (${chk.dateVal})`;
      try {
        await sendEmail(
          recipient,
          `[Alerta Flota xPatagonia] ${v.name} (${v.plate}): ${chk.label} ${statusText}`,
          `Hola,

La unidad ${v.name} (Dominio ${v.plate}) de ${v.org_name || "tu flota"} registra su ${chk.label} ${statusText}.

Ingres\xE1 al Panel de Log\xEDstica & Control de Flota en https://www.xpatagonia.online/dashboard?area=fleet para actualizar la documentaci\xF3n y mantener la habilitaci\xF3n operativa.`
        );
        alertsSent += 1;
      } catch (err) {
        await pool.query(`DELETE FROM public.fleet_expiry_alerts WHERE id = $1`, [claim.rows[0].id]).catch(() => {
        });
        console.warn("[FleetAlert] No se pudo enviar alerta:", err);
      }
    }
  }
  return { scanned: vehicles.length, alertsSent };
}

// src/server/workerAndWebhookRoutes.ts
function extractIncomingSecret(req) {
  const authHeader = String(req.headers.authorization || "");
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length).trim();
  }
  const headerSecret = req.headers["x-n8n-secret"] || req.headers["x-cron-secret"] || req.headers["x-worker-secret"] || "";
  return String(headerSecret).trim();
}
function requireWebhookSecret(req, res, next) {
  const token = extractIncomingSecret(req);
  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Missing worker/n8n Bearer or secret header" });
  }
  const configuredSecrets = [
    process.env.CRON_SECRET,
    process.env.N8N_SHARED_SECRET,
    process.env.ODOO_WEBHOOK_SECRET
  ].map((s) => String(s || "").trim()).filter(Boolean);
  if (configuredSecrets.length === 0 || !configuredSecrets.includes(token)) {
    return res.status(403).json({ error: "Forbidden: Invalid worker/n8n secret" });
  }
  next();
}
function registerWorkerAndWebhookRoutes(app) {
  app.post(
    "/api/webhooks/n8n/imap-inbound",
    requireWebhookSecret,
    async (req, res) => {
      try {
        const b = req.body || {};
        const uid = String(b.uid || b.messageId || b.id || "").trim();
        if (!uid) {
          return res.status(400).json({ error: "Se requiere uid o messageId del correo entrante." });
        }
        const result = await processInboundEmailWithArn({
          uid,
          mailbox: String(b.mailbox || "INBOX"),
          from: String(b.from || ""),
          to: String(b.to || ""),
          subject: String(b.subject || "(Sin asunto)"),
          text: String(b.text || b.body || b.snippet || ""),
          date: b.date ? String(b.date) : void 0
        });
        res.json({ success: true, ...result });
      } catch (err) {
        res.status(500).json({ error: err?.message || "Error procesando correo entrante IMAP" });
      }
    }
  );
  app.post(
    "/api/webhooks/n8n/retry-queue",
    requireWebhookSecret,
    async (req, res) => {
      try {
        const limit = Number(req.body?.limit || 20);
        const summary = await flushAutomationRetryQueue(limit);
        res.json({ success: true, ...summary });
      } catch (err) {
        res.status(500).json({ error: err?.message || "Error ejecutando cola de reintentos" });
      }
    }
  );
  app.post(
    "/api/webhooks/n8n/fleet-alerts",
    requireWebhookSecret,
    async (req, res) => {
      try {
        const days = Number(req.body?.daysThreshold || 15);
        const summary = await checkAndNotifyFleetExpiries(days);
        res.json({ success: true, ...summary });
      } catch (err) {
        res.status(500).json({ error: err?.message || "Error verificando alertas de flota" });
      }
    }
  );
}

// src/services/marketService.ts
var DEFAULT_PREVIOUS_SELL = {
  "USD BLUE": 1555,
  "USD MEP": 1535,
  "USD CCL": 1578,
  "USD OFIC": 1548,
  "USD MAY": 1512,
  "EUR/ARS": 1710,
  "BRL/ARS": 288
};
var prevRatesState = {
  currencies: { ...DEFAULT_PREVIOUS_SELL },
  brentPrevClose: 74.12
};
var cachedPayload = null;
var CACHE_TTL_MS = 60 * 1e3;
function computePctChange(current, baseline) {
  if (!Number.isFinite(current) || !Number.isFinite(baseline) || baseline <= 0) {
    return { pct: 0, label: "0.00%", isPositive: true };
  }
  const raw = (current - baseline) / baseline * 100;
  const pct = Number(raw.toFixed(2));
  const isPositive = pct >= 0;
  return {
    pct,
    label: `${isPositive ? "+" : ""}${pct.toFixed(2)}%`,
    isPositive
  };
}
function computeBrechaBluePct(blueSell, oficialSell) {
  if (!Number.isFinite(blueSell) || !Number.isFinite(oficialSell) || oficialSell <= 0) return 0;
  return Number(((blueSell - oficialSell) / oficialSell * 100).toFixed(1));
}
function buildMarketAlerts(params) {
  const alerts = [];
  if (Math.abs(params.brentChangePct) >= 0.8) {
    const pos = params.brentChangePct >= 0;
    alerts.push({
      id: "alert-brent",
      symbol: "BRENT",
      title: `Crudo Brent ${pos ? "al alza" : "en baja"}`,
      message: `Cotiza USD ${params.brentPrice.toFixed(2)}/bbl (${pos ? "+" : ""}${params.brentChangePct.toFixed(2)}%) \u2014 impacta costos de log\xEDstica y referencia Medanito.`,
      change: `${pos ? "+" : ""}${params.brentChangePct.toFixed(2)}%`,
      severity: pos ? "up" : "down",
      dataMode: params.brentMode
    });
  }
  if (Math.abs(params.btcChange24h) >= 1.5) {
    const pos = params.btcChange24h >= 0;
    alerts.push({
      id: "alert-btc",
      symbol: "BTC",
      title: `Bitcoin ${pos ? "repunta" : "retrocede"} en 24h`,
      message: `Opera en USD $${params.btcUsd.toLocaleString("en-US")} (${pos ? "+" : ""}${params.btcChange24h.toFixed(2)}%).`,
      change: `${pos ? "+" : ""}${params.btcChange24h.toFixed(2)}%`,
      severity: pos ? "up" : "down",
      dataMode: "live"
    });
  }
  const blue = params.currencies.find((c) => c.symbol === "USD BLUE");
  const mep = params.currencies.find((c) => c.symbol === "USD MEP");
  if (blue && Math.abs(blue.changePct) >= 0.5) {
    alerts.push({
      id: "alert-blue",
      symbol: "USD BLUE",
      title: `Movimiento en D\xF3lar Libre`,
      message: `Venta $${blue.sell.toLocaleString("es-AR")} (${blue.change}) respecto a referencia anterior.`,
      change: blue.change,
      severity: blue.isPositive ? "up" : "down",
      dataMode: blue.dataMode
    });
  } else if (mep && Math.abs(mep.changePct) >= 0.5) {
    alerts.push({
      id: "alert-mep",
      symbol: "USD MEP",
      title: `Variaci\xF3n D\xF3lar MEP (BYMA)`,
      message: `Venta $${mep.sell.toLocaleString("es-AR")} (${mep.change}).`,
      change: mep.change,
      severity: mep.isPositive ? "up" : "down",
      dataMode: mep.dataMode
    });
  }
  if (params.brechaBluePct >= 10) {
    alerts.push({
      id: "alert-brecha",
      symbol: "BRECHA",
      title: `Brecha Blue vs Oficial en ${params.brechaBluePct}%`,
      message: `Seguimiento clave para importaci\xF3n de insumos industriales y facturaci\xF3n B2B.`,
      change: `${params.brechaBluePct}%`,
      severity: "info",
      dataMode: "live"
    });
  } else {
    alerts.push({
      id: "alert-brecha-comp",
      symbol: "BRECHA",
      title: `Brecha Blue / Oficial comprimida (${params.brechaBluePct}%)`,
      message: `Diferencial cambiario acotado para presupuestar fletes y contratos RFQ en pesos/USD.`,
      change: `${params.brechaBluePct}%`,
      severity: "info",
      dataMode: "live"
    });
  }
  return alerts.slice(0, 3);
}
async function fetchLiveBrentQuote() {
  try {
    const res = await fetch(
      "https://query1.finance.yahoo.com/v8/finance/chart/BZ=F?range=2d&interval=1d",
      {
        headers: { "User-Agent": "xPatagonia-MarketTerminal/1.0" },
        signal: AbortSignal.timeout(3500)
      }
    );
    if (res.ok) {
      const json = await res.json();
      const meta = json?.chart?.result?.[0]?.meta;
      const price = Number(meta?.regularMarketPrice);
      const prev = Number(meta?.chartPreviousClose || meta?.previousClose || prevRatesState.brentPrevClose || 74.12);
      if (Number.isFinite(price) && price > 10) {
        prevRatesState.brentPrevClose = prev;
        const delta = computePctChange(price, prev);
        const marketTime = meta?.regularMarketTime ? new Date(meta.regularMarketTime * 1e3).toISOString() : (/* @__PURE__ */ new Date()).toISOString();
        return {
          price: Number(price.toFixed(2)),
          prevClose: prev,
          changePct: delta.pct,
          changeLabel: delta.label,
          isPositive: delta.isPositive,
          dataMode: "live",
          updatedAt: marketTime,
          source: "ICE Brent Futures (BZ=F)"
        };
      }
    }
  } catch {
  }
  const fallbackPrice = prevRatesState.brentPrevClose || 74.8;
  return {
    price: fallbackPrice,
    prevClose: fallbackPrice,
    changePct: 0,
    changeLabel: "0.00%",
    isPositive: true,
    dataMode: "official_reference",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    source: "ICE Benchmark (Referencia)"
  };
}
async function getMarketSnapshot(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedPayload && now - cachedPayload.timestamp < CACHE_TTL_MS) {
    return cachedPayload.data;
  }
  const [dolaresRes, cotizacionesRes, cgRes, brentData] = await Promise.allSettled([
    fetch("https://dolarapi.com/v1/dolares", { signal: AbortSignal.timeout(4e3) }),
    fetch("https://dolarapi.com/v1/cotizaciones", { signal: AbortSignal.timeout(4e3) }),
    fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,ars&include_24hr_change=true",
      { signal: AbortSignal.timeout(4e3) }
    ),
    fetchLiveBrentQuote()
  ]);
  let dolares = [];
  if (dolaresRes.status === "fulfilled" && dolaresRes.value.ok) {
    try {
      dolares = await dolaresRes.value.json();
    } catch {
      dolares = [];
    }
  }
  let cotizaciones = [];
  if (cotizacionesRes.status === "fulfilled" && cotizacionesRes.value.ok) {
    try {
      cotizaciones = await cotizacionesRes.value.json();
    } catch {
      cotizaciones = [];
    }
  }
  let btc = {
    usd: 81450,
    usd_24h_change: 1.25,
    ars: 125e6,
    source: "CoinGecko / Coinbase",
    dataMode: "official_reference",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  if (cgRes.status === "fulfilled" && cgRes.value.ok) {
    try {
      const cgData = await cgRes.value.json();
      if (cgData?.bitcoin?.usd) {
        btc = {
          usd: cgData.bitcoin.usd,
          usd_24h_change: Number((cgData.bitcoin.usd_24h_change || 0).toFixed(2)),
          ars: cgData.bitcoin.ars || Math.round(cgData.bitcoin.usd * 1540),
          source: "CoinGecko API",
          dataMode: "live",
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
      }
    } catch {
    }
  } else {
    try {
      const cbRes = await fetch("https://api.coinbase.com/v2/prices/spot?currency=USD", {
        signal: AbortSignal.timeout(2500)
      });
      if (cbRes.ok) {
        const cbData = await cbRes.json();
        const val = parseFloat(cbData.data?.amount);
        if (!isNaN(val)) {
          btc.usd = val;
          btc.ars = Math.round(val * 1540);
          btc.source = "Coinbase Spot";
          btc.dataMode = "live";
        }
      }
    } catch {
    }
  }
  const pickRate = (symbol, name, sourceName, raw, fallbackBuy, fallbackSell) => {
    const buy = Number(raw?.compra) || fallbackBuy;
    const sell = Number(raw?.venta) || fallbackSell;
    const baseline = prevRatesState.currencies[symbol] || sell;
    const delta = computePctChange(sell, baseline);
    if (Number.isFinite(sell) && sell > 0 && raw?.venta) {
      if (Math.abs(delta.pct) >= 3) {
        prevRatesState.currencies[symbol] = sell;
      }
    }
    const mode = raw?.venta ? "live" : "official_reference";
    return {
      symbol,
      name,
      buy,
      sell,
      change: delta.label,
      changePct: delta.pct,
      isPositive: delta.isPositive,
      source: sourceName,
      dataMode: mode,
      updatedAt: raw?.fechaActualizacion || (/* @__PURE__ */ new Date()).toISOString()
    };
  };
  const blueRaw = dolares.find((d) => d.casa === "blue");
  const oficialRaw = dolares.find((d) => d.casa === "oficial");
  const mepRaw = dolares.find((d) => d.casa === "bolsa");
  const cclRaw = dolares.find((d) => d.casa === "contadoconliqui");
  const mayoristaRaw = dolares.find((d) => d.casa === "mayorista");
  const eurRaw = cotizaciones.find((c) => c.moneda === "EUR");
  const brlRaw = cotizaciones.find((c) => c.moneda === "BRL");
  const currencies = [
    pickRate("USD BLUE", "D\xF3lar Blue", "DolarApi \xB7 \xC1mbito", blueRaw, 1545, 1565),
    pickRate("USD MEP", "D\xF3lar Bolsa MEP", "DolarApi \xB7 BYMA", mepRaw, 1520, 1535),
    pickRate("USD CCL", "Contado con Liqui", "DolarApi \xB7 BYMA", cclRaw, 1570, 1585),
    pickRate("USD OFIC", "D\xF3lar Oficial", "DolarApi \xB7 BNA / BCRA", oficialRaw, 1500, 1550),
    pickRate("USD MAY", "D\xF3lar Mayorista", "DolarApi \xB7 MAE", mayoristaRaw, 1495, 1515),
    pickRate("EUR/ARS", "Euro Oficial", "DolarApi \xB7 Banco Naci\xF3n", eurRaw, 1700, 1715),
    pickRate("BRL/ARS", "Real Brasile\xF1o", "DolarApi", brlRaw, 275, 288)
  ];
  const brent = brentData.status === "fulfilled" ? brentData.value : {
    price: 74.8,
    prevClose: 74.8,
    changePct: 0,
    changeLabel: "0.00%",
    isPositive: true,
    dataMode: "official_reference",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    source: "ICE Benchmark (Referencia)"
  };
  const medanitoEstimated = Number((brent.price * 0.928).toFixed(2));
  const referenceDateLabel = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const patagonia = [
    {
      symbol: "BRENT",
      name: "Petr\xF3leo Brent Internacional",
      value: `USD ${brent.price.toFixed(2)}/bbl`,
      numericValue: brent.price,
      change: brent.changeLabel,
      changePct: brent.changePct,
      isPositive: brent.isPositive,
      unit: "USD/barril",
      source: brent.source,
      sourceUrl: "https://finance.yahoo.com/quote/BZ=F",
      dataMode: brent.dataMode,
      updatedAt: brent.updatedAt
    },
    {
      symbol: "MEDANITO",
      name: "Crudo Medanito Neuqu\xE9n",
      value: `USD ${medanitoEstimated.toFixed(2)}/bbl`,
      numericValue: medanitoEstimated,
      change: brent.changeLabel,
      changePct: brent.changePct,
      isPositive: brent.isPositive,
      unit: "USD/barril (Paridad Brent -7.2%)",
      source: "Sec. Energ\xEDa / Cuenca Neuquina",
      dataMode: brent.dataMode === "live" ? "live" : "official_reference",
      updatedAt: brent.updatedAt
    },
    {
      symbol: "GAS PGY",
      name: "Gas Natural Cuenca Neuquina",
      value: "USD 3.52/MMBtu",
      numericValue: 3.52,
      change: "Plan Gas.Ar",
      changePct: 0,
      isPositive: true,
      unit: "USD/MMBtu",
      source: "Plan Gas.Ar \xB7 ENARSA / CAMMESA",
      dataMode: "official_reference",
      updatedAt: referenceDateLabel
    },
    {
      symbol: "E\xD3LICA",
      name: "Potencia E\xF3lica Regional",
      value: "1.580 MW",
      numericValue: 1580,
      change: "FC 51.4%",
      changePct: 0,
      isPositive: true,
      unit: "SADI Patag\xF3nico",
      source: "CAMMESA \xB7 Parques Chubut / Santa Cruz",
      dataMode: "official_reference",
      updatedAt: referenceDateLabel
    },
    {
      symbol: "PESCA",
      name: "Langostino L1/L2 Congelado",
      value: "USD 6.85/kg",
      numericValue: 6.85,
      change: "FOB Puerto",
      changePct: 0,
      isPositive: true,
      unit: "USD/kg FOB",
      source: "CAPIP \xB7 C\xE1mara Pesquera Patag\xF3nica",
      dataMode: "official_reference",
      updatedAt: referenceDateLabel
    },
    {
      symbol: "LANA",
      name: "Lana Merino Fina 19.5u",
      value: "USD 6.45/kg",
      numericValue: 6.45,
      change: "Base Peinada",
      changePct: 0,
      isPositive: true,
      unit: "USD/kg Trelew",
      source: "Federaci\xF3n Lanera Argentina",
      dataMode: "official_reference",
      updatedAt: referenceDateLabel
    },
    {
      symbol: "LITIO",
      name: "Carbonato de Litio Li2CO3",
      value: "USD 10,850/tn",
      numericValue: 10850,
      change: "Grado Bater\xEDa",
      changePct: 0,
      isPositive: true,
      unit: "USD/tonelada",
      source: "LME / Fastmarkets Ref.",
      dataMode: "official_reference",
      updatedAt: referenceDateLabel
    }
  ];
  const blueSell = currencies.find((c) => c.symbol === "USD BLUE")?.sell || 1565;
  const oficialSell = currencies.find((c) => c.symbol === "USD OFIC")?.sell || 1550;
  const brechaBluePct = computeBrechaBluePct(blueSell, oficialSell);
  const alerts = buildMarketAlerts({
    btcChange24h: btc.usd_24h_change,
    btcUsd: btc.usd,
    brentPrice: brent.price,
    brentChangePct: brent.changePct,
    brentMode: brent.dataMode,
    currencies,
    brechaBluePct
  });
  const payload = {
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    brechaBluePct,
    btc: {
      symbol: "BTC",
      name: "Bitcoin",
      usd: btc.usd,
      ars: btc.ars,
      change24h: btc.usd_24h_change,
      isPositive: btc.usd_24h_change >= 0,
      source: btc.source,
      dataMode: btc.dataMode,
      updatedAt: btc.updatedAt
    },
    currencies,
    patagonia,
    alerts
  };
  cachedPayload = { timestamp: now, data: payload };
  return payload;
}

// src/server/createApp.ts
var cachedSupabaseAdmin = null;
function getSupabaseAdminClient() {
  if (cachedSupabaseAdmin) return cachedSupabaseAdmin;
  const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "").trim().replace(/^['"]|['"]$/g, "");
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SECRET_KEY || "").trim().replace(/^['"]|['"]$/g, "");
  if ((supabaseUrl.startsWith("http://") || supabaseUrl.startsWith("https://")) && serviceRoleKey.length > 20) {
    cachedSupabaseAdmin = createClient4(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    return cachedSupabaseAdmin;
  }
  return null;
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
  if (!process.env.VERCEL) {
    try {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      app.use("/uploads", express.static(UPLOADS_DIR));
    } catch {
    }
  }
  const inMemoryAutomationLogs = [];
  async function recordAutomationEvent(direction, event, status, payload) {
    let resolvedStatus = status;
    let attempts = 0;
    let nextRetryAt = null;
    let lastError = null;
    const n8nUrl = String(process.env.N8N_WEBHOOK_URL || "").trim();
    if (direction === "outbound_n8n" && n8nUrl && status !== "processed") {
      try {
        const sharedSecret = String(process.env.N8N_SHARED_SECRET || "").trim();
        const fwRes = await fetch(n8nUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...sharedSecret ? { "x-n8n-secret": sharedSecret } : {}
          },
          body: JSON.stringify({ event, direction, payload, timestamp: (/* @__PURE__ */ new Date()).toISOString() }),
          signal: AbortSignal.timeout(5e3)
        });
        if (fwRes.ok) {
          resolvedStatus = "processed";
        } else {
          resolvedStatus = "retry_pending";
          attempts = 1;
          nextRetryAt = computeNextRetryDate(1);
          lastError = `n8n HTTP ${fwRes.status}`;
        }
      } catch (fwErr) {
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
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
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
          lastError
        });
        persistedInPg = true;
      } catch {
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
            payload
          });
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
  app.get("/api/health", async (req, res) => {
    const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "").trim().replace(/^['"]|['"]$/g, "");
    const supabaseAnon = (process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "").trim().replace(/^['"]|['"]$/g, "");
    const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SECRET_KEY || "").trim().replace(/^['"]|['"]$/g, "");
    const geminiKey = process.env.CUSTOM_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    const resendConfigured = Boolean(
      process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim().length > 5
    );
    const smtpConfigured = Boolean(process.env.SMTP_PASSWORD);
    const imapConfigured = Boolean(process.env.IMAP_PASSWORD);
    let dbDiagnostics;
    if (req.query.checkDb === "1" && hasDatabaseConfig()) {
      try {
        await pool.query("SELECT 1");
        const tbl = await pool.query("SELECT to_regclass('public.site_settings') IS NOT NULL AS exists");
        dbDiagnostics = { ok: true, siteSettingsTable: Boolean(tbl.rows?.[0]?.exists) };
      } catch (dbErr) {
        dbDiagnostics = { ok: false, error: formatPgError(dbErr) };
      }
    }
    res.json({
      status: "ok",
      runtime: process.env.VERCEL ? "vercel_serverless" : "node_server",
      environment: process.env.NODE_ENV || "development",
      vercelEnv: process.env.VERCEL_ENV || null,
      databaseConfigured: hasDatabaseConfig(),
      ...dbDiagnostics ? { dbDiagnostics } : {},
      supabaseConfigured: Boolean(supabaseUrl && supabaseAnon),
      supabaseAdminConfigured: Boolean(getSupabaseAdminClient()),
      supabaseServiceRolePresent: serviceRoleKey.length > 20,
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
  app.get("/api/public-config", (req, res) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    res.setHeader("CDN-Cache-Control", "no-store");
    const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "").trim();
    const supabaseAnonKey = (process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "").trim();
    res.json({
      supabaseUrl,
      supabaseAnonKey
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
        const sbAdmin = createClient4(supabaseUrl, serviceKey);
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
          await db.update(companyProfiles2).set({ companyName }).where(eq4(companyProfiles2.userId, uid));
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
      runArnPipelineForEvent({
        ownerUid: user.uid,
        source: "rfq",
        companyName: user.email,
        contactEmail: user.email,
        category: newRfq.category,
        rawText: `RFQ #${newRfq.id}: ${newRfq.title}
Prioridad: ${newRfq.priority}
${newRfq.description}`,
        metadata: { rfqId: newRfq.id }
      }).catch((err) => console.warn("ARN RFQ ingest warning:", err));
      res.json(newRfq);
    } catch (error) {
      console.error("Error creating RFQ:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app.post("/api/rfqs/:id/award", requireAuth, async (req, res) => {
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
      runArnPipelineForEvent({
        ownerUid: req.user.uid,
        source: "rfq_award",
        companyName: req.user.email,
        contactEmail: req.user.email,
        category: updated.category,
        rawText: `RFQ #${updated.id} adjudicada (${updated.title}). Coordinar despacho log\xEDstico y reserva de inventario.`,
        metadata: { rfqId: updated.id, originName: "Hub Origen", destinationName: "Destino Patagonia" }
      }).catch((err) => console.warn("ARN award dispatch warning:", err));
      res.json({ success: true, rfq: updated, crossModuleTriggered: true });
    } catch (error) {
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
            socialMedia: `Presupuesto: ${cleanBudget}`
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
            social_media: `Presupuesto: ${cleanBudget}`
          });
          if (!sbErr) persisted = true;
        }
      }
      await recordAutomationEvent("outbound_n8n", "public.rfq_lead.created", persisted ? "saved" : "received", {
        company: cleanCompany,
        email: cleanEmail,
        category: cleanCategory,
        budget: cleanBudget
      });
      const opsTargets = (process.env.ADMIN_EMAILS || "xpatagonia.com@gmail.com").split(",").map((s) => s.trim()).filter(Boolean);
      if ((process.env.RESEND_API_KEY || process.env.SMTP_PASSWORD) && opsTargets.length > 0) {
        try {
          const { sendEmail: sendEmail2 } = await Promise.resolve().then(() => (init_emailService(), emailService_exports));
          await sendEmail2(
            opsTargets.join(","),
            `Nuevo Lead RFQ Home - ${cleanCompany} (${cleanCategory})`,
            `Empresa: ${cleanCompany}
Email: ${cleanEmail}
Categor\xEDa: ${cleanCategory}
Presupuesto: ${cleanBudget}

Detalles:
${cleanDetails}`
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
            details: cleanDetails
          }),
          signal: AbortSignal.timeout(3e3)
        }).catch(() => {
        });
      }
      res.json({ success: true, persisted });
    } catch (error) {
      res.status(500).json({ error: error.message || "Error registrando solicitud" });
    }
  });
  app.get("/api/insights", async (req, res) => {
    try {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
      if (hasDatabaseConfig()) {
        try {
          const rows = await db.select().from(insights).orderBy(desc2(insights.createdAt)).limit(50);
          return res.json({ insights: rows, source: "postgres" });
        } catch {
        }
      }
      const sbAdmin = getSupabaseAdminClient();
      if (sbAdmin) {
        const { data, error } = await sbAdmin.from("insights").select("*").order("created_at", { ascending: false }).limit(50);
        if (!error && Array.isArray(data)) {
          return res.json({
            insights: data.map((row) => ({
              id: row.id,
              title: row.title,
              category: row.category,
              content: row.content,
              author: row.author,
              image: row.image,
              videoUrl: row.video_url,
              sourceUrl: row.source_url,
              createdAt: row.created_at
            })),
            source: "supabase"
          });
        }
      }
      res.json({ insights: [], source: "empty" });
    } catch (error) {
      res.status(500).json({ error: error.message || "Failed to fetch insights" });
    }
  });
  app.post(
    "/api/admin/insights",
    requireAuth,
    requireRoles(["system_admin", "content_editor"]),
    async (req, res) => {
      try {
        const { title, category, content, image, videoUrl, sourceUrl } = req.body || {};
        if (!title || !content) {
          return res.status(400).json({ error: "T\xEDtulo y contenido son obligatorios" });
        }
        const author = req.user?.email || "Redacci\xF3n";
        if (hasDatabaseConfig()) {
          try {
            const inserted = await db.insert(insights).values({
              title,
              category: category || "Actualidad",
              content,
              image: image || null,
              videoUrl: videoUrl || null,
              sourceUrl: sourceUrl || null,
              author
            }).returning();
            return res.json({ success: true, insight: inserted[0] });
          } catch (pgErr) {
            console.warn("PG insight insert fallback to Supabase REST:", pgErr);
          }
        }
        const sbAdmin = getSupabaseAdminClient();
        if (sbAdmin) {
          const { data, error } = await sbAdmin.from("insights").insert({
            title,
            category: category || "Actualidad",
            content,
            image: image || null,
            video_url: videoUrl || null,
            source_url: sourceUrl || null,
            author
          }).select().single();
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
              createdAt: data.created_at
            }
          });
        }
        res.status(500).json({ error: "No hay base de datos configurada para guardar el art\xEDculo." });
      } catch (error) {
        res.status(500).json({ error: error.message || "Error al publicar insight" });
      }
    }
  );
  app.delete(
    "/api/admin/insights/:id",
    requireAuth,
    requireRoles(["system_admin", "content_editor"]),
    async (req, res) => {
      try {
        const insightId = Number(req.params.id);
        if (!Number.isFinite(insightId)) {
          return res.status(400).json({ error: "ID de insight inv\xE1lido" });
        }
        if (hasDatabaseConfig()) {
          try {
            await db.delete(insights).where(eq4(insights.id, insightId));
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
      } catch (error) {
        res.status(500).json({ error: error.message || "Error eliminando insight" });
      }
    }
  );
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
      const { GoogleGenAI: GoogleGenAI2 } = await import("@google/genai");
      const ai = new GoogleGenAI2({
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
      const { GoogleGenAI: GoogleGenAI2 } = await import("@google/genai");
      const ai = new GoogleGenAI2({
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
          const sb = createClient4(supabaseUrl, supabaseAnon, {
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
      const { GoogleGenAI: GoogleGenAI2 } = await import("@google/genai");
      const ai = new GoogleGenAI2({
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
  app.get("/api/market-data", async (req, res) => {
    try {
      const force = req.query.refresh === "1" || req.query.refresh === "true";
      const payload = await getMarketSnapshot(force);
      res.setHeader("Cache-Control", "public, max-age=30, stale-while-revalidate=30");
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
  app.post("/api/logistics/reverse-auction", requireAuth, async (req, res) => {
    try {
      const payload = {
        event: "logistics.reverse_auction.created",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        uid: req.user?.uid,
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
  app.post("/api/crm/sync-odoo", requireAuth, async (req, res) => {
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
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
      res.setHeader("CDN-Cache-Control", "no-store");
      if (hasDatabaseConfig()) {
        try {
          const rows = await db.select().from(siteSettings).where(eq4(siteSettings.key, "global_site_config"));
          if (rows[0]?.value) {
            return res.json({ settings: rows[0].value, source: "postgres" });
          }
        } catch (pgErr) {
          console.warn("site_settings PG read fallback to Supabase REST:", pgErr);
        }
      }
      const sbAdmin = getSupabaseAdminClient();
      if (sbAdmin) {
        const { data, error } = await sbAdmin.from("site_settings").select("value").eq("key", "global_site_config").maybeSingle();
        if (error) {
          console.warn("site_settings Supabase REST read error:", error.message);
        } else if (data?.value) {
          return res.json({ settings: data.value, source: "supabase" });
        }
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
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
        const incoming = req.body || {};
        const hero = incoming.hero || {};
        if (typeof hero.videoUrl === "string" && hero.videoUrl.startsWith("data:") || typeof hero.imageUrl === "string" && hero.imageUrl.startsWith("data:") || typeof hero.posterUrl === "string" && hero.posterUrl.startsWith("data:")) {
          return res.status(400).json({
            error: "No se permite guardar media en base64 dentro de la configuraci\xF3n global. Usa una URL p\xFAblica (Cloudflare R2/Stream) o sube el archivo a Supabase Storage."
          });
        }
        const updatedSettings = {
          ...incoming,
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        const updatedBy = req.user?.email || req.user?.uid || "admin";
        let persistedSource = null;
        const persistenceErrors = [];
        if (hasDatabaseConfig()) {
          const runSiteSettingsUpsert = async () => {
            await pool.query(
              `INSERT INTO public.site_settings ("key", "value", "updated_by", "updated_at")
               VALUES ($1, $2::jsonb, $3, $4)
               ON CONFLICT ("key") DO UPDATE
               SET "value" = EXCLUDED."value",
                   "updated_by" = EXCLUDED."updated_by",
                   "updated_at" = EXCLUDED."updated_at"`,
              ["global_site_config", JSON.stringify(updatedSettings), updatedBy, /* @__PURE__ */ new Date()]
            );
          };
          try {
            await runSiteSettingsUpsert();
            persistedSource = "postgres";
          } catch (pgErr) {
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
              } catch (retryErr) {
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
                updated_at: (/* @__PURE__ */ new Date()).toISOString()
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
            error: `No se pudo persistir en base de datos de producci\xF3n (${persistenceErrors.join(" | ")})`
          });
        }
        res.json({ success: true, persistedSource, settings: updatedSettings });
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
        const safeName = `hero-${Date.now()}-${crypto2.randomBytes(4).toString("hex")}${cleanExt}`;
        const rawBase64 = base64Data.includes(",") ? base64Data.split(",")[1] : base64Data;
        const buffer = Buffer.from(rawBase64, "base64");
        const resolvedMime = mimeType || "application/octet-stream";
        const sbAdmin = getSupabaseAdminClient();
        if (sbAdmin) {
          const storagePath = `hero/${safeName}`;
          const { error: uploadError } = await sbAdmin.storage.from("site-media").upload(storagePath, buffer, {
            contentType: resolvedMime,
            upsert: true
          });
          if (uploadError) {
            return res.status(500).json({
              error: `Error subiendo a Supabase Storage (site-media): ${uploadError.message}`
            });
          }
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
        if (process.env.VERCEL) {
          return res.status(500).json({
            error: "SUPABASE_SERVICE_ROLE_KEY o bucket 'site-media' no disponibles en producci\xF3n. Configura Supabase Storage o pega la URL p\xFAblica de Cloudflare R2/Stream."
          });
        }
        const targetPath = path.join(UPLOADS_DIR, safeName);
        fs.writeFileSync(targetPath, buffer);
        return res.json({
          success: true,
          url: `/uploads/${safeName}`,
          storage: "local",
          mimeType: resolvedMime,
          sizeBytes: buffer.length
        });
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
  registerArnAndModuleRoutes(app, recordAutomationEvent);
  registerWorkerAndWebhookRoutes(app);
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
