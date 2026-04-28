import { apiRequest } from "./client";
import type { OnboardingProgressShape } from "@/lib/auth/flow-router.service";

export async function getOnboardingProgress(): Promise<OnboardingProgressShape> {
  return apiRequest<undefined, OnboardingProgressShape>({
    path: "/onboarding/progress",
    method: "GET",
  });
}

export async function acknowledgeFreeTier(): Promise<{ acknowledged: true }> {
  return apiRequest<undefined, { acknowledged: true }>({
    path: "/onboarding/acknowledge-free-tier",
    method: "POST",
  });
}
