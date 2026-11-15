import { useEffect, useState } from 'react';
import { Download, Smartphone, X, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallButton({ compact = false }: { compact?: boolean }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  const isIos =
    typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as any).MSStream;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkInstalled =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    if (checkInstalled) {
      setIsInstalled(true);
      return;
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  if (isInstalled) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
      return;
    }
    setShowIosGuide(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className={
          compact
            ? 'min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#1A1625] text-slate-800 dark:text-white hover:border-orange-500/50 text-xs font-bold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0'
            : 'min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 text-xs font-bold inline-flex items-center gap-2 transition-opacity whitespace-nowrap shrink-0'
        }
      >
        <Smartphone className="w-4 h-4 text-orange-500 shrink-0" />
        <span>Instalar App Móvil</span>
        <Download className="w-3.5 h-3.5 opacity-70 shrink-0" />
      </button>

      {showIosGuide && (
        <div className="fixed inset-0 z-[130] flex items-end sm:items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
            onClick={() => setShowIosGuide(false)}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-[#1A1625] rounded-2xl border border-slate-200 dark:border-white/10 p-6 shadow-2xl z-10">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-orange-500/15 text-orange-500 flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-display font-bold text-slate-900 dark:text-white">
                    Instalar xPatagonia en tu Celular
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Acceso directo y fichas guardadas sin señal en ruta
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white"
                aria-label="Cerrar guía de instalación"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isIos ? (
              <ol className="space-y-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <span className="font-mono font-bold text-orange-500">1.</span>
                  <span>
                    Tocá el botón <strong className="inline-flex items-center gap-1"><Share className="w-3.5 h-3.5" /> Compartir</strong> en la barra inferior de Safari.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono font-bold text-orange-500">2.</span>
                  <span>Deslizá hacia abajo y elegí <strong>Agregar a inicio</strong>.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono font-bold text-orange-500">3.</span>
                  <span>Confirmá con <strong>Agregar</strong> para operar xPatagonia como app nativa.</span>
                </li>
              </ol>
            ) : (
              <ol className="space-y-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <span className="font-mono font-bold text-orange-500">1.</span>
                  <span>Abrí el menú del navegador (tres puntos en la esquina superior derecha).</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono font-bold text-orange-500">2.</span>
                  <span>Seleccioná <strong>Instalar aplicación</strong> o <strong>Agregar a pantalla principal</strong>.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono font-bold text-orange-500">3.</span>
                  <span>Tus fichas guardadas y contactos vCard/GPX quedarán accesibles en campo.</span>
                </li>
              </ol>
            )}
          </div>
        </div>
      )}
    </>
  );
}
