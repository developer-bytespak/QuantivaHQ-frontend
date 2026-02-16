"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { alpacaCryptoService } from "@/lib/api/alpaca-crypto.service";
import { alpacaPaperTradingService, type AlpacaDashboard } from "@/lib/api/alpaca-paper-trading.service";
import { apiRequest } from "@/lib/api/client";
import { exchangesService } from "@/lib/api/exchanges.service";
import { useExchange } from "@/context/ExchangeContext";
import { BalanceOverview } from "../paper-trading/components/balance-overview";
import { StrategyCard } from "../paper-trading/components/strategy-card";
import { AutoTradeModal } from "../paper-trading/components/auto-trade-modal";
import { ManualTradeModal } from "../paper-trading/components/manual-trade-modal";
import { StockAutoTradeModal } from "../paper-trading/components/stock-auto-trade-modal";
import { StockManualTradeModal } from "../paper-trading/components/stock-manual-trade-modal";

// --- Formatting helpers ---
const formatCurrency = (v: any) => {
  if (v === null || v === undefined || v === "—" || v === "") return "—";
  const n = Number(String(v));
  if (isNaN(n)) return String(v);
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
};

interface StrategyMetrics {
  total_signals: number;
  buy_signals: number;
  sell_signals: number;
  hold_signals: number;
  avg_confidence: number;
  avg_score: number;
}

interface UserStrategy {
  strategy_id: string;
  name: string;
  description?: string;
  type?: string; // "user" for custom strategies
  risk_level: string;
  is_active: boolean;
  timeframe?: string;
  stop_loss_value?: number;
  take_profit_value?: number;
  target_assets?: string[];
  entry_rules?: any[];
  exit_rules?: any[];
  created_at: string;
  updated_at?: string;
  metrics: StrategyMetrics;
  signals?: any[];
}

interface Trade {
  id: number;
  assetId?: string;
  symbol?: string;
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
  realtime_data?: any;
}

export default function CustomStrategiesTradingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Mode: "paper" for testnet/paper trading, "live" for real trading
  const mode = searchParams.get("mode") || "paper";
  const isPaperMode = mode === "paper";

  // Connection type detection - using global context
  const { connectionType, isLoading: isCheckingConnection } = useExchange();
  const isStocksConnection = connectionType === "stocks";

  // Account data
  const [balance, setBalance] = useState(0);
  const [loadingBalance, setLoadingBalance] = useState(true);

  // Custom strategies
  const [strategies, setStrategies] = useState<UserStrategy[]>([]);
  const [loadingStrategies, setLoadingStrategies] = useState(true);
  const [strategiesError, setStrategiesError] = useState<string | null>(null);

  // Active tab for strategies
  const [activeTab, setActiveTab] = useState(0);

  // Signals for each strategy
  const [strategySignals, setStrategySignals] = useState<Record<string, any[]>>({});
  const [loadingSignals, setLoadingSignals] = useState<Record<string, boolean>>({});
  const [signalsError, setSignalsError] = useState<Record<string, string>>({});
  const [lastRefresh, setLastRefresh] = useState<Record<string, Date>>({});

  // Trade modals
  const [showAutoTradeModal, setShowAutoTradeModal] = useState(false);
  const [showManualTradeModal, setShowManualTradeModal] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState<Trade | null>(null);
  const [marketOpen, setMarketOpen] = useState(true);

  // View modal for signal details
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const isStocksConnection = connectionType === "stocks";

  // Check connection type on mount
  useEffect(() => {
    let isMounted = true;

    const checkConnection = async () => {
      try {
        const response = await exchangesService.getActiveConnection();
        if (isMounted) {
          setConnectionType(response.data?.exchange?.type || null);
        }
      } catch (error: any) {
        console.error("Failed to check connection type:", error);
        if (isMounted) {
          setConnectionType(null);
        }
      } finally {
        if (isMounted) {
          setIsCheckingConnection(false);
        }
      }
    };

    checkConnection();
    return () => {
      isMounted = false;
    };
  }, []);
  // UI filters (matching Paper Trading page)
  const [timeFilter, setTimeFilter] = useState<"24h" | "7d" | "30d" | "all">("all");
  const [sortBy, setSortBy] = useState<"profit" | "volume" | "winrate">("profit");
  const ITEMS_PER_PAGE = 8;
  const [currentPage, setCurrentPage] = useState(1);

  // Trade details overlay
  const [showTradeOverlay, setShowTradeOverlay] = useState(false);
  const [selectedTradeIndex, setSelectedTradeIndex] = useState<number>(0);

  // Fetch balance based on mode and connection type
  useEffect(() => {
    const fetchBalance = async () => {
      if (!connectionType) return;
      
      setLoadingBalance(true);
      try {
        if (isPaperMode) {
          // Paper trading mode - use testnet services
          if (isStocksConnection) {
            const dashboard = await alpacaPaperTradingService.getDashboard();
            setBalance(parseFloat(dashboard.account?.cash || "0"));
            setMarketOpen(dashboard.clock?.isOpen || false);
          } else {
            const balanceData = await alpacaCryptoService.getAccountBalance();
            setBalance(balanceData.totalBalanceUSD || 0);
          }
        } else {
          // Live trading mode - use main exchange APIs
          if (isStocksConnection) {
            // For live stocks, still using Alpaca but could be different account
            const dashboard = await alpacaPaperTradingService.getDashboard();
            setBalance(parseFloat(dashboard.account?.cash || "0"));
            setMarketOpen(dashboard.clock?.isOpen || false);
          } else {
            // For live crypto - would use main Binance API
            // For now, using same Alpaca paper for demo
            const balanceData = await alpacaCryptoService.getAccountBalance();
            setBalance(balanceData.totalBalanceUSD || 0);
          }
        }
      } catch (error: any) {
        console.error("Failed to fetch balance:", error);
        setBalance(0);
      } finally {
        setLoadingBalance(false);
      }
    };

    if (connectionType) {
      fetchBalance();
    }
  }, [connectionType, isPaperMode, isStocksConnection]);

  // Fetch custom strategies
  useEffect(() => {
    const fetchStrategies = async () => {
      setLoadingStrategies(true);
      setStrategiesError(null);
      try {
        const data = await apiRequest<never, UserStrategy[]>({
          path: "/strategies/my-strategies",
          method: "GET",
        });
        console.log("📊 Fetched strategies:", data);
        if (!Array.isArray(data)) {
          setStrategies([]);
        } else {
          // Log each strategy's type
          data.forEach(s => console.log(`Strategy "${s.name}" (${s.strategy_id}): type=${s.type}`));
          setStrategies(data);
        }
      } catch (err: any) {
        console.error("Failed to load strategies:", err);
        setStrategiesError(err?.message ?? String(err));
      } finally {
        setLoadingStrategies(false);
      }
    };

    fetchStrategies();
  }, []);

  // Fetch signals for a strategy
  const fetchStrategySignals = async (strategyId: string, isRefresh = false) => {
    if (!isRefresh) {
      setLoadingSignals((p) => ({ ...p, [strategyId]: true }));
    }
    setSignalsError((p) => ({ ...p, [strategyId]: "" }));

    try {
      const signals = await apiRequest<never, any[]>({
        path: `/strategies/my-strategies/${strategyId}/signals?latest_only=true&realtime=true`,
        method: "GET",
      });
      setStrategySignals((p) => ({ ...p, [strategyId]: signals || [] }));
      setLastRefresh((p) => ({ ...p, [strategyId]: new Date() }));
    } catch (err: any) {
      console.error(`Failed to load signals for strategy ${strategyId}:`, err);
      setSignalsError((p) => ({
        ...p,
        [strategyId]: err?.message || String(err),
      }));
      setStrategySignals((p) => ({ ...p, [strategyId]: [] }));
    } finally {
      setLoadingSignals((p) => ({ ...p, [strategyId]: false }));
    }
  };

  // Lazy load signals when tab changes
  useEffect(() => {
    if (strategies.length > 0) {
      const activeStrategy = strategies[activeTab];
      if (
        activeStrategy &&
        !strategySignals[activeStrategy.strategy_id] &&
        !loadingSignals[activeStrategy.strategy_id]
      ) {
        fetchStrategySignals(activeStrategy.strategy_id);
      }
    }
  }, [strategies, activeTab]);

  // Auto-refresh signals every 60 seconds (like pre-built strategies)
  useEffect(() => {
    if (strategies.length === 0) return;

    const interval = setInterval(() => {
      const activeStrategy = strategies[activeTab];
      if (activeStrategy) {
        fetchStrategySignals(activeStrategy.strategy_id, true);
      }
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [strategies, activeTab]);

  // Map signals to trade format (matches pre-built format)
  const mapSignalsToTrades = (signals: any[], strategy: UserStrategy): Trade[] => {
    if (!signals || signals.length === 0) return [];

    // Get strategy's default stop loss and take profit values
    const strategyStopLoss = strategy?.stop_loss_value ?? 5;
    const strategyTakeProfit = strategy?.take_profit_value ?? 10;

    return signals.map((signal, idx) => {
      const asset = signal.asset || {};
      // Get clean symbol - handle both crypto (with USDT suffix) and stocks
      const rawSymbol = asset.symbol || asset.asset_id || signal.asset_id || "Unknown";
      const isStock = isStocksConnection || asset.asset_type === "stock";
      
      // For crypto: remove USDT suffix. For stocks: use as-is
      const cleanSymbol = isStock 
        ? rawSymbol.trim() 
        : rawSymbol.replace(/USDT$/i, '').trim();
      
      // Format pair based on asset type
      const pair = isStock 
        ? `${cleanSymbol} / USD` 
        : `${cleanSymbol} / USDT`;
      
      const score = Number(signal.final_score ?? 0);
      const confidence: Trade["confidence"] =
        score >= 0.7 ? "HIGH" : score >= 0.4 ? "MEDIUM" : "LOW";

      // Get realtime data, treating 0 as invalid (API returned no data)
      const realtimePrice = signal.realtime_data?.price && signal.realtime_data.price > 0 
        ? signal.realtime_data.price 
        : null;
      const realtimeVolume = signal.realtime_data?.volume24h && signal.realtime_data.volume24h > 0
        ? signal.realtime_data.volume24h
        : null;
      const realtimePriceChange = signal.realtime_data?.priceChangePercent ?? null;

      // Fall back through multiple price sources: realtime > signal.price_usd > signal.price > 0
      const entryPrice = realtimePrice 
        ?? (signal.price_usd && signal.price_usd > 0 ? signal.price_usd : null)
        ?? (signal.price && signal.price > 0 ? signal.price : null)
        ?? (signal.last_price && signal.last_price > 0 ? signal.last_price : null)
        ?? 0;

      // Use signal values if available, otherwise use strategy defaults
      const stopLoss = signal.stop_loss ?? `-${strategyStopLoss}%`;
      const takeProfit = signal.take_profit ?? `+${strategyTakeProfit}%`;

      // Calculate hours ago from signal timestamp
      const signalTimestamp = signal.timestamp || signal.poll_timestamp || signal.created_at || signal.generated_at;
      let hoursAgo = 0;
      if (signalTimestamp) {
        const signalDate = new Date(signalTimestamp);
        const now = new Date();
        hoursAgo = Math.floor((now.getTime() - signalDate.getTime()) / (1000 * 60 * 60));
      }

      return {
        id: idx + 1,
        assetId: signal.asset_id ?? asset.asset_id ?? cleanSymbol,
        symbol: cleanSymbol,
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
        hoursAgo,
        trend_score: Number(signal.trend_score ?? 0) || 0,
        trend_direction: signal.trend_direction ?? "STABLE",
        score_change: Number(signal.score_change ?? 0) || 0,
        volume_ratio: Number(signal.volume_ratio ?? 1) || 1,
        volume_status: signal.volume_status ?? "NORMAL",
        realtime_data: signal.realtime_data,
      };
    });
  };

  // Get current strategy and its trades
  const currentStrategy = strategies[activeTab];
  const currentSignals = currentStrategy
    ? strategySignals[currentStrategy.strategy_id] || []
    : [];
  const currentTrades = currentStrategy
    ? mapSignalsToTrades(currentSignals, currentStrategy)
    : [];

  // Trade handlers
  const handleAutoTrade = (trade: Trade) => {
    setSelectedSignal(trade);
    setShowAutoTradeModal(true);
  };

  const handleManualTrade = (trade: Trade) => {
    setSelectedSignal(trade);
    setShowManualTradeModal(true);
  };

  const handleViewDetails = (trade: Trade) => {
    setSelectedSignal(trade);
    setShowDetailsModal(true);
  };

  const refreshBalanceAndOrders = async () => {
    // Refresh balance after trade
    if (isStocksConnection) {
      try {
        const dashboard = await alpacaPaperTradingService.getDashboard();
        setBalance(parseFloat(dashboard.account?.cash || "0"));
      } catch (e) {
        console.error("Failed to refresh balance:", e);
      }
    } else {
      try {
        const balanceData = await alpacaCryptoService.getAccountBalance();
        setBalance(balanceData.totalBalanceUSD || 0);
      } catch (e) {
        console.error("Failed to refresh balance:", e);
      }
    }
  };

  // Loading state
  if (isCheckingConnection || loadingStrategies) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#fc4f02]/30 border-t-[#fc4f02] mb-4"></div>
          <p className="text-slate-300 font-medium">Loading custom strategies...</p>
        </div>
      </div>
    );
  }

  // No connection state
  if (!connectionType) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#fc4f02]/20 to-[#fda300]/10 flex items-center justify-center">
          <svg className="w-10 h-10 text-[#fc4f02]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Connect Exchange First</h2>
        <p className="text-slate-400 mb-6">
          Please connect your exchange account to start trading with custom strategies.
        </p>
        <Link
          href="/dashboard/settings/exchanges"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white font-semibold hover:shadow-xl hover:shadow-[#fc4f02]/30 transition-all"
        >
          Connect Exchange
        </Link>
      </div>
    );
  }

  // No strategies state
  if (strategies.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#fc4f02]/20 to-[#fda300]/10 flex items-center justify-center">
          <svg className="w-10 h-10 text-[#fc4f02]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">No Custom Strategies Yet</h2>
        <p className="text-slate-400 mb-6">
          Create your first custom strategy to start generating signals and trading.
        </p>
        <Link
          href="/dashboard/my-strategies/create?from=custom-strategies-trading"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white font-semibold hover:shadow-xl hover:shadow-[#fc4f02]/30 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Strategy
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Hero Header */}
      <div className="relative rounded-2xl bg-gradient-to-br from-[#fc4f02]/20 via-[#fda300]/10 to-transparent p-6 border border-[#fc4f02]/20 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-[#fc4f02]/30 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative">
          {/* Back Button */}
          <Link
            href={`/dashboard/my-strategies?from=${isPaperMode ? "paper-trading" : "top-trades"}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white/90 hover:text-[#fda300] transition-colors mb-3 group"
          >
            <svg
              className="w-4 h-4 text-white group-hover:-translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-white/90 group-hover:text-[#fda300]">Back to My Strategies</span>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#fc4f02] to-[#fda300] flex items-center justify-center shadow-lg shadow-[#fc4f02]/30">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                    Custom Strategy Trading
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        isPaperMode
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-green-500/20 text-green-400"
                      }`}
                    >
                      {isPaperMode ? "📄 Paper Trading" : "💰 Live Trading"}
                    </span>
                    <span className="text-slate-400 text-sm">
                      {isStocksConnection ? "Stocks" : "Crypto"}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-slate-400 max-w-lg">
                Execute trades using signals from your custom AI-powered strategies
              </p>
            </div>

            {/* Balance Display */}
            <div className="bg-white/5 rounded-xl px-5 py-3 border border-white/10">
              <p className="text-xs text-slate-400 mb-1">Available Balance</p>
              <p className="text-2xl font-bold text-white">
                {loadingBalance ? (
                  <span className="inline-block w-24 h-7 bg-white/10 rounded animate-pulse"></span>
                ) : (
                  formatCurrency(balance)
                )}
              </p>
              {isStocksConnection && (
                <p className={`text-xs mt-1 ${marketOpen ? "text-green-400" : "text-yellow-400"}`}>
                  Market {marketOpen ? "Open" : "Closed"}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Strategy Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10">
        {strategies.map((strategy, idx) => (
          <button
            key={strategy.strategy_id}
            onClick={() => setActiveTab(idx)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm whitespace-nowrap transition-all duration-200 ${
              activeTab === idx
                ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white shadow-lg shadow-[#fc4f02]/30"
                : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span>{strategy.name}</span>
            <span
              className={`px-1.5 py-0.5 rounded text-xs ${
                activeTab === idx ? "bg-white/20" : "bg-white/10"
              }`}
            >
              {strategy.metrics?.total_signals || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Current Strategy Info & Refresh */}
      {currentStrategy && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white">{currentStrategy.name}</h3>
              {currentStrategy.is_active && (
                <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Active
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400 mt-1">
              {currentStrategy.description || "No description"}
            </p>
            <div className="flex items-center gap-4 mt-2 text-xs">
              <span className="text-emerald-400">
                {currentStrategy.metrics?.buy_signals || 0} BUY
              </span>
              <span className="text-red-400">
                {currentStrategy.metrics?.sell_signals || 0} SELL
              </span>
              <span className="text-slate-400">
                {currentStrategy.metrics?.hold_signals || 0} HOLD
              </span>
              <span className="text-slate-500">
                {currentStrategy.target_assets?.length || 0} assets
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Last Updated */}
            {lastRefresh[currentStrategy.strategy_id] && (
              <div className="text-xs text-slate-500">
                Updated {new Date(lastRefresh[currentStrategy.strategy_id]).toLocaleTimeString()}
              </div>
            )}
            {/* Refresh Button */}
            <button
              onClick={() => fetchStrategySignals(currentStrategy.strategy_id, true)}
              disabled={loadingSignals[currentStrategy.strategy_id]}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/10 hover:text-white disabled:opacity-50 transition-all"
              title="Refresh signals"
            >
              <svg 
                className={`w-4 h-4 ${loadingSignals[currentStrategy.strategy_id] ? 'animate-spin' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            {/* Auto-refresh indicator */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              Auto-refresh 60s
            </div>
          </div>
        </div>
      )}

      {/* Signals Grid */}
      <div>
        {loadingSignals[currentStrategy?.strategy_id] ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-64 rounded-2xl bg-white/5 animate-pulse"
              ></div>
            ))}
          </div>
        ) : currentTrades.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {currentTrades.map((trade, idx) => (
              <StrategyCard
                key={trade.id}
                signal={trade}
                index={idx}
                onAutoTrade={() => handleAutoTrade(trade)}
                onManualTrade={() => handleManualTrade(trade)}
                onViewDetails={() => handleViewDetails(trade)}
                isStockMode={isStocksConnection}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 rounded-2xl bg-white/5 border border-white/5">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#fc4f02]/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-[#fc4f02]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Signals Coming Soon</h3>
            <p className="text-slate-400 mb-4 max-w-md mx-auto">
              Signals are generated automatically every 10 minutes. Your strategy is active and 
              signals will appear here shortly.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              Auto-refresh enabled • Check back in a few minutes
            </div>
          </div>
        )}
      </div>

      {/* Auto Trade Modal */}
      {showAutoTradeModal && selectedSignal && (
        isStocksConnection ? (
          <StockAutoTradeModal
            signal={selectedSignal}
            balance={balance}
            onClose={() => setShowAutoTradeModal(false)}
            onSuccess={refreshBalanceAndOrders}
            marketOpen={marketOpen}
            strategy={currentStrategy}
          />
        ) : (
          <AutoTradeModal
            signal={selectedSignal}
            balance={balance}
            onClose={() => setShowAutoTradeModal(false)}
            onSuccess={refreshBalanceAndOrders}
            strategy={currentStrategy}
          />
        )
      )}

      {/* Manual Trade Modal */}
      {showManualTradeModal && selectedSignal && (
        isStocksConnection ? (
          <StockManualTradeModal
            signal={selectedSignal}
            balance={balance}
            onClose={() => setShowManualTradeModal(false)}
            onSuccess={refreshBalanceAndOrders}
            marketOpen={marketOpen}
          />
        ) : (
          <ManualTradeModal
            signal={selectedSignal}
            balance={balance}
            onClose={() => setShowManualTradeModal(false)}
            onSuccess={refreshBalanceAndOrders}
          />
        )
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedSignal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 border border-white/10">
            <button
              onClick={() => setShowDetailsModal(false)}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-xl font-bold text-white mb-4">{selectedSignal.pair}</h3>

            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-slate-400">Type</span>
                <span
                  className={`font-semibold ${
                    selectedSignal.type === "BUY" ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {selectedSignal.type}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-slate-400">Confidence</span>
                <span className="text-white font-medium">{selectedSignal.confidence}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-slate-400">Entry Price</span>
                <span className="text-white font-medium">
                  {formatCurrency(selectedSignal.entryPrice)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-slate-400">Stop Loss</span>
                <span className="text-red-400 font-medium">{selectedSignal.stopLoss}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-slate-400">Take Profit</span>
                <span className="text-emerald-400 font-medium">{selectedSignal.takeProfit1}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400">24h Change</span>
                <span
                  className={`font-medium ${
                    selectedSignal.profitValue >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {selectedSignal.profit}
                </span>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  handleAutoTrade(selectedSignal);
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white font-semibold hover:shadow-lg hover:shadow-[#fc4f02]/30"
              >
                Auto Trade
              </button>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  handleManualTrade(selectedSignal);
                }}
                className="flex-1 py-2.5 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20"
              >
                Manual Trade
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
