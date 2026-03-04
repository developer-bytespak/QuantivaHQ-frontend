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
import { PoolSignalsTab } from "@/components/vcpool/pool-signals-tab";

type Tab = "payments" | "reservations" | "members" | "trades" | "signals" | "cancellations" | "payouts";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; dot: string }> = {
    draft: { bg: "bg-slate-500/15 border-slate-500/20", text: "text-slate-300", dot: "bg-slate-400" },
    open: { bg: "bg-emerald-500/15 border-emerald-500/20", text: "text-emerald-400", dot: "bg-emerald-400 animate-pulse" },
    full: { bg: "bg-amber-500/15 border-amber-500/20", text: "text-amber-400", dot: "bg-amber-400" },
    active: { bg: "bg-blue-500/15 border-blue-500/20", text: "text-blue-400", dot: "bg-blue-400 animate-pulse" },
    completed: { bg: "bg-slate-500/15 border-slate-500/20", text: "text-slate-300", dot: "bg-slate-400" },
    cancelled: { bg: "bg-red-500/15 border-red-500/20", text: "text-red-400", dot: "bg-red-400" },
  };
  const s = map[status] ?? map.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] sm:text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

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

  const modalInput = "w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-[#fc4f02]/50 focus:outline-none focus:ring-1 focus:ring-[#fc4f02]/50 transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#1a1a2e]/95 to-[#0f0f1a]/95 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_30px_rgba(252,79,2,0.08)] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4 sticky top-0 bg-[#1a1a2e]/95 backdrop-blur-xl z-10">
          <h3 className="text-lg font-semibold text-white">Edit Pool</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors" aria-label="Close">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={modalInput} required />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">Description (optional)</label>
            <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className={modalInput} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">Coin</label>
              <select value={coinType} onChange={(e) => setCoinType(e.target.value)} className={modalInput}>
                <option value="USDT">USDT</option>
                <option value="USDC">USDC</option>
                <option value="BUSD">BUSD</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">Contribution per seat</label>
              <input type="number" min={0} step={0.01} value={contributionAmount} onChange={(e) => setContributionAmount(e.target.value)} className={modalInput} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">Max members</label>
              <input type="number" min={2} value={maxMembers} onChange={(e) => setMaxMembers(e.target.value)} className={modalInput} required />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">Duration (days)</label>
              <input type="number" min={1} value={durationDays} onChange={(e) => setDurationDays(e.target.value)} className={modalInput} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">Pool fee %</label>
              <input type="number" min={0} step={0.01} value={poolFeePercent} onChange={(e) => setPoolFeePercent(e.target.value)} className={modalInput} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">Admin profit fee %</label>
              <input type="number" min={0} step={0.01} value={adminProfitFeePercent} onChange={(e) => setAdminProfitFeePercent(e.target.value)} className={modalInput} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">Cancellation fee %</label>
              <input type="number" min={0} step={0.01} value={cancellationFeePercent} onChange={(e) => setCancellationFeePercent(e.target.value)} className={modalInput} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">Payment window (min)</label>
              <input type="number" min={5} value={paymentWindowMinutes} onChange={(e) => setPaymentWindowMinutes(e.target.value)} className={modalInput} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#fc4f02]/25 hover:shadow-[#fc4f02]/40 hover:scale-[1.02] transition-all disabled:opacity-60 disabled:hover:scale-100">Save changes</button>
            <button type="button" onClick={onClose} disabled={saving} className="rounded-xl border border-white/[0.08] px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/5 transition-colors disabled:opacity-60">Cancel</button>
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

  const handleRejectCancellation = async (cancellationId: string) => {
    const reason = window.prompt("Rejection reason (shown to user):", "Please reconsider. Pool is performing well.");
    if (reason === null) return;
    if (!poolId) return;
    setActionSubmitting(cancellationId);
    try {
      await adminRejectCancellation(poolId, cancellationId, { rejection_reason: reason.trim() || "Rejected by admin" });
      showNotification("Cancellation rejected. Member remains active.", "success");
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
    <div className="space-y-6 sm:space-y-8">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={hideNotification}
        />
      )}

      <button
        onClick={() => router.push("/admin/pools")}
        className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-400 hover:text-[#fc4f02] transition-colors group"
      >
        <svg className="h-4 w-4 sm:h-5 sm:w-5 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Pools
      </button>

      {loading && (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-6 w-6 sm:h-8 sm:w-8 animate-spin rounded-full border-4 border-slate-700/30 border-t-[#fc4f02]" />
        </div>
      )}

      {!loading && pool && (
        <>
          {/* Page header — outside cards, matching dashboard/pools list pattern */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">{pool.name}</h1>
              <div className="mt-1.5 flex items-center gap-2">
                <StatusBadge status={pool.status} />
                <span className="text-[10px] sm:text-xs text-slate-500">{pool.coin_type} · ${pool.contribution_amount}/seat · {pool.duration_days}d</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {isDraft && (
                <button
                  type="button"
                  onClick={() => setShowEditModal(true)}
                  disabled={saving}
                  className="rounded-xl border border-white/[0.08] px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/[0.05] transition-colors disabled:opacity-60"
                >
                  Edit pool
                </button>
              )}
              <button
                type="button"
                onClick={handleClone}
                disabled={saving}
                className="rounded-xl border border-white/[0.08] px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/[0.05] transition-colors disabled:opacity-60"
              >
                Clone
              </button>
              {isDraft && (
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-[#fc4f02]/25 hover:shadow-[#fc4f02]/40 hover:scale-[1.02] transition-all disabled:opacity-60 disabled:hover:scale-100"
                >
                  Publish
                </button>
              )}
              {isFull && pool.verified_members_count === pool.max_members && (
                <button
                  type="button"
                  onClick={handleStartPool}
                  disabled={saving}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-500 hover:scale-[1.02] transition-all disabled:opacity-60 disabled:hover:scale-100"
                >
                  Start pool
                </button>
              )}
              {isActive && tradesSummary?.open_trades === 0 && (
                <button
                  type="button"
                  onClick={() => setShowCompletePoolConfirm(true)}
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-500 hover:scale-[1.02] transition-all disabled:opacity-60 disabled:hover:scale-100"
                >
                  Complete pool
                </button>
              )}
              {(isOpen || isFull) && (
                <button
                  type="button"
                  onClick={() => setShowCancelPoolConfirm(true)}
                  disabled={saving}
                  className="rounded-xl border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-60"
                >
                  Cancel pool
                </button>
              )}
              {isDraft && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={saving}
                  className="rounded-xl border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-60"
                >
                  Delete pool
                </button>
              )}
            </div>
          </div>

          {/* Info cards — matching dashboard recent-pools card style */}
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
            <div className="rounded-xl sm:rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur overflow-hidden">
              <div className="border-b border-white/[0.06] px-5 sm:px-6 py-3 sm:py-4">
                <h2 className="text-sm sm:text-base font-semibold text-white">Basics</h2>
              </div>
              <div className="divide-y divide-white/[0.04]">
                <div className="flex items-center justify-between px-5 sm:px-6 py-3">
                  <span className="text-[10px] sm:text-xs text-slate-400">Name</span>
                  <span className="text-xs sm:text-sm font-medium text-white">{pool.name}</span>
                </div>
                <div className="flex items-center justify-between px-5 sm:px-6 py-3">
                  <span className="text-[10px] sm:text-xs text-slate-400">Contribution per seat</span>
                  <span className="text-xs sm:text-sm font-medium text-white">
                    ${pool.contribution_amount} {pool.coin_type}
                  </span>
                </div>
                <div className="flex items-center justify-between px-5 sm:px-6 py-3">
                  <span className="text-[10px] sm:text-xs text-slate-400">Max members</span>
                  <span className="text-xs sm:text-sm font-medium text-white">{pool.max_members}</span>
                </div>
                <div className="flex items-center justify-between px-5 sm:px-6 py-3">
                  <span className="text-[10px] sm:text-xs text-slate-400">Duration</span>
                  <span className="text-xs sm:text-sm font-medium text-white">{pool.duration_days} days</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl sm:rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur overflow-hidden">
              <div className="border-b border-white/[0.06] px-5 sm:px-6 py-3 sm:py-4">
                <h2 className="text-sm sm:text-base font-semibold text-white">Members & Seats</h2>
              </div>
              <div className="divide-y divide-white/[0.04]">
                <div className="flex items-center justify-between px-5 sm:px-6 py-3">
                  <span className="text-[10px] sm:text-xs text-slate-400">Verified members</span>
                  <span className="text-xs sm:text-sm font-medium text-white">
                    {pool.verified_members_count}
                  </span>
                </div>
                <div className="flex items-center justify-between px-5 sm:px-6 py-3">
                  <span className="text-[10px] sm:text-xs text-slate-400">Reserved seats</span>
                  <span className="text-xs sm:text-sm font-medium text-white">
                    {pool.reserved_seats_count}
                  </span>
                </div>
                <div className="flex items-center justify-between px-5 sm:px-6 py-3">
                  <span className="text-[10px] sm:text-xs text-slate-400">Available seats</span>
                  <span className="text-xs sm:text-sm font-medium text-white">
                    {pool.max_members -
                      pool.verified_members_count -
                      pool.reserved_seats_count}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Pool value stat cards — matching dashboard stat cards style */}
          {isActive && (
            <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
              <div className="relative overflow-hidden rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-[#fc4f02]/30 bg-gradient-to-br from-[#fc4f02]/15 via-[#fda300]/8 to-transparent shadow-[0_0_20px_rgba(252,79,2,0.08)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs text-slate-400 mb-1 sm:mb-2">Total Invested</p>
                    <p className="text-xl sm:text-2xl font-bold text-white">${pool.total_invested_usdt ?? "0"}</p>
                    <p className="text-[10px] text-slate-500 mt-1">USDT</p>
                  </div>
                  <div className="flex-shrink-0 flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-[#fc4f02]/20 to-[#fda300]/10">
                    <svg className="h-5 w-5 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-white/[0.06] bg-gradient-to-br from-white/[0.05] to-transparent">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs text-slate-400 mb-1 sm:mb-2">Current Value</p>
                    <p className="text-xl sm:text-2xl font-bold text-white">${pool.current_pool_value_usdt ?? "0"}</p>
                    <p className="text-[10px] text-slate-500 mt-1">USDT</p>
                  </div>
                  <div className="flex-shrink-0 flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-white/[0.05]">
                    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                  </div>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-white/[0.06] bg-gradient-to-br from-white/[0.05] to-transparent">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs text-slate-400 mb-1 sm:mb-2">Total Profit</p>
                    <p className={`text-xl sm:text-2xl font-bold ${Number(pool.total_profit_usdt ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      ${pool.total_profit_usdt ?? "0"}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">USDT</p>
                  </div>
                  <div className="flex-shrink-0 flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-white/[0.05]">
                    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                  </div>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-white/[0.06] bg-gradient-to-br from-white/[0.05] to-transparent">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs text-slate-400 mb-1 sm:mb-2">Timeline</p>
                    <p className="text-sm sm:text-base font-bold text-white">
                      {pool.started_at ? new Date(pool.started_at).toLocaleDateString() : "—"}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Ends {pool.end_date ? new Date(pool.end_date).toLocaleDateString() : "—"}
                    </p>
                  </div>
                  <div className="flex-shrink-0 flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-white/[0.05]">
                    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Phase 1C: Payments, Reservations, Members; Phase 1D: Trades (only for non-draft pools) */}
          {!isDraft && (
            <div className="rounded-xl sm:rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur overflow-hidden shadow-[0_0_20px_rgba(252,79,2,0.04)]">
              <div className="flex flex-wrap border-b border-white/[0.06] overflow-x-auto scrollbar-none">
                {(["payments", "reservations", "members", ...(isActive ? ["trades"] : []), "signals", "cancellations", "payouts"] as Tab[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-3 text-xs sm:text-sm font-medium capitalize transition-all whitespace-nowrap ${
                      activeTab === tab
                        ? "text-[#fc4f02] border-b-2 border-[#fc4f02] bg-[#fc4f02]/[0.08]"
                        : "text-slate-400 hover:text-white hover:bg-white/[0.03]"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div>
                {activeTab === "payments" && (
                  <>
                    {paymentsLoading ? (
                      <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-400 py-10">
                        <div className="h-5 w-5 animate-spin rounded-full border-[3px] border-slate-700/30 border-t-[#fc4f02]" />
                        Loading payments…
                      </div>
                    ) : payments.length === 0 ? (
                      <p className="text-xs sm:text-sm text-slate-500 text-center py-10">No payment submissions yet.</p>
                    ) : (
                      <div className="divide-y divide-white/[0.04]">
                        {payments.map((p) => (
                          <div
                            key={p.submission_id}
                            className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 py-3.5 sm:py-4 hover:bg-white/[0.02] transition-colors"
                          >
                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm font-medium text-white truncate">
                                {p.user_email ?? p.user_username ?? p.user_id}
                              </p>
                              <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">
                                {p.payment_method} · {p.total_amount} ·{" "}
                                <span className="capitalize">{p.status}</span>
                              </p>
                              {p.screenshot_url && (
                                <a
                                  href={p.screenshot_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] sm:text-xs text-[#fc4f02] hover:underline mt-1 inline-block"
                                >
                                  View screenshot
                                </a>
                              )}
                              {p.rejection_reason && (
                                <p className="text-[10px] sm:text-xs text-red-400 mt-1">Rejected: {p.rejection_reason}</p>
                              )}
                            </div>
                            {p.status === "processing" && (
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleApprove(p.submission_id)}
                                  disabled={actionSubmitting !== null}
                                  className="rounded-lg bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 text-[10px] sm:text-xs font-semibold text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-60"
                                >
                                  {actionSubmitting === p.submission_id ? "…" : "Approve"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleReject(p.submission_id)}
                                  disabled={actionSubmitting !== null}
                                  className="rounded-lg bg-red-500/20 border border-red-500/30 px-3 py-1.5 text-[10px] sm:text-xs font-semibold text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-60"
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
                      <p className="text-xs sm:text-sm text-slate-500 text-center py-10">No active reservations.</p>
                    ) : (
                      <div className="divide-y divide-white/[0.04]">
                        {reservations.map((r) => (
                          <div
                            key={r.reservation_id}
                            className="flex items-center justify-between gap-3 px-5 sm:px-6 py-3.5 sm:py-4 hover:bg-white/[0.02] transition-colors"
                          >
                            <span className="text-xs sm:text-sm font-medium text-white truncate">
                              {r.user_email ?? r.user_username ?? r.user_id}
                            </span>
                            <span className="text-[10px] sm:text-xs capitalize text-slate-300">{r.status}</span>
                            <span className="text-[10px] sm:text-xs text-slate-400">
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
                      <p className="text-xs sm:text-sm text-slate-500 text-center py-10">No members yet.</p>
                    ) : (
                      <div className="divide-y divide-white/[0.04]">
                        {members.map((m) => (
                          <div
                            key={m.member_id}
                            className="flex items-center justify-between gap-3 px-5 sm:px-6 py-3.5 sm:py-4 hover:bg-white/[0.02] transition-colors"
                          >
                            <span className="text-xs sm:text-sm font-medium text-white truncate">
                              {m.user_email ?? m.user_username ?? m.user_id}
                            </span>
                            <span className="text-[10px] sm:text-xs text-slate-300">Share: {m.share_percent}%</span>
                            <span className="text-[10px] sm:text-xs text-slate-400">
                              Joined {new Date(m.joined_at).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
                {activeTab === "trades" && isActive && (
                  <div className="p-4 sm:p-5">
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
                  </div>
                )}
                {activeTab === "signals" && (
                  <div className="p-4 sm:p-5">
                    <PoolSignalsTab
                      poolId={poolId}
                      pool={pool}
                      onTradePlaced={() => {
                        load();
                        loadTrades();
                      }}
                    />
                  </div>
                )}
                {activeTab === "cancellations" && (
                  <>
                    {cancellationsLoading ? (
                      <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-400 py-10">
                        <div className="h-5 w-5 animate-spin rounded-full border-[3px] border-slate-700/30 border-t-[#fc4f02]" />
                        Loading cancellations…
                      </div>
                    ) : cancellations.length === 0 ? (
                      <p className="text-xs sm:text-sm text-slate-500 text-center py-10">No cancellation requests.</p>
                    ) : (
                      <div className="divide-y divide-white/[0.04]">
                        {cancellations.map((c) => (
                          <div key={c.cancellation_id} className="px-5 sm:px-6 py-3.5 sm:py-4 hover:bg-white/[0.02] transition-colors">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-xs sm:text-sm font-medium text-white truncate">
                                  {c.member?.user?.email ?? c.member?.user?.full_name ?? c.member?.member_id}
                                </p>
                                <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">
                                  Value at exit: {c.member_value_at_exit} · Fee: {c.fee_amount} · Refund: {c.refund_amount} · Status: <span className="capitalize">{c.status}</span>
                                </p>
                                <p className="text-[10px] text-slate-500 mt-0.5">Requested {new Date(c.requested_at).toLocaleString()}</p>
                                {c.rejection_reason && <p className="text-[10px] sm:text-xs text-amber-400 mt-0.5">Rejected: {c.rejection_reason}</p>}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {c.status === "pending" && (
                                  <>
                                    <button type="button" onClick={() => handleApproveCancellation(c.cancellation_id)} disabled={actionSubmitting !== null} className="rounded-lg bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 text-[10px] sm:text-xs font-semibold text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-60">
                                      {actionSubmitting === c.cancellation_id ? "…" : "Approve"}
                                    </button>
                                    <button type="button" onClick={() => handleRejectCancellation(c.cancellation_id)} disabled={actionSubmitting !== null} className="rounded-lg bg-red-500/20 border border-red-500/30 px-3 py-1.5 text-[10px] sm:text-xs font-semibold text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-60">
                                      {actionSubmitting === c.cancellation_id ? "…" : "Reject"}
                                    </button>
                                  </>
                                )}
                                {c.status === "approved" && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const txId = window.prompt("Binance TX ID (optional):");
                                      const notes = window.prompt("Notes (optional):");
                                      if (txId !== null && notes !== null) handleMarkRefunded(c.cancellation_id, txId.trim() || undefined, notes.trim() || undefined);
                                    }}
                                    disabled={actionSubmitting !== null}
                                    className="rounded-lg bg-amber-500/20 border border-amber-500/30 px-3 py-1.5 text-[10px] sm:text-xs font-semibold text-amber-400 hover:bg-amber-500/30 transition-colors disabled:opacity-60"
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
                      <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-400 py-10">
                        <div className="h-5 w-5 animate-spin rounded-full border-[3px] border-slate-700/30 border-t-[#fc4f02]" />
                        Loading payouts…
                      </div>
                    ) : payouts.length === 0 ? (
                      <p className="text-xs sm:text-sm text-slate-500 text-center py-10">No payouts yet. Complete or cancel the pool to create payouts.</p>
                    ) : (
                      <div className="divide-y divide-white/[0.04]">
                        {payouts.map((p) => (
                          <div key={p.payout_id} className="px-5 sm:px-6 py-3.5 sm:py-4 hover:bg-white/[0.02] transition-colors">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-xs sm:text-sm font-medium text-white truncate">
                                  {p.member?.user?.email ?? p.member?.user?.full_name ?? p.member?.member_id}
                                </p>
                                <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">
                                  Type: <span className="capitalize">{p.payout_type.replace("_", " ")}</span> · Net: {p.net_payout} · P/L: {p.profit_loss} · Status: <span className="capitalize">{p.status}</span>
                                </p>
                                <p className="text-[10px] text-slate-500 mt-0.5">Created {new Date(p.created_at).toLocaleString()}</p>
                              </div>
                              {p.status === "pending" && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const txId = window.prompt("Binance TX ID (optional):");
                                    const notes = window.prompt("Notes (optional):");
                                    if (txId !== null && notes !== null) handleMarkPayoutPaid(p.payout_id, txId.trim() || undefined, notes.trim() || undefined);
                                  }}
                                  disabled={actionSubmitting !== null}
                                  className="rounded-lg bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 text-[10px] sm:text-xs font-semibold text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-60"
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
              <div className="w-full max-w-sm rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#1a1a2e]/95 to-[#0f0f1a]/95 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_30px_rgba(252,79,2,0.08)] p-5">
                <h3 className="text-lg font-semibold text-white">Complete pool?</h3>
                <p className="mt-2 text-sm text-slate-400">
                  Close all trades first. This will calculate final payouts for all members. You will need to transfer funds and mark each payout as paid.
                </p>
                <div className="mt-6 flex gap-3">
                  <button type="button" onClick={() => setShowCompletePoolConfirm(false)} disabled={saving} className="flex-1 rounded-xl border border-white/[0.08] px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/5 transition-colors disabled:opacity-60">Cancel</button>
                  <button type="button" onClick={handleCompletePool} disabled={saving} className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-500 hover:scale-[1.02] transition-all disabled:opacity-60">{saving ? "Completing…" : "Complete"}</button>
                </div>
              </div>
            </div>
          )}

          {/* Cancel pool confirmation */}
          {showCancelPoolConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="w-full max-w-sm rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#1a1a2e]/95 to-[#0f0f1a]/95 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_30px_rgba(252,79,2,0.08)] p-5">
                <h3 className="text-lg font-semibold text-white">Cancel pool?</h3>
                <p className="mt-2 text-sm text-slate-400">
                  This will cancel the pool and create full refund payouts for all members (no fee). Transfer refunds externally, then mark each as paid.
                </p>
                <div className="mt-6 flex gap-3">
                  <button type="button" onClick={() => setShowCancelPoolConfirm(false)} disabled={saving} className="flex-1 rounded-xl border border-white/[0.08] px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/5 transition-colors disabled:opacity-60">Cancel</button>
                  <button type="button" onClick={handleCancelPool} disabled={saving} className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-500/25 hover:bg-red-500 hover:scale-[1.02] transition-all disabled:opacity-60">{saving ? "Cancelling…" : "Cancel pool"}</button>
                </div>
              </div>
            </div>
          )}

          {/* Delete confirmation modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="w-full max-w-sm rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#1a1a2e]/95 to-[#0f0f1a]/95 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_30px_rgba(252,79,2,0.08)] p-5">
                <h3 className="text-lg font-semibold text-white">Delete pool?</h3>
                <p className="mt-2 text-sm text-slate-400">
                  Only draft pools can be deleted. This will remove the pool permanently. This cannot be undone.
                </p>
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={saving}
                    className="flex-1 rounded-xl border border-white/[0.08] px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/5 transition-colors disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={saving}
                    className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-500/25 hover:bg-red-500 hover:scale-[1.02] transition-all disabled:opacity-60"
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

