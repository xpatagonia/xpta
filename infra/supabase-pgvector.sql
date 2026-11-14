-- Ejecutar en el SQL Editor de tu proyecto Supabase (Free Tier)
-- Habilita el motor de "ADN Empresarial" (pgvector) y radios geográficos (PostGIS)

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Ampliar company_profiles con ADN Comercial Vectorial y Coordenadas
ALTER TABLE IF EXISTS public.company_profiles
  ADD COLUMN IF NOT EXISTS adn_ofrece text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS adn_demanda text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS corredores_logisticos text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS base_lat double precision,
  ADD COLUMN IF NOT EXISTS base_lng double precision,
  ADD COLUMN IF NOT EXISTS geo_point geography(Point, 4326),
  ADD COLUMN IF NOT EXISTS adn_embedding vector(768);

-- Índice HNSW ultrarrápido para matching semántico entre proveedores del Norte y Patagonia
CREATE INDEX IF NOT EXISTS idx_company_adn_embedding
  ON public.company_profiles
  USING hnsw (adn_embedding vector_cosine_ops);

-- Índice espacial para búsqueda de camiones y depósitos por corredor vial
CREATE INDEX IF NOT EXISTS idx_company_geo_point
  ON public.company_profiles
  USING GIST (geo_point);

-- 2. Tabla de Bolsa de Cargas & Retornos Vacíos (Licitación Inversa LTL)
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

-- 3. Función RPC para matching semántico de ADN Empresarial desde Supabase
CREATE OR REPLACE FUNCTION public.match_adn_empresas(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.45,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id integer,
  user_uid text,
  company_name text,
  city text,
  province text,
  industry text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    cp.id,
    cp.user_uid,
    cp.company_name,
    cp.city,
    cp.province,
    cp.industry,
    1 - (cp.adn_embedding <=> query_embedding) AS similarity
  FROM public.company_profiles cp
  WHERE cp.adn_embedding IS NOT NULL
    AND 1 - (cp.adn_embedding <=> query_embedding) > match_threshold
  ORDER BY cp.adn_embedding <=> query_embedding
  LIMIT match_count;
$$;

-- 4. Control Global del Sitio & Hero Multimedia (CMS)
CREATE TABLE IF NOT EXISTS public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by text,
  updated_at timestamptz DEFAULT now()
);

-- 5. Bitácora Bidireccional n8n <-> Odoo
CREATE TABLE IF NOT EXISTS public.automation_logs (
  id bigserial PRIMARY KEY,
  direction text NOT NULL CHECK (direction IN ('outbound_n8n', 'inbound_odoo')),
  event text NOT NULL,
  status text NOT NULL DEFAULT 'processed',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- 6. Bucket de Storage para Foto/Video del Hero y Logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-media', 'site-media', true)
ON CONFLICT (id) DO NOTHING;

-- 7. Seguridad RLS (Público vs. Miembro / Admin)
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_loads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_settings_public_read" ON public.site_settings;
CREATE POLICY "site_settings_public_read"
  ON public.site_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "logistics_loads_authenticated_read" ON public.logistics_loads;
CREATE POLICY "logistics_loads_authenticated_read"
  ON public.logistics_loads FOR SELECT
  USING (auth.role() = 'authenticated' OR status = 'open');

-- 8. ARN IA Híbrido (Reglas de Autonomía, Oportunidades y Cola de Aprobación / Ejecución)
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

-- 9. B2B Messenger Persistente
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

-- 10. Productos Unificados B2B y Almacenamiento WMS
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

ALTER TABLE public.arn_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arn_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arn_actions_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "arn_rules_owner_policy" ON public.arn_rules;
CREATE POLICY "arn_rules_owner_policy"
  ON public.arn_rules FOR ALL
  USING (auth.uid()::text = user_uid)
  WITH CHECK (auth.uid()::text = user_uid);

DROP POLICY IF EXISTS "arn_opportunities_owner_policy" ON public.arn_opportunities;
CREATE POLICY "arn_opportunities_owner_policy"
  ON public.arn_opportunities FOR ALL
  USING (auth.uid()::text = owner_uid)
  WITH CHECK (auth.uid()::text = owner_uid);

DROP POLICY IF EXISTS "arn_actions_queue_owner_policy" ON public.arn_actions_queue;
CREATE POLICY "arn_actions_queue_owner_policy"
  ON public.arn_actions_queue FOR ALL
  USING (auth.uid()::text = owner_uid)
  WITH CHECK (auth.uid()::text = owner_uid);

-- 11. Organizaciones PyME Multi-Usuario (2 Gratis / 5 Pro / 10 Corporativo) y Membresía Logística Aparte
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
  organization_id integer NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_uid text NOT NULL UNIQUE,
  email text NOT NULL,
  full_name text,
  org_role text NOT NULL DEFAULT 'comercial',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.org_invitations (
  id serial PRIMARY KEY,
  organization_id integer NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  org_role text NOT NULL DEFAULT 'comercial',
  invited_by_uid text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE IF EXISTS public.contacts
  ADD COLUMN IF NOT EXISTS organization_id integer,
  ADD COLUMN IF NOT EXISTS arn_opportunity_id integer,
  ADD COLUMN IF NOT EXISTS ai_score integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lead_stage text DEFAULT 'nuevo',
  ADD COLUMN IF NOT EXISTS last_arn_sync_at timestamptz,
  ADD COLUMN IF NOT EXISTS odoo_synced boolean DEFAULT false;

ALTER TABLE IF EXISTS public.arn_opportunities
  ADD COLUMN IF NOT EXISTS organization_id integer,
  ADD COLUMN IF NOT EXISTS contact_id integer;

ALTER TABLE IF EXISTS public.arn_actions_queue
  ADD COLUMN IF NOT EXISTS organization_id integer;

-- 12. Gestión y Control de Flota + Contratos de Transporte (Membresía Logística)
CREATE TABLE IF NOT EXISTS public.fleet_vehicles (
  id serial PRIMARY KEY,
  organization_id integer NOT NULL,
  owner_uid text NOT NULL,
  name text NOT NULL,
  plate text NOT NULL,
  vehicle_type text DEFAULT 'Semirremolque 28t',
  capacity_tons integer DEFAULT 28,
  corridor text DEFAULT 'RN 3 / Patagónica',
  vtv_expiry text,
  insurance_expiry text,
  status text DEFAULT 'disponible',
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
  status text DEFAULT 'activo',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.logistics_contracts (
  id serial PRIMARY KEY,
  organization_id integer NOT NULL,
  owner_uid text NOT NULL,
  load_id text NOT NULL,
  origin_name text NOT NULL,
  destination_name text NOT NULL,
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

