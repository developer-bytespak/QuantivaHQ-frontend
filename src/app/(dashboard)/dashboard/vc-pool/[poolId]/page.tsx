"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getVcPoolById,
  getPaymentStatus,
  joinPool,
  uploadPoolScreenshot,
  type VcPoolDetails,
  type PaymentStatusResponse,
  type JoinPoolResponse,
  type PaymentMethod,
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const statusIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const isMember = paymentStatus?.membership?.exists;
  const hasReservation = !!paymentStatus?.reservation;
  const payment = paymentStatus?.payment;
  const canUpload = hasReservation && payment?.payment_method === "binance" && payment?.status !== "verified" && payment?.status !== "rejected";
  const isRejected = payment?.status === "rejected";

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
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to VC pools
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
                <p className="text-lg font-semibold">{pool.available_seats}</p>
              </div>
            </div>
          </div>

          {/* Already a member */}
          {isMember && (
            <div className="rounded-xl border border-green-500/40 bg-green-500/10 p-6 text-center">
              <p className="text-lg font-semibold text-green-200">You are a member of this pool.</p>
              <p className="text-sm text-green-200/80 mt-1">Your share is locked. Pool activity will appear here when the pool is active.</p>
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

          {/* Active reservation: show instructions + upload (binance) or awaiting (stripe) */}
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
                      Time remaining: <span className="font-mono text-white">{paymentStatus.reservation?.minutes_remaining ?? 0} minutes</span>
                      {" "}(deadline: {new Date(payment.payment_deadline).toLocaleString()})
                    </p>
                  </>
                )}
                {payment.payment_method === "stripe" && (
                  <p className="text-slate-400">Awaiting admin approval. No screenshot required for Stripe.</p>
                )}
              </div>
              {payment.payment_method === "binance" && (
                <ul className="list-decimal list-inside text-sm text-slate-300 space-y-1">
                  <li>Open Binance → Transfer → Internal Transfer</li>
                  <li>Enter recipient UID: {pool.admin_binance_uid}</li>
                  <li>Send exactly {payment.total_amount} {pool.coin_type}</li>
                  <li>Take a screenshot of the completed transfer</li>
                  <li>Upload the screenshot below before the timer expires</li>
                </ul>
              )}
              {canUpload && (
                <div>
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
                    className="rounded-lg bg-[#fc4f02] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                  >
                    {uploading ? "Uploading…" : "Upload payment screenshot"}
                  </button>
                  <p className="mt-1 text-xs text-slate-400">JPEG, PNG, GIF or WebP, max 10MB</p>
                </div>
              )}
              {payment.screenshot_url && payment.status === "processing" && (
                <p className="text-sm text-slate-400">Screenshot uploaded. Awaiting admin approval.</p>
              )}
            </div>
          )}

          {/* No reservation: show Join form (only if pool is open and has seats) */}
          {!isMember && !hasReservation && pool.status === "open" && pool.available_seats > 0 && (
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
                    <option value="binance">Binance (transfer + screenshot)</option>
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

          {!isMember && !hasReservation && (pool.status !== "open" || pool.available_seats <= 0) && (
            <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-6 text-center text-slate-400 text-sm">
              {pool.status !== "open"
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
                  <dd className="font-medium capitalize">{pool.status}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">Max members</dt>
                  <dd className="font-medium">{pool.max_members}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">Pool fee</dt>
                  <dd className="font-medium">{pool.pool_fee_percent}%</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">Payment window</dt>
                  <dd className="font-medium">{pool.payment_window_minutes} min</dd>
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
