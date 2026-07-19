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
  name: text('name').notNull(), // e.g., 'Basic', 'Premium', 'Enterprise'
  tier: integer('tier').notNull(), // 1, 2, 3
  price: integer('price').notNull().default(0), // Monthly price in cents/pesos
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
