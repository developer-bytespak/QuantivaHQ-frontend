"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/api/user";
import { navigateToDashboard } from "@/lib/auth/flow-router.service";
import useSubscriptionStore from "@/state/subscription-store";

/**
 * Shared homepage trial CTA. Uses the same auth check as the pricing cards
 * (getCurrentUser): signed-out visitors go to sign-up, signed-in Free users
 * go to the choose-plan page, Premium users go straight to the dashboard.
 */
export function useTrialCta() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);

  const startTrial = async () => {
    setIsChecking(true);
    try {
      await getCurrentUser();
      // Signed in. Refresh the plan so the destination is right even when the
      // store has not been populated yet (homepage visitors rarely have it).
      const store = useSubscriptionStore.getState();
      await store.fetchSubscriptionData();
      if (useSubscriptionStore.getState().isPremium()) {
        await navigateToDashboard(router);
      } else {
        router.push("/onboarding/choose-plan");
      }
    } catch (error: unknown) {
      const err = error as { status?: number; statusCode?: number; message?: string };
      const isUnauthorized =
        err?.status === 401 ||
        err?.statusCode === 401 ||
        err?.message?.includes("401") ||
        err?.message?.includes("Unauthorized");
      if (!isUnauthorized) {
        console.error("Error checking authentication:", error);
      }
      router.push("/onboarding/sign-up?tab=signup");
    } finally {
      setIsChecking(false);
    }
  };

  return { startTrial, isChecking };
}
