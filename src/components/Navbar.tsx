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
import ThemeToggle from './ThemeToggle';
import AuthModal from './AuthModal';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

export default function Navbar() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
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

  return (
    <nav className="w-full bg-white/95 dark:bg-[#110E17]/95 backdrop-blur-xl z-50 py-3.5 px-4 sm:px-6 md:px-12 border-b border-slate-200/80 dark:border-white/10 sticky top-0">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center h-14">
          {/* Clean Brand Lockup */}
          <Link to="/" className="flex items-center gap-3 cursor-pointer shrink-0">
            <img
              src="/logo.png"
              alt="xPatagonia"
              className="h-9 w-auto object-contain"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            <Link
              to="/insights"
              className={`transition-colors flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${
                isActive('/insights')
                  ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                  : 'hover:text-purple-600 dark:hover:text-purple-400'
              }`}
            >
              <Newspaper className="w-3.5 h-3.5 text-purple-500" />
              <span>Insights</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono">
                PÚBLICO
              </span>
            </Link>

            <Link
              to="/servicios"
              className={`transition-colors ${
                isActive('/servicios')
                  ? 'text-orange-500'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Directorio B2B
            </Link>

            <Link
              to="/marketplace"
              className={`transition-colors ${
                isActive('/marketplace')
                  ? 'text-orange-500'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Catálogo RFQ
            </Link>

            <Link
              to="/chat"
              className="hover:text-orange-500 transition-colors flex items-center gap-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Chat B2B</span>
            </Link>

            <Link
              to="/planes"
              className={`transition-colors ${
                isActive('/planes')
                  ? 'text-orange-500'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Planes & CRM
            </Link>
          </div>

          {/* Right Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <ThemeToggle />

            {user ? (
              <div className="relative group">
                <button className="px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20 transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Panel & CRM</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-70 group-hover:rotate-180 transition-transform duration-200" />
                </button>
                <div className="absolute top-full right-0 w-60 bg-white dark:bg-[#1A1625] rounded-xl shadow-2xl border border-slate-200 dark:border-white/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 flex flex-col overflow-hidden translate-y-2 group-hover:translate-y-0 mt-1">
                  <div className="p-3.5 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5">
                    <span className="text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider font-bold block mb-0.5">
                      Miembro Activo
                    </span>
                    <span className="text-orange-500 text-xs font-medium truncate block">
                      {user.email}
                    </span>
                  </div>
                  <Link
                    to="/dashboard"
                    className="px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-2.5 text-xs font-semibold"
                  >
                    <Database className="w-4 h-4 text-purple-500" />
                    <span>CRM & Cotizaciones</span>
                  </Link>
                  <Link
                    to="/inbox"
                    className="px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-2.5 border-t border-slate-100 dark:border-white/5 text-xs font-semibold"
                  >
                    <MessageSquare className="w-4 h-4 text-blue-500" />
                    <span>Sistema de Correos</span>
                  </Link>
                  <Link
                    to="/chat"
                    className="px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-2.5 border-t border-slate-100 dark:border-white/5 text-xs font-semibold"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Chat B2B (Patagonia Link)</span>
                  </Link>
                  <Link
                    to="/perfil-empresa"
                    className="px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-2.5 border-t border-slate-100 dark:border-white/5 text-xs font-semibold"
                  >
                    <UserIcon className="w-4 h-4 text-emerald-500" />
                    <span>Perfil de Empresa</span>
                  </Link>
                  <Link
                    to="/apps"
                    className="px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-2.5 border-t border-slate-100 dark:border-white/5 text-xs font-semibold"
                  >
                    <Grid2X2 className="w-4 h-4 text-orange-500" />
                    <span>Módulos Operativos</span>
                  </Link>
                  <Link
                    to="/admin"
                    className="px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-2.5 border-t border-slate-100 dark:border-white/5 text-xs font-semibold"
                  >
                    <Shield className="w-4 h-4 text-red-500" />
                    <span>Super Admin (CMS / Correo)</span>
                  </Link>
                  <div className="border-t border-slate-100 dark:border-white/5 p-2">
                    <button
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
                  onClick={() => setIsAuthOpen(true)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/15 text-slate-700 dark:text-slate-200 hover:border-orange-500 transition-colors text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-orange-500" />
                  <span>Acceso Miembros</span>
                </button>
                <Link
                  to="/planes"
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white transition-colors text-xs font-bold uppercase tracking-wider"
                >
                  Suscribir Empresa
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Trigger */}
          <div className="flex lg:hidden items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors p-1"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
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
            className="lg:hidden mt-3 pt-4 border-t border-slate-100 dark:border-white/5 overflow-hidden"
          >
            <div className="flex flex-col space-y-3.5 text-xs font-bold tracking-wider uppercase text-slate-700 dark:text-slate-300 pb-2">
              <Link
                to="/insights"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-purple-600 dark:text-purple-400 flex items-center gap-2"
              >
                <Newspaper className="w-4 h-4" /> Insights (Acceso Público)
              </Link>
              <Link
                to="/servicios"
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-orange-500 transition-colors"
              >
                Directorio de Empresas B2B
              </Link>
              <Link
                to="/marketplace"
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-orange-500 transition-colors"
              >
                Catálogo & Suministros RFQ
              </Link>
              <Link
                to="/chat"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-1.5"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Chat B2B
              </Link>
              <Link
                to="/planes"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-orange-500"
              >
                Planes de Suscripción & CRM
              </Link>

              {user ? (
                <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex flex-col space-y-3">
                  <span className="text-[10px] text-slate-500">
                    Cuenta: {user.email}
                  </span>
                  <Link
                    to="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2"
                  >
                    <LayoutDashboard className="w-4 h-4 text-orange-500" /> Panel & CRM
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
                    <Shield className="w-4 h-4 text-red-500" /> Super Admin
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsMobileMenuOpen(false);
                    }}
                    className="text-left text-red-600 dark:text-red-400 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" /> Cerrar Sesión
                  </button>
                </div>
              ) : (
                <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex flex-col gap-2.5">
                  <button
                    onClick={() => {
                      setIsAuthOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-center"
                  >
                    Ingresar (Miembros)
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </nav>
  );
}
