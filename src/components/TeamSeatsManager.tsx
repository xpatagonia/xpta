import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  CheckCircle2,
  Truck,
  Crown,
  Zap,
  AlertTriangle,
  Clock,
  XCircle,
  CreditCard,
} from 'lucide-react';
import { auth } from '../lib/db';
import { getApiUrl } from '../lib/apiConfig';
import CheckoutModal from './CheckoutModal';

export interface OrganizationInfo {
  organizationId: number;
  orgName: string;
  planSlug: 'gratis' | 'pro' | 'corporativo';
  planName: string;
  seatLimit: number;
  usedSeats: number;
  activeMembersCount: number;
  pendingInvitesCount: number;
  orgRole: string;
  logisticsPlanActive: boolean;
  hasLogisticsAccess: boolean;
}

interface Props {
  onOrganizationUpdated?: (org: OrganizationInfo) => void;
}

const PLAN_CARDS = [
  {
    slug: 'gratis' as const,
    title: 'Plan Gratis / Inicial',
    seats: 2,
    price: 'Gratis (o Base $25.000 ARS)',
    priceShort: 'Gratis',
    summary: 'Ideal para PyMEs que inician operación en Patagonia.',
    icon: Shield,
  },
  {
    slug: 'pro' as const,
    title: 'Plan Pro Industria',
    seats: 5,
    price: '$65.000 ARS / mes',
    priceShort: '$65.000 ARS / mes',
    summary: 'Equipos comerciales y compras con ARN IA + CRM completo.',
    icon: Zap,
  },
  {
    slug: 'corporativo' as const,
    title: 'Plan Corporativo',
    seats: 10,
    price: '$140.000 ARS / mes',
    priceShort: '$140.000 ARS / mes',
    summary: 'Operadoras y contratistas multi-área con hasta 10 usuarios.',
    icon: Crown,
  },
];

export default function TeamSeatsManager({ onOrganizationUpdated }: Props) {
  const [org, setOrg] = useState<OrganizationInfo | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'comercial' | 'operador' | 'company_admin'>('comercial');
  const [inviting, setInviting] = useState(false);
  const [updatingPlan, setUpdatingPlan] = useState(false);
  const [notice, setNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [checkoutTarget, setCheckoutTarget] = useState<{
    targetSlug: string;
    title: string;
    price: string;
  } | null>(null);

  const notify = (type: 'ok' | 'err', text: string) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 6000);
  };

  const loadTeam = useCallback(async () => {
    setLoading(true);
    try {
      const token = await auth.getToken();
      if (!token) return;
      const [teamRes, txRes] = await Promise.all([
        fetch(`${getApiUrl()}/api/org/team`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        }),
        fetch(`${getApiUrl()}/api/billing/transactions`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        }).catch(() => null),
      ]);
      const data = await teamRes.json();
      if (teamRes.ok && data.organization) {
        setOrg(data.organization);
        setMembers(Array.isArray(data.members) ? data.members : []);
        setInvitations(Array.isArray(data.invitations) ? data.invitations : []);
        onOrganizationUpdated?.(data.organization);
      }
      if (txRes && txRes.ok) {
        const txJson = await txRes.json().catch(() => ({}));
        if (Array.isArray(txJson.transactions)) {
          setTransactions(txJson.transactions);
        }
      }
    } catch {
      notify('err', 'No se pudo cargar la configuración del equipo.');
    } finally {
      setLoading(false);
    }
  }, [onOrganizationUpdated]);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const token = await auth.getToken();
      const res = await fetch(`${getApiUrl()}/api/org/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: inviteEmail.trim(), orgRole: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'No se pudo enviar la invitación');
      setInviteEmail('');
      await loadTeam();
      notify('ok', 'Invitación emitida. Al iniciar sesión con ese correo, el colaborador ingresará a tu empresa.');
    } catch (err: any) {
      notify('err', err?.message || 'Error enviando invitación');
    } finally {
      setInviting(false);
    }
  };

  const handleRevokeInvite = async (id: number) => {
    try {
      const token = await auth.getToken();
      await fetch(`${getApiUrl()}/api/org/invitations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      await loadTeam();
      notify('ok', 'Invitación revocada y asiento liberado.');
    } catch {
      notify('err', 'No se pudo revocar la invitación.');
    }
  };

  const handleRoleChange = async (memberUid: string, nextRole: string) => {
    try {
      const token = await auth.getToken();
      const res = await fetch(`${getApiUrl()}/api/org/members/${memberUid}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orgRole: nextRole }),
      });
      if (!res.ok) throw new Error('Error actualizando rol');
      await loadTeam();
      notify('ok', 'Rol actualizado correctamente.');
    } catch (err: any) {
      notify('err', err?.message || 'No se pudo actualizar el rol.');
    }
  };

  const handleRemoveMember = async (memberUid: string) => {
    try {
      const token = await auth.getToken();
      const res = await fetch(`${getApiUrl()}/api/org/members/${memberUid}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'No se pudo remover miembro');
      await loadTeam();
      notify('ok', 'Miembro removido y asiento liberado.');
    } catch (err: any) {
      notify('err', err?.message || 'Error removiendo miembro');
    }
  };

  const handlePlanChange = async (payload: {
    planSlug?: 'gratis' | 'pro' | 'corporativo';
    logisticsPlanActive?: boolean;
  }) => {
    setUpdatingPlan(true);
    try {
      const token = await auth.getToken();
      const res = await fetch(`${getApiUrl()}/api/org/plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 402 || data?.requiresPayment) {
        const slug =
          data?.targetSlug ||
          (payload.logisticsPlanActive ? 'logistica_flota' : payload.planSlug || 'pro');
        const matchedCard = PLAN_CARDS.find((c) => c.slug === slug);
        setCheckoutTarget({
          targetSlug: slug,
          title:
            slug === 'logistica_flota'
              ? 'Membresía Suite Logística & Flota'
              : matchedCard?.title || 'Upgrade Plan SaaS',
          price:
            slug === 'logistica_flota'
              ? '$95.000 ARS / mes'
              : matchedCard?.priceShort || '$65.000 ARS / mes',
        });
        return;
      }
      if (!res.ok) throw new Error(data?.error || 'No se pudo actualizar el plan');
      await loadTeam();
      notify('ok', 'Plan y permisos de organización actualizados.');
    } catch (err: any) {
      notify('err', err?.message || 'Error actualizando plan');
    } finally {
      setUpdatingPlan(false);
    }
  };

  if (loading && !org) {
    return <div className="p-8 text-center text-xs text-slate-500">Cargando equipo y límites de asientos SaaS...</div>;
  }

  const used = org?.usedSeats ?? 1;
  const limit = org?.seatLimit ?? 2;
  const pct = Math.min(100, Math.round((used / Math.max(1, limit)) * 100));
  const atLimit = used >= limit;

  return (
    <div className="space-y-6">
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

      {/* Seat Capacity Overview */}
      <div className="bg-white dark:bg-[#1A1625] border border-slate-200 dark:border-white/10 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              Cupo Multi-Usuario SaaS · {org?.orgName}
            </span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {org?.planName || 'Plan Gratis / Inicial'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Todos los usuarios de tu organización comparten la misma agenda de Contactos CRM, pipeline ARN IA, inventario y cotizaciones.
            </p>
          </div>
          <div className="text-left md:text-right shrink-0">
            <div className="text-2xl font-mono font-bold tabular-nums text-slate-900 dark:text-white">
              {used} / {limit} usuarios
            </div>
            <div className="text-xs text-slate-500">
              {org?.activeMembersCount || 1} activos · {org?.pendingInvitesCount || 0} invitaciones pendientes
            </div>
          </div>
        </div>

        <div className="w-full h-2.5 bg-slate-100 dark:bg-black/30 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              atLimit ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>

        {atLimit && (
          <div className="mt-4 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              Alcanzaste el tope de {limit} usuarios de tu plan actual. Seleccioná Plan Pro Industria (5) o Plan Corporativo (10) debajo para sumar más colaboradores.
            </span>
          </div>
        )}
      </div>

      {/* Invite Member Form */}
      <div className="bg-white dark:bg-[#1A1625] border border-slate-200 dark:border-white/10 rounded-2xl p-6">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-purple-500" /> Invitar Usuario a la Empresa
        </h3>
        <form onSubmit={handleInvite} className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <input
            type="email"
            required
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="Email corporativo del colaborador (ej. ventas@tuempresa.com.ar)"
            disabled={atLimit}
            className="md:col-span-6 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-sm text-slate-900 dark:text-white disabled:opacity-50"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as any)}
            disabled={atLimit}
            className="md:col-span-3 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-sm text-slate-900 dark:text-white disabled:opacity-50"
          >
            <option value="comercial">Comercial (ARN + CRM + RFQs)</option>
            <option value="operador">Operador (Stock + Logística)</option>
            <option value="company_admin">Admin de Empresa</option>
          </select>
          <button
            type="submit"
            disabled={inviting || atLimit}
            className="md:col-span-3 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50"
          >
            {inviting ? 'Invitando...' : atLimit ? 'Cupo Completo' : 'Enviar Invitación'}
          </button>
        </form>
      </div>

      {/* Active Members & Pending Invitations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#1A1625] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-500" /> Miembros Activos ({members.length})
            </h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {members.map((m) => (
              <div key={m.user_uid} className="px-5 py-3.5 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 dark:text-white truncate">{m.email}</div>
                  <div className="text-slate-500 mt-0.5">Estado: Activo</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={m.org_role || 'comercial'}
                    onChange={(e) => handleRoleChange(m.user_uid, e.target.value)}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-xs font-semibold text-slate-800 dark:text-slate-200"
                  >
                    <option value="company_admin">Admin</option>
                    <option value="comercial">Comercial</option>
                    <option value="operador">Operador</option>
                  </select>
                  {m.user_uid !== auth.currentUser?.uid && (
                    <button
                      onClick={() => handleRemoveMember(m.user_uid)}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10"
                      title="Quitar miembro"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-[#1A1625] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-white/10">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Invitaciones Pendientes ({invitations.length})
            </h3>
          </div>
          {invitations.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              No hay invitaciones pendientes de aceptación.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {invitations.map((inv) => (
                <div key={inv.id} className="px-5 py-3.5 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{inv.email}</div>
                    <div className="text-slate-500">Rol asignado: {inv.org_role}</div>
                  </div>
                  <button
                    onClick={() => handleRevokeInvite(inv.id)}
                    className="px-2.5 py-1 rounded-lg border border-red-500/30 text-red-600 dark:text-red-400 font-semibold hover:bg-red-500/10"
                  >
                    Revocar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SaaS Plan Switcher (2 / 5 / 10) + Separate Logistics Membership */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
          Planes SaaS PyME y Membresía Aparte de Logística
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLAN_CARDS.map((card) => {
            const Icon = card.icon;
            const isCurrent = org?.planSlug === card.slug;
            return (
              <div
                key={card.slug}
                className={`p-5 rounded-2xl border bg-white dark:bg-[#1A1625] flex flex-col justify-between gap-4 ${
                  isCurrent
                    ? 'border-purple-500 ring-1 ring-purple-500/30'
                    : 'border-slate-200 dark:border-white/10'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="w-5 h-5 text-purple-500" />
                    <span className="font-mono text-xs font-bold tabular-nums text-slate-700 dark:text-slate-200">
                      Hasta {card.seats} usuarios
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white">{card.title}</h4>
                  <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                    {card.price}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">{card.summary}</p>
                </div>
                <button
                  onClick={() => handlePlanChange({ planSlug: card.slug })}
                  disabled={isCurrent || updatingPlan}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition ${
                    isCurrent
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 cursor-default'
                      : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90'
                  }`}
                >
                  {isCurrent ? 'Plan Activo' : `Seleccionar (${card.seats} usuarios)`}
                </button>
              </div>
            );
          })}
        </div>

        {/* Dedicated Logistics Membership Card */}
        <div className="p-6 rounded-2xl border border-orange-500/40 bg-white dark:bg-[#1A1625] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 text-orange-500 text-xs font-bold uppercase tracking-wider">
              <Truck className="w-4 h-4" /> Membresía Aparte · Empresas de Logística y Transporte
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">
              Suite de Gestión y Control de Flota + Contratación de Cargas
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Membresía específica para transportistas y operadores logísticos. Habilita administración de unidades y vencimientos (VTV/Seguro), padrón de choferes LINTI, postulación directa a cargas y contratos digitales en plataforma ($95.000 ARS/mes).
            </p>
          </div>
          <div className="shrink-0">
            {org?.logisticsPlanActive ? (
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" /> Membresía Logística Activa
                </span>
                <button
                  onClick={() => handlePlanChange({ logisticsPlanActive: false })}
                  disabled={updatingPlan}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                >
                  Desactivar
                </button>
              </div>
            ) : (
              <button
                onClick={() => handlePlanChange({ logisticsPlanActive: true })}
                disabled={updatingPlan}
                className="px-5 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider whitespace-nowrap"
              >
                Activar Membresía Logística
              </button>
            )}
          </div>
        </div>

        {/* Billing Transactions History */}
        {transactions.length > 0 && (
          <div className="bg-white dark:bg-[#1A1625] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-orange-500" /> Historial de Pagos y Transferencias ({transactions.length})
              </h4>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {transactions.slice(0, 8).map((tx) => {
                const isApproved = tx.status === 'approved';
                const isRejected = tx.status === 'rejected';
                return (
                  <div key={tx.id} className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white uppercase">
                        {tx.target_slug} · <span className="font-mono text-slate-500">{tx.provider === 'mercadopago' ? 'MercadoPago' : 'Transferencia'}</span>
                      </div>
                      <div className="text-slate-500 font-mono tabular-nums mt-0.5">
                        Ref: {tx.receipt_reference || tx.external_reference} · {tx.created_at ? new Date(tx.created_at).toLocaleDateString('es-AR') : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                        ${Number(tx.amount_ars || 0).toLocaleString('es-AR')} ARS
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase ${
                          isApproved
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : isRejected
                            ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {isApproved ? <CheckCircle2 className="w-3 h-3" /> : isRejected ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {isApproved ? 'Aprobado' : isRejected ? 'Rechazado' : 'Pendiente'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {checkoutTarget && (
        <CheckoutModal
          isOpen={Boolean(checkoutTarget)}
          onClose={() => setCheckoutTarget(null)}
          targetSlug={checkoutTarget.targetSlug}
          moduleName={checkoutTarget.title}
          price={checkoutTarget.price}
          onConfirm={async (res) => {
            setCheckoutTarget(null);
            await loadTeam();
            notify('ok', res.message);
          }}
        />
      )}
    </div>
  );
}
