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

export type OptionsVenue = "BINANCE" | "ALPACA";
export type OptionsApprovalLevel = 0 | 1 | 2 | 3;

interface OptionsState {
  // ── Venue (auto-detected from active exchange connection) ─
  venue: OptionsVenue;
  connectionId: string | null;
  approvalLevel: OptionsApprovalLevel;
  isPaper: boolean;

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
  setVenue: (venue: OptionsVenue) => void;
  setConnectionId: (id: string | null) => void;
  setApprovalLevel: (level: OptionsApprovalLevel) => void;
  setIsPaper: (v: boolean) => void;
  resetForVenueChange: (next: {
    venue: OptionsVenue;
    connectionId: string | null;
    isPaper: boolean;
    approvalLevel: OptionsApprovalLevel;
  }) => void;
  setAvailableUnderlyings: (u: AvailableUnderlying[]) => void;
  updateUnderlyingPrice: (symbol: string, price: number) => void;
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
  venue: "BINANCE" as OptionsVenue,
  connectionId: null as string | null,
  approvalLevel: 3 as OptionsApprovalLevel, // Binance is always "approved"
  isPaper: false,
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

  setVenue: (venue) => set({ venue }),
  setConnectionId: (connectionId) => set({ connectionId }),
  setApprovalLevel: (approvalLevel) => set({ approvalLevel }),
  setIsPaper: (isPaper) => set({ isPaper }),
  /**
   * Atomically swap the venue and wipe all venue-scoped data so the new
   * venue's fetchers start from a clean slate (BTC chain shouldn't briefly
   * render while Alpaca SPY chain is loading).
   */
  resetForVenueChange: ({ venue, connectionId, isPaper, approvalLevel }) =>
    set({
      ...defaultState,
      orderForm: { ...defaultOrderForm },
      venue,
      connectionId,
      isPaper,
      approvalLevel,
    }),

  setAvailableUnderlyings: (availableUnderlyings) => set({ availableUnderlyings }),
  updateUnderlyingPrice: (symbol, price) =>
    set((state) => ({
      availableUnderlyings: state.availableUnderlyings.map((u) =>
        u.symbol === symbol ? { ...u, indexPrice: price } : u,
      ),
    })),
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
