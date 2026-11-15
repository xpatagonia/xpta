import { ImapFlow } from 'imapflow';
import nodemailer from 'nodemailer';
import { simpleParser } from 'mailparser';

export interface EmailMessage {
  id: string;
  uid: number;
  subject: string;
  from: string;
  to?: string;
  date: string;
  snippet: string;
  text?: string;
  html?: string;
}

function sanitizeEnvValue(raw: string | undefined, fallback = ''): string {
  return (raw || fallback).replace(/^["']|["']$/g, '').trim();
}

function sanitizeHost(raw: string | undefined, fallback: string): string {
  return sanitizeEnvValue(raw, fallback)
    .replace(/^https?:\/\//, '')
    .split(':')[0]
    .split('/')[0]
    .trim();
}

export async function fetchEmails(): Promise<EmailMessage[]> {
  const imapHost = sanitizeHost(process.env.IMAP_HOST, 'mail.xpatagonia.online');
  const imapUser = sanitizeEnvValue(process.env.IMAP_USER, 'notificaciones@xpatagonia.online');
  const imapPass = sanitizeEnvValue(process.env.IMAP_PASSWORD);
  const imapPort = parseInt(process.env.IMAP_PORT || '993', 10);

  if (!imapPass) {
    throw new Error('IMAP_PASSWORD no está configurada en las variables de entorno del servidor.');
  }

  console.log(`[fetchEmails] Starting fetch. Host: ${imapHost}, Port: ${imapPort}, User: ${imapUser}, Secure: ${imapPort === 993}`);

  const client = new ImapFlow({
    host: imapHost,
    port: imapPort,
    secure: imapPort === 993,
    auth: {
      user: imapUser,
      pass: imapPass,
    },
    tls: {
      rejectUnauthorized: process.env.MAIL_TLS_INSECURE !== 'true',
    },
    logger: false as any,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
  });

  const emails: EmailMessage[] = [];
  let connected = false;

  try {
    await client.connect();
    connected = true;

    const lock = await client.getMailboxLock('INBOX');
    try {
      const status = await client.status('INBOX', { messages: true });
      if (!status.messages || status.messages === 0) {
        return [];
      }

      const startSeq = Math.max(1, status.messages - 19);
      const messages = await client.fetch(`${startSeq}:*`, { envelope: true, source: true }, { uid: true });

      const rawMessages: any[] = [];
      for await (const message of messages) {
        rawMessages.push(message);
      }

      const recentMessages = rawMessages.reverse();

      for (const message of recentMessages) {
        const parsed = await simpleParser(message.source);
        const toText = Array.isArray(parsed.to)
          ? parsed.to.map((t: any) => t.text).join(', ')
          : parsed.to?.text || '';
        emails.push({
          id: message.uid.toString(),
          uid: message.uid,
          subject: parsed.subject || '(No Subject)',
          from: parsed.from?.text || 'Unknown',
          to: toText,
          date: parsed.date ? parsed.date.toISOString() : new Date().toISOString(),
          snippet: parsed.text ? parsed.text.substring(0, 100) + '...' : '',
          text: parsed.text,
          html: parsed.html || parsed.textAsHtml,
        });
      }
    } finally {
      lock.release();
    }
  } catch (error: any) {
    console.error('[fetchEmails] ERROR fetching emails:', error);
    const detail = error.responseText || error.message || 'Fallo al conectar';
    const authFailed = error.authenticationFailed ? ' (Authentication Failed)' : '';
    throw new Error(`IMAP Error al conectar con ${imapHost} como ${imapUser}: ${detail}${authFailed}. Verifica tus variables de entorno.`);
  } finally {
    if (connected) {
      await client.logout();
    }
  }

  return emails;
}

export async function sendEmail(
  to: string,
  subject: string,
  text: string,
  html?: string,
  replyTo?: string
) {
  const safeSubject = String(subject || '').replace(/[\r\n]+/g, ' ').trim();
  const safeTo = String(to || '').replace(/[\r\n]+/g, '').trim();
  const safeReplyTo = replyTo ? String(replyTo).replace(/[\r\n]+/g, '').trim() : undefined;
  const resendApiKey = sanitizeEnvValue(process.env.RESEND_API_KEY);
  const resendFrom = sanitizeEnvValue(
    process.env.RESEND_FROM_EMAIL,
    'xPatagonia <notificaciones@xpatagonia.online>'
  );

  // 1. Primary HTTPS provider: Resend (ideal para Cloud Run / AI Studio / Cloudflare sin puertos SMTP TCP)
  if (resendApiKey) {
    const recipients = safeTo
      .split(',')
      .map((addr) => addr.trim())
      .filter(Boolean);

    const payload: Record<string, any> = {
      from: resendFrom,
      to: recipients,
      subject: safeSubject,
    };
    if (safeReplyTo) payload.reply_to = safeReplyTo;
    if (text) payload.text = text;
    if (html) payload.html = html;

    console.log(`[sendEmail] Sending via Resend HTTPS to ${recipients.join(', ')} from ${resendFrom}`);

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });

    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(`Resend Error (${res.status}): ${data?.message || data?.name || 'Fallo al enviar correo'}`);
    }

    console.log(`[sendEmail] Resend sent successfully. Id: ${data.id}`);
    return { messageId: data.id, provider: 'resend' };
  }

  // 2. Fallback: SMTP corporativo (CyberPanel / Proxmox)
  const smtpHost = sanitizeHost(process.env.SMTP_HOST, 'mail.xpatagonia.online');
  const smtpUser = sanitizeEnvValue(process.env.SMTP_USER, 'notificaciones@xpatagonia.online');
  const smtpPass = sanitizeEnvValue(process.env.SMTP_PASSWORD);
  const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);

  if (!smtpPass) {
    throw new Error('Configura RESEND_API_KEY o SMTP_PASSWORD en las variables de entorno (Settings > Secrets).');
  }

  console.log(`[sendEmail] Starting SMTP send to ${safeTo}. Host: ${smtpHost}, Port: ${smtpPort}, User: ${smtpUser}, Secure: ${smtpPort === 465}`);

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    tls: {
      rejectUnauthorized: process.env.MAIL_TLS_INSECURE !== 'true',
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
  });

  try {
    const info = await transporter.sendMail({
      from: smtpUser,
      to: safeTo,
      ...(safeReplyTo ? { replyTo: safeReplyTo } : {}),
      subject: safeSubject,
      text,
      html,
    });
    console.log(`[sendEmail] Successfully sent email via SMTP to ${safeTo}. MessageId: ${info.messageId}`);
    return { ...info, provider: 'smtp' };
  } catch (error: any) {
    console.error('[sendEmail] ERROR sending email:', error);
    throw new Error(`SMTP Error al conectar con ${smtpHost} como ${smtpUser}: ${error.message || 'Fallo al enviar'}.`);
  }
}
