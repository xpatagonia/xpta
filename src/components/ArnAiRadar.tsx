import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  Sliders,
  Send,
  XCircle,
  RefreshCw,
  Bot,
  TrendingUp,
  AlertTriangle,
  Mail,
  Truck,
  PackageCheck,
  Inbox,
  ShieldCheck,
  Zap,
  Plus,
} from 'lucide-react';
import { auth } from '../lib/db';
import { getApiUrl } from '../lib/apiConfig';

interface ArnRules {
  mode: 'hybrid' | 'manual' | 'auto';
  autoApproveMaxUsd: number;
  minConfidenceScore: number;
  autoSendEmails: boolean;
  autoCreateLogistics: boolean;
  autoReserveInventory: boolean;
}

interface ArnOpportunity {
  id: number;
  company_name: string;
  contact_name: string;
  contact_email: string | null;
  cuit: string | null;
  category: string;
  corridor: string | null;
  source: string;
  stage: string;
  ai_score: number;
  estimated_amount_usd: number;
  urgency: string;
  summary: string;
  recommended_action: string;
  updated_at: string;
}

interface ArnActionItem {
  id: number;
  opportunity_id: number | null;
  action_type: string;
  title: string;
  target_email: string | null;
  draft_subject: string | null;
  draft_body: string | null;
  estimated_amount_usd: number;
  confidence_score: number;
  execution_mode: 'manual_approval' | 'auto_approved';
  status: 'pending_approval' | 'approved' | 'executed' | 'dismissed' | 'failed';
  metadata?: { reason?: string; executionNote?: string; error?: string };
  created_at: string;
  executed_at: string | null;
}

const DEFAULT_RULES: ArnRules = {
  mode: 'hybrid',
  autoApproveMaxUsd: 1500,
  minConfidenceScore: 82,
  autoSendEmails: false,
  autoCreateLogistics: true,
  autoReserveInventory: true,
};

const STAGE_LABELS: Record<string, string> = {
  detected: 'Detectada',
  qualified: 'Calificada IA',
  quoted: 'Cotizada',
  negotiating: 'En Negociación',
  awarded: 'Adjudicada',
  archived: 'Archivada',
};

export default function ArnAiRadar() {
  const [subTab, setSubTab] = useState<'queue' | 'pipeline' | 'rules' | 'copilot'>('queue');
  const [rules, setRules] = useState<ArnRules>(DEFAULT_RULES);
  const [opportunities, setOpportunities] = useState<ArnOpportunity[]>([]);
  const [actions, setActions] = useState<ArnActionItem[]>([]);
  const [metrics, setMetrics] = useState({
    totalOpportunities: 0,
    pendingApprovals: 0,
    autoExecuted: 0,
    pipelineUsd: 0,
  });

  const [loading, setLoading] = useState(true);
  const [busyActionId, setBusyActionId] = useState<number | null>(null);
  const [triagingInbox, setTriagingInbox] = useState(false);
  const [savingRules, setSavingRules] = useState(false);
  const [banner, setBanner] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Editable draft overrides per action id
  const [draftEdits, setDraftEdits] = useState<Record<number, { subject: string; body: string }>>({});

  // Quick ingest form
  const [showIngest, setShowIngest] = useState(false);
  const [ingestForm, setIngestForm] = useState({
    companyName: '',
    contactEmail: '',
    category: 'Hidrocarburos (Oil & Gas)',
    rawText: '',
  });
  const [ingesting, setIngesting] = useState(false);

  // Copilot Q&A
  const [copilotQuestion, setCopilotQuestion] = useState('');
  const [copilotThread, setCopilotThread] = useState<Array<{ role: 'user' | 'arn'; text: string }>>([
    {
      role: 'arn',
      text: 'Soy ARN IA (Autonomous Relationship & Network AI). Analizo tus RFQ, correos IMAP, stock e inventario para proponer cotizaciones, despachos y respuestas híbridas. ¿Qué revisamos hoy?',
    },
  ]);
  const [askingCopilot, setAskingCopilot] = useState(false);

  const notify = (type: 'ok' | 'err', text: string) => {
    setBanner({ type, text });
    setTimeout(() => setBanner(null), 5500);
  };

  const loadOverview = useCallback(async () => {
    setLoading(true);
    try {
      const token = await auth.getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      const res = await fetch(`${getApiUrl()}/api/arn/overview`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Error cargando motor ARN IA');

      setRules(data.rules || DEFAULT_RULES);
      setOpportunities(Array.isArray(data.opportunities) ? data.opportunities : []);
      setActions(Array.isArray(data.actions) ? data.actions : []);
      setMetrics(
        data.metrics || {
          totalOpportunities: 0,
          pendingApprovals: 0,
          autoExecuted: 0,
          pipelineUsd: 0,
        }
      );
    } catch (err: any) {
      notify('err', err?.message || 'No se pudo conectar con ARN IA.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const handleSaveRules = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingRules(true);
    try {
      const token = await auth.getToken();
      const res = await fetch(`${getApiUrl()}/api/arn/rules`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(rules),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'No se pudieron guardar las reglas');
      setRules(data.rules || rules);
      notify('ok', 'Política híbrida de ARN IA guardada en producción.');
    } catch (err: any) {
      notify('err', err?.message || 'Error guardando reglas');
    } finally {
      setSavingRules(false);
    }
  };

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingestForm.rawText.trim()) return;
    setIngesting(true);
    try {
      const token = await auth.getToken();
      const res = await fetch(`${getApiUrl()}/api/arn/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          source: 'manual_radar',
          companyName: ingestForm.companyName || undefined,
          contactEmail: ingestForm.contactEmail || undefined,
          category: ingestForm.category,
          rawText: ingestForm.rawText,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Error analizando requerimiento');
      setIngestForm({ companyName: '', contactEmail: '', category: ingestForm.category, rawText: '' });
      setShowIngest(false);
      notify(
        'ok',
        data.decision?.shouldAutoExecute
          ? `ARN IA auto-ejecutó la acción (${data.decision.reason}).`
          : `Oportunidad detectada y enviada a Cola Híbrida para tu aprobación (${data.decision?.reason || 'revisión humana'}).`
      );
      await loadOverview();
    } catch (err: any) {
      notify('err', err?.message || 'Error ejecutando ingesta ARN IA');
    } finally {
      setIngesting(false);
    }
  };

  const handleTriageInbox = async () => {
    setTriagingInbox(true);
    try {
      const token = await auth.getToken();
      const res = await fetch(`${getApiUrl()}/api/arn/triage-inbox`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'No se pudo analizar la bandeja IMAP');
      notify(
        'ok',
        `Bandeja IMAP escaneada: ${data.analyzedCount || 0} correos analizados, ${data.opportunitiesCreated || 0} oportunidades registradas.`
      );
      await loadOverview();
    } catch (err: any) {
      notify('err', err?.message || 'Error analizando bandeja IMAP');
    } finally {
      setTriagingInbox(false);
    }
  };

  const handleApproveAction = async (action: ArnActionItem) => {
    setBusyActionId(action.id);
    try {
      const token = await auth.getToken();
      const edit = draftEdits[action.id];
      const res = await fetch(`${getApiUrl()}/api/arn/actions/${action.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          draftSubject: edit?.subject ?? action.draft_subject,
          draftBody: edit?.body ?? action.draft_body,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'No se pudo aprobar la acción');
      notify('ok', data.note || 'Acción aprobada y ejecutada correctamente.');
      await loadOverview();
    } catch (err: any) {
      notify('err', err?.message || 'Error ejecutando acción');
    } finally {
      setBusyActionId(null);
    }
  };

  const handleDismissAction = async (actionId: number) => {
    setBusyActionId(actionId);
    try {
      const token = await auth.getToken();
      const res = await fetch(`${getApiUrl()}/api/arn/actions/${actionId}/dismiss`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error descartando acción');
      notify('ok', 'Acción descartada de la cola.');
      await loadOverview();
    } catch (err: any) {
      notify('err', err?.message || 'Error al descartar');
    } finally {
      setBusyActionId(null);
    }
  };

  const handleStageChange = async (oppId: number, stage: string) => {
    try {
      const token = await auth.getToken();
      const res = await fetch(`${getApiUrl()}/api/arn/opportunities/${oppId}/stage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stage }),
      });
      if (!res.ok) throw new Error('Error cambiando etapa');
      setOpportunities((prev) => prev.map((o) => (o.id === oppId ? { ...o, stage } : o)));
    } catch (err: any) {
      notify('err', err?.message || 'No se pudo actualizar la etapa');
    }
  };

  const handleAskCopilot = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = copilotQuestion.trim();
    if (!q || askingCopilot) return;
    setCopilotThread((prev) => [...prev, { role: 'user', text: q }]);
    setCopilotQuestion('');
    setAskingCopilot(true);
    try {
      const token = await auth.getToken();
      const res = await fetch(`${getApiUrl()}/api/arn/copilot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Error consultando Copiloto ARN');
      setCopilotThread((prev) => [...prev, { role: 'arn', text: data.answer || 'Sin respuesta.' }]);
    } catch (err: any) {
      setCopilotThread((prev) => [
        ...prev,
        { role: 'arn', text: `No pude completar la consulta: ${err?.message || 'reintenta en unos segundos.'}` },
      ]);
    } finally {
      setAskingCopilot(false);
    }
  };

  const getActionIcon = (type: string) => {
    if (type.includes('email') || type === 'notify_providers') return <Mail className="w-4 h-4 text-purple-500" />;
    if (type.includes('logistics')) return <Truck className="w-4 h-4 text-orange-500" />;
    if (type.includes('inventory')) return <PackageCheck className="w-4 h-4 text-emerald-500" />;
    return <Sparkles className="w-4 h-4 text-purple-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Header Control Bar */}
      <div className="bg-white dark:bg-[#1A1625] border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[11px] font-bold uppercase tracking-wider border border-purple-500/20">
                <Sparkles className="w-3.5 h-3.5" /> Motor ARN IA Activo
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold uppercase tracking-wider border border-emerald-500/20">
                Modo: {rules.mode === 'hybrid' ? 'Híbrido (Aprobación + Reglas)' : rules.mode === 'auto' ? 'Autónomo Full' : 'Aprobación Manual'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900 dark:text-white">
              ARN IA · Autonomous Relationship &amp; Network AI
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Reemplaza la carga manual del CRM: detecta oportunidades desde RFQ e IMAP, califica margen y permite aprobar borradores en 1 clic o auto-ejecutar hasta USD {rules.autoApproveMaxUsd.toLocaleString('es-AR')}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleTriageInbox}
              disabled={triagingInbox}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-white text-xs font-bold flex items-center gap-2 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-purple-500 ${triagingInbox ? 'animate-spin' : ''}`} />
              {triagingInbox ? 'Escaneando IMAP...' : 'Escanear Bandeja IMAP'}
            </button>
            <button
              onClick={() => setShowIngest((v) => !v)}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-500/20 transition"
            >
              <Plus className="w-4 h-4" /> Analizar Lead / RFQ con IA
            </button>
          </div>
        </div>

        {/* Metrics Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200/70 dark:border-white/5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Pendientes Aprobación</span>
            <p className="text-2xl font-mono font-bold text-orange-500 mt-0.5">{metrics.pendingApprovals}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200/70 dark:border-white/5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Auto-Ejecutadas IA</span>
            <p className="text-2xl font-mono font-bold text-emerald-500 mt-0.5">{metrics.autoExecuted}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200/70 dark:border-white/5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Oportunidades Activas</span>
            <p className="text-2xl font-mono font-bold text-slate-900 dark:text-white mt-0.5">{metrics.totalOpportunities}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200/70 dark:border-white/5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Pipeline Estimado</span>
            <p className="text-2xl font-mono font-bold text-purple-600 dark:text-purple-400 mt-0.5">
              USD {metrics.pipelineUsd.toLocaleString('es-AR')}
            </p>
          </div>
        </div>

        {/* Navigation Subtabs */}
        <div className="flex flex-wrap gap-2 bg-slate-100 dark:bg-black/20 p-1.5 rounded-xl w-full sm:w-fit">
          {[
            { id: 'queue', label: `Cola Híbrida (${metrics.pendingApprovals})`, icon: Clock },
            { id: 'pipeline', label: `Oportunidades (${opportunities.length})`, icon: TrendingUp },
            { id: 'rules', label: 'Reglas de Autonomía', icon: Sliders },
            { id: 'copilot', label: 'Copiloto ARN IA', icon: Bot },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = subTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                  active
                    ? 'bg-white dark:bg-[#1A1625] text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Inline Feedback Banner */}
      <AnimatePresence>
        {banner && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`px-4 py-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
              banner.type === 'ok'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300'
            }`}
          >
            {banner.type === 'ok' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
            <span>{banner.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Ingest Panel */}
      <AnimatePresence>
        {showIngest && (
          <motion.form
            onSubmit={handleIngest}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-[#1A1625] border border-purple-500/30 rounded-2xl p-6 space-y-4 overflow-hidden shadow-sm"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Ingesta Inteligente ARN IA (Pega un correo, WhatsApp o requerimiento B2B)
              </h3>
              <button type="button" onClick={() => setShowIngest(false)} className="text-xs font-bold text-slate-400 hover:text-white">
                Cerrar
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Empresa cliente / solicitante (opcional)"
                value={ingestForm.companyName}
                onChange={(e) => setIngestForm((p) => ({ ...p, companyName: e.target.value }))}
                className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white"
              />
              <input
                type="email"
                placeholder="Email contacto (ej. compras@empresa.com)"
                value={ingestForm.contactEmail}
                onChange={(e) => setIngestForm((p) => ({ ...p, contactEmail: e.target.value }))}
                className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white"
              />
              <select
                value={ingestForm.category}
                onChange={(e) => setIngestForm((p) => ({ ...p, category: e.target.value }))}
                className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white"
              >
                <option>Hidrocarburos (Oil & Gas)</option>
                <option>Logística y Transporte</option>
                <option>Metalúrgica &amp; Mecanizado</option>
                <option>Equipamiento Industrial</option>
                <option>Seguridad e Higiene (EPP)</option>
              </select>
            </div>
            <textarea
              required
              rows={3}
              placeholder="Ej: Necesitamos cotización urgente por 12 válvulas esféricas 4'' API 6D para entrega en Añelo la semana próxima. Presupuesto estimado USD 3.800."
              value={ingestForm.rawText}
              onChange={(e) => setIngestForm((p) => ({ ...p, rawText: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white resize-none"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={ingesting}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {ingesting ? 'Analizando con Gemini...' : 'Calificar y Evaluar Reglas Híbridas'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* SUBTAB 1: HYBRID QUEUE */}
      {subTab === 'queue' && (
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white dark:bg-[#1A1625] rounded-2xl p-10 text-center text-sm text-slate-500 border border-slate-200 dark:border-white/5">
              Cargando cola autónoma de ARN IA...
            </div>
          ) : actions.length === 0 ? (
            <div className="bg-white dark:bg-[#1A1625] rounded-2xl p-12 text-center border border-slate-200 dark:border-white/5 space-y-3">
              <Inbox className="w-10 h-10 text-purple-400 mx-auto opacity-70" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Cola ARN IA limpia</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Cada vez que publiques o recibas un RFQ, escanees la bandeja IMAP o envíes una empresa del directorio a ARN IA, aparecerá aquí con su borrador listo para aprobar o auto-ejecutado según tu umbral.
              </p>
            </div>
          ) : (
            actions.map((act) => {
              const edit = draftEdits[act.id] || {
                subject: act.draft_subject || '',
                body: act.draft_body || '',
              };
              const isPending = act.status === 'pending_approval';
              return (
                <div
                  key={act.id}
                  className={`bg-white dark:bg-[#1A1625] rounded-2xl p-5 border shadow-sm space-y-4 ${
                    isPending
                      ? 'border-orange-500/40'
                      : act.status === 'executed'
                      ? 'border-emerald-500/25'
                      : 'border-slate-200 dark:border-white/5 opacity-75'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                        {getActionIcon(act.action_type)}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          {isPending && (
                            <span className="px-2 py-0.5 rounded bg-orange-500/15 text-orange-600 dark:text-orange-400 text-[10px] font-bold uppercase tracking-wider">
                              Pendiente Aprobación Humana
                            </span>
                          )}
                          {act.status === 'executed' && act.execution_mode === 'auto_approved' && (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                              <Zap className="w-3 h-3" /> Auto-Ejecutada por Regla
                            </span>
                          )}
                          {act.status === 'executed' && act.execution_mode !== 'auto_approved' && (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                              Aprobada y Ejecutada
                            </span>
                          )}
                          {act.status === 'dismissed' && (
                            <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-white/10 text-slate-500 text-[10px] font-bold uppercase">
                              Descartada
                            </span>
                          )}
                          <span className="text-[11px] font-mono text-slate-500">
                            Score IA: {act.confidence_score}% · Monto Est.: USD {Number(act.estimated_amount_usd || 0).toLocaleString('es-AR')}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{act.title}</h4>
                        {act.target_email && (
                          <p className="text-xs text-slate-500">Destinatario: {act.target_email}</p>
                        )}
                      </div>
                    </div>

                    {isPending && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleDismissAction(act.id)}
                          disabled={busyActionId === act.id}
                          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-red-500/10 hover:text-red-500 text-xs font-bold flex items-center gap-1 transition"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Descartar
                        </button>
                        <button
                          onClick={() => handleApproveAction(act)}
                          disabled={busyActionId === act.id}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5" />
                          {busyActionId === act.id ? 'Ejecutando...' : 'Aprobar y Ejecutar'}
                        </button>
                      </div>
                    )}
                  </div>

                  {act.metadata?.reason && (
                    <p className="text-[11px] text-slate-500 bg-slate-50 dark:bg-[#110E17] px-3 py-2 rounded-lg border border-slate-200/70 dark:border-white/5">
                      <strong>Criterio Híbrido:</strong> {act.metadata.executionNote || act.metadata.reason}
                    </p>
                  )}

                  {(act.draft_subject || act.draft_body) && (
                    <div className="grid grid-cols-1 gap-2 pt-1">
                      <input
                        type="text"
                        disabled={!isPending}
                        value={edit.subject}
                        onChange={(e) =>
                          setDraftEdits((prev) => ({
                            ...prev,
                            [act.id]: { subject: e.target.value, body: edit.body },
                          }))
                        }
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white disabled:opacity-75"
                      />
                      <textarea
                        rows={3}
                        disabled={!isPending}
                        value={edit.body}
                        onChange={(e) =>
                          setDraftEdits((prev) => ({
                            ...prev,
                            [act.id]: { subject: edit.subject, body: e.target.value },
                          }))
                        }
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10 text-xs text-slate-700 dark:text-slate-300 resize-none disabled:opacity-75"
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* SUBTAB 2: OPPORTUNITIES PIPELINE */}
      {subTab === 'pipeline' && (
        <div className="bg-white dark:bg-[#1A1625] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
          {opportunities.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-500">
              Aún no hay oportunidades detectadas. Crea un RFQ o analiza un lead con el botón superior.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-[#110E17] text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3.5">Empresa &amp; Resumen IA</th>
                    <th className="px-5 py-3.5">Score IA</th>
                    <th className="px-5 py-3.5">Est. USD</th>
                    <th className="px-5 py-3.5">Corredor / Origen</th>
                    <th className="px-5 py-3.5 text-right">Etapa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {opportunities.map((opp) => (
                    <tr key={opp.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                      <td className="px-5 py-4 max-w-md">
                        <div className="font-bold text-slate-900 dark:text-white">{opp.company_name}</div>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{opp.summary}</p>
                        <p className="text-[11px] text-purple-600 dark:text-purple-400 font-medium mt-1">
                          Siguiente paso: {opp.recommended_action}
                        </p>
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {opp.ai_score}%
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-slate-900 dark:text-white">
                        USD {Number(opp.estimated_amount_usd || 0).toLocaleString('es-AR')}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500">
                        <div>{opp.corridor || 'Patagonia Sur'}</div>
                        <div className="font-mono text-[10px] uppercase text-slate-400 mt-0.5">{opp.source}</div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <select
                          value={opp.stage}
                          onChange={(e) => handleStageChange(opp.id, e.target.value)}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-black/30 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-white"
                        >
                          {Object.entries(STAGE_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>
                              {v}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 3: HYBRID RULES ENGINE */}
      {subTab === 'rules' && (
        <form
          onSubmit={handleSaveRules}
          className="bg-white dark:bg-[#1A1625] border border-slate-200 dark:border-white/10 rounded-2xl p-6 space-y-6 shadow-sm"
        >
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-500" /> Gobierno Híbrido: Control Humano + Automatización por Umbral
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Configura exactamente cuándo ARN IA actúa por su cuenta y cuándo solicita tu confirmación en 1 clic antes de disparar un correo, reserva de stock o carga logística.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                id: 'hybrid',
                title: 'Híbrido (Recomendado)',
                desc: 'Auto-ejecuta operaciones menores al tope USD y envía las demás a tu Cola de Aprobación.',
              },
              {
                id: 'manual',
                title: 'Aprobación Humana 100%',
                desc: 'La IA redacta borradores y califica oportunidades, pero nada se ejecuta sin tu clic.',
              },
              {
                id: 'auto',
                title: 'Autónomo Avanzado',
                desc: 'Ejecuta automáticamente todas las acciones cuya confianza IA supere tu mínimo configurado.',
              },
            ].map((m) => (
              <button
                type="button"
                key={m.id}
                onClick={() => setRules((r) => ({ ...r, mode: m.id as ArnRules['mode'] }))}
                className={`p-4 rounded-xl border text-left transition ${
                  rules.mode === m.id
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-slate-200 dark:border-white/10 hover:border-purple-500/40'
                }`}
              >
                <div className="font-bold text-sm text-slate-900 dark:text-white mb-1">{m.title}</div>
                <p className="text-xs text-slate-500">{m.desc}</p>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Tope Automático por Operación (USD): <span className="text-purple-500 font-mono">USD {rules.autoApproveMaxUsd}</span>
              </label>
              <input
                type="range"
                min={0}
                max={25000}
                step={250}
                value={rules.autoApproveMaxUsd}
                onChange={(e) => setRules((r) => ({ ...r, autoApproveMaxUsd: Number(e.target.value) }))}
                className="w-full accent-purple-600"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Cualquier operación por encima de este valor requerirá tu aprobación manual obligatoria en modo Híbrido.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Confianza IA Mínima para Auto-Ejecución: <span className="text-emerald-500 font-mono">{rules.minConfidenceScore}%</span>
              </label>
              <input
                type="range"
                min={55}
                max={98}
                step={1}
                value={rules.minConfidenceScore}
                onChange={(e) => setRules((r) => ({ ...r, minConfidenceScore: Number(e.target.value) }))}
                className="w-full accent-emerald-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Si el score de calificación de Gemini es menor a este porcentaje, pasa a revisión humana.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {[
              {
                key: 'autoSendEmails',
                label: 'Auto-enviar correos vía Resend',
                hint: 'Si está desactivado, todos los emails esperan tu clic aunque sean menores al tope USD.',
              },
              {
                key: 'autoCreateLogistics',
                label: 'Auto-generar carga logística al adjudicar',
                hint: 'Publica la carga automáticamente en Bolsa de Cargas al cerrar un RFQ.',
              },
              {
                key: 'autoReserveInventory',
                label: 'Auto-reservar stock en Warehousing',
                hint: 'Descuenta SKU comprometido cuando la regla lo autoriza.',
              },
            ].map((toggle) => (
              <label
                key={toggle.key}
                className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/5 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={Boolean((rules as any)[toggle.key])}
                  onChange={(e) => setRules((r) => ({ ...r, [toggle.key]: e.target.checked }))}
                  className="mt-1 w-4 h-4 accent-purple-600 rounded"
                />
                <div>
                  <span className="block text-xs font-bold text-slate-900 dark:text-white">{toggle.label}</span>
                  <span className="block text-[11px] text-slate-500 mt-0.5">{toggle.hint}</span>
                </div>
              </label>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingRules}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold uppercase tracking-wider transition disabled:opacity-50"
            >
              {savingRules ? 'Guardando Política...' : 'Guardar Política Híbrida ARN IA'}
            </button>
          </div>
        </form>
      )}

      {/* SUBTAB 4: COPILOT */}
      {subTab === 'copilot' && (
        <div className="bg-white dark:bg-[#1A1625] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm flex flex-col h-[500px]">
          <div className="p-4 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#110E17] flex items-center gap-2">
            <Bot className="w-5 h-5 text-purple-500" />
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              Copiloto ARN IA · Conectado a tu Pipeline, Stock y Política Híbrida
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {copilotThread.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-xl px-4 py-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-purple-600 text-white rounded-br-sm'
                      : 'bg-slate-100 dark:bg-[#110E17] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10 rounded-bl-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {askingCopilot && (
              <div className="text-xs text-slate-400 italic">ARN IA analizando datos en vivo...</div>
            )}
          </div>
          <form onSubmit={handleAskCopilot} className="p-4 border-t border-slate-200 dark:border-white/5 flex gap-2">
            <input
              type="text"
              value={copilotQuestion}
              onChange={(e) => setCopilotQuestion(e.target.value)}
              placeholder="Ej: ¿Qué acciones pendientes tengo hoy? ¿Cómo priorizar la cuenca neuquina?"
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white focus:outline-none"
            />
            <button
              type="submit"
              disabled={askingCopilot || !copilotQuestion.trim()}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" /> Consultar
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
