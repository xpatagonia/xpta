import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Paintbrush,
  X,
  Save,
  RotateCcw,
  Layers,
  Menu as MenuIcon,
  Palette,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { auth, onAuthStateChanged } from '../../lib/db';
import { getApiUrl } from '../../lib/apiConfig';
import {
  DEFAULT_SITE_SETTINGS,
  SiteSettings,
  getCachedSiteSettings,
  persistSiteSettings,
  publishSessionSiteSettings,
} from '../../lib/siteSettings';
import DesignCustomizerControls, { CustomizerArea } from './DesignCustomizerControls';

export default function DesignStudioDrawer({
  settings,
}: {
  settings: SiteSettings;
}) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeArea, setActiveArea] = useState<CustomizerArea>('sections');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [notice, setNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      const isKnownAdminEmail =
        user.email === 'xpatagonia.com@gmail.com' || user.email === 'admin@xpatagonia.com';
      try {
        const token = await user.getIdToken?.();
        if (token) {
          const res = await fetch(`${getApiUrl()}/api/me/access`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const access = await res.json();
            setIsAdmin(Boolean(access.isAdmin || isKnownAdminEmail));
            return;
          }
        }
      } catch {
        // Fallback below
      }
      setIsAdmin(isKnownAdminEmail);
    });
    return () => unsub();
  }, []);

  if (!isAdmin) return null;

  const handleUpdate = (updater: (prev: SiteSettings) => SiteSettings) => {
    const next = updater(getCachedSiteSettings());
    publishSessionSiteSettings(next);
  };

  const handleUploadMedia = async (file: File, onUrl: (url: string) => void) => {
    if (file.size > 3.2 * 1024 * 1024) {
      setNotice({
        type: 'err',
        text: 'Archivo supera 3.2 MB. Pegá una URL pública de Cloudflare R2/Stream o YouTube.',
      });
      return;
    }
    setIsUploading(true);
    setNotice(null);
    try {
      const reader = new FileReader();
      const base64Data: string = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const token = await auth.currentUser?.getIdToken?.();
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
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error || 'Error subiendo archivo');
      onUrl(data.url);
      setNotice({ type: 'ok', text: 'Media subido. Pulsá Publicar para guardar en la web.' });
    } catch (err: any) {
      setNotice({ type: 'err', text: err?.message || 'Error al subir archivo' });
    } finally {
      setIsUploading(false);
    }
  };

  const handlePublish = async () => {
    setIsSaving(true);
    setNotice(null);
    const token = await auth.currentUser?.getIdToken?.();
    const res = await persistSiteSettings(settings, token);
    setIsSaving(false);
    if (res.savedRemote) {
      setNotice({ type: 'ok', text: 'Diseño publicado en producción.' });
    } else {
      setNotice({ type: 'err', text: res.error || 'No se pudo guardar en servidor.' });
    }
  };

  const handleReset = () => {
    publishSessionSiteSettings({
      ...DEFAULT_SITE_SETTINGS,
      updatedAt: new Date().toISOString(),
    });
    setNotice({ type: 'ok', text: 'Diseño base restaurado en vista previa.' });
  };

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl border border-white/15 text-xs font-bold flex items-center gap-2 hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          <Paintbrush className="w-4 h-4 text-orange-500" />
          <span>Personalizar Diseño</span>
        </button>
      )}

      {isOpen && (
        <aside className="fixed top-0 right-0 bottom-0 z-[90] w-full sm:w-[460px] bg-slate-50 dark:bg-[#110E17] border-l border-slate-200 dark:border-white/10 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-5 py-4 bg-white dark:bg-[#1A1625] border-b border-slate-200 dark:border-white/10 flex items-center justify-between gap-3 shrink-0">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Paintbrush className="w-4 h-4 text-orange-500" />
                Estudio Visual en Vivo
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Los cambios se reflejan al instante sobre el Home
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Cerrar editor visual"
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Area Selector */}
          <div className="px-4 py-2.5 bg-white dark:bg-[#1A1625] border-b border-slate-200 dark:border-white/10 flex items-center gap-1.5 shrink-0">
            {(
              [
                { id: 'sections', label: 'Secciones', icon: Layers },
                { id: 'menu', label: 'Menú', icon: MenuIcon },
                { id: 'theme', label: 'Tema & Fuentes', icon: Palette },
              ] as { id: CustomizerArea; label: string; icon: any }[]
            ).map((tab) => {
              const Icon = tab.icon;
              const active = activeArea === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveArea(tab.id)}
                  className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-orange-500 text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {notice && (
            <div
              className={`mx-4 mt-3 px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                notice.type === 'ok'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{notice.text}</span>
            </div>
          )}

          {/* Controls Body */}
          <div className="flex-1 overflow-y-auto p-4">
            <DesignCustomizerControls
              area={activeArea}
              settings={settings}
              onChange={handleUpdate}
              onUploadMedia={handleUploadMedia}
              isUploading={isUploading}
              compact
            />
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-white dark:bg-[#1A1625] border-t border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
              <Link
                to="/admin?tab=sitio"
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-slate-300 hover:border-orange-500 flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Admin
              </Link>
            </div>
            <button
              type="button"
              onClick={handlePublish}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-60"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Guardando...' : 'Publicar'}</span>
            </button>
          </div>
        </aside>
      )}
    </>
  );
}
