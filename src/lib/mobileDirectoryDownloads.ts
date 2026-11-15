import type { B2BCompanyRecord } from './b2bDirectoryData';

const OFFLINE_FAVORITES_KEY = 'xpatagonia_offline_directory_v1';

function escapeVCardText(value: string): string {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

function escapeXml(value: string): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function buildCompanyVCard(company: B2BCompanyRecord): string {
  const lat = Number(company.adnComercial?.lat ?? -45.8641);
  const lng = Number(company.adnComercial?.lng ?? -67.4966);
  const fullName = company.contactName && company.contactName !== 'Reservado para Miembros'
    ? `${company.contactName} (${company.name})`
    : company.name;
  const noteParts = [
    `Perfil: ${company.entityType || 'empresa'}`,
    company.cuit && !company.cuit.includes('•') ? `CUIT: ${company.cuit}` : '',
    company.credentialLabel ? `Acreditación: ${company.credentialLabel}` : '',
    `Corredor: ${company.adnComercial?.corredorLogistico || 'Patagonia'}`,
    `Servicios: ${(company.subcategories || []).join(', ')}`,
    `Coordenadas GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
  ].filter(Boolean);

  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${escapeVCardText(fullName)}`,
    `ORG:${escapeVCardText(company.name)}`,
    company.contactRole ? `TITLE:${escapeVCardText(company.contactRole)}` : '',
    company.phone ? `TEL;TYPE=WORK,VOICE:${company.phone.replace(/\s+/g, '')}` : '',
    company.whatsapp ? `TEL;TYPE=CELL:${company.whatsapp.replace(/\s+/g, '')}` : '',
    company.email ? `EMAIL;TYPE=WORK,INTERNET:${company.email}` : '',
    company.website ? `URL:${company.website}` : 'URL:https://www.xpatagonia.online/servicios',
    `ADR;TYPE=WORK:;;${escapeVCardText(company.city)};${escapeVCardText(company.city)};${escapeVCardText(company.province)};;Argentina`,
    `GEO:${lat.toFixed(6)};${lng.toFixed(6)}`,
    `NOTE:${escapeVCardText(noteParts.join(' | '))}`,
    'END:VCARD',
  ].filter(Boolean);

  return lines.join('\r\n');
}

export function buildCompanyGpx(company: B2BCompanyRecord): string {
  const lat = Number(company.adnComercial?.lat ?? -45.8641).toFixed(6);
  const lng = Number(company.adnComercial?.lng ?? -67.4966).toFixed(6);
  const desc = [
    `${company.category} · ${company.city}, ${company.province}`,
    `Corredor: ${company.adnComercial?.corredorLogistico || 'Patagonia'}`,
    company.phone ? `Tel: ${company.phone}` : '',
    company.email ? `Email: ${company.email}` : '',
    `Ofrece: ${(company.adnComercial?.ofrece || []).join(', ')}`,
  ]
    .filter(Boolean)
    .join(' | ');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<gpx version="1.1" creator="xPatagonia B2B" xmlns="http://www.topografix.com/GPX/1/1">',
    '  <metadata>',
    `    <name>${escapeXml(company.name)} · Base Patagonia</name>`,
    '    <desc>Punto operativo georreferenciado desde xPatagonia B2B</desc>',
    '  </metadata>',
    `  <wpt lat="${lat}" lon="${lng}">`,
    `    <name>${escapeXml(company.name)}</name>`,
    `    <cmt>${escapeXml(company.city + ', ' + company.province)}</cmt>`,
    `    <desc>${escapeXml(desc)}</desc>`,
    '    <sym>Flag, Orange</sym>',
    '  </wpt>',
    '</gpx>',
  ].join('\n');
}

export function buildCompanyGeoJson(company: B2BCompanyRecord): string {
  const lat = Number(company.adnComercial?.lat ?? -45.8641);
  const lng = Number(company.adnComercial?.lng ?? -67.4966);
  return JSON.stringify(
    {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [lng, lat],
          },
          properties: {
            id: company.id,
            name: company.name,
            entityType: company.entityType,
            category: company.category,
            city: company.city,
            province: company.province,
            corridor: company.adnComercial?.corredorLogistico || '',
            cuit: company.cuit,
            phone: company.phone,
            email: company.email,
            services: company.subcategories,
          },
        },
      ],
    },
    null,
    2
  );
}

export function getNavigationDeepLinks(company: B2BCompanyRecord) {
  const lat = Number(company.adnComercial?.lat ?? -45.8641).toFixed(6);
  const lng = Number(company.adnComercial?.lng ?? -67.4966).toFixed(6);
  const label = encodeURIComponent(`${company.name} (${company.city})`);
  return {
    googleMaps: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    waze: `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`,
    appleMaps: `https://maps.apple.com/?ll=${lat},${lng}&q=${label}`,
    openStreetMap: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=14/${lat}/${lng}`,
  };
}

export function triggerTextFileDownload(filename: string, content: string, mimeType: string) {
  if (typeof document === 'undefined') return;
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function getOfflineFavoriteCompanies(): B2BCompanyRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(OFFLINE_FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function toggleOfflineFavoriteCompany(company: B2BCompanyRecord): {
  saved: boolean;
  items: B2BCompanyRecord[];
} {
  const current = getOfflineFavoriteCompanies();
  const exists = current.some((c) => c.id === company.id);
  const next = exists
    ? current.filter((c) => c.id !== company.id)
    : [company, ...current.filter((c) => c.id !== company.id)];
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(OFFLINE_FAVORITES_KEY, JSON.stringify(next));
    }
  } catch {
    // ignore quota issues cleanly
  }
  return { saved: !exists, items: next };
}
