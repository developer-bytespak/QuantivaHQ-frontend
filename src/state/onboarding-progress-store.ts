import { create } from "zustand";
import { apiRequest } from "@/lib/api/client";
import type { OnboardingProgressShape } from "@/lib/auth/flow-router.service";

interface OnboardingProgressState {
  progress: OnboardingProgressShape | null;
  isLoading: boolean;
  lastFetched: number | null;
  pollingHandle: ReturnType<typeof setInterval> | null;
  hasError: boolean;

  fetchProgress: () => Promise<void>;
  startPolling: (intervalMs?: number) => void;
  stopPolling: () => void;
  reset: () => void;
}

const useOnboardingProgressStore = create<OnboardingProgressState>((set, get) => ({
  progress: null,
  isLoading: false,
  lastFetched: null,
  pollingHandle: null,
  hasError: false,

  fetchProgress: async () => {
    set({ isLoading: true });
    try {
      const data = await apiRequest<undefined, OnboardingProgressShape>({
        path: "/onboarding/progress",
        method: "GET",
      });
      set({
        progress: data,
        isLoading: false,
        lastFetched: Date.now(),
        hasError: false,
      });
    } catch (err) {
      set({ isLoading: false, hasError: true });
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.warn("Onboarding progress fetch failed:", err);
      }
    }
  },

  startPolling: (intervalMs = 30000) => {
    const { pollingHandle, fetchProgress } = get();
    if (pollingHandle) return;
    fetchProgress();
    const handle = setInterval(() => {
      const { progress } = get();
      // Stop polling once everything is complete — nothing more to watch.
      if (progress && isFullyOnboarded(progress)) {
        get().stopPolling();
        return;
      }
      fetchProgress();
    }, intervalMs);
    set({ pollingHandle: handle });
  },

  stopPolling: () => {
    const { pollingHandle } = get();
    if (pollingHandle) {
      clearInterval(pollingHandle);
      set({ pollingHandle: null });
    }
  },

  reset: () => {
    get().stopPolling();
    set({
      progress: null,
      isLoading: false,
      lastFetched: null,
      hasError: false,
    });
  },
}));

export function isFullyOnboarded(p: OnboardingProgressShape): boolean {
  const subscriptionDone = p.subscription.is_paid || p.subscription.acknowledged;
  return (
    p.personal_info.complete &&
    p.kyc.status === "approved" &&
    subscriptionDone &&
    p.exchange.connected
  );
}

export function completedStepCount(p: OnboardingProgressShape): number {
  let count = 0;
  if (p.personal_info.complete) count += 1;
  if (p.kyc.status === "approved") count += 1;
  if (p.subscription.is_paid || p.subscription.acknowledged) count += 1;
  if (p.exchange.connected) count += 1;
  return count;
}

export default useOnboardingProgressStore;
