CREATE TABLE "company_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_uid" text NOT NULL,
	"company_name" text,
	"legal_name" text,
	"cuit" text,
	"website" text,
	"industry" text,
	"year_founded" text,
	"employee_count" text,
	"description" text,
	"certifications" jsonb DEFAULT '[]',
	"services" jsonb DEFAULT '[]',
	"city" text,
	"province" text,
	"address" text,
	"phone" text,
	"email" text,
	"whatsapp" text,
	"contact_name" text,
	"contact_role" text,
	"bank_name" text,
	"cbu" text,
	"alias" text,
	"payment_terms" text,
	"billing_email" text,
	"logo_url" text,
	"banner_url" text,
	"presentation_url" text,
	"trust_score" integer DEFAULT 50,
	"verification_status" text DEFAULT 'unverified',
	"networking_tags" jsonb DEFAULT '[]',
	"sustainability_index" text,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "company_profiles_user_uid_unique" UNIQUE("user_uid")
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_uid" text,
	"entity_type" text DEFAULT 'contact',
	"name" text NOT NULL,
	"company" text,
	"role" text,
	"email" text,
	"phone" text,
	"type" text,
	"status" text,
	"website" text,
	"cuit_rut" text,
	"social_media" text,
	"industry" text,
	"location" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "insights" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"content" text NOT NULL,
	"author" text DEFAULT 'Redacción' NOT NULL,
	"image" text,
	"video_url" text,
	"source_url" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "inventory_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_uid" text,
	"sku" text,
	"name" text,
	"category" text,
	"quantity" integer DEFAULT 0,
	"location" text,
	"status" text,
	"last_updated" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"tier" integer NOT NULL,
	"price" integer DEFAULT 0 NOT NULL,
	"features" jsonb DEFAULT '[]',
	"max_products" integer DEFAULT 10,
	"max_rfqs_monthly" integer DEFAULT 3,
	"ai_access_level" text DEFAULT 'standard',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "module_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_uid" text,
	"user_email" text,
	"module_id" text,
	"module_name" text,
	"status" text DEFAULT 'pending',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "permissions_action_unique" UNIQUE("action")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_uid" text,
	"sku" text,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"subcategory" text,
	"brand" text,
	"model" text,
	"condition" text,
	"year" text,
	"usage_hours" text,
	"warranty" text,
	"price_base" text,
	"price_wholesale" text,
	"stock" text,
	"moq" text,
	"description" text,
	"certifications" jsonb DEFAULT '[]',
	"payment_methods" jsonb DEFAULT '[]',
	"shipping_conditions" jsonb DEFAULT '[]',
	"lead_time" text,
	"location" text,
	"supplier" text,
	"video_url" text,
	"tax_rate" text,
	"image" text,
	"status" text DEFAULT 'active',
	"company_id" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rfqs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_uid" text,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"priority" text NOT NULL,
	"description" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role_id" integer NOT NULL,
	"permission_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "user_memberships" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_uid" text NOT NULL,
	"membership_id" integer NOT NULL,
	"status" text DEFAULT 'active',
	"start_date" timestamp DEFAULT now(),
	"end_date" timestamp,
	"auto_renew" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"user_uid" text NOT NULL,
	"role_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"email" text NOT NULL,
	"cuit" text,
	"category" text,
	"is_email_verified" boolean DEFAULT false,
	"last_login" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_uid_unique" UNIQUE("uid")
);
--> statement-breakpoint
ALTER TABLE "company_profiles" ADD CONSTRAINT "company_profiles_user_uid_users_uid_fk" FOREIGN KEY ("user_uid") REFERENCES "public"."users"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_memberships" ADD CONSTRAINT "user_memberships_user_uid_users_uid_fk" FOREIGN KEY ("user_uid") REFERENCES "public"."users"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_memberships" ADD CONSTRAINT "user_memberships_membership_id_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_uid_users_uid_fk" FOREIGN KEY ("user_uid") REFERENCES "public"."users"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;