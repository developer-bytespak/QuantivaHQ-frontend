"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import useSubscriptionStore from "@/state/subscription-store";
import { TRIAL_DAYS } from "@/config/subscription";

export const SUBSCRIPTION_ACTIVATED_EVENT = "quantiva:subscription-activated";

/**
 * Watches for the Stripe Checkout return flags (`?onboarding=plan-selected`
 * or `?checkout=success`), polls GET /subscriptions until the webhook has
 * flipped the user to Premium, then strips the params from the URL.
 *
 * Must be rendered inside <Suspense> because it reads useSearchParams.
 */
export function PlanActivationWatcher() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const pollUntilPremium = useSubscriptionStore((s) => s.pollUntilPremium);
  const isTrialActive = useSubscriptionStore((s) => s.isTrialActive);
  const [visible, setVisible] = useState(false);
  const runningRef = useRef(false);

  const shouldWatch =
    searchParams.get("onboarding") === "plan-selected" ||
    searchParams.get("checkout") === "success";

  useEffect(() => {
    if (!shouldWatch || runningRef.current) return;
    runningRef.current = true;
    setVisible(true);

    let cancelled = false;

    const stripParams = () => {
      if (!pathname) return;
      router.replace(pathname);
    };

    (async () => {
      let activated = false;
      try {
        activated = await pollUntilPremium({ attempts: 6, intervalMs: 1500 });
      } catch {
        activated = false;
      }
      if (cancelled) return;

      setVisible(false);
      if (activated) {
        toast.success(
          isTrialActive()
            ? `Premium is active. Your ${TRIAL_DAYS}-day free trial has started.`
            : "Premium is active.",
        );
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent(SUBSCRIPTION_ACTIVATED_EVENT));
        }
      } else {
        toast.info(
          "Payment received. Your plan will activate within a minute. Refresh if it does not appear.",
        );
      }
      stripParams();
      runningRef.current = false;
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldWatch]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 z-[300] flex -translate-x-1/2 items-center gap-3 rounded-full border border-[var(--primary)]/40 bg-[#161616]/95 px-4 py-2.5 text-sm text-white shadow-2xl shadow-black/50 backdrop-blur-xl"
    >
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
      <span>Activating your plan...</span>
    </div>
  );
}

export default PlanActivationWatcher;
