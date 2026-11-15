import { motion, AnimatePresence } from 'motion/react';
import {
  Grid2X2,
  LogOut,
  LayoutDashboard,
  ChevronDown,
  User as UserIcon,
  MessageSquare,
  Shield,
  Menu,
  X,
  Newspaper,
  Database,
  Lock,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import ThemeToggle, { THEME_CHANGE_EVENT } from './ThemeToggle';
import AuthModal from './AuthModal';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import {
  SiteSettings,
  SITE_SETTINGS_EVENT,
  fetchSiteSettings,
  getCachedSiteSettings,
  isLightColor,
  resolveFontFamilyCss,
} from '../lib/siteSettings';

export default function Navbar() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => getCachedSiteSettings());
  const [isDocDark, setIsDocDark] = useState<boolean>(() =>
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : true
  );
  const navigate = useNavigate();
  const location = useLocation();

  const [authInitialMode, setAuthInitialMode] = useState<
    'login' | 'register' | 'recovery' | 'update_password'
  >('login');

  useEffect(() => {
    fetchSiteSettings().then(setSiteSettings);
    const onSettingsUpdate = (e: Event) => {
      const custom = e as CustomEvent<SiteSettings>;
      setSiteSettings(custom.detail || getCachedSiteSettings());
    };
    const onThemeSync = (e: Event) => {
      const custom = e as CustomEvent<{ isDark?: boolean }>;
      if (typeof custom.detail?.isDark === 'boolean') {
        setIsDocDark(custom.detail.isDark);
      } else {
        setIsDocDark(document.documentElement.classList.contains('dark'));
      }
    };
    window.addEventListener(SITE_SETTINGS_EVENT, onSettingsUpdate);
    window.addEventListener(THEME_CHANGE_EVENT, onThemeSync);

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    if (
      typeof window !== 'undefined' &&
      (window.location.hash.includes('type=recovery') ||
        window.location.search.includes('recovery=1') ||
        window.location.hash.includes('error_description=') ||
        window.location.search.includes('error_description='))
    ) {
      setAuthInitialMode(
        window.location.hash.includes('error_description=') ||
          window.location.search.includes('error_description=')
          ? 'recovery'
          : 'update_password'
      );
      setIsAuthOpen(true);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === 'PASSWORD_RECOVERY') {
        setAuthInitialMode('update_password');
        setIsAuthOpen(true);
      }
    });

    return () => {
      window.removeEventListener(SITE_SETTINGS_EVENT, onSettingsUpdate);
      window.removeEventListener(THEME_CHANGE_EVENT, onThemeSync);
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out', error);
    }
  };

  const isActive = (path: string) => location.pathname === path;
  const menuCfg = siteSettings.menu;
  const visibleItems = (menuCfg.items || []).filter((item) => item.visible);
  const accentColor = menuCfg.accentColor || siteSettings.designTheme.accentColor || '#f97316';
  const customBgLight = isLightColor(menuCfg.backgroundColor);
  const effectiveIsLightSurface = customBgLight !== null ? customBgLight : !isDocDark;

  const variantClasses =
    menuCfg.variant === 'solid'
      ? 'bg-white dark:bg-[#110E17] border-b border-slate-200 dark:border-white/10'
      : menuCfg.variant === 'minimal'
      ? 'bg-white/95 dark:bg-[#110E17]/95 border-b border-slate-200/50 dark:border-white/5'
      : 'bg-white/90 dark:bg-[#110E17]/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/10';

  const resolvedNavTextColor =
    menuCfg.textColor ||
    (customBgLight === true ? '#0F172A' : customBgLight === false ? '#F8FAFC' : undefined);

  const navStyle: React.CSSProperties = {
    ...(menuCfg.backgroundColor ? { backgroundColor: menuCfg.backgroundColor } : {}),
    ...(resolvedNavTextColor ? { color: resolvedNavTextColor } : {}),
    ...(menuCfg.fontFamily && menuCfg.fontFamily !== 'inherit'
      ? { fontFamily: resolveFontFamilyCss(menuCfg.fontFamily) }
      : {}),
  };

  return (
    <nav
      className={`w-full z-50 py-3 px-4 sm:px-6 md:px-12 ${variantClasses} ${
        menuCfg.sticky ? 'sticky top-0' : 'relative'
      }`}
      style={navStyle}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center h-14 gap-8">
          {/* Zone 1: Clean Single Brand Element with contrast-safe filter */}
          <Link to="/" className="flex items-center cursor-pointer shrink-0">
            <img
              src="/logo.png"
              alt="xPatagonia"
              className={`h-9 w-auto object-contain transition-[filter] duration-200 ${
                effectiveIsLightSurface ? 'invert hue-rotate-180' : ''
              }`}
            />
          </Link>

          {/* Zone 2: Clean Single-Line Navigation Links */}
          <div className="hidden lg:flex items-center gap-6 text-xs font-bold tracking-wide">
            {visibleItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className="transition-colors whitespace-nowrap shrink-0 py-1 hover:underline underline-offset-4"
                  style={{
                    color: active
                      ? accentColor
                      : resolvedNavTextColor || (effectiveIsLightSurface ? '#1E293B' : '#F1F5F9'),
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Zone 3: Primary Action & Member Account */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            <ThemeToggle lightSurface={customBgLight} />

            {user ? (
              <div className="relative group">
                <button
                  type="button"
                  className={`px-4 py-2 rounded-xl border transition-colors flex items-center gap-2 text-xs font-bold whitespace-nowrap shrink-0 ${
                    effectiveIsLightSurface
                      ? 'border-slate-300 hover:border-orange-500/60 bg-slate-50/70'
                      : 'border-white/15 hover:border-orange-500/60'
                  }`}
                  style={{ color: accentColor }}
                >
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  <span>Panel &amp; CRM</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-70 group-hover:rotate-180 transition-transform duration-200" />
                </button>
                <div className="absolute top-full right-0 w-60 bg-white dark:bg-[#1A1625] rounded-xl shadow-2xl border border-slate-200 dark:border-white/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 flex flex-col overflow-hidden translate-y-2 group-hover:translate-y-0 mt-1 text-slate-800 dark:text-slate-100">
                  <div className="p-3.5 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5">
                    <span className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold block mb-0.5">
                      Miembro Activo
                    </span>
                    <span className="text-orange-500 text-xs font-medium truncate block">
                      {user.email}
                    </span>
                  </div>
                  <Link
                    to="/dashboard"
                    className="px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors flex items-center gap-2.5 text-xs font-semibold"
                  >
                    <Database className="w-4 h-4 text-purple-500" />
                    <span>CRM &amp; Cotizaciones</span>
                  </Link>
                  <Link
                    to="/inbox"
                    className="px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors flex items-center gap-2.5 border-t border-slate-100 dark:border-white/5 text-xs font-semibold"
                  >
                    <MessageSquare className="w-4 h-4 text-blue-500" />
                    <span>Sistema de Correos</span>
                  </Link>
                  <Link
                    to="/chat"
                    className="px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors flex items-center gap-2.5 border-t border-slate-100 dark:border-white/5 text-xs font-semibold"
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-500" />
                    <span>Chat B2B (Patagonia Link)</span>
                  </Link>
                  <Link
                    to="/perfil-empresa"
                    className="px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors flex items-center gap-2.5 border-t border-slate-100 dark:border-white/5 text-xs font-semibold"
                  >
                    <UserIcon className="w-4 h-4 text-emerald-500" />
                    <span>Perfil de Empresa</span>
                  </Link>
                  <Link
                    to="/apps"
                    className="px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors flex items-center gap-2.5 border-t border-slate-100 dark:border-white/5 text-xs font-semibold"
                  >
                    <Grid2X2 className="w-4 h-4 text-orange-500" />
                    <span>Módulos Operativos</span>
                  </Link>
                  <Link
                    to="/admin"
                    className="px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors flex items-center gap-2.5 border-t border-slate-100 dark:border-white/5 text-xs font-semibold"
                  >
                    <Shield className="w-4 h-4 text-red-500" />
                    <span>Super Admin (Diseño &amp; CMS)</span>
                  </Link>
                  <div className="border-t border-slate-100 dark:border-white/5 p-2">
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 transition-colors flex items-center gap-2 text-xs font-semibold"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsAuthOpen(true)}
                  className={`px-3.5 py-2 rounded-xl border hover:border-orange-500 transition-colors text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    effectiveIsLightSurface
                      ? 'border-slate-300 text-slate-800'
                      : 'border-white/15 text-slate-100'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" style={{ color: accentColor }} />
                  <span>Ingresar</span>
                </button>
                <Link
                  to={menuCfg.ctaPath || '/planes'}
                  className="px-4 py-2 rounded-xl text-white hover:opacity-90 transition-opacity text-xs font-bold whitespace-nowrap shrink-0"
                  style={{ backgroundColor: accentColor }}
                >
                  {menuCfg.ctaLabel || 'Suscribir Empresa'}
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Trigger */}
          <div className="flex lg:hidden items-center gap-3 shrink-0">
            <ThemeToggle lightSurface={customBgLight} />
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              className={`p-1.5 rounded-lg transition-colors ${
                effectiveIsLightSurface
                  ? 'text-slate-800 hover:bg-slate-100'
                  : 'text-slate-100 hover:bg-white/10'
              }`}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden mt-3 pt-4 border-t border-slate-200/40 dark:border-white/10 overflow-hidden"
          >
            <div className="flex flex-col space-y-3 text-xs font-bold pb-2">
              {visibleItems.map((item) => (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-1 flex items-center gap-2 transition-colors"
                  style={{ color: isActive(item.path) ? accentColor : undefined }}
                >
                  {item.path === '/insights' && <Newspaper className="w-4 h-4 opacity-70" />}
                  <span>{item.label}</span>
                </Link>
              ))}

              {user ? (
                <div className="pt-3 border-t border-slate-200/40 dark:border-white/10 flex flex-col space-y-2.5">
                  <span className="text-[11px] opacity-70">Cuenta: {user.email}</span>
                  <Link
                    to="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2"
                  >
                    <LayoutDashboard className="w-4 h-4 text-orange-500" /> Panel &amp; CRM
                  </Link>
                  <Link
                    to="/inbox"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4 text-blue-500" /> Sistema de Correos
                  </Link>
                  <Link
                    to="/perfil-empresa"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2"
                  >
                    <UserIcon className="w-4 h-4 text-emerald-500" /> Mi Perfil
                  </Link>
                  <Link
                    to="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2"
                  >
                    <Shield className="w-4 h-4 text-red-500" /> Super Admin (Diseño &amp; CMS)
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      handleSignOut();
                      setIsMobileMenuOpen(false);
                    }}
                    className="text-left text-red-500 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" /> Cerrar Sesión
                  </button>
                </div>
              ) : (
                <div className="pt-3 border-t border-slate-200/40 dark:border-white/10 flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAuthOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-center"
                  >
                    Ingresar (Miembros)
                  </button>
                  <Link
                    to={menuCfg.ctaPath || '/planes'}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full py-2.5 rounded-xl text-white text-center"
                    style={{ backgroundColor: accentColor }}
                  >
                    {menuCfg.ctaLabel || 'Suscribir Empresa'}
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AuthModal
        isOpen={isAuthOpen}
        initialMode={authInitialMode}
        onClose={() => {
          setIsAuthOpen(false);
          setAuthInitialMode('login');
        }}
      />
    </nav>
  );
}
