"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getVcPoolById,
  getPaymentStatus,
  joinPool,
  uploadPoolScreenshot,
  cancelMembership,
  getMyCancellation,
  type VcPoolDetails,
  type PaymentStatusResponse,
  type JoinPoolResponse,
  type PaymentMethod,
  type MyCancellationResponse,
} from "@/lib/api/vc-pools";
import useSubscriptionStore from "@/state/subscription-store";
import { FeatureType, PlanTier } from "@/mock-data/subscription-dummy-data";
import { LockedFeatureOverlay } from "@/components/common/feature-guard";
import { useNotification, Notification } from "@/components/common/notification";
import { getDummyPoolTradesSummary, type VcPoolTradeDummy, type InvestmentByCoin } from "@/lib/dummy/vc-pool-trades-dummy";

/* ── Helpers ────────────────────────────────────────────── */
function formatUsd(n: number | string): string {
  const v = typeof n === "string" ? Number(n) : n;
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; dot: string }> = {
    open: { bg: "bg-emerald-500/15 border-emerald-500/20", text: "text-emerald-400", dot: "bg-emerald-400 animate-pulse" },
    full: { bg: "bg-amber-500/15 border-amber-500/20", text: "text-amber-400", dot: "bg-amber-400" },
    active: { bg: "bg-blue-500/15 border-blue-500/20", text: "text-blue-400", dot: "bg-blue-400 animate-pulse" },
    completed: { bg: "bg-slate-500/15 border-slate-500/20", text: "text-slate-300", dot: "bg-slate-400" },
    cancelled: { bg: "bg-red-500/15 border-red-500/20", text: "text-red-400", dot: "bg-red-400" },
  };
  const s = map[status] ?? map.open;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function VcPoolDetailPage() {
  const params = useParams<{ poolId: string }>();
  const router = useRouter();
  const poolId = String(params.poolId ?? "");
  const { canAccessFeature } = useSubscriptionStore();
  const canAccessVCPool = canAccessFeature(FeatureType.VC_POOL_ACCESS);
  const { notification, showNotification, hideNotification } = useNotification();

  const [pool, setPool] = useState<VcPoolDetails | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("binance");
  const [userBinanceUid, setUserBinanceUid] = useState("");
  const [uploading, setUploading] = useState(false);
  const [myCancellation, setMyCancellation] = useState<MyCancellationResponse | null>(null);
  const [requestingExit, setRequestingExit] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const statusIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isMember = Boolean(paymentStatus?.membership?.exists);
  const hasReservation = Boolean(paymentStatus?.reservation);
  const payment = paymentStatus?.payment ?? null;
  const canUpload = hasReservation && payment?.payment_method === "binance" && payment?.status !== "verified" && payment?.status !== "rejected";
  const isRejected = payment?.status === "rejected";
  const availableSeats = Number(pool?.available_seats ?? 0);
  const poolStatus = pool?.status ?? "";

  const loadPool = () => {
    if (!poolId) return;
    getVcPoolById(poolId)
      .then(setPool)
      .catch((err: unknown) => setError((err as { message?: string })?.message ?? "Failed to load pool"));
  };

  const loadPaymentStatus = () => {
    if (!poolId || !canAccessVCPool) return;
    getPaymentStatus(poolId)
      .then(setPaymentStatus)
      .catch(() => setPaymentStatus(null));
  };

  const loadMyCancellation = () => {
    if (!poolId || !canAccessVCPool) return;
    getMyCancellation(poolId)
      .then(setMyCancellation)
      .catch(() => setMyCancellation(null));
  };

  useEffect(() => {
    if (!canAccessVCPool) { setLoading(false); return; }
    if (!poolId) return;
    setLoading(true);
    setError(null);
    Promise.all([getVcPoolById(poolId), getPaymentStatus(poolId)])
      .then(([p, ps]) => { setPool(p); setPaymentStatus(ps); })
      .catch((err: unknown) => setError((err as { message?: string })?.message ?? "Failed to load"))
      .finally(() => setLoading(false));
  }, [poolId, canAccessVCPool]);

  useEffect(() => {
    if (!poolId || !paymentStatus?.reservation || paymentStatus.membership?.exists) return;
    statusIntervalRef.current = setInterval(() => getPaymentStatus(poolId).then(setPaymentStatus), 30000);
    return () => { if (statusIntervalRef.current) clearInterval(statusIntervalRef.current); };
  }, [poolId, paymentStatus?.reservation?.reservation_id, paymentStatus?.membership?.exists]);

  useEffect(() => {
    if (!poolId || !canAccessVCPool || !isMember || !pool) return;
    const s = pool?.status ?? "";
    if (s === "open" || s === "full" || s === "active") loadMyCancellation();
  }, [poolId, canAccessVCPool, isMember, pool?.status]);

  const handleRequestExit = async () => {
    if (!poolId) return;
    setRequestingExit(true);
    try {
      await cancelMembership(poolId);
      showNotification("Cancellation request submitted. Awaiting admin approval.", "success");
      loadMyCancellation();
      loadPaymentStatus();
    } catch (err: unknown) {
      showNotification((err as { message?: string })?.message ?? "Failed to request exit", "error");
    } finally { setRequestingExit(false); }
  };

  const handleJoin = async () => {
    if (!poolId || !pool) return;
    setJoining(true);
    try {
      await joinPool(poolId, {
        payment_method: paymentMethod,
        ...(paymentMethod === "binance" && userBinanceUid.trim() ? { user_binance_uid: userBinanceUid.trim() } : {}),
      });
      showNotification("Seat reserved. Complete payment before the deadline.", "success");
      loadPaymentStatus();
    } catch (err: unknown) {
      showNotification((err as { message?: string })?.message ?? "Failed to join pool", "error");
    } finally { setJoining(false); }
  };

  const handleUploadScreenshot = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !poolId) return;
    setUploading(true);
    try {
      await uploadPoolScreenshot(poolId, file);
      showNotification("Screenshot uploaded. Awaiting admin approval.", "success");
      loadPaymentStatus();
    } catch (err: unknown) {
      showNotification((err as { message?: string })?.message ?? "Upload failed", "error");
    } finally { setUploading(false); e.target.value = ""; }
  };

  /* ── Card wrapper ─────────────────────── */
  const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`rounded-xl sm:rounded-2xl bg-gradient-to-br from-white/[0.07] to-transparent border border-white/[0.06] backdrop-blur p-5 sm:p-6 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.04)] ${className}`}>
      {children}
    </div>
  );

  const filledSeats = pool ? pool.max_members - availableSeats : 0;
  const totalSeats = pool?.max_members ?? 0;
  const progress = totalSeats > 0 ? Math.min(100, (filledSeats / totalSeats) * 100) : 0;

  const tradesSummary = useMemo(() => {
    if (!poolId || !pool) return null;
    return getDummyPoolTradesSummary(poolId, pool.coin_type || "USDT");
  }, [poolId, pool?.coin_type]);

  return (
    <div className="relative">
      {!canAccessVCPool && (
        <LockedFeatureOverlay featureName="VC Pool Access" requiredTier={PlanTier.ELITE} message="VC pools are available only for ELITE members. Upgrade your plan to access pool details." />
      )}
      {notification && <Notification message={notification.message} type={notification.type} onClose={hideNotification} />}

      {/* Back button */}
      <button
        onClick={() => router.push("/dashboard/vc-pool")}
        className="mb-5 sm:mb-6 inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-400 hover:text-[#fc4f02] transition-colors group"
      >
        <svg className="h-4 w-4 sm:h-5 sm:w-5 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to VC Pools
      </button>

      {/* Loading */}
      {loading && (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-6 w-6 sm:h-8 sm:w-8 animate-spin rounded-full border-4 border-slate-700/30 border-t-[#fc4f02]" />
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-xl border-l-4 border-red-500/50 bg-red-500/10 p-4 text-sm text-red-200">
          <p className="font-medium">Error loading pool</p>
          <p className="mt-1 text-xs text-red-300/70">{error}</p>
        </div>
      )}

      {/* Pool content */}
      {!loading && !error && pool && canAccessVCPool && (
        <div className="space-y-5 sm:space-y-6">

          {/* ── Hero Header ─────────────────────── */}
          <div className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-[#fc4f02]/20 bg-gradient-to-br from-[#fc4f02]/12 via-[#fda300]/6 to-transparent p-5 sm:p-8">
            {/* Decorative glow */}
            <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-[#fc4f02]/10 blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <StatusBadge status={poolStatus} />
                    {isMember && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-400">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        Member
                      </span>
                    )}
                  </div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{pool.name}</h1>
                  {pool.description && (
                    <p className="mt-2 text-xs sm:text-sm text-slate-300/80 max-w-2xl">{pool.description}</p>
                  )}
                </div>
              </div>

              {/* Header stats */}
              <div className="mt-5 sm:mt-6 grid gap-3 grid-cols-2 sm:grid-cols-4">
                <div className="rounded-lg bg-black/20 border border-white/[0.04] p-3">
                  <p className="text-[10px] sm:text-xs text-slate-400/80">Investment / seat</p>
                  <p className="mt-1 text-base sm:text-lg font-bold text-white">${pool.contribution_amount}</p>
                  <p className="text-[10px] text-slate-500">{pool.coin_type}</p>
                </div>
                <div className="rounded-lg bg-black/20 border border-white/[0.04] p-3">
                  <p className="text-[10px] sm:text-xs text-slate-400/80">Duration</p>
                  <p className="mt-1 text-base sm:text-lg font-bold text-white">{pool.duration_days} days</p>
                  {pool.started_at && <p className="text-[10px] text-slate-500">Since {new Date(pool.started_at).toLocaleDateString()}</p>}
                </div>
                <div className="rounded-lg bg-black/20 border border-white/[0.04] p-3">
                  <p className="text-[10px] sm:text-xs text-slate-400/80">Available seats</p>
                  <p className={`mt-1 text-base sm:text-lg font-bold ${availableSeats > 0 ? "text-white" : "text-amber-400"}`}>{availableSeats}</p>
                  <p className="text-[10px] text-slate-500">of {pool.max_members} total</p>
                </div>
                <div className="rounded-lg bg-black/20 border border-white/[0.04] p-3">
                  <p className="text-[10px] sm:text-xs text-slate-400/80">Pool fee</p>
                  <p className="mt-1 text-base sm:text-lg font-bold text-emerald-400">{pool.pool_fee_percent ?? "—"}%</p>
                  <p className="text-[10px] text-slate-500">{pool.payment_window_minutes ?? "—"} min window</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-400 mb-1.5">
                  <span>Funding progress</span>
                  <span className="font-medium text-slate-300">{filledSeats}/{totalSeats} seats filled</span>
                </div>
                <div className="h-1.5 sm:h-2 w-full overflow-hidden rounded-full bg-slate-800/60">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${progress >= 100 ? "bg-gradient-to-r from-amber-500 to-amber-400" : "bg-gradient-to-r from-[#fc4f02] to-[#fda300]"}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Member Status ───────────────────── */}
          {isMember && (
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/20">
                  <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-base sm:text-lg font-semibold text-emerald-400">You are a member</p>
                  <p className="text-xs text-slate-400">Your share is locked. Pool activity will appear when the pool is active.</p>
                </div>
              </div>

              {/* Cancellation section */}
              {(poolStatus === "open" || poolStatus === "full" || poolStatus === "active") && (
                <div className="pt-4 border-t border-white/[0.06]">
                  {myCancellation?.has_cancellation ? (
                    <div className="rounded-lg bg-white/[0.03] border border-white/[0.04] p-4 text-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <p className="font-medium text-white capitalize">Cancellation: {myCancellation.cancellation?.status}</p>
                      </div>
                      {myCancellation.cancellation?.status === "pending" && (
                        <p className="text-slate-400">Awaiting admin approval. Refund: {myCancellation.cancellation?.refund_amount} {pool.coin_type}</p>
                      )}
                      {myCancellation.cancellation?.status === "approved" && (
                        <p className="text-slate-400">Approved. Admin will process refund: {myCancellation.cancellation?.refund_amount} {pool.coin_type}</p>
                      )}
                      {myCancellation.cancellation?.status === "rejected" && myCancellation.cancellation?.rejection_reason && (
                        <p className="text-amber-400">Rejected: {myCancellation.cancellation.rejection_reason}</p>
                      )}
                      {myCancellation.cancellation?.status === "processed" && (
                        <p className="text-emerald-400">Refund completed. You have exited the pool.</p>
                      )}
                      <p className="mt-2 text-[10px] text-slate-500">
                        Requested {myCancellation.cancellation?.requested_at ? new Date(myCancellation.cancellation.requested_at).toLocaleString() : "—"}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <p className="text-xs sm:text-sm text-slate-400">Need to exit? Request cancellation. A fee may apply.</p>
                      <button
                        type="button"
                        onClick={handleRequestExit}
                        disabled={requestingExit}
                        className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs sm:text-sm font-semibold text-amber-300 hover:bg-amber-500/20 hover:border-amber-500/50 transition-all disabled:opacity-60 w-fit"
                      >
                        {requestingExit ? "Submitting…" : "Request to exit pool"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}

          {/* ── Rejected warning ────────────────── */}
          {!isMember && isRejected && (
            <div className="rounded-xl border-l-4 border-amber-500/50 bg-amber-500/10 p-4 text-sm">
              <p className="font-medium text-amber-200">Your previous payment was rejected</p>
              {payment?.rejection_reason && <p className="mt-1 text-amber-300/70">Reason: {payment.rejection_reason}</p>}
              <p className="mt-2 text-slate-300">You can join again below.</p>
            </div>
          )}

          {/* ── Payment in progress ─────────────── */}
          {!isMember && hasReservation && payment && !isRejected && (
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fc4f02]/15 border border-[#fc4f02]/20">
                  <svg className="h-5 w-5 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-white">Complete your payment</h2>
                  <p className="text-xs text-slate-400">Finish payment before the deadline to secure your seat</p>
                </div>
              </div>

              {/* Payment info card */}
              <div className="rounded-lg bg-white/[0.03] border border-white/[0.04] p-4 space-y-3 text-sm">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <div>
                    <p className="text-[10px] text-slate-500">Total to pay</p>
                    <p className="font-mono text-base font-bold text-white">{payment.total_amount} {pool.coin_type}</p>
                  </div>
                  <div className="hidden sm:block h-8 w-px bg-white/[0.06]" />
                  <div>
                    <p className="text-[10px] text-slate-500">Investment</p>
                    <p className="font-mono font-medium text-slate-300">{payment.investment_amount}</p>
                  </div>
                  <div className="hidden sm:block h-8 w-px bg-white/[0.06]" />
                  <div>
                    <p className="text-[10px] text-slate-500">Fee</p>
                    <p className="font-mono font-medium text-slate-300">{payment.pool_fee_amount}</p>
                  </div>
                </div>

                {payment.payment_method === "binance" && (
                  <div className="pt-3 border-t border-white/[0.04] space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-xs text-slate-400">Admin Binance UID:</p>
                      <span className="font-mono text-sm font-medium text-white bg-white/[0.04] px-2 py-0.5 rounded">{pool.admin_binance_uid || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <svg className="h-4 w-4 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-slate-400">
                        Time remaining: <span className="font-mono font-medium text-white">{paymentStatus?.reservation?.minutes_remaining ?? 0} min</span>
                        {" · "}Deadline: {new Date(payment.payment_deadline).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
                {payment.payment_method === "stripe" && (
                  <p className="text-xs text-slate-400 pt-2 border-t border-white/[0.04]">Awaiting admin approval. No screenshot required for Stripe.</p>
                )}
              </div>

              {/* Binance instructions */}
              {payment.payment_method === "binance" && (
                <div className="mt-4 rounded-lg bg-white/[0.02] border border-white/[0.04] p-4">
                  <p className="text-xs font-medium text-white mb-3">Payment steps:</p>
                  <ol className="space-y-2 text-xs text-slate-300">
                    {[
                      "Open Binance → Transfer → Internal Transfer",
                      `Enter recipient UID: ${pool.admin_binance_uid}`,
                      `Send exactly ${payment.total_amount} ${pool.coin_type}`,
                      "Take a screenshot of the completed transfer",
                      "Upload the screenshot below before the timer expires",
                    ].map((step, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-[#fc4f02]/15 text-[10px] font-bold text-[#fc4f02]">{i + 1}</span>
                        <span className="pt-0.5">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Upload button */}
              {canUpload && (
                <div className="mt-4">
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={handleUploadScreenshot} disabled={uploading} />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#fc4f02]/25 hover:shadow-[#fc4f02]/40 hover:scale-[1.02] transition-all disabled:opacity-60"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    {uploading ? "Uploading…" : "Upload payment screenshot"}
                  </button>
                  <p className="mt-1.5 text-[10px] text-slate-500">JPEG, PNG, GIF or WebP — max 10 MB</p>
                </div>
              )}

              {payment.screenshot_url && payment.status === "processing" && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs text-emerald-400">
                  <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Screenshot uploaded. Awaiting admin approval.
                </div>
              )}
            </Card>
          )}

          {/* ── Join Form ───────────────────────── */}
          {!isMember && !hasReservation && poolStatus === "open" && availableSeats > 0 && (
            <Card>
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fc4f02]/15 border border-[#fc4f02]/20">
                  <svg className="h-5 w-5 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-white">Join this pool</h2>
                  <p className="text-xs text-slate-400">Reserve your seat and complete payment</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs sm:text-sm font-medium text-slate-300">Payment method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-[#fc4f02]/50 focus:outline-none focus:ring-1 focus:ring-[#fc4f02]/30 transition-all"
                  >
                    <option value="binance">Binance (transfer + screenshot)</option>
                    <option value="stripe">Stripe (awaiting admin approval)</option>
                  </select>
                </div>
                {paymentMethod === "binance" && (
                  <div>
                    <label className="mb-1.5 block text-xs sm:text-sm font-medium text-slate-300">Your Binance UID <span className="text-slate-500">(optional)</span></label>
                    <input
                      type="text"
                      value={userBinanceUid}
                      onChange={(e) => setUserBinanceUid(e.target.value)}
                      placeholder="e.g. 12345678"
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-[#fc4f02]/50 focus:outline-none focus:ring-1 focus:ring-[#fc4f02]/30 transition-all"
                    />
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleJoin}
                  disabled={joining}
                  className="w-full rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#fc4f02]/25 hover:shadow-[#fc4f02]/40 hover:scale-[1.01] transition-all disabled:opacity-60"
                >
                  {joining ? "Reserving seat…" : "Reserve seat & get payment details"}
                </button>
              </div>
            </Card>
          )}

          {/* ── Pool closed / full ──────────────── */}
          {!isMember && !hasReservation && (poolStatus !== "open" || availableSeats <= 0) && (
            <Card className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-500/10 border border-slate-500/20">
                <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <p className="text-sm text-slate-400">
                {poolStatus !== "open" ? "This pool is not open for new members right now." : "No seats available. The pool is full."}
              </p>
            </Card>
          )}

          {/* ── Pool Details Grid ───────────────── */}
          <div className="grid gap-4 sm:gap-5 sm:grid-cols-2">
            <Card>
              <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="h-4 w-4 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Pool Details
              </h2>
              <dl className="space-y-3 text-sm">
                {[
                  { label: "Status", value: poolStatus || "—", capitalize: true },
                  { label: "Max members", value: String(pool.max_members) },
                  { label: "Verified members", value: String(pool.verified_members_count) },
                  { label: "Pool fee", value: `${pool.pool_fee_percent ?? "—"}%` },
                  { label: "Payment window", value: `${pool.payment_window_minutes ?? "—"} min` },
                  ...(pool.started_at ? [{ label: "Started", value: new Date(pool.started_at).toLocaleDateString() }] : []),
                  ...(pool.end_date ? [{ label: "Ends", value: new Date(pool.end_date).toLocaleDateString() }] : []),
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 py-1.5 border-b border-white/[0.03] last:border-0">
                    <dt className="text-slate-400 text-xs sm:text-sm">{item.label}</dt>
                    <dd className={`font-medium text-white text-xs sm:text-sm ${item.capitalize ? "capitalize" : ""}`}>{item.value}</dd>
                  </div>
                ))}
              </dl>
            </Card>

            <Card>
              <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="h-4 w-4 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Payment Info
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-400 mb-1">Admin Binance UID</p>
                  <p className="font-mono text-sm font-medium text-white bg-white/[0.03] border border-white/[0.04] rounded-lg px-3 py-2">
                    {pool.admin_binance_uid || "Not set"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-400 mb-1">Contribution per seat</p>
                  <p className="text-lg font-bold text-white">${pool.contribution_amount} <span className="text-sm font-normal text-slate-400">{pool.coin_type}</span></p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-400 mb-1">Created</p>
                  <p className="text-sm text-white">{new Date(pool.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* ── Investment & P/L Summary + Trades (dummy data) ───────────────── */}
          {tradesSummary && (
            <>
              {/* Total invested by coin + Total P/L */}
              <Card>
                <h2 className="text-base sm:text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <svg className="h-5 w-5 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Investment & P/L Summary
                </h2>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                  {tradesSummary.investment_by_coin.map((row: InvestmentByCoin) => (
                    <div key={row.coin} className="rounded-lg bg-white/[0.03] border border-white/[0.04] p-4">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Total invested ({row.coin})</p>
                      <p className="text-lg font-bold text-white">{row.total_invested.toLocaleString(undefined, { minimumFractionDigits: 2 })} {row.coin}</p>
                      <p className="text-xs text-slate-400 mt-1">Current value: {row.total_current_value.toLocaleString(undefined, { minimumFractionDigits: 2 })} {row.coin}</p>
                    </div>
                  ))}
                  <div className="rounded-lg bg-white/[0.03] border border-white/[0.04] p-4">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Total P/L</p>
                    <p className={`text-lg font-bold ${tradesSummary.total_pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {tradesSummary.total_pnl >= 0 ? "+" : ""}{tradesSummary.total_pnl.toLocaleString(undefined, { minimumFractionDigits: 2 })} {pool.coin_type}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">{tradesSummary.total_pnl_percent >= 0 ? "+" : ""}{tradesSummary.total_pnl_percent.toFixed(2)}%</p>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-3">Simulated data until real trades are linked.</p>
              </Card>

              {/* Active trades (open positions) */}
              <Card>
                <h2 className="text-base sm:text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Active Trades ({tradesSummary.active_trades.length})
                </h2>
                <div className="overflow-x-auto -mx-1">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-400 border-b border-white/[0.06]">
                        <th className="pb-2 pr-3 font-medium">Pair</th>
                        <th className="pb-2 pr-3 font-medium">Side</th>
                        <th className="pb-2 pr-3 font-medium">Entry</th>
                        <th className="pb-2 pr-3 font-medium">Current</th>
                        <th className="pb-2 pr-3 font-medium">Amount</th>
                        <th className="pb-2 pr-3 font-medium">P/L</th>
                        <th className="pb-2 font-medium">Opened</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tradesSummary.active_trades.map((t: VcPoolTradeDummy) => (
                        <tr key={t.trade_id} className="border-b border-white/[0.04] last:border-0">
                          <td className="py-2.5 pr-3 font-medium text-white">{t.pair}</td>
                          <td className="py-2.5 pr-3">
                            <span className={t.side === "buy" ? "text-emerald-400" : "text-rose-400"}>{t.side.toUpperCase()}</span>
                          </td>
                          <td className="py-2.5 pr-3 text-slate-300">{t.entry_price.toLocaleString()}</td>
                          <td className="py-2.5 pr-3 text-slate-300">{t.current_price?.toLocaleString() ?? "—"}</td>
                          <td className="py-2.5 pr-3 text-slate-300">{t.amount_quote.toLocaleString()} {t.coin}</td>
                          <td className={`py-2.5 pr-3 font-medium ${t.pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                            {t.pnl >= 0 ? "+" : ""}{t.pnl.toFixed(2)} ({t.pnl_percent >= 0 ? "+" : ""}{t.pnl_percent.toFixed(2)}%)
                          </td>
                          <td className="py-2.5 text-slate-500 text-xs">{new Date(t.opened_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Trade history (closed) */}
              <Card>
                <h2 className="text-base sm:text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Trade History ({tradesSummary.history_trades.length})
                </h2>
                <div className="overflow-x-auto -mx-1">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-400 border-b border-white/[0.06]">
                        <th className="pb-2 pr-3 font-medium">Pair</th>
                        <th className="pb-2 pr-3 font-medium">Side</th>
                        <th className="pb-2 pr-3 font-medium">Entry</th>
                        <th className="pb-2 pr-3 font-medium">Exit</th>
                        <th className="pb-2 pr-3 font-medium">Amount</th>
                        <th className="pb-2 pr-3 font-medium">P/L</th>
                        <th className="pb-2 pr-3 font-medium">Opened</th>
                        <th className="pb-2 font-medium">Closed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tradesSummary.history_trades.map((t: VcPoolTradeDummy) => (
                        <tr key={t.trade_id} className="border-b border-white/[0.04] last:border-0">
                          <td className="py-2.5 pr-3 font-medium text-white">{t.pair}</td>
                          <td className="py-2.5 pr-3">
                            <span className={t.side === "buy" ? "text-emerald-400" : "text-rose-400"}>{t.side.toUpperCase()}</span>
                          </td>
                          <td className="py-2.5 pr-3 text-slate-300">{t.entry_price.toLocaleString()}</td>
                          <td className="py-2.5 pr-3 text-slate-300">{t.exit_price?.toLocaleString() ?? "—"}</td>
                          <td className="py-2.5 pr-3 text-slate-300">{t.amount_quote.toLocaleString()} {t.coin}</td>
                          <td className={`py-2.5 pr-3 font-medium ${t.pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                            {t.pnl >= 0 ? "+" : ""}{t.pnl.toFixed(2)} ({t.pnl_percent >= 0 ? "+" : ""}{t.pnl_percent.toFixed(2)}%)
                          </td>
                          <td className="py-2.5 pr-3 text-slate-500 text-xs">{new Date(t.opened_at).toLocaleString()}</td>
                          <td className="py-2.5 text-slate-500 text-xs">{t.closed_at ? new Date(t.closed_at).toLocaleString() : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  );
}
