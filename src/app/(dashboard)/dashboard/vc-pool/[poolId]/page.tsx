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
import { getApiErrorMessage } from "@/lib/utils/errors";
import { useSocket } from "@/hooks/useSocket";

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
const fmtCountdown = (sec: number) => `${sec}s`;
const truncAddr = (addr: string) =>
  addr.length > 14 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr;

/** BSC (EVM) wallet: 0x + 40 hex chars */
const isValidBscAddress = (addr: string): boolean =>
  /^0x[a-fA-F0-9]{40}$/.test(addr.trim());

/** Accept both blockchain TX hash (0x + 64 hex) or Binance TX ID (12+ alphanumeric chars) */
const isValidTxHash = (hash: string): boolean => {
  const trimmed = hash.trim();
  // Blockchain TX: 0x + 64 hex chars
  const isBlockchainTx = /^0x[a-fA-F0-9]{64}$/.test(trimmed);
  // Binance TX ID: at least 12 characters, alphanumeric
  const isBinanceTx = /^[a-zA-Z0-9]{12,}$/.test(trimmed);
  return isBlockchainTx || isBinanceTx;
};

/** Detect TX format: returns 'blockchain' or 'binance' */
const detectTxFormat = (hash: string): 'blockchain' | 'binance' => {
  const trimmed = hash.trim();
  return /^0x[a-fA-F0-9]{64}$/.test(trimmed) ? 'blockchain' : 'binance';
};

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
  const { socket } = useSocket();

  /* ── core data ── */
  const [pool, setPool] = useState<VcPoolDetails | null>(null);
  const [paymentStatus, setPaymentStatus] =
    useState<PaymentStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);
  const [isRejoin, setIsRejoin] = useState(false);
  const [rejoinInfo, setRejoinInfo] = useState<{
    cancellation_id: string;
    requested_at: string;
    refunded_at: string;
    refund_amount: number;
  } | null>(null);
  const [poolIsActive, setPoolIsActive] = useState(false);

  /* ── statusIntervalRef ── */
  const statusIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const cancellationPollingRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  /* ── derived ── */
  /* Get cancellation from both sources - payment status is primary */
  const cancellationFromPaymentStatus = paymentStatus?.cancellation;
  const cancellationStatus = 
    cancellationFromPaymentStatus?.status ?? 
    myCancellation?.cancellation?.status ?? 
    "";
  
  // Backend sends is_historical=true during rejoin (Step 14) — old cancellation should be ignored
  const isHistoricalCancellation = Boolean(
    paymentStatus?.cancellation?.is_historical
  );

  // membership: trust paymentStatus when loaded, fall back to pool.user_context only before paymentStatus arrives
  const isMember = Boolean(
    (paymentStatus?.membership?.exists && paymentStatus?.membership?.is_active === true) ||
      // Fallback only when paymentStatus not yet loaded
      (!paymentStatus && pool?.user_context?.is_member === true) ||
      // Keep as member while cancellation is pending/approved (is_active stays true per backend doc)
      (paymentStatus?.membership?.exists &&
        (paymentStatus?.cancellation?.status === "pending" ||
          paymentStatus?.cancellation?.status === "approved"))
  );

  // User has fully exited: is_active false + cancellation processed + NOT a historical (rejoin-in-progress) cancellation
  const userHasExitedPool = Boolean(
    (paymentStatus?.membership?.exists &&
      paymentStatus?.membership?.is_active === false &&
      cancellationStatus === "processed" &&
      !isHistoricalCancellation) ||
    (pool?.user_context && pool.user_context.is_member === false && pool.user_context.exited_at)
  );

  const isMemberEffective = isMember;
  // Only treat reservation as active when status is "reserved" (not old "confirmed" ones)
  const hasReservation = Boolean(
    paymentStatus?.reservation && paymentStatus.reservation.status === "reserved"
  );
  const payment = paymentStatus?.payment ?? null;
  const isRejected = payment?.status === "rejected";
  const availableSeats = Number(pool?.available_seats ?? (pool as any)?.pool_details?.available_seats ?? 0);
  const poolStatus = String(pool?.status ?? (pool as any)?.pool_metadata?.status ?? "");
  
  // Safe field accessors with fallbacks for nested API responses
  const poolName = pool?.name ?? (pool as any)?.pool_metadata?.name ?? (pool as any)?.pool_details?.name ?? "Untitled Pool";
  const contributionAmount = pool?.contribution_amount ?? (pool as any)?.pool_metadata?.contribution_amount ?? (pool as any)?.pool_details?.contribution_amount ?? "0";
  const durationDays = pool?.duration_days ?? (pool as any)?.pool_metadata?.duration_days ?? (pool as any)?.pool_details?.duration_days ?? 0;
  const coinType = pool?.coin_type ?? (pool as any)?.pool_metadata?.coin_type ?? (pool as any)?.pool_details?.coin_type ?? "USDT";
  const maxMembers = pool?.max_members ?? (pool as any)?.pool_metadata?.max_members ?? (pool as any)?.pool_details?.max_members;
  const poolFeePct = pool?.pool_fee_percent ?? (pool as any)?.pool_metadata?.pool_fee_percent ?? (pool as any)?.pool_details?.pool_fee_percent;
  const paymentWindow = pool?.payment_window_minutes ?? (pool as any)?.pool_metadata?.payment_window_minutes ?? (pool as any)?.pool_details?.payment_window_minutes;
  const adminWalletAddr = pool?.admin_wallet_address ?? (pool as any)?.admin_info?.wallet_address ?? (pool as any)?.pool_details?.admin_wallet_address ?? joinResponse?.admin_wallet_address ?? null;
  const adminBinanceUid = pool?.admin_binance_uid ?? (pool as any)?.admin_info?.binance_uid ?? (pool as any)?.pool_details?.admin_binance_uid;
  const networkName = pool?.payment_network ?? (pool as any)?.admin_info?.payment_network ?? (pool as any)?.pool_details?.payment_network ?? (pool as any)?.pool_metadata?.payment_network;
  const depositCoinName = pool?.deposit_coin ?? (pool as any)?.admin_info?.deposit_coin ?? (pool as any)?.pool_details?.deposit_coin ?? pool?.coin_type;
  const depositMethodName = pool?.deposit_method ?? (pool as any)?.admin_info?.deposit_method ?? (pool as any)?.pool_details?.deposit_method;

  // Payout detection: backend may set paid timestamps in different places depending on API
  const paidAt =
    (pool as any)?.user_context?.paid_at ??
    (pool as any)?.status_detail?.paid_at ??
    (pool as any)?.paid_at ??
    (pool as any)?.payout?.paid_at ??
    null;
  const payoutTxId =
    (pool as any)?.payout?.binance_tx_id ?? (pool as any)?.user_context?.binance_tx_id ?? null;
  const isPayoutSent = Boolean(paidAt);
  const hasTxSubmitted =
    Boolean(payment?.tx_hash) ||
    Boolean(payment?.binance_tx_id) ||
    txSubmitted;

  /* cancellation eligibility check */
  const canRequestCancellation =
    isMember &&
    (poolStatus === "open" || poolStatus === "full");
  
  /* track if pool is actively trading */
  useEffect(() => {
    // Only treat the pool as "actively trading" when status === 'active'.
    // 'completed' means trading finished — don't show "Pool is trading" for completed pools.
    setPoolIsActive(poolStatus === "active");
  }, [poolStatus]);

  /* calculated amounts (from payment or joinResponse) */
  /* Get cancellation data from both sources - payment status is primary */
  const cancellationData = 
    cancellationFromPaymentStatus || 
    myCancellation?.cancellation || 
    null;
  
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
  const paymentNetwork =
    networkName ?? joinResponse?.payment_network ?? "BSC";
  const depositCoin =
    depositCoinName ?? joinResponse?.deposit_coin ?? "USDT";
  const currentStepIdx = stepIndex(joinStep);

  /* ──────── data loaders ──────── */
  const loadPool = () => {
    if (!poolId) return;
    getVcPoolById(poolId)
      .then(setPool)
      .catch((err: unknown) =>
        setError(
          getApiErrorMessage(err, "Failed to load pool")
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
    Promise.all([
      getVcPoolById(poolId),
      getPaymentStatus(poolId),
      getMyCancellation(poolId)
        .catch(() => null) // Gracefully handle cancellation API failures
    ])
      .then(([p, ps, cancellation]) => {
        setPool(p);
        setPaymentStatus(ps);
        if (cancellation) setMyCancellation(cancellation);
      })
      .catch((err: unknown) =>
        setError(
          getApiErrorMessage(err, "Failed to load")
        )
      )
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poolId, canAccessVCPool]);

  /* ──────── WebSocket: listen for real-time pool events ──────── */
  useEffect(() => {
    if (!socket || !poolId) return;

    const POOL_EVENTS = [
      'pool:payment-verified',
      'pool:payment-rejected',
      'pool:cancellation-updated',
      'pool:refund-completed',
      'pool:payout-ready',
    ];

    const handlePoolEvent = (data: { pool_id?: string; [key: string]: any }) => {
      // Only react to events for THIS pool
      if (data.pool_id && data.pool_id !== poolId) return;
      // Refresh all data instantly
      loadPool();
      loadPaymentStatus();
      loadMyCancellation();
    };

    POOL_EVENTS.forEach((event) => socket.on(event, handlePoolEvent));
    return () => {
      POOL_EVENTS.forEach((event) => socket.off(event, handlePoolEvent));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, poolId]);

  /* ──────── auto-detect step on data load ──────── */
  useEffect(() => {
    if (loading || !pool || !canAccessVCPool) return;
    if (isMemberEffective || isRejected) {
      setJoinStep("idle");
      return;
    }
    // Rejoin after page refresh: cancellation is processed, user has a FRESH reservation
    // (isRejoin state is lost on refresh, so we restore it here)
    if (cancellationStatus === "processed" &&
        (isHistoricalCancellation || paymentStatus?.reservation?.status === "reserved") &&
        payment &&
        (payment.status === "pending" || payment.status === "processing")) {
      if (!isRejoin) {
        setIsRejoin(true);
      }
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
    // Don't override step if user is already in the middle of join flow
    if (joinStep !== "idle") {
      return;
    }
    // Only auto-detect into join flow for active reservations with pending/processing payments
    if (hasReservation && payment &&
        (payment.status === "pending" || payment.status === "processing")) {
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
    
    // Reset rejoin flag when user becomes active member again
    if (isMember && isRejoin) {
      setIsRejoin(false);
      setRejoinInfo(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    loading,
    pool,
    canAccessVCPool,
    isMember,
    isRejected,
    hasReservation,
    cancellationStatus,
    isHistoricalCancellation,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    !!payment,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    payment?.status,
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

  /* ──────── unified payment-status poll (adaptive interval, pauses on hidden tab) ──────── */
  useEffect(() => {
    if (!poolId) return;

    // Determine if we need to poll and at what speed
    const needsReservationPoll = hasReservation && !isMember;
    const needsTxPoll =
      hasTxSubmitted &&
      (paymentVerifyStatus === "pending" ||
        paymentVerifyStatus === null ||
        payment?.status === "processing");

    if (!needsReservationPoll && !needsTxPoll) return;

    // WebSocket handles instant updates; polling is just a fallback
    // Slower intervals: 30s for TX verification, 60s otherwise
    const interval = needsTxPoll ? 30000 : 60000;

    const poll = () => {
      // Skip poll when tab is not visible
      if (document.hidden) return;
      getPaymentStatus(poolId).then((ps) => {
        setPaymentStatus(ps);
        const s = ps.payment?.payment_status ?? ps.payment?.binance_payment_status;
        if (s) setPaymentVerifyStatus(s as PaymentStatus);
      });
    };

    statusIntervalRef.current = setInterval(poll, interval);

    // Pause/resume on tab visibility change
    const onVisibility = () => {
      if (!document.hidden) poll(); // Refresh immediately when tab becomes visible
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      if (statusIntervalRef.current) clearInterval(statusIntervalRef.current);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [poolId, hasReservation, isMember, hasTxSubmitted, paymentVerifyStatus, payment?.status]);

  /* ──────── poll cancellation status every 30s while pending (pauses on hidden tab) ──────── */
  useEffect(() => {
    if (!poolId || !myCancellation?.has_cancellation) return;
    const status = myCancellation.cancellation?.status;
    if (status !== "pending") return;

    cancellationPollingRef.current = setInterval(() => {
      if (!document.hidden) loadMyCancellation();
    }, 60000);
    return () => {
      if (cancellationPollingRef.current)
        clearInterval(cancellationPollingRef.current);
    };
  }, [poolId, myCancellation?.has_cancellation, myCancellation?.cancellation?.status]);

  /* ──────── load cancellation for members or users who have exited ──────── */
  useEffect(() => {
    if (!poolId || !canAccessVCPool) return;
    
    // Always try to load cancellation data - it's needed for exited users too
    loadMyCancellation();
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poolId, canAccessVCPool]);

  /* ──────── poll pool details while waiting for admin payout (completed state, pauses on hidden tab) ──────── */
  useEffect(() => {
    if (!poolId || !isMember || poolStatus !== 'completed' || isPayoutSent) return;
    const interval = setInterval(() => {
      if (!document.hidden) getVcPoolById(poolId).then((p) => setPool(p)).catch(() => {});
    }, 60000);
    return () => clearInterval(interval);
  }, [poolId, isMember, poolStatus, isPayoutSent]);

  /* ═══════════════════════ HANDLERS ═══════════════════════ */

  /** Step 0 → Step 1 */
  const handleStartJoin = () => setJoinStep("enter-wallet");

  /** Step 1 → Step 2: confirm wallet & create reservation */
  const handleConfirmWallet = async () => {
    if (!poolId || !pool) return;
    const trimmed = userWalletAddress.trim();
    if (!trimmed) {
      showNotification("Please enter your wallet address", "error");
      return;
    }
    if (!isValidBscAddress(trimmed)) {
      showNotification(
        "Invalid BSC address. Use 0x followed by 40 hex characters (e.g. 0x1234...abcd).",
        "error"
      );
      return;
    }
    setJoining(true);
    try {
      const res = await joinPool(poolId, {
        payment_method: paymentMethod,
        user_wallet_address: trimmed,
      });
      setJoinResponse(res);
      
      /* Check if this is a rejoin */
      if (res.is_rejoin) {
        setIsRejoin(true);
        setRejoinInfo(res.previous_cancellation ?? null);
        showNotification(
          "Welcome back! Your membership is being restored.",
          "success"
        );
      } else {
        showNotification(
          "Seat reserved! Complete payment before the deadline.",
          "success"
        );
      }
      
      loadPaymentStatus();
      setJoinStep("payment-details");
    } catch (err: unknown) {
      showNotification(
        getApiErrorMessage(err, "Failed to join pool"),
        "error"
      );
    } finally {
      setJoining(false);
    }
  };

  /** Step 2 → Step 3: user says they completed the withdrawal */
  const handleProceedToTx = () => {
    // Reset TX form state to show fresh input
    setTxHash("");
    setTxSubmitted(false);
    setJoinStep("submit-tx");
  };

  /** Step 3: submit TX hash for admin verification */
  const handleSubmitTxHash = async () => {
    if (!poolId) return;
    const trimmed = txHash.trim();
    if (!trimmed) {
      showNotification("Please enter the transaction hash or Binance TX ID", "error");
      return;
    }
    if (!isValidTxHash(trimmed)) {
      showNotification(
        "Invalid transaction ID. Enter either a blockchain TX hash (0x + 64 hex chars) or a Binance P2P TX ID (12+ characters).",
        "error"
      );
      return;
    }
    setSubmittingTx(true);
    try {
      const format = detectTxFormat(trimmed);
      const res = await submitTxHash(poolId, 
        format === 'blockchain' 
          ? { tx_hash: trimmed }
          : { binance_tx_id: trimmed }
      );
      setTxSubmitted(true);
      setPaymentVerifyStatus(
        res.payment_status ?? res.binance_payment_status
      );
      showNotification(
        "Transaction ID submitted. Waiting for admin approval…",
        "success"
      );
      loadPaymentStatus();
      // Stay on submit-tx step to show verification status
    } catch (err: unknown) {
      showNotification(
        getApiErrorMessage(err, "Failed to submit transaction ID"),
        "error"
      );
    } finally {
      setSubmittingTx(false);
    }
  };

  const handleRequestExit = () => {
    /* Check if cancellation is allowed */
    if (!canRequestCancellation) {
      if (poolIsActive) {
        showNotification(
          "This pool is currently trading. You cannot cancel your membership.",
          "error"
        );
      } else {
        showNotification(
          "Cancellation is not allowed for this pool at this time.",
          "error"
        );
      }
      return;
    }
    setShowExitConfirmModal(true);
  };

  const handleConfirmExit = async () => {
    if (!poolId) return;
    
    /* Final check before submitting */
    if (!canRequestCancellation) {
      showNotification(
        "Pool status changed. Cancellation is no longer allowed.",
        "error"
      );
      setShowExitConfirmModal(false);
      return;
    }

    setRequestingExit(true);
    try {
      await cancelMembership(poolId);
      showNotification(
        "Cancellation request submitted. Awaiting admin approval.",
        "success"
      );
      setShowExitConfirmModal(false);
      loadMyCancellation();
      loadPaymentStatus();
    } catch (err: unknown) {
      showNotification(
        getApiErrorMessage(err, "Failed to request exit"),
        "error"
      );
    } finally {
      setRequestingExit(false);
    }
  };

  const handleRefresh = async () => {
    if (!poolId) return;
    setRefreshing(true);
    try {
      const [p, ps, cancellation] = await Promise.all([
        getVcPoolById(poolId),
        getPaymentStatus(poolId),
        getMyCancellation(poolId).catch(() => null)
      ]);
      setPool(p);
      setPaymentStatus(ps);
      if (cancellation) setMyCancellation(cancellation);
      showNotification("Pool data refreshed", "success");
    } catch (err: unknown) {
      showNotification(
        getApiErrorMessage(err, "Failed to refresh pool data"),
        "error"
      );
    } finally {
      setRefreshing(false);
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

      <button
        onClick={handleRefresh}
        disabled={refreshing || loading}
        className="mb-4 ml-3 inline-flex items-center gap-1.5 text-sm font-medium text-white/90 hover:text-[#fda300] transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg
          className={`w-4 h-4 text-[#fc4f02] transition-transform ${refreshing ? 'animate-spin' : 'group-hover:rotate-180'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        <span className="text-white/90 group-hover:text-[#fda300]">
          {refreshing ? 'Refreshing...' : 'Refresh'}
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
              {poolName}
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
                  ${contributionAmount} {coinType}
                </p>
              </div>
              <div>
                <p className="mb-1 text-white/70">Duration</p>
                <p className="text-lg font-semibold">
                  {durationDays} days
                </p>
              </div>
              <div>
                <p className="mb-1 text-white/70">Available seats</p>
                <p className="text-lg font-semibold">{availableSeats}</p>
              </div>
            </div>
          </div>

          {/* ═══════════ POOL FINANCIALS CARD ═══════════ */}
          {pool.pool_financials && (
            <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">Pool Performance</h2>
                {(poolStatus === "open" || poolStatus === "full") && (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Trading not started
                  </span>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Total Invested */}
                <div className="rounded-lg bg-[--color-surface-alt] p-4 space-y-1">
                  <p className="text-xs text-slate-400 font-medium">Total Invested</p>
                  <p className="text-lg font-bold text-white">
                    ${pool.pool_financials.total_invested_usdt.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-xs text-slate-500">All members</p>
                </div>

                {/* Current Pool Value */}
                <div className="rounded-lg bg-[--color-surface-alt] p-4 space-y-1">
                  <p className="text-xs text-slate-400 font-medium">
                    {poolStatus === "open" || poolStatus === "full" ? "Pool Capital" : "Current Value"}
                  </p>
                  <p className="text-lg font-bold text-white">
                    ${pool.pool_financials.current_pool_value_usdt.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-xs text-slate-500">
                    {poolStatus === "open" || poolStatus === "full" ? "Funds collected" : "Current holdings"}
                  </p>
                </div>

                {/* Total Profit/Loss */}
                <div className={`rounded-lg p-4 space-y-1 ${
                  poolStatus === "open" || poolStatus === "full"
                    ? 'bg-slate-500/10 border border-slate-500/20'
                    : pool.pool_financials.total_profit_usdt >= 0
                      ? 'bg-green-500/10 border border-green-500/20'
                      : 'bg-red-500/10 border border-red-500/20'
                }`}>
                  <p className="text-xs text-slate-500 font-medium mb-1">
                    {poolStatus === "open" || poolStatus === "full"
                      ? 'Profit / Loss'
                      : pool.pool_financials.total_profit_usdt >= 0
                        ? 'Total Profit'
                        : 'Total Loss'}
                  </p>
                  {poolStatus === "open" || poolStatus === "full" ? (
                    <>
                      <p className="text-lg font-bold text-slate-400">--</p>
                      <p className="text-xs text-slate-500">Starts after trading begins</p>
                    </>
                  ) : (
                    <>
                      <p className={`text-lg font-bold ${
                        pool.pool_financials.total_profit_usdt >= 0
                          ? 'text-green-400'
                          : 'text-red-400'
                      }`}>
                        {pool.pool_financials.total_profit_usdt >= 0 ? '+' : ''}${Math.abs(pool.pool_financials.total_profit_usdt).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                      <p className="text-xs text-slate-500">All members</p>
                    </>
                  )}
                </div>

                {/* Pool ROI */}
                <div className={`rounded-lg p-4 space-y-1 ${
                  poolStatus === "open" || poolStatus === "full"
                    ? 'bg-slate-500/10 border border-slate-500/20'
                    : pool.pool_financials.pool_roi_pct >= 0
                      ? 'bg-emerald-500/10 border border-emerald-500/20'
                      : 'bg-orange-500/10 border border-orange-500/20'
                }`}>
                  <p className="text-xs text-slate-500 font-medium mb-1">Pool ROI</p>
                  {poolStatus === "open" || poolStatus === "full" ? (
                    <>
                      <p className="text-lg font-bold text-slate-400">--</p>
                      <p className="text-xs text-slate-500">Starts after trading begins</p>
                    </>
                  ) : (
                    <>
                      <p className={`text-lg font-bold ${
                        pool.pool_financials.pool_roi_pct >= 0
                          ? 'text-emerald-400'
                          : 'text-orange-400'
                      }`}>
                        {pool.pool_financials.pool_roi_pct >= 0 ? '+' : ''}{pool.pool_financials.pool_roi_pct.toFixed(2)}%
                      </p>
                      <p className="text-xs text-slate-500">Return on investment</p>
                    </>
                  )}
                </div>
              </div>

              {/* Fee Summary
              <div className="pt-4 border-t border-[--color-border] text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Pool Fees Collected:</span>
                  <span className="font-medium text-white">
                    ${pool.pool_financials.total_pool_fees_usdt.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div> */}
            </div>
          )}

          {/* ═══════════ USER MEMBERSHIP CARD ═══════════ */}
          {pool.user_context && pool.user_context.is_member && (
            <div className="rounded-xl border-2 border-blue-500/30 bg-blue-500/5 p-6 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20">
                  <svg
                    className="h-6 w-6 text-blue-400"
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
                  <h2 className="text-lg font-bold text-blue-200">Your Investment</h2>
                  <p className="text-sm text-blue-300/70">Member since {
                    pool.user_context.joined_at 
                      ? new Date(pool.user_context.joined_at).toLocaleDateString()
                      : '—'
                  }</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {/* Your Invested Amount */}
                <div className="rounded-lg bg-white/5 border border-blue-500/20 p-4 space-y-1">
                  <p className="text-xs text-slate-400 font-medium">Your Investment</p>
                  <p className="text-lg font-bold text-white">
                    ${pool.user_context.invested_amount_usdt.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-xs text-slate-500">Initial capital</p>
                </div>

                {/* Current Member Value */}
                <div className="rounded-lg bg-white/5 border border-blue-500/20 p-4 space-y-1">
                  <p className="text-xs text-slate-400 font-medium">Current Value</p>
                  <p className="text-lg font-bold text-white">
                    ${pool.user_context.current_member_value_usdt.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-xs text-slate-500">Today's value</p>
                </div>

                {/* Your Ownership */}
                <div className="rounded-lg bg-white/5 border border-blue-500/20 p-4 space-y-1">
                  <p className="text-xs text-slate-400 font-medium">Your Ownership</p>
                  {poolStatus === "open" || poolStatus === "full" ? (
                    <>
                      <p className="text-lg font-bold text-slate-400">Pending</p>
                      <p className="text-xs text-slate-500">Calculated at pool start</p>
                    </>
                  ) : (
                    <>
                      <p className="text-lg font-bold text-white">
                        {pool.user_context.current_share_percent.toFixed(2)}%
                      </p>
                      <p className="text-xs text-slate-500">Pool share</p>
                    </>
                  )}
                </div>
              </div>

              {/* P&L Summary */}
              {poolStatus === "open" || poolStatus === "full" ? (
                <div className="rounded-lg border-l-4 border-l-slate-500 bg-slate-500/5 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400 font-medium">Unrealized Profit / Loss</p>
                      <p className="text-lg font-bold mt-1 text-slate-400">No trading activity yet</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-slate-400">--</p>
                      <p className="text-xs text-slate-500 mt-1">Return</p>
                    </div>
                  </div>
                </div>
              ) : (
              <div className={`rounded-lg border-l-4 p-4 ${
                pool.user_context.unrealized_pnl_usdt >= 0
                  ? 'border-l-green-500 bg-green-500/5'
                  : 'border-l-red-500 bg-red-500/5'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 font-medium">Unrealized Profit / Loss</p>
                    <p className={`text-2xl font-bold mt-1 ${
                      pool.user_context.unrealized_pnl_usdt >= 0
                        ? 'text-green-400'
                        : 'text-red-400'
                    }`}>
                      {pool.user_context.unrealized_pnl_usdt >= 0 ? '+' : ''}${Math.abs(pool.user_context.unrealized_pnl_usdt).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-bold ${
                      pool.user_context.unrealized_pnl_pct >= 0
                        ? 'text-green-400'
                        : 'text-red-400'
                    }`}>
                      {pool.user_context.unrealized_pnl_pct >= 0 ? '+' : ''}{pool.user_context.unrealized_pnl_pct.toFixed(2)}%
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Return</p>
                  </div>
                </div>
              </div>
              )}
            </div>
          )}

          {/* ═══════════ POOL COMPLETED MESSAGE ═══════════ */}
          {isMember && poolStatus === "completed" && (
            <div className="rounded-xl border-2 border-yellow-500/50 bg-yellow-500/10 p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/20 flex-shrink-0">
                  <svg
                    className="h-7 w-7 text-yellow-400"
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
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-yellow-200 mb-1">
                    Pool is Completed
                  </h3>
                  <p className="text-sm text-yellow-100/90">
                    The pool has completed its trading cycle. Your final amount will be processed and sent when the admin confirms and transfers your funds.
                  </p>
                </div>
              </div>
              
              {/* Status timeline */}
              <div className="rounded-lg bg-white/3 border border-yellow-500/20 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/20 text-green-400 text-xs font-bold flex-shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-green-200">Pool Completed</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {pool.pool_timeline?.completed_at
                        ? `On ${new Date(pool.pool_timeline.completed_at).toLocaleDateString()}`
                        : "Recently completed"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full ${isPayoutSent ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'} text-xs font-bold flex-shrink-0 mt-0.5`}>
                    {isPayoutSent ? '✓' : '⏳'}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${isPayoutSent ? 'text-green-200' : 'text-yellow-200'}`}>
                      {isPayoutSent ? 'Payout Sent' : 'Awaiting Admin Payout'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {isPayoutSent ? (
                        paidAt ? `Marked paid on ${new Date(paidAt).toLocaleString()}` : 'Admin marked this payout as paid.'
                      ) : (
                        'Admin is processing and will send your final amount soon'
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Final amount info */}
              <div className="rounded-lg bg-white/3 border border-yellow-500/20 p-4">
                <p className="text-xs text-slate-400 font-medium mb-2">Your Expected Payout</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">Initial Investment</span>
                    <span className="text-sm font-semibold text-white">
                      ${pool.user_context?.invested_amount_usdt?.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">Current Value</span>
                    <span className="text-sm font-semibold text-white">
                      ${pool.user_context?.current_member_value_usdt?.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="border-t border-yellow-500/20 pt-2 flex items-center justify-between">
                    <span className="text-sm font-bold text-yellow-200">Total to Receive</span>
                    <span className={`text-lg font-bold ${
                      pool.user_context && pool.user_context.unrealized_pnl_usdt >= 0
                        ? 'text-green-400'
                        : 'text-red-400'
                    }`}>
                      ${pool.user_context?.current_member_value_usdt?.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════ MEMBER STATUS & CANCELLATION MANAGEMENT ═══════════ */}
          {(isMember || (userHasExitedPool && joinStep === "idle")) && (
            <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-6 space-y-4">
              {userHasExitedPool && !isMember && cancellationStatus !== "pending" && !hasReservation && (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20">
                    <svg
                      className="h-6 w-6 text-red-400"
                      fill="none" 
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-amber-200">
                      You have exited this pool
                    </p>
                    <p className="text-sm text-slate-400">
                      Your position has been closed. View refund details below and rejoin if you'd like.
                    </p>
                  </div>
                </div>
              )}

              {/* Request to exit or show exit status */}
              {!isMember && userHasExitedPool && cancellationData && (
                <div className="pt-4 border-t border-[--color-border]">
                  {(cancellationStatus || userHasExitedPool) ? (
                    <div className="space-y-4">
                      {/* Status badge */}
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-300">
                          Cancellation Status
                        </p>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                            cancellationStatus === "pending"
                              ? "bg-yellow-500/20 text-yellow-200 border border-yellow-500/30"
                              : cancellationStatus === "approved"
                              ? "bg-blue-500/20 text-blue-200 border border-blue-500/30"
                              : cancellationStatus === "processed"
                              ? "bg-green-500/20 text-green-200 border border-green-500/30"
                              : "bg-red-500/20 text-red-200 border border-red-500/30"
                          }`}
                        >
                          {cancellationStatus}
                        </span>
                      </div>

                      {/* Fee breakdown card */}
                      <div className="rounded-lg bg-[--color-surface-alt] p-4 space-y-3">
                        <div>
                          <p className="text-xs text-slate-400 mb-1">
                            Original Contribution
                          </p>
                          <p className="text-lg font-bold text-white">
                            {cancellationData?.contribution_amount}{" "}
                            {pool?.coin_type || "USDT"}
                          </p>
                        </div>

                        {cancellationData?.pool_fee_amount &&
                          cancellationData.pool_fee_amount > 0 && (
                            <div className="flex items-center justify-between text-sm border-t border-[--color-border] pt-2">
                              <span className="text-slate-400">
                                Pool Fee
                              </span>
                              <span className="text-red-400">
                                -{cancellationData.pool_fee_amount}{" "}
                                {pool?.coin_type || "USDT"}
                              </span>
                            </div>
                          )}

                        {cancellationData?.
                          cancellation_fee_amount &&
                          cancellationData.cancellation_fee_amount > 0 && (
                            <div className="flex items-center justify-between text-sm border-t border-[--color-border] pt-2">
                              <span className="text-slate-400">
                                Cancellation Fee
                              </span>
                              <span className="text-red-400">
                                -{cancellationData.cancellation_fee_amount}{" "}
                                {pool?.coin_type || "USDT"}
                              </span>
                            </div>
                          )}

                        <div className="flex items-center justify-between font-semibold border-t border-[--color-border] pt-3">
                          <span className="text-white">
                            Refund Amount
                          </span>
                          <span className="text-green-400 text-lg">
                            {cancellationData?.refund_amount}{" "}
                            {pool?.coin_type || "USDT"}
                          </span>
                        </div>
                      </div>

                      {/* Status-specific details */}
                      {cancellationStatus === "pending" && (
                        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3">
                          <p className="text-sm text-yellow-200 font-medium">
                            ⏳ Awaiting admin approval
                          </p>
                          <p className="text-xs text-yellow-300/70 mt-1">
                            Requested on{" "}
                            {cancellationData?.requested_at
                              ? new Date(
                                  cancellationData.requested_at
                                ).toLocaleString()
                              : "—"}
                          </p>
                        </div>
                      )}

                      {cancellationStatus === "approved" && (
                        <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3 space-y-2">
                          <p className="text-sm text-blue-200 font-medium">
                            ✓ Approved by admin
                          </p>
                          {cancellationData?.user_wallet_address && (
                            <div>
                              <p className="text-xs text-slate-400">
                                Refund will be sent to:
                              </p>
                              <p className="text-xs font-mono text-blue-300 break-all mt-0.5">
                                {cancellationData.user_wallet_address}
                              </p>
                            </div>
                          )}
                          <p className="text-xs text-blue-300/70">
                            Approved on{" "}
                            {cancellationData?.approved_at
                              ? new Date(
                                  cancellationData.approved_at
                                ).toLocaleString()
                              : "—"}
                          </p>
                          <p className="text-xs text-slate-400 pt-1">
                            Admin is processing the refund transfer.
                            Expected within 24 hours.
                          </p>
                        </div>
                      )}

                      {cancellationStatus === "processed" && (
                        <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-3 space-y-2">
                          <p className="text-sm text-green-200 font-medium">
                            ✓ Refund completed
                          </p>
                          {cancellationData?.user_wallet_address && (
                            <div>
                              <p className="text-xs text-slate-400">
                                Refund sent to:
                              </p>
                              <p className="text-xs font-mono text-green-300 break-all mt-0.5">
                                {cancellationData.user_wallet_address}
                              </p>
                            </div>
                          )}
                          <p className="text-xs text-green-300/70">
                            Completed on{" "}
                            {cancellationData
                              ?.refund_completed_at
                              ? new Date(
                                  cancellationData
                                    .refund_completed_at
                                ).toLocaleString()
                              : "—"}
                          </p>
                          <p className="text-xs text-slate-400 pt-1">
                            You have successfully exited the pool.
                          </p>

                          {/* REJOIN BUTTON — only show when not already in join flow */}
                          {joinStep === "idle" && !hasReservation && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsRejoin(true);
                              setRejoinInfo({
                                cancellation_id:
                                  cancellationData?.cancellation_id ||
                                  "",
                                requested_at:
                                  cancellationData?.requested_at || "",
                                refunded_at:
                                  cancellationData
                                    ?.refund_completed_at || "",
                                refund_amount:
                                  cancellationData?.refund_amount ||
                                  0,
                              });
                              setJoinStep("idle");
                              handleStartJoin();
                            }}
                            className="mt-3 w-full rounded-lg bg-green-500/20 border border-green-500/30 px-3 py-2 text-sm font-semibold text-green-200 hover:bg-green-500/30 transition-colors"
                          >
                            Rejoin this pool
                          </button>
                          )}
                        </div>
                      )}

                      {cancellationStatus === "rejected" && (
                        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 space-y-2">
                          <p className="text-sm text-red-200 font-medium">
                            ✗ Cancellation rejected
                          </p>
                          {cancellationData
                            ?.rejection_reason && (
                            <div>
                              <p className="text-xs text-slate-400">
                                Reason:
                              </p>
                              <p className="text-xs text-red-300 mt-0.5">
                                {cancellationData.rejection_reason}
                              </p>
                            </div>
                          )}
                          <p className="text-xs text-red-300/70">
                            You remain as an active member of this pool.
                          </p>
                        </div>
                      )}

                      {cancellationData?.reviewed_by && (
                        <p className="text-xs text-slate-400 pt-1">
                          Reviewed by:{" "}
                          <span className="text-slate-300">
                            {cancellationData.reviewed_by.name} (
                            {cancellationData.reviewed_by.email})
                          </span>
                        </p>
                      )}
                    </div>
                  ) : (
                    <>
                      {canRequestCancellation ? (
                        <>
                          <p className="text-slate-400 mb-3 text-sm">
                            Need to exit? Request cancellation. Fees will be deducted based
                            on pool rules.
                          </p>
                          <button
                            type="button"
                            onClick={handleRequestExit}
                            disabled={requestingExit}
                            className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-2.5 text-sm font-semibold text-amber-200 hover:bg-amber-500/20 disabled:opacity-60 transition-colors"
                          >
                            {requestingExit
                              ? "Submitting…"
                              : "Request to exit pool"}
                          </button>
                        </>
                      ) : poolIsActive ? (
                        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                          <p className="text-sm text-red-200 font-medium">
                            ⛔ Pool is trading
                          </p>
                          <p className="text-xs text-red-300/70 mt-1">
                            Cancellation is only allowed before the pool starts trading.
                            You are now locked in until the pool completes.
                          </p>
                        </div>
                      ) : (
                        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                          <p className="text-sm text-amber-200 font-medium">
                            ⏳ Cancellation unavailable
                          </p>
                          <p className="text-xs text-amber-300/70 mt-1">
                            Cancellation is not available for this pool at this time.
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Show cancellation status for active members with pending/approved exit requests */}
              {isMember && (cancellationStatus === "pending" || cancellationStatus === "approved") && cancellationData && (
                <div className="pt-4 border-t border-[--color-border]">
                  <div className="space-y-4">
                    {/* Status badge */}
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-300">
                        Cancellation Status
                      </p>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                          cancellationStatus === "pending"
                            ? "bg-yellow-500/20 text-yellow-200 border border-yellow-500/30"
                            : "bg-blue-500/20 text-blue-200 border border-blue-500/30"
                        }`}
                      >
                        {cancellationStatus}
                      </span>
                    </div>

                    {/* Status-specific messages */}
                    {cancellationStatus === "pending" && (
                      <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3">
                        <p className="text-sm text-yellow-200 font-medium">
                          ⏳ Awaiting admin approval
                        </p>
                        <p className="text-xs text-yellow-300/70 mt-1">
                          Requested on{" "}
                          {cancellationData?.requested_at
                            ? new Date(
                                cancellationData.requested_at
                              ).toLocaleString()
                            : "—"}
                        </p>
                      </div>
                    )}

                    {cancellationStatus === "approved" && (
                      <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3 space-y-2">
                        <p className="text-sm text-blue-200 font-medium">
                          ✓ Approved by admin
                        </p>
                        {cancellationData?.user_wallet_address && (
                          <div>
                            <p className="text-xs text-slate-400">
                              Refund will be sent to:
                            </p>
                            <p className="text-xs font-mono text-blue-300 break-all mt-0.5">
                              {cancellationData.user_wallet_address}
                            </p>
                          </div>
                        )}
                        <p className="text-xs text-blue-300/70">
                          Approved on{" "}
                          {cancellationData?.approved_at
                            ? new Date(
                                cancellationData.approved_at
                              ).toLocaleString()
                            : "—"}
                        </p>
                        <p className="text-xs text-slate-400 pt-1">
                          Admin is processing the refund transfer.
                          Expected within 24 hours.
                        </p>
                      </div>
                    )}

                    {/* Fee breakdown */}
                    <div className="rounded-lg bg-[--color-surface-alt] p-4 space-y-3">
                      <div>
                        <p className="text-xs text-slate-400 mb-1">
                          Original Contribution
                        </p>
                        <p className="text-lg font-bold text-white">
                          {cancellationData?.contribution_amount}{" "}
                          {pool?.coin_type || "USDT"}
                        </p>
                      </div>

                      {cancellationData?.pool_fee_amount &&
                        cancellationData.pool_fee_amount > 0 && (
                          <div className="flex items-center justify-between text-sm border-t border-[--color-border] pt-2">
                            <span className="text-slate-400">
                              Pool Fee
                            </span>
                            <span className="text-red-400">
                              -{cancellationData.pool_fee_amount}{" "}
                              {pool?.coin_type || "USDT"}
                            </span>
                          </div>
                        )}

                      {cancellationData?.
                        cancellation_fee_amount &&
                        cancellationData.cancellation_fee_amount > 0 && (
                          <div className="flex items-center justify-between text-sm border-t border-[--color-border] pt-2">
                            <span className="text-slate-400">
                              Cancellation Fee
                            </span>
                            <span className="text-red-400">
                              -{cancellationData.cancellation_fee_amount}{" "}
                              {pool?.coin_type || "USDT"}
                            </span>
                          </div>
                        )}

                      <div className="flex items-center justify-between font-semibold border-t border-[--color-border] pt-3">
                        <span className="text-white">
                          Refund Amount
                        </span>
                        <span className="text-green-400 text-lg">
                          {cancellationData?.refund_amount}{" "}
                          {pool?.coin_type || "USDT"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Request exit button for active members without pending cancellation */}
              {isMember && canRequestCancellation && cancellationStatus !== "pending" && cancellationStatus !== "approved" && (
                <div className="pt-4 border-t border-[--color-border]">
                  <p className="text-slate-400 mb-3 text-sm">
                    Need to exit? Request cancellation. Fees will be deducted based on pool rules.
                  </p>
                  <button
                    type="button"
                    onClick={handleRequestExit}
                    disabled={requestingExit}
                    className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-2.5 text-sm font-semibold text-amber-200 hover:bg-amber-500/20 disabled:opacity-60 transition-colors"
                  >
                    {requestingExit ? "Submitting…" : "Request to exit pool"}
                  </button>
                </div>
              )}

              {/* Exit unavailable messages for active members */}
              {isMember && !canRequestCancellation && (
                <div className="pt-4 border-t border-[--color-border]">
                  {poolIsActive ? (
                    <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                      <p className="text-sm text-red-200 font-medium">
                        ⛔ Pool is trading
                      </p>
                      <p className="text-xs text-red-300/70 mt-1">
                        Cancellation is only allowed before the pool starts trading.
                        You are now locked in until the pool completes.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                      <p className="text-sm text-amber-200 font-medium">
                        ⏳ Cancellation unavailable
                      </p>
                      <p className="text-xs text-amber-300/70 mt-1">
                        Cancellation is not available for this pool at this time.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ═══════════ REJOIN BANNER ═══════════ */}
          {isRejoin && rejoinInfo && !isMember && joinStep !== "idle" && (
            <div className="rounded-xl border border-green-500/40 bg-green-500/10 p-5 space-y-3">
              <div className="flex items-start gap-3">
                <svg
                  className="h-5 w-5 text-green-400 mt-0.5 shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="font-semibold text-green-200">
                    Welcome back! You were reactivated.
                  </p>
                  <p className="text-sm text-green-300/90 mt-1">
                    You previously cancelled this pool on{" "}
                    <span className="font-medium">
                      {new Date(rejoinInfo.requested_at).toLocaleDateString()}
                    </span>
                    . We received your refund of{" "}
                    <span className="font-medium">
                      {rejoinInfo.refund_amount} {pool?.coin_type || "USDT"}
                    </span>
                    . Now you need to complete a new payment to rejoin.
                  </p>
                </div>
              </div>
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
          {!isMemberEffective && joinStep !== "idle" && (
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

                    {/* Network & Coin info (read-only) — from pool */}
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-lg bg-[--color-surface-alt] p-3">
                        <p className="text-xs text-slate-400">Network</p>
                        <p className="text-sm font-semibold text-white">
                          {networkName || "BSC"} (BEP-20)
                        </p>
                      </div>
                      <div className="rounded-lg bg-[--color-surface-alt] p-3">
                        <p className="text-xs text-slate-400">
                          Deposit Coin
                        </p>
                        <p className="text-sm font-semibold text-white">
                          {depositCoinName || "USDT"}
                        </p>
                      </div>
                      <div className="rounded-lg bg-[--color-surface-alt] p-3">
                        <p className="text-xs text-slate-400">Method</p>
                        <p className="text-sm font-semibold text-white">
                          {depositMethodName === "on_chain"
                            ? "On-Chain Deposit"
                            : depositMethodName || "On-Chain Deposit"}
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
                      disabled={joining || !userWalletAddress.trim() || !isValidBscAddress(userWalletAddress.trim())}
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
                  {/* Welcome back banner for rejoin */}
                  {isRejoin && rejoinInfo && (
                    <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 space-y-2">
                      <p className="text-sm font-semibold text-emerald-100">
                        👋 Welcome Back!
                      </p>
                      <p className="text-xs text-emerald-200/80">
                        You previously exited the pool and received a refund of{" "}
                        <span className="font-semibold">
                          {rejoinInfo.refund_amount} {pool?.deposit_coin || "USDT"}
                        </span>
                        . Now you're rejoining with a fresh investment.
                      </p>
                    </div>
                  )}

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
                          Transaction ID{" "}
                          <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={txHash}
                          onChange={(e) => setTxHash(e.target.value)}
                          placeholder="0x... or Binance TX ID"
                          className="w-full rounded-xl border border-[--color-border] bg-[--color-background] px-4 py-2.5 text-white font-mono placeholder:text-slate-500 focus:border-[#fc4f02] focus:outline-none focus:ring-1 focus:ring-[#fc4f02]"
                        />
                        <p className="mt-1 text-xs text-slate-500">
                          For Binance P2P: Find the order ID in Binance → P2P → Orders.
                          For blockchain withdrawal: Find in Binance → Wallet → Transaction History.
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
                          disabled={submittingTx || !txHash.trim() || !isValidTxHash(txHash.trim())}
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
                              Your transaction ID has been submitted. The admin
                              will verify your payment and approve or reject it.
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
            !userHasExitedPool &&
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
            !userHasExitedPool &&
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
                  <dd className="font-medium">{maxMembers ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">Pool fee</dt>
                  <dd className="font-medium">
                    {poolFeePct ?? "—"}%
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">Payment window</dt>
                  <dd className="font-medium">
                    {paymentWindow ?? "—"} min
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
                    {adminWalletAddr ||
                      adminBinanceUid ||
                      "Not set"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">Network</dt>
                  <dd className="font-medium text-white">
                    {networkName || "BSC"} (BEP-20)
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">Deposit Coin</dt>
                  <dd className="font-medium text-white">
                    {depositCoinName || "USDT"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">Method</dt>
                  <dd className="font-medium text-white capitalize">
                    {depositMethodName === "on_chain"
                      ? "On-Chain Deposit"
                      : depositMethodName || "On-Chain Deposit"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ EXIT CONFIRMATION MODAL ═══════════ */}
      {showExitConfirmModal && isMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[--color-border] bg-[--color-surface] p-6 space-y-5">
            <div>
              <h2 className="text-xl font-bold text-white">
                Confirm Pool Exit
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                You are about to request cancellation of your membership. Please review the fee breakdown below.
              </p>
            </div>

            {/* Fee breakdown */}
            <div className="rounded-lg bg-[--color-surface-alt] p-4 space-y-3">
              <div>
                <p className="text-xs text-slate-400">
                  Your Contribution
                </p>
                <p className="text-lg font-bold text-white">
                  {investmentAmount} {pool?.coin_type || "USDT"}
                </p>
              </div>

              <div className="flex items-center justify-between text-sm border-t border-[--color-border] pt-3">
                <span className="text-slate-400">Cancellation Fee</span>
                <span className="text-red-400">
                  -{paymentStatus?.payment?.pool_fee_amount || "0"} {pool?.coin_type || "USDT"}
                </span>
              </div>

              <div className="flex items-center justify-between font-semibold border-t border-[--color-border] pt-3">
                <span className="text-white">You will receive</span>
                <span className="text-green-400 text-lg">
                  {investmentAmount
                    ? (Number(investmentAmount) - (Number(paymentStatus?.payment?.pool_fee_amount) || 0)).toFixed(2)
                    : investmentAmount || "0"} {pool?.coin_type || "USDT"}
                </span>
              </div>
            </div>

            {/* Info message */}
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
              <p className="text-xs text-amber-200">
                <span className="font-semibold">Note:</span> After admin approval, the refund will be sent to your wallet address within 24 hours.
              </p>
            </div>

            {!canRequestCancellation && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                <p className="text-xs text-red-200">
                  <span className="font-semibold">⚠️ Pool Status Changed:</span> This pool is no longer eligible for cancellation. Cancellation is only allowed before the pool starts trading.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowExitConfirmModal(false)}
                disabled={requestingExit}
                className="flex-1 rounded-lg border border-[--color-border] px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5 transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmExit}
                disabled={requestingExit || !canRequestCancellation}
                className="flex-1 rounded-lg bg-red-500/20 border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-200 hover:bg-red-500/30 disabled:opacity-60 transition-colors"
              >
                {requestingExit ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-200 border-t-transparent" />
                    Submitting…
                  </span>
                ) : (
                  "Confirm Exit"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
