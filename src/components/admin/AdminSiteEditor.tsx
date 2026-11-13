import React, { useState, useEffect } from 'react';
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
  Globe,
  CheckCircle2,
  Sliders,
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
  saveCachedSiteSettings,
} from '../../lib/siteSettings';

export default function AdminSiteEditor() {
  const [settings, setSettings] = useState<SiteSettings>(() => getCachedSiteSettings());
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'info' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchSiteSettings().then((loaded) => setSettings(loaded));
  }, []);

  const updateHero = (patch: Partial<SiteSettings['hero']>) => {
    setSettings((prev) => ({
      ...prev,
      hero: { ...prev.hero, ...patch },
    }));
  };

  const updateSlide = (idx: number, field: string, value: string) => {
    setSettings((prev) => {
      const nextSlides = [...prev.hero.slides];
      nextSlides[idx] = { ...nextSlides[idx], [field]: value };
      return {
        ...prev,
        hero: { ...prev.hero, slides: nextSlides },
      };
    });
  };

  const toggleSection = (key: keyof SiteSettings['sections']) => {
    setSettings((prev) => ({
      ...prev,
      sections: { ...prev.sections, [key]: !prev.sections[key] },
    }));
  };

  const handleUploadMedia = async (
    e: React.ChangeEvent<HTMLInputElement>,
    targetKind: 'image' | 'video'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 18 * 1024 * 1024) {
      setStatusBanner({
        type: 'error',
        message: 'El archivo supera 18 MB. Usá un video MP4/WebM comprimido o una URL externa/R2.',
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
      let finalUrl = base64Data;

      if (token) {
        try {
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
          if (res.ok) {
            const uploaded = await res.json();
            if (uploaded.url) finalUrl = uploaded.url;
          }
        } catch {
          // Local preview fallback via base64 if backend upload endpoint unreachable
        }
      }

      if (targetKind === 'video') {
        updateHero({ backgroundType: 'video', videoUrl: finalUrl });
      } else {
        updateHero({ backgroundType: 'image', imageUrl: finalUrl, posterUrl: finalUrl });
      }

      setStatusBanner({
        type: 'success',
        message: `${targetKind === 'video' ? 'Video' : 'Imagen'} cargado en la vista previa. Pulsá "Guardar y Publicar" para aplicarlo a todo el sitio.`,
      });
    } catch (err: any) {
      setStatusBanner({
        type: 'error',
        message: `No se pudo procesar el archivo: ${err?.message || 'error'}`,
      });
    } finally {
      setIsUploading(false);
    }
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
        message: 'Configuración publicada en servidor y aplicada en vivo a Hero, Secciones, Footer y Planes.',
      });
    } else {
      setStatusBanner({
        type: 'info',
        message: `Aplicado al instante en este navegador (respaldo local). Servidor: ${res.error || 'modo preview sin sesión remoto'}.`,
      });
    }
  };

  const handleReset = async () => {
    const resetCopy: SiteSettings = {
      ...DEFAULT_SITE_SETTINGS,
      updatedAt: new Date().toISOString(),
    };
    setSettings(resetCopy);
    saveCachedSiteSettings(resetCopy);
    setStatusBanner({
      type: 'info',
      message: 'Valores predeterminados restaurados. Pulsá Guardar para confirmar en el backend.',
    });
  };

  const firstSlide = settings.hero.slides[0] || DEFAULT_SITE_SETTINGS.hero.slides[0];
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
      <div className="bg-white dark:bg-[#1A1625] rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layout className="w-5 h-5 text-orange-500" />
            Control Total del Sitio &amp; Fondo Hero
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Personalizá la primera sección (foto o video de fondo, contraste, slides), activá o desactivá módulos del Home y ajustá textos/precios globales.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restaurar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-purple-600 text-white text-xs font-bold uppercase tracking-wider hover:opacity-90 flex items-center gap-2 shadow-lg shadow-purple-500/20 disabled:opacity-60 transition-opacity"
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

      {/* 1. HERO BACKGROUND & LIVE PREVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white dark:bg-[#1A1625] rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-500" />
              Sección Hero (Foto / Video de Fondo)
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400">
              main &gt; section:1
            </span>
          </div>

          {/* Background Type Selector */}
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
                      ? 'border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400 shadow-xs'
                      : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-purple-400/40'
                  }`}
                >
                  <OptIcon className="w-4 h-4" />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>

          {/* Upload & URL Inputs */}
          {settings.hero.backgroundType === 'image' && (
            <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
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
                <label className="px-4 py-2.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5 hover:opacity-90 shrink-0">
                  <Upload className="w-3.5 h-3.5" />
                  {isUploading ? 'Subiendo...' : 'Subir Foto'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleUploadMedia(e, 'image')}
                  />
                </label>
              </div>
            </div>
          )}

          {settings.hero.backgroundType === 'video' && (
            <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  URL de Video Loop (MP4 / WebM / YouTube URL)
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    value={settings.hero.videoUrl}
                    onChange={(e) => updateHero({ videoUrl: e.target.value })}
                    placeholder="https://.../video-patagonia.mp4 o YouTube link"
                    className="flex-1 px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1A1625] text-sm text-slate-900 dark:text-white outline-none focus:border-orange-500"
                  />
                  <label className="px-4 py-2.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5 hover:opacity-90 shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    {isUploading ? 'Subiendo...' : 'Subir Video'}
                    <input
                      type="file"
                      accept="video/mp4,video/webm"
                      className="hidden"
                      onChange={(e) => handleUploadMedia(e, 'video')}
                    />
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Imagen Poster de Respaldo (carga instantánea en móviles)
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

          {/* Presets */}
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
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

          {/* Sliders for contrast & blur */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-white/5">
            <div>
              <label className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
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
              <label className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
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
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
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

        {/* Live Hero Mini Preview */}
        <div className="lg:col-span-5 bg-white dark:bg-[#1A1625] rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-sm flex flex-col">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Eye className="w-4 h-4 text-emerald-500" />
            Vista Previa en Vivo (Hero)
          </h3>

          <div className="relative flex-1 min-h-[280px] rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 flex flex-col items-center justify-center p-6 text-center bg-slate-950">
            {settings.hero.backgroundType === 'image' && settings.hero.imageUrl && (
              <img
                src={settings.hero.imageUrl}
                alt="Preview fondo Hero"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ filter: settings.hero.blurPx ? `blur(${settings.hero.blurPx}px)` : undefined }}
              />
            )}
            {settings.hero.backgroundType === 'video' && settings.hero.videoUrl && (
              <video
                key={settings.hero.videoUrl}
                autoPlay
                muted
                loop
                playsInline
                poster={settings.hero.posterUrl || undefined}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ filter: settings.hero.blurPx ? `blur(${settings.hero.blurPx}px)` : undefined }}
              >
                <source src={settings.hero.videoUrl} />
              </video>
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
              <span className="inline-block px-3 py-1 rounded-full bg-black/40 border border-white/20 text-[9px] font-bold uppercase tracking-widest text-white">
                {firstSlide.tag}
              </span>
              <h4 className="text-lg font-display font-bold text-white leading-snug">
                {firstSlide.title}
              </h4>
              <p className="text-xs text-slate-200 line-clamp-2">{firstSlide.subtitle}</p>
              <div className="mx-auto max-w-xs h-9 rounded-xl bg-white/95 px-3 flex items-center justify-between text-[10px] text-slate-500 shadow-lg">
                <span className="truncate">Buscar proveedores B2B...</span>
                <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-orange-500 to-purple-600 text-white font-bold">
                  {firstSlide.ctaLabel}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SLIDES TEXT EDITOR */}
      <div className="bg-white dark:bg-[#1A1625] rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-sm">
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white mb-4">
          Mensajes y Slides del Hero
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {settings.hero.slides.map((slide, idx) => (
            <div
              key={slide.id}
              className="p-4 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10 space-y-3"
            >
              <div className="text-[10px] font-mono font-bold uppercase text-orange-500">
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

      {/* 3. HOME SECTIONS + PRICING + FOOTER CONTROL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#1A1625] rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-500" />
            Secciones Visibles en la Portada (Home)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(
              [
                { key: 'indicators', label: 'Ticker & Indicadores Regionales' },
                { key: 'insights', label: 'Patagonia Insights (Público)' },
                { key: 'categories', label: 'Categorías Industriales' },
                { key: 'howItWorks', label: 'Cómo Funciona el Hub' },
                { key: 'ecosystem', label: 'Grilla del Ecosistema' },
                { key: 'contact', label: 'Formulario de Contacto' },
              ] as { key: keyof SiteSettings['sections']; label: string }[]
            ).map((item) => {
              const enabled = settings.sections[item.key];
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => toggleSection(item.key)}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between text-xs font-bold transition-colors ${
                    enabled
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-50 dark:bg-[#110E17] border-slate-200 dark:border-white/10 text-slate-500'
                  }`}
                >
                  <span>{item.label}</span>
                  <span className="font-mono text-[10px] uppercase">
                    {enabled ? 'ACTIVO' : 'OCULTO'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-[#1A1625] rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            Planes, WordPress &amp; Footer Institucional
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                Plan Inicial
              </label>
              <input
                type="text"
                value={settings.platform.basicPrice}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    platform: { ...prev.platform, basicPrice: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-xs font-mono font-bold text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                Plan Pro
              </label>
              <input
                type="text"
                value={settings.platform.proPrice}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    platform: { ...prev.platform, proPrice: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-xs font-mono font-bold text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                Plan Corp.
              </label>
              <input
                type="text"
                value={settings.platform.corpPrice}
                onChange={(e) =>
                  setSettings((prev) => ({
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
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                Email de Soporte Footer
              </label>
              <input
                type="email"
                value={settings.footer.supportEmail}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    footer: { ...prev.footer, supportEmail: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                Subdominio WordPress Insights
              </label>
              <input
                type="url"
                value={settings.platform.wpSubdomainUrl}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    platform: { ...prev.platform, wpSubdomainUrl: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-xs font-mono text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
              Descripción Institucional del Footer
            </label>
            <textarea
              rows={2}
              value={settings.footer.tagline}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  footer: { ...prev.footer, tagline: e.target.value },
                }))
              }
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-xs text-slate-900 dark:text-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
