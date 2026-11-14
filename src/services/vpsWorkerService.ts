import { pool, hasDatabaseConfig } from "../db/index.ts";
import { ensureProductionTables } from "./arnSchema.ts";
import { sendEmail } from "./emailService.ts";

const RETRY_BACKOFF_MINUTES = [1, 5, 15, 30, 60];

export function extractOrgAliasId(toHeader?: string | null): number | null {
  const raw = String(toHeader || "");
  const match = raw.match(/\+org(\d+)@/i);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export function extractEmailAddress(rawHeader?: string | null): { email: string; name: string } {
  const raw = String(rawHeader || "").trim();
  const match = raw.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = match ? match[0].toLowerCase() : "";
  const cleanedName = raw.replace(/<[^>]+>/g, "").replace(/["']/g, "").trim();
  return {
    email,
    name: cleanedName || email || "Contacto Entrante",
  };
}

export function computeNextRetryDate(attempts: number, now: Date = new Date()): Date | null {
  const idx = Math.max(0, Number(attempts) - 1);
  if (attempts <= 0) return new Date(now.getTime() + 60_000);
  if (idx >= RETRY_BACKOFF_MINUTES.length) return null; // dead_letter
  return new Date(now.getTime() + RETRY_BACKOFF_MINUTES[idx] * 60_000);
}

export function parseExpiryDaysRemaining(
  dateStr?: string | null,
  referenceDate: Date = new Date()
): number | null {
  const raw = String(dateStr || "").trim();
  if (!raw) return null;
  const ymd = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  let targetUtc: number;
  if (ymd) {
    targetUtc = Date.UTC(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));
  } else {
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return null;
    targetUtc = Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate());
  }

  const refUtc = Date.UTC(
    referenceDate.getUTCFullYear(),
    referenceDate.getUTCMonth(),
    referenceDate.getUTCDate()
  );
  return Math.floor((targetUtc - refUtc) / 86_400_000);
}

export async function resolveEmailTenantTarget(params: {
  senderEmail: string;
  toHeader?: string | null;
}): Promise<{ ownerUid: string; organizationId: number | null }> {
  const fallbackUid = String(process.env.WORKER_DEFAULT_OWNER_UID || "system-arn-bootstrap").trim();
  if (!hasDatabaseConfig()) {
    return { ownerUid: fallbackUid, organizationId: null };
  }
  await ensureProductionTables();

  // 1. Subaddress alias (+org12@xpatagonia.online)
  const aliasOrgId = extractOrgAliasId(params.toHeader);
  if (aliasOrgId) {
    const orgRes = await pool.query(
      `SELECT id, owner_uid FROM public.organizations WHERE id = $1 LIMIT 1`,
      [aliasOrgId]
    );
    if (orgRes.rows?.[0]) {
      return {
        ownerUid: orgRes.rows[0].owner_uid,
        organizationId: Number(orgRes.rows[0].id),
      };
    }
  }

  // 2. Match existing contact by sender email
  if (params.senderEmail) {
    const contactRes = await pool.query(
      `SELECT user_uid, organization_id FROM public.contacts
       WHERE LOWER(email) = LOWER($1)
       ORDER BY last_arn_sync_at DESC NULLS LAST, id DESC
       LIMIT 1`,
      [params.senderEmail]
    );
    if (contactRes.rows?.[0]) {
      return {
        ownerUid: contactRes.rows[0].user_uid || fallbackUid,
        organizationId: contactRes.rows[0].organization_id
          ? Number(contactRes.rows[0].organization_id)
          : null,
      };
    }
  }

  // 3. Fallback to primary admin organization
  const adminEmail = (process.env.ADMIN_EMAILS || "xpatagonia.com@gmail.com")
    .split(",")[0]
    .trim()
    .toLowerCase();

  const adminOrgRes = await pool.query(
    `SELECT o.id, o.owner_uid
     FROM public.organizations o
     LEFT JOIN public.users u ON u.uid = o.owner_uid
     ORDER BY (LOWER(COALESCE(u.email, '')) = $1) DESC, o.id ASC
     LIMIT 1`,
    [adminEmail]
  );
  if (adminOrgRes.rows?.[0]) {
    return {
      ownerUid: adminOrgRes.rows[0].owner_uid,
      organizationId: Number(adminOrgRes.rows[0].id),
    };
  }

  const userRes = await pool.query(
    `SELECT uid FROM public.users WHERE LOWER(email) = $1 LIMIT 1`,
    [adminEmail]
  );
  return {
    ownerUid: userRes.rows?.[0]?.uid || fallbackUid,
    organizationId: null,
  };
}

export async function dispatchAutomationWebhook(
  direction: "outbound_n8n" | "inbound_odoo",
  event: string,
  payload: Record<string, any>
): Promise<{ status: string; forwarded: boolean; logId?: number }> {
  const n8nUrl = String(process.env.N8N_WEBHOOK_URL || "").trim();
  const sharedSecret = String(process.env.N8N_SHARED_SECRET || "").trim();

  let status = "local_queue";
  let attempts = 0;
  let nextRetryAt: Date | null = null;
  let lastError: string | null = null;
  let forwarded = false;

  if (n8nUrl) {
    try {
      const response = await fetch(n8nUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(sharedSecret ? { "x-n8n-secret": sharedSecret } : {}),
        },
        body: JSON.stringify({ event, direction, payload, timestamp: new Date().toISOString() }),
        signal: AbortSignal.timeout(8000),
      });
      if (response.ok) {
        status = "processed";
        forwarded = true;
      } else {
        attempts = 1;
        status = "retry_pending";
        nextRetryAt = computeNextRetryDate(attempts);
        lastError = `n8n HTTP ${response.status}`;
      }
    } catch (err: any) {
      attempts = 1;
      status = "retry_pending";
      nextRetryAt = computeNextRetryDate(attempts);
      lastError = err?.message || "n8n connection error";
    }
  } else {
    attempts = 0;
    status = "local_queue";
    nextRetryAt = computeNextRetryDate(1);
  }

  let logId: number | undefined;
  if (hasDatabaseConfig()) {
    await ensureProductionTables();
    const res = await pool.query(
      `INSERT INTO public.automation_logs (
        direction, event, status, payload, attempts, next_retry_at, last_error, updated_at
      ) VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7,now())
      RETURNING id`,
      [direction, event, status, JSON.stringify(payload || {}), attempts, nextRetryAt, lastError]
    );
    logId = res.rows?.[0]?.id ? Number(res.rows[0].id) : undefined;
  }

  return { status, forwarded, logId };
}

export async function flushAutomationRetryQueue(limit = 20): Promise<{
  checked: number;
  succeeded: number;
  rescheduled: number;
  deadLettered: number;
  skippedNoUrl?: boolean;
}> {
  const n8nUrl = String(process.env.N8N_WEBHOOK_URL || "").trim();
  if (!n8nUrl) {
    return { checked: 0, succeeded: 0, rescheduled: 0, deadLettered: 0, skippedNoUrl: true };
  }
  if (!hasDatabaseConfig()) {
    return { checked: 0, succeeded: 0, rescheduled: 0, deadLettered: 0 };
  }
  await ensureProductionTables();

  const sharedSecret = String(process.env.N8N_SHARED_SECRET || "").trim();
  const pendingRes = await pool.query(
    `SELECT * FROM public.automation_logs
     WHERE direction = 'outbound_n8n'
       AND status IN ('retry_pending', 'local_queue')
       AND (next_retry_at IS NULL OR next_retry_at <= now())
     ORDER BY created_at ASC
     LIMIT $1`,
    [Math.max(1, Math.min(50, limit))]
  );

  const rows = pendingRes.rows || [];
  let succeeded = 0;
  let rescheduled = 0;
  let deadLettered = 0;

  for (const row of rows) {
    try {
      const response = await fetch(n8nUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(sharedSecret ? { "x-n8n-secret": sharedSecret } : {}),
        },
        body: JSON.stringify({
          event: row.event,
          direction: row.direction,
          payload: row.payload || {},
          retryAttempt: Number(row.attempts || 0) + 1,
          timestamp: new Date().toISOString(),
        }),
        signal: AbortSignal.timeout(8000),
      });

      if (response.ok) {
        await pool.query(
          `UPDATE public.automation_logs
           SET status = 'processed', last_error = NULL, next_retry_at = NULL, updated_at = now()
           WHERE id = $1`,
          [row.id]
        );
        succeeded += 1;
        continue;
      }

      throw new Error(`HTTP ${response.status}`);
    } catch (err: any) {
      const nextAttempts = Number(row.attempts || 0) + 1;
      const nextRetry = computeNextRetryDate(nextAttempts);
      if (!nextRetry) {
        await pool.query(
          `UPDATE public.automation_logs
           SET status = 'dead_letter', attempts = $1, next_retry_at = NULL, last_error = $2, updated_at = now()
           WHERE id = $3`,
          [nextAttempts, err?.message || "Max retries exceeded", row.id]
        );
        deadLettered += 1;
      } else {
        await pool.query(
          `UPDATE public.automation_logs
           SET status = 'retry_pending', attempts = $1, next_retry_at = $2, last_error = $3, updated_at = now()
           WHERE id = $4`,
          [nextAttempts, nextRetry, err?.message || "Retry scheduled", row.id]
        );
        rescheduled += 1;
      }
    }
  }

  return { checked: rows.length, succeeded, rescheduled, deadLettered };
}

export async function processInboundEmailWithArn(mail: {
  uid: string | number;
  mailbox?: string;
  from?: string;
  to?: string;
  subject?: string;
  text?: string;
  date?: string;
}): Promise<{
  skipped?: boolean;
  reason?: string;
  opportunityId?: number;
  linkedContactId?: number | null;
  autoExecuted?: boolean;
}> {
  if (!hasDatabaseConfig()) {
    return { skipped: true, reason: "no_database" };
  }
  await ensureProductionTables();

  const mailbox = String(mail.mailbox || "INBOX").trim() || "INBOX";
  const emailUid = String(mail.uid || "").trim();
  if (!emailUid) {
    return { skipped: true, reason: "missing_uid" };
  }

  const sender = extractEmailAddress(mail.from);
  const subject = String(mail.subject || "(Sin asunto)").slice(0, 300);

  // Claim idempotent lock on (mailbox, email_uid)
  const lockRes = await pool.query(
    `INSERT INTO public.processed_email_uids (mailbox, email_uid, sender_email, subject)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (mailbox, email_uid) DO NOTHING
     RETURNING id`,
    [mailbox, emailUid, sender.email || null, subject]
  );

  if (!lockRes.rows?.[0]) {
    return { skipped: true, reason: "duplicate_uid" };
  }

  try {
    const tenant = await resolveEmailTenantTarget({
      senderEmail: sender.email,
      toHeader: mail.to,
    });

    const { runArnPipelineForEvent } = await import("../server/arnRoutes.ts");
    const result = await runArnPipelineForEvent({
      ownerUid: tenant.ownerUid,
      organizationId: tenant.organizationId,
      source: "email_imap_worker",
      companyName: sender.name,
      contactName: sender.name,
      contactEmail: sender.email,
      rawText: `Asunto: ${subject}\n\n${String(mail.text || "").slice(0, 3500)}`,
      metadata: {
        emailUid,
        mailbox,
        toHeader: mail.to || null,
        emailDate: mail.date || new Date().toISOString(),
      },
    });

    await pool.query(
      `UPDATE public.processed_email_uids
       SET organization_id = $1, arn_opportunity_id = $2
       WHERE id = $3`,
      [tenant.organizationId, result.opportunity?.id || null, lockRes.rows[0].id]
    );

    await dispatchAutomationWebhook("outbound_n8n", "arn.imap.opportunity_created", {
      emailUid,
      senderEmail: sender.email,
      organizationId: tenant.organizationId,
      opportunityId: result.opportunity?.id || null,
      linkedContactId: result.linkedContactId || null,
      autoExecuted: Boolean(result.decision?.shouldAutoExecute),
    });

    return {
      skipped: false,
      opportunityId: result.opportunity?.id ? Number(result.opportunity.id) : undefined,
      linkedContactId: result.linkedContactId ?? null,
      autoExecuted: Boolean(result.decision?.shouldAutoExecute),
    };
  } catch (err) {
    // Release claim so a transient Gemini/DB error can retry on next cycle
    await pool
      .query(`DELETE FROM public.processed_email_uids WHERE id = $1`, [lockRes.rows[0].id])
      .catch(() => {});
    throw err;
  }
}

export async function checkAndNotifyFleetExpiries(daysThreshold = 15): Promise<{
  scanned: number;
  alertsSent: number;
}> {
  if (!hasDatabaseConfig()) {
    return { scanned: 0, alertsSent: 0 };
  }
  await ensureProductionTables();

  const res = await pool.query(
    `SELECT fv.*, o.name AS org_name, u.email AS owner_email
     FROM public.fleet_vehicles fv
     LEFT JOIN public.organizations o ON o.id = fv.organization_id
     LEFT JOIN public.users u ON u.uid = fv.owner_uid
     WHERE COALESCE(fv.vtv_expiry, '') <> '' OR COALESCE(fv.insurance_expiry, '') <> ''`
  );

  const vehicles = res.rows || [];
  let alertsSent = 0;

  for (const v of vehicles) {
    const recipient = String(v.owner_email || "").trim();
    if (!recipient) continue;

    const checks: Array<{ type: "vtv" | "insurance"; label: string; dateVal: string | null }> = [
      { type: "vtv", label: "VTV / Verificación Técnica", dateVal: v.vtv_expiry },
      { type: "insurance", label: "Seguro Automotor / Carga", dateVal: v.insurance_expiry },
    ];

    for (const chk of checks) {
      if (!chk.dateVal) continue;
      const daysLeft = parseExpiryDaysRemaining(chk.dateVal);
      if (daysLeft === null || daysLeft > daysThreshold) continue;

      const claim = await pool.query(
        `INSERT INTO public.fleet_expiry_alerts (vehicle_id, alert_type, expiry_date, notified_email)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (vehicle_id, alert_type, expiry_date) DO NOTHING
         RETURNING id`,
        [v.id, chk.type, chk.dateVal, recipient]
      );
      if (!claim.rows?.[0]) continue;

      const statusText =
        daysLeft < 0
          ? `VENCIDA hace ${Math.abs(daysLeft)} días (${chk.dateVal})`
          : daysLeft === 0
          ? `VENCE HOY (${chk.dateVal})`
          : `vence en ${daysLeft} días (${chk.dateVal})`;

      try {
        await sendEmail(
          recipient,
          `[Alerta Flota xPatagonia] ${v.name} (${v.plate}): ${chk.label} ${statusText}`,
          `Hola,\n\nLa unidad ${v.name} (Dominio ${v.plate}) de ${
            v.org_name || "tu flota"
          } registra su ${chk.label} ${statusText}.\n\nIngresá al Panel de Logística & Control de Flota en https://www.xpatagonia.online/dashboard?area=fleet para actualizar la documentación y mantener la habilitación operativa.`
        );
        alertsSent += 1;
      } catch (err) {
        // Allow retry if Resend/SMTP failed transiently
        await pool
          .query(`DELETE FROM public.fleet_expiry_alerts WHERE id = $1`, [claim.rows[0].id])
          .catch(() => {});
        console.warn("[FleetAlert] No se pudo enviar alerta:", err);
      }
    }
  }

  return { scanned: vehicles.length, alertsSent };
}
