"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { qhqApi } from "@/lib/api/qhq-token";

const DISMISSED_STORAGE_KEY = "qhq.referralBonus.v1.dismissed";

/**
 * Shown on the dashboard to users who signed up through an affiliate referral
 * and haven't claimed their one-time bonus yet. Claiming credits 100 QHQ,
 * grants a 10% discount on the first subscription purchase, and sends the
 * user to the QHQ page. Eligibility is enforced server-side; the localStorage
 * key only keeps the popup from re-appearing after an explicit dismissal.
 */
export function ReferralBonusModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (window.localStorage.getItem(DISMISSED_STORAGE_KEY) === "1") return;
    } catch {
      // Private mode or storage disabled — fall through and ask the server.
    }
    let cancelled = false;
    qhqApi
      .getReferralBonus()
      .then((status) => {
        if (!cancelled && status.eligible) setOpen(true);
      })
      .catch(() => {
        // Non-critical — if the check fails we simply don't show the popup.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const dismiss = () => {
    setOpen(false);
    try {
      window.localStorage.setItem(DISMISSED_STORAGE_KEY, "1");
    } catch {
      // Best-effort persistence.
    }
  };

  const handleClaim = async () => {
    setClaiming(true);
    setError(null);
    try {
      await qhqApi.claimReferralBonus();
      dismiss();
      router.push("/dashboard/qhq");
    } catch (err: unknown) {
      setError(
        (err as { message?: string })?.message ??
          "Could not claim the bonus. Please try again.",
      );
    } finally {
      setClaiming(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={dismiss}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[var(--primary)]/40 bg-gradient-to-br from-[var(--primary)]/15 via-slate-900 to-black p-6 shadow-2xl shadow-[rgba(var(--primary-rgb),0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Dismiss"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--primary)]/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--primary)]">
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
          </svg>
          Referral welcome bonus
        </div>

        <h2 className="mb-2 text-xl font-bold text-white sm:text-2xl">
          Claim 100 QHQ tokens and get 10% off on your first subscription
          purchase
        </h2>
        <p className="mb-5 text-sm text-slate-300">
          You joined through a referral, so this one is on us —{" "}
          <span className="font-semibold text-white">100 QHQ tokens</span>{" "}
          credited instantly, plus a{" "}
          <span className="font-semibold text-white">10% discount</span>{" "}
          applied automatically at your first subscription checkout.
        </p>

        {error && (
          <div className="mb-4 rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
            {error}
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-3">
          <button
            type="button"
            onClick={dismiss}
            className="flex-1 rounded-lg border border-white/15 bg-transparent px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-white/30 hover:text-white"
          >
            Maybe later
          </button>
          <button
            type="button"
            onClick={handleClaim}
            disabled={claiming}
            className="flex-1 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[rgba(var(--primary-rgb),0.3)] transition hover:opacity-90 hover:scale-[1.02] disabled:opacity-50"
          >
            {claiming ? "Claiming…" : "Claim 100 QHQ"}
          </button>
        </div>
      </div>
    </div>
  );
}
