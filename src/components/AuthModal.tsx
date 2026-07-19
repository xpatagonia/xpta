import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';
import { X, Mail, Lock, Loader2, Building2, Briefcase, Zap, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { MAIN_CATEGORIES } from '../lib/categories';
import { getApiUrl } from '../lib/apiConfig';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register' | 'recovery'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    if (!isOpen) {
      setEmail('');
      setPassword('');
      setCuit('');
      setCategory('');
      setError(null);
      setSuccess(null);
      setMode('login');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === 'recovery') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/dashboard',
        });
        if (error) throw error;
        setSuccess('Te hemos enviado un enlace para recuperar tu contraseña.');
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
      setError(err.message || 'Ha ocurrido un error inesperado');
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
      setError(err.message || 'Error al enviar el enlace mágico.');
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
                  {mode === 'login' ? 'Ingresar a x.patagonia' : mode === 'register' ? 'Crear cuenta' : 'Recuperar acceso'}
                </h2>
                <p className="text-sm font-medium text-slate-500">
                  {mode === 'login'
                    ? 'Accede a la red de proveedores más grande de la Patagonia'
                    : mode === 'register' ? 'Únete para conectar con empresas B2B' : 'Te enviaremos un enlace seguro a tu email'}
                </p>
              </div>

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

                {mode !== 'recovery' && (
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
                    <span>{mode === 'login' ? 'Ingresar con contraseña' : mode === 'register' ? 'Completar Registro' : 'Enviar instrucciones'}</span>
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
