import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { X, Mail, Lock, Loader2, Building2, Briefcase, Zap, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { MAIN_CATEGORIES } from '../lib/categories';
import { getApiUrl } from '../lib/apiConfig';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register' | 'recovery' | 'update_password';
}

function translateAuthError(rawMsg: string): string {
  const msg = String(rawMsg || '');
  if (/rate limit|over_email_send_rate_limit/i.test(msg)) {
    return 'Límite temporal de correos de Supabase alcanzado (el SMTP gratuito de Supabase permite 2–4 envíos por hora). Esperá unos minutos o definí tu clave directo desde Supabase → Authentication → Users.';
  }
  if (/security purposes|only request this after/i.test(msg)) {
    return 'Por seguridad de Supabase debés esperar 60 segundos antes de pedir otro enlace.';
  }
  if (/otp_expired|expired|invalid/i.test(msg) && /link|token|otp/i.test(msg)) {
    return 'El enlace de recuperación expiró o ya fue usado. Solicitá uno nuevo desde "Recuperar acceso".';
  }
  if (/Auth session missing/i.test(msg)) {
    return 'La sesión de recuperación no está activa o el enlace expiró. Volvé a solicitar "Recuperar acceso" y abrí el enlace en la misma pestaña.';
  }
  if (/different from the old password/i.test(msg)) {
    return 'La nueva contraseña debe ser diferente a la contraseña anterior.';
  }
  return msg || 'Ha ocurrido un error inesperado';
}

export default function AuthModal({ isOpen, onClose, initialMode }: AuthModalProps) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register' | 'recovery' | 'update_password'>(initialMode || 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [cuit, setCuit] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
    }
  }, [initialMode]);

  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setPassword('');
      setNewPassword('');
      setCuit('');
      setCategory('');
      setError(null);
      setSuccess(null);
      setMode(initialMode || 'login');
      return;
    }

    // Check if redirected back with a Supabase error in hash/query (e.g. otp_expired)
    if (typeof window !== 'undefined') {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const searchParams = new URLSearchParams(window.location.search);
      const errDesc =
        hashParams.get('error_description') ||
        searchParams.get('error_description') ||
        hashParams.get('error') ||
        searchParams.get('error');
      if (errDesc) {
        setError(translateAuthError(errDesc));
        setMode('recovery');
      }
    }
  }, [isOpen, initialMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === 'update_password') {
        if (!newPassword || newPassword.length < 6) {
          throw new Error('La nueva contraseña debe tener al menos 6 caracteres.');
        }

        // Ensure session is hydrated if tokens are still in the URL hash or ?code= query
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session && typeof window !== 'undefined') {
          const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
          const access_token = hashParams.get('access_token');
          const refresh_token = hashParams.get('refresh_token');
          const code = new URLSearchParams(window.location.search).get('code');

          if (access_token && refresh_token) {
            const { error: setSessErr } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            if (setSessErr) throw setSessErr;
          } else if (code) {
            const { error: exchErr } = await supabase.auth.exchangeCodeForSession(code);
            if (exchErr) throw exchErr;
          }
        }

        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        setSuccess('¡Contraseña actualizada con éxito! Ya podés ingresar al Panel.');
        if (typeof window !== 'undefined' && (window.location.hash || window.location.search)) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        setTimeout(() => {
          onClose();
          navigate('/dashboard');
        }, 1200);
      } else if (mode === 'recovery') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/?recovery=1',
        });
        if (error) throw error;
        setSuccess('Te hemos enviado un enlace a tu correo para restablecer tu contraseña. Revisá también Spam.');
      } else if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onClose();
        navigate('/dashboard');
      } else {
        if (!cuit || cuit.length !== 11) {
          throw new Error('Por favor, ingresa un CUIT válido (11 dígitos sin guiones).');
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        
        if (data.session?.access_token) {
          await fetch(`${getApiUrl()}/api/register-setup`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${data.session.access_token}`
            },
            body: JSON.stringify({ cuit, category })
          });
        }
        
        onClose();
        navigate('/perfil-empresa');
      }
    } catch (err: any) {
      setError(translateAuthError(err?.message || 'Ha ocurrido un error inesperado'));
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      setError('Por favor, ingresa tu email para enviar el Magic Link.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin + '/dashboard'
        }
      });
      if (error) throw error;
      setSuccess('¡Magic Link enviado! Revisa tu bandeja de entrada.');
    } catch (err: any) {
      setError(translateAuthError(err?.message || 'Error al enviar el enlace mágico.'));
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/50 dark:bg-black/80 backdrop-blur-sm z-[9998]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[9999] p-6"
          >
            <div className="bg-white dark:bg-[#1A1625] rounded-3xl p-8 shadow-2xl border border-slate-200 dark:border-white/10 relative overflow-hidden">
              <button
                onClick={onClose}
                className="absolute right-6 top-6 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-8">
                <h2 className="text-2xl font-bold font-display text-slate-900 dark:text-white mb-2">
                  {mode === 'login'
                    ? 'Ingresar a x.patagonia'
                    : mode === 'register'
                    ? 'Crear cuenta'
                    : mode === 'update_password'
                    ? 'Nueva Contraseña'
                    : 'Recuperar acceso'}
                </h2>
                <p className="text-sm font-medium text-slate-500">
                  {mode === 'login'
                    ? 'Accede a la red de proveedores más grande de la Patagonia'
                    : mode === 'register'
                    ? 'Únete para conectar con empresas B2B'
                    : mode === 'update_password'
                    ? 'Ingresá tu nueva clave para completar la recuperación de acceso'
                    : 'Te enviaremos un enlace seguro a tu email'}
                </p>
              </div>

              {!isSupabaseConfigured && (
                <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-medium flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 text-amber-500" />
                  <p>
                    <strong>Falta configurar Supabase en este entorno:</strong> cargá <code className="font-mono">VITE_SUPABASE_URL</code> y <code className="font-mono">VITE_SUPABASE_ANON_KEY</code> en Vercel/Cloudflare y redeployá para habilitar el envío de mails de recuperación.
                  </p>
                </div>
              )}

              {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>{error}</p>
                </motion.div>
              )}
              
              {success && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <p>{success}</p>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode !== 'update_password' ? (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                      Email Público
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 outline-none transition-all placeholder:text-slate-500 text-base font-medium text-slate-900 dark:text-white"
                        placeholder="hola@empresa.com"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                      Nueva Contraseña (mínimo 6 caracteres)
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 outline-none transition-all placeholder:text-slate-500 text-base font-medium text-slate-900 dark:text-white"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                )}

                {mode !== 'recovery' && mode !== 'update_password' && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                        Contraseña
                      </label>
                      {mode === 'login' && (
                        <button type="button" onClick={() => { setMode('recovery'); setError(null); setSuccess(null); }} className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 transition-colors">
                          ¿Olvidaste tu clave?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 outline-none transition-all placeholder:text-slate-500 text-base font-medium text-slate-900 dark:text-white"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                )}

                {mode === 'register' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                        CUIT (Validación ARCA)
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          required={mode === 'register'}
                          value={cuit}
                          onChange={(e) => setCuit(e.target.value.replace(/\D/g, ''))}
                          maxLength={11}
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none transition-all placeholder:text-slate-500 text-base font-medium text-slate-900 dark:text-white"
                          placeholder="Sin guiones ni espacios"
                        />
                      </div>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest mt-2 flex items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                        Verificación Automática ARCA
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                        Sector Principal
                      </label>
                      <div className="relative">
                        <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <select
                          required={mode === 'register'}
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 outline-none transition-all text-base font-medium text-slate-900 dark:text-white appearance-none"
                        >
                          <option value="" disabled>Selecciona tu rubro</option>
                          {MAIN_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 mt-2 bg-gradient-to-r from-orange-500 to-purple-600 text-white text-[11px] uppercase tracking-widest font-bold rounded-xl hover:opacity-90 transition duration-300 flex items-center justify-center shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <span>
                      {mode === 'login'
                        ? 'Ingresar con contraseña'
                        : mode === 'register'
                        ? 'Completar Registro'
                        : mode === 'update_password'
                        ? 'Guardar Nueva Contraseña'
                        : 'Enviar instrucciones'}
                    </span>
                  )}
                </button>
                
                {mode === 'login' && (
                  <>
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-white/10"></div></div>
                      <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
                        <span className="bg-white dark:bg-[#1A1625] px-4 text-slate-400">O innovación biométrica</span>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={handleMagicLink}
                      disabled={loading}
                      className="w-full py-4 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 text-[11px] uppercase tracking-widest font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition duration-300 flex items-center justify-center gap-2"
                    >
                      <Zap className="w-4 h-4 text-orange-500" />
                      Enviar Magic Link (Sin clave)
                    </button>
                  </>
                )}
              </form>

              <div className="mt-6 text-center text-sm font-medium">
                {mode === 'login' ? (
                  <>
                    <span className="text-slate-500">¿No tienes cuenta? </span>
                    <button onClick={() => { setMode('register'); setError(null); setSuccess(null); }} className="text-purple-600 dark:text-purple-400 hover:text-purple-700 transition-colors">
                      Regístrate aquí
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-slate-500">¿Ya tienes cuenta? </span>
                    <button onClick={() => { setMode('login'); setError(null); setSuccess(null); }} className="text-purple-600 dark:text-purple-400 hover:text-purple-700 transition-colors">
                      Ingresa aquí
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(modalContent, document.body);
}
