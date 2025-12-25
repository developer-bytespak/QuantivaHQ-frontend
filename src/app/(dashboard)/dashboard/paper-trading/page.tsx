"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { binanceTestnetService } from "@/lib/api/binance-testnet.service";
import { binanceWebSocketService } from "@/lib/api/binance-websocket.service";
import { apiRequest } from "@/lib/api/client";
import type { Strategy } from "@/lib/api/strategies";
import { getPreBuiltStrategySignals } from "@/lib/api/strategies";
import { BalanceOverview } from "./components/balance-overview";
import { StrategyCard } from "./components/strategy-card";
import { AutoTradeModal } from "./components/auto-trade-modal";
import { ManualTradeModal } from "./components/manual-trade-modal";
import TradeLeaderboard from "./components/trade-leaderboard";
import { OrdersPanel } from "./components/orders-panel";

// ⏱️ API Refresh Intervals (in milliseconds)
const ACCOUNT_DATA_REFRESH_INTERVAL = 300000;  // 5 minutes - Account balance & orders
const SIGNALS_REFRESH_INTERVAL = 300000;      // 5 minutes - Strategy signals

// --- Formatting helpers ---
const formatCurrency = (v: any) => {
  if (v === null || v === undefined || v === '—' || v === '') return '—';
  const n = Number(String(v));
  if (isNaN(n)) return String(v);
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);
};

const formatPercent = (v: any) => {
  if (v === null || v === undefined || v === '—' || v === '') return '—';
  const s = String(v).trim();
  if (s.endsWith('%')) return s;
  const n = Number(s);
  if (isNaN(n)) return s;
  return `${n}%`;
};

interface Trade {
  id: number;
  assetId?: string;
  symbol?: string; // Clean symbol without USDT
  pair: string;
  type: "BUY" | "SELL";
  confidence: "HIGH" | "MEDIUM" | "LOW";
  ext: string;
  entry: string;
  stopLoss: string;
  progressMin: number;
  progressMax: number;
  progressValue: number;
  entryPrice: string;
  stopLossPrice: string;
  takeProfit1: string;
  target: string;
  insights: string[];
  profit: string;
  profitValue: number;
  volume: string;
  volumeValue: number;
  winRate: string;
  winRateValue: number;
  hoursAgo: number;
  trend_score?: number;
  trend_direction?: "TRENDING_UP" | "TRENDING_DOWN" | "STABLE";
  score_change?: number;
  volume_ratio?: number;
  volume_status?: "NORMAL" | "VOLUME_SURGE" | "MASSIVE_SURGE";
}

type TradeRecord = {
  id: string;
  timestamp: number;
  symbol: string;
  type: "BUY" | "SELL";
  entryPrice: string;
  profitValue: number;
  strategyName?: string;
};

export default function PaperTradingPage() {
  // Refs to track last fetch times and prevent aggressive reloads
  const lastAccountDataFetch = useRef<number>(0);
  const lastAllOrdersFetch = useRef<number>(0);
  const isPageVisible = useRef<boolean>(true);
  
  // Account data
  const [balance, setBalance] = useState(0);
  const [openOrdersCount, setOpenOrdersCount] = useState(0);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [status, setStatus] = useState<any>(null);

  // Strategies and signals
  const [preBuiltStrategies, setPreBuiltStrategies] = useState<Strategy[]>([]);
  const [loadingPreBuilt, setLoadingPreBuilt] = useState(false);
  const [preBuiltError, setPreBuiltError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [strategySignals, setStrategySignals] = useState<Record<string, any[]>>({});
  const [loadingSignals, setLoadingSignals] = useState<Record<string, boolean>>({});
  const [signalsError, setSignalsError] = useState<Record<string, string>>({});

  // UI filters
  const [timeFilter, setTimeFilter] = useState<"24h" | "7d" | "30d" | "all">("all");
  const [sortBy, setSortBy] = useState<"profit" | "volume" | "winrate">("profit");
  const ITEMS_PER_PAGE = 8;
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [showAutoTradeModal, setShowAutoTradeModal] = useState(false);
  const [showManualTradeModal, setShowManualTradeModal] = useState(false);
  const [showTradeOverlay, setShowTradeOverlay] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState<any | null>(null);
  const [selectedTradeIndex, setSelectedTradeIndex] = useState<number>(0);

  // Success toast
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Leaderboard (frontend-only, ephemeral)
  const [tradeRecords, setTradeRecords] = useState<TradeRecord[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Create custom strategy state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createStopLoss, setCreateStopLoss] = useState("5");
  const [createTakeProfit, setCreateTakeProfit] = useState("10");
  const [createRiskLevel, setCreateRiskLevel] = useState<"low"|"medium"|"high">("medium");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Orders panel state
  const [showOrdersPanel, setShowOrdersPanel] = useState(false);
  const [ordersRefreshKey, setOrdersRefreshKey] = useState(0);

  // --- Load testnet status on mount ---
  useEffect(() => {
    const loadStatus = async () => {
      try {
        const testnetStatus = await binanceTestnetService.getStatus();
        setStatus(testnetStatus);
      } catch (err: any) {
        console.error("Failed to load testnet status:", err);
      }
    };
    loadStatus();
  }, []);

  // --- WebSocket Connection: Real-time updates (eliminates polling) ---
  useEffect(() => {
    if (!status?.configured) return;

    console.log("🔌 Connecting to Binance WebSocket for real-time updates");
    
    // Connect WebSocket
    binanceWebSocketService.connect().catch((err) => {
      console.error("Failed to connect WebSocket:", err);
    });

    // Listen for order updates
    const unsubOrder = binanceWebSocketService.onOrderUpdate((order) => {
      console.log("📦 Order update:", order);
      // Trigger orders panel refresh
      setOrdersRefreshKey((k) => k + 1);
      // Refresh account data to update balance
      loadAccountData();
    });

    // Listen for balance updates
    const unsubBalance = binanceWebSocketService.onBalanceUpdate((balances) => {
      console.log("💰 Balance update:", balances);
      // Refresh account data
      loadAccountData();
    });

    // Cleanup on unmount
    return () => {
      console.log("🔌 Disconnecting WebSocket");
      unsubOrder();
      unsubBalance();
      binanceWebSocketService.disconnect();
    };
  }, [status?.configured]);

  // --- Page Visibility API: Pause polling when tab is hidden ---
  useEffect(() => {
    const handleVisibilityChange = () => {
      isPageVisible.current = !document.hidden;
      
      if (!document.hidden) {
        // Tab became visible - check if we need to refresh data
        const now = Date.now();
        
        // Only refresh if data is stale (older than 2 minutes)
        if (now - lastAccountDataFetch.current > 120000) {
          console.log("Tab visible again, refreshing stale account data");
          loadAccountData();
        }
        
        // Only refresh orders if very stale (older than 3 minutes)
        if (now - lastAllOrdersFetch.current > 180000) {
          console.log("Tab visible again, refreshing stale orders data");
          loadAllOrders();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [status?.configured]);

  // --- Load account data (significantly reduced polling due to WebSocket) ---
  // NOTE: Polling interval increased to 5 minutes since WebSocket provides real-time updates
  // We only poll occasionally as a fallback
  useEffect(() => {
    if (status && status.configured) {
      // Check if we recently fetched (within last 30 seconds) to avoid aggressive remount
      const now = Date.now();
      const timeSinceLastFetch = now - lastAccountDataFetch.current;
      
      if (timeSinceLastFetch > 30000) {
        loadAccountData();
      } else {
        console.log("Skipping account data fetch - recently fetched", timeSinceLastFetch, "ms ago");
      }
      
      // Much longer interval since WebSocket handles real-time updates
      const interval = setInterval(() => {
        // Only poll if page is visible
        if (isPageVisible.current) {
          loadAccountData();
        }
      }, 300000); // 5 minute polling as fallback
      
      return () => clearInterval(interval);
    }
  }, [status?.configured]);

  // --- Load all orders on page load (WebSocket handles updates) ---
  // Significantly reduced polling - WebSocket provides real-time order updates
  useEffect(() => {
    // Check if we recently fetched (within last 60 seconds) to avoid aggressive remount
    const now = Date.now();
    const timeSinceLastFetch = now - lastAllOrdersFetch.current;
    
    if (timeSinceLastFetch > 60000) {
      loadAllOrders();
    } else {
      console.log("Skipping all orders fetch - recently fetched", timeSinceLastFetch, "ms ago");
    }
    
    // Much longer interval since WebSocket provides real-time updates
    const interval = setInterval(() => {
      // Only poll if page is visible
      if (isPageVisible.current) {
        loadAllOrders();
      }
    }, 600000); // Refresh every 10 minutes as fallback
    
    return () => clearInterval(interval);
  }, []);

  const loadAllOrders = async () => {
    try {
      lastAllOrdersFetch.current = Date.now();
      await binanceTestnetService.getAllOrders(undefined, 100);
    } catch (err: any) {
      console.error("Failed to fetch all orders:", err);
    }
  };

  const loadAccountData = async () => {
    try {
      lastAccountDataFetch.current = Date.now();
      setLoadingBalance(true);
      const [balanceData, openOrders] = await Promise.all([
        binanceTestnetService.getAccountBalance(),
        binanceTestnetService.getOpenOrders(),
      ]);

      setBalance(balanceData.totalBalanceUSD);
      setOpenOrdersCount(openOrders.length);
    } catch (err: any) {
      console.error("Failed to load account data:", err);
    } finally {
      setLoadingBalance(false);
    }
  };

  // --- Fetch pre-built strategies ---
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingPreBuilt(true);
        const data = await apiRequest<never, Strategy[]>({
          path: "/strategies/pre-built",
          method: "GET",
        });
        if (!mounted) return;
        const adminOnly = (data || []).filter((s) => s?.type === "admin");
        setPreBuiltStrategies(adminOnly.slice(0, 4));
      } catch (err: any) {
        console.error("Failed to load pre-built strategies:", err);
        setPreBuiltError(err?.message || String(err));
      } finally {
        if (mounted) setLoadingPreBuilt(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // --- Fetch signals for a strategy ---
  const fetchStrategySignals = async (strategyId: string) => {
    if (loadingSignals[strategyId]) return;

    setLoadingSignals((p) => ({ ...p, [strategyId]: true }));
    setSignalsError((p) => {
      const c = { ...p };
      delete c[strategyId];
      return c;
    });

    try {
      // First, fetch the strategy to determine if it's user or pre-built
      let strategy: any = null;
      try {
        strategy = await apiRequest<never, Strategy>({ path: `/strategies/${strategyId}`, method: "GET" }).catch(() => null as any);
      } catch {
        strategy = null as any;
      }

      const isUserStrategy = (strategy as any)?.type === "user" || false;
      
      // Use appropriate endpoint based on strategy type
      let signals: any[] = [];
      if (isUserStrategy) {
        // For user strategies, fetch from /strategies/{id}/signals
        signals = await apiRequest<never, any[]>({ path: `/strategies/${strategyId}/signals`, method: "GET" });
      } else {
        // For pre-built strategies, use the existing function
        signals = await getPreBuiltStrategySignals(strategyId);
      }
      
      setStrategySignals((p) => ({ ...p, [strategyId]: signals || [] }));
    } catch (err: any) {
      console.error(`Failed to load signals for strategy ${strategyId}:`, err);
      setSignalsError((p) => ({ ...p, [strategyId]: err?.message || String(err) }));
      setStrategySignals((p) => ({ ...p, [strategyId]: [] }));
    } finally {
      setLoadingSignals((p) => ({ ...p, [strategyId]: false }));
    }
  };

  // --- Fetch signals for all strategies when they're loaded ---
  useEffect(() => {
    if (preBuiltStrategies.length > 0) {
      preBuiltStrategies.forEach((strategy) => {
        if (!strategySignals[strategy.strategy_id] && !loadingSignals[strategy.strategy_id]) {
          fetchStrategySignals(strategy.strategy_id);
        }
      });
    }
  }, [preBuiltStrategies]);

  // --- Auto-refresh signals every 60 seconds ---
  useEffect(() => {
    if (preBuiltStrategies.length === 0) return;

    const interval = setInterval(() => {
      preBuiltStrategies.forEach((strategy) => {
        fetchStrategySignals(strategy.strategy_id);
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [preBuiltStrategies]);

  // --- Map signals to trades for display ---
  const mapSignalsToTrades = (signals: any[]): Trade[] => {
    if (!signals || signals.length === 0) return [];

    return signals.map((signal, idx) => {
      const asset = signal.asset || {};
      // Get clean symbol without USDT
      const rawSymbol = asset.symbol || asset.asset_id || signal.asset_id || "Unknown";
      const cleanSymbol = rawSymbol.replace(/USDT$/i, '').trim();
      const pair = `${cleanSymbol} / USDT`;
      const score = Number(signal.final_score ?? 0);
      const confidence: Trade["confidence"] =
        score >= 0.7 ? "HIGH" : score >= 0.4 ? "MEDIUM" : "LOW";

      const realtimePrice = signal.realtime_data?.price ?? null;
      const realtimeVolume = signal.realtime_data?.volume24h ?? null;
      const realtimePriceChange = signal.realtime_data?.priceChangePercent ?? null;

      const entryPrice = realtimePrice ?? signal.price ?? signal.last_price ?? 0;
      const stopLoss = signal.stop_loss ?? "-5%";
      const takeProfit = signal.take_profit ?? "+10%";

      return {
        id: idx + 1,
        assetId: signal.asset_id ?? asset.asset_id ?? cleanSymbol,
        symbol: cleanSymbol, // Store clean symbol for API calls
        pair,
        type: signal.action && signal.action.toUpperCase() === "SELL" ? "SELL" : "BUY",
        confidence,
        ext: entryPrice ? String(entryPrice) : "—",
        entry: entryPrice ? String(entryPrice) : "—",
        stopLoss,
        progressMin: 0,
        progressMax: 100,
        progressValue: Math.min(100, Math.max(0, Math.floor(score * 100))),
        entryPrice: String(entryPrice),
        stopLossPrice: stopLoss,
        takeProfit1: takeProfit,
        target: "",
        insights: signal.reasons || [],
        profit: realtimePriceChange ? `${Number(realtimePriceChange).toFixed(2)}%` : "0%",
        profitValue: Number(realtimePriceChange ?? 0) || 0,
        volume: realtimeVolume ? String(Number(realtimeVolume).toLocaleString()) : "—",
        volumeValue: Number(realtimeVolume ?? 0) || 0,
        winRate: "—",
        winRateValue: 0,
        hoursAgo: 0,
        trend_score: Number(signal.trend_score ?? 0) || 0,
        trend_direction: signal.trend_direction ?? "STABLE",
        score_change: Number(signal.score_change ?? 0) || 0,
        volume_ratio: Number(signal.volume_ratio ?? 1) || 1,
        volume_status: signal.volume_status ?? "NORMAL",
      } as Trade;
    });
  };

  // Get current strategy and trades
  const currentStrategy = preBuiltStrategies[activeTab] || null;
  const currentSignals = currentStrategy
    ? strategySignals[currentStrategy.strategy_id] || []
    : [];
  const currentTrades = mapSignalsToTrades(currentSignals);

  // Filter and sort trades
  const filteredAndSortedTrades = useMemo(() => {
    let filtered = [...currentTrades];
    if (timeFilter !== "all") {
      const hoursLimit = timeFilter === "24h" ? 24 : timeFilter === "7d" ? 168 : 720;
      filtered = filtered.filter((trade) => trade.hoursAgo <= hoursLimit);
    }
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "profit":
          return b.profitValue - a.profitValue;
        case "volume":
          return b.volumeValue - a.volumeValue;
        case "winrate":
          return b.winRateValue - a.winRateValue;
        default:
          return 0;
      }
    });
    return filtered;
  }, [timeFilter, sortBy, currentTrades]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedTrades.length / ITEMS_PER_PAGE));
  const paginatedTrades = filteredAndSortedTrades.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [timeFilter, sortBy, currentTrades.length, activeTab]);

  // --- Handlers ---
  const handleAutoTrade = (signal: any) => {
    setSelectedSignal(signal);
    setShowAutoTradeModal(true);
  };

  const handleManualTrade = (signal: any) => {
    setSelectedSignal(signal);
    setShowManualTradeModal(true);
  };

  const handleViewTrade = (index: number) => {
    setSelectedTradeIndex(index);
    setShowTradeOverlay(true);
  };

  const addTradeRecordFromSignal = (signal: any) => {
    if (!signal) return;
    const ts = Date.now();
    const rec: TradeRecord = {
      id: `${ts}-${Math.floor(Math.random() * 10000)}`,
      timestamp: ts,
      symbol: signal.symbol ?? signal.assetId ?? signal.pair ?? "Unknown",
      type: (signal.type ?? "BUY") as "BUY" | "SELL",
      entryPrice: signal.entryPrice ?? signal.entry ?? signal.ext ?? "—",
      profitValue: Number(signal.profitValue ?? signal.profit ?? 0) || 0,
      strategyName: currentStrategy?.name,
    };
    setTradeRecords((p) => [rec, ...p]);
  };

  const handleTradeSuccess = (payload?: any) => {
    // payload may be unused by existing modals — use selectedSignal as fallback
    const signalToRecord = payload?.signal ?? selectedSignal ?? payload;
    if (signalToRecord) {
      addTradeRecordFromSignal(signalToRecord);
    }
    setSuccessMessage("Trade executed successfully!");
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
    loadAccountData();
    // Trigger instant refresh in OrdersPanel
    setOrdersRefreshKey((k) => k + 1);
  };

  // --- Error state ---
  if (status && !status.configured) {
    return (
      <div className="space-y-6 pb-8">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Paper Trading Strategies</h1>
            <p className="text-sm text-slate-400">
              Practice trading on Binance testnet without using real funds
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-red-600/10 border border-red-500/30 p-6 text-center">
          <p className="text-red-300">
            ⚠️ Binance testnet not configured. Please set TESTNET_API_KEY and
            TESTNET_API_SECRET environment variables.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-6 pb-8 p-4 sm:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-white">Paper Trading Strategies</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Execute trades on Binance testnet using AI-powered strategy signals
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={() => setShowCreateModal(true)}
            className={`rounded-md px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-medium transition-all bg-gradient-to-r from-[#10b981] to-[#06b6d4] text-white w-full sm:w-auto`}
          >
            Create Strategy
          </button>
          <button
            onClick={() => setShowOrdersPanel(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-800 to-blue-700 px-4 py-2 text-sm font-medium text-blue-200 hover:from-blue-700 hover:to-blue-600 transition-all border border-blue-600/50"
            title="View all orders"
          >
            <span>Orders</span>
            <span className="text-xs bg-gradient-to-r from-blue-500 to-blue-400 text-white px-2 py-0.5 rounded-full font-bold">
              {openOrdersCount}
            </span>
          </button>
          <button
            onClick={() => setShowLeaderboard(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-slate-800 to-slate-700 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-slate-200 hover:from-slate-700 hover:to-slate-600 transition-all border border-slate-600/50 w-full sm:w-auto"
            title="Open session leaderboard"
          >
            <span>Leaderboard</span>
            <span className="text-xs bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white px-2 py-0.5 rounded-full font-bold">
              {tradeRecords.length}
            </span>
          </button>
        </div>
      </div>

      {/* Balance Overview */}
      <BalanceOverview
        balance={balance}
        openOrdersCount={openOrdersCount}
        loading={loadingBalance}
      />

      {/* Strategy Tabs */}
      {loadingPreBuilt ? (
        <div className="rounded-lg sm:rounded-xl bg-gradient-to-br from-white/[0.02] to-transparent p-4 sm:p-6 text-center">
          <p className="text-xs sm:text-sm text-slate-400">Loading strategies...</p>
        </div>
      ) : preBuiltError ? (
        <div className="rounded-lg sm:rounded-xl bg-red-600/10 p-4 sm:p-6 text-center">
          <p className="text-xs sm:text-sm text-red-300">Failed to load strategies: {preBuiltError}</p>
        </div>
      ) : preBuiltStrategies.length > 0 ? (
        <div className="rounded-lg sm:rounded-xl bg-gradient-to-br from-white/[0.07] to-transparent p-3 sm:p-4 backdrop-blur">
          <div className="flex gap-1 sm:gap-2 border-b border-slate-700/50 overflow-x-auto smooth-scroll-horizontal">
            {preBuiltStrategies.map((strategy, idx) => {
              const strategyId = strategy.strategy_id;
              const isLoading = loadingSignals[strategyId];
              const error = signalsError[strategyId];
              const signalCount = strategySignals[strategyId]?.length || 0;

              return (
                <button
                  key={strategyId}
                  onClick={() => setActiveTab(idx)}
                  className={`px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-all rounded-t-lg whitespace-nowrap ${
                    activeTab === idx
                      ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white shadow-lg shadow-[#fc4f02]/30"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {strategy.name}
                  {!isLoading && !error && (
                    <span className="ml-1 sm:ml-2 text-xs opacity-70">({signalCount})</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Filters */}
          <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 sm:gap-3">
            <div className="flex gap-1 sm:gap-2 rounded-lg bg-[--color-surface]/60 p-1 w-full sm:w-auto">
              {(["24h", "7d", "30d", "all"] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setTimeFilter(period)}
                  className={`rounded-md px-2 sm:px-4 py-1 sm:py-2 text-xs font-medium transition-all flex-1 sm:flex-none ${
                    timeFilter === period
                      ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white shadow-lg shadow-[#fc4f02]/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {period === "all" ? "All" : period}
                </button>
              ))}
            </div>

            <div className="flex gap-1 sm:gap-2 w-full sm:w-auto">
              <span className="text-xs sm:text-sm text-slate-400">Sort:</span>
              {(["profit", "volume", "winrate"] as const).map((sort) => (
                <button
                  key={sort}
                  onClick={() => setSortBy(sort)}
                  className={`rounded-md px-2 sm:px-3 py-0.5 sm:py-1 text-xs font-medium transition-all ${
                    sortBy === sort
                      ? "bg-slate-700 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {sort.charAt(0).toUpperCase() + sort.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Signals Grid */}
      <div>
        {currentStrategy && loadingSignals[currentStrategy.strategy_id] ? (
          <div className="rounded-lg sm:rounded-2xl bg-gradient-to-br from-white/[0.07] to-transparent p-6 sm:p-8 text-center backdrop-blur">
            <p className="text-xs sm:text-sm text-slate-400">Loading signals...</p>
          </div>
        ) : signalsError[currentStrategy?.strategy_id || ""] ? (
          <div className="rounded-lg sm:rounded-2xl bg-red-600/10 p-6 sm:p-8 text-center">
            <p className="text-xs sm:text-sm text-red-300">
              Failed to load signals: {signalsError[currentStrategy?.strategy_id || ""]}
            </p>
          </div>
        ) : paginatedTrades.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {paginatedTrades.map((trade, index) => (
                <StrategyCard
                  key={trade.id}
                  signal={trade}
                  index={index}
                  onAutoTrade={() => handleAutoTrade(trade)}
                  onManualTrade={() => handleManualTrade(trade)}
                  onViewDetails={() => handleViewTrade(index)}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2 sm:gap-3">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-md bg-[--color-surface] px-2 sm:px-3 py-1 text-xs text-slate-300 disabled:opacity-40"
                >
                  Prev
                </button>
                <div className="text-xs text-slate-400">
                  Page {currentPage} of {totalPages}
                </div>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-md bg-[--color-surface] px-2 sm:px-3 py-1 text-xs text-slate-300 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-lg sm:rounded-2xl bg-gradient-to-br from-white/[0.07] to-transparent p-6 sm:p-8 text-center backdrop-blur">
            <p className="text-xs sm:text-sm text-slate-400">
              {currentStrategy
                ? `No signals available for ${currentStrategy.name}. Signals are generated every 10 minutes.`
                : "No signals found for the selected time period"}
            </p>
          </div>
        )}
      </div>

      {/* Trade Details Overlay */}
      {showTradeOverlay && filteredAndSortedTrades[selectedTradeIndex] && (
        <div className="fixed inset-0 z-[9999] isolate flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setShowTradeOverlay(false)}>
          <div className="relative w-full max-w-4xl max-h-[90vh] rounded-lg sm:rounded-2xl bg-gradient-to-br from-white/[0.15] to-white/[0.05] p-4 sm:p-6 shadow-2xl shadow-black/50 backdrop-blur overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 sm:mb-6 flex items-center justify-between sticky top-0 bg-gradient-to-br from-white/[0.15] to-white/[0.05] p-3 sm:p-4 -m-4 sm:-m-6 mb-2 sm:mb-4">
              <h2 className="text-lg sm:text-2xl font-bold text-white">Trade Details</h2>
              <button onClick={() => setShowTradeOverlay(false)} className="rounded-lg p-1.5 sm:p-2 text-slate-400 transition-colors hover:bg-[--color-surface] hover:text-white" aria-label="Close">
                <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="space-y-3 sm:space-y-4 p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <span className={`rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 text-base font-semibold text-white whitespace-nowrap ${filteredAndSortedTrades[selectedTradeIndex].type === "BUY" ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300]" : "bg-gradient-to-r from-red-500 to-red-600"}`}>
                  {filteredAndSortedTrades[selectedTradeIndex].type}
                </span>
                <span className="text-base sm:text-lg font-medium text-white">{filteredAndSortedTrades[selectedTradeIndex].pair}</span>
                <span className="rounded-full bg-slate-700 px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm text-slate-300">{filteredAndSortedTrades[selectedTradeIndex].confidence}</span>
              </div>

              {/* Two-column layout for details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Left column - Trade Details */}
                <div className="space-y-2 sm:space-y-4 rounded-lg sm:rounded-xl bg-gradient-to-br from-white/[0.12] to-white/[0.03] p-3 sm:p-4">
                  <div className="flex items-center justify-between"><span className="text-xs sm:text-sm text-slate-400">Entry</span><span className="text-sm sm:text-base font-medium text-white">{formatCurrency(filteredAndSortedTrades[selectedTradeIndex].entryPrice ?? filteredAndSortedTrades[selectedTradeIndex].entry)}</span></div>
                  <div className="flex items-center justify-between"><span className="text-xs sm:text-sm text-slate-400">Stop-Loss</span><span className="text-sm sm:text-base font-medium text-white">{formatCurrency(filteredAndSortedTrades[selectedTradeIndex].stopLossPrice ?? filteredAndSortedTrades[selectedTradeIndex].stopLoss)}</span></div>
                  <div className="flex items-center justify-between"><span className="text-xs sm:text-sm text-slate-400">Take Profit 1</span><span className="text-sm sm:text-base font-medium text-white">{formatCurrency(filteredAndSortedTrades[selectedTradeIndex].takeProfit1)}</span></div>
                  <div className="flex items-center justify-between"><span className="text-xs sm:text-sm text-slate-400">Additional Info</span><span className="text-sm sm:text-base font-medium text-slate-300">{filteredAndSortedTrades[selectedTradeIndex].target}</span></div>
                </div>

                {/* Right column - Stats */}
                <div className="space-y-2">
                  <h3 className="text-xs sm:text-sm font-semibold text-white">Trade Stats</h3>
                  <div className="rounded-lg sm:rounded-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-3 sm:p-4 text-xs text-slate-300">
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Profit</span>
                        <span className="font-medium text-green-400">{filteredAndSortedTrades[selectedTradeIndex].profit}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Volume</span>
                        <span className="font-medium text-white">{filteredAndSortedTrades[selectedTradeIndex].volume}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Win Rate</span>
                        <span className="font-medium text-white">{filteredAndSortedTrades[selectedTradeIndex].winRate}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Insights below - full width */}
              <div className="space-y-2 sm:space-y-3">
                <h3 className="text-xs sm:text-sm font-semibold text-white">Insights</h3>
                {filteredAndSortedTrades[selectedTradeIndex].insights && filteredAndSortedTrades[selectedTradeIndex].insights.length > 0 ? (
                  filteredAndSortedTrades[selectedTradeIndex].insights.map((insight: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-green-400" />
                      <p className="text-sm text-slate-300">{insight}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">No insights available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showAutoTradeModal && selectedSignal && (
        <AutoTradeModal
          signal={selectedSignal}
          balance={balance}
          onClose={() => setShowAutoTradeModal(false)}
          onSuccess={handleTradeSuccess}
        />
      )}

      {showManualTradeModal && selectedSignal && (
        <ManualTradeModal
          signal={selectedSignal}
          balance={balance}
          onClose={() => setShowManualTradeModal(false)}
          onSuccess={handleTradeSuccess}
        />
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-8 right-8 z-[10000] animate-fade-in rounded-lg bg-green-600 px-6 py-3 text-white shadow-lg">
          {successMessage}
        </div>
      )}

      {/* Leaderboard panel */}
      {showLeaderboard && (
        <TradeLeaderboard
          trades={tradeRecords}
          onClose={() => setShowLeaderboard(false)}
          onClear={() => setTradeRecords([])}
        />
      )}

      {/* Create Custom Strategy Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl bg-[--color-surface] p-6 text-slate-100 ring-1 ring-white/5 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Create Custom Strategy</h3>
              <button className="text-slate-400" onClick={() => { setShowCreateModal(false); setCreateError(null); }} aria-label="Close">✕</button>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-sm text-slate-300">Name</label>
                <input className="w-full rounded-md bg-[--color-surface-secondary] p-2 mt-1 text-slate-200" value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="My Custom Strategy" />
              </div>
              <div>
                <label className="text-sm text-slate-300">Description</label>
                <textarea className="w-full rounded-md bg-[--color-surface-secondary] p-2 mt-1 text-slate-200" value={createDescription} onChange={(e) => setCreateDescription(e.target.value)} placeholder="Optional description" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-slate-300">Stop Loss %</label>
                  <input className="w-full rounded-md bg-[--color-surface-secondary] p-2 mt-1 text-slate-200" value={createStopLoss} onChange={(e) => setCreateStopLoss(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm text-slate-300">Take Profit %</label>
                  <input className="w-full rounded-md bg-[--color-surface-secondary] p-2 mt-1 text-slate-200" value={createTakeProfit} onChange={(e) => setCreateTakeProfit(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-300">Risk Level</label>
                <select className="w-full rounded-md bg-[--color-surface-secondary] p-2 mt-1 text-slate-200" value={createRiskLevel} onChange={(e) => setCreateRiskLevel(e.target.value as any)}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              {createError && <div className="text-sm text-red-400">{createError}</div>}
              <div className="mt-4 flex justify-end gap-2">
                <button className="rounded-md px-4 py-2 text-sm" onClick={() => { setShowCreateModal(false); setCreateError(null); }}>Cancel</button>
                <button
                  className="rounded-md px-4 py-2 text-sm bg-gradient-to-r from-[#10b981] to-[#06b6d4] text-white"
                  onClick={async () => {
                    // basic validation
                    if (!createName || createName.trim().length < 2) {
                      setCreateError("Please provide a name for the strategy");
                      return;
                    }
                    setCreateError(null);
                    setCreating(true);
                    try {
                      const stopLossNum = Number(createStopLoss);
                      const takeProfitNum = Number(createTakeProfit);
                      if (isNaN(stopLossNum) || stopLossNum < 0 || stopLossNum > 100) {
                        setCreateError("Stop Loss must be a number between 0 and 100");
                        setCreating(false);
                        return;
                      }
                      if (isNaN(takeProfitNum) || takeProfitNum < 0 || takeProfitNum > 100) {
                        setCreateError("Take Profit must be a number between 0 and 100");
                        setCreating(false);
                        return;
                      }

                      const dto = {
                        name: createName,
                        // backend expects 'admin' or 'user' — use 'user' for custom strategies
                        type: "user",
                        description: createDescription || "Created from Paper Trading UI",
                        risk_level: createRiskLevel,
                        // backend validation expects 'indicator' (string) not 'field' / 'property'
                        entry_rules: [{ indicator: "final_score", operator: ">", value: 0.25 }],
                        exit_rules: [{ indicator: "final_score", operator: "<", value: -0.15 }],
                        indicators: [],
                        stop_loss_value: stopLossNum,
                        take_profit_value: takeProfitNum,
                        schedule_cron: null,
                        target_assets: [],
                        auto_trade_threshold: null,
                        is_active: true,
                      };

                      const created = await apiRequest<typeof dto, any>({ path: "/strategies/custom", method: "POST", body: dto });
                      setPreBuiltStrategies((prev) => [created, ...prev]);
                      setShowCreateModal(false);
                      setCreateName("");
                      setCreateDescription("");
                      setCreateStopLoss("5");
                      setCreateTakeProfit("10");
                      setCreateRiskLevel("medium");
                      // auto-fetch signals for the new strategy
                      if (created?.strategy_id) {
                        setActiveTab(0); // Switch to the new strategy
                        await fetchStrategySignals(created.strategy_id);
                      }
                    } catch (e) {
                      const er: any = e;
                      console.error("Create custom strategy error:", er);
                      setCreateError(er?.message ?? String(er) ?? "Failed to create strategy");
                    } finally {
                      setCreating(false);
                    }
                  }}
                  disabled={creating}
                >
                  {creating ? "Creating..." : "Create Strategy"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Orders Panel (ephemeral, frontend-only) */}
      {showOrdersPanel && (
        <OrdersPanel
          onClose={() => setShowOrdersPanel(false)}
          refreshTrigger={ordersRefreshKey}
        />
      )}
    </div>
  );
}
