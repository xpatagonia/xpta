# Worker 24/7 Docker + n8n en tu VPS (xPatagonia)

Este módulo agrega ejecución continua 24/7 en tu VPS sin tocar la arquitectura serverless de **Vercel + Supabase**:

- **Escucha IMAP en tiempo real (`IMAP IDLE`):** ante cada correo entrante en `mail.xpatagonia.online`, deduplica por `UID` en Postgres (`processed_email_uids`), resuelve la organización PyME (`+org<ID>@` o contacto existente), ejecuta **ARN IA Híbrido** y crea/vincula el **Contacto CRM**.
- **Cola de reintentos con backoff exponencial:** reintenta eventos `outbound_n8n` en `automation_logs` (`1m → 5m → 15m → 30m → 60m`) si n8n/Odoo estuvo caído temporalmente.
- **Alertas de Flota (VTV / Seguros):** revisa cada 6 horas las unidades con vencimiento dentro de los próximos 15 días o vencidas y avisa **una única vez por vencimiento** (`fleet_expiry_alerts`) al administrador vía Resend.

---

## Opción A — Levantar el Worker Docker en el VPS (Recomendado)

```bash
git clone https://github.com/xpatagonia/xpta.git
cd xpta
cp infra/vps-worker/.env.worker.example infra/vps-worker/.env.worker
# Completar DATABASE_URL (Pooler 6543), GEMINI_API_KEY, RESEND_API_KEY, IMAP_PASSWORD, etc.
nano infra/vps-worker/.env.worker

docker compose -f infra/vps-worker/docker-compose.worker.yml up -d --build
docker logs -f xpatagonia-vps-worker
```

Para actualizar cuando hacés push a `main`:
```bash
git pull origin main
docker compose -f infra/vps-worker/docker-compose.worker.yml up -d --build
```

---

## Opción B — Orquestar desde n8n (`flujos.xpatagonia.online`)

Si preferís disparar estos flujos visualmente desde tu instancia **n8n**:
1. Definí `CRON_SECRET` o `N8N_SHARED_SECRET` en **Vercel** y en tu entorno de **n8n**.
2. Importá `infra/vps-worker/n8n-imap-arn-workflow.json` en n8n.
3. Configurá las credenciales IMAP (`mail.xpatagonia.online:993`, SSL/TLS) en el nodo **Email Trigger**.
4. Los tres endpoints seguros disponibles en `https://www.xpatagonia.online` son:
   - `POST /api/webhooks/n8n/imap-inbound`
   - `POST /api/webhooks/n8n/retry-queue`
   - `POST /api/webhooks/n8n/fleet-alerts`
