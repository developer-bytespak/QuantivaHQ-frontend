import { apiRequest } from "./client";
import type { OnboardingProgressShape } from "@/lib/auth/flow-router.service";

export async function getOnboardingProgress(): Promise<OnboardingProgressShape> {
  return apiRequest<undefined, OnboardingProgressShape>({
    path: "/onboarding/progress",
    method: "GET",
  });
}

export async function acknowledgeFreeTier(): Promise<{ acknowledged: true; free_signal_trades_granted: number }> {
  return apiRequest<undefined, { acknowledged: true; free_signal_trades_granted: number }>({
    path: "/onboarding/acknowledge-free-tier",
    method: "POST",
  });
}

export interface FreeSignalTradesQuota {
  has_grant: boolean;
  granted: number;
  used: number;
  remaining: number;
}

export async function getFreeSignalTradesQuota(): Promise<FreeSignalTradesQuota> {
  return apiRequest<undefined, FreeSignalTradesQuota>({
    path: "/onboarding/free-signal-trades",
    method: "GET",
  });
}
