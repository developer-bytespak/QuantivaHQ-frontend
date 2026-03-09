"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getVcPoolById,
  getPaymentStatus,
  joinPool,
  submitTxHash,
  cancelMembership,
  getMyCancellation,
  type VcPoolDetails,
  type PaymentStatusResponse,
  type JoinPoolResponse,
  type PaymentMethod,
  type MyCancellationResponse,
  type PaymentStatus,
} from "@/lib/api/vc-pools";
import useSubscriptionStore from "@/state/subscription-store";
import { FeatureType, PlanTier } from "@/mock-data/subscription-dummy-data";
import { LockedFeatureOverlay } from "@/components/common/feature-guard";
import {
  useNotification,
  Notification,
} from "@/components/common/notification";

/* ──────── join-flow step type ──────── */
type JoinFlowStep = "idle" | "enter-wallet" | "payment-details" | "submit-tx";

const STEP_LABELS = [
  "Wallet Address",
  "Payment Details",
  "Submit TX Hash",
] as const;

const stepIndex = (s: JoinFlowStep): number =>
  s === "enter-wallet"
    ? 0
    : s === "payment-details"
    ? 1
    : s === "submit-tx"
    ? 2
    : -1;

/* ──────── helpers ──────── */
const pad2 = (n: number) => n.toString().padStart(2, "0");
const fmtCountdown = (sec: number) =>
  `${pad2(Math.floor(sec / 60))}:${pad2(sec % 60)}`;
const truncAddr = (addr: string) =>
  addr.length > 14 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr;

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════ */
export default function VcPoolDetailPage() {
  const params = useParams<{ poolId: string }>();
  const router = useRouter();
  const poolId = String(params.poolId ?? "");
  const { canAccessFeature } = useSubscriptionStore();
  const canAccessVCPool = canAccessFeature(FeatureType.VC_POOL_ACCESS);
  const { notification, showNotification, hideNotification } =
    useNotification();

  /* ── core data ── */
  const [pool, setPool] = useState<VcPoolDetails | null>(null);
  const [paymentStatus, setPaymentStatus] =
    useState<PaymentStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myCancellation, setMyCancellation] =
    useState<MyCancellationResponse | null>(null);

  /* ── join-flow ── */
  const [joinStep, setJoinStep] = useState<JoinFlowStep>("idle");
  const [paymentMethod] = useState<PaymentMethod>("binance");
  const [userWalletAddress, setUserWalletAddress] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinResponse, setJoinResponse] = useState<JoinPoolResponse | null>(
    null
  );

  /* ── TX submission ── */
  const [txHash, setTxHash] = useState("");
  const [submittingTx, setSubmittingTx] = useState(false);
  const [paymentVerifyStatus, setPaymentVerifyStatus] =
    useState<PaymentStatus | null>(null);
  const [txSubmitted, setTxSubmitted] = useState(false);

  /* ── countdown ── */
  const [timeRemaining, setTimeRemaining] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── cancellation ── */
  const [requestingExit, setRequestingExit] = useState(false);

  /* ── polling refs ── */
  const statusIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const verifyPollingRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  /* ── derived ── */
  const isMember = Boolean(paymentStatus?.membership?.exists);
  const hasReservation = Boolean(paymentStatus?.reservation);
  const payment = paymentStatus?.payment ?? null;
  const isRejected = payment?.status === "rejected";
  const availableSeats = Number(pool?.available_seats ?? 0);
  const poolStatus = pool?.status ?? "";
  const hasTxSubmitted =
    Boolean(payment?.tx_hash) ||
    Boolean(payment?.binance_tx_id) ||
    txSubmitted;

  /* calculated amounts (from payment or joinResponse) */
  const totalAmount =
    payment?.total_amount ?? joinResponse?.total_amount?.toString() ?? null;
  const investmentAmount =
    payment?.investment_amount ??
    joinResponse?.investment_amount?.toString() ??
    null;
  const feeAmount =
    payment?.pool_fee_amount ??
    joinResponse?.pool_fee_amount?.toString() ??
    null;
  const adminWalletAddr =
    pool?.admin_wallet_address ?? joinResponse?.admin_wallet_address ?? null;
  const paymentNetwork =
    pool?.payment_network ?? joinResponse?.payment_network ?? "BSC";
  const depositCoin =
    pool?.deposit_coin ?? joinResponse?.deposit_coin ?? "USDT";
  const currentStepIdx = stepIndex(joinStep);

  /* ──────── data loaders ──────── */
  const loadPool = () => {
    if (!poolId) return;
    getVcPoolById(poolId)
      .then(setPool)
      .catch((err: unknown) =>
        setError(
          (err as { message?: string })?.message ?? "Failed to load pool"
        )
      );
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

  /* ──────── initial load ──────── */
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
      .catch((err: unknown) =>
        setError(
          (err as { message?: string })?.message ?? "Failed to load"
        )
      )
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poolId, canAccessVCPool]);

  /* ──────── auto-detect step on data load ──────── */
  useEffect(() => {
    if (loading || !pool || !canAccessVCPool) return;
    if (isMember || isRejected) {
      setJoinStep("idle");
      return;
    }
    if (hasReservation && payment) {
      const hasTx =
        Boolean(payment.tx_hash) || Boolean(payment.binance_tx_id);
      if (hasTx) {
        setTxSubmitted(true);
        setJoinStep("submit-tx");
      } else {
        setJoinStep("payment-details");
      }
      return;
    }
    setJoinStep("idle");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    loading,
    pool,
    canAccessVCPool,
    isMember,
    isRejected,
    hasReservation,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    !!payment,
  ]);

  /* ──────── sync payment status from polling ──────── */
  useEffect(() => {
    if (!payment) return;
    const ps = (payment.payment_status ??
      payment.binance_payment_status) as PaymentStatus | null;
    if (ps) setPaymentVerifyStatus(ps);
  }, [payment]);

  /* ──────── countdown timer ──────── */
  useEffect(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (!hasReservation || !paymentStatus?.reservation) {
      setTimeRemaining(0);
      return;
    }
    const deadline = new Date(
      paymentStatus.reservation.expires_at
    ).getTime();
    const tick = () => {
      const rem = Math.max(
        0,
        Math.floor((deadline - Date.now()) / 1000)
      );
      setTimeRemaining(rem);
      if (rem <= 0 && countdownRef.current)
        clearInterval(countdownRef.current);
    };
    tick();
    countdownRef.current = setInterval(tick, 1000);
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasReservation, paymentStatus?.reservation?.expires_at]);

  /* ──────── poll payment status while reservation active ──────── */
  useEffect(() => {
    if (!poolId || !hasReservation || isMember) return;
    statusIntervalRef.current = setInterval(
      () => getPaymentStatus(poolId).then(setPaymentStatus),
      30000
    );
    return () => {
      if (statusIntervalRef.current)
        clearInterval(statusIntervalRef.current);
    };
  }, [poolId, hasReservation, isMember]);

  /* ──────── fast polling when TX submitted and pending admin approval ──────── */
  useEffect(() => {
    if (
      !poolId ||
      !hasTxSubmitted ||
      (paymentVerifyStatus !== "pending" &&
        paymentVerifyStatus !== null &&
        payment?.status !== "processing")
    ) {
      if (verifyPollingRef.current)
        clearInterval(verifyPollingRef.current);
      return;
    }
    verifyPollingRef.current = setInterval(() => {
      getPaymentStatus(poolId).then((ps) => {
        setPaymentStatus(ps);
        const s =
          ps.payment?.payment_status ?? ps.payment?.binance_payment_status;
        if (
          s &&
          s !== "pending" &&
          ps.payment?.status !== "processing"
        ) {
          if (verifyPollingRef.current)
            clearInterval(verifyPollingRef.current);
        }
      });
    }, 8000);
    return () => {
      if (verifyPollingRef.current)
        clearInterval(verifyPollingRef.current);
    };
  }, [poolId, hasTxSubmitted, paymentVerifyStatus, payment?.status]);

  /* ──────── load cancellation for members ──────── */
  useEffect(() => {
    if (!poolId || !canAccessVCPool || !isMember || !pool) return;
    const s = pool.status ?? "";
    if (["open", "full", "active"].includes(s)) loadMyCancellation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poolId, canAccessVCPool, isMember, pool?.status]);

  /* ═══════════════════════ HANDLERS ═══════════════════════ */

  /** Step 0 → Step 1 */
  const handleStartJoin = () => setJoinStep("enter-wallet");

  /** Step 1 → Step 2: confirm wallet & create reservation */
  const handleConfirmWallet = async () => {
    if (!poolId || !pool) return;
    if (!userWalletAddress.trim()) {
      showNotification("Please enter your wallet address", "error");
      return;
    }
    setJoining(true);
    try {
      const res = await joinPool(poolId, {
        payment_method: paymentMethod,
        user_wallet_address: userWalletAddress.trim(),
      });
      setJoinResponse(res);
      showNotification(
        "Seat reserved! Complete payment before the deadline.",
        "success"
      );
      loadPaymentStatus();
      setJoinStep("payment-details");
    } catch (err: unknown) {
      showNotification(
        (err as { message?: string })?.message ?? "Failed to join pool",
        "error"
      );
    } finally {
      setJoining(false);
    }
  };

  /** Step 2 → Step 3: user says they completed the withdrawal */
  const handleProceedToTx = () => {
    setJoinStep("submit-tx");
  };

  /** Step 3: submit TX hash for admin verification */
  const handleSubmitTxHash = async () => {
    if (!poolId || !txHash.trim()) return;
    setSubmittingTx(true);
    try {
      const res = await submitTxHash(poolId, {
        tx_hash: txHash.trim(),
      });
      setTxSubmitted(true);
      setPaymentVerifyStatus(
        res.payment_status ?? res.binance_payment_status
      );
      showNotification(
        "TX Hash submitted. Waiting for admin approval…",
        "success"
      );
      loadPaymentStatus();
    } catch (err: unknown) {
      showNotification(
        (err as { message?: string })?.message ??
          "Failed to submit TX Hash",
        "error"
      );
    } finally {
      setSubmittingTx(false);
    }
  };

  const handleRequestExit = async () => {
    if (!poolId) return;
    setRequestingExit(true);
    try {
      await cancelMembership(poolId);
      showNotification(
        "Cancellation request submitted. Awaiting admin approval.",
        "success"
      );
      loadMyCancellation();
      loadPaymentStatus();
    } catch (err: unknown) {
      showNotification(
        (err as { message?: string })?.message ??
          "Failed to request exit",
        "error"
      );
    } finally {
      setRequestingExit(false);
    }
  };

  /* Determine the effective payment verification state for UI */
  const effectiveStatus: PaymentStatus | "processing" | null = (() => {
    if (payment?.status === "verified") return "verified";
    if (payment?.status === "rejected") return "rejected";
    if (payment?.status === "processing") return "processing";
    if (paymentVerifyStatus) return paymentVerifyStatus;
    return null;
  })();

  /* ═══════════════════════ RENDER ═══════════════════════ */
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
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={hideNotification}
        />
      )}

      <button
        onClick={() => router.push("/dashboard/vc-pool")}
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
        <span className="text-white/90 group-hover:text-[#fda300]">
          Back to VC pools
        </span>
      </button>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#fc4f02] border-t-transparent" />
        </div>
      )}

      {/* ── Error ── */}
      {!loading && error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      )}

      {/* ══════════════════════ MAIN CONTENT ══════════════════════ */}
      {!loading && !error && pool && canAccessVCPool && (
        <div className="space-y-6">
          {/* ── Pool header ── */}
          <div className="rounded-2xl bg-gradient-to-b from-[#fc4f02]/90 via-[#fc4f02]/70 to-[#fda300]/50 p-6 sm:p-8 border border-[#fc4f02]/30">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              {pool.name}
            </h1>
            {pool.description && (
              <p className="text-sm text-white/90 max-w-2xl mb-4">
                {pool.description}
              </p>
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
                <p className="text-lg font-semibold">
                  {pool.duration_days} days
                </p>
              </div>
              <div>
                <p className="mb-1 text-white/70">Available seats</p>
                <p className="text-lg font-semibold">{availableSeats}</p>
              </div>
            </div>
          </div>

          {/* ═══════════ ALREADY A MEMBER ═══════════ */}
          {isMember && (
            <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20">
                  <svg
                    className="h-6 w-6 text-green-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-semibold text-green-200">
                    You are a member of this pool
                  </p>
                  <p className="text-sm text-slate-400">
                    Your share is locked. Pool activity will appear here
                    when the pool is active.
                  </p>
                </div>
              </div>

              {/* Request to exit */}
              {["open", "full", "active"].includes(poolStatus) && (
                <div className="pt-4 border-t border-[--color-border]">
                  {myCancellation?.has_cancellation ? (
                    <div className="rounded-lg bg-[--color-surface-alt] p-4 text-sm">
                      <p className="font-medium text-white capitalize">
                        Cancellation status:{" "}
                        {myCancellation.cancellation?.status}
                      </p>
                      {myCancellation.cancellation?.status === "pending" && (
                        <p className="mt-1 text-slate-400">
                          Awaiting admin approval. Refund amount:{" "}
                          {myCancellation.cancellation?.refund_amount}{" "}
                          {pool.coin_type}
                        </p>
                      )}
                      {myCancellation.cancellation?.status ===
                        "approved" && (
                        <p className="mt-1 text-slate-400">
                          Approved. Admin will process the refund. Refund:{" "}
                          {myCancellation.cancellation?.refund_amount}{" "}
                          {pool.coin_type}
                        </p>
                      )}
                      {myCancellation.cancellation?.status === "rejected" &&
                        myCancellation.cancellation?.rejection_reason && (
                          <p className="mt-1 text-amber-400">
                            Rejected:{" "}
                            {myCancellation.cancellation.rejection_reason}
                          </p>
                        )}
                      {myCancellation.cancellation?.status ===
                        "processed" && (
                        <p className="mt-1 text-green-400">
                          Refund completed. You have exited the pool.
                        </p>
                      )}
                      <p className="mt-2 text-xs text-slate-500">
                        Requested at{" "}
                        {myCancellation.cancellation?.requested_at
                          ? new Date(
                              myCancellation.cancellation.requested_at
                            ).toLocaleString()
                          : "—"}
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-slate-400 mb-2">
                        Need to exit? Request cancellation. A fee may apply
                        based on pool rules.
                      </p>
                      <button
                        type="button"
                        onClick={handleRequestExit}
                        disabled={requestingExit}
                        className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-200 hover:bg-amber-500/20 disabled:opacity-60"
                      >
                        {requestingExit
                          ? "Submitting…"
                          : "Request to exit pool"}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ═══════════ REJECTED — CAN RE-JOIN ═══════════ */}
          {!isMember && isRejected && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100">
              <p className="font-medium">
                Your previous payment was rejected.
              </p>
              {payment?.rejection_reason && (
                <p className="mt-1 text-amber-200/80">
                  Reason: {payment.rejection_reason}
                </p>
              )}
              <p className="mt-2">You can join again below.</p>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════
              3-SCREEN JOIN FLOW
              ═══════════════════════════════════════════════════ */}
          {!isMember && joinStep !== "idle" && (
            <>
              {/* ── Step indicator ── */}
              <div className="flex items-center justify-center gap-0 py-2">
                {STEP_LABELS.map((label, i) => {
                  const active = i === currentStepIdx;
                  const done = i < currentStepIdx;
                  return (
                    <div key={label} className="flex items-center">
                      {i > 0 && (
                        <div
                          className={`h-0.5 w-8 sm:w-16 transition-colors ${
                            done || active
                              ? "bg-[#fc4f02]"
                              : "bg-white/10"
                          }`}
                        />
                      )}
                      <div className="flex flex-col items-center gap-1.5">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                            done
                              ? "bg-[#fc4f02] text-white"
                              : active
                              ? "bg-[#fc4f02] text-white ring-2 ring-[#fc4f02]/40 ring-offset-2 ring-offset-[--color-background]"
                              : "bg-white/10 text-white/40"
                          }`}
                        >
                          {done ? (
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          ) : (
                            i + 1
                          )}
                        </div>
                        <span
                          className={`text-[10px] sm:text-xs whitespace-nowrap ${
                            active
                              ? "text-[#fc4f02] font-semibold"
                              : done
                              ? "text-white/70"
                              : "text-white/30"
                          }`}
                        >
                          {label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ╔═════════════════════════════════════════╗
                  ║  SCREEN 1 — Enter Wallet Address        ║
                  ╚═════════════════════════════════════════╝ */}
              {joinStep === "enter-wallet" && (
                <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-6 space-y-5">
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      Step 1 — Your Wallet Details
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Provide your BSC wallet address. This is used for
                      refunds &amp; payouts.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Wallet Address */}
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-300">
                        My Wallet Address (BSC){" "}
                        <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={userWalletAddress}
                        onChange={(e) =>
                          setUserWalletAddress(e.target.value)
                        }
                        placeholder="0x..."
                        className="w-full rounded-xl border border-[--color-border] bg-[--color-background] px-4 py-2.5 text-white font-mono placeholder:text-slate-500 focus:border-[#fc4f02] focus:outline-none focus:ring-1 focus:ring-[#fc4f02]"
                      />
                      <p className="mt-1 text-xs text-slate-500">
                        This is your BSC wallet that will RECEIVE refunds or
                        payouts.
                      </p>
                    </div>

                    {/* Network & Coin info (read-only) */}
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-lg bg-[--color-surface-alt] p-3">
                        <p className="text-xs text-slate-400">Network</p>
                        <p className="text-sm font-semibold text-white">
                          BSC (BEP-20)
                        </p>
                      </div>
                      <div className="rounded-lg bg-[--color-surface-alt] p-3">
                        <p className="text-xs text-slate-400">
                          Deposit Coin
                        </p>
                        <p className="text-sm font-semibold text-white">
                          USDT
                        </p>
                      </div>
                      <div className="rounded-lg bg-[--color-surface-alt] p-3">
                        <p className="text-xs text-slate-400">Method</p>
                        <p className="text-sm font-semibold text-white">
                          On-Chain Deposit
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setJoinStep("idle")}
                      className="rounded-lg border border-[--color-border] px-5 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmWallet}
                      disabled={joining || !userWalletAddress.trim()}
                      className="flex-1 rounded-lg bg-[#fc4f02] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 transition-opacity"
                    >
                      {joining ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Reserving seat…
                        </span>
                      ) : (
                        "Confirm & Reserve Seat"
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* ╔═════════════════════════════════════════╗
                  ║  SCREEN 2 — Payment Details             ║
                  ╚═════════════════════════════════════════╝ */}
              {joinStep === "payment-details" && (
                <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-6 space-y-5">
                  {/* Header + countdown */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-white">
                        Step 2 — Send your payment
                      </h2>
                      <p className="mt-1 text-sm text-slate-400">
                        Withdraw USDT on BSC to the admin deposit address
                        below.
                      </p>
                    </div>
                    <div
                      className={`shrink-0 rounded-lg px-3 py-2 text-center ${
                        timeRemaining <= 300
                          ? "bg-red-500/20 border border-red-500/40"
                          : "bg-[--color-surface-alt] border border-[--color-border]"
                      }`}
                    >
                      <p className="text-[10px] uppercase tracking-wider text-slate-400">
                        Expires in
                      </p>
                      <p
                        className={`text-xl font-mono font-bold ${
                          timeRemaining <= 0
                            ? "text-red-400"
                            : timeRemaining <= 300
                            ? "text-red-400"
                            : timeRemaining <= 600
                            ? "text-amber-400"
                            : "text-white"
                        }`}
                      >
                        {timeRemaining > 0
                          ? fmtCountdown(timeRemaining)
                          : "Expired"}
                      </p>
                    </div>
                  </div>

                  {/* Payment info card */}
                  <div className="rounded-lg bg-[--color-surface-alt] p-5 space-y-4">
                    {/* Exact amount */}
                    <div className="text-center py-3">
                      <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">
                        Send exactly
                      </p>
                      <p className="text-3xl font-bold font-mono text-[#fc4f02]">
                        {totalAmount} {depositCoin}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Investment {investmentAmount} + Fee {feeAmount}
                      </p>
                    </div>

                    <div className="h-px bg-[--color-border]" />

                    {/* Admin Deposit Address */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-slate-400">
                          Admin Deposit Address
                        </p>
                        <p className="text-sm font-mono font-semibold text-white break-all">
                          {adminWalletAddr || "—"}
                        </p>
                      </div>
                      {adminWalletAddr && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(adminWalletAddr);
                            showNotification(
                              "Address copied!",
                              "success"
                            );
                          }}
                          className="shrink-0 rounded-lg border border-[--color-border] px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5 transition-colors"
                        >
                          Copy
                        </button>
                      )}
                    </div>

                    {/* Network & Coin info */}
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <p className="text-xs text-slate-400">Network</p>
                        <p className="text-sm font-semibold text-white">
                          {paymentNetwork} (BEP-20)
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Coin</p>
                        <p className="text-sm font-semibold text-white">
                          {depositCoin}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Method</p>
                        <p className="text-sm font-semibold text-white">
                          On-Chain Deposit
                        </p>
                      </div>
                    </div>

                    {/* User wallet */}
                    {userWalletAddress && (
                      <div>
                        <p className="text-xs text-slate-400">
                          Your wallet address (for refunds)
                        </p>
                        <p className="text-sm font-mono text-white break-all">
                          {userWalletAddress}
                        </p>
                      </div>
                    )}

                    {/* Deadline */}
                    <div>
                      <p className="text-xs text-slate-400">
                        Payment deadline
                      </p>
                      <p className="text-sm text-white">
                        {payment?.payment_deadline
                          ? new Date(
                              payment.payment_deadline
                            ).toLocaleString()
                          : joinResponse?.deadline
                          ? new Date(
                              joinResponse.deadline
                            ).toLocaleString()
                          : "—"}
                      </p>
                    </div>
                  </div>

                  {/* Step-by-step instructions */}
                  <div className="rounded-lg border border-[--color-border] bg-[--color-background] p-4">
                    <p className="text-sm font-semibold text-white mb-3">
                      How to pay:
                    </p>
                    {joinResponse?.instructions &&
                    joinResponse.instructions.length > 0 ? (
                      <ol className="list-decimal list-inside text-sm text-slate-300 space-y-2">
                        {joinResponse.instructions.map(
                          (instruction, i) => (
                            <li key={i}>
                              {instruction.replace(/^\d+\.\s*/, "")}
                            </li>
                          )
                        )}
                      </ol>
                    ) : (
                      <ol className="list-decimal list-inside text-sm text-slate-300 space-y-2">
                        <li>
                          Open{" "}
                          <span className="text-white font-medium">
                            Binance
                          </span>{" "}
                          → Click{" "}
                          <span className="text-white font-medium">
                            Send
                          </span>{" "}
                          →{" "}
                          <span className="text-white font-medium">
                            Withdraw Crypto
                          </span>
                        </li>
                        <li>
                          Select{" "}
                          <span className="font-semibold text-[#fc4f02]">
                            USDT
                          </span>{" "}
                          as the coin
                        </li>
                        <li>
                          Paste the admin deposit address:{" "}
                          <span className="font-mono text-[#fc4f02]">
                            {adminWalletAddr
                              ? truncAddr(adminWalletAddr)
                              : "—"}
                          </span>
                        </li>
                        <li>
                          Select Network:{" "}
                          <span className="font-semibold text-white">
                            {paymentNetwork} (BEP-20)
                          </span>
                        </li>
                        <li>
                          Enter the exact amount:{" "}
                          <span className="font-mono font-bold text-[#fc4f02]">
                            {totalAmount} {depositCoin}
                          </span>
                        </li>
                        <li>
                          Click{" "}
                          <span className="text-white font-medium">
                            Withdraw
                          </span>{" "}
                          and confirm the transaction
                        </li>
                        <li>
                          Copy the{" "}
                          <span className="text-white font-medium">
                            TX Hash
                          </span>{" "}
                          from the confirmation
                        </li>
                        <li>
                          Come back here and paste the TX Hash to verify
                          your payment
                        </li>
                      </ol>
                    )}
                  </div>

                  {/* Warning */}
                  <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 flex items-start gap-3">
                    <svg
                      className="h-5 w-5 text-amber-400 mt-0.5 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-amber-200">
                        Do NOT send anywhere else
                      </p>
                      <p className="text-xs text-amber-300/80 mt-0.5">
                        Amount must be exactly{" "}
                        <span className="font-mono font-bold text-amber-100">
                          {totalAmount} {depositCoin}
                        </span>
                        . Any variance (even 0.01) will result in rejection
                        and refund. Make sure to select{" "}
                        <span className="font-bold text-amber-100">
                          {paymentNetwork} (BEP-20)
                        </span>{" "}
                        network.
                      </p>
                    </div>
                  </div>

                  {/* Proceed button */}
                  <button
                    type="button"
                    onClick={handleProceedToTx}
                    disabled={timeRemaining <= 0}
                    className="w-full rounded-lg bg-[#fc4f02] px-5 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 transition-opacity"
                  >
                    {timeRemaining <= 0
                      ? "Reservation expired"
                      : "I've completed the payment →"}
                  </button>
                </div>
              )}

              {/* ╔═════════════════════════════════════════╗
                  ║  SCREEN 3 — Submit TX Hash / Status     ║
                  ╚═════════════════════════════════════════╝ */}
              {joinStep === "submit-tx" && (
                <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-6 space-y-5">
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      Step 3 — Verify your payment
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      {!txSubmitted
                        ? "Enter the TX Hash from your Binance withdrawal confirmation."
                        : "Your transaction is being reviewed by the admin."}
                    </p>
                  </div>

                  {/* ── TX Hash form (before submission) ── */}
                  {!txSubmitted ? (
                    <div className="space-y-4">
                      {/* Amount reminder */}
                      <div className="rounded-lg bg-[--color-surface-alt] p-4 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-400">
                            Amount you should have sent
                          </p>
                          <p className="text-lg font-mono font-bold text-[#fc4f02]">
                            {totalAmount} {depositCoin}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-400">
                            To address
                          </p>
                          <p className="text-sm font-mono text-white">
                            {adminWalletAddr
                              ? truncAddr(adminWalletAddr)
                              : "—"}
                          </p>
                        </div>
                      </div>

                      {/* TX Hash input */}
                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-300">
                          Transaction Hash (TX Hash){" "}
                          <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={txHash}
                          onChange={(e) => setTxHash(e.target.value)}
                          placeholder="0x..."
                          className="w-full rounded-xl border border-[--color-border] bg-[--color-background] px-4 py-2.5 text-white font-mono placeholder:text-slate-500 focus:border-[#fc4f02] focus:outline-none focus:ring-1 focus:ring-[#fc4f02]"
                        />
                        <p className="mt-1 text-xs text-slate-500">
                          Find this in Binance → Wallet → Transaction
                          History after your withdrawal completes.
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() =>
                            setJoinStep("payment-details")
                          }
                          className="rounded-lg border border-[--color-border] px-5 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5 transition-colors"
                        >
                          ← Back
                        </button>
                        <button
                          type="button"
                          onClick={handleSubmitTxHash}
                          disabled={submittingTx || !txHash.trim()}
                          className="flex-1 rounded-lg bg-[#fc4f02] px-5 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 transition-opacity"
                        >
                          {submittingTx ? (
                            <span className="inline-flex items-center justify-center gap-2">
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              Submitting…
                            </span>
                          ) : (
                            "Verify Payment"
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ── Verification status (after submission) ── */
                    <div className="space-y-4">
                      {/* ── PENDING / PROCESSING (Waiting for admin) ── */}
                      {(effectiveStatus === "pending" ||
                        effectiveStatus === "processing") && (
                        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-6 text-center space-y-4">
                          <div className="flex justify-center">
                            <div className="relative">
                              <div className="h-16 w-16 animate-spin rounded-full border-4 border-yellow-500/30 border-t-yellow-400" />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <svg
                                  className="h-6 w-6 text-yellow-400"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                              </div>
                            </div>
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-yellow-200">
                              Waiting for admin approval…
                            </p>
                            <p className="text-sm text-yellow-300/70 mt-1">
                              Your TX Hash has been submitted. The admin
                              will verify your on-chain payment and approve
                              or reject it.
                            </p>
                          </div>
                          <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                            <div className="h-1.5 w-1.5 rounded-full bg-yellow-400 animate-pulse" />
                            Checking status automatically
                          </div>
                        </div>
                      )}

                      {/* ── VERIFIED ── */}
                      {effectiveStatus === "verified" && (
                        <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-6 text-center space-y-4">
                          <div className="flex justify-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
                              <svg
                                className="h-8 w-8 text-green-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </div>
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-green-200">
                              Payment confirmed!
                            </p>
                            <p className="text-sm text-green-300/70 mt-1">
                              You are now a member of this pool. Your
                              investment is locked and active.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              loadPool();
                              loadPaymentStatus();
                            }}
                            className="rounded-lg bg-green-500/20 border border-green-500/30 px-5 py-2.5 text-sm font-medium text-green-200 hover:bg-green-500/30 transition-colors"
                          >
                            View pool details
                          </button>
                        </div>
                      )}

                      {/* ── REJECTED ── */}
                      {effectiveStatus === "rejected" && (
                        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 text-center space-y-4">
                          <div className="flex justify-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
                              <svg
                                className="h-8 w-8 text-red-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </div>
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-red-200">
                              Payment rejected
                            </p>
                            {payment?.rejection_reason && (
                              <p className="text-sm text-red-300/70 mt-1">
                                {payment.rejection_reason}
                              </p>
                            )}
                            <p className="text-sm text-red-300/70 mt-1">
                              Seat released. You can try joining again.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setJoinStep("idle");
                              setTxSubmitted(false);
                              setTxHash("");
                              setPaymentVerifyStatus(null);
                              setJoinResponse(null);
                              loadPaymentStatus();
                            }}
                            className="rounded-lg bg-red-500/20 border border-red-500/30 px-5 py-2.5 text-sm font-medium text-red-200 hover:bg-red-500/30 transition-colors"
                          >
                            Try joining again
                          </button>
                        </div>
                      )}

                      {/* ── REFUNDED ── */}
                      {effectiveStatus === "refunded" && (
                        <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-6 text-center space-y-4">
                          <div className="flex justify-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/20">
                              <svg
                                className="h-8 w-8 text-blue-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </div>
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-blue-200">
                              Refund processed
                            </p>
                            <p className="text-sm text-blue-300/70 mt-1">
                              Your payment has been refunded to your wallet.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ═══════════ IDLE — JOIN POOL BUTTON ═══════════ */}
          {!isMember &&
            joinStep === "idle" &&
            !hasReservation &&
            poolStatus === "open" &&
            availableSeats > 0 && (
              <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-6 text-center space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Ready to invest?
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Join this pool by providing your wallet address and
                    completing an on-chain USDT deposit.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleStartJoin}
                  className="rounded-lg bg-[#fc4f02] px-8 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                >
                  Join Pool
                </button>
              </div>
            )}

          {/* ═══════════ POOL CLOSED / FULL ═══════════ */}
          {!isMember &&
            !hasReservation &&
            joinStep === "idle" &&
            (poolStatus !== "open" || availableSeats <= 0) &&
            !isRejected && (
              <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-6 text-center text-slate-400 text-sm">
                {poolStatus !== "open"
                  ? "This pool is not open for new members right now."
                  : "No seats available. The pool is full."}
              </div>
            )}

          {/* ═══════════ POOL DETAILS + ADMIN ACCOUNT DETAILS GRID ═══════════ */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-5 text-sm text-slate-300">
              <h2 className="mb-3 text-sm font-semibold text-white">
                Pool details
              </h2>
              <dl className="space-y-2">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">Status</dt>
                  <dd className="font-medium capitalize">
                    {poolStatus || "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">Max members</dt>
                  <dd className="font-medium">{pool.max_members}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">Pool fee</dt>
                  <dd className="font-medium">
                    {pool.pool_fee_percent ?? "—"}%
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">Payment window</dt>
                  <dd className="font-medium">
                    {pool.payment_window_minutes ?? "—"} min
                  </dd>
                </div>
              </dl>
            </div>
            <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-5 text-sm text-slate-300">
              <h2 className="mb-3 text-sm font-semibold text-white">
                Admin Account Details
              </h2>
              <dl className="space-y-2">
                <div>
                  <dt className="text-xs text-slate-400">
                    Deposit Address
                  </dt>
                  <dd className="font-mono text-white break-all mt-0.5">
                    {pool.admin_wallet_address ||
                      pool.admin_binance_uid ||
                      "Not set"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">Network</dt>
                  <dd className="font-medium text-white">
                    {pool.payment_network || "BSC"} (BEP-20)
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">Deposit Coin</dt>
                  <dd className="font-medium text-white">
                    {pool.deposit_coin || "USDT"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">Method</dt>
                  <dd className="font-medium text-white capitalize">
                    {pool.deposit_method === "on_chain"
                      ? "On-Chain Deposit"
                      : pool.deposit_method || "On-Chain Deposit"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
