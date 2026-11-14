import { pool, hasDatabaseConfig } from "../db/index.ts";

let arnTablesEnsured = false;

export async function ensureProductionTables(): Promise<void> {
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
        corridor text DEFAULT 'RN 3 / Patagónica',
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
    `);
    arnTablesEnsured = true;
  } catch (err) {
    console.warn("[ARN_SCHEMA] Table bootstrap skipped or deferred:", err);
  }
}
