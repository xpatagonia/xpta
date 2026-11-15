import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  SiteSettings,
  getCachedSiteSettings,
  SITE_SETTINGS_EVENT,
} from '../lib/siteSettings';

export default function Footer() {
  const [settings, setSettings] = useState<SiteSettings>(() => getCachedSiteSettings());

  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<SiteSettings>;
      setSettings(custom.detail || getCachedSiteSettings());
    };
    window.addEventListener(SITE_SETTINGS_EVENT, handler);
    return () => window.removeEventListener(SITE_SETTINGS_EVENT, handler);
  }, []);

  const { footer } = settings;

  return (
    <footer className="bg-slate-100 dark:bg-[#0A080E] text-slate-600 dark:text-slate-400 py-20 px-6 md:px-12 border-t border-slate-100 dark:border-white/5">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-2">
            <div className="flex items-center mb-8 cursor-pointer">
              <img
                src="/logo.png"
                alt="x.patagonia logo"
                className="h-10 w-auto object-contain dark:invert-0 dark:hue-rotate-0 invert hue-rotate-180"
              />
            </div>
            <p className="text-sm max-w-sm leading-relaxed text-slate-500 font-medium">
              {footer.tagline}
            </p>
            {footer.supportEmail && (
              <p className="mt-3 text-xs font-mono text-slate-500">
                Contacto: {footer.supportEmail}
              </p>
            )}
          </div>
          <div>
            <h4 className="font-bold mb-6 text-[10px] tracking-widest uppercase text-slate-500">
              Servicios B2B
            </h4>
            <ul className="space-y-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              <li>
                <Link to="/servicios" className="hover:text-purple-400 transition-colors">
                  Directorio de Empresas
                </Link>
              </li>
              <li>
                <Link to="/marketplace" className="hover:text-orange-400 transition-colors">
                  Cotizador RFQ
                </Link>
              </li>
              <li>
                <Link to="/logistica" className="hover:text-purple-400 transition-colors">
                  Rutas &amp; Logística OSRM
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-orange-400 transition-colors">
                  API &amp; Odoo
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-[10px] tracking-widest uppercase text-slate-500">
              Plataforma
            </h4>
            <ul className="space-y-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              <li>
                <Link to="/admin" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Control CMS &amp; Admin
                </Link>
              </li>
              <li>
                <Link to="/insights" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Patagonia Insights
                </Link>
              </li>
              <li>
                <Link to="/planes" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Planes &amp; Suscripciones
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Política de Privacidad
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-slate-100 dark:border-white/5 flex flex-col md:flex-row justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-600">
          <p>
            &copy; {new Date().getFullYear()} {footer.copyrightText}
          </p>
          <div className="mt-4 md:mt-0 flex gap-4 items-center">
            <span>{footer.odooBadgeText}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
