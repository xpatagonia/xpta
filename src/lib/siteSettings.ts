import { getApiUrl } from './apiConfig';
import { supabase, isSupabaseConfigured } from './supabase';

export type HeroBackgroundType = 'gradient' | 'image' | 'video';
export type HeroOverlayTint = 'dark' | 'purple' | 'slate';

export type HomeSectionId =
  | 'indicators'
  | 'insights'
  | 'ecosystem'
  | 'categories'
  | 'howItWorks'
  | 'contact';

export type DesignFontPreset =
  | 'Outfit'
  | 'Plus Jakarta Sans'
  | 'Bricolage Grotesque'
  | 'Barlow Condensed'
  | 'Fraunces'
  | 'Playfair Display'
  | 'DM Sans'
  | 'Manrope'
  | 'Public Sans'
  | 'Lora';

export type SectionColumnStyle =
  | 'auto'
  | '1-col'
  | '2-col'
  | '3-col'
  | '4-col'
  | 'bento'
  | 'split-left'
  | 'split-right';

export type SectionCardStyle = 'bordered' | 'elevated' | 'glass' | 'minimal';
export type SectionBackgroundType = 'default' | 'solid' | 'gradient' | 'image' | 'video';
export type SectionChartPreset =
  | 'vaca_muerta_capex'
  | 'logistics_corridors'
  | 'directory_mix'
  | 'custom';

export interface SectionChartDataPoint {
  label: string;
  primary: number;
  secondary?: number;
}

export interface SectionChartBlock {
  enabled: boolean;
  position: 'top' | 'bottom';
  chartType: 'bar' | 'area' | 'line';
  title: string;
  subtitle: string;
  dataPreset: SectionChartPreset;
  primaryLabel?: string;
  secondaryLabel?: string;
  accentColor?: string;
  customSeriesJson?: string;
}

export interface SectionMediaBlock {
  enabled: boolean;
  position: 'top' | 'bottom' | 'split';
  kind: 'image' | 'video';
  url: string;
  title: string;
  caption: string;
}

export interface HomeSectionDesignConfig {
  id: HomeSectionId;
  eyebrowOverride?: string;
  titleOverride?: string;
  subtitleOverride?: string;
  backgroundType: SectionBackgroundType;
  backgroundColor: string;
  gradientFrom: string;
  gradientTo: string;
  backgroundImageUrl: string;
  backgroundVideoUrl: string;
  overlayOpacity: number;
  textColor: string;
  accentColor: string;
  headingFont: 'inherit' | DesignFontPreset;
  bodyFont: 'inherit' | DesignFontPreset;
  headingScale: 'compact' | 'standard' | 'editorial';
  columnStyle: SectionColumnStyle;
  cardStyle: SectionCardStyle;
  paddingScale: 'compact' | 'standard' | 'spacious';
  mediaBlock: SectionMediaBlock;
  chartBlock: SectionChartBlock;
}

export interface MenuLinkItem {
  id: string;
  label: string;
  path: string;
  visible: boolean;
}

export interface MenuSettings {
  variant: 'solid' | 'glass' | 'minimal';
  sticky: boolean;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  fontFamily: 'inherit' | DesignFontPreset;
  ctaLabel: string;
  ctaPath: string;
  items: MenuLinkItem[];
}

export interface GlobalDesignTheme {
  presetId: string;
  displayFont: DesignFontPreset;
  bodyFont: DesignFontPreset;
  accentColor: string;
  secondaryAccentColor: string;
  borderRadius: 'sharp' | 'balanced' | 'editorial';
}

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
  sectionOrder: HomeSectionId[];
  sectionConfigs: Record<HomeSectionId, HomeSectionDesignConfig>;
  menu: MenuSettings;
  designTheme: GlobalDesignTheme;
  footer: FooterSettings;
  platform: PricingSummarySettings;
  updatedAt: string;
}

export const DISPLAY_FONT_OPTIONS: { value: DesignFontPreset; label: string; tone: string }[] = [
  { value: 'Outfit', label: 'Outfit', tone: 'Geométrica Industrial' },
  { value: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans', tone: 'Moderna Corporativa' },
  { value: 'Bricolage Grotesque', label: 'Bricolage Grotesque', tone: 'Expresiva Técnica' },
  { value: 'Barlow Condensed', label: 'Barlow Condensed', tone: 'Condensada Ingeniería' },
  { value: 'Fraunces', label: 'Fraunces', tone: 'Editorial Austral' },
  { value: 'Playfair Display', label: 'Playfair Display', tone: 'Editorial Institucional' },
];

export const BODY_FONT_OPTIONS: { value: DesignFontPreset; label: string; tone: string }[] = [
  { value: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans', tone: 'Lectura Nítida' },
  { value: 'DM Sans', label: 'DM Sans', tone: 'Minimalista SaaS' },
  { value: 'Manrope', label: 'Manrope', tone: 'Operativa B2B' },
  { value: 'Public Sans', label: 'Public Sans', tone: 'Institucional Clara' },
  { value: 'Lora', label: 'Lora', tone: 'Editorial Serif' },
];

const SERIF_FONTS = new Set<string>(['Fraunces', 'Playfair Display', 'Lora']);

export function resolveFontFamilyCss(
  font: 'inherit' | DesignFontPreset | string | undefined,
  fallbackCss = 'var(--xp-font-sans)'
): string {
  if (!font || font === 'inherit') return fallbackCss;
  return SERIF_FONTS.has(font)
    ? `"${font}", Georgia, serif`
    : `"${font}", ui-sans-serif, system-ui, sans-serif`;
}

export const HOME_SECTION_META: Record<
  HomeSectionId,
  { label: string; description: string; defaultChartPreset: SectionChartPreset }
> = {
  indicators: {
    label: 'Indicadores de Mercado',
    description: 'Ticker en vivo + Brent, Medanito, divisas e indicadores patagónicos.',
    defaultChartPreset: 'vaca_muerta_capex',
  },
  insights: {
    label: 'Patagonia Insights',
    description: 'Noticias sectoriales, reportes estratégicos y cápsulas multimedia.',
    defaultChartPreset: 'vaca_muerta_capex',
  },
  ecosystem: {
    label: 'Motores de Plataforma',
    description: 'Showcase de ARN IA + CRM, Suite PyME por asientos y Flota Logística.',
    defaultChartPreset: 'logistics_corridors',
  },
  categories: {
    label: 'Directorio & Rubros B2B',
    description: 'Empresas, emprendimientos, profesionales y servicios filtrables.',
    defaultChartPreset: 'directory_mix',
  },
  howItWorks: {
    label: 'Ciclo Operativo (Cómo Funciona)',
    description: 'Flujo paso a paso de búsqueda, calificación ARN IA, RFQ y despacho.',
    defaultChartPreset: 'logistics_corridors',
  },
  contact: {
    label: 'Solicitud de Cotización (RFQ)',
    description: 'Formulario de captura de demanda industrial conectado al Hub.',
    defaultChartPreset: 'vaca_muerta_capex',
  },
};

export const CHART_DATASET_PRESETS: Record<
  Exclude<SectionChartPreset, 'custom'>,
  {
    title: string;
    subtitle: string;
    primaryLabel: string;
    secondaryLabel: string;
    series: SectionChartDataPoint[];
  }
> = {
  vaca_muerta_capex: {
    title: 'Demanda Industrial & Licitaciones B2B por Trimestre',
    subtitle: 'Índice de requerimientos canalizados en Cuenca Neuquina y Golfo San Jorge (M USD eq.)',
    primaryLabel: 'Demanda RFQ',
    secondaryLabel: 'Contratos Adjudicados',
    series: [
      { label: 'Q1', primary: 42, secondary: 28 },
      { label: 'Q2', primary: 58, secondary: 39 },
      { label: 'Q3', primary: 71, secondary: 52 },
      { label: 'Q4', primary: 89, secondary: 66 },
    ],
  },
  logistics_corridors: {
    title: 'Tráfico & Carga Verificada por Corredor Vial',
    subtitle: 'Distribución mensual de despachos trazados por OSRM (toneladas eq. x100)',
    primaryLabel: 'Carga Consolidada',
    secondaryLabel: 'Retornos Aprovechados',
    series: [
      { label: 'RN 3', primary: 94, secondary: 61 },
      { label: 'RN 22', primary: 86, secondary: 54 },
      { label: 'RN 40', primary: 62, secondary: 38 },
      { label: 'RN 25', primary: 48, secondary: 29 },
    ],
  },
  directory_mix: {
    title: 'Composición del Ecosistema Productivo Regional',
    subtitle: 'Distribución de actores activos validados por vertical industrial',
    primaryLabel: 'Activos Verificados',
    secondaryLabel: 'Suscripción Pro/Corp',
    series: [
      { label: 'Oil & Gas', primary: 118, secondary: 74 },
      { label: 'Logística', primary: 92, secondary: 63 },
      { label: 'Metalurgia', primary: 76, secondary: 44 },
      { label: 'Renovables', primary: 54, secondary: 36 },
      { label: 'Pesca/Agro', primary: 68, secondary: 41 },
    ],
  },
};

export function parseCustomChartSeries(jsonRaw?: string): SectionChartDataPoint[] {
  if (!jsonRaw) return CHART_DATASET_PRESETS.vaca_muerta_capex.series;
  try {
    const parsed = JSON.parse(jsonRaw);
    if (!Array.isArray(parsed)) return CHART_DATASET_PRESETS.vaca_muerta_capex.series;
    const valid = parsed
      .slice(0, 12)
      .map((item: any) => ({
        label: String(item?.label || '').slice(0, 24),
        primary: Number(item?.primary ?? item?.value ?? 0),
        secondary: item?.secondary !== undefined ? Number(item.secondary) : undefined,
      }))
      .filter((d) => d.label && Number.isFinite(d.primary));
    return valid.length > 0 ? valid : CHART_DATASET_PRESETS.vaca_muerta_capex.series;
  } catch {
    return CHART_DATASET_PRESETS.vaca_muerta_capex.series;
  }
}

function makeDefaultSectionConfig(
  id: HomeSectionId,
  overrides?: Partial<HomeSectionDesignConfig>
): HomeSectionDesignConfig {
  const chartMeta = CHART_DATASET_PRESETS[HOME_SECTION_META[id].defaultChartPreset];
  return {
    id,
    eyebrowOverride: '',
    titleOverride: '',
    subtitleOverride: '',
    backgroundType: 'default',
    backgroundColor: '#0D0A13',
    gradientFrom: '#0F172A',
    gradientTo: '#1E1B4B',
    backgroundImageUrl: '',
    backgroundVideoUrl: '',
    overlayOpacity: 55,
    textColor: '',
    accentColor: '',
    headingFont: 'inherit',
    bodyFont: 'inherit',
    headingScale: 'standard',
    columnStyle: 'auto',
    cardStyle: 'bordered',
    paddingScale: 'standard',
    mediaBlock: {
      enabled: false,
      position: 'top',
      kind: 'image',
      url: '',
      title: '',
      caption: '',
    },
    chartBlock: {
      enabled: false,
      position: 'bottom',
      chartType: 'bar',
      title: chartMeta.title,
      subtitle: chartMeta.subtitle,
      dataPreset: HOME_SECTION_META[id].defaultChartPreset,
      primaryLabel: chartMeta.primaryLabel,
      secondaryLabel: chartMeta.secondaryLabel,
      accentColor: '#f97316',
      customSeriesJson: JSON.stringify(chartMeta.series, null, 2),
    },
    ...overrides,
  };
}

export const DEFAULT_SECTION_ORDER: HomeSectionId[] = [
  'indicators',
  'insights',
  'ecosystem',
  'categories',
  'howItWorks',
  'contact',
];

export const DEFAULT_MENU_ITEMS: MenuLinkItem[] = [
  { id: 'insights', label: 'Insights', path: '/insights', visible: true },
  { id: 'directory', label: 'Directorio B2B', path: '/servicios', visible: true },
  { id: 'marketplace', label: 'Catálogo RFQ', path: '/marketplace', visible: true },
  { id: 'logistics', label: 'Logística', path: '/logistica', visible: true },
  { id: 'chat', label: 'Chat B2B', path: '/chat', visible: true },
  { id: 'plans', label: 'Planes & CRM', path: '/planes', visible: true },
];

export interface AestheticThemePreset {
  id: string;
  name: string;
  description: string;
  displayFont: DesignFontPreset;
  bodyFont: DesignFontPreset;
  accentColor: string;
  secondaryAccentColor: string;
  borderRadius: GlobalDesignTheme['borderRadius'];
  menuVariant: MenuSettings['variant'];
  menuBg: string;
  menuText: string;
  sectionBackgrounds: Partial<Record<HomeSectionId, Partial<HomeSectionDesignConfig>>>;
}

export const AESTHETIC_THEME_PRESETS: AestheticThemePreset[] = [
  {
    id: 'patagonia-default',
    name: 'Patagonia Base',
    description: 'Contraste limpio oscuro/claro con acento naranja industrial y púrpura.',
    displayFont: 'Outfit',
    bodyFont: 'Plus Jakarta Sans',
    accentColor: '#f97316',
    secondaryAccentColor: '#9333ea',
    borderRadius: 'balanced',
    menuVariant: 'glass',
    menuBg: '',
    menuText: '',
    sectionBackgrounds: {
      indicators: { backgroundType: 'default', cardStyle: 'bordered', columnStyle: 'auto' },
      insights: { backgroundType: 'default', cardStyle: 'bordered', columnStyle: 'auto' },
      ecosystem: { backgroundType: 'default', cardStyle: 'bordered', columnStyle: 'auto' },
      categories: { backgroundType: 'default', cardStyle: 'bordered', columnStyle: 'auto' },
      howItWorks: { backgroundType: 'default', cardStyle: 'bordered', columnStyle: 'auto' },
      contact: { backgroundType: 'default', cardStyle: 'bordered', columnStyle: 'auto' },
    },
  },
  {
    id: 'vaca-muerta-industrial',
    name: 'Ingeniería & Energía',
    description: 'Tipografía condensada técnica, pizarras oscuras profundas y acento ámbar.',
    displayFont: 'Barlow Condensed',
    bodyFont: 'Public Sans',
    accentColor: '#ea580c',
    secondaryAccentColor: '#0284c7',
    borderRadius: 'sharp',
    menuVariant: 'solid',
    menuBg: '#090D16',
    menuText: '#F8FAFC',
    sectionBackgrounds: {
      indicators: { backgroundType: 'solid', backgroundColor: '#0B1120', textColor: '#F8FAFC', accentColor: '#ea580c', cardStyle: 'bordered' },
      insights: { backgroundType: 'solid', backgroundColor: '#0F172A', textColor: '#F8FAFC', accentColor: '#0284c7', cardStyle: 'minimal' },
      ecosystem: { backgroundType: 'gradient', gradientFrom: '#090D16', gradientTo: '#1E293B', textColor: '#F8FAFC', accentColor: '#ea580c', cardStyle: 'glass' },
      categories: { backgroundType: 'solid', backgroundColor: '#0B1120', textColor: '#F8FAFC', accentColor: '#ea580c', cardStyle: 'bordered' },
      howItWorks: { backgroundType: 'solid', backgroundColor: '#0F172A', textColor: '#F8FAFC', accentColor: '#0284c7', cardStyle: 'bordered' },
      contact: { backgroundType: 'gradient', gradientFrom: '#090D16', gradientTo: '#172554', textColor: '#F8FAFC', accentColor: '#ea580c', cardStyle: 'glass' },
    },
  },
  {
    id: 'editorial-austral',
    name: 'Editorial Austral',
    description: 'Titulares serif de alto prestigio con respiro blanco/grafito y verde esmeralda.',
    displayFont: 'Fraunces',
    bodyFont: 'DM Sans',
    accentColor: '#059669',
    secondaryAccentColor: '#0f172a',
    borderRadius: 'editorial',
    menuVariant: 'minimal',
    menuBg: '#FFFFFF',
    menuText: '#0F172A',
    sectionBackgrounds: {
      indicators: { backgroundType: 'solid', backgroundColor: '#F8FAFC', textColor: '#0F172A', accentColor: '#059669', headingScale: 'editorial', cardStyle: 'minimal' },
      insights: { backgroundType: 'solid', backgroundColor: '#FFFFFF', textColor: '#0F172A', accentColor: '#059669', headingScale: 'editorial', cardStyle: 'bordered' },
      ecosystem: { backgroundType: 'solid', backgroundColor: '#0F172A', textColor: '#F8FAFC', accentColor: '#10b981', headingScale: 'editorial', cardStyle: 'glass' },
      categories: { backgroundType: 'solid', backgroundColor: '#F8FAFC', textColor: '#0F172A', accentColor: '#059669', headingScale: 'editorial', cardStyle: 'elevated' },
      howItWorks: { backgroundType: 'solid', backgroundColor: '#FFFFFF', textColor: '#0F172A', accentColor: '#059669', headingScale: 'editorial', cardStyle: 'minimal' },
      contact: { backgroundType: 'solid', backgroundColor: '#F1F5F9', textColor: '#0F172A', accentColor: '#059669', headingScale: 'editorial', cardStyle: 'elevated' },
    },
  },
  {
    id: 'modern-b2b-tech',
    name: 'Hub Tecnológico',
    description: 'Bricolage Grotesque + Manrope con bloques bento y acento cobalto.',
    displayFont: 'Bricolage Grotesque',
    bodyFont: 'Manrope',
    accentColor: '#2563eb',
    secondaryAccentColor: '#f97316',
    borderRadius: 'balanced',
    menuVariant: 'glass',
    menuBg: '',
    menuText: '',
    sectionBackgrounds: {
      indicators: { backgroundType: 'default', accentColor: '#2563eb', cardStyle: 'elevated' },
      insights: { backgroundType: 'default', accentColor: '#2563eb', columnStyle: 'bento', cardStyle: 'bordered' },
      ecosystem: { backgroundType: 'gradient', gradientFrom: '#0A0E1A', gradientTo: '#172554', textColor: '#F8FAFC', accentColor: '#3b82f6', cardStyle: 'glass' },
      categories: { backgroundType: 'default', accentColor: '#2563eb', columnStyle: '2-col', cardStyle: 'elevated' },
      howItWorks: { backgroundType: 'default', accentColor: '#2563eb', columnStyle: '4-col', cardStyle: 'bordered' },
      contact: { backgroundType: 'default', accentColor: '#2563eb', columnStyle: 'split-left', cardStyle: 'elevated' },
    },
  },
];

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

  // 2. Cloudflare Stream URLs
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
  sectionOrder: [...DEFAULT_SECTION_ORDER],
  sectionConfigs: {
    indicators: makeDefaultSectionConfig('indicators'),
    insights: makeDefaultSectionConfig('insights'),
    ecosystem: makeDefaultSectionConfig('ecosystem'),
    categories: makeDefaultSectionConfig('categories'),
    howItWorks: makeDefaultSectionConfig('howItWorks'),
    contact: makeDefaultSectionConfig('contact'),
  },
  menu: {
    variant: 'glass',
    sticky: true,
    backgroundColor: '',
    textColor: '',
    accentColor: '#f97316',
    fontFamily: 'inherit',
    ctaLabel: 'Suscribir Empresa',
    ctaPath: '/planes',
    items: DEFAULT_MENU_ITEMS.map((item) => ({ ...item })),
  },
  designTheme: {
    presetId: 'patagonia-default',
    displayFont: 'Outfit',
    bodyFont: 'Plus Jakarta Sans',
    accentColor: '#f97316',
    secondaryAccentColor: '#9333ea',
    borderRadius: 'balanced',
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

let activeSessionSettings: SiteSettings | null = null;

function mergeSectionConfig(
  id: HomeSectionId,
  incoming?: Partial<HomeSectionDesignConfig>
): HomeSectionDesignConfig {
  const base = DEFAULT_SITE_SETTINGS.sectionConfigs[id];
  if (!incoming) return base;
  return {
    ...base,
    ...incoming,
    id,
    mediaBlock: {
      ...base.mediaBlock,
      ...(incoming.mediaBlock || {}),
    },
    chartBlock: {
      ...base.chartBlock,
      ...(incoming.chartBlock || {}),
    },
  };
}

export function mergeSettings(partial?: Partial<SiteSettings> | null): SiteSettings {
  if (!partial) return DEFAULT_SITE_SETTINGS;

  const incomingOrder = Array.isArray(partial.sectionOrder)
    ? partial.sectionOrder.filter((id): id is HomeSectionId => DEFAULT_SECTION_ORDER.includes(id))
    : [];
  const mergedOrder = [...incomingOrder];
  for (const id of DEFAULT_SECTION_ORDER) {
    if (!mergedOrder.includes(id)) mergedOrder.push(id);
  }

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
    sectionOrder: mergedOrder,
    sectionConfigs: {
      indicators: mergeSectionConfig('indicators', partial.sectionConfigs?.indicators),
      insights: mergeSectionConfig('insights', partial.sectionConfigs?.insights),
      ecosystem: mergeSectionConfig('ecosystem', partial.sectionConfigs?.ecosystem),
      categories: mergeSectionConfig('categories', partial.sectionConfigs?.categories),
      howItWorks: mergeSectionConfig('howItWorks', partial.sectionConfigs?.howItWorks),
      contact: mergeSectionConfig('contact', partial.sectionConfigs?.contact),
    },
    menu: {
      ...DEFAULT_SITE_SETTINGS.menu,
      ...(partial.menu || {}),
      items:
        Array.isArray(partial.menu?.items) && partial.menu.items.length > 0
          ? partial.menu.items
          : DEFAULT_SITE_SETTINGS.menu.items.map((item) => ({ ...item })),
    },
    designTheme: {
      ...DEFAULT_SITE_SETTINGS.designTheme,
      ...(partial.designTheme || {}),
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

export function applyGlobalDesignTokens(settings: SiteSettings): void {
  if (typeof document === 'undefined') return;
  const rootStyle = document.documentElement.style;
  rootStyle.setProperty(
    '--xp-font-display',
    resolveFontFamilyCss(settings.designTheme.displayFont, '"Outfit", ui-sans-serif, system-ui, sans-serif')
  );
  rootStyle.setProperty(
    '--xp-font-sans',
    resolveFontFamilyCss(settings.designTheme.bodyFont, '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif')
  );
  if (settings.designTheme.accentColor) {
    rootStyle.setProperty('--xp-accent', settings.designTheme.accentColor);
  }
  if (settings.designTheme.secondaryAccentColor) {
    rootStyle.setProperty('--xp-accent-secondary', settings.designTheme.secondaryAccentColor);
  }
}

export function applyThemePresetToSettings(
  current: SiteSettings,
  presetId: string
): SiteSettings {
  const preset = AESTHETIC_THEME_PRESETS.find((p) => p.id === presetId);
  if (!preset) return current;

  const nextConfigs = { ...current.sectionConfigs };
  for (const id of DEFAULT_SECTION_ORDER) {
    const patch = preset.sectionBackgrounds[id];
    if (patch) {
      nextConfigs[id] = mergeSectionConfig(id, {
        ...nextConfigs[id],
        ...patch,
      });
    }
  }

  return mergeSettings({
    ...current,
    designTheme: {
      ...current.designTheme,
      presetId: preset.id,
      displayFont: preset.displayFont,
      bodyFont: preset.bodyFont,
      accentColor: preset.accentColor,
      secondaryAccentColor: preset.secondaryAccentColor,
      borderRadius: preset.borderRadius,
    },
    menu: {
      ...current.menu,
      variant: preset.menuVariant,
      backgroundColor: preset.menuBg,
      textColor: preset.menuText,
      accentColor: preset.accentColor,
    },
    sectionConfigs: nextConfigs,
  });
}

export function getCachedSiteSettings(): SiteSettings {
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
  applyGlobalDesignTokens(merged);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SITE_SETTINGS_EVENT, { detail: merged }));
  }
  return merged;
}

export async function fetchSiteSettings(): Promise<SiteSettings> {
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
