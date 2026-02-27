"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  adminGetPool,
  adminPublishPool,
  adminClonePool,
  adminUpdatePool,
  adminDeletePool,
  adminStartPool,
  adminListPayments,
  adminListReservations,
  adminListMembers,
  adminApprovePayment,
  adminRejectPayment,
  adminListTrades,
  adminCreateTrade,
  adminCloseTrade,
  type AdminPoolDetails,
  type AdminPaymentSubmission,
  type AdminReservation,
  type AdminPoolMember,
  type AdminPoolTrade,
  type AdminTradesSummary,
  type AdminOpenTradeRequest,
  type UpdatePoolRequest,
} from "@/lib/api/vcpool-admin";
import { useNotification, Notification } from "@/components/common/notification";
import { PoolTradesFlow } from "@/components/vcpool/pool-trades-flow";

type Tab = "payments" | "reservations" | "members" | "trades";

function EditPoolModal({
  pool,
  onSave,
  onClose,
  saving,
}: {
  pool: AdminPoolDetails;
  onSave: (body: UpdatePoolRequest) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [name, setName] = useState(pool.name);
  const [description, setDescription] = useState(pool.description ?? "");
  const [coinType, setCoinType] = useState(pool.coin_type);
  const [contributionAmount, setContributionAmount] = useState(String(pool.contribution_amount));
  const [maxMembers, setMaxMembers] = useState(String(pool.max_members));
  const [durationDays, setDurationDays] = useState(String(pool.duration_days));
  const [poolFeePercent, setPoolFeePercent] = useState(String(pool.pool_fee_percent));
  const [adminProfitFeePercent, setAdminProfitFeePercent] = useState(String(pool.admin_profit_fee_percent));
  const [cancellationFeePercent, setCancellationFeePercent] = useState(String(pool.cancellation_fee_percent));
  const [paymentWindowMinutes, setPaymentWindowMinutes] = useState(String(pool.payment_window_minutes));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const contribution = Number(contributionAmount);
    const maxM = Number(maxMembers);
    const duration = Number(durationDays);
    const poolFee = Number(poolFeePercent);
    const adminFee = Number(adminProfitFeePercent);
    const cancelFee = Number(cancellationFeePercent);
    const windowMins = Number(paymentWindowMinutes);
    if (!name.trim() || !(contribution > 0) || !(maxM >= 2) || !(duration >= 1)) return;
    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      coin_type: coinType,
      contribution_amount: contribution,
      max_members: maxM,
      duration_days: duration,
      pool_fee_percent: poolFee,
      admin_profit_fee_percent: adminFee,
      cancellation_fee_percent: cancelFee,
      payment_window_minutes: windowMins,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-[--color-border] bg-[--color-surface] shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[--color-border] px-5 py-4 sticky top-0 bg-[--color-surface]">
          <h3 className="text-lg font-semibold text-white">Edit pool</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Close">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <label className="block text-sm text-slate-400">Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-[--color-border] bg-[--color-surface-alt] px-3 py-2.5 text-sm text-white" required />
          <label className="block text-sm text-slate-400">Description (optional)</label>
          <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-xl border border-[--color-border] bg-[--color-surface-alt] px-3 py-2.5 text-sm text-white" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400">Coin</label>
              <select value={coinType} onChange={(e) => setCoinType(e.target.value)} className="mt-1 w-full rounded-xl border border-[--color-border] bg-[--color-surface-alt] px-3 py-2.5 text-sm text-white">
                <option value="USDT">USDT</option>
                <option value="USDC">USDC</option>
                <option value="BUSD">BUSD</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400">Contribution per seat</label>
              <input type="number" min={0} step={0.01} value={contributionAmount} onChange={(e) => setContributionAmount(e.target.value)} className="mt-1 w-full rounded-xl border border-[--color-border] bg-[--color-surface-alt] px-3 py-2.5 text-sm text-white" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400">Max members</label>
              <input type="number" min={2} value={maxMembers} onChange={(e) => setMaxMembers(e.target.value)} className="mt-1 w-full rounded-xl border border-[--color-border] bg-[--color-surface-alt] px-3 py-2.5 text-sm text-white" required />
            </div>
            <div>
              <label className="block text-sm text-slate-400">Duration (days)</label>
              <input type="number" min={1} value={durationDays} onChange={(e) => setDurationDays(e.target.value)} className="mt-1 w-full rounded-xl border border-[--color-border] bg-[--color-surface-alt] px-3 py-2.5 text-sm text-white" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400">Pool fee %</label>
              <input type="number" min={0} step={0.01} value={poolFeePercent} onChange={(e) => setPoolFeePercent(e.target.value)} className="mt-1 w-full rounded-xl border border-[--color-border] bg-[--color-surface-alt] px-3 py-2.5 text-sm text-white" />
            </div>
            <div>
              <label className="block text-sm text-slate-400">Admin profit fee %</label>
              <input type="number" min={0} step={0.01} value={adminProfitFeePercent} onChange={(e) => setAdminProfitFeePercent(e.target.value)} className="mt-1 w-full rounded-xl border border-[--color-border] bg-[--color-surface-alt] px-3 py-2.5 text-sm text-white" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400">Cancellation fee %</label>
              <input type="number" min={0} step={0.01} value={cancellationFeePercent} onChange={(e) => setCancellationFeePercent(e.target.value)} className="mt-1 w-full rounded-xl border border-[--color-border] bg-[--color-surface-alt] px-3 py-2.5 text-sm text-white" />
            </div>
            <div>
              <label className="block text-sm text-slate-400">Payment window (min)</label>
              <input type="number" min={5} value={paymentWindowMinutes} onChange={(e) => setPaymentWindowMinutes(e.target.value)} className="mt-1 w-full rounded-xl border border-[--color-border] bg-[--color-surface-alt] px-3 py-2.5 text-sm text-white" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-[#fc4f02] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60">Save changes</button>
            <button type="button" onClick={onClose} disabled={saving} className="rounded-xl border border-[--color-border] px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/5 disabled:opacity-60">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminPoolDetailsPage() {
  const params = useParams<{ poolId: string }>();
  const router = useRouter();
  const poolId = String(params.poolId ?? "");
  const { notification, showNotification, hideNotification } = useNotification();
  const [pool, setPool] = useState<AdminPoolDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("payments");
  const [payments, setPayments] = useState<AdminPaymentSubmission[]>([]);
  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [members, setMembers] = useState<AdminPoolMember[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [actionSubmitting, setActionSubmitting] = useState<string | null>(null);
  // Phase 1D: Start pool + Trades
  const [trades, setTrades] = useState<AdminPoolTrade[]>([]);
  const [tradesSummary, setTradesSummary] = useState<AdminTradesSummary | null>(null);
  const [tradesLoading, setTradesLoading] = useState(false);
  const [tradeStatusFilter, setTradeStatusFilter] = useState<"open" | "closed" | "all">("open");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const isDraft = pool?.status === "draft";
  const isFull = pool?.status === "full";
  const isActive = pool?.status === "active";

  const load = () => {
    if (!poolId) return;
    setLoading(true);
    adminGetPool(poolId)
      .then(setPool)
      .catch((err: unknown) => {
        showNotification((err as { message?: string })?.message ?? "Failed to load pool", "error");
      })
      .finally(() => setLoading(false));
  };

  const loadPayments = () => {
    if (!poolId) return;
    setPaymentsLoading(true);
    adminListPayments(poolId, { page: 1, limit: 50 })
      .then((r) => setPayments(r.submissions))
      .catch(() => setPayments([]))
      .finally(() => setPaymentsLoading(false));
  };

  const loadReservations = () => {
    if (!poolId) return;
    adminListReservations(poolId).then((r) => setReservations(r.reservations)).catch(() => setReservations([]));
  };

  const loadMembers = () => {
    if (!poolId) return;
    adminListMembers(poolId).then((r) => setMembers(r.members)).catch(() => setMembers([]));
  };

  const loadTrades = () => {
    if (!poolId) return;
    setTradesLoading(true);
    const params: { status?: "open" | "closed"; page?: number; limit?: number } = {
      page: 1,
      limit: 50,
    };
    if (tradeStatusFilter !== "all") params.status = tradeStatusFilter;
    adminListTrades(poolId, params)
      .then((r) => {
        setTrades(r.trades);
        setTradesSummary(r.summary);
      })
      .catch(() => {
        setTrades([]);
        setTradesSummary(null);
      })
      .finally(() => setTradesLoading(false));
  };

  useEffect(() => {
    load();
  }, [poolId]);

  useEffect(() => {
    if (!poolId || !pool || pool.status === "draft") return;
    loadPayments();
    loadReservations();
    loadMembers();
  }, [poolId, pool?.status]);

  useEffect(() => {
    if (!poolId || !isActive) return;
    loadTrades();
  }, [poolId, isActive, tradeStatusFilter]);

  const handlePublish = async () => {
    if (!pool) return;
    setSaving(true);
    try {
      const updated = await adminPublishPool(pool.pool_id);
      setPool(updated);
      showNotification("Pool published", "success");
    } catch (err: any) {
      showNotification(err?.message || "Failed to publish pool", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleClone = async () => {
    if (!pool) return;
    setSaving(true);
    try {
      const cloned = await adminClonePool(pool.pool_id);
      showNotification("Pool cloned as draft", "success");
      router.push(`/admin/pools/${cloned.pool_id}`);
    } catch (err: any) {
      showNotification(err?.message || "Failed to clone pool", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleStartPool = async () => {
    if (!poolId || !pool) return;
    setSaving(true);
    try {
      await adminStartPool(poolId);
      showNotification("Pool started. Trading is now active.", "success");
      load();
    } catch (err: unknown) {
      showNotification((err as { message?: string })?.message ?? "Failed to start pool", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenTrade = async (body: AdminOpenTradeRequest) => {
    if (!poolId) return;
    setSaving(true);
    try {
      await adminCreateTrade(poolId, body);
      showNotification("Trade opened", "success");
      load();
      loadTrades();
    } catch (err: unknown) {
      showNotification((err as { message?: string })?.message ?? "Failed to open trade", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCloseTrade = async (tradeId: string, exitPrice: number) => {
    if (!poolId) return;
    setActionSubmitting(tradeId);
    try {
      await adminCloseTrade(poolId, tradeId, { exit_price_usdt: exitPrice });
      showNotification("Trade closed. Pool value updated.", "success");
      load();
      loadTrades();
    } catch (err: unknown) {
      showNotification((err as { message?: string })?.message ?? "Failed to close trade", "error");
    } finally {
      setActionSubmitting(null);
    }
  };

  const handleDelete = async () => {
    if (!poolId) return;
    setSaving(true);
    try {
      await adminDeletePool(poolId);
      showNotification("Pool deleted", "success");
      setShowDeleteConfirm(false);
      router.push("/admin/pools");
    } catch (err: unknown) {
      showNotification((err as { message?: string })?.message ?? "Failed to delete pool", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePool = async (body: UpdatePoolRequest) => {
    if (!pool?.pool_id) return;
    setSaving(true);
    try {
      const updated = await adminUpdatePool(pool.pool_id, body);
      setPool(updated);
      showNotification("Pool updated", "success");
      setShowEditModal(false);
    } catch (err: unknown) {
      showNotification((err as { message?: string })?.message ?? "Failed to update pool", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (submissionId: string) => {
    if (!poolId) return;
    setActionSubmitting(submissionId);
    try {
      await adminApprovePayment(poolId, submissionId);
      showNotification("Payment approved. User is now a member.", "success");
      load();
      loadPayments();
      loadReservations();
      loadMembers();
    } catch (err: unknown) {
      showNotification((err as { message?: string })?.message ?? "Failed to approve", "error");
    } finally {
      setActionSubmitting(null);
    }
  };

  const handleReject = async (submissionId: string) => {
    const reason = window.prompt("Rejection reason (shown to user):", "Screenshot unclear or invalid");
    if (reason === null) return;
    if (!poolId) return;
    setActionSubmitting(submissionId);
    try {
      await adminRejectPayment(poolId, submissionId, { rejection_reason: reason.trim() || "Rejected by admin" });
      showNotification("Payment rejected. Seat released.", "success");
      load();
      loadPayments();
      loadReservations();
      loadMembers();
    } catch (err: unknown) {
      showNotification((err as { message?: string })?.message ?? "Failed to reject", "error");
    } finally {
      setActionSubmitting(null);
    }
  };

  return (
    <div className="space-y-6">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={hideNotification}
        />
      )}

      <button
        onClick={() => router.push("/admin/pools")}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Pools
      </button>

      {loading && (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#fc4f02] border-t-transparent" />
        </div>
      )}

      {!loading && pool && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-white">{pool.name}</h1>
              <p className="text-xs text-slate-400">
                Status: <span className="capitalize">{pool.status}</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {isDraft && (
                <button
                  type="button"
                  onClick={() => setShowEditModal(true)}
                  disabled={saving}
                  className="rounded-xl border border-[--color-border] px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-[--color-surface-alt] disabled:opacity-60"
                >
                  Edit pool
                </button>
              )}
              <button
                type="button"
                onClick={handleClone}
                disabled={saving}
                className="rounded-xl border border-[--color-border] px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-[--color-surface-alt] disabled:opacity-60"
              >
                Clone
              </button>
              {isDraft && (
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={saving}
                  className="rounded-xl bg-[#fc4f02] px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60"
                >
                  Publish
                </button>
              )}
              {isFull && pool.verified_members_count === pool.max_members && (
                <button
                  type="button"
                  onClick={handleStartPool}
                  disabled={saving}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
                >
                  Start pool
                </button>
              )}
              {isDraft && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={saving}
                  className="rounded-xl border border-red-500/50 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 disabled:opacity-60"
                >
                  Delete pool
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-5 text-sm text-slate-300 space-y-3">
              <h2 className="text-sm font-semibold text-white">Basics</h2>
              <div className="space-y-2">
                <div className="flex w-full items-center justify-between rounded-lg bg-[--color-surface-alt] px-3 py-2 text-left">
                  <span className="text-xs text-slate-400">Name</span>
                  <span className="text-xs font-medium text-white">{pool.name}</span>
                </div>
                <div className="flex w-full items-center justify-between rounded-lg bg-[--color-surface-alt] px-3 py-2 text-left">
                  <span className="text-xs text-slate-400">Contribution per seat</span>
                  <span className="text-xs font-medium text-white">
                    ${pool.contribution_amount} {pool.coin_type}
                  </span>
                </div>
                <div className="flex w-full items-center justify-between rounded-lg bg-[--color-surface-alt] px-3 py-2 text-left">
                  <span className="text-xs text-slate-400">Max members</span>
                  <span className="text-xs font-medium text-white">{pool.max_members}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-[--color-surface-alt] px-3 py-2 text-xs">
                  <span className="text-slate-400">Duration</span>
                  <span className="font-medium text-white">{pool.duration_days} days</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-5 text-sm text-slate-300 space-y-3">
              <h2 className="text-sm font-semibold text-white">Members & seats</h2>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-lg bg-[--color-surface-alt] px-3 py-2 text-xs">
                  <span className="text-slate-400">Verified members</span>
                  <span className="font-medium text-white">
                    {pool.verified_members_count}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-[--color-surface-alt] px-3 py-2 text-xs">
                  <span className="text-slate-400">Reserved seats</span>
                  <span className="font-medium text-white">
                    {pool.reserved_seats_count}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-[--color-surface-alt] px-3 py-2 text-xs">
                  <span className="text-slate-400">Available seats</span>
                  <span className="font-medium text-white">
                    {pool.max_members -
                      pool.verified_members_count -
                      pool.reserved_seats_count}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Phase 1D: Pool value (active pools only) */}
          {isActive && (
            <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-5">
              <h2 className="text-sm font-semibold text-white mb-3">Pool value</h2>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                <div className="rounded-lg bg-[--color-surface-alt] px-3 py-2 text-xs">
                  <span className="text-slate-400 block">Total invested</span>
                  <span className="font-medium text-white">
                    ${pool.total_invested_usdt ?? "0"} USDT
                  </span>
                </div>
                <div className="rounded-lg bg-[--color-surface-alt] px-3 py-2 text-xs">
                  <span className="text-slate-400 block">Current value</span>
                  <span className="font-medium text-white">
                    ${pool.current_pool_value_usdt ?? "0"} USDT
                  </span>
                </div>
                <div className="rounded-lg bg-[--color-surface-alt] px-3 py-2 text-xs">
                  <span className="text-slate-400 block">Total profit</span>
                  <span className={`font-medium ${Number(pool.total_profit_usdt ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    ${pool.total_profit_usdt ?? "0"} USDT
                  </span>
                </div>
                <div className="rounded-lg bg-[--color-surface-alt] px-3 py-2 text-xs">
                  <span className="text-slate-400 block">Started · Ends</span>
                  <span className="font-medium text-white">
                    {pool.started_at ? new Date(pool.started_at).toLocaleDateString() : "—"} · {pool.end_date ? new Date(pool.end_date).toLocaleDateString() : "—"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Phase 1C: Payments, Reservations, Members; Phase 1D: Trades (only for non-draft pools) */}
          {!isDraft && (
            <div className="rounded-xl border border-[--color-border] bg-[--color-surface] overflow-hidden">
              <div className="flex flex-wrap border-b border-[--color-border]">
                {(["payments", "reservations", "members", ...(isActive ? (["trades"] as const) : [])] as Tab[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-3 text-sm font-medium capitalize transition-colors ${
                      activeTab === tab
                        ? "bg-[#fc4f02]/20 text-[#fc4f02] border-b-2 border-[#fc4f02]"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="p-4">
                {activeTab === "payments" && (
                  <>
                    {paymentsLoading ? (
                      <div className="flex items-center gap-2 text-sm text-slate-400 py-4">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#fc4f02] border-t-transparent" />
                        Loading…
                      </div>
                    ) : payments.length === 0 ? (
                      <p className="text-sm text-slate-400 py-4">No payment submissions yet.</p>
                    ) : (
                      <div className="space-y-3 overflow-x-auto">
                        {payments.map((p) => (
                          <div
                            key={p.submission_id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[--color-surface-alt] p-3 text-sm"
                          >
                            <div>
                              <p className="font-medium text-white">
                                {p.user_email ?? p.user_username ?? p.user_id}
                              </p>
                              <p className="text-xs text-slate-400">
                                {p.payment_method} · {p.total_amount} ·{" "}
                                <span className="capitalize">{p.status}</span>
                              </p>
                              {p.screenshot_url && (
                                <a
                                  href={p.screenshot_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-[#fc4f02] hover:underline mt-1 inline-block"
                                >
                                  View screenshot
                                </a>
                              )}
                              {p.rejection_reason && (
                                <p className="text-xs text-red-400 mt-1">Rejected: {p.rejection_reason}</p>
                              )}
                            </div>
                            {p.status === "processing" && (
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleApprove(p.submission_id)}
                                  disabled={actionSubmitting !== null}
                                  className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-500 disabled:opacity-60"
                                >
                                  {actionSubmitting === p.submission_id ? "…" : "Approve"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleReject(p.submission_id)}
                                  disabled={actionSubmitting !== null}
                                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-60"
                                >
                                  {actionSubmitting === p.submission_id ? "…" : "Reject"}
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
                {activeTab === "reservations" && (
                  <>
                    {reservations.length === 0 ? (
                      <p className="text-sm text-slate-400 py-4">No active reservations.</p>
                    ) : (
                      <div className="space-y-2 overflow-x-auto">
                        {reservations.map((r) => (
                          <div
                            key={r.reservation_id}
                            className="flex items-center justify-between rounded-lg bg-[--color-surface-alt] px-3 py-2 text-sm text-slate-300"
                          >
                            <span className="font-medium text-white">
                              {r.user_email ?? r.user_username ?? r.user_id}
                            </span>
                            <span className="text-xs capitalize">{r.status}</span>
                            <span className="text-xs text-slate-400">
                              Expires: {new Date(r.expires_at).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
                {activeTab === "members" && (
                  <>
                    {members.length === 0 ? (
                      <p className="text-sm text-slate-400 py-4">No members yet.</p>
                    ) : (
                      <div className="space-y-2 overflow-x-auto">
                        {members.map((m) => (
                          <div
                            key={m.member_id}
                            className="flex items-center justify-between rounded-lg bg-[--color-surface-alt] px-3 py-2 text-sm text-slate-300"
                          >
                            <span className="font-medium text-white">
                              {m.user_email ?? m.user_username ?? m.user_id}
                            </span>
                            <span className="text-xs">Share: {m.share_percent}%</span>
                            <span className="text-xs text-slate-400">
                              Joined {new Date(m.joined_at).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
                {activeTab === "trades" && isActive && (
                  <PoolTradesFlow
                    pool={pool}
                    trades={trades}
                    tradesSummary={tradesSummary}
                    tradesLoading={tradesLoading}
                    tradeStatusFilter={tradeStatusFilter}
                    onFilterChange={setTradeStatusFilter}
                    onOpenTrade={handleOpenTrade}
                    onCloseTrade={handleCloseTrade}
                    saving={saving}
                    actionSubmitting={actionSubmitting}
                  />
                )}
              </div>
            </div>
          )}

          {/* Delete confirmation modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="w-full max-w-sm rounded-2xl border border-[--color-border] bg-[--color-surface] shadow-xl p-5">
                <h3 className="text-lg font-semibold text-white">Delete pool?</h3>
                <p className="mt-2 text-sm text-slate-400">
                  Only draft pools can be deleted. This will remove the pool permanently. This cannot be undone.
                </p>
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={saving}
                    className="flex-1 rounded-xl border border-[--color-border] px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/5 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={saving}
                    className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60"
                  >
                    {saving ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit pool modal */}
          {showEditModal && pool && (
            <EditPoolModal
              pool={pool}
              onSave={handleUpdatePool}
              onClose={() => setShowEditModal(false)}
              saving={saving}
            />
          )}
        </>
      )}
    </div>
  );
}

