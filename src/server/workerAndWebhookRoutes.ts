import crypto from "crypto";
import type { Express, Request, Response, NextFunction } from "express";
import {
  processInboundEmailWithArn,
  flushAutomationRetryQueue,
  checkAndNotifyFleetExpiries,
} from "../services/vpsWorkerService.ts";

function extractIncomingSecret(req: Request): string {
  const authHeader = String(req.headers.authorization || "");
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length).trim();
  }
  const headerSecret =
    req.headers["x-n8n-secret"] ||
    req.headers["x-cron-secret"] ||
    req.headers["x-worker-secret"] ||
    "";
  return String(headerSecret).trim();
}

function safeSecretEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function requireWebhookSecret(req: Request, res: Response, next: NextFunction) {
  const token = extractIncomingSecret(req);
  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Missing worker/n8n Bearer or secret header" });
  }
  const configuredSecrets = [
    process.env.CRON_SECRET,
    process.env.N8N_SHARED_SECRET,
    process.env.ODOO_WEBHOOK_SECRET,
  ]
    .map((s) => String(s || "").trim())
    .filter(Boolean);

  if (configuredSecrets.length === 0 || !configuredSecrets.some((s) => safeSecretEquals(s, token))) {
    return res.status(403).json({ error: "Forbidden: Invalid worker/n8n secret" });
  }
  next();
}

export function registerWorkerAndWebhookRoutes(app: Express) {
  // Permite que n8n Email Trigger (IMAP) envíe correos entrantes directo al motor ARN IA + CRM con deduplicación
  app.post(
    "/api/webhooks/n8n/imap-inbound",
    requireWebhookSecret,
    async (req: Request, res: Response) => {
      try {
        const b = req.body || {};
        const uid = String(b.uid || b.messageId || b.id || "").trim();
        if (!uid) {
          return res.status(400).json({ error: "Se requiere uid o messageId del correo entrante." });
        }
        const result = await processInboundEmailWithArn({
          uid,
          mailbox: String(b.mailbox || "INBOX"),
          from: String(b.from || ""),
          to: String(b.to || ""),
          subject: String(b.subject || "(Sin asunto)"),
          text: String(b.text || b.body || b.snippet || ""),
          date: b.date ? String(b.date) : undefined,
        });
        res.json({ success: true, ...result });
      } catch (err: any) {
        res.status(500).json({ error: err?.message || "Error procesando correo entrante IMAP" });
      }
    }
  );

  // Dispara reintentos pendientes de n8n / Odoo (desde cron de n8n o Worker Docker)
  app.post(
    "/api/webhooks/n8n/retry-queue",
    requireWebhookSecret,
    async (req: Request, res: Response) => {
      try {
        const limit = Number(req.body?.limit || 20);
        const summary = await flushAutomationRetryQueue(limit);
        res.json({ success: true, ...summary });
      } catch (err: any) {
        res.status(500).json({ error: err?.message || "Error ejecutando cola de reintentos" });
      }
    }
  );

  // Dispara revisión y envío de alertas VTV / Seguros de Flota
  app.post(
    "/api/webhooks/n8n/fleet-alerts",
    requireWebhookSecret,
    async (req: Request, res: Response) => {
      try {
        const days = Number(req.body?.daysThreshold || 15);
        const summary = await checkAndNotifyFleetExpiries(days);
        res.json({ success: true, ...summary });
      } catch (err: any) {
        res.status(500).json({ error: err?.message || "Error verificando alertas de flota" });
      }
    }
  );
}
