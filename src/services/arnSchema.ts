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
    `);
    arnTablesEnsured = true;
  } catch (err) {
    console.warn("[ARN_SCHEMA] Table bootstrap skipped or deferred:", err);
  }
}
