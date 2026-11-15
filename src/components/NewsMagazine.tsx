import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PlayCircle, MapPin, ArrowRight, Video, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { db, collection, getDocs, query, orderBy, limit } from '../lib/db';
import { getApiUrl } from '../lib/apiConfig';
import { CURATED_INSIGHTS, getYouTubeEmbedUrl, getYouTubeThumbnail } from '../pages/Insights';
import ConfigurableSection, {
  getSectionCardClass,
  getSectionGridClass,
  getSectionHeadingSizeClass,
} from './ConfigurableSection';
import { HomeSectionDesignConfig } from '../lib/siteSettings';

const parseInsightLocation = (content: string) => {
  if (!content) return { location: null, cleanContent: '' };
  const match = content.match(/__LOC__(.*?)__LOC__\s*/);
  if (match) {
    return {
      location: match[1],
      cleanContent: content.replace(match[0], ''),
    };
  }
  return { location: null, cleanContent: content };
};

export default function NewsMagazine({ config }: { config?: HomeSectionDesignConfig }) {
  const [news, setNews] = useState<any[]>(CURATED_INSIGHTS.slice(0, 3));
  const [activeVideoModal, setActiveVideoModal] = useState<any | null>(null);

  useEffect(() => {
    const loadNews = async () => {
      try {
        const res = await fetch(`${getApiUrl()}/api/insights`, { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.insights) && json.insights.length > 0) {
            setNews([...json.insights, ...CURATED_INSIGHTS].slice(0, 3));
            return;
          }
        }
      } catch {
        // Fallback to Supabase client
      }

      try {
        const q = query(collection(db, 'insights'), orderBy('createdAt', 'desc'), limit(3));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setNews([...data, ...CURATED_INSIGHTS].slice(0, 3));
        }
      } catch (err: any) {
        console.warn('[NewsMagazine] Usando insights curados:', err?.message || err);
      }
    };
    loadNews();
  }, []);

  const accentColor = config?.accentColor || '#f97316';
  const hasDarkMedia =
    config?.backgroundType === 'image' ||
    config?.backgroundType === 'video' ||
    config?.backgroundType === 'gradient';

  const isDefaultColumns = !config?.columnStyle || config.columnStyle === 'auto';
  const gridClass = isDefaultColumns
    ? 'grid grid-cols-1 lg:grid-cols-12 gap-6'
    : getSectionGridClass(config?.columnStyle, 'grid grid-cols-1 lg:grid-cols-12 gap-6');
  const cardSurfaceClass = getSectionCardClass(config?.cardStyle, hasDarkMedia);
  const headingSizeClass = getSectionHeadingSizeClass(config?.headingScale);

  return (
    <ConfigurableSection
      id="insights"
      config={config}
      defaultClassName="bg-white dark:bg-[#0A080C] border-t border-slate-200 dark:border-white/5"
    >
      {/* Section Header — clean unboxed typographic metadata */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold mb-2.5 flex flex-wrap items-center gap-2 opacity-80">
            <span style={{ color: accentColor }}>
              {config?.eyebrowOverride || 'Patagonia Insights'}
            </span>
            <span aria-hidden="true">·</span>
            <span>Acceso Público Abierto</span>
            <span aria-hidden="true">·</span>
            <span>Reportes &amp; Video B2B</span>
          </p>
          <h2 className={`${headingSizeClass} font-display font-bold tracking-tight text-balance`}>
            {config?.titleOverride || 'Patagonia Insights: Información & Negocios'}
          </h2>
          <p className="mt-2.5 opacity-80 text-base leading-relaxed">
            {config?.subtitleOverride ||
              'Actualidad industrial, reportes en video y análisis estratégico abierto a toda la comunidad productiva de las 5 provincias.'}
          </p>
        </div>

        <Link
          to="/insights"
          className="inline-flex items-center gap-2 px-5 py-3 text-white font-bold text-xs tracking-wide rounded-xl hover:opacity-90 transition-opacity shrink-0 self-start md:self-end whitespace-nowrap"
          style={{ backgroundColor: accentColor }}
        >
          <span>Explorar Portal Insights</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Configurable Grid */}
      <div className={gridClass}>
        {news.map((item, index) => {
          const parsed = parseInsightLocation(item.content || '');
          const cover = item.image || getYouTubeThumbnail(item.videoUrl);
          const isPrimary = index === 0;
          const bentoSpan =
            config?.columnStyle === 'bento'
              ? isPrimary
                ? 'md:col-span-6'
                : 'md:col-span-3'
              : isDefaultColumns
              ? isPrimary
                ? 'lg:col-span-7'
                : 'lg:col-span-5'
              : '';

          return (
            <motion.article
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              key={item.id}
              className={`group rounded-2xl overflow-hidden flex flex-col transition-colors ${cardSurfaceClass} ${bentoSpan}`}
            >
              {cover && (
                <div
                  onClick={() => {
                    if (item.videoUrl) {
                      setActiveVideoModal(item);
                    }
                  }}
                  className={`relative bg-slate-900 overflow-hidden cursor-pointer ${
                    isPrimary && (isDefaultColumns || config?.columnStyle === 'bento')
                      ? 'h-60 sm:h-72'
                      : 'h-48'
                  }`}
                >
                  <img
                    src={cover}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {item.videoUrl && (
                    <div className="absolute inset-0 bg-black/35 flex items-center justify-center group-hover:bg-black/45 transition-colors">
                      <div className="w-14 h-14 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                        <PlayCircle className="w-7 h-7" />
                      </div>
                      <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded bg-red-600 text-white text-[11px] font-bold flex items-center gap-1">
                        <Video className="w-3 h-3" /> Ver Video
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs opacity-75 mb-2">
                    <span className="font-semibold" style={{ color: accentColor }}>
                      {item.category || 'Actualidad'}
                    </span>
                    {parsed.location && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {parsed.location}
                        </span>
                      </>
                    )}
                  </div>

                  <h3
                    className={`font-display font-bold group-hover:opacity-85 transition-opacity mb-2.5 ${
                      isPrimary ? 'text-xl sm:text-2xl leading-snug' : 'text-lg leading-snug line-clamp-2'
                    }`}
                  >
                    {item.title}
                  </h3>
                  <p className="opacity-80 text-sm line-clamp-2 mb-4 leading-relaxed">
                    {parsed.cleanContent.replace(/[#*`_~]/g, '').substring(0, 160)}...
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-200/60 dark:border-white/10 mt-auto text-xs">
                  <span className="font-medium opacity-70">
                    {item.author || 'Redacción xPatagonia'}
                  </span>
                  <div className="flex items-center gap-3">
                    {item.videoUrl && (
                      <button
                        type="button"
                        onClick={() => setActiveVideoModal(item)}
                        className="font-bold text-red-500 hover:underline flex items-center gap-1"
                      >
                        <PlayCircle className="w-3.5 h-3.5" /> Video
                      </button>
                    )}
                    <Link
                      to="/insights"
                      className="font-bold hover:underline flex items-center gap-1 whitespace-nowrap"
                      style={{ color: accentColor }}
                    >
                      <span>Leer más</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>

      {/* Quick YouTube Video Player Modal from Home */}
      <AnimatePresence>
        {activeVideoModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setActiveVideoModal(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-3xl bg-slate-950 rounded-2xl overflow-hidden border border-white/10 shadow-2xl z-10"
            >
              <div className="px-5 py-3.5 bg-slate-900 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-2 text-white text-xs font-bold truncate pr-4">
                  <PlayCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span className="truncate">{activeVideoModal.title}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveVideoModal(null)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="aspect-video w-full bg-black">
                <iframe
                  src={getYouTubeEmbedUrl(activeVideoModal.videoUrl) || ''}
                  title={activeVideoModal.title}
                  className="w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ConfigurableSection>
  );
}
