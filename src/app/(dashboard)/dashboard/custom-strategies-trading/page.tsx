"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { alpacaCryptoService } from "@/lib/api/alpaca-crypto.service";
import { alpacaPaperTradingService, type AlpacaDashboard } from "@/lib/api/alpaca-paper-trading.service";
import { apiRequest } from "@/lib/api/client";
import { generateAssetInsight } from "@/lib/api/strategies";
import { exchangesService } from "@/lib/api/exchanges.service";
import { useExchange } from "@/context/ExchangeContext";
import { BalanceOverview } from "../paper-trading/components/balance-overview";
import { StrategyCard } from "../paper-trading/components/strategy-card";
import { ExchangeAutoTradeModal } from "../top-trades/components/exchange-auto-trade-modal";
import { StockExchangeAutoTradeModal } from "../top-trades/components/stock-exchange-auto-trade-modal";
import { ManualTradeModal } from "../paper-trading/components/manual-trade-modal";
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
  name?: string;
  logoUrl?: string;
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

  // Pre-select a specific strategy tab via ?strategy=<strategy_id>
  const initialStrategyId = searchParams.get("strategy") || null;
  
  // Referrer tracking - where did the user come from?
  const referrer = searchParams.get("from") || (isPaperMode ? "paper-trading" : "top-trades");
  const pageNames: Record<string, string> = {
    "paper-trading": "Paper Trading",
    "top-trades": "Top Trades",
    "my-strategies": "My Strategies",
  };
  const previousPageName = pageNames[referrer] || "Dashboard";

  // Connection type detection - using global context
  const { connectionType, connectionId, isLoading: isCheckingConnection } = useExchange();
  const isStocksConnection = connectionType === "stocks";

  // Account data (balance kept for trade modal position sizing, not displayed in header)
  const [balance, setBalance] = useState(0);
  const [marketOpen, setMarketOpen] = useState(true);

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

  // On-demand AI insights: keyed by strategy_id → asset_id → { text, timestamp }
  const [aiInsights, setAiInsights] = useState<
    Record<string, Record<string, { text: string; timestamp: number }>>
  >({});
  const [loadingInsight, setLoadingInsight] = useState<Record<string, boolean>>({});

  // Trade modals
  const [showAutoTradeModal, setShowAutoTradeModal] = useState(false);
  const [showManualTradeModal, setShowManualTradeModal] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState<Trade | null>(null);

  // View modal for signal details
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // UI filters (matching Paper Trading page)
  const [timeFilter, setTimeFilter] = useState<"24h" | "7d" | "30d" | "all">("all");
  const [sortBy, setSortBy] = useState<"profit" | "volume" | "winrate">("profit");
  const ITEMS_PER_PAGE = 8;
  const [currentPage, setCurrentPage] = useState(1);

  // Trade details overlay
  const [showTradeOverlay, setShowTradeOverlay] = useState(false);
  const [selectedTradeIndex, setSelectedTradeIndex] = useState<number>(0);

  // Fetch balance (for trade modals) and market open status
  useEffect(() => {
    const fetchBalanceAndStatus = async () => {
      if (!connectionType) return;
      try {
        if (isStocksConnection) {
          const dashboard = await alpacaPaperTradingService.getDashboard();
          setBalance(parseFloat(dashboard.account?.cash || "0"));
          setMarketOpen(dashboard.clock?.isOpen || false);
        } else {
          const balanceData = await alpacaCryptoService.getAccountBalance();
          setBalance(balanceData.totalBalanceUSD || 0);
        }
      } catch {
        // ignore — balance display removed from header; modals will show 0 as fallback
      }
    };
    if (connectionType) fetchBalanceAndStatus();
  }, [connectionType, isStocksConnection]);

  // Fetch custom strategies
  useEffect(() => {
    if (connectionType === null) return;
    const fetchStrategies = async () => {
      setLoadingStrategies(true);
      setStrategiesError(null);
      try {
        const assetType = connectionType === "stocks" ? "stock" : connectionType === "crypto" ? "crypto" : null;
        const queryParam = assetType ? `?asset_type=${assetType}` : "";
        const data = await apiRequest<never, UserStrategy[]>({
          path: `/strategies/my-strategies${queryParam}`,
          method: "GET",
        });
        console.log("📊 Fetched strategies:", data);
        if (!Array.isArray(data)) {
          setStrategies([]);
        } else {
          data.forEach(s => console.log(`Strategy "${s.name}" (${s.strategy_id}): type=${s.type}`));
          setStrategies(data);
          // If a strategy_id was passed via URL, jump to that tab
          if (initialStrategyId) {
            const idx = data.findIndex(s => s.strategy_id === initialStrategyId);
            if (idx !== -1) setActiveTab(idx);
          }
        }
      } catch (err: any) {
        console.error("Failed to load strategies:", err);
        setStrategiesError(err?.message ?? String(err));
      } finally {
        setLoadingStrategies(false);
      }
    };

    fetchStrategies();
  }, [connectionType]);

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
      
      const rawScore = Number(signal.final_score ?? 0);
      // Normalize: crypto pipeline returns 0..100, stock pipeline returns 0..1
      const normalizedScore = rawScore > 1 ? rawScore / 100 : rawScore;
      const confidence: Trade["confidence"] =
        normalizedScore >= 0.7 ? "HIGH" : normalizedScore >= 0.4 ? "MEDIUM" : "LOW";

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
        name: asset.name ?? asset.display_name ?? undefined,
        logoUrl: asset.logo_url ?? undefined,
        type: signal.action && signal.action.toUpperCase() === "SELL" ? "SELL" : "BUY",
        confidence,
        ext: entryPrice ? String(entryPrice) : "—",
        entry: entryPrice ? String(entryPrice) : "—",
        stopLoss,
        progressMin: 0,
        progressMax: 100,
        progressValue: Math.min(100, Math.max(0, Math.round(normalizedScore * 100))),
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

  const handleGenerateInsight = async (strategyId: string, assetId: string) => {
    const key = `${strategyId}-${assetId}`;
    if (loadingInsight[key]) return;

    setLoadingInsight((p) => ({ ...p, [key]: true }));
    try {
      const response = await generateAssetInsight(strategyId, assetId);
      setAiInsights((p) => ({
        ...p,
        [strategyId]: {
          ...(p[strategyId] || {}),
          [assetId]: { text: response.insight, timestamp: Date.now() },
        },
      }));
    } catch (err: any) {
      console.error(`Failed to generate insight for ${assetId}:`, err);
      alert(`Failed to generate insight: ${err?.message || String(err)}`);
    } finally {
      setLoadingInsight((p) => ({ ...p, [key]: false }));
    }
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
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[var(--primary)]/30 border-t-[var(--primary)] mb-4"></div>
          <p className="text-slate-300 font-medium">Loading custom strategies...</p>
        </div>
      </div>
    );
  }

  // No connection state
  if (!connectionType) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary-light)]/10 flex items-center justify-center">
          <svg className="w-10 h-10 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Connect Exchange First</h2>
        <p className="text-slate-400 mb-6">
          Please connect your exchange account to start trading with custom strategies.
        </p>
        <Link
          href="/dashboard/settings/exchanges"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] text-white font-semibold hover:shadow-xl hover:shadow-[rgba(var(--primary-rgb),0.3)]/30 transition-all"
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
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary-light)]/10 flex items-center justify-center">
          <svg className="w-10 h-10 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">No Custom Strategies Yet</h2>
        <p className="text-slate-400 mb-6">
          Create your first custom strategy to start generating signals and trading.
        </p>
        <Link
          href={`/dashboard/my-strategies/create?from=${referrer}&via=custom-strategies-trading`}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] text-white font-semibold hover:shadow-xl hover:shadow-[rgba(var(--primary-rgb),0.3)]/30 transition-all"
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
      <div className="relative rounded-2xl bg-gradient-to-br from-[var(--primary)]/20 via-[var(--primary-light)]/10 to-transparent p-6 border border-[var(--primary)]/20 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-[var(--primary)]/30 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative">
          {/* Back Button - Goes to My Strategies, Top Trades, or Paper Trading */}
          <Link
            href={
              referrer === "my-strategies" ? "/dashboard/my-strategies"
              : referrer === "top-trades" ? "/dashboard/top-trades"
              : "/dashboard/paper-trading"
            }
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white/90 hover:text-[var(--primary-light)] transition-colors mb-3 group"
          >
            <svg
              className="w-4 h-4 text-white group-hover:-translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-white/90 group-hover:text-[var(--primary-light)]">Back to {previousPageName}</span>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] flex items-center justify-center shadow-lg shadow-[rgba(var(--primary-rgb),0.3)]/30">
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

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {/* My Strategies Button */}
              <Link
                href={`/dashboard/my-strategies?from=${referrer}`}
                className="inline-flex items-center gap-2 rounded-xl bg-white/15 border border-white/25 hover:bg-white/20 hover:border-white/40 px-4 py-2.5 text-sm font-semibold text-[var(--primary-light)] transition-all duration-200 group"
                title="View and manage your strategies"
              >
                <svg className="w-4 h-4 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>My Strategies</span>
              </Link>
              {/* Create Strategy Button */}
              <Link
                href={`/dashboard/my-strategies/create?from=${referrer}&via=custom-strategies-trading`}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg hover:shadow-[rgba(var(--primary-rgb),0.3)]/30 hover:scale-[1.02] transition-all duration-200 group"
                title="Create a new custom strategy"
              >
                <svg className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Create Strategy</span>
              </Link>
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
                ? "bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] text-white shadow-lg shadow-[rgba(var(--primary-rgb),0.3)]/30"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 gap-4">
            {currentTrades.map((trade, idx) => {
              const assetId = (trade as any).assetId || (trade as any).asset_id;
              const strategyId = currentStrategy!.strategy_id;
              const key = assetId ? `${strategyId}-${assetId}` : "";
              const insight = assetId ? aiInsights[strategyId]?.[assetId] : undefined;
              return (
                <StrategyCard
                  key={trade.id}
                  signal={trade}
                  index={idx}
                  onAutoTrade={() => handleAutoTrade(trade)}
                  onManualTrade={() => handleManualTrade(trade)}
                  onViewDetails={() => handleViewDetails(trade)}
                  isStockMode={isStocksConnection}
                  aiInsight={insight || null}
                  onGenerateInsight={
                    assetId
                      ? () => handleGenerateInsight(strategyId, assetId)
                      : undefined
                  }
                  isGeneratingInsight={!!loadingInsight[key]}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 rounded-2xl bg-white/5 border border-white/5">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No Buy Signals Right Now</h3>
            <p className="text-slate-400 mb-4 max-w-md mx-auto">
              No actionable buy signals have been detected for this strategy yet. Signals will appear here automatically when the market conditions match your strategy rules.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              Monitoring active • Signals update every 10 minutes
            </div>
          </div>
        )}
      </div>

      {/* Auto Trade Modal */}
      {showAutoTradeModal && selectedSignal && connectionId && (
        isStocksConnection ? (
          <StockExchangeAutoTradeModal
            connectionId={connectionId}
            signal={selectedSignal}
            onClose={() => setShowAutoTradeModal(false)}
            onSuccess={refreshBalanceAndOrders}
            strategy={currentStrategy}
            side={selectedSignal.type}
          />
        ) : (
          <ExchangeAutoTradeModal
            connectionId={connectionId}
            signal={selectedSignal}
            onClose={() => setShowAutoTradeModal(false)}
            onSuccess={refreshBalanceAndOrders}
            strategy={currentStrategy}
            side={selectedSignal.type}
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
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] text-white font-semibold hover:shadow-lg hover:shadow-[rgba(var(--primary-rgb),0.3)]/30"
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
