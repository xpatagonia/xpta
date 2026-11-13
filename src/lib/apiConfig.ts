export const getApiUrl = (): string => {
  const raw =
    (import.meta.env.VITE_API_URL as string) ||
    (import.meta.env.VITE_API_BASE_URL as string) ||
    '';
  return raw.replace(/\/+$/, '');
};

export const getOsrmUrl = (): string => {
  if (typeof window !== 'undefined') {
    const custom = window.localStorage.getItem('xpatagonia_osrm_url');
    if (custom && custom.trim()) {
      return custom.trim().replace(/\/+$/, '');
    }
  }
  const envUrl = (import.meta.env.VITE_OSRM_URL as string) || '';
  return envUrl ? envUrl.replace(/\/+$/, '') : 'https://router.project-osrm.org';
};

export const getN8nWebhookUrl = (): string => {
  if (typeof window !== 'undefined') {
    const custom = window.localStorage.getItem('xpatagonia_n8n_url');
    if (custom && custom.trim()) {
      return custom.trim().replace(/\/+$/, '');
    }
  }
  const envUrl = (import.meta.env.VITE_N8N_WEBHOOK_URL as string) || '';
  return envUrl ? envUrl.replace(/\/+$/, '') : '';
};
