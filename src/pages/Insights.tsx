import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Newspaper,
  TrendingUp,
  Calendar,
  Share2,
  PlayCircle,
  Search,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Video,
  Globe,
  ExternalLink,
  CheckCircle2,
  Layers,
  X,
  RefreshCw,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { db, getDocs, collection, query, orderBy, limit } from "../lib/db";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export const extractYouTubeId = (url?: string): string | null => {
  if (!url) return null;
  const regExp =
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

export const getYouTubeEmbedUrl = (url?: string): string | null => {
  const videoId = extractYouTubeId(url);
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
  }
  return url || null;
};

export const getYouTubeThumbnail = (url?: string): string | null => {
  const videoId = extractYouTubeId(url);
  if (videoId) {
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  }
  return null;
};

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

export const CURATED_INSIGHTS = [
  {
    id: "editorial-yt-1",
    title: "Infraestructura en Vaca Muerta: Nuevos Gasoductos y Capacidad de Transporte 2026",
    category: "Actualidad",
    author: "Redacción xPatagonia",
    createdAt: "2026-03-28T10:00:00.000Z",
    videoUrl: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
    videoDuration: "14:20",
    image: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&q=80&w=1200",
    sourceType: "native",
    content: `__LOC__Neuquén__LOC__ El desarrollo de infraestructura de evacuación en la Cuenca Neuquina marca un punto de inflexión para las empresas proveedoras de servicios especializados, metalmecánica y logística pesada.

### Oportunidades para PyMEs y Contratistas Regionales
Las operadoras han incrementado un **38% la demanda de servicios certificados** en mantenimiento industrial, válvulas de alta presión y trazabilidad ambiental.

- **Duplicación de capacidad de transporte** hacia el Atlántico y nodos de exportación.
- **Integración de proveedores locales** mediante licitaciones auditadas y consorcios B2B.
- **Requerimientos técnicos**: Certificaciones ISO 9001, API 6D y protocolos de seguridad e higiene.`,
  },
  {
    id: "editorial-yt-2",
    title: "Reporte Especial en Video: Logística Portuaria y Cadena de Frío en Chubut y Santa Cruz",
    category: "Empresarial",
    author: "Mesa Sectorial Logística",
    createdAt: "2026-03-25T14:30:00.000Z",
    videoUrl: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
    videoDuration: "09:45",
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=1200",
    sourceType: "native",
    content: `__LOC__Puerto Madryn, Chubut__LOC__ Análisis audiovisual sobre la modernización de terminales portuarias en Puerto Madryn, Comodoro Rivadavia y Puerto Deseado para abastecer tanto a la industria pesquera de exportación como a los proyectos de parques eólicos.

### Puntos Clave del Informe
1. **Automatización de depósitos fiscales** y monitoreo térmico en tiempo real (-25°C).
2. **Corredores multimodales** que integran transporte terrestre de cargas especiales en Ruta Nacional 3 y Ruta 40.
3. **Reducción de costos operativos** mediante consolidación de carga entre empresas miembros del Hub.`,
  },
  {
    id: "editorial-3",
    title: "Hidrógeno Verde y Parques Eólicos: Guía de Calificación de Proveedores en Río Negro y Tierra del Fuego",
    category: "Innovación",
    author: " Observatorio Energético Austral",
    createdAt: "2026-03-21T09:15:00.000Z",
    image: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&q=80&w=1200",
    sourceType: "native",
    content: `__LOC__Río Negro / TDF__LOC__ Con factores de capacidad eólica superiores al 58%, los nuevos desarrollos de generación renovable demandan ingeniería civil, montaje electromecánico y provisión de insumos industriales locales.

### ¿Cómo calificar como proveedor B2B?
Las compañías registradas en el ecosistema **xPatagonia** pueden sincronizar sus certificaciones y capacidad instalada directamente en el directorio corporativo para recibir solicitudes de cotización (RFQs) de desarrolladores internacionales.`,
  },
  {
    id: "editorial-4",
    title: "Transformación Digital B2B: Cómo la Integración CRM Acelera el Cierre de Contratos Industriales",
    category: "Negocios",
    author: "Equipo Producto xPatagonia",
    createdAt: "2026-03-18T11:00:00.000Z",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200",
    sourceType: "native",
    content: `__LOC__Patagonia Argentina__LOC__ En el mercado corporativo patagónico, la velocidad de respuesta ante un requerimiento técnico define la adjudicación de un contrato.

### Del Directorio al CRM en Un Clic
Los miembros suscriptos a los planes **Pro Industrial** y **Corporativo** acceden a los datos verificados de compras, CUIT, decisores y vinculan cada oportunidad directamente a su embudo CRM integrado con correo corporativo y mensajería en vivo.`,
  },
];

export default function Insights() {
  const [posts, setPosts] = useState<any[]>(CURATED_INSIGHTS);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");
  const [mediaFilter, setMediaFilter] = useState<"all" | "video" | "articles">("all");
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  // WordPress Headless Subdomain Layer State
  const [showWpModal, setShowWpModal] = useState(false);
  const [wpSubdomainUrl, setWpSubdomainUrl] = useState<string>(
    () => localStorage.getItem("xpatagonia_wp_url") || "https://insights.xpatagonia.online"
  );
  const [wpSyncEnabled, setWpSyncEnabled] = useState<boolean>(
    () => localStorage.getItem("xpatagonia_wp_enabled") === "true"
  );
  const [wpSyncStatus, setWpSyncStatus] = useState<"idle" | "syncing" | "connected" | "fallback">("idle");

  const itemsPerPage = 6;

  const categories = [
    "Todos",
    "Actualidad",
    "Empresarial",
    "Negocios",
    "Startups",
    "Innovación",
  ];

  const fetchPosts = async () => {
    setLoading(true);
    let combinedPosts: any[] = [];

    // 1. Fetch Native Firestore Posts (created from AdminDashboard)
    try {
      const q = query(
        collection(db, "insights"),
        orderBy("createdAt", "desc"),
        limit(50)
      );
      const querySnapshot = await getDocs(q);
      const firestoreData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        sourceType: "native",
        ...doc.data(),
      }));
      combinedPosts = [...firestoreData];
    } catch (err) {
      console.error("Error fetching Firestore insights:", err);
    }

    // 2. Optional Headless WordPress Subdomain Fetch (WP REST API v2)
    if (wpSyncEnabled && wpSubdomainUrl) {
      setWpSyncStatus("syncing");
      try {
        const cleanBase = wpSubdomainUrl.replace(/\/$/, "");
        const wpEndpoint = `${cleanBase}/wp-json/wp/v2/posts?_embed&per_page=10`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(wpEndpoint, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
          const wpJson = await res.json();
          if (Array.isArray(wpJson)) {
            const wpMapped = wpJson.map((wpPost: any) => {
              const featuredMedia =
                wpPost._embedded?.["wp:featuredmedia"]?.[0]?.source_url || null;
              const rawHtml = wpPost.content?.rendered || wpPost.excerpt?.rendered || "";
              const ytMatch = rawHtml.match(
                /https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)[a-zA-Z0-9_-]{11}/
              );
              const plainText = rawHtml.replace(/<[^>]+>/g, "").trim();
              return {
                id: `wp-${wpPost.id}`,
                title: (wpPost.title?.rendered || "Artículo WordPress").replace(/&#8211;/g, "-"),
                category: "Actualidad",
                author: wpPost._embedded?.author?.[0]?.name || "WordPress Subdominio",
                createdAt: wpPost.date || new Date().toISOString(),
                image: featuredMedia,
                videoUrl: ytMatch ? ytMatch[0] : undefined,
                content: plainText,
                externalLink: wpPost.link,
                sourceType: "wordpress",
              };
            });
            combinedPosts = [...wpMapped, ...combinedPosts];
            setWpSyncStatus("connected");
          }
        } else {
          setWpSyncStatus("fallback");
        }
      } catch {
        setWpSyncStatus("fallback");
      }
    }

    // 3. Ensure Curated Multimedia Insights are present so the portal is always rich
    const existingIds = new Set(combinedPosts.map((p) => p.id));
    for (const item of CURATED_INSIGHTS) {
      if (!existingIds.has(item.id)) {
        combinedPosts.push(item);
      }
    }

    setPosts(combinedPosts);
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, [wpSyncEnabled]);

  const handleSaveWpConfig = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("xpatagonia_wp_url", wpSubdomainUrl);
    localStorage.setItem("xpatagonia_wp_enabled", String(wpSyncEnabled));
    setShowWpModal(false);
    fetchPosts();
  };

  const filteredPosts = posts.filter((post) => {
    const matchesCategory =
      selectedCategory === "Todos" || post.category === selectedCategory;
    const matchesMedia =
      mediaFilter === "all" ||
      (mediaFilter === "video" && Boolean(post.videoUrl)) ||
      (mediaFilter === "articles" && !post.videoUrl);
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      (post.title && post.title.toLowerCase().includes(searchLower)) ||
      (post.content && post.content.toLowerCase().includes(searchLower));
    return matchesCategory && matchesMedia && matchesSearch;
  });

  const videoPosts = posts.filter((p) => Boolean(p.videoUrl));
  const totalPages = Math.ceil(filteredPosts.length / itemsPerPage);

  const currentPosts = filteredPosts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, mediaFilter, searchQuery]);

  const handleShare = (post: any) => {
    const shareUrl = post.externalLink || window.location.href;
    if (navigator.share) {
      navigator
        .share({
          title: post.title,
          text: `Lee este informe en xPatagonia Insights: ${post.title}`,
          url: shareUrl,
        })
        .catch(console.error);
    } else {
      navigator.clipboard.writeText(shareUrl);
      setShareFeedback(post.id);
      setTimeout(() => setShareFeedback(null), 2500);
    }
  };

  return (
    <div className="pt-20 pb-20 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto min-h-screen">
      {/* Top Editorial Header */}
      <div className="mb-10 border-b border-slate-200 dark:border-white/10 pb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold uppercase tracking-wider border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Acceso Público Abierto
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 text-[11px] font-bold uppercase tracking-wider border border-red-500/20">
              <Video className="w-3.5 h-3.5" />
              Soporte YouTube & Multimedia
            </span>
            <button
              onClick={() => setShowWpModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 text-[11px] font-bold uppercase tracking-wider border border-slate-200 dark:border-white/10 transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-blue-500" />
              {wpSyncEnabled ? "Capa WordPress: Activa" : "Conector Subdominio WP"}
            </button>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-slate-900 dark:text-white tracking-tight mb-3">
            Patagonia{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-purple-600">
              Insights & Media
            </span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl text-base sm:text-lg">
            Centro de inteligencia e información abierta del ecosistema productivo, energético e industrial en las 5 provincias patagónicas.
          </p>
        </div>

        {/* Media Type Switcher (All / Videos YouTube / Artículos) */}
        <div className="flex items-center bg-slate-100 dark:bg-[#1A1625] p-1.5 rounded-xl border border-slate-200 dark:border-white/10 self-start lg:self-end shrink-0">
          <button
            onClick={() => setMediaFilter("all")}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              mediaFilter === "all"
                ? "bg-white dark:bg-[#110E17] text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Todo ({posts.length})
          </button>
          <button
            onClick={() => setMediaFilter("video")}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              mediaFilter === "video"
                ? "bg-red-600 text-white shadow-sm"
                : "text-slate-500 hover:text-red-500"
            }`}
          >
            <PlayCircle className="w-3.5 h-3.5" />
            YouTube / TV ({videoPosts.length})
          </button>
          <button
            onClick={() => setMediaFilter("articles")}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              mediaFilter === "articles"
                ? "bg-white dark:bg-[#110E17] text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Informes
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Editorial Column */}
        <div className="flex-1">
          {/* Categories & Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex overflow-x-auto pb-2 md:pb-0 scrollbar-hide gap-2 flex-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                    selectedCategory === cat
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                      : "bg-slate-100 dark:bg-[#1A1625] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5 border border-transparent dark:border-white/5"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="relative w-full md:w-64 shrink-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar informes, videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-[#1A1625] border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-slate-900 dark:text-white transition-all"
              />
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="h-80 rounded-2xl bg-slate-100 dark:bg-[#1A1625] animate-pulse border border-slate-200 dark:border-white/5"
                />
              ))}
            </div>
          ) : currentPosts.length === 0 ? (
            <div className="bg-white dark:bg-[#1A1625] rounded-2xl p-12 text-center border border-slate-200 dark:border-white/10">
              <Newspaper className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                No se encontraron publicaciones
              </h3>
              <p className="text-slate-500 text-sm mb-4">
                Prueba seleccionando otra categoría o limpiando el filtro de búsqueda.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory("Todos");
                  setMediaFilter("all");
                  setSearchQuery("");
                }}
                className="px-4 py-2 bg-orange-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider"
              >
                Ver todo el contenido
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {currentPosts.map((post, index) => {
                  const parsed = parseInsightLocation(post.content);
                  const ytThumb = getYouTubeThumbnail(post.videoUrl);
                  const coverImage = post.image || ytThumb;
                  const isFeatured =
                    index === 0 && selectedCategory === "Todos" && currentPage === 1;

                  return (
                    <motion.article
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.06 }}
                      key={post.id}
                      className={`group bg-white dark:bg-[#1A1625] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm hover:border-orange-500/40 transition-all duration-300 flex flex-col cursor-pointer ${
                        isFeatured ? "md:col-span-2 md:flex-row" : ""
                      }`}
                      onClick={() => setSelectedPost(post)}
                    >
                      {(coverImage || post.videoUrl) && (
                        <div
                          className={`relative bg-slate-900 overflow-hidden shrink-0 ${
                            isFeatured
                              ? "md:w-1/2 h-64 md:h-auto min-h-[260px]"
                              : "h-52"
                          }`}
                        >
                          {coverImage ? (
                            <img
                              src={coverImage}
                              alt={post.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-900">
                              <PlayCircle className="w-12 h-12 text-red-500" />
                            </div>
                          )}

                          {/* Top Badges on Media */}
                          <div className="absolute top-3 left-3 flex items-center gap-2">
                            {post.videoUrl && (
                              <span className="px-2.5 py-1 rounded-md bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-md">
                                <PlayCircle className="w-3.5 h-3.5" />
                                Video YouTube
                              </span>
                            )}
                            {post.sourceType === "wordpress" && (
                              <span className="px-2.5 py-1 rounded-md bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-md">
                                <Globe className="w-3 h-3" />
                                WP Subdominio
                              </span>
                            )}
                          </div>

                          {post.videoUrl && (
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/45 transition-colors">
                              <div className="w-14 h-14 bg-red-600/95 text-white rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                                <PlayCircle className="w-7 h-7" />
                              </div>
                              {post.videoDuration && (
                                <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/80 text-white font-mono text-[11px] font-semibold">
                                  {post.videoDuration}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="p-6 md:p-7 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-500/10 px-2.5 py-1 rounded-md">
                              {post.category || "Actualidad"}
                            </span>
                            {parsed.location && (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/10 px-2.5 py-1 rounded-md flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {parsed.location}
                              </span>
                            )}
                            <span className="text-xs text-slate-500 flex items-center gap-1 ml-auto">
                              <Calendar className="w-3.5 h-3.5" />
                              {post.createdAt
                                ? format(new Date(post.createdAt), "d MMM yyyy", {
                                    locale: es,
                                  })
                                : "Reciente"}
                            </span>
                          </div>

                          <h2
                            className={`font-display font-bold text-slate-900 dark:text-white group-hover:text-orange-500 transition-colors mb-3 ${
                              isFeatured
                                ? "text-2xl md:text-3xl leading-tight line-clamp-3"
                                : "text-lg leading-snug line-clamp-2"
                            }`}
                          >
                            {post.title}
                          </h2>

                          <p
                            className={`text-slate-600 dark:text-slate-400 mb-6 ${
                              isFeatured
                                ? "line-clamp-3 text-base"
                                : "line-clamp-3 text-sm"
                            }`}
                          >
                            {parsed.cleanContent
                              .replace(/[#*`_~]/g, "")
                              .substring(0, 210)}
                            ...
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-slate-900 dark:bg-white/10 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                              {post.author ? post.author.substring(0, 2) : "XP"}
                            </div>
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              {post.author || "Redacción xPatagonia"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-orange-500 group-hover:translate-x-0.5 transition-transform">
                              {post.videoUrl ? "Ver Video" : "Leer Informe"} &rarr;
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShare(post);
                              }}
                              title="Compartir enlace"
                              className="p-2 text-slate-400 hover:text-orange-500 bg-slate-50 hover:bg-orange-50 dark:bg-white/5 dark:hover:bg-orange-500/10 rounded-lg transition-colors"
                            >
                              {shareFeedback === post.id ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <Share2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                            currentPage === page
                              ? "bg-orange-500 text-white shadow-sm"
                              : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"
                          }`}
                        >
                          {page}
                        </button>
                      )
                    )}
                  </div>

                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Sidebar: Patagonia TV + Hybrid Architecture + Most Read */}
        <div className="w-full lg:w-80 shrink-0 space-y-6">
          {/* Featured YouTube / Multimedia Widget */}
          <div className="bg-slate-900 rounded-2xl p-6 border border-white/10 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-400">
                <Video className="w-4 h-4" />
                xPatagonia TV (YouTube)
              </span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/10 text-slate-300">
                HD Embed
              </span>
            </div>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Cobertura audiovisual de parques industriales, puertos, energía e entrevistas con cámaras empresarias.
            </p>
            {videoPosts.length > 0 && (
              <div
                onClick={() => setSelectedPost(videoPosts[0])}
                className="group cursor-pointer rounded-xl overflow-hidden border border-white/10 bg-black relative"
              >
                <img
                  src={
                    videoPosts[0].image ||
                    getYouTubeThumbnail(videoPosts[0].videoUrl) ||
                    ""
                  }
                  alt={videoPosts[0].title}
                  className="w-full h-36 object-cover opacity-80 group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="w-11 h-11 rounded-full bg-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <PlayCircle className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="p-3 bg-slate-950">
                  <p className="text-xs font-bold text-white line-clamp-2 group-hover:text-orange-400 transition-colors">
                    {videoPosts[0].title}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Most Read Ranking */}
          <div className="bg-white dark:bg-[#1A1625] rounded-2xl p-6 border border-slate-200 dark:border-white/10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-500" /> Informes Destacados
            </h3>
            <div className="space-y-4">
              {posts.slice(0, 4).map((post, i) => (
                <div
                  key={post.id}
                  onClick={() => setSelectedPost(post)}
                  className="group cursor-pointer flex gap-3 items-start pt-3 first:pt-0 border-t first:border-t-0 border-slate-100 dark:border-white/5"
                >
                  <span className="text-lg font-mono font-bold text-slate-300 dark:text-white/20 group-hover:text-orange-500 transition-colors">
                    0{i + 1}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-orange-500 transition-colors line-clamp-2 mb-1">
                      {post.title}
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-slate-500">
                        {post.category}
                      </span>
                      {post.videoUrl && (
                        <span className="text-[10px] text-red-500 font-bold flex items-center gap-0.5">
                          <PlayCircle className="w-2.5 h-2.5" /> Video
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hybrid WordPress Subdomain Info Box */}
          <div className="bg-slate-50 dark:bg-[#1A1625]/60 rounded-2xl p-5 border border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-4 h-4 text-blue-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Arquitectura Editorial Dual
              </h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
              Publica artículos y videos de YouTube desde el{" "}
              <strong className="text-slate-900 dark:text-white">Panel Super Admin</strong> o vincula un subdominio{" "}
              <strong className="text-slate-900 dark:text-white">WordPress Headless</strong> en otra capa.
            </p>
            <button
              onClick={() => setShowWpModal(true)}
              className="w-full py-2 px-3 rounded-xl bg-white dark:bg-[#110E17] border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-orange-500 transition-colors flex items-center justify-center gap-1.5"
            >
              <Globe className="w-3.5 h-3.5 text-orange-500" />
              Configurar Capa WordPress
            </button>
          </div>
        </div>
      </div>

      {/* Article & YouTube Video Reader Modal */}
      <AnimatePresence>
        {selectedPost && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setSelectedPost(null)}
            />

            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-[#110E17] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col"
            >
              {/* Top Modal Header */}
              <div className="px-6 py-4 bg-slate-50 dark:bg-[#1A1625] border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-500/10 px-2.5 py-1 rounded-md">
                    {selectedPost.category || "Actualidad"}
                  </span>
                  {selectedPost.videoUrl && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/10 px-2.5 py-1 rounded-md flex items-center gap-1">
                      <PlayCircle className="w-3 h-3" /> YouTube Embed
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setSelectedPost(null)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {selectedPost.videoUrl ? (
                  <div className="w-full aspect-video bg-black border-b border-slate-200 dark:border-white/10">
                    <iframe
                      src={getYouTubeEmbedUrl(selectedPost.videoUrl) || ""}
                      title={selectedPost.title}
                      className="w-full h-full"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  </div>
                ) : selectedPost.image ? (
                  <div className="w-full h-64 md:h-80 relative bg-slate-900">
                    <img
                      src={selectedPost.image}
                      alt={selectedPost.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : null}

                <div className="p-6 md:p-10">
                  <div className="flex flex-wrap items-center gap-3 mb-4 text-xs text-slate-500">
                    {parseInsightLocation(selectedPost.content).location && (
                      <span className="font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {parseInsightLocation(selectedPost.content).location}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {selectedPost.createdAt
                        ? format(
                            new Date(selectedPost.createdAt),
                            "d 'de' MMMM, yyyy",
                            { locale: es }
                          )
                        : "Reciente"}
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Por {selectedPost.author || "Redacción xPatagonia"}
                    </span>
                  </div>

                  <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-900 dark:text-white mb-6 leading-tight">
                    {selectedPost.title}
                  </h1>

                  <div className="prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed">
                    <ReactMarkdown>
                      {parseInsightLocation(selectedPost.content).cleanContent}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 dark:bg-[#1A1625] border-t border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleShare(selectedPost)}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#110E17] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white rounded-xl text-xs font-bold hover:border-orange-500 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    {shareFeedback === selectedPost.id
                      ? "Enlace copiado"
                      : "Compartir Informe"}
                  </button>
                  {selectedPost.externalLink && (
                    <a
                      href={selectedPost.externalLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-4 py-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold hover:bg-blue-500/20 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Abrir en Subdominio
                    </a>
                  )}
                </div>

                <button
                  onClick={() => setSelectedPost(null)}
                  className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* WordPress Headless Subdomain Configuration Modal */}
      <AnimatePresence>
        {showWpModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setShowWpModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#1A1625] rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl p-6 md:p-8"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      Arquitectura Insights & Subdominio WP
                    </h3>
                    <p className="text-xs text-slate-500">
                      Motor Híbrido: CMS Nativo (YouTube/Markdown) + WordPress REST API
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowWpModal(false)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveWpConfig} className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/5 text-xs text-slate-600 dark:text-slate-300 space-y-2">
                  <p className="font-bold text-slate-900 dark:text-white">
                    ¿Cómo funciona esta capa dual?
                  </p>
                  <p>
                    1. <strong>Modo Nativo (Activo por defecto):</strong> Publica artículos, reportes y videos de YouTube directamente desde el panel <code>/admin</code> de xPatagonia.
                  </p>
                  <p>
                    2. <strong>Modo Subdominio WordPress (Opcional):</strong> Si instalas WordPress en un subdominio (ej. <code>insights.xpatagonia.online</code>), esta capa consume automáticamente <code>/wp-json/wp/v2/posts?_embed</code> y fusiona las notas con el diseño de xPatagonia.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    URL del Subdominio WordPress
                  </label>
                  <input
                    type="url"
                    value={wpSubdomainUrl}
                    onChange={(e) => setWpSubdomainUrl(e.target.value)}
                    placeholder="https://insights.xpatagonia.online"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-white/10 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white block">
                      Sincronizar feed de WordPress (REST API v2)
                    </span>
                    <span className="text-xs text-slate-500">
                      Combina artículos del subdominio con los videos y notas nativas
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={wpSyncEnabled}
                    onChange={(e) => setWpSyncEnabled(e.target.checked)}
                    className="w-4 h-4 accent-orange-500 rounded"
                  />
                </label>

                {wpSyncStatus === "fallback" && wpSyncEnabled && (
                  <p className="text-xs text-amber-500 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                    El subdominio aún no responde en <code>/wp-json/wp/v2/posts</code>. Mostrando el catálogo editorial nativo de xPatagonia sin interrupciones.
                  </p>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowWpModal(false)}
                    className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Guardar Configuración
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
