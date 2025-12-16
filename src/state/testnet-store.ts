import { create } from "zustand";

interface TestnetConnection {
  connection_id: string;
  connection_name: string;
  status: string;
  enable_trading: boolean;
  created_at: string;
  last_verified_at?: string;
}

interface TestnetPosition {
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
}

interface TestnetState {
  // Connections
  connections: TestnetConnection[];
  activeConnectionId: string | null;
  
  // Account data
  totalBalance: number;
  totalBalanceUSD: number;
  totalPnL: number;
  totalPnLPercent: number;
  
  // Positions & Orders
  positions: TestnetPosition[];
  openOrdersCount: number;
  
  // Paper trading specific
  paperTradingEnabled: boolean;
  initialBalance: number;
  dailyPnL: number;
  dailyPnLPercent: number;
  
  // Loading states
  isLoadingConnections: boolean;
  isLoadingBalance: boolean;
  isLoadingOrders: boolean;
  
  // Actions
  setConnections: (connections: TestnetConnection[]) => void;
  setActiveConnection: (connectionId: string | null) => void;
  setBalance: (balance: number, balanceUSD: number) => void;
  setPositions: (positions: TestnetPosition[]) => void;
  setOpenOrdersCount: (count: number) => void;
  setPnL: (pnl: number, pnlPercent: number) => void;
  setDailyPnL: (pnl: number, pnlPercent: number) => void;
  setPaperTradingEnabled: (enabled: boolean) => void;
  setInitialBalance: (balance: number) => void;
  setLoadingConnections: (loading: boolean) => void;
  setLoadingBalance: (loading: boolean) => void;
  setLoadingOrders: (loading: boolean) => void;
  reset: () => void;
}

const initialState = {
  connections: [],
  activeConnectionId: null,
  totalBalance: 0,
  totalBalanceUSD: 0,
  totalPnL: 0,
  totalPnLPercent: 0,
  positions: [],
  openOrdersCount: 0,
  paperTradingEnabled: false,
  initialBalance: 0,
  dailyPnL: 0,
  dailyPnLPercent: 0,
  isLoadingConnections: false,
  isLoadingBalance: false,
  isLoadingOrders: false,
};

export const useTestnetStore = create<TestnetState>((set) => ({
  ...initialState,
  
  setConnections: (connections) =>
    set({ connections }),
  
  setActiveConnection: (connectionId) =>
    set({ activeConnectionId: connectionId }),
  
  setBalance: (balance, balanceUSD) =>
    set({ totalBalance: balance, totalBalanceUSD: balanceUSD }),
  
  setPositions: (positions) =>
    set({ positions }),
  
  setOpenOrdersCount: (count) =>
    set({ openOrdersCount: count }),
  
  setPnL: (pnl, pnlPercent) =>
    set({ totalPnL: pnl, totalPnLPercent: pnlPercent }),
  
  setDailyPnL: (pnl, pnlPercent) =>
    set({ dailyPnL: pnl, dailyPnLPercent: pnlPercent }),
  
  setPaperTradingEnabled: (enabled) =>
    set({ paperTradingEnabled: enabled }),
  
  setInitialBalance: (balance) =>
    set({ initialBalance: balance }),
  
  setLoadingConnections: (loading) =>
    set({ isLoadingConnections: loading }),
  
  setLoadingBalance: (loading) =>
    set({ isLoadingBalance: loading }),
  
  setLoadingOrders: (loading) =>
    set({ isLoadingOrders: loading }),
  
  reset: () =>
    set(initialState),
}));
