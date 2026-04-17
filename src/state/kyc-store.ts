import { create } from "zustand";
import { getKycStatus } from "@/lib/api/kyc";
import type { KycStatus } from "@/lib/api/types/kyc";

interface KycState {
  status: KycStatus | null;
  reviewRejectType: "RETRY" | "FINAL" | null;
  rejectionReasons: string[];
  kycId: string | null;
  isLoading: boolean;
  lastFetched: number | null;
  pollingHandle: ReturnType<typeof setInterval> | null;

  fetchStatus: () => Promise<void>;
  startPolling: (intervalMs?: number) => void;
  stopPolling: () => void;
  reset: () => void;
}

const useKycStore = create<KycState>((set, get) => ({
  status: null,
  reviewRejectType: null,
  rejectionReasons: [],
  kycId: null,
  isLoading: false,
  lastFetched: null,
  pollingHandle: null,

  fetchStatus: async () => {
    set({ isLoading: true });
    try {
      const resp = await getKycStatus();
      set({
        status: resp.status,
        reviewRejectType: (resp.review_reject_type as "RETRY" | "FINAL" | null) ?? null,
        rejectionReasons: resp.rejection_reasons ?? [],
        kycId: resp.kyc_id,
        isLoading: false,
        lastFetched: Date.now(),
      });
    } catch (err) {
      // 404 means no KYC record yet (brand new user before SDK flow)
      set({ isLoading: false });
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.warn("KYC status fetch failed:", err);
      }
    }
  },

  startPolling: (intervalMs = 30000) => {
    const { pollingHandle, fetchStatus } = get();
    if (pollingHandle) return;
    fetchStatus();
    const handle = setInterval(() => {
      const { status } = get();
      // Stop polling once we hit a terminal state
      if (status === "approved") {
        get().stopPolling();
        return;
      }
      fetchStatus();
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
      status: null,
      reviewRejectType: null,
      rejectionReasons: [],
      kycId: null,
      isLoading: false,
      lastFetched: null,
    });
  },
}));

export default useKycStore;
