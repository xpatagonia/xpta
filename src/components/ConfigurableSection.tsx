import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { ArrowRight, BarChart3, Film } from 'lucide-react';
import {
  CHART_DATASET_PRESETS,
  CustomContentBlock,
  HomeSectionDesignConfig,
  SectionCardStyle,
  SectionChartBlock,
  SectionColumnStyle,
  SectionMediaBlock,
  isLightColor,
  parseCustomChartSeries,
  parseHeroVideoSource,
  resolveFontFamilyCss,
} from '../lib/siteSettings';

export type SurfaceTone = 'light' | 'dark' | null;

export function resolveSectionSurfaceTone(config?: HomeSectionDesignConfig): SurfaceTone {
  if (!config || config.backgroundType === 'default') return null;
  if (config.backgroundType === 'image' || config.backgroundType === 'video') return 'dark';
  if (config.backgroundType === 'solid') {
    const light = isLightColor(config.backgroundColor);
    return light === true ? 'light' : 'dark';
  }
  if (config.backgroundType === 'gradient') {
    const fromLight = isLightColor(config.gradientFrom) === true;
    const toLight = isLightColor(config.gradientTo) === true;
    return fromLight && toLight ? 'light' : 'dark';
  }
  return null;
}

export function getSectionGridClass(
  columnStyle: SectionColumnStyle | undefined,
  fallbackClass: string
): string {
  switch (columnStyle) {
    case '1-col':
      return 'grid grid-cols-1 gap-4';
    case '2-col':
      return 'grid grid-cols-1 md:grid-cols-2 gap-5';
    case '3-col':
      return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5';
    case '4-col':
      return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4';
    case 'bento':
      return 'grid grid-cols-1 md:grid-cols-6 gap-5';
    case 'split-left':
    case 'split-right':
      return 'grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch';
    default:
      return fallbackClass;
  }
}

export function getSectionCardClass(
  cardStyle: SectionCardStyle | undefined,
  surfaceTone: SurfaceTone | boolean = null
): string {
  const tone: SurfaceTone =
    surfaceTone === true ? 'dark' : surfaceTone === false ? null : surfaceTone;

  if (tone === 'light') {
    switch (cardStyle) {
      case 'elevated':
        return 'bg-white text-slate-900 border border-slate-200/90 shadow-md shadow-slate-900/5';
      case 'glass':
        return 'bg-white/85 text-slate-900 backdrop-blur-md border border-slate-200/80';
      case 'minimal':
        return 'bg-transparent text-slate-900 border-b border-slate-200 rounded-none';
      default:
        return 'bg-white text-slate-900 border border-slate-200';
    }
  }

  if (tone === 'dark') {
    switch (cardStyle) {
      case 'elevated':
        return 'bg-slate-900/85 text-white border border-white/15 shadow-lg';
      case 'glass':
        return 'bg-[#181424]/75 text-white backdrop-blur-md border border-white/15';
      case 'minimal':
        return 'bg-transparent text-white border-b border-white/15 rounded-none';
      default:
        return 'bg-slate-900/75 text-white border border-white/15';
    }
  }

  switch (cardStyle) {
    case 'elevated':
      return 'bg-white dark:bg-[#1A1625] text-slate-900 dark:text-white border border-slate-200/80 dark:border-white/10 shadow-md shadow-slate-900/5';
    case 'glass':
      return 'bg-white/85 dark:bg-[#181424]/75 text-slate-900 dark:text-white backdrop-blur-md border border-slate-200/70 dark:border-white/15';
    case 'minimal':
      return 'bg-transparent text-slate-900 dark:text-white border-b border-slate-200 dark:border-white/10 rounded-none';
    default:
      return 'bg-white dark:bg-[#1A1625] text-slate-900 dark:text-white border border-slate-200 dark:border-white/10';
  }
}

export function getSectionHeadingSizeClass(
  scale: HomeSectionDesignConfig['headingScale'] | undefined,
  fallback = 'text-3xl md:text-4xl'
): string {
  switch (scale) {
    case 'compact':
      return 'text-2xl md:text-3xl';
    case 'editorial':
      return 'text-3xl md:text-5xl leading-[1.08]';
    default:
      return fallback;
  }
}

function getPaddingClass(scale: HomeSectionDesignConfig['paddingScale'] | undefined): string {
  switch (scale) {
    case 'compact':
      return 'py-10 md:py-12';
    case 'spacious':
      return 'py-20 md:py-28';
    default:
      return 'py-16 md:py-20';
  }
}

function SectionEmbeddedChart({
  chart,
  sectionAccent,
  surfaceTone,
}: {
  chart: SectionChartBlock;
  sectionAccent?: string;
  surfaceTone: SurfaceTone;
}) {
  const dataset = useMemo(() => {
    if (chart.dataPreset === 'custom') {
      return {
        title: chart.title || 'Métricas del Sector',
        subtitle: chart.subtitle || '',
        primaryLabel: chart.primaryLabel || 'Serie Principal',
        secondaryLabel: chart.secondaryLabel || 'Comparativa',
        series: parseCustomChartSeries(chart.customSeriesJson),
      };
    }
    const preset = CHART_DATASET_PRESETS[chart.dataPreset] || CHART_DATASET_PRESETS.vaca_muerta_capex;
    return {
      title: chart.title || preset.title,
      subtitle: chart.subtitle || preset.subtitle,
      primaryLabel: chart.primaryLabel || preset.primaryLabel,
      secondaryLabel: chart.secondaryLabel || preset.secondaryLabel,
      series: preset.series,
    };
  }, [chart]);

  const primaryColor = chart.accentColor || sectionAccent || '#f97316';
  const secondaryColor = '#6366f1';
  const isDarkSurface = surfaceTone === 'dark';
  const axisTickColor = isDarkSurface ? '#CBD5E1' : '#64748B';
  const gridStroke = isDarkSurface ? 'rgba(255,255,255,0.1)' : 'rgba(148,163,184,0.22)';
  const cardSurface = getSectionCardClass('bordered', surfaceTone);

  return (
    <div className={`rounded-2xl p-5 sm:p-6 ${cardSurface}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
        <div>
          <h3 className="text-base sm:text-lg font-display font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="w-4 h-4 shrink-0" style={{ color: primaryColor }} />
            <span>{dataset.title}</span>
          </h3>
          {dataset.subtitle && <p className="text-xs opacity-75 mt-0.5">{dataset.subtitle}</p>}
        </div>
        <span className="text-[11px] font-mono tabular-nums opacity-70 shrink-0">
          Datos Estructurales · Serie {dataset.series.length} pts
        </span>
      </div>

      <div className="w-full h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          {chart.chartType === 'area' ? (
            <AreaChart data={dataset.series} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: axisTickColor }} />
              <YAxis tick={{ fontSize: 11, fill: axisTickColor }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderColor: 'rgba(255,255,255,0.12)',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                  color: '#F8FAFC',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Area
                type="monotone"
                dataKey="primary"
                name={dataset.primaryLabel}
                stroke={primaryColor}
                fill={primaryColor}
                fillOpacity={0.22}
                strokeWidth={2}
              />
              {dataset.series.some((d) => d.secondary !== undefined) && (
                <Area
                  type="monotone"
                  dataKey="secondary"
                  name={dataset.secondaryLabel}
                  stroke={secondaryColor}
                  fill={secondaryColor}
                  fillOpacity={0.14}
                  strokeWidth={2}
                />
              )}
            </AreaChart>
          ) : chart.chartType === 'line' ? (
            <LineChart data={dataset.series} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: axisTickColor }} />
              <YAxis tick={{ fontSize: 11, fill: axisTickColor }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderColor: 'rgba(255,255,255,0.12)',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                  color: '#F8FAFC',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line
                type="monotone"
                dataKey="primary"
                name={dataset.primaryLabel}
                stroke={primaryColor}
                strokeWidth={2.5}
                dot={{ r: 4 }}
              />
              {dataset.series.some((d) => d.secondary !== undefined) && (
                <Line
                  type="monotone"
                  dataKey="secondary"
                  name={dataset.secondaryLabel}
                  stroke={secondaryColor}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              )}
            </LineChart>
          ) : (
            <BarChart data={dataset.series} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: axisTickColor }} />
              <YAxis tick={{ fontSize: 11, fill: axisTickColor }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderColor: 'rgba(255,255,255,0.12)',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                  color: '#F8FAFC',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar
                dataKey="primary"
                name={dataset.primaryLabel}
                fill={primaryColor}
                radius={[6, 6, 0, 0]}
              />
              {dataset.series.some((d) => d.secondary !== undefined) && (
                <Bar
                  dataKey="secondary"
                  name={dataset.secondaryLabel}
                  fill={secondaryColor}
                  radius={[6, 6, 0, 0]}
                />
              )}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function SectionEmbeddedMedia({
  media,
  surfaceTone,
}: {
  media: SectionMediaBlock;
  surfaceTone: SurfaceTone;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const parsedVideo = media.kind === 'video' ? parseHeroVideoSource(media.url) : null;
  const captionSurface =
    surfaceTone === 'light'
      ? 'bg-white text-slate-900 border-t border-slate-200'
      : surfaceTone === 'dark'
      ? 'bg-[#171322] text-white border-t border-white/10'
      : 'bg-white dark:bg-[#171322] text-slate-900 dark:text-white border-t border-slate-200 dark:border-white/10';

  if (!media.url) return null;

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-950">
      <div className="relative aspect-video w-full bg-slate-900">
        {media.kind === 'video' && parsedVideo ? (
          parsedVideo.kind === 'direct' ? (
            <video
              key={parsedVideo.src}
              src={parsedVideo.src}
              controls
              playsInline
              muted
              loop
              preload="metadata"
              className="w-full h-full object-cover"
            />
          ) : (
            <iframe
              key={parsedVideo.embedUrl}
              src={parsedVideo.embedUrl}
              title={media.title || 'Video institucional'}
              className="w-full h-full border-0"
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
              allowFullScreen
            />
          )
        ) : imgFailed ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-6 text-slate-300 bg-gradient-to-br from-slate-900 to-slate-800">
            <Film className="w-8 h-8 text-orange-400" />
            <span className="text-sm font-semibold">{media.title || 'Recurso Multimedia'}</span>
          </div>
        ) : (
          <img
            src={media.url}
            alt={media.title || 'Contenido visual de sección'}
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="w-full h-full object-cover"
          />
        )}
      </div>
      {(media.title || media.caption) && (
        <div className={`px-5 py-3.5 ${captionSurface}`}>
          {media.title && <h4 className="text-sm font-bold">{media.title}</h4>}
          {media.caption && <p className="text-xs opacity-75 mt-0.5">{media.caption}</p>}
        </div>
      )}
    </div>
  );
}

function CustomBlocksGrid({
  blocks,
  config,
  surfaceTone,
}: {
  blocks: CustomContentBlock[];
  config?: HomeSectionDesignConfig;
  surfaceTone: SurfaceTone;
}) {
  if (!blocks || blocks.length === 0) return null;
  const accentColor = config?.accentColor || '#f97316';
  const cardSurface = getSectionCardClass(config?.cardStyle, surfaceTone);
  const gridClass = getSectionGridClass(
    config?.columnStyle,
    blocks.length === 1
      ? 'grid grid-cols-1 gap-5'
      : blocks.length === 2
      ? 'grid grid-cols-1 md:grid-cols-2 gap-5'
      : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'
  );

  return (
    <div className={`${gridClass} mt-8`}>
      {blocks.map((blk) => (
        <article
          key={blk.id}
          className={`rounded-2xl overflow-hidden flex flex-col justify-between transition-colors ${cardSurface}`}
        >
          <div>
            {blk.imageUrl && (
              <div className="aspect-[16/9] w-full bg-slate-900 overflow-hidden">
                <img
                  src={blk.imageUrl}
                  alt={blk.title || 'Imagen de bloque'}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-5 sm:p-6">
              {blk.eyebrow && (
                <p className="text-xs font-bold mb-1.5" style={{ color: accentColor }}>
                  {blk.eyebrow}
                </p>
              )}
              <h3 className="text-lg font-display font-bold leading-snug mb-2">{blk.title}</h3>
              {blk.description && (
                <p className="text-sm opacity-80 leading-relaxed">{blk.description}</p>
              )}
            </div>
          </div>
          {blk.ctaLabel && (
            <div className="px-5 sm:px-6 pb-5 pt-2">
              <Link
                to={blk.ctaPath || '/servicios'}
                className="inline-flex items-center gap-1.5 text-xs font-bold hover:underline"
                style={{ color: accentColor }}
              >
                <span>{blk.ctaLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

interface ConfigurableSectionProps {
  id?: string;
  config?: HomeSectionDesignConfig;
  defaultClassName: string;
  innerContainerClassName?: string;
  children: React.ReactNode;
  noPaddingWrapper?: boolean;
}

export default function ConfigurableSection({
  id,
  config,
  defaultClassName,
  innerContainerClassName = 'max-w-7xl mx-auto px-4 sm:px-6 md:px-12 relative z-10',
  children,
  noPaddingWrapper = false,
}: ConfigurableSectionProps) {
  const bgType = config?.backgroundType || 'default';
  const parsedBgVideo =
    bgType === 'video' && config?.backgroundVideoUrl
      ? parseHeroVideoSource(config.backgroundVideoUrl)
      : null;

  const surfaceTone = resolveSectionSurfaceTone(config);

  const sectionInlineStyle: React.CSSProperties = {};
  if (bgType === 'solid' && config?.backgroundColor) {
    sectionInlineStyle.backgroundColor = config.backgroundColor;
  } else if (bgType === 'gradient') {
    const from = config?.gradientFrom || '#0F172A';
    const to = config?.gradientTo || '#1E1B4B';
    sectionInlineStyle.backgroundImage = `linear-gradient(135deg, ${from} 0%, ${to} 100%)`;
  }

  if (config?.textColor) {
    sectionInlineStyle.color = config.textColor;
  } else if (surfaceTone === 'light') {
    sectionInlineStyle.color = '#0F172A';
  } else if (surfaceTone === 'dark') {
    sectionInlineStyle.color = '#F8FAFC';
  }

  if (config?.bodyFont && config.bodyFont !== 'inherit') {
    sectionInlineStyle.fontFamily = resolveFontFamilyCss(config.bodyFont);
  }
  if (config?.headingFont && config.headingFont !== 'inherit') {
    (sectionInlineStyle as Record<string, string>)['--xp-font-display'] = resolveFontFamilyCss(
      config.headingFont
    );
  }
  if (config?.accentColor) {
    (sectionInlineStyle as Record<string, string>)['--xp-section-accent'] = config.accentColor;
  }

  const hasCustomSurface = bgType !== 'default';
  const overlayAlpha = Math.min(0.85, Math.max(0.1, (config?.overlayOpacity ?? 55) / 100));
  const paddingClass = noPaddingWrapper ? '' : getPaddingClass(config?.paddingScale);

  const showMedia = Boolean(config?.mediaBlock?.enabled && config.mediaBlock.url?.trim());
  const showChart = Boolean(config?.chartBlock?.enabled);
  const mediaIsSplit = showMedia && config?.mediaBlock.position === 'split';
  const customBlocks = config?.customBlocks || [];

  const effectiveSectionClass = hasCustomSurface
    ? `${paddingClass} relative overflow-hidden border-t ${
        surfaceTone === 'light' ? 'border-slate-200/80' : 'border-white/10'
      }`
    : `${defaultClassName} text-slate-900 dark:text-white ${paddingClass} relative overflow-hidden`;

  return (
    <section
      id={id}
      data-home-section={config?.id || id}
      data-surface-tone={surfaceTone || undefined}
      className={effectiveSectionClass}
      style={sectionInlineStyle}
    >
      {/* Background Image */}
      {bgType === 'image' && config?.backgroundImageUrl && (
        <img
          src={config.backgroundImageUrl}
          alt=""
          aria-hidden="true"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
      )}

      {/* Background Video */}
      {bgType === 'video' && parsedBgVideo && (
        parsedBgVideo.kind === 'direct' ? (
          <video
            key={parsedBgVideo.src}
            src={parsedBgVideo.src}
            autoPlay
            muted
            loop
            playsInline
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />
        ) : (
          <iframe
            key={parsedBgVideo.embedUrl}
            src={parsedBgVideo.embedUrl}
            title="Video de fondo"
            aria-hidden="true"
            className="absolute inset-0 w-full h-full pointer-events-none border-0"
            allow="autoplay; encrypted-media; fullscreen"
          />
        )
      )}

      {/* Scrim for image/video legibility */}
      {(bgType === 'image' || bgType === 'video') && (
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundColor: `rgba(8, 10, 18, ${overlayAlpha})` }}
        />
      )}

      {/* Top Media or Chart Slots */}
      {(showMedia && config?.mediaBlock.position === 'top') ||
      (showChart && config?.chartBlock.position === 'top') ? (
        <div className={`${innerContainerClassName} space-y-6 mb-8`}>
          {showMedia && config?.mediaBlock.position === 'top' && (
            <SectionEmbeddedMedia media={config.mediaBlock} surfaceTone={surfaceTone} />
          )}
          {showChart && config?.chartBlock.position === 'top' && (
            <SectionEmbeddedChart
              chart={config.chartBlock}
              sectionAccent={config.accentColor}
              surfaceTone={surfaceTone}
            />
          )}
        </div>
      ) : null}

      {/* Main Content (with optional side-by-side Split Media) */}
      {mediaIsSplit && config?.mediaBlock ? (
        <div className={innerContainerClassName}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 min-w-0">{children}</div>
            <div className="lg:col-span-5 min-w-0 lg:sticky lg:top-24">
              <SectionEmbeddedMedia media={config.mediaBlock} surfaceTone={surfaceTone} />
            </div>
          </div>
          <CustomBlocksGrid blocks={customBlocks} config={config} surfaceTone={surfaceTone} />
        </div>
      ) : (
        <div className={innerContainerClassName}>
          {children}
          <CustomBlocksGrid blocks={customBlocks} config={config} surfaceTone={surfaceTone} />
        </div>
      )}

      {/* Bottom Media or Chart Slots */}
      {(showMedia && config?.mediaBlock.position === 'bottom') ||
      (showChart && config?.chartBlock.position === 'bottom') ? (
        <div className={`${innerContainerClassName} space-y-6 mt-8`}>
          {showChart && config?.chartBlock.position === 'bottom' && (
            <SectionEmbeddedChart
              chart={config.chartBlock}
              sectionAccent={config.accentColor}
              surfaceTone={surfaceTone}
            />
          )}
          {showMedia && config?.mediaBlock.position === 'bottom' && (
            <SectionEmbeddedMedia media={config.mediaBlock} surfaceTone={surfaceTone} />
          )}
        </div>
      ) : null}
    </section>
  );
}
