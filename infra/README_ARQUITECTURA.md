# Arquitectura Híbrida Costo $0 — xPatagonia.online

Esta arquitectura aprovecha la infraestructura que ya está en marcha sin reescribir el portal a otro framework ni pagar sobrecostos por APIs de mapas o SaaS por usuario:

## Mapa de Nodos y Subdominios

| Subdominio / Servicio | Dónde corre | Rol exacto |
| :--- | :--- | :--- |
| **`xpatagonia.online`** (`www.xpatagonia.online`) | **Cloudflare Pages** (React + Vite SPA) | Portal B2B, Directorio por suscripción, Insights, Logística, CRM y Messenger. Uso comercial 100% habilitado a $0. |
| **`api.xpatagonia.online`** | **Supermicro Proxmox (LXC/Docker)** vía Cloudflare Tunnel | Backend Node (`server.ts`): Proxy IMAP/SMTP, Gemini IA, `/api/market-data`, Proxy OSRM (`/api/logistics/route`) y Webhooks a `n8n`. |
| **`mail.xpatagonia.online`** | **Cloud VPS CyberPanel** (actual) | Servidor de correo corporativo (`IMAP_HOST=mail.xpatagonia.online`, `SMTP_HOST=mail.xpatagonia.online`). El contenedor Node en Proxmox se conecta directo a tu CyberPanel. |
| **`rutas.xpatagonia.online`** | **Supermicro Proxmox** (`osrm-argentina` + `vroom-patagonia`) | Cálculo ilimitado de kilómetros, tiempos y matrices de consolidación LTL sobre OpenStreetMap (costo $0 vs Google Maps). |
| **`flujos.xpatagonia.online`** | **Supermicro Proxmox** (`n8n`) | Orquestador de eventos: recibe RFQs / cierres de carga desde `api.xpatagonia.online` y los inyecta en **Odoo ERP (VPS)** para facturación ARCA/AFIP. |
| **Base de Datos & Auth** | **Supabase Cloud (Free Tier)** | Auth multiempresa, RLS, `company_profiles` con `pgvector` (ADN Empresarial) y `logistics_loads`. |

---

## Paso a Paso para Configurar Cloudflare Pages (Sin migrar a Next.js)

1. En **Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git**.
2. Selecciona el repositorio `xpatagonia/xpta` (rama `main`).
3. **Configuración de Build**:
   - **Framework preset**: `Vite` (o `None`)
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. **Variables de Entorno en Cloudflare Pages**:
   - `NODE_VERSION` = `20`
   - `VITE_API_URL` = `https://api.xpatagonia.online`
   - `VITE_OSRM_URL` = `https://rutas.xpatagonia.online`
   - `VITE_SUPABASE_URL` = *(tu URL de Supabase)*
   - `VITE_SUPABASE_ANON_KEY` = *(tu Anon Key de Supabase)*
5. El archivo `public/_redirects` (`/* /index.html 200`) ya está incluido para que todas las rutas SPA funcionen al recargar.

---

## Paso a Paso para Levantar el Supermicro Proxmox (`infra/docker-compose.supermicro.yml`)

1. Pre-procesar el mapa de Argentina una sola vez en tu carpeta `infra/osrm-data`:
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
3. Copia tu `.env` con las credenciales de **CyberPanel (`IMAP_HOST=mail.xpatagonia.online`, `SMTP_HOST=mail.xpatagonia.online`)**, Supabase y `CLOUDFLARE_TUNNEL_TOKEN`, y levanta el stack:
   ```bash
   docker compose -f infra/docker-compose.supermicro.yml up -d
   ```
