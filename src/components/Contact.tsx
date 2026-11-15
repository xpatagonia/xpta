import { motion } from 'motion/react';
import React, { useState } from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { getApiUrl } from '../lib/apiConfig';
import ConfigurableSection, {
  getSectionCardClass,
  getSectionHeadingSizeClass,
} from './ConfigurableSection';
import { HomeSectionDesignConfig } from '../lib/siteSettings';

export default function Contact({ config }: { config?: HomeSectionDesignConfig }) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('Logística y Supply Chain');
  const [budget, setBudget] = useState('Consultar precio');
  const [details, setDetails] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');

    try {
      const res = await fetch(`${getApiUrl()}/api/public/rfq-lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company, email, category, budget, details }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'No se pudo enviar la solicitud');
      }
      setStatus('success');
      setCompany('');
      setEmail('');
      setDetails('');
      setTimeout(() => setStatus('idle'), 4500);
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err?.message || 'Error al registrar la solicitud en producción');
      setTimeout(() => setStatus('idle'), 4500);
    }
  };

  const accentColor = config?.accentColor || '#f97316';
  const hasDarkMedia =
    config?.backgroundType === 'image' ||
    config?.backgroundType === 'video' ||
    config?.backgroundType === 'gradient';
  const cardSurfaceClass = getSectionCardClass(config?.cardStyle, hasDarkMedia);
  const headingSizeClass = getSectionHeadingSizeClass(
    config?.headingScale,
    'text-3xl md:text-5xl'
  );
  const isSplit = config?.columnStyle === 'split-left' || config?.columnStyle === 'split-right';

  return (
    <ConfigurableSection
      id="rfq"
      config={config}
      defaultClassName="bg-slate-50 dark:bg-[#0C0A11] text-slate-900 dark:text-white border-t border-slate-100 dark:border-white/5"
    >
      <div className={isSplit ? 'grid grid-cols-1 lg:grid-cols-12 gap-10 items-start' : 'max-w-4xl mx-auto'}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={
            isSplit
              ? `lg:col-span-5 ${config?.columnStyle === 'split-right' ? 'lg:order-2' : ''}`
              : 'text-center mb-10'
          }
        >
          <p className="text-xs font-bold tracking-wide mb-2.5" style={{ color: accentColor }}>
            {config?.eyebrowOverride || 'Genera múltiples presupuestos'}
          </p>
          <h2 className={`${headingSizeClass} font-display font-bold mb-4 tracking-tight text-balance`}>
            {config?.titleOverride || 'Solicitar Cotización (RFQ)'}
          </h2>
          <p className="opacity-80 text-base sm:text-lg leading-relaxed">
            {config?.subtitleOverride ||
              'Completa los requerimientos de tu empresa y el Hub conectará tu solicitud con proveedores verificados según tus necesidades.'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.08 }}
          className={`rounded-3xl p-6 sm:p-10 relative overflow-hidden ${cardSurfaceClass} ${
            isSplit
              ? `lg:col-span-7 ${config?.columnStyle === 'split-right' ? 'lg:order-1' : ''}`
              : ''
          }`}
        >
          <form className="space-y-6 relative z-10" onSubmit={handleSubmit}>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold opacity-75 mb-2">
                  Nombre de Empresa
                </label>
                <input
                  required
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full px-4 py-3.5 bg-white dark:bg-[#110E17] border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500/40 outline-none transition-colors text-sm font-medium text-slate-900 dark:text-white"
                  placeholder="Ej: Ingeniería Austral S.A."
                />
              </div>
              <div>
                <label className="block text-xs font-bold opacity-75 mb-2">
                  Email Corporativo
                </label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 bg-white dark:bg-[#110E17] border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500/40 outline-none transition-colors text-sm font-medium text-slate-900 dark:text-white"
                  placeholder="compras@empresa.com"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold opacity-75 mb-2">
                  Categoría Principal
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3.5 bg-white dark:bg-[#110E17] border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500/40 outline-none transition-colors text-sm font-medium text-slate-900 dark:text-white"
                >
                  <option value="Logística y Supply Chain">Logística y Supply Chain</option>
                  <option value="Ingeniería e Industrial">Ingeniería e Industrial</option>
                  <option value="AgroTech e Insumos">AgroTech e Insumos</option>
                  <option value="Sistemas e Infraestructura IT">Sistemas e Infraestructura IT</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold opacity-75 mb-2">
                  Presupuesto Estimado (USD)
                </label>
                <select
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full px-4 py-3.5 bg-white dark:bg-[#110E17] border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500/40 outline-none transition-colors text-sm font-medium text-slate-900 dark:text-white"
                >
                  <option value="Consultar precio">- Consultar precio -</option>
                  <option value="Menos de $1,000">Menos de $1,000</option>
                  <option value="$1,000 - $10,000">$1,000 - $10,000</option>
                  <option value="Más de $10,000">Más de $10,000</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold opacity-75 mb-2">
                Detalles del Requerimiento / Volumen de Compra
              </label>
              <textarea
                required
                rows={4}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full px-4 py-3.5 bg-white dark:bg-[#110E17] border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500/40 outline-none transition-colors text-sm font-medium resize-none text-slate-900 dark:text-white"
                placeholder="Especificar cantidades, fechas de entrega, estándares técnicos requeridos..."
              />
            </div>

            {status === 'error' && errorMsg && (
              <p className="text-xs font-semibold text-rose-500 text-center">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={status === 'submitting' || status === 'success'}
              className="w-full text-white text-xs font-bold tracking-wide py-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-70 flex justify-center items-center"
              style={{ backgroundColor: accentColor }}
            >
              {status === 'submitting' ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : status === 'success' ? (
                <span>Solicitud Registrada y Notificada</span>
              ) : (
                <span className="flex items-center gap-2">
                  Generar Oportunidad B2B <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-xs font-medium opacity-70 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Conectado a CRM y proveedores verificados en producción</span>
            </div>
          </form>
        </motion.div>
      </div>
    </ConfigurableSection>
  );
}
