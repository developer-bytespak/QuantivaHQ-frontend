import { apiRequest } from "./client";
import type { OnboardingProgressShape } from "@/lib/auth/flow-router.service";

export async function getOnboardingProgress(): Promise<OnboardingProgressShape> {
  return apiRequest<undefined, OnboardingProgressShape>({
    path: "/onboarding/progress",
    method: "GET",
  });
}

/**
 * Marks the "choose plan" onboarding step as acknowledged for users who stay
 * on Free. The legacy free signal-trade allowance is retired; the backend may
 * still echo `free_signal_trades_granted` (always 0) for a short while.
 */
export async function acknowledgeFreeTier(): Promise<{ acknowledged: true; free_signal_trades_granted?: number }> {
  return apiRequest<undefined, { acknowledged: true; free_signal_trades_granted?: number }>({
    path: "/onboarding/acknowledge-free-tier",
    method: "POST",
  });
}
