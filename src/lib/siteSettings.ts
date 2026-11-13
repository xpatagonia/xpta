import { getApiUrl } from './apiConfig';

export type HeroBackgroundType = 'gradient' | 'image' | 'video';
export type HeroOverlayTint = 'dark' | 'purple' | 'slate';

export interface HeroSlideConfig {
  id: number;
  tag: string;
  title: string;
  subtitle: string;
  type: 'search' | 'insights' | 'directory';
  ctaLabel: string;
  ctaPath: string;
}

export interface HeroSettings {
  backgroundType: HeroBackgroundType;
  imageUrl: string;
  videoUrl: string;
  posterUrl: string;
  overlayOpacity: number; // 0 - 90
  overlayTint: HeroOverlayTint;
  blurPx: number; // 0 - 12
  rotationSeconds: number;
  slides: HeroSlideConfig[];
}

export interface HomeSectionsVisibility {
  indicators: boolean;
  insights: boolean;
  categories: boolean;
  howItWorks: boolean;
  ecosystem: boolean;
  contact: boolean;
}

export interface FooterSettings {
  tagline: string;
  copyrightText: string;
  supportEmail: string;
  odooBadgeText: string;
}

export interface PricingSummarySettings {
  basicPrice: string;
  proPrice: string;
  corpPrice: string;
  wpSubdomainUrl: string;
}

export interface SiteSettings {
  hero: HeroSettings;
  sections: HomeSectionsVisibility;
  footer: FooterSettings;
  platform: PricingSummarySettings;
  updatedAt: string;
}

export const HERO_MEDIA_PRESETS: {
  id: string;
  label: string;
  type: HeroBackgroundType;
  url: string;
  posterUrl?: string;
}[] = [
  {
    id: 'patagonia-wind',
    label: 'Energía Eólica & Meseta Patagónica (Foto)',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=1920&q=80',
  },
  {
    id: 'patagonia-logistics',
    label: 'Corredor Logístico & Puertos Sur (Foto)',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1920&q=80',
  },
  {
    id: 'patagonia-energy-video',
    label: 'Infraestructura Energética & Operación (Video Loop)',
    type: 'video',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-wind-turbines-in-a-field-at-sunset-41504-large.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=1920&q=80',
  },
  {
    id: 'patagonia-highway-video',
    label: 'Ruta de Carga & Transporte Industrial (Video Loop)',
    type: 'video',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-a-highway-surrounded-by-mountains-42102-large.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=1920&q=80',
  },
];

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  hero: {
    backgroundType: 'gradient',
    imageUrl: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=1920&q=80',
    videoUrl: '',
    posterUrl: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=1920&q=80',
    overlayOpacity: 60,
    overlayTint: 'dark',
    blurPx: 0,
    rotationSeconds: 12,
    slides: [
      {
        id: 0,
        tag: 'Asistente IA de xPatagonia',
        title: 'El Hub de Servicios Inteligentes para la Industria en Patagonia',
        subtitle: '¿En qué puedo ayudarte hoy? Te ayudo a encontrar proveedores y servicios B2B.',
        type: 'search',
        ctaLabel: 'Buscar',
        ctaPath: '/servicios',
      },
      {
        id: 1,
        tag: 'Inteligencia Estratégica',
        title: 'Datos y Tendencias para la Toma de Decisiones B2B',
        subtitle: 'Accede a reportes, análisis de mercado y novedades sobre negocios y sostenibilidad.',
        type: 'insights',
        ctaLabel: 'Explorar Insights y Noticias',
        ctaPath: '/insights',
      },
      {
        id: 2,
        tag: 'Red Empresarial',
        title: 'Conecta con Proveedores Validados y Certificados',
        subtitle: 'Únete a la red de negocios de la región. Encuentra socios y escala tus operaciones.',
        type: 'directory',
        ctaLabel: 'Acceder al Directorio B2B',
        ctaPath: '/marketplace',
      },
    ],
  },
  sections: {
    indicators: true,
    insights: true,
    categories: true,
    howItWorks: true,
    ecosystem: true,
    contact: true,
  },
  footer: {
    tagline:
      'Impulsando la innovación y agilizando las operaciones en la cadena de suministro B2B. Conectamos empresas y proveedores verificados en la Patagonia.',
    copyrightText: 'XPATAGONIA ONLINE. Todos los derechos reservados.',
    supportEmail: 'soporte@xpatagonia.online',
    odooBadgeText: 'Plataforma Odoo B2B',
  },
  platform: {
    basicPrice: '$25.000',
    proPrice: '$65.000',
    corpPrice: '$140.000',
    wpSubdomainUrl: 'https://insights.xpatagonia.online',
  },
  updatedAt: new Date().toISOString(),
};

const STORAGE_KEY = 'xpatagonia_site_settings_v1';
export const SITE_SETTINGS_EVENT = 'xpatagonia:site-settings-updated';

function mergeSettings(partial?: Partial<SiteSettings> | null): SiteSettings {
  if (!partial) return DEFAULT_SITE_SETTINGS;
  return {
    hero: {
      ...DEFAULT_SITE_SETTINGS.hero,
      ...(partial.hero || {}),
      slides:
        Array.isArray(partial.hero?.slides) && partial.hero.slides.length > 0
          ? partial.hero.slides
          : DEFAULT_SITE_SETTINGS.hero.slides,
    },
    sections: {
      ...DEFAULT_SITE_SETTINGS.sections,
      ...(partial.sections || {}),
    },
    footer: {
      ...DEFAULT_SITE_SETTINGS.footer,
      ...(partial.footer || {}),
    },
    platform: {
      ...DEFAULT_SITE_SETTINGS.platform,
      ...(partial.platform || {}),
    },
    updatedAt: partial.updatedAt || new Date().toISOString(),
  };
}

export function getCachedSiteSettings(): SiteSettings {
  if (typeof window === 'undefined') return DEFAULT_SITE_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SITE_SETTINGS;
    return mergeSettings(JSON.parse(raw));
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
}

export function saveCachedSiteSettings(settings: SiteSettings): SiteSettings {
  const merged = mergeSettings({ ...settings, updatedAt: new Date().toISOString() });
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      window.dispatchEvent(new CustomEvent(SITE_SETTINGS_EVENT, { detail: merged }));
    } catch {
      // ignore storage quota
    }
  }
  return merged;
}

export async function fetchSiteSettings(): Promise<SiteSettings> {
  try {
    const res = await fetch(`${getApiUrl()}/api/site-settings`, {
      signal: AbortSignal.timeout(3500),
    });
    if (res.ok) {
      const json = await res.json();
      if (json && (json.hero || json.settings?.hero)) {
        const merged = mergeSettings(json.settings || json);
        saveCachedSiteSettings(merged);
        return merged;
      }
    }
  } catch {
    // Graceful offline / static fallback
  }
  return getCachedSiteSettings();
}

export async function persistSiteSettings(
  settings: SiteSettings,
  token?: string | null
): Promise<{ savedRemote: boolean; settings: SiteSettings; error?: string }> {
  const normalized = saveCachedSiteSettings(settings);
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${getApiUrl()}/api/site-settings`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(normalized),
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      const confirmed = saveCachedSiteSettings(data.settings || normalized);
      return { savedRemote: true, settings: confirmed };
    }
    const errJson = await res.json().catch(() => ({}));
    return {
      savedRemote: false,
      settings: normalized,
      error: errJson.error || `HTTP ${res.status}`,
    };
  } catch (err: any) {
    return {
      savedRemote: false,
      settings: normalized,
      error: err?.message || 'Backend inaccesible (guardado en caché local)',
    };
  }
}
