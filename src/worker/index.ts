import "dotenv/config";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { pool, hasDatabaseConfig } from "../db/index.ts";
import { ensureProductionTables } from "../services/arnSchema.ts";
import {
  processInboundEmailWithArn,
  flushAutomationRetryQueue,
  checkAndNotifyFleetExpiries,
} from "../services/vpsWorkerService.ts";

function cleanEnv(raw?: string, fallback = ""): string {
  return String(raw || fallback).replace(/^["']|["']$/g, "").trim();
}

const RETRY_INTERVAL_MS = 60_000; // cada 1 minuto
const FLEET_CHECK_INTERVAL_MS = 6 * 60 * 60_000; // cada 6 horas
const IMAP_RECONNECT_DELAY_MS = 10_000;

let shuttingDown = false;
let activeImapClient: ImapFlow | null = null;
let processingMail = false;

async function syncLatestInboxMessages(client: ImapFlow) {
  if (processingMail || shuttingDown) return;
  processingMail = true;
  let lock: any;
  try {
    lock = await client.getMailboxLock("INBOX");
    const status = await client.status("INBOX", { messages: true });
    if (!status.messages || status.messages === 0) return;

    const startSeq = Math.max(1, status.messages - 14);
    const fetched = await client.fetch(
      `${startSeq}:*`,
      { envelope: true, source: true },
      { uid: true }
    );

    const messages: any[] = [];
    for await (const msg of fetched) {
      messages.push(msg);
    }

    for (const msg of messages) {
      const parsed = await simpleParser(msg.source);
      const fromText = parsed.from?.text || "";
      const toText = Array.isArray(parsed.to)
        ? parsed.to.map((t: any) => t.text).join(", ")
        : parsed.to?.text || "";

      const out = await processInboundEmailWithArn({
        uid: String(msg.uid),
        mailbox: "INBOX",
        from: fromText,
        to: toText,
        subject: parsed.subject || "(Sin asunto)",
        text: parsed.text || parsed.html || "",
        date: parsed.date ? parsed.date.toISOString() : new Date().toISOString(),
      });

      if (!out.skipped) {
        console.log(
          `[Worker:IMAP] Email UID=${msg.uid} -> Oportunidad #${out.opportunityId} | Contacto #${out.linkedContactId} | Auto=${out.autoExecuted}`
        );
      }
    }
  } catch (err: any) {
    console.error("[Worker:IMAP] Error procesando INBOX:", err?.message || err);
  } finally {
    if (lock) {
      try {
        lock.release();
      } catch {
        // ignore lock release error
      }
    }
    processingMail = false;
  }
}

async function startImapIdleLoop() {
  const host = cleanEnv(process.env.IMAP_HOST, "mail.xpatagonia.online");
  const user = cleanEnv(process.env.IMAP_USER, "notificaciones@xpatagonia.online");
  const pass = cleanEnv(process.env.IMAP_PASSWORD);
  const port = parseInt(cleanEnv(process.env.IMAP_PORT, "993"), 10);

  if (!pass) {
    console.warn("[Worker:IMAP] IMAP_PASSWORD vacío; escucha IMAP en espera hasta configurar variable.");
    return;
  }

  while (!shuttingDown) {
    const client = new ImapFlow({
      host,
      port,
      secure: port === 993,
      auth: { user, pass },
      tls: { rejectUnauthorized: process.env.MAIL_TLS_INSECURE !== "true" },
      logger: false as any,
    });
    activeImapClient = client;

    try {
      await client.connect();
      console.log(`[Worker:IMAP] Conectado a ${host}:${port} como ${user} (IDLE activo 24/7).`);

      await syncLatestInboxMessages(client);

      client.on("exists", async (data: { path: string; count: number; prevCount: number }) => {
        if (data.count > data.prevCount) {
          console.log(`[Worker:IMAP] Nuevo correo detectado (${data.prevCount} -> ${data.count}). Procesando...`);
          await syncLatestInboxMessages(client);
        }
      });

      // Keep mailbox open so IDLE receives real-time EXISTS push notifications
      const lock = await client.getMailboxLock("INBOX");
      try {
        await new Promise<void>((resolve) => {
          const onClose = () => resolve();
          client.once("close", onClose);
          client.once("error", (err: any) => {
            console.warn("[Worker:IMAP] Error de socket IMAP:", err?.message || err);
            resolve();
          });
        });
      } finally {
        try {
          lock.release();
        } catch {
          // ignore
        }
      }
    } catch (err: any) {
      console.error("[Worker:IMAP] Error de conexión:", err?.message || err);
    } finally {
      activeImapClient = null;
      try {
        await client.logout();
      } catch {
        // ignore
      }
    }

    if (!shuttingDown) {
      console.log(`[Worker:IMAP] Reconectando en ${IMAP_RECONNECT_DELAY_MS / 1000}s...`);
      await new Promise((r) => setTimeout(r, IMAP_RECONNECT_DELAY_MS));
    }
  }
}

async function runMaintenanceTick(label: string) {
  try {
    const retryRes = await flushAutomationRetryQueue(25);
    if (retryRes.checked > 0) {
      console.log(`[Worker:RetryQueue:${label}]`, retryRes);
    }
  } catch (err: any) {
    console.warn("[Worker:RetryQueue] Error:", err?.message || err);
  }
}

async function runFleetCheckTick(label: string) {
  try {
    const fleetRes = await checkAndNotifyFleetExpiries(15);
    if (fleetRes.alertsSent > 0) {
      console.log(`[Worker:FleetAlerts:${label}]`, fleetRes);
    }
  } catch (err: any) {
    console.warn("[Worker:FleetAlerts] Error:", err?.message || err);
  }
}

async function main() {
  console.log("[xPatagonia VPS Worker] Iniciando daemon 24/7 (IMAP IDLE + Reintentos n8n + Alertas Flota)...");
  if (!hasDatabaseConfig()) {
    console.error("[xPatagonia VPS Worker] DATABASE_URL no configurada. Abortando.");
    process.exit(1);
  }

  await ensureProductionTables();

  const retryTimer = setInterval(() => void runMaintenanceTick("interval"), RETRY_INTERVAL_MS);
  const fleetTimer = setInterval(() => void runFleetCheckTick("interval"), FLEET_CHECK_INTERVAL_MS);

  // Initial pass shortly after boot
  setTimeout(() => {
    void runMaintenanceTick("boot");
    void runFleetCheckTick("boot");
  }, 10_000);

  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[xPatagonia VPS Worker] Recibido ${signal}. Cerrando conexiones ordenadamente...`);
    clearInterval(retryTimer);
    clearInterval(fleetTimer);
    if (activeImapClient) {
      try {
        await activeImapClient.logout();
      } catch {
        // ignore
      }
    }
    await pool.end().catch(() => {});
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));

  await startImapIdleLoop();
}

main().catch((err) => {
  console.error("[xPatagonia VPS Worker] Error fatal:", err);
  process.exit(1);
});
