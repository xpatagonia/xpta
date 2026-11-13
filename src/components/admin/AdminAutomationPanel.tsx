import { useState, useEffect } from 'react';
import { Activity, RefreshCw, Send, ArrowDownLeft, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { auth } from '../../lib/db';
import { getApiUrl } from '../../lib/apiConfig';

export default function AdminAutomationPanel() {
  const [logs, setLogs] = useState<any[]>([]);
  const [n8nConfigured, setN8nConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken?.();
      const res = await fetch(`${getApiUrl()}/api/admin/automation-logs`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(Array.isArray(data.logs) ? data.logs : []);
        setN8nConfigured(Boolean(data.n8nConfigured));
      }
    } catch {
      // ignore unreachable preview backend
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleSimulateOdooInbound = async () => {
    setTestStatus(null);
    try {
      const res = await fetch(`${getApiUrl()}/api/webhooks/odoo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'odoo.invoice.paid',
          invoiceRef: `FAC-A-${Date.now().toString().slice(-4)}`,
          membership: 'Premium',
        }),
      });
      if (res.ok) {
        setTestStatus('Evento entrante Odoo procesado y registrado en la bitácora.');
        await loadLogs();
      }
    } catch {
      setTestStatus('No se pudo contactar al backend de automatización.');
    }
  };

  return (
    <div className="bg-white dark:bg-[#1A1625] rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-500" />
            Automatización Bidireccional Odoo ↔ n8n
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Endpoint entrante listo en <code className="font-mono text-purple-500">POST /api/webhooks/odoo</code> · Estado n8n saliente:{' '}
            <strong className={n8nConfigured ? 'text-emerald-500' : 'text-amber-500'}>
              {n8nConfigured ? 'N8N_WEBHOOK_URL Activo' : 'Cola Local (sin N8N_WEBHOOK_URL)'}
            </strong>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSimulateOdooInbound}
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            Probar Webhook Odoo
          </button>
          <button
            type="button"
            onClick={loadLogs}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refrescar
          </button>
        </div>
      </div>

      {testStatus && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {testStatus}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-[#110E17] text-slate-500 border-b border-slate-200 dark:border-white/10">
            <tr>
              <th className="px-4 py-3 font-bold uppercase">Dirección</th>
              <th className="px-4 py-3 font-bold uppercase">Evento</th>
              <th className="px-4 py-3 font-bold uppercase">Estado</th>
              <th className="px-4 py-3 font-bold uppercase text-right">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, i) => (
              <tr key={log.id || i} className="border-b border-slate-100 dark:border-white/5 last:border-0">
                <td className="px-4 py-3 font-mono">
                  {log.direction === 'inbound_odoo' ? (
                    <span className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400 font-bold">
                      <ArrowDownLeft className="w-3.5 h-3.5" /> Odoo → Hub
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-orange-600 dark:text-orange-400 font-bold">
                      <ArrowUpRight className="w-3.5 h-3.5" /> Hub → n8n
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                  {log.event}
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] uppercase">
                    {log.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono text-slate-500">
                  {log.createdAt ? new Date(log.createdAt).toLocaleString('es-AR') : '-'}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                  Aún no hay eventos registrados en esta sesión. Probá disparar una sincronización CRM/Logística o simular un webhook.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
