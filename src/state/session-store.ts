import { create } from "zustand";

type ThemePreference = "dark" | "light" | "system";

type Currency = "USD" | "EUR" | "GBP" | "SGD" | "AUD";

type SubscriptionTier = "free" | "pro" | "elite";

type SessionState = {
  isAuthenticated: boolean;
  userName: string | null;
  theme: ThemePreference;
  baseCurrency: Currency;
  subscription: SubscriptionTier;
  setAuthenticated: (value: boolean) => void;
  setUserName: (value: string | null) => void;
  setTheme: (theme: ThemePreference) => void;
  setCurrency: (currency: Currency) => void;
  setSubscription: (tier: SubscriptionTier) => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  isAuthenticated: false,
  userName: null,
  theme: "dark",
  baseCurrency: "USD",
  subscription: "free",
  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setUserName: (userName) => set({ userName }),
  setTheme: (theme) => set({ theme }),
  setCurrency: (baseCurrency) => set({ baseCurrency }),
  setSubscription: (subscription) => set({ subscription }),
}));
