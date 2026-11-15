import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export const THEME_CHANGE_EVENT = 'xpatagonia:theme-change';

function resolveInitialDarkMode(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const saved = localStorage.getItem('theme');
    if (saved === 'light') return false;
    if (saved === 'dark') return true;
    return !window.matchMedia('(prefers-color-scheme: light)').matches;
  } catch {
    return document.documentElement.classList.contains('dark');
  }
}

function applyThemeToDocument(nextDark: boolean) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', nextDark);
  document.documentElement.style.colorScheme = nextDark ? 'dark' : 'light';
  try {
    localStorage.setItem('theme', nextDark ? 'dark' : 'light');
  } catch {
    // ignore
  }
}

export default function ThemeToggle({ lightSurface }: { lightSurface?: boolean | null }) {
  const [isDark, setIsDark] = useState<boolean>(resolveInitialDarkMode);

  useEffect(() => {
    const initial = resolveInitialDarkMode();
    applyThemeToDocument(initial);
    setIsDark(initial);

    const onSync = (e: Event) => {
      const custom = e as CustomEvent<{ isDark?: boolean }>;
      if (typeof custom.detail?.isDark === 'boolean') {
        setIsDark(custom.detail.isDark);
      } else {
        setIsDark(document.documentElement.classList.contains('dark'));
      }
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'theme') {
        const next = e.newValue !== 'light';
        applyThemeToDocument(next);
        setIsDark(next);
      }
    };

    window.addEventListener(THEME_CHANGE_EVENT, onSync);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, onSync);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const toggleTheme = () => {
    const currentlyDark = document.documentElement.classList.contains('dark');
    const nextDark = !currentlyDark;
    applyThemeToDocument(nextDark);
    setIsDark(nextDark);
    window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: { isDark: nextDark } }));
  };

  const surfaceClasses =
    lightSurface === true
      ? 'bg-slate-100 border-slate-300 text-slate-800 hover:text-orange-600'
      : lightSurface === false
      ? 'bg-white/10 border-white/15 text-slate-100 hover:text-orange-400'
      : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? 'Cambiar a modo claro (Fondo blanco)' : 'Cambiar a modo oscuro'}
      aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
      aria-pressed={!isDark}
      className={`p-2 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/50 cursor-pointer shrink-0 ${surfaceClasses}`}
    >
      {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
    </button>
  );
}
