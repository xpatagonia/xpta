import React, { useMemo, useState } from 'react';
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
import { BarChart3, Film } from 'lucide-react';
import {
  CHART_DATASET_PRESETS,
  HomeSectionDesignConfig,
  SectionCardStyle,
  SectionChartBlock,
  SectionColumnStyle,
  SectionMediaBlock,
  parseCustomChartSeries,
  parseHeroVideoSource,
  resolveFontFamilyCss,
} from '../lib/siteSettings';

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
  hasDarkSurface = false
): string {
  const darkFallback = hasDarkSurface
    ? 'bg-slate-900/75 text-white border-white/15'
    : 'bg-white dark:bg-[#1A1625] border-slate-200 dark:border-white/10';

  switch (cardStyle) {
    case 'elevated':
      return hasDarkSurface
        ? 'bg-slate-900/85 border border-white/15 shadow-lg'
        : 'bg-white dark:bg-[#1A1625] border border-slate-200/80 dark:border-white/10 shadow-md shadow-slate-900/5';
    case 'glass':
      return 'bg-white/80 dark:bg-[#181424]/75 backdrop-blur-md border border-slate-200/70 dark:border-white/15';
    case 'minimal':
      return 'bg-transparent border-b border-slate-200 dark:border-white/10 rounded-none';
    default:
      return `${darkFallback} border`;
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
  hasDarkCanvas,
}: {
  chart: SectionChartBlock;
  sectionAccent?: string;
  hasDarkCanvas?: boolean;
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
  const axisTickColor = hasDarkCanvas ? '#CBD5E1' : '#64748B';
  const gridStroke = hasDarkCanvas ? 'rgba(255,255,255,0.1)' : 'rgba(148,163,184,0.22)';

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#171322]/95 p-5 sm:p-6 text-slate-900 dark:text-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
        <div>
          <h3 className="text-base sm:text-lg font-display font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="w-4 h-4 shrink-0" style={{ color: primaryColor }} />
            <span>{dataset.title}</span>
          </h3>
          {dataset.subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{dataset.subtitle}</p>
          )}
        </div>
        <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
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

function SectionEmbeddedMedia({ media }: { media: SectionMediaBlock }) {
  const [imgFailed, setImgFailed] = useState(false);
  const parsedVideo = media.kind === 'video' ? parseHeroVideoSource(media.url) : null;

  if (!media.url) return null;

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-950 text-white">
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
        <div className="px-5 py-3.5 bg-white dark:bg-[#171322] text-slate-900 dark:text-white border-t border-slate-200 dark:border-white/10">
          {media.title && <h4 className="text-sm font-bold">{media.title}</h4>}
          {media.caption && (
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{media.caption}</p>
          )}
        </div>
      )}
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

  const effectiveSectionClass = hasCustomSurface
    ? `${paddingClass} relative overflow-hidden border-t border-slate-200/30 dark:border-white/5`
    : `${defaultClassName} ${paddingClass} relative overflow-hidden`;

  return (
    <section
      id={id}
      data-home-section={config?.id || id}
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
            <SectionEmbeddedMedia media={config.mediaBlock} />
          )}
          {showChart && config?.chartBlock.position === 'top' && (
            <SectionEmbeddedChart
              chart={config.chartBlock}
              sectionAccent={config.accentColor}
              hasDarkCanvas={bgType === 'image' || bgType === 'video' || bgType === 'gradient'}
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
              <SectionEmbeddedMedia media={config.mediaBlock} />
            </div>
          </div>
        </div>
      ) : (
        <div className={innerContainerClassName}>{children}</div>
      )}

      {/* Bottom Media or Chart Slots */}
      {(showMedia && config?.mediaBlock.position === 'bottom') ||
      (showChart && config?.chartBlock.position === 'bottom') ? (
        <div className={`${innerContainerClassName} space-y-6 mt-8`}>
          {showChart && config?.chartBlock.position === 'bottom' && (
            <SectionEmbeddedChart
              chart={config.chartBlock}
              sectionAccent={config.accentColor}
              hasDarkCanvas={bgType === 'image' || bgType === 'video' || bgType === 'gradient'}
            />
          )}
          {showMedia && config?.mediaBlock.position === 'bottom' && (
            <SectionEmbeddedMedia media={config.mediaBlock} />
          )}
        </div>
      ) : null}
    </section>
  );
}
