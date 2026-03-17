import { create } from "zustand";
import type {
  OptionContract,
  OptionsPosition,
  OptionsOrder,
  OptionsRecommendation,
  OptionsAccount,
  AvailableUnderlying,
  Greeks,
  OptionType,
  AiOptionsSignal,
  IvRankData,
} from "@/lib/api/options.service";

// ── Types ────────────────────────────────────────────────────────────────────

export type OptionsTab = "chain" | "positions" | "orders" | "recommendations" | "ai-signals";

interface OptionsState {
  // ── Data ──────────────────────────────────────────────
  availableUnderlyings: AvailableUnderlying[];
  selectedUnderlying: string | null;
  selectedExpiry: string | null;
  expiryDates: string[];
  optionsChain: OptionContract[];
  selectedContract: OptionContract | null;
  selectedContractGreeks: Greeks | null;
  positions: OptionsPosition[];
  orders: OptionsOrder[];
  recommendations: OptionsRecommendation[];
  aiSignals: AiOptionsSignal[];
  ivRankData: IvRankData | null;
  account: OptionsAccount | null;
  activeTab: OptionsTab;

  // ── Order Form ────────────────────────────────────────
  orderForm: {
    optionType: OptionType;
    side: "BUY" | "SELL";
    quantity: number;
    price: number;
  };

  // ── Loading / Error ───────────────────────────────────
  isLoadingChain: boolean;
  isLoadingPositions: boolean;
  isLoadingOrders: boolean;
  isLoadingRecommendations: boolean;
  isLoadingAiSignals: boolean;
  isLoadingAccount: boolean;
  isPlacingOrder: boolean;
  error: string | null;

  // ── Setters ───────────────────────────────────────────
  setAvailableUnderlyings: (u: AvailableUnderlying[]) => void;
  setSelectedUnderlying: (u: string | null) => void;
  setSelectedExpiry: (e: string | null) => void;
  setExpiryDates: (dates: string[]) => void;
  setOptionsChain: (chain: OptionContract[]) => void;
  setSelectedContract: (c: OptionContract | null) => void;
  setSelectedContractGreeks: (g: Greeks | null) => void;
  setPositions: (p: OptionsPosition[]) => void;
  setOrders: (o: OptionsOrder[]) => void;
  setRecommendations: (r: OptionsRecommendation[]) => void;
  setAiSignals: (s: AiOptionsSignal[]) => void;
  setIvRankData: (d: IvRankData | null) => void;
  setAccount: (a: OptionsAccount | null) => void;
  setActiveTab: (tab: OptionsTab) => void;
  setOrderForm: (form: Partial<OptionsState["orderForm"]>) => void;
  setIsLoadingChain: (v: boolean) => void;
  setIsLoadingPositions: (v: boolean) => void;
  setIsLoadingOrders: (v: boolean) => void;
  setIsLoadingRecommendations: (v: boolean) => void;
  setIsLoadingAiSignals: (v: boolean) => void;
  setIsLoadingAccount: (v: boolean) => void;
  setIsPlacingOrder: (v: boolean) => void;
  setError: (e: string | null) => void;
  reset: () => void;
}

// ── Defaults ─────────────────────────────────────────────────────────────────

const defaultOrderForm = {
  optionType: "CALL" as OptionType,
  side: "BUY" as const,
  quantity: 1,
  price: 0,
};

const defaultState = {
  availableUnderlyings: [],
  selectedUnderlying: null,
  selectedExpiry: null,
  expiryDates: [],
  optionsChain: [],
  selectedContract: null,
  selectedContractGreeks: null,
  positions: [],
  orders: [],
  recommendations: [],
  aiSignals: [],
  ivRankData: null,
  account: null,
  activeTab: "chain" as OptionsTab,
  orderForm: { ...defaultOrderForm },
  isLoadingChain: false,
  isLoadingPositions: false,
  isLoadingOrders: false,
  isLoadingRecommendations: false,
  isLoadingAiSignals: false,
  isLoadingAccount: false,
  isPlacingOrder: false,
  error: null,
};

// ── Store ────────────────────────────────────────────────────────────────────

export const useOptionsStore = create<OptionsState>((set) => ({
  ...defaultState,

  setAvailableUnderlyings: (availableUnderlyings) => set({ availableUnderlyings }),
  setSelectedUnderlying: (selectedUnderlying) => set({ selectedUnderlying }),
  setSelectedExpiry: (selectedExpiry) => set({ selectedExpiry }),
  setExpiryDates: (expiryDates) => set({ expiryDates }),
  setOptionsChain: (optionsChain) => set({ optionsChain }),
  setSelectedContract: (selectedContract) => set({ selectedContract }),
  setSelectedContractGreeks: (selectedContractGreeks) => set({ selectedContractGreeks }),
  setPositions: (positions) => set({ positions }),
  setOrders: (orders) => set({ orders }),
  setRecommendations: (recommendations) => set({ recommendations }),
  setAiSignals: (aiSignals) => set({ aiSignals }),
  setIvRankData: (ivRankData) => set({ ivRankData }),
  setAccount: (account) => set({ account }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setOrderForm: (form) =>
    set((state) => ({ orderForm: { ...state.orderForm, ...form } })),
  setIsLoadingChain: (isLoadingChain) => set({ isLoadingChain }),
  setIsLoadingPositions: (isLoadingPositions) => set({ isLoadingPositions }),
  setIsLoadingOrders: (isLoadingOrders) => set({ isLoadingOrders }),
  setIsLoadingRecommendations: (isLoadingRecommendations) =>
    set({ isLoadingRecommendations }),
  setIsLoadingAiSignals: (isLoadingAiSignals) => set({ isLoadingAiSignals }),
  setIsLoadingAccount: (isLoadingAccount) => set({ isLoadingAccount }),
  setIsPlacingOrder: (isPlacingOrder) => set({ isPlacingOrder }),
  setError: (error) => set({ error }),
  reset: () => set({ ...defaultState, orderForm: { ...defaultOrderForm } }),
}));
