const env = ((import.meta as any)?.env ?? {}) as Record<string, string | undefined>;

export const getApiUrl = (): string => {
  const raw = env.VITE_API_URL || env.VITE_API_BASE_URL || '';
  return raw.replace(/\/+$/, '');
};

export const getOsrmUrl = (): string => {
  const envUrl = env.VITE_OSRM_URL || '';
  return envUrl ? envUrl.replace(/\/+$/, '') : 'https://router.project-osrm.org';
};

export const getN8nWebhookUrl = (): string => {
  const envUrl = env.VITE_N8N_WEBHOOK_URL || '';
  return envUrl ? envUrl.replace(/\/+$/, '') : '';
};
