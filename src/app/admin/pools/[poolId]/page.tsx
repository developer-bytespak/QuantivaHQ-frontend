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
  adminCompletePool,
  adminCancelPool,
  adminListPayments,
  adminListReservations,
  adminListMembers,
  adminApprovePayment,
  adminRejectPayment,
  adminListTrades,
  adminCreateTrade,
  adminCloseTrade,
  adminListCancellations,
  adminApproveCancellation,
  adminRejectCancellation,
  adminMarkRefunded,
  adminListPayouts,
  adminMarkPayoutPaid,
  type AdminPoolDetails,
  type AdminPaymentSubmission,
  type AdminReservation,
  type AdminPoolMember,
  type AdminPoolTrade,
  type AdminTradesSummary,
  type AdminOpenTradeRequest,
  type UpdatePoolRequest,
  type AdminCancellation,
  type AdminPayout,
} from "@/lib/api/vcpool-admin";
import { useNotification, Notification } from "@/components/common/notification";
import { PoolTradesFlow } from "@/components/vcpool/pool-trades-flow";

type Tab = "payments" | "reservations" | "members" | "trades" | "cancellations" | "payouts";

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
  // Phase 1E: cancellations + payouts
  const [cancellations, setCancellations] = useState<AdminCancellation[]>([]);
  const [cancellationsLoading, setCancellationsLoading] = useState(false);
  const [payouts, setPayouts] = useState<AdminPayout[]>([]);
  const [payoutsLoading, setPayoutsLoading] = useState(false);
  const [showCancelPoolConfirm, setShowCancelPoolConfirm] = useState(false);
  const [showCompletePoolConfirm, setShowCompletePoolConfirm] = useState(false);
  // Popups (replacing window.prompt)
  const [markRefundedModal, setMarkRefundedModal] = useState<{ cancellationId: string; txId: string; notes: string } | null>(null);
  const [markPayoutPaidModal, setMarkPayoutPaidModal] = useState<{ payoutId: string; txId: string; notes: string } | null>(null);
  const [rejectCancellationModal, setRejectCancellationModal] = useState<{ cancellationId: string; reason: string } | null>(null);
  const [rejectPaymentModal, setRejectPaymentModal] = useState<{ submissionId: string; reason: string } | null>(null);

  const isDraft = pool?.status === "draft";
  const isFull = pool?.status === "full";
  const isActive = pool?.status === "active";
  const isOpen = pool?.status === "open";
  const isCompleted = pool?.status === "completed";
  const isCancelled = pool?.status === "cancelled";

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

  const loadCancellations = () => {
    if (!poolId) return;
    setCancellationsLoading(true);
    adminListCancellations(poolId)
      .then((r) => setCancellations(r.cancellations))
      .catch(() => setCancellations([]))
      .finally(() => setCancellationsLoading(false));
  };

  const loadPayouts = () => {
    if (!poolId) return;
    setPayoutsLoading(true);
    adminListPayouts(poolId)
      .then((r) => setPayouts(r.payouts))
      .catch(() => setPayouts([]))
      .finally(() => setPayoutsLoading(false));
  };

  useEffect(() => {
    if (!poolId || !pool || pool.status === "draft") return;
    loadCancellations();
    loadPayouts();
  }, [poolId, pool?.status]);

  const handleCompletePool = async () => {
    if (!poolId) return;
    setSaving(true);
    try {
      await adminCompletePool(poolId);
      showNotification("Pool completed. Payouts created. Mark each as paid after transfer.", "success");
      setShowCompletePoolConfirm(false);
      load();
      loadPayouts();
    } catch (err: unknown) {
      showNotification((err as { message?: string })?.message ?? "Failed to complete pool", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelPool = async () => {
    if (!poolId) return;
    setSaving(true);
    try {
      await adminCancelPool(poolId);
      showNotification("Pool cancelled. Full refund payouts created. Mark each as paid after transfer.", "success");
      setShowCancelPoolConfirm(false);
      load();
      loadPayouts();
    } catch (err: unknown) {
      showNotification((err as { message?: string })?.message ?? "Failed to cancel pool", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleApproveCancellation = async (cancellationId: string) => {
    if (!poolId) return;
    setActionSubmitting(cancellationId);
    try {
      await adminApproveCancellation(poolId, cancellationId);
      showNotification("Cancellation approved. Transfer refund, then mark as refunded.", "success");
      load();
      loadCancellations();
      loadMembers();
    } catch (err: unknown) {
      showNotification((err as { message?: string })?.message ?? "Failed to approve", "error");
    } finally {
      setActionSubmitting(null);
    }
  };

  const handleRejectCancellation = async (cancellationId: string, reason: string) => {
    if (!poolId) return;
    setActionSubmitting(cancellationId);
    try {
      await adminRejectCancellation(poolId, cancellationId, { rejection_reason: reason.trim() || "Rejected by admin" });
      showNotification("Cancellation rejected. Member remains active.", "success");
      setRejectCancellationModal(null);
      loadCancellations();
    } catch (err: unknown) {
      showNotification((err as { message?: string })?.message ?? "Failed to reject", "error");
    } finally {
      setActionSubmitting(null);
    }
  };

  const handleMarkRefunded = async (cancellationId: string, binanceTxId?: string, notes?: string) => {
    if (!poolId) return;
    setActionSubmitting(cancellationId);
    try {
      await adminMarkRefunded(poolId, cancellationId, { binance_tx_id: binanceTxId || undefined, notes: notes || undefined });
      showNotification("Refund marked as completed. Member deactivated.", "success");
      setMarkRefundedModal(null);
      load();
      loadCancellations();
      loadMembers();
    } catch (err: unknown) {
      showNotification((err as { message?: string })?.message ?? "Failed to mark refunded", "error");
    } finally {
      setActionSubmitting(null);
    }
  };

  const handleMarkPayoutPaid = async (payoutId: string, binanceTxId?: string, notes?: string) => {
    if (!poolId) return;
    setActionSubmitting(payoutId);
    try {
      await adminMarkPayoutPaid(poolId, payoutId, { binance_tx_id: binanceTxId || undefined, notes: notes || undefined });
      showNotification("Payout marked as paid.", "success");
      setMarkPayoutPaidModal(null);
      loadPayouts();
    } catch (err: unknown) {
      showNotification((err as { message?: string })?.message ?? "Failed to mark paid", "error");
    } finally {
      setActionSubmitting(null);
    }
  };

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

  const handleReject = async (submissionId: string, reason: string) => {
    if (!poolId) return;
    setActionSubmitting(submissionId);
    try {
      await adminRejectPayment(poolId, submissionId, { rejection_reason: reason.trim() || "Rejected by admin" });
      showNotification("Payment rejected. Seat released.", "success");
      setRejectPaymentModal(null);
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
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-white/90 hover:text-[#fda300] transition-colors group"
      >
        <svg
          className="w-4 h-4 text-[#fc4f02] group-hover:-translate-x-1 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        <span>Back to Pools</span>
      </button>

      {loading && (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#fc4f02] border-t-transparent mx-auto mb-3" />
            <p className="text-slate-400">Loading pool...</p>
          </div>
        </div>
      )}

      {!loading && pool && (
        <>
          {/* ═══════════ POOL HEADER WITH GRADIENT ═══════════ */}
          <div className="rounded-2xl bg-gradient-to-b from-[#fc4f02]/90 via-[#fc4f02]/70 to-[#fda300]/50 p-6 sm:p-8 border border-[#fc4f02]/30 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{pool.name}</h1>
                {pool.description && (
                  <p className="text-sm text-white/90 max-w-2xl">{pool.description}</p>
                )}
              </div>
              <span className="px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap bg-white/20 backdrop-blur-sm text-white border border-white/30">
                {pool.status.charAt(0).toUpperCase() + pool.status.slice(1)}
              </span>
            </div>

            {/* ── Pool basics grid ── */}
            <div className="grid gap-4 sm:grid-cols-3 text-xs text-white/90">
              <div>
                <p className="mb-1 text-white/70">Contribution per seat</p>
                <p className="text-lg font-semibold">${pool.contribution_amount} {pool.coin_type}</p>
              </div>
              <div>
                <p className="mb-1 text-white/70">Duration</p>
                <p className="text-lg font-semibold">{pool.duration_days} days</p>
              </div>
              <div>
                <p className="mb-1 text-white/70">Max members</p>
                <p className="text-lg font-semibold">{pool.max_members}</p>
              </div>
            </div>
          </div>

          {/* ═══════════ ACTION BUTTONS ═══════════ */}
          <div className="flex flex-wrap gap-2 items-center items-center">
              {/* Top Trade: show when pool is open, full, or active (not draft) */}
              {(isOpen || isFull || isActive) && (
                <button
                  type="button"
                  onClick={() => router.push(`/admin/pools/${poolId}/top-trade`)}
                  className="rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-4 py-2 text-xs font-semibold text-white hover:shadow-lg hover:shadow-[#fc4f02]/30 transition-all"
                >
                  Top Trade
                </button>
              )}
            {isDraft && (
              <button
                type="button"
                onClick={() => setShowEditModal(true)}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg border border-[#fc4f02]/50 bg-[#fc4f02]/10 px-4 py-2.5 text-sm font-semibold text-[#fc4f02] hover:bg-[#fc4f02]/20 disabled:opacity-60 transition-colors"
              >
                ✎ Edit
              </button>
            )}
            <button
              type="button"
              onClick={handleClone}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg border border-[--color-border] bg-[--color-surface] px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-[--color-surface-alt] disabled:opacity-60 transition-colors"
            >
              🔀 Clone
            </button>
            {isDraft && (
              <button
                type="button"
                onClick={handlePublish}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-[#fc4f02] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 transition-opacity"
              >
                📤 Publish
              </button>
            )}
            {isFull && pool.verified_members_count === pool.max_members && (
              <button
                type="button"
                onClick={handleStartPool}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60 transition-colors"
              >
                ⚡ Start
              </button>
            )}
            {isActive && tradesSummary?.open_trades === 0 && (
              <button
                type="button"
                onClick={() => setShowCompletePoolConfirm(true)}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60 transition-colors"
              >
                ✓ Complete
              </button>
            )}
            {(isOpen || isFull) && (
              <button
                type="button"
                onClick={() => setShowCancelPoolConfirm(true)}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/20 disabled:opacity-60 transition-colors"
              >
                ⊗ Cancel Pool
              </button>
            )}
            {isDraft && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/20 disabled:opacity-60 transition-colors"
              >
                🗑 Delete
              </button>
            )}
          </div>

          {/* ═══════════ POOL STATS CARDS ═══════════ */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-6 space-y-4">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Members</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Verified members</span>
                  <span className="text-lg font-bold text-white">{pool.verified_members_count}/{pool.max_members}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Reserved seats</span>
                  <span className="text-lg font-bold text-blue-400">{pool.reserved_seats_count}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Available</span>
                  <span className="text-lg font-bold text-emerald-400">
                    {pool.max_members - pool.verified_members_count - pool.reserved_seats_count}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-6 space-y-4">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Pool Details</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Created</span>
                  <span className="text-sm font-medium text-white">{new Date(pool.created_at).toLocaleDateString()}</span>
                </div>
                {pool.started_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Started</span>
                    <span className="text-sm font-medium text-white">{new Date(pool.started_at).toLocaleDateString()}</span>
                  </div>
                )}
                {pool.end_date && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Ends</span>
                    <span className="text-sm font-medium text-white">{new Date(pool.end_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            {(pool.total_invested_usdt || pool.current_pool_value_usdt) && (
              <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-6 space-y-4">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Performance</h3>
                <div className="space-y-3">
                  {pool.total_invested_usdt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Invested</span>
                      <span className="text-lg font-bold text-white">${Number(pool.total_invested_usdt).toLocaleString()}</span>
                    </div>
                  )}
                  {pool.current_pool_value_usdt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Current Value</span>
                      <span className="text-lg font-bold text-white">${Number(pool.current_pool_value_usdt).toLocaleString()}</span>
                    </div>
                  )}
                  {pool.total_profit_usdt && (
                    <div className={`flex items-center justify-between pt-2 border-t border-[--color-border] ${Number(pool.total_profit_usdt) >= 0 ? '' : ''}`}>
                      <span className="text-sm text-slate-400">Profit/Loss</span>
                      <span className={`text-lg font-bold ${Number(pool.total_profit_usdt) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {Number(pool.total_profit_usdt) >= 0 ? '+' : ''}${Number(pool.total_profit_usdt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ═══════════ TABS & CONTENT ═══════════ */}
          {!isDraft && (
            <div className="rounded-xl border border-[--color-border] bg-[--color-surface] overflow-hidden">
              <div className="flex flex-wrap border-b border-[--color-border]">
                {(["payments", "reservations", "members", ...(isActive ? ["trades"] : []), "cancellations", "payouts"] as Tab[]).map((tab) => (
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
                              {(p.tx_hash || p.binance_tx_id) && (
                                <p className="text-xs text-slate-400 mt-1">
                                  TX Hash:{" "}
                                  <span className="font-mono text-slate-300">
                                    {p.tx_hash || p.binance_tx_id}
                                  </span>
                                </p>
                              )}
                              {p.user_wallet_address && (
                                <p className="text-xs text-slate-400 mt-0.5">
                                  User wallet:{" "}
                                  <span className="font-mono text-slate-300">
                                    {p.user_wallet_address}
                                  </span>
                                </p>
                              )}
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
                            {(p.status === "pending" || p.status === "processing") && (
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
                                  onClick={() => setRejectPaymentModal({ submissionId: p.submission_id, reason: "Screenshot unclear or invalid" })}
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
                        {members.map((m) => {
                          const displayName =
                            m.user?.full_name?.trim() ||
                            m.user?.email ||
                            m.user?.username ||
                            `Member ${m.member_id.slice(0, 8)}`;
                          const invested =
                            m.invested_amount_usdt != null
                              ? Number(m.invested_amount_usdt).toFixed(2)
                              : "—";
                          return (
                            <div
                              key={m.member_id}
                              className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[--color-surface-alt] px-4 py-3 text-sm"
                            >
                              <div className="min-w-0">
                                <p className="font-medium text-white truncate">
                                  {displayName}
                                </p>
                                {m.user?.email && (
                                  <p className="text-xs text-slate-400 truncate">
                                    {m.user.email}
                                  </p>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-4 text-slate-300">
                                <span className="text-xs">
                                  Invested: <span className="text-white font-medium">{invested} USDT</span>
                                </span>
                                <span className="text-xs">
                                  Share: <span className="text-white font-medium">{Number(m.share_percent).toFixed(2)}%</span>
                                </span>
                                <span className="text-xs text-slate-400">
                                  Joined {new Date(m.joined_at).toLocaleDateString()}
                                </span>
                                {m.is_active === false && (
                                  <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs text-amber-300">
                                    Exited
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
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
                {activeTab === "cancellations" && (
                  <>
                    {cancellationsLoading ? (
                      <div className="flex items-center gap-2 text-sm text-slate-400 py-6">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#fc4f02] border-t-transparent" />
                        Loading…
                      </div>
                    ) : cancellations.length === 0 ? (
                      <p className="text-sm text-slate-400 py-6">No cancellation requests.</p>
                    ) : (
                      <div className="space-y-3 py-2">
                        {cancellations.map((c) => (
                          <div key={c.cancellation_id} className="rounded-lg bg-[--color-surface-alt] p-4 text-sm">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="font-medium text-white">
                                  {c.member?.user?.email ?? c.member?.user?.full_name ?? c.member?.member_id}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                  Value at exit: {c.member_value_at_exit} · Fee: {c.fee_amount} · Refund: {c.refund_amount} · Status: <span className="capitalize">{c.status}</span>
                                </p>
                                <p className="text-xs text-slate-500 mt-1">Requested {new Date(c.requested_at).toLocaleString()}</p>
                                {c.rejection_reason && <p className="text-xs text-amber-400 mt-1">Rejected: {c.rejection_reason}</p>}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {c.status === "pending" && (
                                  <>
                                    <button type="button" onClick={() => handleApproveCancellation(c.cancellation_id)} disabled={actionSubmitting !== null} className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-500 disabled:opacity-60">
                                      {actionSubmitting === c.cancellation_id ? "…" : "Approve"}
                                    </button>
                                    <button type="button" onClick={() => setRejectCancellationModal({ cancellationId: c.cancellation_id, reason: "Please reconsider. Pool is performing well." })} disabled={actionSubmitting !== null} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-60">
                                      {actionSubmitting === c.cancellation_id ? "…" : "Reject"}
                                    </button>
                                  </>
                                )}
                                {c.status === "approved" && (
                                  <button
                                    type="button"
                                    onClick={() => setMarkRefundedModal({ cancellationId: c.cancellation_id, txId: "", notes: "" })}
                                    disabled={actionSubmitting !== null}
                                    className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-500 disabled:opacity-60"
                                  >
                                    {actionSubmitting === c.cancellation_id ? "…" : "Mark refunded"}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
                {activeTab === "payouts" && (
                  <>
                    {payoutsLoading ? (
                      <div className="flex items-center gap-2 text-sm text-slate-400 py-6">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#fc4f02] border-t-transparent" />
                        Loading…
                      </div>
                    ) : payouts.length === 0 ? (
                      <p className="text-sm text-slate-400 py-6">No payouts yet. Complete or cancel the pool to create payouts.</p>
                    ) : (
                      <div className="space-y-3 py-2">
                        {payouts.map((p) => (
                          <div key={p.payout_id} className="rounded-lg bg-[--color-surface-alt] p-4 text-sm">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="font-medium text-white">
                                  {p.member?.user?.email ?? p.member?.user?.full_name ?? p.member?.member_id}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                  Type: <span className="capitalize">{p.payout_type.replace("_", " ")}</span> · Net: {p.net_payout} · P/L: {p.profit_loss} · Status: <span className="capitalize">{p.status}</span>
                                </p>
                                <p className="text-xs text-slate-500 mt-1">Created {new Date(p.created_at).toLocaleString()}</p>
                              </div>
                              {p.status === "pending" && (
                                <button
                                  type="button"
                                  onClick={() => setMarkPayoutPaidModal({ payoutId: p.payout_id, txId: "", notes: "" })}
                                  disabled={actionSubmitting !== null}
                                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
                                >
                                  {actionSubmitting === p.payout_id ? "…" : "Mark paid"}
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Complete pool confirmation */}
          {showCompletePoolConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="w-full max-w-sm rounded-2xl border border-[--color-border] bg-[--color-surface] shadow-xl p-5">
                <h3 className="text-lg font-semibold text-white">Complete pool?</h3>
                <p className="mt-2 text-sm text-slate-400">
                  Close all trades first. This will calculate final payouts for all members. You will need to transfer funds and mark each payout as paid.
                </p>
                <div className="mt-6 flex gap-3">
                  <button type="button" onClick={() => setShowCompletePoolConfirm(false)} disabled={saving} className="flex-1 rounded-xl border border-[--color-border] px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/5 disabled:opacity-60">Cancel</button>
                  <button type="button" onClick={handleCompletePool} disabled={saving} className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60">{saving ? "Completing…" : "Complete"}</button>
                </div>
              </div>
            </div>
          )}

          {/* Cancel pool confirmation */}
          {showCancelPoolConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="w-full max-w-sm rounded-2xl border border-[--color-border] bg-[--color-surface] shadow-xl p-5">
                <h3 className="text-lg font-semibold text-white">Cancel pool?</h3>
                <p className="mt-2 text-sm text-slate-400">
                  This will cancel the pool and create full refund payouts for all members (no fee). Transfer refunds externally, then mark each as paid.
                </p>
                <div className="mt-6 flex gap-3">
                  <button type="button" onClick={() => setShowCancelPoolConfirm(false)} disabled={saving} className="flex-1 rounded-xl border border-[--color-border] px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/5 disabled:opacity-60">Cancel</button>
                  <button type="button" onClick={handleCancelPool} disabled={saving} className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60">{saving ? "Cancelling…" : "Cancel pool"}</button>
                </div>
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

          {/* Mark refunded popup */}
          {markRefundedModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="w-full max-w-sm rounded-2xl border border-[--color-border] bg-[--color-surface] shadow-xl p-5">
                <h3 className="text-lg font-semibold text-white">Mark refunded</h3>
                <p className="mt-1 text-sm text-slate-400">Record the transfer and mark this cancellation as refunded.</p>
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Binance TX ID </label>
                    <input
                      type="text"
                      value={markRefundedModal.txId}
                      onChange={(e) => setMarkRefundedModal((prev) => (prev ? { ...prev, txId: e.target.value } : null))}
                      placeholder="e.g. abc123..."
                      className="w-full rounded-xl border border-[--color-border] bg-[--color-surface-alt] px-3 py-2.5 text-sm text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Notes (optional)</label>
                    <input
                      type="text"
                      value={markRefundedModal.notes}
                      onChange={(e) => setMarkRefundedModal((prev) => (prev ? { ...prev, notes: e.target.value } : null))}
                      placeholder="Internal notes"
                      className="w-full rounded-xl border border-[--color-border] bg-[--color-surface-alt] px-3 py-2.5 text-sm text-white placeholder:text-slate-500"
                    />
                  </div>
                </div>
                <div className="mt-6 flex gap-3">
                  <button type="button" onClick={() => setMarkRefundedModal(null)} disabled={actionSubmitting !== null} className="flex-1 rounded-xl border border-[--color-border] px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/5 disabled:opacity-60">Cancel</button>
                  <button type="button" onClick={() => handleMarkRefunded(markRefundedModal.cancellationId, markRefundedModal.txId || undefined, markRefundedModal.notes || undefined)} disabled={actionSubmitting !== null} className="flex-1 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-60">{actionSubmitting === markRefundedModal.cancellationId ? "…" : "Mark refunded"}</button>
                </div>
              </div>
            </div>
          )}

          {/* Mark payout paid popup */}
          {markPayoutPaidModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="w-full max-w-sm rounded-2xl border border-[--color-border] bg-[--color-surface] shadow-xl p-5">
                <h3 className="text-lg font-semibold text-white">Mark payout paid</h3>
                <p className="mt-1 text-sm text-slate-400">Record the transfer and mark this payout as paid.</p>
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Binance TX ID (optional)</label>
                    <input
                      type="text"
                      value={markPayoutPaidModal.txId}
                      onChange={(e) => setMarkPayoutPaidModal((prev) => (prev ? { ...prev, txId: e.target.value } : null))}
                      placeholder="e.g. abc123..."
                      className="w-full rounded-xl border border-[--color-border] bg-[--color-surface-alt] px-3 py-2.5 text-sm text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Notes (optional)</label>
                    <input
                      type="text"
                      value={markPayoutPaidModal.notes}
                      onChange={(e) => setMarkPayoutPaidModal((prev) => (prev ? { ...prev, notes: e.target.value } : null))}
                      placeholder="Internal notes"
                      className="w-full rounded-xl border border-[--color-border] bg-[--color-surface-alt] px-3 py-2.5 text-sm text-white placeholder:text-slate-500"
                    />
                  </div>
                </div>
                <div className="mt-6 flex gap-3">
                  <button type="button" onClick={() => setMarkPayoutPaidModal(null)} disabled={actionSubmitting !== null} className="flex-1 rounded-xl border border-[--color-border] px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/5 disabled:opacity-60">Cancel</button>
                  <button type="button" onClick={() => handleMarkPayoutPaid(markPayoutPaidModal.payoutId, markPayoutPaidModal.txId || undefined, markPayoutPaidModal.notes || undefined)} disabled={actionSubmitting !== null} className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60">{actionSubmitting === markPayoutPaidModal.payoutId ? "…" : "Mark paid"}</button>
                </div>
              </div>
            </div>
          )}

          {/* Reject cancellation popup */}
          {rejectCancellationModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="w-full max-w-sm rounded-2xl border border-[--color-border] bg-[--color-surface] shadow-xl p-5">
                <h3 className="text-lg font-semibold text-white">Reject cancellation</h3>
                <p className="mt-1 text-sm text-slate-400">This reason will be shown to the member.</p>
                <div className="mt-4">
                  <label className="block text-xs text-slate-400 mb-1">Rejection reason</label>
                  <input
                    type="text"
                    value={rejectCancellationModal.reason}
                    onChange={(e) => setRejectCancellationModal((prev) => (prev ? { ...prev, reason: e.target.value } : null))}
                    placeholder="e.g. Please reconsider. Pool is performing well."
                    className="w-full rounded-xl border border-[--color-border] bg-[--color-surface-alt] px-3 py-2.5 text-sm text-white placeholder:text-slate-500"
                  />
                </div>
                <div className="mt-6 flex gap-3">
                  <button type="button" onClick={() => setRejectCancellationModal(null)} disabled={actionSubmitting !== null} className="flex-1 rounded-xl border border-[--color-border] px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/5 disabled:opacity-60">Cancel</button>
                  <button type="button" onClick={() => handleRejectCancellation(rejectCancellationModal.cancellationId, rejectCancellationModal.reason)} disabled={actionSubmitting !== null} className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60">{actionSubmitting === rejectCancellationModal.cancellationId ? "…" : "Reject"}</button>
                </div>
              </div>
            </div>
          )}

          {/* Reject payment popup */}
          {rejectPaymentModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="w-full max-w-sm rounded-2xl border border-[--color-border] bg-[--color-surface] shadow-xl p-5">
                <h3 className="text-lg font-semibold text-white">Reject payment</h3>
                <p className="mt-1 text-sm text-slate-400">This reason will be shown to the user.</p>
                <div className="mt-4">
                  <label className="block text-xs text-slate-400 mb-1">Rejection reason</label>
                  <input
                    type="text"
                    value={rejectPaymentModal.reason}
                    onChange={(e) => setRejectPaymentModal((prev) => (prev ? { ...prev, reason: e.target.value } : null))}
                    placeholder="e.g. Screenshot unclear or invalid"
                    className="w-full rounded-xl border border-[--color-border] bg-[--color-surface-alt] px-3 py-2.5 text-sm text-white placeholder:text-slate-500"
                  />
                </div>
                <div className="mt-6 flex gap-3">
                  <button type="button" onClick={() => setRejectPaymentModal(null)} disabled={actionSubmitting !== null} className="flex-1 rounded-xl border border-[--color-border] px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/5 disabled:opacity-60">Cancel</button>
                  <button type="button" onClick={() => handleReject(rejectPaymentModal.submissionId, rejectPaymentModal.reason)} disabled={actionSubmitting !== null} className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60">{actionSubmitting === rejectPaymentModal.submissionId ? "…" : "Reject"}</button>
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

