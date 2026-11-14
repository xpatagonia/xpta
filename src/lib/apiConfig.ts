declare const __XPATAGONIA_API_URL__: string | undefined;

export function sanitizeApiBaseUrl(rawUrl: string): string {
  const cleaned = (rawUrl || '').trim().replace(/\/+$/, '');
  if (!cleaned) return '';
  if (/onrender\.com/i.test(cleaned)) return '';
  if (
    typeof window !== 'undefined' &&
    window.location?.protocol === 'https:' &&
    /^http:\/\/(localhost|127\.0\.0\.1)/i.test(cleaned)
  ) {
    return '';
  }
  return cleaned;
}

function readDefineApiUrl(): string {
  try {
    if (typeof __XPATAGONIA_API_URL__ !== 'undefined' && __XPATAGONIA_API_URL__) {
      return __XPATAGONIA_API_URL__;
    }
  } catch {
    // ignore
  }
  try {
    return (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '').trim();
  } catch {
    return '';
  }
}

export const getApiUrl = (): string => {
  return sanitizeApiBaseUrl(readDefineApiUrl());
};

export const getOsrmUrl = (): string => {
  try {
    const envUrl = (import.meta.env.VITE_OSRM_URL || '').trim();
    return envUrl ? envUrl.replace(/\/+$/, '') : 'https://router.project-osrm.org';
  } catch {
    return 'https://router.project-osrm.org';
  }
};

export const getN8nWebhookUrl = (): string => {
  try {
    const envUrl = (import.meta.env.VITE_N8N_WEBHOOK_URL || '').trim();
    return envUrl ? envUrl.replace(/\/+$/, '') : '';
  } catch {
    return '';
  }
};
