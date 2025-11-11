import { create } from "zustand";

export type Position = {
  id: string;
  symbol: string;
  side: "long" | "short";
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  leverage: number;
};

type Signal = {
  id: string;
  symbol: string;
  confidence: number;
  timeframe: string;
  direction: "long" | "short";
};

type TradingState = {
  accountValue: number;
  dailyPnl: number;
  openPositions: Position[];
  aiSignals: Signal[];
  setAccountValue: (value: number) => void;
  setDailyPnl: (value: number) => void;
  setPositions: (positions: Position[]) => void;
  setSignals: (signals: Signal[]) => void;
  reset: () => void;
};

const defaultTradingState = {
  accountValue: 250000,
  dailyPnl: 1250,
  openPositions: [],
  aiSignals: [],
};

export const useTradingStore = create<TradingState>((set) => ({
  ...defaultTradingState,
  setAccountValue: (accountValue) => set({ accountValue }),
  setDailyPnl: (dailyPnl) => set({ dailyPnl }),
  setPositions: (openPositions) => set({ openPositions }),
  setSignals: (aiSignals) => set({ aiSignals }),
  reset: () => set({ ...defaultTradingState }),
}));
