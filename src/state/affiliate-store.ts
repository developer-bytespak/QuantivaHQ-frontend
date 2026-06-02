import { create } from "zustand";
import type { AffiliateProfile, AffiliateStatus } from "@/lib/api/affiliate";

type AffiliateState = {
  profile: AffiliateProfile | null;
  status: AffiliateStatus | null;
  setProfile: (profile: AffiliateProfile | null) => void;
  clear: () => void;
};

export const useAffiliateStore = create<AffiliateState>((set) => ({
  profile: null,
  status: null,
  setProfile: (profile) =>
    set({ profile, status: profile?.status ?? null }),
  clear: () => set({ profile: null, status: null }),
}));
