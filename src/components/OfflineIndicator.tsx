import { useEffect, useState } from 'react';
import { WifiOff, BookmarkCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState<boolean>(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-semibold flex flex-wrap items-center justify-center gap-3 z-50 border-b border-amber-600/30">
      <span className="inline-flex items-center gap-1.5">
        <WifiOff className="w-3.5 h-3.5 shrink-0" />
        Sin conexión de red · Trabajando con caché offline en Patagonia
      </span>
      <Link
        to="/servicios?offline=1"
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 text-white font-bold hover:opacity-90"
      >
        <BookmarkCheck className="w-3.5 h-3.5 text-orange-400" />
        Ver Fichas Guardadas
      </Link>
    </div>
  );
}
