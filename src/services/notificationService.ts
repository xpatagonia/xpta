import { db, hasDatabaseConfig } from '../db/index.ts';
import { companyProfiles, users, automationLogs } from '../db/schema.ts';
import { eq, ilike, or } from 'drizzle-orm';
import { sendEmail } from './emailService.ts';

export interface ProviderMatch {
  uid: string;
  name: string;
  email: string;
  category: string;
}

export async function notifyProvidersForRfq(
  rfqCategory: string,
  rfqTitle: string,
  rfqId: number
) {
  const matchedProviders: ProviderMatch[] = [];
  const seenEmails = new Set<string>();

  if (hasDatabaseConfig()) {
    try {
      const profiles = await db
        .select({
          userId: companyProfiles.userId,
          companyName: companyProfiles.companyName,
          email: companyProfiles.email,
          industry: companyProfiles.industry,
        })
        .from(companyProfiles)
        .where(
          or(
            eq(companyProfiles.industry, rfqCategory),
            ilike(companyProfiles.industry, `%${rfqCategory}%`)
          )
        )
        .limit(20);

      for (const p of profiles) {
        if (p.email && !seenEmails.has(p.email.toLowerCase())) {
          seenEmails.add(p.email.toLowerCase());
          matchedProviders.push({
            uid: p.userId,
            name: p.companyName || p.email,
            email: p.email,
            category: p.industry || rfqCategory,
          });
        }
      }

      if (matchedProviders.length === 0) {
        const userRows = await db
          .select({
            uid: users.uid,
            email: users.email,
            category: users.category,
          })
          .from(users)
          .where(ilike(users.category, `%${rfqCategory}%`))
          .limit(20);

        for (const u of userRows) {
          if (u.email && !seenEmails.has(u.email.toLowerCase())) {
            seenEmails.add(u.email.toLowerCase());
            matchedProviders.push({
              uid: u.uid,
              name: u.email,
              email: u.email,
              category: u.category || rfqCategory,
            });
          }
        }
      }
    } catch (err) {
      console.warn('[notifyProvidersForRfq] DB query warning:', err);
    }
  }

  // Always notify platform operations inbox if configured so no RFQ goes unattended
  const opsEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  for (const adminEmail of opsEmails) {
    if (!seenEmails.has(adminEmail.toLowerCase())) {
      seenEmails.add(adminEmail.toLowerCase());
      matchedProviders.push({
        uid: 'ops-admin',
        name: 'Mesa de Operaciones xPatagonia',
        email: adminEmail,
        category: rfqCategory,
      });
    }
  }

  let sentCount = 0;
  const hasOutboundEmail = Boolean(process.env.RESEND_API_KEY || process.env.SMTP_PASSWORD);

  if (hasOutboundEmail && matchedProviders.length > 0) {
    for (const provider of matchedProviders) {
      try {
        await sendEmail(
          provider.email,
          `Nueva Oportunidad B2B #${rfqId} (${rfqCategory}) - ${rfqTitle}`,
          `Hola ${provider.name},\n\nSe ha publicado una nueva Solicitud de Cotización (RFQ #${rfqId}) en la categoría "${rfqCategory}":\n\n${rfqTitle}\n\nIngresa a https://xpatagonia.online/dashboard para revisar especificaciones y enviar tu propuesta.`,
          `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:20px;">
            <h2 style="color:#111827;">Nueva Oportunidad B2B #${rfqId}</h2>
            <p>Hola <strong>${provider.name}</strong>,</p>
            <p>Se publicó una nueva solicitud de cotización compatible con tu rubro (<strong>${rfqCategory}</strong>):</p>
            <p style="padding:12px 16px;background:#f8fafc;border-left:4px solid #f97316;font-weight:600;">${rfqTitle}</p>
            <p><a href="https://xpatagonia.online/dashboard" style="display:inline-block;padding:10px 18px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Ver Solicitud en xPatagonia</a></p>
          </div>`
        );
        sentCount++;
      } catch (err) {
        console.warn(`[notifyProvidersForRfq] Failed sending to ${provider.email}:`, err);
      }
    }
  }

  if (hasDatabaseConfig()) {
    try {
      await db.insert(automationLogs).values({
        direction: 'outbound_n8n',
        event: 'rfq.providers_notified',
        status: sentCount > 0 ? 'delivered' : 'processed',
        payload: { rfqId, rfqCategory, matchedCount: matchedProviders.length, sentCount },
      });
    } catch {
      // Optional log
    }
  }

  return {
    success: true,
    providersMatched: matchedProviders.length,
    providersNotified: sentCount,
  };
}
