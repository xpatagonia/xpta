import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Image as ImageIcon,
  Video,
  Sparkles,
  Save,
  RotateCcw,
  Upload,
  Eye,
  Layout,
  DollarSign,
  CheckCircle2,
  Sliders,
  Palette,
  Menu as MenuIcon,
  Layers,
  ExternalLink,
} from 'lucide-react';
import { auth } from '../../lib/db';
import { getApiUrl } from '../../lib/apiConfig';
import {
  SiteSettings,
  DEFAULT_SITE_SETTINGS,
  HERO_MEDIA_PRESETS,
  HeroBackgroundType,
  HeroOverlayTint,
  fetchSiteSettings,
  getCachedSiteSettings,
  persistSiteSettings,
  publishSessionSiteSettings,
  parseHeroVideoSource,
} from '../../lib/siteSettings';
import DesignCustomizerControls from './DesignCustomizerControls';

type StudioTab = 'sections' | 'menu' | 'theme' | 'hero' | 'footer';

export default function AdminSiteEditor() {
  const [settings, setSettings] = useState<SiteSettings>(() => getCachedSiteSettings());
  const [studioTab, setStudioTab] = useState<StudioTab>('sections');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'info' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchSiteSettings().then((loaded) => setSettings(loaded));
  }, []);

  const applySettingsUpdate = (updater: (prev: SiteSettings) => SiteSettings) => {
    setSettings((prev) => {
      const next = updater(prev);
      publishSessionSiteSettings(next);
      return next;
    });
  };

  const updateHero = (patch: Partial<SiteSettings['hero']>) => {
    applySettingsUpdate((prev) => ({
      ...prev,
      hero: { ...prev.hero, ...patch },
    }));
  };

  const updateSlide = (idx: number, field: string, value: string) => {
    applySettingsUpdate((prev) => {
      const nextSlides = [...prev.hero.slides];
      nextSlides[idx] = { ...nextSlides[idx], [field]: value };
      return {
        ...prev,
        hero: { ...prev.hero, slides: nextSlides },
      };
    });
  };

  const uploadMediaFile = async (file: File, onUrl: (url: string) => void) => {
    if (file.size > 3.2 * 1024 * 1024) {
      setStatusBanner({
        type: 'error',
        message:
          'El archivo supera 3.2 MB (límite de subida directa en Vercel). Sube videos pesados a Cloudflare R2 / Cloudflare Stream o Supabase Storage y pega la URL pública.',
      });
      return;
    }

    setIsUploading(true);
    setStatusBanner(null);

    try {
      const reader = new FileReader();
      const base64Data: string = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const token = await auth.currentUser?.getIdToken?.();
      if (!token) {
        throw new Error('Sesión expirada. Vuelve a iniciar sesión como administrador.');
      }

      const res = await fetch(`${getApiUrl()}/api/admin/upload-media`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          filename: file.name,
          mimeType: file.type,
          base64Data,
        }),
      });

      const uploaded = await res.json().catch(() => ({}));
      if (!res.ok || !uploaded.url) {
        throw new Error(uploaded.error || `Error del servidor (HTTP ${res.status})`);
      }

      onUrl(uploaded.url);
      setStatusBanner({
        type: 'success',
        message: `Archivo subido (${uploaded.storage}). Pulsa "Guardar y Publicar Sitio" para aplicarlo en todos los dispositivos.`,
      });
    } catch (err: any) {
      setStatusBanner({
        type: 'error',
        message: `No se pudo subir el archivo a producción: ${err?.message || 'error'}`,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadHeroMedia = async (
    e: React.ChangeEvent<HTMLInputElement>,
    targetKind: 'image' | 'video'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadMediaFile(file, (finalUrl) => {
      if (targetKind === 'video') {
        updateHero({ backgroundType: 'video', videoUrl: finalUrl });
      } else {
        updateHero({ backgroundType: 'image', imageUrl: finalUrl, posterUrl: finalUrl });
      }
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setStatusBanner(null);
    const token = await auth.currentUser?.getIdToken?.();
    const res = await persistSiteSettings(settings, token);
    setSettings(res.settings);
    setIsSaving(false);

    if (res.savedRemote) {
      setStatusBanner({
        type: 'success',
        message:
          'Diseño, menú y secciones publicados en base de datos de producción para todos los visitantes.',
      });
    } else {
      setStatusBanner({
        type: 'error',
        message: `No se pudo publicar en producción: ${res.error || 'Error de persistencia en servidor'}.`,
      });
    }
  };

  const handleReset = () => {
    const resetCopy: SiteSettings = {
      ...DEFAULT_SITE_SETTINGS,
      updatedAt: new Date().toISOString(),
    };
    setSettings(resetCopy);
    publishSessionSiteSettings(resetCopy);
    setStatusBanner({
      type: 'info',
      message:
        'Valores predeterminados restaurados en vista previa. Pulsa "Guardar y Publicar Sitio" para confirmarlos en producción.',
    });
  };

  const firstSlide = settings.hero.slides[0] || DEFAULT_SITE_SETTINGS.hero.slides[0];
  const parsedPreviewVideo =
    settings.hero.backgroundType === 'video' ? parseHeroVideoSource(settings.hero.videoUrl) : null;
  const overlayAlpha = Math.min(0.92, Math.max(0.15, settings.hero.overlayOpacity / 100));
  const tintRgb =
    settings.hero.overlayTint === 'purple'
      ? '28, 12, 48'
      : settings.hero.overlayTint === 'slate'
      ? '15, 23, 42'
      : '6, 5, 10';

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="bg-white dark:bg-[#1A1625] rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layout className="w-5 h-5 text-orange-500" />
            Estudio de Diseño Visual, Menú &amp; Home
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Personalizá colores, fondos, tipografía, columnas, gráficos Recharts y multimedia de cada sección del Home y el menú superior.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            to="/"
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-orange-500 flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Ver Home en Vivo
          </Link>
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restaurar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-2 disabled:opacity-60 transition-colors whitespace-nowrap"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Publicando...' : 'Guardar y Publicar Sitio'}
          </button>
        </div>
      </div>

      {statusBanner && (
        <div
          className={`p-4 rounded-xl border text-xs font-semibold flex items-center gap-2.5 ${
            statusBanner.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
              : statusBanner.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
              : 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusBanner.message}</span>
        </div>
      )}

      {/* Studio Area Segmented Navigation */}
      <div className="flex flex-wrap gap-1.5 p-1.5 rounded-2xl bg-white dark:bg-[#1A1625] border border-slate-200 dark:border-white/10">
        {(
          [
            { id: 'sections', label: 'Secciones del Home', icon: Layers },
            { id: 'menu', label: 'Menú Superior', icon: MenuIcon },
            { id: 'theme', label: 'Tema & Tipografía Global', icon: Palette },
            { id: 'hero', label: 'Fondo & Slides Hero', icon: Sliders },
            { id: 'footer', label: 'Precios & Footer', icon: DollarSign },
          ] as { id: StudioTab; label: string; icon: any }[]
        ).map((tab) => {
          const Icon = tab.icon;
          const active = studioTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStudioTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${
                active
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Customizer Tabs */}
      {(studioTab === 'sections' || studioTab === 'menu' || studioTab === 'theme') && (
        <DesignCustomizerControls
          area={studioTab}
          settings={settings}
          onChange={applySettingsUpdate}
          onUploadMedia={uploadMediaFile}
          isUploading={isUploading}
        />
      )}

      {/* Existing Hero Media & Slides CMS */}
      {studioTab === 'hero' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white dark:bg-[#1A1625] rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-purple-500" />
                  Media y Contraste de Fondo (Hero)
                </h3>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {(
                  [
                    { id: 'gradient', label: 'Gradiente Base', icon: Sparkles },
                    { id: 'image', label: 'Foto de Fondo', icon: ImageIcon },
                    { id: 'video', label: 'Video de Fondo', icon: Video },
                  ] as { id: HeroBackgroundType; label: string; icon: any }[]
                ).map((opt) => {
                  const OptIcon = opt.icon;
                  const active = settings.hero.backgroundType === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => updateHero({ backgroundType: opt.id })}
                      className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all ${
                        active
                          ? 'border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400'
                          : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-purple-400/40'
                      }`}
                    >
                      <OptIcon className="w-4 h-4" />
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>

              {settings.hero.backgroundType === 'image' && (
                <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10">
                  <label className="block text-xs font-semibold text-slate-500">
                    URL de Imagen de Fondo (JPG / WebP / PNG)
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="url"
                      value={settings.hero.imageUrl}
                      onChange={(e) => updateHero({ imageUrl: e.target.value })}
                      placeholder="https://.../patagonia-industria.jpg"
                      className="flex-1 px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1A1625] text-sm text-slate-900 dark:text-white outline-none focus:border-orange-500"
                    />
                    <label className="px-4 py-2.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 hover:opacity-90 shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      {isUploading ? 'Subiendo...' : 'Subir Foto'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleUploadHeroMedia(e, 'image')}
                      />
                    </label>
                  </div>
                </div>
              )}

              {settings.hero.backgroundType === 'video' && (
                <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                      URL de Video Loop (Cloudflare R2 MP4 / Cloudflare Stream / YouTube)
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="url"
                        value={settings.hero.videoUrl}
                        onChange={(e) => updateHero({ videoUrl: e.target.value })}
                        placeholder="https://...r2.dev/video.mp4, Cloudflare Stream o YouTube"
                        className="flex-1 px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1A1625] text-sm text-slate-900 dark:text-white outline-none focus:border-orange-500"
                      />
                      <label className="px-4 py-2.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 hover:opacity-90 shrink-0">
                        <Upload className="w-3.5 h-3.5" />
                        {isUploading ? 'Subiendo...' : 'Subir Video'}
                        <input
                          type="file"
                          accept="video/mp4,video/webm"
                          className="hidden"
                          onChange={(e) => handleUploadHeroMedia(e, 'video')}
                        />
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Imagen Poster de Respaldo
                    </label>
                    <input
                      type="url"
                      value={settings.hero.posterUrl}
                      onChange={(e) => updateHero({ posterUrl: e.target.value })}
                      placeholder="https://.../poster.jpg"
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1A1625] text-xs text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <span className="block text-xs font-semibold text-slate-400 mb-2">
                  Presets Industriales Listos para Probar:
                </span>
                <div className="flex flex-wrap gap-2">
                  {HERO_MEDIA_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() =>
                        updateHero({
                          backgroundType: preset.type,
                          imageUrl: preset.type === 'image' ? preset.url : settings.hero.imageUrl,
                          videoUrl: preset.type === 'video' ? preset.url : settings.hero.videoUrl,
                          posterUrl: preset.posterUrl || preset.url,
                        })
                      }
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:border-orange-500/50 text-[11px] font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-white/5">
                <div>
                  <label className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                    <span>Velo Oscuro</span>
                    <span className="font-mono text-orange-500">{settings.hero.overlayOpacity}%</span>
                  </label>
                  <input
                    type="range"
                    min={15}
                    max={90}
                    value={settings.hero.overlayOpacity}
                    onChange={(e) => updateHero({ overlayOpacity: Number(e.target.value) })}
                    className="w-full accent-orange-500"
                  />
                </div>

                <div>
                  <label className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                    <span>Desenfoque</span>
                    <span className="font-mono text-purple-500">{settings.hero.blurPx}px</span>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={12}
                    value={settings.hero.blurPx}
                    onChange={(e) => updateHero({ blurPx: Number(e.target.value) })}
                    className="w-full accent-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Tinte del Velo
                  </label>
                  <select
                    value={settings.hero.overlayTint}
                    onChange={(e) => updateHero({ overlayTint: e.target.value as HeroOverlayTint })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-xs font-bold text-slate-800 dark:text-white outline-none"
                  >
                    <option value="dark">Negro Industrial</option>
                    <option value="purple">Púrpura xPatagonia</option>
                    <option value="slate">Azul Pizarra</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-white dark:bg-[#1A1625] rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-sm flex flex-col">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-500" />
                Vista Previa en Vivo (Hero)
              </h3>

              <div className="relative flex-1 min-h-[260px] rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 flex flex-col items-center justify-center p-6 text-center bg-slate-950">
                {settings.hero.backgroundType === 'image' && settings.hero.imageUrl && (
                  <img
                    src={settings.hero.imageUrl}
                    alt="Preview fondo Hero"
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{
                      filter: settings.hero.blurPx ? `blur(${settings.hero.blurPx}px)` : undefined,
                    }}
                  />
                )}
                {parsedPreviewVideo &&
                  (parsedPreviewVideo.kind === 'youtube' ||
                    parsedPreviewVideo.kind === 'cloudflare_stream') && (
                    <iframe
                      key={parsedPreviewVideo.embedUrl}
                      src={parsedPreviewVideo.embedUrl}
                      title="Preview video Hero"
                      className="absolute inset-0 w-full h-full pointer-events-none border-0"
                      style={{
                        filter: settings.hero.blurPx ? `blur(${settings.hero.blurPx}px)` : undefined,
                      }}
                      allow="autoplay; encrypted-media; fullscreen"
                    />
                  )}
                {parsedPreviewVideo && parsedPreviewVideo.kind === 'direct' && (
                  <video
                    key={parsedPreviewVideo.src}
                    src={parsedPreviewVideo.src}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    poster={settings.hero.posterUrl || undefined}
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{
                      filter: settings.hero.blurPx ? `blur(${settings.hero.blurPx}px)` : undefined,
                    }}
                  />
                )}
                {settings.hero.backgroundType === 'gradient' && (
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-700/40 via-[#110E17] to-[#110E17]" />
                )}

                {settings.hero.backgroundType !== 'gradient' && (
                  <div
                    className="absolute inset-0"
                    style={{ backgroundColor: `rgba(${tintRgb}, ${overlayAlpha})` }}
                  />
                )}

                <div className="relative z-10 max-w-md space-y-3">
                  <span className="inline-block text-[11px] font-bold text-orange-400">
                    {firstSlide.tag}
                  </span>
                  <h4 className="text-lg font-display font-bold text-white leading-snug">
                    {firstSlide.title}
                  </h4>
                  <p className="text-xs text-slate-200 line-clamp-2">{firstSlide.subtitle}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1A1625] rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
              Mensajes y Slides del Hero
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {settings.hero.slides.map((slide, idx) => (
                <div
                  key={slide.id}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10 space-y-3"
                >
                  <div className="text-[11px] font-mono font-bold text-orange-500">
                    Slide #{idx + 1} · {slide.type}
                  </div>
                  <input
                    type="text"
                    value={slide.tag}
                    onChange={(e) => updateSlide(idx, 'tag', e.target.value)}
                    placeholder="Etiqueta superior"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1A1625] text-xs font-bold text-slate-900 dark:text-white"
                  />
                  <textarea
                    rows={2}
                    value={slide.title}
                    onChange={(e) => updateSlide(idx, 'title', e.target.value)}
                    placeholder="Título principal"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1A1625] text-xs font-semibold text-slate-900 dark:text-white"
                  />
                  <textarea
                    rows={2}
                    value={slide.subtitle}
                    onChange={(e) => updateSlide(idx, 'subtitle', e.target.value)}
                    placeholder="Subtítulo"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1A1625] text-xs text-slate-700 dark:text-slate-300"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={slide.ctaLabel}
                      onChange={(e) => updateSlide(idx, 'ctaLabel', e.target.value)}
                      placeholder="Botón"
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1A1625] text-[11px] font-bold text-slate-900 dark:text-white"
                    />
                    <input
                      type="text"
                      value={slide.ctaPath}
                      onChange={(e) => updateSlide(idx, 'ctaPath', e.target.value)}
                      placeholder="/ruta"
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1A1625] text-[11px] font-mono text-slate-600 dark:text-slate-300"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer & Pricing */}
      {studioTab === 'footer' && (
        <div className="bg-white dark:bg-[#1A1625] rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            Planes, WordPress &amp; Footer Institucional
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Plan Inicial
              </label>
              <input
                type="text"
                value={settings.platform.basicPrice}
                onChange={(e) =>
                  applySettingsUpdate((prev) => ({
                    ...prev,
                    platform: { ...prev.platform, basicPrice: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-xs font-mono font-bold text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Plan Pro</label>
              <input
                type="text"
                value={settings.platform.proPrice}
                onChange={(e) =>
                  applySettingsUpdate((prev) => ({
                    ...prev,
                    platform: { ...prev.platform, proPrice: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-xs font-mono font-bold text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Plan Corp.
              </label>
              <input
                type="text"
                value={settings.platform.corpPrice}
                onChange={(e) =>
                  applySettingsUpdate((prev) => ({
                    ...prev,
                    platform: { ...prev.platform, corpPrice: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-xs font-mono font-bold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Email de Soporte Footer
              </label>
              <input
                type="email"
                value={settings.footer.supportEmail}
                onChange={(e) =>
                  applySettingsUpdate((prev) => ({
                    ...prev,
                    footer: { ...prev.footer, supportEmail: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Subdominio WordPress Insights
              </label>
              <input
                type="url"
                value={settings.platform.wpSubdomainUrl}
                onChange={(e) =>
                  applySettingsUpdate((prev) => ({
                    ...prev,
                    platform: { ...prev.platform, wpSubdomainUrl: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-xs font-mono text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Descripción Institucional del Footer
            </label>
            <textarea
              rows={2}
              value={settings.footer.tagline}
              onChange={(e) =>
                applySettingsUpdate((prev) => ({
                  ...prev,
                  footer: { ...prev.footer, tagline: e.target.value },
                }))
              }
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-xs text-slate-900 dark:text-white"
            />
          </div>
        </div>
      )}
    </div>
  );
}
