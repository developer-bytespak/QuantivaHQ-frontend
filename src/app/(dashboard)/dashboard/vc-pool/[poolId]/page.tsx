"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getVcPoolById,
  getPaymentStatus,
  joinPool,
  uploadPoolScreenshot,
  submitBinanceTx,
  cancelMembership,
  getMyCancellation,
  type VcPoolDetails,
  type PaymentStatusResponse,
  type JoinPoolResponse,
  type PaymentMethod,
  type MyCancellationResponse,
  type BinancePaymentStatus,
} from "@/lib/api/vc-pools";
import useSubscriptionStore from "@/state/subscription-store";
import { FeatureType, PlanTier } from "@/mock-data/subscription-dummy-data";
import { LockedFeatureOverlay } from "@/components/common/feature-guard";
import { useNotification, Notification } from "@/components/common/notification";

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

  // Binance TX ID submission state
  const [binanceTxId, setBinanceTxId] = useState("");
  const [binanceTxTimestamp, setBinanceTxTimestamp] = useState("");
  const [submittingTx, setSubmittingTx] = useState(false);
  const [binancePaymentStatus, setBinancePaymentStatus] = useState<BinancePaymentStatus | null>(null);
  const [txSubmissionId, setTxSubmissionId] = useState<string | null>(null);
  const [exactAmountExpected, setExactAmountExpected] = useState<number | null>(null);
  const binancePollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isMember = Boolean(paymentStatus?.membership?.exists);
  const hasReservation = Boolean(paymentStatus?.reservation);
  const payment = paymentStatus?.payment ?? null;
  const canUpload = hasReservation && payment?.payment_method === "binance" && payment?.status !== "verified" && payment?.status !== "rejected";
  const isRejected = payment?.status === "rejected";
  const availableSeats = Number(pool?.available_seats ?? 0);
  const poolStatus = pool?.status ?? "";

  // Determine if we should show the Binance TX ID form (binance method, reservation active, no TX submitted yet)
  const hasBinanceTxSubmitted = Boolean(payment && (payment as any).binance_tx_id) || Boolean(txSubmissionId);
  const canSubmitBinanceTx = hasReservation && payment?.payment_method === "binance" && !hasBinanceTxSubmitted && !isRejected && payment?.status !== "verified";
  // Determine if we're in binance auto-verification mode
  const isBinanceAutoVerifying = hasBinanceTxSubmitted && binancePaymentStatus === "pending";

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
    if (!canAccessVCPool) {
      setLoading(false);
      return;
    }
    if (!poolId) return;
    setLoading(true);
    setError(null);
    Promise.all([getVcPoolById(poolId), getPaymentStatus(poolId)])
      .then(([p, ps]) => {
        setPool(p);
        setPaymentStatus(ps);
      })
      .catch((err: unknown) => setError((err as { message?: string })?.message ?? "Failed to load"))
      .finally(() => setLoading(false));
  }, [poolId, canAccessVCPool]);

  // Poll payment status when user has an active reservation (to update timer)
  useEffect(() => {
    if (!poolId || !paymentStatus?.reservation || paymentStatus.membership?.exists) return;
    statusIntervalRef.current = setInterval(() => getPaymentStatus(poolId).then(setPaymentStatus), 30000);
    return () => {
      if (statusIntervalRef.current) clearInterval(statusIntervalRef.current);
    };
  }, [poolId, paymentStatus?.reservation?.reservation_id, paymentStatus?.membership?.exists]);

  // Load my-cancellation when user is member and pool allows cancellation
  useEffect(() => {
    if (!poolId || !canAccessVCPool || !isMember || !pool) return;
    const status = pool?.status ?? "";
    const allowCancel = status === "open" || status === "full" || status === "active";
    if (allowCancel) loadMyCancellation();
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
    } finally {
      setRequestingExit(false);
    }
  };

  const handleJoin = async () => {
    if (!poolId || !pool) return;
    setJoining(true);
    try {
      await joinPool(poolId, {
        payment_method: paymentMethod,
        ...(paymentMethod === "binance" && userBinanceUid.trim()
          ? { user_binance_uid: userBinanceUid.trim() }
          : {}),
      });
      showNotification("Seat reserved. Complete payment before the deadline.", "success");
      loadPaymentStatus();
    } catch (err: unknown) {
      showNotification((err as { message?: string })?.message ?? "Failed to join pool", "error");
    } finally {
      setJoining(false);
    }
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
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSubmitBinanceTx = async () => {
    if (!poolId || !binanceTxId.trim() || !binanceTxTimestamp) return;
    setSubmittingTx(true);
    try {
      const res = await submitBinanceTx(poolId, {
        binance_tx_id: binanceTxId.trim(),
        binance_tx_timestamp: new Date(binanceTxTimestamp).toISOString(),
      });
      setTxSubmissionId(res.submission_id);
      setExactAmountExpected(res.exact_amount_expected);
      setBinancePaymentStatus(res.binance_payment_status);
      showNotification("TX ID submitted. Auto-verification in progress…", "success");
      loadPaymentStatus();
    } catch (err: unknown) {
      showNotification((err as { message?: string })?.message ?? "Failed to submit TX ID", "error");
    } finally {
      setSubmittingTx(false);
    }
  };

  // Sync binance_payment_status from payment status polling
  useEffect(() => {
    if (payment && (payment as any).binance_payment_status) {
      setBinancePaymentStatus((payment as any).binance_payment_status as BinancePaymentStatus);
    }
    if (payment && (payment as any).binance_tx_id) {
      setTxSubmissionId((prev) => prev || (payment as any).submission_id || null);
    }
    if (payment && (payment as any).exact_amount_expected) {
      setExactAmountExpected(Number((payment as any).exact_amount_expected));
    }
  }, [payment]);

  // Poll payment status faster when binance TX is pending verification
  useEffect(() => {
    if (!poolId || !hasBinanceTxSubmitted || binancePaymentStatus !== "pending") {
      if (binancePollingRef.current) clearInterval(binancePollingRef.current);
      return;
    }
    binancePollingRef.current = setInterval(() => {
      getPaymentStatus(poolId).then((ps) => {
        setPaymentStatus(ps);
        if (ps.payment && (ps.payment as any).binance_payment_status !== "pending") {
          if (binancePollingRef.current) clearInterval(binancePollingRef.current);
        }
      });
    }, 8000); // Poll every 8 seconds
    return () => {
      if (binancePollingRef.current) clearInterval(binancePollingRef.current);
    };
  }, [poolId, hasBinanceTxSubmitted, binancePaymentStatus]);

  return (
    <div className="relative">
      {!canAccessVCPool && (
        <LockedFeatureOverlay
          featureName="VC Pool Access"
          requiredTier={PlanTier.ELITE}
          message="VC pools are available only for ELITE members. Upgrade your plan to access pool details."
        />
      )}

      {notification && (
        <Notification message={notification.message} type={notification.type} onClose={hideNotification} />
      )}

      <button
        onClick={() => router.push("/dashboard/vc-pool")}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-white/90 hover:text-[#fda300] transition-colors group"
      >
        <svg className="w-4 h-4 text-[#fc4f02] group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="text-white/90 group-hover:text-[#fda300]">Back to VC pools</span>
      </button>

      {loading && (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#fc4f02] border-t-transparent" />
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      )}

      {!loading && !error && pool && canAccessVCPool && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-gradient-to-b from-[#fc4f02]/90 via-[#fc4f02]/70 to-[#fda300]/50 p-6 sm:p-8 border border-[#fc4f02]/30">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{pool.name}</h1>
            {pool.description && (
              <p className="text-sm text-white/90 max-w-2xl mb-4">{pool.description}</p>
            )}
            <div className="grid gap-4 sm:grid-cols-3 text-xs text-white/90">
              <div>
                <p className="mb-1 text-white/70">Contribution per seat</p>
                <p className="text-lg font-semibold">
                  ${pool.contribution_amount} {pool.coin_type}
                </p>
              </div>
              <div>
                <p className="mb-1 text-white/70">Duration</p>
                <p className="text-lg font-semibold">{pool.duration_days} days</p>
              </div>
              <div>
                <p className="mb-1 text-white/70">Available seats</p>
                <p className="text-lg font-semibold">{availableSeats}</p>
              </div>
            </div>
          </div>

          {/* Already a member */}
          {isMember && (
            <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-6 space-y-4">
              <p className="text-lg font-semibold text-green-200">You are a member of this pool.</p>
              <p className="text-sm text-slate-400">Your share is locked. Pool activity will appear here when the pool is active.</p>
              {/* Phase 1E: Request to exit (open/full/active) */}
              {(poolStatus === "open" || poolStatus === "full" || poolStatus === "active") && (
                <div className="pt-4 border-t border-[--color-border]">
                  {myCancellation?.has_cancellation ? (
                    <div className="rounded-lg bg-[--color-surface-alt] p-4 text-sm">
                      <p className="font-medium text-white capitalize">Cancellation status: {myCancellation.cancellation?.status}</p>
                      {myCancellation.cancellation?.status === "pending" && (
                        <p className="mt-1 text-slate-400">Awaiting admin approval. Refund amount: {myCancellation.cancellation?.refund_amount} {pool.coin_type}</p>
                      )}
                      {myCancellation.cancellation?.status === "approved" && (
                        <p className="mt-1 text-slate-400">Approved. Admin will process the refund. Refund: {myCancellation.cancellation?.refund_amount} {pool.coin_type}</p>
                      )}
                      {myCancellation.cancellation?.status === "rejected" && myCancellation.cancellation?.rejection_reason && (
                        <p className="mt-1 text-amber-400">Rejected: {myCancellation.cancellation.rejection_reason}</p>
                      )}
                      {myCancellation.cancellation?.status === "processed" && (
                        <p className="mt-1 text-green-400">Refund completed. You have exited the pool.</p>
                      )}
                      <p className="mt-2 text-xs text-slate-500">Requested at {myCancellation.cancellation?.requested_at ? new Date(myCancellation.cancellation.requested_at).toLocaleString() : "—"}</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-slate-400 mb-2">Need to exit? Request cancellation. A fee may apply based on pool rules.</p>
                      <button
                        type="button"
                        onClick={handleRequestExit}
                        disabled={requestingExit}
                        className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-200 hover:bg-amber-500/20 disabled:opacity-60"
                      >
                        {requestingExit ? "Submitting…" : "Request to exit pool"}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Rejected: can re-join */}
          {!isMember && isRejected && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100">
              <p className="font-medium">Your previous payment was rejected.</p>
              {payment?.rejection_reason && (
                <p className="mt-1 text-amber-200/80">Reason: {payment.rejection_reason}</p>
              )}
              <p className="mt-2">You can join again below.</p>
            </div>
          )}

          {/* Active reservation: show instructions + upload OR Binance TX submission */}
          {!isMember && hasReservation && payment && !isRejected && (
            <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-6 space-y-4">
              <h2 className="text-lg font-semibold text-white">Complete your payment</h2>
              <div className="rounded-lg bg-[--color-surface-alt] p-4 text-sm text-slate-200 space-y-2">
                <p>
                  Total to pay: <span className="font-mono font-semibold text-white">{payment.total_amount} {pool.coin_type}</span>
                  {" "}(investment {payment.investment_amount} + fee {payment.pool_fee_amount})
                </p>
                {payment.payment_method === "binance" && (
                  <>
                    <p className="mt-2 font-medium text-white">Send to Admin Binance UID: {pool.admin_binance_uid || "—"}</p>
                    <p className="text-slate-400">
                      Time remaining: <span className="font-mono text-white">{paymentStatus?.reservation?.minutes_remaining ?? 0} minutes</span>
                      {" "}(deadline: {new Date(payment.payment_deadline).toLocaleString()})
                    </p>
                  </>
                )}
                {payment.payment_method === "stripe" && (
                  <p className="text-slate-400">Awaiting admin approval. No screenshot required for Stripe.</p>
                )}
              </div>

              {/* Binance payment instructions */}
              {payment.payment_method === "binance" && (
                <ul className="list-decimal list-inside text-sm text-slate-300 space-y-1">
                  <li>Open Binance → P2P → Transfer</li>
                  <li>Enter recipient UID: <span className="font-mono text-white">{pool.admin_binance_uid}</span></li>
                  <li>Send exactly <span className="font-mono font-semibold text-[#fc4f02]">{payment.total_amount} {pool.coin_type}</span></li>
                  <li>Copy the Transaction ID from Binance</li>
                  <li>Submit the TX ID below for auto-verification</li>
                </ul>
              )}

              {/* Exact amount warning */}
              {payment.payment_method === "binance" && (
                <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 flex items-start gap-3">
                  <svg className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-amber-200">Exact amount required</p>
                    <p className="text-xs text-amber-300/80 mt-0.5">
                      Amount must be exactly <span className="font-mono font-bold text-amber-100">{payment.total_amount} {pool.coin_type}</span>. 
                      Any variance (even 0.01) will result in automatic rejection and refund.
                    </p>
                  </div>
                </div>
              )}

              {/* Binance TX ID Submission Form */}
              {canSubmitBinanceTx && (
                <div className="rounded-lg border border-[--color-border] bg-[--color-surface-alt] p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-white">Submit Binance Transaction ID</h3>
                  <p className="text-xs text-slate-400">After completing payment on Binance P2P, enter the TX ID here for automatic verification.</p>
                  <div>
                    <label className="mb-1 block text-sm text-slate-300">Binance TX ID <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      value={binanceTxId}
                      onChange={(e) => setBinanceTxId(e.target.value)}
                      placeholder="e.g. TX98765432100123"
                      className="w-full rounded-xl border border-[--color-border] bg-[--color-background] px-4 py-2.5 text-white placeholder:text-slate-500 focus:border-[#fc4f02] focus:outline-none focus:ring-1 focus:ring-[#fc4f02]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-slate-300">Transaction Date & Time <span className="text-red-400">*</span></label>
                    <input
                      type="datetime-local"
                      value={binanceTxTimestamp}
                      onChange={(e) => setBinanceTxTimestamp(e.target.value)}
                      className="w-full rounded-xl border border-[--color-border] bg-[--color-background] px-4 py-2.5 text-white focus:border-[#fc4f02] focus:outline-none focus:ring-1 focus:ring-[#fc4f02] [color-scheme:dark]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSubmitBinanceTx}
                    disabled={submittingTx || !binanceTxId.trim() || !binanceTxTimestamp}
                    className="w-full rounded-lg bg-[#fc4f02] px-4 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 transition-opacity"
                  >
                    {submittingTx ? "Submitting…" : "Submit TX ID for verification"}
                  </button>
                </div>
              )}

              {/* Binance Auto-Verification Status */}
              {hasBinanceTxSubmitted && binancePaymentStatus && (
                <div className={`rounded-lg border p-4 ${
                  binancePaymentStatus === "pending"
                    ? "border-yellow-500/40 bg-yellow-500/10"
                    : binancePaymentStatus === "verified"
                    ? "border-green-500/40 bg-green-500/10"
                    : binancePaymentStatus === "rejected"
                    ? "border-red-500/40 bg-red-500/10"
                    : "border-blue-500/40 bg-blue-500/10"
                }`}>
                  <div className="flex items-center gap-3">
                    {binancePaymentStatus === "pending" && (
                      <>
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-yellow-200">Verifying with Binance…</p>
                          <p className="text-xs text-yellow-300/70 mt-0.5">Auto-verification runs every few minutes. Please wait.</p>
                        </div>
                      </>
                    )}
                    {binancePaymentStatus === "verified" && (
                      <>
                        <svg className="h-6 w-6 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="text-sm font-semibold text-green-200">Payment confirmed!</p>
                          <p className="text-xs text-green-300/70 mt-0.5">Your payment has been verified. You are now a member of this pool.</p>
                        </div>
                      </>
                    )}
                    {binancePaymentStatus === "rejected" && (
                      <>
                        <svg className="h-6 w-6 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="text-sm font-semibold text-red-200">Payment rejected</p>
                          {(payment as any)?.refund_reason && (
                            <p className="text-xs text-red-300/70 mt-0.5">{(payment as any).refund_reason}</p>
                          )}
                          <p className="text-xs text-red-300/70 mt-0.5">Seat released. Refund is being processed.</p>
                        </div>
                      </>
                    )}
                    {binancePaymentStatus === "refunded" && (
                      <>
                        <svg className="h-6 w-6 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="text-sm font-semibold text-blue-200">Refund processed</p>
                          <p className="text-xs text-blue-300/70 mt-0.5">Your payment has been refunded.</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Fallback: Screenshot upload (for cases where TX submission is not used) */}
              {canUpload && !hasBinanceTxSubmitted && (
                <div className="pt-3 border-t border-[--color-border]">
                  <p className="text-xs text-slate-400 mb-2">Alternatively, you can upload a payment screenshot for manual review:</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    onChange={handleUploadScreenshot}
                    disabled={uploading}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="rounded-lg border border-[--color-border] bg-[--color-surface-alt] px-4 py-2 text-sm font-medium text-slate-200 hover:bg-[--color-surface] disabled:opacity-60 transition-colors"
                  >
                    {uploading ? "Uploading…" : "Upload payment screenshot"}
                  </button>
                  <p className="mt-1 text-xs text-slate-500">JPEG, PNG, GIF or WebP, max 10MB</p>
                </div>
              )}

              {payment.screenshot_url && payment.status === "processing" && !hasBinanceTxSubmitted && (
                <p className="text-sm text-slate-400">Screenshot uploaded. Awaiting admin approval.</p>
              )}
            </div>
          )}

          {/* No reservation: show Join form (only if pool is open and has seats) */}
          {!isMember && !hasReservation && poolStatus === "open" && availableSeats > 0 && (
            <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-6 space-y-4">
              <h2 className="text-lg font-semibold text-white">Join this pool</h2>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm text-slate-300">Payment method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full rounded-xl border border-[--color-border] bg-[--color-background] px-4 py-2.5 text-white focus:border-[#fc4f02] focus:outline-none focus:ring-1 focus:ring-[#fc4f02]"
                  >
                    <option value="binance">Binance P2P (auto-verified)</option>
                    <option value="stripe">Stripe (awaiting admin approval)</option>
                  </select>
                </div>
                {paymentMethod === "binance" && (
                  <div>
                    <label className="mb-1 block text-sm text-slate-300">Your Binance UID (optional)</label>
                    <input
                      type="text"
                      value={userBinanceUid}
                      onChange={(e) => setUserBinanceUid(e.target.value)}
                      placeholder="e.g. 12345678"
                      className="w-full rounded-xl border border-[--color-border] bg-[--color-background] px-4 py-2.5 text-white placeholder:text-slate-500 focus:border-[#fc4f02] focus:outline-none focus:ring-1 focus:ring-[#fc4f02]"
                    />
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleJoin}
                  disabled={joining}
                  className="w-full rounded-lg bg-[#fc4f02] px-4 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                >
                  {joining ? "Reserving seat…" : "Reserve seat & get payment details"}
                </button>
              </div>
            </div>
          )}

          {!isMember && !hasReservation && (poolStatus !== "open" || availableSeats <= 0) && (
            <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-6 text-center text-slate-400 text-sm">
              {poolStatus !== "open"
                ? "This pool is not open for new members right now."
                : "No seats available. The pool is full."}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-5 text-sm text-slate-300">
              <h2 className="mb-3 text-sm font-semibold text-white">Pool details</h2>
              <dl className="space-y-2">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">Status</dt>
                  <dd className="font-medium capitalize">{poolStatus || "—"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">Max members</dt>
                  <dd className="font-medium">{pool.max_members}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">Pool fee</dt>
                  <dd className="font-medium">{pool.pool_fee_percent ?? "—"}%</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">Payment window</dt>
                  <dd className="font-medium">{pool.payment_window_minutes ?? "—"} min</dd>
                </div>
              </dl>
            </div>
            <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-5 text-sm text-slate-300">
              <h2 className="text-sm font-semibold text-white">Admin Binance UID</h2>
              <p className="mt-1 font-mono text-white">{pool.admin_binance_uid || "Not set"}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
