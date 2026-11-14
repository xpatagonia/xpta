import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Plus,
  Search,
  Sparkles,
  Database,
  Download,
  Edit3,
  Trash2,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  X,
} from 'lucide-react';
import { auth } from '../lib/db';
import { getApiUrl } from '../lib/apiConfig';

export interface CrmContact {
  id: number;
  name: string;
  company: string | null;
  role: string | null;
  email: string | null;
  phone: string | null;
  type: string | null;
  status: string | null;
  website: string | null;
  cuit_rut: string | null;
  industry: string | null;
  location: string | null;
  arn_opportunity_id: number | null;
  ai_score: number | null;
  lead_stage: string | null;
  opp_stage?: string | null;
  opp_ai_score?: number | null;
  opp_amount_usd?: number | null;
  odoo_synced?: boolean;
  last_arn_sync_at?: string | null;
}

interface Props {
  onArnActivated?: () => void;
  onComposeEmail?: (email: string, company: string) => void;
}

export default function CrmContactsPanel({ onArnActivated, onComposeEmail }: Props) {
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [notice, setNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    company: '',
    role: 'Compras / Abastecimiento',
    email: '',
    phone: '',
    cuitRut: '',
    type: 'Cliente',
    industry: 'Servicios Industriales',
    location: 'Neuquén / Vaca Muerta',
    autoActivateArn: true,
    arnNote: '',
  });

  const notify = (type: 'ok' | 'err', text: string) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 5000);
  };

  const loadContacts = useCallback(async () => {
    setLoading(true);
    try {
      const token = await auth.getToken();
      if (!token) {
        setContacts([]);
        return;
      }
      const res = await fetch(`${getApiUrl()}/api/crm/contacts`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.contacts)) {
        setContacts(data.contacts);
      }
    } catch {
      notify('err', 'No se pudo cargar la agenda de contactos CRM.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const openCreateModal = () => {
    setEditingId(null);
    setForm({
      name: '',
      company: '',
      role: 'Compras / Abastecimiento',
      email: '',
      phone: '',
      cuitRut: '',
      type: 'Cliente',
      industry: 'Servicios Industriales',
      location: 'Neuquén / Vaca Muerta',
      autoActivateArn: true,
      arnNote: '',
    });
    setShowModal(true);
  };

  const openEditModal = (c: CrmContact) => {
    setEditingId(c.id);
    setForm({
      name: c.name || '',
      company: c.company || '',
      role: c.role || '',
      email: c.email || '',
      phone: c.phone || '',
      cuitRut: c.cuit_rut || '',
      type: c.type || 'Cliente',
      industry: c.industry || 'Servicios Industriales',
      location: c.location || 'Patagonia',
      autoActivateArn: false,
      arnNote: '',
    });
    setShowModal(true);
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() && !form.company.trim()) return;
    setSaving(true);
    try {
      const token = await auth.getToken();
      const url = editingId
        ? `${getApiUrl()}/api/crm/contacts/${editingId}`
        : `${getApiUrl()}/api/crm/contacts`;
      const res = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Error guardando contacto');
      setShowModal(false);
      await loadContacts();
      if (form.autoActivateArn && !editingId) {
        notify('ok', 'Contacto guardado en CRM y activado en el pipeline de ARN IA.');
        onArnActivated?.();
      } else {
        notify('ok', editingId ? 'Contacto CRM actualizado.' : 'Contacto agregado a la agenda CRM.');
      }
    } catch (err: any) {
      notify('err', err?.message || 'No se pudo guardar el contacto.');
    } finally {
      setSaving(false);
    }
  };

  const handleActivateArn = async (contact: CrmContact) => {
    setBusyId(contact.id);
    try {
      const token = await auth.getToken();
      const res = await fetch(`${getApiUrl()}/api/crm/contacts/${contact.id}/activate-arn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'No se pudo activar en ARN IA');
      await loadContacts();
      onArnActivated?.();
      notify(
        'ok',
        data.decision?.shouldAutoExecute
          ? `${contact.company || contact.name} calificado (${data.analysis?.aiScore}%) y ejecutado por regla ARN.`
          : `${contact.company || contact.name} vinculado a ARN IA (${data.analysis?.aiScore}%) con borrador listo en Cola Híbrida.`
      );
    } catch (err: any) {
      notify('err', err?.message || 'Error activando contacto en ARN IA.');
    } finally {
      setBusyId(null);
    }
  };

  const handleSyncOdoo = async (contact: CrmContact) => {
    setBusyId(contact.id);
    try {
      const token = await auth.getToken();
      const syncRes = await fetch(`${getApiUrl()}/api/crm/sync-odoo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          contactId: contact.id,
          companyName: contact.company || contact.name,
          contactName: contact.name,
          email: contact.email,
          cuit: contact.cuit_rut,
          industry: contact.industry,
        }),
      });
      const syncData = await syncRes.json();
      if (!syncRes.ok) throw new Error(syncData?.error || 'Fallo al sincronizar Odoo');

      await fetch(`${getApiUrl()}/api/crm/contacts/${contact.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ odooSynced: true }),
      });
      await loadContacts();
      notify('ok', `${contact.company || contact.name}: ${syncData.target || 'Sincronizado con Odoo'}.`);
    } catch (err: any) {
      notify('err', err?.message || 'Error sincronizando con Odoo.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: number) => {
    setBusyId(id);
    try {
      const token = await auth.getToken();
      const res = await fetch(`${getApiUrl()}/api/crm/contacts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('No se pudo eliminar');
      setConfirmDeleteId(null);
      await loadContacts();
      notify('ok', 'Contacto eliminado de la agenda CRM.');
    } catch (err: any) {
      notify('err', err?.message || 'Error eliminando contacto.');
    } finally {
      setBusyId(null);
    }
  };

  const handleExportCsv = () => {
    const header = 'ID,Nombre,Empresa,Cargo,Email,Telefono,CUIT,Tipo,Rubro,Ubicacion,EtapaARN,ScoreIA\n';
    const rows = filteredContacts
      .map((c) =>
        [
          c.id,
          c.name || '',
          c.company || '',
          c.role || '',
          c.email || '',
          c.phone || '',
          c.cuit_rut || '',
          c.type || '',
          c.industry || '',
          c.location || '',
          c.opp_stage || c.lead_stage || '',
          c.opp_ai_score ?? c.ai_score ?? 0,
        ]
          .map((val) => `"${String(val).replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contactos-crm-xpatagonia-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredContacts = contacts.filter((c) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      (c.name || '').toLowerCase().includes(q) ||
      (c.company || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.cuit_rut || '').toLowerCase().includes(q) ||
      (c.industry || '').toLowerCase().includes(q);
    const matchesType =
      typeFilter === 'all' || (c.type || '').toLowerCase().includes(typeFilter.toLowerCase());
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-5">
      {notice && (
        <div
          className={`px-4 py-3 rounded-xl border text-xs font-semibold ${
            notice.type === 'ok'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300'
          }`}
        >
          {notice.text}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-[#1A1625] border border-slate-200 dark:border-white/10 rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar contacto, empresa, CUIT o email..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
            />
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-black/30">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'Cliente', label: 'Clientes' },
              { id: 'Prospecto', label: 'Prospectos ARN' },
              { id: 'Proveedor', label: 'Proveedores' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setTypeFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  typeFilter === f.id
                    ? 'bg-white dark:bg-[#1A1625] text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportCsv}
            disabled={filteredContacts.length === 0}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-1.5 whitespace-nowrap disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar CSV
          </button>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Nuevo Contacto
          </button>
        </div>
      </div>

      {/* Contacts Table */}
      <div className="bg-white dark:bg-[#1A1625] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-xs text-slate-500">Cargando agenda de contactos CRM...</div>
        ) : filteredContacts.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <Users className="w-9 h-9 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Sin contactos registrados en esta vista
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Agregá contactos manualmente o importalos desde el Directorio B2B. Cada contacto nuevo o RFQ detectado por ARN IA se sincroniza automáticamente aquí.
            </p>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Crear Primer Contacto
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3.5">Contacto &amp; Empresa</th>
                  <th className="px-5 py-3.5">Canales Directos</th>
                  <th className="px-5 py-3.5">Estado ARN IA</th>
                  <th className="px-5 py-3.5 text-right">Acciones ARN / CRM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
                {filteredContacts.map((c) => {
                  const score = c.opp_ai_score ?? c.ai_score ?? 0;
                  const stage = c.opp_stage || c.lead_stage || 'nuevo';
                  const hasArn = Boolean(c.arn_opportunity_id);
                  const isBusy = busyId === c.id;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-4 align-top">
                        <div className="font-bold text-sm text-slate-900 dark:text-white">{c.name}</div>
                        <div className="text-slate-600 dark:text-slate-300 font-medium mt-0.5">
                          {c.company || 'Sin empresa'} {c.role ? `· ${c.role}` : ''}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-1.5">
                          <span>{c.type || 'Cliente'}</span>
                          {c.industry && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>{c.industry}</span>
                            </>
                          )}
                          {c.cuit_rut && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono tabular-nums">CUIT {c.cuit_rut}</span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 align-top space-y-1 text-slate-600 dark:text-slate-300">
                        {c.email && (
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{c.email}</span>
                          </div>
                        )}
                        {c.phone && (
                          <div className="flex items-center gap-1.5 font-mono tabular-nums">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{c.phone}</span>
                          </div>
                        )}
                        {c.location && (
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{c.location}</span>
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4 align-top">
                        {hasArn ? (
                          <div className="space-y-1">
                            <div className="font-semibold text-purple-600 dark:text-purple-400 capitalize">
                              Etapa: {stage} · <span className="font-mono tabular-nums">{score}% IA</span>
                            </div>
                            {c.opp_amount_usd ? (
                              <div className="font-mono tabular-nums text-slate-500">
                                Est. USD {Number(c.opp_amount_usd).toLocaleString()}
                              </div>
                            ) : null}
                            {c.odoo_synced && (
                              <div className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                                <CheckCircle2 className="w-3 h-3" /> Odoo Sync
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-slate-500">
                            Sin oportunidad ARN vinculada
                            {c.odoo_synced && (
                              <div className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold ml-2">
                                · Odoo Sync
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4 align-top text-right">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <button
                            onClick={() => handleActivateArn(c)}
                            disabled={isBusy}
                            className="px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold flex items-center gap-1 whitespace-nowrap disabled:opacity-50"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            {hasArn ? 'Re-analizar ARN' : 'Activar en ARN IA'}
                          </button>

                          {c.email && onComposeEmail && (
                            <button
                              onClick={() => onComposeEmail(c.email!, c.company || c.name)}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-1 whitespace-nowrap"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              Email
                            </button>
                          )}

                          <button
                            onClick={() => handleSyncOdoo(c)}
                            disabled={isBusy}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-1 whitespace-nowrap disabled:opacity-50"
                          >
                            <Database className="w-3.5 h-3.5" />
                            Odoo
                          </button>

                          <button
                            onClick={() => openEditModal(c)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                            title="Editar contacto"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {confirmDeleteId === c.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(c.id)}
                                disabled={isBusy}
                                className="px-2 py-1 rounded-lg bg-red-600 text-white font-bold"
                              >
                                Confirmar
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2 py-1 rounded-lg border border-slate-200 dark:border-white/10 text-slate-500"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(c.id)}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-red-500 hover:bg-red-500/10"
                              title="Eliminar contacto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-xl bg-white dark:bg-[#1A1625] border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingId ? 'Editar Contacto CRM' : 'Nuevo Contacto CRM + ARN IA'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveContact} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Nombre y Apellido
                  </label>
                  <input
                    required
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ej. Ing. Laura Méndez"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Empresa
                  </label>
                  <input
                    required
                    type="text"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    placeholder="Ej. Servicios Australes S.A."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-sm text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Email Corporativo
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="compras@empresa.com.ar"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+54 9 299 ..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-sm text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    CUIT / RUT
                  </label>
                  <input
                    type="text"
                    value={form.cuitRut}
                    onChange={(e) => setForm({ ...form, cuitRut: e.target.value })}
                    placeholder="30-71123456-6"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-sm font-mono text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Tipo de Vínculo
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-sm text-slate-900 dark:text-white"
                  >
                    <option value="Cliente">Cliente / Comprador</option>
                    <option value="Prospecto ARN">Prospecto ARN</option>
                    <option value="Proveedor">Proveedor</option>
                    <option value="Transportista">Transportista</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Ubicación / Corredor
                  </label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-sm text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Cargo
                  </label>
                  <input
                    type="text"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Rubro / Industria
                  </label>
                  <input
                    type="text"
                    value={form.industry}
                    onChange={(e) => setForm({ ...form, industry: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-sm text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {!editingId && (
                <div className="p-3.5 rounded-xl border border-purple-500/20 bg-purple-500/5 space-y-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.autoActivateArn}
                      onChange={(e) => setForm({ ...form, autoActivateArn: e.target.checked })}
                      className="rounded accent-purple-600"
                    />
                    Calificar y redactar propuesta inicial automáticamente con ARN IA
                  </label>
                  {form.autoActivateArn && (
                    <input
                      type="text"
                      value={form.arnNote}
                      onChange={(e) => setForm({ ...form, arnNote: e.target.value })}
                      placeholder="Nota comercial opcional para ARN IA (ej. Requiere válvulas API 6D en Añelo)..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#110E17] text-xs text-slate-900 dark:text-white"
                    />
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : editingId ? 'Guardar Cambios' : 'Guardar en CRM'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
