import { relations } from 'drizzle-orm';
import { pgTable, serial, text, timestamp, integer, jsonb, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  cuit: text('cuit'),
  category: text('category'),
  isEmailVerified: boolean('is_email_verified').default(false),
  lastLogin: timestamp('last_login'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const companyProfiles = pgTable('company_profiles', {
  id: serial('id').primaryKey(),
  userId: text('user_uid').references(() => users.uid).notNull().unique(),
  companyName: text('company_name'),
  legalName: text('legal_name'),
  cuit: text('cuit'),
  website: text('website'),
  industry: text('industry'),
  yearFounded: text('year_founded'),
  employeeCount: text('employee_count'),
  description: text('description'),
  certifications: jsonb('certifications').default('[]'),
  services: jsonb('services').default('[]'),
  city: text('city'),
  province: text('province'),
  address: text('address'),
  phone: text('phone'),
  email: text('email'),
  whatsapp: text('whatsapp'),
  contactName: text('contact_name'),
  contactRole: text('contact_role'),
  bankName: text('bank_name'),
  cbu: text('cbu'),
  alias: text('alias'),
  paymentTerms: text('payment_terms'),
  billingEmail: text('billing_email'),
  logoUrl: text('logo_url'),
  bannerUrl: text('banner_url'),
  presentationUrl: text('presentation_url'),
  
  // Innovative Trust & AI Features
  trustScore: integer('trust_score').default(50), // 0-100 AI-calculated score based on profile completion and successful transactions
  verificationStatus: text('verification_status').default('unverified'), // unverified, pending, verified (KYC/KYB)
  networkingTags: jsonb('networking_tags').default('[]'), // AI extracted interests/capabilities for smart B2B matchmaking
  sustainabilityIndex: text('sustainability_index'), // ESG categorization, e.g., 'Eco-Level 1'

  updatedAt: timestamp('updated_at').defaultNow(),
});

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  userId: text('user_uid'), // Not making it NOT NULL to allow loose creation from the mock initially
  sku: text('sku'),
  name: text('name').notNull(),
  category: text('category').notNull(),
  subcategory: text('subcategory'),
  brand: text('brand'),
  model: text('model'),
  condition: text('condition'),
  year: text('year'),
  usageHours: text('usage_hours'),
  warranty: text('warranty'),
  priceBase: text('price_base'),
  priceWholesale: text('price_wholesale'),
  stock: text('stock'),
  moq: text('moq'),
  description: text('description'),
  certifications: jsonb('certifications').default('[]'),
  paymentMethods: jsonb('payment_methods').default('[]'),
  shippingConditions: jsonb('shipping_conditions').default('[]'),
  leadTime: text('lead_time'),
  location: text('location'),
  supplier: text('supplier'),
  videoUrl: text('video_url'),
  taxRate: text('tax_rate'),
  image: text('image'),
  status: text('status').default('active'),
  companyId: text('company_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const rfqs = pgTable('rfqs', {
  id: serial('id').primaryKey(),
  userId: text('user_uid'),
  title: text('title').notNull(),
  category: text('category').notNull(),
  priority: text('priority').notNull(),
  description: text('description').notNull(),
  status: text('status').default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const contacts = pgTable('contacts', {
  id: serial('id').primaryKey(),
  userId: text('user_uid'),
  organizationId: integer('organization_id'),
  entityType: text('entity_type').default('contact'),
  name: text('name').notNull(),
  company: text('company'),
  role: text('role'),
  email: text('email'),
  phone: text('phone'),
  type: text('type'),
  status: text('status'),
  website: text('website'),
  cuitRut: text('cuit_rut'),
  socialMedia: text('social_media'),
  industry: text('industry'),
  location: text('location'),
  arnOpportunityId: integer('arn_opportunity_id'),
  aiScore: integer('ai_score').default(0),
  leadStage: text('lead_stage').default('nuevo'),
  lastArnSyncAt: timestamp('last_arn_sync_at'),
  odooSynced: boolean('odoo_synced').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const insights = pgTable('insights', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  content: text('content').notNull(),
  author: text('author').notNull().default('Redacción'),
  image: text('image'),
  videoUrl: text('video_url'),
  sourceUrl: text('source_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const inventoryItems = pgTable('inventory_items', {
  id: serial('id').primaryKey(),
  userId: text('user_uid'),
  organizationId: integer('organization_id'),
  sku: text('sku'),
  name: text('name'),
  category: text('category'),
  quantity: integer('quantity').default(0),
  location: text('location'),
  status: text('status'),
  lastUpdated: timestamp('last_updated').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const moduleRequests = pgTable('module_requests', {
  id: serial('id').primaryKey(),
  userId: text('user_uid'),
  userEmail: text('user_email'),
  moduleId: text('module_id'),
  moduleName: text('module_name'),
  status: text('status').default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ==========================================
// ROLES & PERMISSIONS (RBAC)
// ==========================================

export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(), // e.g., 'system_admin', 'company_admin', 'buyer', 'vendor', 'investor'
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const permissions = pgTable('permissions', {
  id: serial('id').primaryKey(),
  action: text('action').notNull().unique(), // e.g., 'rfqs:create', 'analytics:view', 'memberships:manage'
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const rolePermissions = pgTable('role_permissions', {
  roleId: integer('role_id').references(() => roles.id).notNull(),
  permissionId: integer('permission_id').references(() => permissions.id).notNull(),
});

export const userRoles = pgTable('user_roles', {
  userId: text('user_uid').references(() => users.uid).notNull(),
  roleId: integer('role_id').references(() => roles.id).notNull(),
});

// ==========================================
// MEMBERSHIPS & SUBSCRIPTIONS
// ==========================================

export const memberships = pgTable('memberships', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(), // e.g., 'Basic', 'Pro Industria', 'Corporativo', 'Logística & Flota'
  tier: integer('tier').notNull(), // 1, 2, 3
  price: integer('price').notNull().default(0), // Monthly price in ARS
  features: jsonb('features').default('[]'), // List of features enabled
  maxProducts: integer('max_products').default(10),
  maxRfqsMonthly: integer('max_rfqs_monthly').default(3),
  aiAccessLevel: text('ai_access_level').default('standard'), // 'standard', 'advanced', 'predictive'
  createdAt: timestamp('created_at').defaultNow(),
});

export const userMemberships = pgTable('user_memberships', {
  id: serial('id').primaryKey(),
  userId: text('user_uid').references(() => users.uid).notNull(),
  membershipId: integer('membership_id').references(() => memberships.id).notNull(),
  status: text('status').default('active'), // active, cancelled, expired, past_due
  startDate: timestamp('start_date').defaultNow(),
  endDate: timestamp('end_date'), // Null means lifetime/auto-renews until cancelled
  autoRenew: boolean('auto_renew').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// ==========================================
// ORGANIZACIONES MULTI-USUARIO (2 / 5 / 10 ASIENTOS)
// ==========================================

export const organizations = pgTable('organizations', {
  id: serial('id').primaryKey(),
  ownerUid: text('owner_uid').notNull().unique(),
  name: text('name').notNull(),
  planSlug: text('plan_slug').notNull().default('gratis'), // 'gratis' (2) | 'pro' (5) | 'corporativo' (10)
  seatLimit: integer('seat_limit').notNull().default(2),
  logisticsPlanActive: boolean('logistics_plan_active').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const orgMembers = pgTable('org_members', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').notNull(),
  userUid: text('user_uid').notNull(),
  email: text('email').notNull(),
  orgRole: text('org_role').notNull().default('comercial'), // 'company_admin' | 'comercial' | 'operador'
  status: text('status').notNull().default('active'),
  joinedAt: timestamp('joined_at').defaultNow(),
});

export const orgInvitations = pgTable('org_invitations', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').notNull(),
  email: text('email').notNull(),
  orgRole: text('org_role').notNull().default('comercial'),
  invitedByUid: text('invited_by_uid').notNull(),
  token: text('token').notNull(),
  status: text('status').notNull().default('pending'), // 'pending' | 'accepted' | 'revoked'
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ==========================================
// GLOBAL CMS & AUTOMATION LOGS (FASES 1 & 4)
// ==========================================

export const siteSettings = pgTable('site_settings', {
  key: text('key').primaryKey(), // e.g., 'global_site_config'
  value: jsonb('value').notNull(),
  updatedBy: text('updated_by'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const automationLogs = pgTable('automation_logs', {
  id: serial('id').primaryKey(),
  direction: text('direction').notNull(), // 'outbound_n8n' | 'inbound_odoo'
  event: text('event').notNull(),
  status: text('status').notNull().default('processed'),
  payload: jsonb('payload').default('{}'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ==========================================
// ARN IA (AUTONOMOUS RELATIONSHIP & NETWORK) + B2B CHAT
// ==========================================

export const arnRules = pgTable('arn_rules', {
  userId: text('user_uid').primaryKey(),
  organizationId: integer('organization_id'),
  mode: text('mode').notNull().default('hybrid'), // 'hybrid' | 'manual' | 'auto'
  autoApproveMaxUsd: integer('auto_approve_max_usd').notNull().default(1500),
  minConfidenceScore: integer('min_confidence_score').notNull().default(82),
  autoSendEmails: boolean('auto_send_emails').notNull().default(false),
  autoCreateLogistics: boolean('auto_create_logistics').notNull().default(true),
  autoReserveInventory: boolean('auto_reserve_inventory').notNull().default(true),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const arnOpportunities = pgTable('arn_opportunities', {
  id: serial('id').primaryKey(),
  ownerUid: text('owner_uid').notNull(),
  organizationId: integer('organization_id'),
  contactId: integer('contact_id'),
  companyName: text('company_name').notNull(),
  contactName: text('contact_name'),
  contactEmail: text('contact_email'),
  cuit: text('cuit'),
  category: text('category').default('General'),
  corridor: text('corridor'),
  source: text('source').notNull().default('manual'), // 'rfq' | 'email_imap' | 'home_lead' | 'directory' | 'messenger' | 'crm_contact'
  stage: text('stage').notNull().default('detected'), // 'detected' | 'qualified' | 'quoted' | 'negotiating' | 'awarded' | 'archived'
  aiScore: integer('ai_score').notNull().default(70),
  estimatedAmountUsd: integer('estimated_amount_usd').notNull().default(0),
  urgency: text('urgency').notNull().default('medium'),
  summary: text('summary'),
  recommendedAction: text('recommended_action'),
  rawContext: jsonb('raw_context').default('{}'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const arnActionsQueue = pgTable('arn_actions_queue', {
  id: serial('id').primaryKey(),
  ownerUid: text('owner_uid').notNull(),
  organizationId: integer('organization_id'),
  opportunityId: integer('opportunity_id'),
  actionType: text('action_type').notNull(), // 'send_quote_email' | 'send_followup_email' | 'create_logistics_load' | 'reserve_inventory' | 'notify_providers'
  title: text('title').notNull(),
  targetEmail: text('target_email'),
  draftSubject: text('draft_subject'),
  draftBody: text('draft_body'),
  estimatedAmountUsd: integer('estimated_amount_usd').notNull().default(0),
  confidenceScore: integer('confidence_score').notNull().default(75),
  executionMode: text('execution_mode').notNull().default('manual_approval'), // 'auto_approved' | 'manual_approval'
  status: text('status').notNull().default('pending_approval'), // 'pending_approval' | 'approved' | 'executed' | 'dismissed' | 'failed'
  metadata: jsonb('metadata').default('{}'),
  executedAt: timestamp('executed_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const chatMessages = pgTable('chat_messages', {
  id: serial('id').primaryKey(),
  channelId: text('channel_id').notNull(),
  senderUid: text('sender_uid').notNull(),
  senderName: text('sender_name').notNull(),
  senderCompany: text('sender_company'),
  text: text('text').notNull(),
  msgType: text('msg_type').notNull().default('text'),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ==========================================
// MEMBRESÍA LOGÍSTICA: FLOTA, CHOFERES Y CONTRATOS
// ==========================================

export const fleetVehicles = pgTable('fleet_vehicles', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').notNull(),
  ownerUid: text('owner_uid').notNull(),
  name: text('name').notNull(),
  plate: text('plate').notNull(),
  vehicleType: text('vehicle_type').notNull().default('Semirremolque 28t'),
  capacityTons: integer('capacity_tons').notNull().default(28),
  corridor: text('corridor').default('RN 3 / Patagónica'),
  vtvExpiry: text('vtv_expiry'),
  insuranceExpiry: text('insurance_expiry'),
  status: text('status').notNull().default('disponible'), // 'disponible' | 'en_ruta' | 'mantenimiento'
  gpsLabel: text('gps_label'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const fleetDrivers = pgTable('fleet_drivers', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').notNull(),
  ownerUid: text('owner_uid').notNull(),
  fullName: text('full_name').notNull(),
  dni: text('dni'),
  lintiLicense: text('linti_license'),
  phone: text('phone'),
  assignedVehicleId: integer('assigned_vehicle_id'),
  status: text('status').notNull().default('disponible'), // 'disponible' | 'en_viaje' | 'licencia'
  createdAt: timestamp('created_at').defaultNow(),
});

export const logisticsContracts = pgTable('logistics_contracts', {
  id: serial('id').primaryKey(),
  loadId: text('load_id').notNull(),
  originName: text('origin_name').notNull(),
  destinationName: text('destination_name').notNull(),
  shipperOrgId: integer('shipper_org_id'),
  shipperUid: text('shipper_uid'),
  carrierOrgId: integer('carrier_org_id').notNull(),
  carrierUid: text('carrier_uid').notNull(),
  carrierName: text('carrier_name').notNull(),
  vehicleId: integer('vehicle_id'),
  driverId: integer('driver_id'),
  agreedPriceArs: integer('agreed_price_ars').notNull().default(0),
  status: text('status').notNull().default('ofertado'), // 'ofertado' | 'adjudicado' | 'en_transito' | 'entregado' | 'cancelado'
  trackingCode: text('tracking_code'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
