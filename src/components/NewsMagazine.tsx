import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Newspaper, PlayCircle, MapPin, ArrowRight, Video, CheckCircle2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { db, collection, getDocs, query, orderBy, limit } from '../lib/db';
import { CURATED_INSIGHTS, getYouTubeEmbedUrl, getYouTubeThumbnail } from '../pages/Insights';

const parseInsightLocation = (content: string) => {
  if (!content) return { location: null, cleanContent: "" };
  const match = content.match(/__LOC__(.*?)__LOC__\s*/);
  if (match) {
    return {
      location: match[1],
      cleanContent: content.replace(match[0], ""),
    };
  }
  return { location: null, cleanContent: content };
};

export default function NewsMagazine() {
  const [news, setNews] = useState<any[]>(CURATED_INSIGHTS.slice(0, 3));
  const [activeVideoModal, setActiveVideoModal] = useState<any | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'insights'), orderBy('createdAt', 'desc'), limit(3));
    getDocs(q)
      .then((querySnapshot) => {
        if (!querySnapshot.empty) {
          const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          const merged = [...data, ...CURATED_INSIGHTS].slice(0, 3);
          setNews(merged);
        }
      })
      .catch(console.error);
  }, []);

  return (
    <section className="py-16 md:py-20 bg-white dark:bg-[#0A080C] border-t border-slate-200 dark:border-white/5 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" />
                Acceso Público Abierto
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase tracking-wider border border-red-500/20">
                <Video className="w-3 h-3" />
                YouTube & Multimedia
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 dark:text-white tracking-tight">
              Patagonia Insights: Información & Negocios
            </h2>
            <p className="mt-2.5 text-slate-600 dark:text-slate-400 text-base">
              Actualidad industrial, reportes en video y análisis estratégico abierto a toda la comunidad productiva de las 5 provincias.
            </p>
          </div>

          <Link
            to="/insights"
            className="inline-flex items-center gap-2 px-5 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shrink-0 self-start md:self-end"
          >
            <span>Explorar Portal Insights</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Asymmetric Editorial Grid: 1 Featured Video/Article + 2 Standard */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {news.map((item, index) => {
            const parsed = parseInsightLocation(item.content || '');
            const cover = item.image || getYouTubeThumbnail(item.videoUrl);
            const isPrimary = index === 0;

            return (
              <motion.article
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                key={item.id}
                className={`group bg-slate-50 dark:bg-[#1A1625] rounded-2xl border border-slate-200 dark:border-white/10 hover:border-orange-500/40 transition-all overflow-hidden flex flex-col ${
                  isPrimary ? 'lg:col-span-7' : 'lg:col-span-5'
                }`}
              >
                {cover && (
                  <div
                    onClick={() => {
                      if (item.videoUrl) {
                        setActiveVideoModal(item);
                      }
                    }}
                    className={`relative bg-slate-900 overflow-hidden cursor-pointer ${
                      isPrimary ? 'h-60 sm:h-72' : 'h-44'
                    }`}
                  >
                    <img
                      src={cover}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider">
                        {item.category || 'Actualidad'}
                      </span>
                      {parsed.location && (
                        <span className="px-2.5 py-1 rounded-md bg-blue-600/90 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {parsed.location}
                        </span>
                      )}
                    </div>

                    {item.videoUrl && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/45 transition-colors">
                        <div className="w-14 h-14 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                          <PlayCircle className="w-7 h-7" />
                        </div>
                        <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                          <Video className="w-3 h-3" /> Reproducir YouTube
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3
                      className={`font-display font-bold text-slate-900 dark:text-white group-hover:text-orange-500 transition-colors mb-2.5 ${
                        isPrimary ? 'text-xl sm:text-2xl leading-snug' : 'text-lg leading-snug line-clamp-2'
                      }`}
                    >
                      {item.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-2 mb-4">
                      {parsed.cleanContent.replace(/[#*`_~]/g, '').substring(0, 160)}...
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-200/80 dark:border-white/10 mt-auto">
                    <span className="text-xs font-medium text-slate-500">
                      {item.author || 'Redacción xPatagonia'}
                    </span>
                    <div className="flex items-center gap-3">
                      {item.videoUrl && (
                        <button
                          onClick={() => setActiveVideoModal(item)}
                          className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
                        >
                          <PlayCircle className="w-3.5 h-3.5" /> Ver Video
                        </button>
                      )}
                      <Link
                        to="/insights"
                        className="text-xs font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1"
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
    </section>
  );
}
