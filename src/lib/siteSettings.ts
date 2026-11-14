import { getApiUrl } from './apiConfig';
import { supabase, isSupabaseConfigured } from './supabase';

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

export type ParsedHeroVideo =
  | { kind: 'youtube'; embedUrl: string }
  | { kind: 'cloudflare_stream'; embedUrl: string }
  | { kind: 'direct'; src: string }
  | null;

export function parseHeroVideoSource(rawUrl: string): ParsedHeroVideo {
  const url = (rawUrl || '').trim();
  if (!url) return null;

  // 1. YouTube URLs
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) {
    const id = ytMatch[1];
    return {
      kind: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1`,
    };
  }

  // 2. Cloudflare Stream URLs (customer-xxx.cloudflarestream.com/<id>/iframe|watch|manifest/video.m3u8 or videodelivery.net/<id>)
  const cfCustomerMatch = url.match(
    /https?:\/\/(customer-[a-zA-Z0-9]+\.cloudflarestream\.com)\/([a-zA-Z0-9]{16,64})(?:\/(?:iframe|watch|manifest\/video\.m3u8|downloads\/[^\s?]+))?/i
  );
  if (cfCustomerMatch && !url.includes('/downloads/')) {
    const host = cfCustomerMatch[1];
    const videoId = cfCustomerMatch[2];
    return {
      kind: 'cloudflare_stream',
      embedUrl: `https://${host}/${videoId}/iframe?autoplay=true&muted=true&loop=true&controls=false&preload=true`,
    };
  }

  const cfGenericMatch = url.match(
    /https?:\/\/(?:watch\.cloudflarestream\.com|iframe\.videodelivery\.net|videodelivery\.net)\/([a-zA-Z0-9]{16,64})/i
  );
  if (cfGenericMatch) {
    const videoId = cfGenericMatch[1];
    return {
      kind: 'cloudflare_stream',
      embedUrl: `https://iframe.videodelivery.net/${videoId}?autoplay=true&muted=true&loop=true&controls=false&preload=true`,
    };
  }

  // 3. Direct MP4 / WebM / MOV / Cloudflare R2 / Supabase Storage URL
  return { kind: 'direct', src: url };
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

export const SITE_SETTINGS_EVENT = 'xpatagonia:site-settings-updated';

// In-memory session mirror only (never persisted to localStorage across devices)
let activeSessionSettings: SiteSettings | null = null;

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
  // Clean up any legacy localStorage override from earlier builds so all devices reflect DB truth
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('xpatagonia_site_settings_v1');
    } catch {
      // ignore
    }
  }
  return activeSessionSettings || DEFAULT_SITE_SETTINGS;
}

export function publishSessionSiteSettings(settings: SiteSettings): SiteSettings {
  const merged = mergeSettings(settings);
  activeSessionSettings = merged;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SITE_SETTINGS_EVENT, { detail: merged }));
  }
  return merged;
}

export async function fetchSiteSettings(): Promise<SiteSettings> {
  // 1. Primary authoritative read: Production API (/api/site-settings -> Postgres / Supabase)
  try {
    const res = await fetch(`${getApiUrl()}/api/site-settings?_t=${Date.now()}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const json = await res.json();
      const remoteSettings = json?.settings || (json?.hero ? json : null);
      if (remoteSettings && remoteSettings.hero) {
        return publishSessionSiteSettings(remoteSettings);
      }
    }
  } catch {
    // Try direct Supabase public read fallback
  }

  // 2. Secondary authoritative read: Supabase public read policy on site_settings
  if (isSupabaseConfigured) {
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'global_site_config')
        .maybeSingle();
      if (data?.value?.hero) {
        return publishSessionSiteSettings(data.value as Partial<SiteSettings> as SiteSettings);
      }
    } catch {
      // Fallback to defaults if empty
    }
  }

  return activeSessionSettings || DEFAULT_SITE_SETTINGS;
}

export async function persistSiteSettings(
  settings: SiteSettings,
  token?: string | null
): Promise<{ savedRemote: boolean; settings: SiteSettings; error?: string }> {
  if (!token) {
    return {
      savedRemote: false,
      settings,
      error: 'Debes iniciar sesión como administrador para publicar cambios en producción.',
    };
  }

  const normalized = mergeSettings({ ...settings, updatedAt: new Date().toISOString() });

  try {
    const res = await fetch(`${getApiUrl()}/api/site-settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
      body: JSON.stringify(normalized),
      signal: AbortSignal.timeout(8000),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && data?.success) {
      const confirmed = publishSessionSiteSettings(data.settings || normalized);
      return { savedRemote: true, settings: confirmed };
    }

    return {
      savedRemote: false,
      settings: normalized,
      error: data?.error || `Error del servidor (HTTP ${res.status})`,
    };
  } catch (err: any) {
    return {
      savedRemote: false,
      settings: normalized,
      error: err?.message || 'No se pudo conectar con el servidor de producción',
    };
  }
}
