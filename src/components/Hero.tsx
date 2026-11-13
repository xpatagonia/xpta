import { motion, AnimatePresence } from 'motion/react';
import { Search, Sparkles, Bot, LineChart, Network, ArrowRight } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  SiteSettings,
  fetchSiteSettings,
  getCachedSiteSettings,
  SITE_SETTINGS_EVENT,
} from '../lib/siteSettings';

function getYouTubeId(url: string): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

function ModernTextReveal({
  text,
  hasMediaBackground,
  onComplete,
}: {
  text: string;
  hasMediaBackground: boolean;
  onComplete?: () => void;
}) {
  const words = text.split(' ');

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (onComplete) onComplete();
    }, words.length * 150 + 600);
    return () => clearTimeout(timeout);
  }, [words.length, onComplete]);

  return (
    <motion.span
      className="inline-flex flex-wrap justify-center gap-x-[0.25em]"
      initial="hidden"
      animate="visible"
      variants={{
        visible: { transition: { staggerChildren: 0.12 } },
      }}
    >
      {words.map((word, i) => {
        const isHighlight = ['Inteligentes', 'Patagonia', 'Industria', 'Datos', 'Validados'].includes(
          word.replace(/[.,]/g, '')
        );

        return (
          <motion.span
            key={i}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className={
              isHighlight
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500'
                : hasMediaBackground
                ? 'text-white drop-shadow-sm'
                : 'text-slate-900 dark:text-white'
            }
          >
            {word}
          </motion.span>
        );
      })}
    </motion.span>
  );
}

const SLIDE_ICONS = [Bot, LineChart, Network];

export default function Hero() {
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => getCachedSiteSettings());
  const [activeFrame, setActiveFrame] = useState(0);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Todas');
  const [suggestions, setSuggestions] = useState<string[]>([
    'Logística Frío',
    'Auditoría Ambiental',
    'Maquinaria Agrícola',
  ]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const navigate = useNavigate();

  const heroConfig = siteSettings.hero;
  const framesConfig = heroConfig.slides;
  const safeFrameIndex = activeFrame < framesConfig.length ? activeFrame : 0;
  const currentFrame = framesConfig[safeFrameIndex] || framesConfig[0];

  const hasImageBg = heroConfig.backgroundType === 'image' && Boolean(heroConfig.imageUrl);
  const hasVideoBg = heroConfig.backgroundType === 'video' && Boolean(heroConfig.videoUrl);
  const hasMediaBackground = hasImageBg || hasVideoBg;
  const youtubeBgId = hasVideoBg ? getYouTubeId(heroConfig.videoUrl) : null;

  useEffect(() => {
    fetchSiteSettings().then((loaded) => setSiteSettings(loaded));

    const onUpdated = (e: Event) => {
      const custom = e as CustomEvent<SiteSettings>;
      if (custom.detail) {
        setSiteSettings(custom.detail);
      } else {
        setSiteSettings(getCachedSiteSettings());
      }
    };

    window.addEventListener(SITE_SETTINGS_EVENT, onUpdated);
    return () => window.removeEventListener(SITE_SETTINGS_EVENT, onUpdated);
  }, []);

  useEffect(() => {
    async function fetchAiSuggestions() {
      const cached = sessionStorage.getItem('hero_ai_suggestions');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.length > 0) {
            setSuggestions(parsed);
            return;
          }
        } catch {
          // Ignore cache error
        }
      }

      setSuggestionsLoading(true);
      try {
        const res = await fetch('/api/hero-suggestions', { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          if (data.suggestions && data.suggestions.length > 0) {
            setSuggestions(data.suggestions);
            sessionStorage.setItem('hero_ai_suggestions', JSON.stringify(data.suggestions));
          }
        }
      } catch (err) {
        console.warn('Hero suggestions fallback:', err);
      }
      setSuggestionsLoading(false);
    }

    fetchAiSuggestions();
  }, []);

  useEffect(() => {
    const intervalMs = Math.max(4, heroConfig.rotationSeconds || 12) * 1000;
    const timer = setInterval(() => {
      setActiveFrame((prev) => (prev + 1) % Math.max(1, framesConfig.length));
    }, intervalMs);

    return () => clearInterval(timer);
  }, [heroConfig.rotationSeconds, framesConfig.length]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/servicios');
  };

  const overlayColor =
    heroConfig.overlayTint === 'purple'
      ? 'rgba(28, 12, 48, VAL)'
      : heroConfig.overlayTint === 'slate'
      ? 'rgba(15, 23, 42, VAL)'
      : 'rgba(6, 5, 10, VAL)';

  const overlayRgba = overlayColor.replace(
    'VAL',
    String(Math.min(0.92, Math.max(0.15, (heroConfig.overlayOpacity ?? 60) / 100)))
  );

  const Icon = SLIDE_ICONS[safeFrameIndex % SLIDE_ICONS.length] || Bot;

  return (
    <section className="relative isolate pt-20 pb-20 lg:pt-28 lg:pb-24 overflow-hidden px-4 sm:px-6 md:px-12 bg-white dark:bg-[#110E17] min-h-[560px] flex items-center justify-center">
      {/* Dynamic Background Layer controlled by Dashboard CMS */}
      {hasMediaBackground ? (
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          {hasVideoBg && youtubeBgId ? (
            <iframe
              src={`https://www.youtube.com/embed/${youtubeBgId}?autoplay=1&mute=1&loop=1&playlist=${youtubeBgId}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1`}
              title="Patagonia Hero Background Video"
              className="absolute top-1/2 left-1/2 w-[177.78vh] min-w-full h-[56.25vw] min-h-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{
                filter: heroConfig.blurPx ? `blur(${heroConfig.blurPx}px)` : undefined,
              }}
              allow="autoplay; encrypted-media"
            />
          ) : hasVideoBg ? (
            <video
              key={heroConfig.videoUrl}
              autoPlay
              muted
              loop
              playsInline
              poster={heroConfig.posterUrl || heroConfig.imageUrl || undefined}
              className="w-full h-full object-cover scale-[1.02]"
              style={{
                filter: heroConfig.blurPx ? `blur(${heroConfig.blurPx}px)` : undefined,
              }}
            >
              <source src={heroConfig.videoUrl} />
            </video>
          ) : (
            <img
              src={heroConfig.imageUrl}
              alt="Fondo institucional xPatagonia"
              className="w-full h-full object-cover scale-[1.02]"
              style={{
                filter: heroConfig.blurPx ? `blur(${heroConfig.blurPx}px)` : undefined,
              }}
            />
          )}
          <div
            className="absolute inset-0 transition-colors duration-300"
            style={{
              background: `linear-gradient(180deg, ${overlayRgba} 0%, ${overlayRgba} 100%)`,
            }}
          />
        </div>
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-200/50 via-white to-white dark:from-purple-900/20 dark:via-[#110E17] dark:to-[#110E17] -z-10 pointer-events-none" />
      )}

      <div className="max-w-5xl mx-auto relative text-center w-full">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            key={`tag-${currentFrame.id}`}
            animate={{ y: [0, -4, 0], opacity: [0.85, 1] }}
            initial={{ opacity: 0 }}
            transition={{ y: { repeat: Infinity, duration: 3, ease: 'easeInOut' }, opacity: { duration: 0.4 } }}
            className={`inline-flex items-center px-4 py-2 rounded-full border text-[10px] font-bold uppercase tracking-widest mb-6 shadow-sm backdrop-blur-md ${
              hasMediaBackground
                ? 'border-white/20 bg-black/35 text-white'
                : 'border-slate-200 dark:border-white/10 bg-white/5 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Icon className="w-4 h-4 mr-2 text-purple-400" />
            {currentFrame.tag}
          </motion.div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-[1.2] mb-6 tracking-tight min-h-[130px] md:min-h-[150px] flex items-center justify-center">
            <div>
              <ModernTextReveal
                key={`title-${currentFrame.id}-${currentFrame.title}`}
                text={currentFrame.title}
                hasMediaBackground={hasMediaBackground}
              />
            </div>
          </h1>

          {/* Stably sized container so the section height NEVER shifts or bounces */}
          <div className="min-h-[220px] md:min-h-[200px] flex flex-col justify-start">
            <AnimatePresence mode="wait">
              <motion.div
                key={`content-${currentFrame.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="w-full"
              >
                <p
                  className={`text-base sm:text-lg leading-relaxed max-w-2xl mx-auto mb-8 font-medium flex items-center justify-center ${
                    hasMediaBackground ? 'text-slate-100 drop-shadow-xs' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-orange-400 shrink-0" />
                  <span>{currentFrame.subtitle}</span>
                </p>

                {currentFrame.type === 'search' && (
                  <>
                    <form
                      onSubmit={handleSearch}
                      className={`max-w-3xl mx-auto p-2 rounded-2xl border shadow-2xl flex items-center focus-within:border-purple-500/50 focus-within:ring-4 focus-within:ring-purple-500/10 transition-all ${
                        hasMediaBackground
                          ? 'bg-white/95 dark:bg-[#1A1625]/95 backdrop-blur-md border-white/25'
                          : 'bg-slate-50 dark:bg-[#1A1625] border-slate-200 dark:border-white/10'
                      }`}
                    >
                      <div className="pl-6 pr-4 hidden sm:block border-r border-slate-200 dark:border-white/10">
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="bg-transparent text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 outline-none cursor-pointer max-w-[200px] truncate"
                        >
                          <option value="Todas" className="bg-slate-50 dark:bg-[#1A1625]">
                            Todas las categorías
                          </option>
                          <option className="bg-slate-50 dark:bg-[#1A1625]">Alimentación</option>
                          <option className="bg-slate-50 dark:bg-[#1A1625]">Sector Productivo</option>
                          <option className="bg-slate-50 dark:bg-[#1A1625]">Pesca y Acuicultura</option>
                          <option className="bg-slate-50 dark:bg-[#1A1625]">Sector Metalúrgico</option>
                          <option className="bg-slate-50 dark:bg-[#1A1625]">Puertos y Logística</option>
                          <option className="bg-slate-50 dark:bg-[#1A1625]">Hidrocarburos</option>
                          <option className="bg-slate-50 dark:bg-[#1A1625]">Energías Renovables</option>
                          <option className="bg-slate-50 dark:bg-[#1A1625]">Construcción Civil</option>
                          <option className="bg-slate-50 dark:bg-[#1A1625]">Tecnología</option>
                          <option className="bg-slate-50 dark:bg-[#1A1625]">Seguridad e Higiene</option>
                        </select>
                      </div>
                      <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Ej. Servicios de limpieza industrial..."
                        className="w-full px-6 py-4 bg-transparent outline-none text-base placeholder:text-slate-500 font-medium text-slate-900 dark:text-white"
                      />
                      <button
                        type="submit"
                        className="px-8 py-4 bg-gradient-to-r from-orange-500 to-purple-600 text-white text-[11px] uppercase tracking-widest font-bold rounded-xl hover:opacity-90 transition duration-300 flex items-center whitespace-nowrap shadow-lg shadow-purple-500/25"
                      >
                        <Search className="w-5 h-5 sm:mr-2" />
                        <span className="hidden sm:block">{currentFrame.ctaLabel || 'Buscar'}</span>
                      </button>
                    </form>

                    <div
                      className={`mt-10 flex flex-wrap justify-center items-center gap-4 text-xs font-semibold uppercase tracking-wider ${
                        hasMediaBackground ? 'text-slate-200' : 'text-slate-500'
                      }`}
                    >
                      <span className="flex items-center">
                        {suggestionsLoading ? (
                          <span className="animate-pulse">Generando sugerencias IA...</span>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3 mr-1 text-purple-400" />
                            Sugerencias IA:
                          </>
                        )}
                      </span>

                      {!suggestionsLoading &&
                        suggestions.map((sug, i) => (
                          <React.Fragment key={i}>
                            <button
                              onClick={() => setQuery(sug)}
                              className={`transition-colors ${
                                hasMediaBackground
                                  ? 'text-white hover:text-orange-300'
                                  : 'text-slate-700 dark:text-slate-300 hover:text-purple-500'
                              }`}
                            >
                              {sug}
                            </button>
                            {i < suggestions.length - 1 && (
                              <span className={hasMediaBackground ? 'text-white/40' : 'text-slate-700'}>
                                •
                              </span>
                            )}
                          </React.Fragment>
                        ))}
                    </div>
                  </>
                )}

                {currentFrame.type === 'insights' && (
                  <div className="flex justify-center mt-8">
                    <Link
                      to={currentFrame.ctaPath || '/insights'}
                      className="px-10 py-5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[13px] uppercase tracking-widest font-bold rounded-2xl hover:opacity-90 transition duration-300 flex items-center shadow-lg shadow-blue-500/25"
                    >
                      {currentFrame.ctaLabel || 'Explorar Insights y Noticias'}
                      <ArrowRight className="w-5 h-5 ml-3" />
                    </Link>
                  </div>
                )}

                {currentFrame.type === 'directory' && (
                  <div className="flex justify-center mt-8">
                    <Link
                      to={currentFrame.ctaPath || '/marketplace'}
                      className="px-10 py-5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[13px] uppercase tracking-widest font-bold rounded-2xl hover:opacity-90 transition duration-300 flex items-center shadow-lg shadow-teal-500/25"
                    >
                      {currentFrame.ctaLabel || 'Acceder al Directorio B2B'}
                      <ArrowRight className="w-5 h-5 ml-3" />
                    </Link>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-12 flex justify-center gap-3">
            {framesConfig.map((frame, idx) => (
              <button
                key={frame.id}
                onClick={() => setActiveFrame(idx)}
                className={`h-2 rounded-full transition-all duration-500 ${
                  safeFrameIndex === idx
                    ? 'bg-purple-500 w-16'
                    : hasMediaBackground
                    ? 'bg-white/40 w-6 hover:bg-purple-400'
                    : 'bg-slate-300 dark:bg-slate-700 w-6 hover:bg-purple-400'
                }`}
                aria-label={`Ir al slide ${idx + 1}`}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
