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

