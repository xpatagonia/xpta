import { ImapFlow } from 'imapflow';
import nodemailer from 'nodemailer';
import { simpleParser } from 'mailparser';

export interface EmailMessage {
  id: string;
  uid: number;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  text?: string;
  html?: string;
}

export async function fetchEmails(): Promise<EmailMessage[]> {
  let imapHost = process.env.IMAP_HOST || 'mail.xpatagonia.online';
  
  // Sanitize IMAP_HOST if user accidentally pasted a URL (e.g. https://vps-...)
  imapHost = imapHost.replace(/^https?:\/\//, '').split(':')[0].split('/')[0].trim().replace(/^["']|["']$/g, '');
  
  const imapUserRaw = process.env.IMAP_USER || 'notificaciones@xpatagonia.online';
  const imapUser = imapUserRaw.replace(/^["']|["']$/g, '').trim();

  const imapPassRaw = process.env.IMAP_PASSWORD || 'N@TIFIC958373@as';
  const imapPass = imapPassRaw.replace(/^["']|["']$/g, '').trim();

  const imapPort = parseInt(process.env.IMAP_PORT || '993', 10);
  
  console.log(`[fetchEmails] Starting fetch. Host: ${imapHost}, Port: ${imapPort}, User: ${imapUser}, Secure: ${imapPort === 993}`);
  
  const client = new ImapFlow({
    host: imapHost,
    port: imapPort,
    secure: imapPort === 993,
    auth: {
      user: imapUser as string,
      pass: imapPass as string
    },
    tls: {
      rejectUnauthorized: false
    },
    logger: false as any,
    // Provide a timeout so Cloud Run doesn't hang indefinitely if blocked by firewall
    connectionTimeout: 10000,
    greetingTimeout: 10000
  });

  const emails: EmailMessage[] = [];
  let connected = false;

  try {
    console.log(`[fetchEmails] Attempting client.connect()...`);
    await client.connect();
    connected = true;
    console.log(`[fetchEmails] Successfully connected to IMAP server.`);
    
    // Select mailbox, normally 'INBOX'
    console.log(`[fetchEmails] Getting lock on INBOX...`);
    const lock = await client.getMailboxLock('INBOX');
    console.log(`[fetchEmails] Lock on INBOX acquired.`);
    try {
      let status = await client.status('INBOX', { messages: true });
      if (!status.messages || status.messages === 0) {
        console.log(`[fetchEmails] Inbox is empty, returning no emails.`);
        return [];
      }

      console.log(`[fetchEmails] Fetching messages...`);
      // Use standard IMAP sequence for last 20 messages to avoid fetching everything
      let startSeq = Math.max(1, status.messages - 19);
      const messages = await client.fetch(`${startSeq}:*`, { envelope: true, source: true }, { uid: true });
      
      // We will collect them and sort them
      const rawMessages: any[] = [];
      let messageCount = 0;
      for await (let message of messages) {
        rawMessages.push(message);
        messageCount++;
      }
      console.log(`[fetchEmails] Fetched ${messageCount} messages in total.`);
      
      // Process messages
      const recentMessages = rawMessages.reverse();

      for (let message of recentMessages) {
        const parsed = await simpleParser(message.source);
        emails.push({
          id: message.uid.toString(),
          uid: message.uid,
          subject: parsed.subject || '(No Subject)',
          from: parsed.from?.text || 'Unknown',
          date: parsed.date ? parsed.date.toISOString() : new Date().toISOString(),
          snippet: parsed.text ? parsed.text.substring(0, 100) + '...' : '',
          text: parsed.text,
          html: parsed.html || parsed.textAsHtml,
        });
      }
      console.log(`[fetchEmails] Successfully processed ${emails.length} emails.`);
    } finally {
      console.log(`[fetchEmails] Releasing INBOX lock...`);
      lock.release();
    }
  } catch (error: any) {
    console.error('[fetchEmails] ERROR fetching emails:', error);
    const detail = error.responseText || error.message || 'Fallo al conectar';
    const authFailed = error.authenticationFailed ? " (Authentication Failed)" : "";
    throw new Error(`IMAP Error al conectar con ${imapHost} como ${imapUser}: ${detail}${authFailed}. Verifica tu contraseña y configuración.`);
  } finally {
    if (connected) {
      await client.logout();
    }
  }

  return emails;
}

export async function sendEmail(to: string, subject: string, text: string, html?: string) {
  const hostRaw = process.env.SMTP_HOST || 'mail.xpatagonia.online';
  const userRaw = process.env.SMTP_USER || 'notificaciones@xpatagonia.online';
  const passRaw = process.env.SMTP_PASSWORD || 'N@TIFIC958373@as';

  const smtpUser = userRaw.replace(/^["']|["']$/g, '').trim();
  const smtpPass = passRaw.replace(/^["']|["']$/g, '').trim();

  // Sanitize host if it is a URL
  let smtpHost = hostRaw.replace(/^https?:\/\//, '').split(':')[0].split('/')[0].trim().replace(/^["']|["']$/g, '');

  const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);
  
  console.log(`[sendEmail] Starting send to ${to}. Host: ${smtpHost}, Port: ${smtpPort}, User: ${userRaw}, Secure: ${smtpPort === 465}`);

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000
  });

  try {
    const info = await transporter.sendMail({
      from: smtpUser,
      to,
      subject,
      text,
      html,
    });
    console.log(`[sendEmail] Successfully sent email to ${to}. MessageId: ${info.messageId}`);
    return info;
  } catch (error: any) {
    console.error('[sendEmail] ERROR sending email:', error);
    throw new Error(`SMTP Error al conectar con ${smtpHost} como ${userRaw}: ${error.message || 'Fallo al enviar'}.`);
  }
}
