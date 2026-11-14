# Arquitectura Híbrida Costo $0 — xPatagonia.online

Esta arquitectura separa la operación en producción inmediata (Nube + Supabase + CyberPanel) del despliegue final de infraestructura propia en Supermicro Proxmox:

## Fases de Infraestructura

### Fase 1 — Producción Actual (Vercel + Supabase + Resend + CyberPanel)
- **Portal Web & Backend Serverless Unificados (`xpatagonia.online` en Vercel)**:
  - Frontend SPA: React 19 + Vite (`dist/`).
  - Backend API (`/api/*`): Express ejecutado como Vercel Serverless Function vía `api/index.ts` + `vercel.json` (mismo dominio que el frontend, dejar `VITE_API_URL` vacío en Vercel).
- **Base de Datos, Auth, Vector ADN y Media Storage**: **Supabase Cloud** (`PostgreSQL` Pooler 6543 + `pgvector` + `PostGIS` + Bucket `site-media`).
- **Correo Saliente y Entrante**: **Resend HTTPS** (`RESEND_API_KEY`, `notificaciones@xpatagonia.online`) para envíos + **CyberPanel** (`mail.xpatagonia.online`, IMAP 993) para lectura de bandeja.
- **Ruteo Vial**: Fallback automático hacia OpenStreetMap OSRM público (`router.project-osrm.org`) + Modelo Vial RN mientras `OSRM_BASE_URL` no esté configurado.
- **IA Generativa**: Gemini API (`gemini-4-hydrogen`) ejecutada 100% en backend (`src/server/createApp.ts`).

### Fase Final — Nodos Dedicados en Supermicro Proxmox (Al cierre del proyecto)
| Subdominio / Servicio | Dónde corre | Rol exacto |
| :--- | :--- | :--- |
| **`api.xpatagonia.online`** | **Supermicro Proxmox (Docker)** vía Cloudflare Tunnel | Backend Node (`server.ts`) conectado directo a red interna con OSRM y n8n. |
| **`rutas.xpatagonia.online`** | **Supermicro Proxmox** (`osrm-argentina` + `vroom-patagonia`) | Cálculo ilimitado de kilómetros, tiempos y consolidación LTL sobre OpenStreetMap Argentina. |
| **`flujos.xpatagonia.online`** | **Supermicro Proxmox** (`n8n`) | Orquestador de eventos bidireccional hacia **Odoo ERP (VPS)** para facturación ARCA/AFIP. |

---

## Despliegue en Vercel (Producción Actual)

1. Conecta el repositorio `xpatagonia/xpta` (rama `main`) en **Vercel Dashboard**.
2. **Build & Output Settings**:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. **Environment Variables en Vercel**:
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` (Pooler Supabase `:6543`), `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `GEMINI_API_KEY`, `CRON_SECRET`, `ADMIN_EMAILS`.
   - **Importante:** deja `VITE_API_URL` **vacío** en Vercel para que `/api/*` apunte directo a `api/index.ts` en el mismo dominio (`xpatagonia.online`).

---

## Despliegue Final en Supermicro Proxmox (`infra/docker-compose.supermicro.yml`)

1. Pre-procesar el mapa de Argentina una sola vez en `infra/osrm-data`:
   ```bash
   mkdir -p infra/osrm-data && cd infra/osrm-data
   wget https://download.geofabrik.de/south-america/argentina-latest.osm.pbf
   docker run -t -v "${PWD}:/data" ghcr.io/project-osrm/osrm-backend osrm-extract -p /opt/car.lua /data/argentina-latest.osm.pbf
   docker run -t -v "${PWD}:/data" ghcr.io/project-osrm/osrm-backend osrm-partition /data/argentina-latest.osrm
   docker run -t -v "${PWD}:/data" ghcr.io/project-osrm/osrm-backend osrm-customize /data/argentina-latest.osrm
   ```
2. En **Cloudflare Zero Trust → Networks → Tunnels**, crea un túnel y apunta:
   - `api.xpatagonia.online` → `http://xpatagonia-api:3000`
   - `rutas.xpatagonia.online` → `http://osrm-argentina:5000`
   - `flujos.xpatagonia.online` → `http://n8n:5678`
3. Configura `.env` (CyberPanel + Supabase + `GEMINI_API_KEY` + `CLOUDFLARE_TUNNEL_TOKEN`) y levanta el stack:
   ```bash
   docker compose -f infra/docker-compose.supermicro.yml up -d
   ```
