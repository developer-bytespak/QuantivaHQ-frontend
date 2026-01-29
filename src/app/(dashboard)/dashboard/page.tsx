"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { exchangesService, DashboardData, Connection } from "@/lib/api/exchanges.service";
import { getCachedMarketData, CoinGeckoCoin } from "@/lib/api/coingecko.service";
import { getCryptoNews, getGeneralCryptoNews, getGeneralStockNews, CryptoNewsResponse, CryptoNewsItem, StockNewsItem } from "@/lib/api/news.service";
import { SentimentBadge } from "@/components/news/sentiment-badge";
import { useStocksMarket } from "@/hooks/useStocksMarket";
import { apiRequest } from "@/lib/api/client";
import { getTrendingAssetsWithInsights, type Strategy } from "@/lib/api/strategies";
import { MarketTable } from "@/components/market/MarketTable";
import {
  formatMarketCap,
  formatPrice,
  formatPercent,
  formatVolume,
  getChangeColorClass,
} from "@/lib/utils/format";

interface Activity {
  id: number;
  type: "buy" | "sell" | "tp" | "sentiment";
  title: string;
  description: string;
  timestamp: string;
  iconColor: string;
  iconBg: string;
}

// Activities will be loaded from backend API when available

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"holdings" | "market">("holdings");
  const [showNewsOverlay, setShowNewsOverlay] = useState(false);
  const [showTradeOverlay, setShowTradeOverlay] = useState(false);
  const [selectedNews, setSelectedNews] = useState<number>(0);
  const [selectedTrade, setSelectedTrade] = useState<number>(0);
  
  // Binance data state
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Store connection ID and type in component state
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [connectionType, setConnectionType] = useState<"crypto" | "stocks" | null>(null);
  const [activeConnection, setActiveConnection] = useState<Connection | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Ref to track if initialization has happened (prevents duplicate calls)
  const hasInitialized = useRef(false);
  
  // Market data state - different sources based on type
  const [marketData, setMarketData] = useState<CoinGeckoCoin[]>([]);
  const [isLoadingMarket, setIsLoadingMarket] = useState(false);
  const [marketError, setMarketError] = useState<string | null>(null);

  // Stocks market data (only for stocks type)
  const {
    data: stocksMarketData,
    loading: stocksMarketLoading,
    error: stocksMarketError,
  } = useStocksMarket({
    limit: 5,
    autoRefresh: activeTab === "market" && connectionType === "stocks",
    refreshInterval: 5 * 60 * 1000,
    enabled: connectionType === "stocks" && activeTab === "market",
  });

  // All stocks for market overview (only for stocks)
  const {
    data: allStocks,
    loading: allStocksLoading,
  } = useStocksMarket({
    limit: 500,
    autoRefresh: connectionType === "stocks",
    refreshInterval: 5 * 60 * 1000,
    enabled: connectionType === "stocks",
  });

  // Calculate market overview for stocks
  const marketOverview = useMemo(() => {
    if (connectionType !== "stocks" || !allStocks || allStocks.length === 0) {
      return {
        sp500: { price: 0, change: 0 },
        nasdaq: { price: 0, change: 0 },
        dow: { price: 0, change: 0 },
        vix: { value: 0, level: 'Low' as 'Low' | 'Moderate' | 'High' },
        sentiment: { label: 'Neutral' as 'Bullish' | 'Neutral' | 'Bearish', percentage: 0 },
      };
    }

    const spy = allStocks.find(s => s.symbol === 'SPY');
    const qqq = allStocks.find(s => s.symbol === 'QQQ');
    const dia = allStocks.find(s => s.symbol === 'DIA');

    const positiveStocks = allStocks.filter(s => s.changePercent24h > 0).length;
    const sentimentPercentage = (positiveStocks / allStocks.length) * 100;
    
    let sentimentLabel: 'Bullish' | 'Neutral' | 'Bearish' = 'Neutral';
    if (sentimentPercentage > 55) sentimentLabel = 'Bullish';
    else if (sentimentPercentage < 45) sentimentLabel = 'Bearish';

    const avgAbsChange = allStocks.reduce((sum, s) => sum + Math.abs(s.changePercent24h), 0) / allStocks.length;
    let vixLevel: 'Low' | 'Moderate' | 'High' = 'Low';
    let vixValue = avgAbsChange * 10;
    if (vixValue > 25) vixLevel = 'High';
    else if (vixValue > 15) vixLevel = 'Moderate';

    return {
      sp500: { price: spy?.price || 0, change: spy?.changePercent24h || 0 },
      nasdaq: { price: qqq?.price || 0, change: qqq?.changePercent24h || 0 },
      dow: { price: dia?.price || 0, change: dia?.changePercent24h || 0 },
      vix: { value: vixValue, level: vixLevel },
      sentiment: { label: sentimentLabel, percentage: sentimentPercentage },
    };
  }, [connectionType, allStocks]);

  // News data state - supports both crypto and stock news
  const [newsData, setNewsData] = useState<{ total_count: number; news_items: Array<(CryptoNewsItem | StockNewsItem) & { symbol: string }>; timestamp: string } | null>(null);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [newsError, setNewsError] = useState<string | null>(null);

  // Stock signals state (for stocks dashboard only)
  const [stockSignals, setStockSignals] = useState<Array<{
    id: number;
    pair: string;
    type: "BUY" | "SELL";
    confidence: "HIGH" | "MEDIUM" | "LOW";
    ext: string;
    entryShort: string;
    stopLossShort: string;
    progressMin: string;
    progressMax: string;
    progressPercent: number;
  }>>([]);
  const [isLoadingStockSignals, setIsLoadingStockSignals] = useState(false);

  const trades = [
    {
      id: 1,
      pair: "ETH / USDT",
      type: "BUY",
      confidence: "HIGH",
      entry: "$2,120",
      stopLoss: "$120",
      takeProfit1: "$240",
      additionalInfo: "20,045-",
      ext: "22,000",
      entryShort: "1,020",
      stopLossShort: "1.317 $",
      progressMin: "$790",
      progressMax: "$200",
      progressPercent: 75,
      reasons: [
        "Bullish momentum on 1h and 4h charts",
        "Sentiment improved 20% in last 3 hours",
        "High liquidity reduces execution risk"
      ]
    },
    {
      id: 2,
      pair: "BTC / USDT",
      type: "SELL",
      confidence: "MEDIUM",
      entry: "$34,500",
      stopLoss: "$35,200",
      takeProfit1: "$33,800",
      additionalInfo: "15,230-",
      ext: "18,500",
      entryShort: "34,500",
      stopLossShort: "35,200 $",
      progressMin: "$520",
      progressMax: "$150",
      progressPercent: 60,
      reasons: [
        "Resistance level at $35,000 showing strong rejection",
        "Volume declining on upward moves",
        "RSI showing bearish divergence on 4h timeframe"
      ]
    },
  ];

  // Fetch active connection from backend (secure, no localStorage)
  const fetchActiveConnection = useCallback(async () => {
    try {
      const response = await exchangesService.getActiveConnection();
      const connection = response.data;
      setConnectionId(connection.connection_id);
      setActiveConnection(connection as Connection);
      setConnectionType(connection.exchange?.type || null);
      return connection.connection_id;
    } catch (err: any) {
      // Silently handle 401 (not logged in) and 404 (no connection) - both are expected
      if (
        err?.status !== 401 &&
        err?.statusCode !== 401 &&
        err?.status !== 404 &&
        err?.statusCode !== 404
      ) {
        console.error("Failed to fetch active connection:", err);
      }
      setError("No active connection found. Please connect your exchange account.");
      setIsLoading(false);
      return null;
    }
  }, []);

  // Fetch dashboard data (only uses combined dashboard API)
  const fetchDashboardData = useCallback(async (connId: string, isInitial = false) => {
    try {
      // Only show loading on initial load, not on polling updates
      if (isInitial) {
        setIsLoading(true);
      }
      setError(null);
      
      // Use combined dashboard endpoint - single API call for all data
      const response = await exchangesService.getDashboard(connId);
      
      // Smooth state update without full re-render
      setDashboardData((prev) => {
        // Only update if data actually changed (prevents unnecessary re-renders)
        if (prev && JSON.stringify(prev) === JSON.stringify(response.data)) {
          return prev;
        }
        return response.data;
      });
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error("Failed to fetch dashboard data:", err);
      // Only show error on initial load, silent updates on polling
      if (isInitial) {
        setError(err.message || "Failed to load dashboard data. Please try again.");
      }
    } finally {
      if (isInitial) {
        setIsLoading(false);
        setIsInitialLoad(false);
      }
    }
  }, []);

  // Initial load: fetch connection, then fetch data (runs only once on mount)
  useEffect(() => {
    // Prevent re-initialization (especially in React Strict Mode)
    if (hasInitialized.current) return;
    
    const initializeDashboard = async () => {
      hasInitialized.current = true;
      const connId = await fetchActiveConnection();
      if (connId) {
        await fetchDashboardData(connId, true);
      }
    };
    
    initializeDashboard();
    // Empty deps - run only once on mount
  }, []);

  // Polling: only update data, no loading state, no connection fetch
  useEffect(() => {
    if (!connectionId || isInitialLoad) return;

    // Set up polling every 30 seconds (reduced from 8s to save resources)
    // Silent updates - no loading state, smooth transitions
    const pollInterval = setInterval(() => {
      if (connectionId) {
        fetchDashboardData(connectionId, false);
      }
    }, 30000); // 30 seconds instead of 8 seconds

    return () => clearInterval(pollInterval);
    // Remove fetchDashboardData from deps - it's stable with useCallback
  }, [connectionId, isInitialLoad]);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Format percentage
  const formatPercent = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}%`;
  };

  // Format large numbers (market cap, volume)
  const formatLargeNumber = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  // Fetch market data when market tab is active
  const fetchMarketData = useCallback(async () => {
    setIsLoadingMarket(true);
    setMarketError(null);
    try {
      const result = await getCachedMarketData(5);
      setMarketData(result.coins);
      setMarketError(null);
    } catch (error: any) {
      console.error("Failed to fetch market data:", error);
      setMarketError(error.message || "Failed to load market data. Please try again later.");
    } finally {
      setIsLoadingMarket(false);
    }
  }, []);

  // Fetch market data when market tab is selected
  useEffect(() => {
    // Only fetch crypto market data for crypto connections
    if (activeTab === "market" && connectionType === "crypto") {
      fetchMarketData();
    }
  }, [activeTab, connectionType, fetchMarketData]);

  // Fetch news with sentiment (crypto or stocks based on connection type)
  const fetchNews = useCallback(async (limit: number = 30) => {
    setIsLoadingNews(true);
    setNewsError(null);
    try {
      if (connectionType === "crypto") {
        const data = await getGeneralCryptoNews(limit);
        setNewsData(data);
      } else if (connectionType === "stocks") {
        const data = await getGeneralStockNews(limit);
        setNewsData(data);
      }
    } catch (error: any) {
      console.error(`Failed to fetch ${connectionType} news:`, error);
      setNewsError(error.message || "Failed to load news");
    } finally {
      setIsLoadingNews(false);
    }
  }, [connectionType]);

  // Fetch news on mount (for both crypto and stocks)
  useEffect(() => {
    if (connectionType === "crypto" || connectionType === "stocks") {
      fetchNews(30);
    }
  }, [connectionType, fetchNews]);

  // Fetch stock signals for stocks dashboard (top 2 signals)
  useEffect(() => {
    if (connectionType !== "stocks") return;

    const fetchStockSignals = async () => {
      setIsLoadingStockSignals(true);
      try {
        // First, get the stock strategies
        const strategies = await apiRequest<never, Strategy[]>({ path: "/strategies/pre-built", method: "GET" });
        const stockStrategies = (strategies || []).filter((s: Strategy) => s?.type === "admin" && s?.name?.includes("(Stocks)"));
        
        if (stockStrategies.length === 0) {
          setStockSignals([]);
          return;
        }

        // Get signals from the first stock strategy
        const strategyId = stockStrategies[0].strategy_id;
        const response = await getTrendingAssetsWithInsights(strategyId, 10);
        const assets = response.assets || [];

        // Map top 2 assets to signal format
        const mappedSignals = assets.slice(0, 2).map((asset, idx) => {
          const price = asset.price_usd || 0;
          const change = asset.price_change_24h || 0;
          const score = asset.signal?.final_score || asset.trend_score || 0;
          const confidence = score >= 70 ? "HIGH" : score >= 40 ? "MEDIUM" : "LOW";
          const action = asset.signal?.action?.toUpperCase() === "SELL" ? "SELL" : "BUY";
          
          // Calculate stop loss and take profit based on strategy or defaults
          const stopLossPct = asset.signal?.stop_loss_pct || 5;
          const takeProfitPct = asset.signal?.take_profit_pct || 10;
          const stopLoss = action === "BUY" ? price * (1 - stopLossPct / 100) : price * (1 + stopLossPct / 100);
          const takeProfit = action === "BUY" ? price * (1 + takeProfitPct / 100) : price * (1 - takeProfitPct / 100);

          return {
            id: idx + 1,
            pair: `${asset.symbol} / USD`,
            type: action as "BUY" | "SELL",
            confidence: confidence as "HIGH" | "MEDIUM" | "LOW",
            ext: price.toFixed(2),
            entryShort: price.toFixed(2),
            stopLossShort: `${stopLoss.toFixed(2)} $`,
            progressMin: `$${stopLoss.toFixed(0)}`,
            progressMax: `$${takeProfit.toFixed(0)}`,
            progressPercent: Math.min(100, Math.max(0, Math.floor(score))),
          };
        });

        setStockSignals(mappedSignals);
      } catch (err) {
        console.error("Failed to fetch stock signals:", err);
        setStockSignals([]);
      } finally {
        setIsLoadingStockSignals(false);
      }
    };

    fetchStockSignals();
  }, [connectionType]);

  // Auto-refresh news every 5 minutes
  useEffect(() => {
    if (!connectionType) return;
    
    const refreshInterval = setInterval(() => {
      fetchNews(30);
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(refreshInterval);
  }, [connectionType, fetchNews]);

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6 pb-6 sm:pb-8">
      {/* Exchange Account Connection Required */}
      {error && error.includes("No active connection") && (
        <div className="rounded-lg border border-orange-500/50 bg-orange-500/10 p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-orange-500/20 flex-shrink-0">
              <svg className="h-5 w-5 sm:h-6 sm:w-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm sm:text-base font-semibold text-white mb-1">Connect Your Exchange Account</h3>
              <p className="text-xs sm:text-sm text-slate-300 mb-4">
                To start trading and accessing your portfolio, please connect your Binance or Bybit exchange account. You'll need to provide your API keys.
              </p>
              <button
                onClick={() => router.push("/onboarding/crypto-exchange")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#fc4f02] hover:bg-[#ff5f12] text-white font-medium text-sm transition-colors duration-200"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Connect Exchange Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generic Error Display */}
      {error && !error.includes("No active connection") && (
        <div className="rounded-lg border-l-4 border-red-500/50 bg-red-500/10 p-3 sm:p-4">
          <div className="flex items-start gap-2 sm:gap-3">
            <svg className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-red-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <p className="text-xs sm:text-sm text-red-200">{error}</p>
              <button
                onClick={() => {
                  if (connectionId) {
                    fetchDashboardData(connectionId, true);
                  } else {
                    fetchActiveConnection().then((connId) => {
                      if (connId) {
                        fetchDashboardData(connId, true);
                      }
                    });
                  }
                }}
                className="mt-2 text-xs text-red-300 hover:text-red-200 underline"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6 lg:grid-cols-3">
        {/* Left Column - Main Dashboard Content */}
        <div className="lg:col-span-2 space-y-3 sm:space-y-4 md:space-y-6">
          {/* Portfolio - Main Box with Two Inner Boxes */}
          <div className="rounded-xl sm:rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)] bg-gradient-to-br from-white/[0.07] to-transparent p-4 sm:p-6 backdrop-blur">
            <div className="mb-3 sm:mb-4 flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-semibold text-white">Portfolio</h2>
              {lastUpdated && (
                <p className="text-[10px] sm:text-xs text-slate-400">
                  Updated {lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>

            {isLoading && !dashboardData ? (
              <div className="flex items-center justify-center py-6 sm:py-8">
                <div className="h-6 sm:h-8 w-6 sm:w-8 animate-spin rounded-full border-4 border-slate-700/30 border-t-[#fc4f02]"></div>
              </div>
            ) : dashboardData ? (
              <div className="grid grid-cols-1 gap-2 sm:gap-4 sm:grid-cols-2">
                {/* Total Profit Value Inner Box */}
                <div className="rounded-lg sm:rounded-xl bg-gradient-to-br from-white/[0.07] to-transparent p-3 sm:p-4">
                  <p className="mb-1 sm:mb-2 text-[10px] sm:text-xs text-slate-400">Total Portfolio Value</p>
                  <p className="mb-1 sm:mb-2 text-lg sm:text-2xl font-bold text-white">
                    {formatCurrency(dashboardData.portfolio.totalValue)}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs sm:text-sm font-medium ${dashboardData.portfolio.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(dashboardData.portfolio.totalPnl)}
                    </span>
                    <span className={`text-xs sm:text-sm ${dashboardData.portfolio.pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ({formatPercent(dashboardData.portfolio.pnlPercent)})
                    </span>
                  </div>
                </div>

                {/* Active Strategies Inner Box */}
                <div className="rounded-lg sm:rounded-xl bg-gradient-to-br from-white/[0.07] to-transparent p-3 sm:p-4">
                  <p className="mb-1 sm:mb-2 text-[10px] sm:text-xs text-slate-400">Active Positions</p>
                  <p className="mb-1 sm:mb-2 text-lg sm:text-2xl font-bold text-white">
                    {dashboardData.positions.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-medium text-slate-400">
                      {dashboardData.orders.filter(o => o.status === 'NEW' || o.status === 'PARTIALLY_FILLED').length} open orders
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] sm:text-xs text-slate-400">
                    {dashboardData.positions.length} {dashboardData.positions.length === 1 ? 'position' : 'positions'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8 text-slate-400 text-xs sm:text-sm">
                No portfolio data available
              </div>
            )}
          </div>

          {/* Action Center - Recent Activities */}
          <div className="rounded-xl sm:rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)] bg-gradient-to-br from-white/[0.07] to-transparent p-4 sm:p-6 backdrop-blur">
            <div className="mb-3 sm:mb-4 flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-semibold text-white">Action Center</h2>
            </div>
            <div className="space-y-4">
              <div className="py-6 sm:py-8 text-center text-slate-400">
                <p className="text-xs sm:text-sm">No activities yet</p>
                <p className="mt-1 text-[10px] sm:text-xs text-slate-500">Activities will appear here when available</p>
              </div>
            </div>
          </div>

          {/* Holdings & Market */}
          <div className="rounded-xl sm:rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)] bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur">
            <div className="relative p-4 sm:p-6 pb-3 sm:pb-4">
              <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-[#fc4f02]/30"></div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                <h2 className="text-base sm:text-lg font-semibold text-white">Holdings & Market</h2>
                <div className="flex gap-1 sm:gap-2 rounded-lg bg-[--color-surface]/60 p-1">
                  <button
                    onClick={() => setActiveTab("holdings")}
                    className={`rounded-md px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-medium transition-all ${activeTab === "holdings"
                      ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white shadow-lg shadow-[#fc4f02]/30"
                      : "text-slate-400 hover:text-white"
                      }`}
                  >
                    My Holdings
                  </button>
                  <button
                    onClick={() => setActiveTab("market")}
                    className={`rounded-md px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-medium transition-all ${activeTab === "market"
                      ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white shadow-lg shadow-[#fc4f02]/30"
                      : "text-slate-400 hover:text-white"
                      }`}
                  >
                    Market
                  </button>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto p-3 sm:p-6">
              {activeTab === "holdings" ? (
              <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <table className="w-full text-xs sm:text-sm min-w-[600px] sm:min-w-0">
                <thead className="divide-y divide-[--color-border]">
                  <tr className="group/row relative hover:bg-[--color-surface]/40 transition-colors before:absolute before:left-0 before:top-1/2 before:h-8 before:w-1 before:-translate-y-1/2 before:rounded-r-full before:bg-gradient-to-b before:from-[#fc4f02] before:to-[#fda300] before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100">
                    <th className="py-2 sm:py-3 px-1 sm:px-2 text-[10px] sm:text-sm font-medium text-white text-left">Assets</th>
                    <th className="py-2 sm:py-3 px-1 sm:px-2 text-[10px] sm:text-sm font-medium text-white text-left">Holding</th>
                    <th className="py-2 sm:py-3 px-1 sm:px-2 text-[10px] sm:text-sm font-medium text-white text-left">Values</th>
                    <th className="py-2 sm:py-3 px-1 sm:px-2 text-[10px] sm:text-sm font-medium text-white text-left">Entry</th>
                    <th className="py-2 sm:py-3 px-1 sm:px-2 text-[10px] sm:text-sm font-medium text-white text-left">P/L</th>
                    <th className="py-2 sm:py-3 px-1 sm:px-2 text-[10px] sm:text-sm font-medium text-white text-left hidden sm:table-cell">P/L value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[--color-border]">
                  {isLoading && !dashboardData ? (
                    <tr>
                      <td colSpan={6} className="py-6 sm:py-8 text-center">
                        <div className="flex items-center justify-center">
                          <div className="h-5 w-5 sm:h-6 sm:w-6 animate-spin rounded-full border-4 border-slate-700/30 border-t-[#fc4f02]"></div>
                        </div>
                      </td>
                    </tr>
                  ) : dashboardData && dashboardData.positions.length > 0 ? (
                    dashboardData.positions.map((position, index) => {
                      const symbol = position.symbol.replace('USDT', '').replace('BUSD', '');
                      return (
                        <tr
                          key={index}
                          className="group/row relative hover:bg-[--color-surface]/40 transition-colors before:absolute before:left-0 before:top-1/2 before:h-8 before:w-1 before:-translate-y-1/2 before:rounded-r-full before:bg-gradient-to-b before:from-[#fc4f02] before:to-[#fda300] before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100"
                        >
                          <td className="py-2 sm:py-3 px-1 sm:px-2 text-[10px] sm:text-sm font-medium text-white">{symbol}</td>
                          <td className="py-2 sm:py-3 px-1 sm:px-2 text-[10px] sm:text-sm text-slate-300">{position.quantity.toFixed(4)}</td>
                          <td className="py-2 sm:py-3 px-1 sm:px-2 text-[10px] sm:text-sm text-slate-300">{formatCurrency(position.currentPrice * position.quantity)}</td>
                          <td className="py-2 sm:py-3 px-1 sm:px-2 text-[10px] sm:text-sm text-slate-300">{formatCurrency(position.entryPrice)}</td>
                          <td className={`py-2 sm:py-3 px-1 sm:px-2 text-[10px] sm:text-sm font-medium ${position.pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {formatPercent(position.pnlPercent)}
                          </td>
                          <td className={`py-2 sm:py-3 px-1 sm:px-2 text-[10px] sm:text-sm text-slate-400 ${position.unrealizedPnl >= 0 ? 'text-green-400' : 'text-red-400'} hidden sm:table-cell`}>
                            {formatCurrency(position.unrealizedPnl)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-6 sm:py-8 text-center text-xs sm:text-sm text-slate-400">
                        No positions found
                      </td>
                    </tr>
                  )}
                  </tbody>
                </table>
              </div>
              ) : (
                <div className="space-y-4">
                  {/* Conditional rendering based on connection type */}
                  {connectionType === "stocks" ? (
                    /* Stocks Market Data */
                    stocksMarketLoading ? (
                      <div className="py-8 text-center">
                        <div className="flex items-center justify-center">
                          <div className="h-6 w-6 animate-spin rounded-full border-4 border-slate-700/30 border-t-[#fc4f02]"></div>
                        </div>
                      </div>
                    ) : stocksMarketError ? (
                      <div className="py-8 text-center space-y-3">
                        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                          <p className="text-sm text-red-300 mb-2">{stocksMarketError}</p>
                          <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white text-sm font-medium hover:shadow-lg hover:shadow-[#fc4f02]/30 transition-all"
                          >
                            Retry
                          </button>
                        </div>
                      </div>
                    ) : stocksMarketData && stocksMarketData.length > 0 ? (
                      <>
                        <div className="sm:w-full sm:-ml-6 overflow-x-auto sm:overflow-x-visible -mx-4 sm:mx-0 px-4 sm:px-0">
                          <table className="w-full table-auto min-w-[600px] sm:min-w-0">
                            <colgroup>
                              <col style={{ width: '8%' }} />
                              <col style={{ width: '22%' }} />
                              <col style={{ width: '18%' }} />
                              <col style={{ width: '18%' }} />
                              <col style={{ width: '17%' }} />
                              <col style={{ width: '17%' }} />
                            </colgroup>
                            <thead className="divide-y divide-[--color-border]">
                              <tr className="group/row relative hover:bg-[--color-surface]/40 transition-colors">
                                <th className="py-3 pl-0 text-left text-xs sm:text-sm font-medium text-white">Rank</th>
                                <th className="py-3 pr-2 pl-0 text-left text-xs sm:text-sm font-medium text-white">Stock</th>
                                <th className="py-3 px-2 text-left text-xs sm:text-sm font-medium text-white">Price</th>
                                <th className="py-3 px-2 text-left text-xs sm:text-sm font-medium text-white">24h Change</th>
                                <th className="py-3 px-2 text-left text-xs sm:text-sm font-medium text-white hidden sm:table-cell">Market Cap</th>
                                <th className="py-3 px-2 text-left text-xs sm:text-sm font-medium text-white hidden md:table-cell">Volume (24h)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[--color-border]">
                              {stocksMarketData.slice(0, 5).map((stock, index) => (
                                <tr
                                  key={stock.symbol}
                                  onClick={() => router.push(`/dashboard/market/${stock.symbol}`)}
                                  className="group/row relative cursor-pointer hover:bg-[--color-surface]/40 transition-colors"
                                >
                                  <td className="py-3 pl-0 text-left text-xs sm:text-sm font-medium text-slate-300">{index + 1}</td>
                                  <td className="py-3 pr-2 pl-0 text-left">
                                    <div className="flex items-center gap-2 sm:gap-3">
                                      <div className="text-left min-w-0">
                                        <p className="text-xs sm:text-sm font-medium text-white">{stock.symbol}</p>
                                        <p className="text-[10px] sm:text-xs text-slate-400 truncate">{stock.name}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-3 px-2 text-left text-xs sm:text-sm font-medium text-white">${stock.price?.toFixed(2) || '0.00'}</td>
                                  <td className={`py-3 px-2 text-left text-xs sm:text-sm font-medium ${stock.changePercent24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {stock.changePercent24h?.toFixed(2) || '0.00'}%
                                  </td>
                                  <td className="py-3 px-2 text-left text-xs sm:text-sm text-slate-300 hidden sm:table-cell">{formatLargeNumber(stock.marketCap || 0)}</td>
                                  <td className="py-3 px-2 text-left text-xs sm:text-sm text-slate-300 hidden md:table-cell">{formatLargeNumber(stock.volume24h || 0)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="pt-2 sm:pt-4 text-center">
                          <button
                            onClick={() => router.push("/dashboard/market")}
                            className="rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-[#fc4f02]/30 transition-all duration-300 hover:scale-105"
                          >
                            View More
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="py-6 sm:py-8 text-center">
                        <p className="text-xs sm:text-sm text-slate-400">No stocks market data available</p>
                      </div>
                    )
                  ) : (
                    /* Crypto Market Data */
                    isLoadingMarket ? (
                      <div className="py-8 text-center">
                        <div className="flex items-center justify-center">
                          <div className="h-6 w-6 animate-spin rounded-full border-4 border-slate-700/30 border-t-[#fc4f02]"></div>
                        </div>
                      </div>
                    ) : marketError ? (
                      <div className="py-8 text-center space-y-3">
                        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                          <p className="text-sm text-red-300 mb-2">{marketError}</p>
                          <button
                            onClick={() => fetchMarketData()}
                            className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white text-sm font-medium hover:shadow-lg hover:shadow-[#fc4f02]/30 transition-all"
                          >
                            Retry
                          </button>
                        </div>
                      </div>
                    ) : marketData.length > 0 ? (
                      <>
                        <div className="sm:w-full sm:-ml-6 overflow-x-auto sm:overflow-x-visible -mx-4 sm:mx-0 px-4 sm:px-0">
                          <table className="w-full table-auto min-w-[600px] sm:min-w-0">
                            <colgroup>
                              <col style={{ width: '8%' }} />
                              <col style={{ width: '22%' }} />
                              <col style={{ width: '18%' }} />
                              <col style={{ width: '18%' }} />
                              <col style={{ width: '17%' }} />
                              <col style={{ width: '17%' }} />
                            </colgroup>
                            <thead className="divide-y divide-[--color-border]">
                              <tr className="group/row relative hover:bg-[--color-surface]/40 transition-colors before:absolute before:left-0 before:top-1/2 before:h-8 before:w-1 before:-translate-y-1/2 before:rounded-r-full before:bg-gradient-to-b before:from-[#fc4f02] before:to-[#fda300] before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100">
                                <th className="py-3 pl-0 text-left text-xs sm:text-sm font-medium text-white">Rank</th>
                                <th className="py-3 pr-2 pl-0 text-left text-xs sm:text-sm font-medium text-white">Assets</th>
                                <th className="py-3 px-2 text-left text-xs sm:text-sm font-medium text-white">price</th>
                                <th className="py-3 px-2 text-left text-xs sm:text-sm font-medium text-white">24h change</th>
                                <th className="py-3 px-2 text-left text-xs sm:text-sm font-medium text-white hidden sm:table-cell">Market cap</th>
                                <th className="py-3 px-2 text-left text-xs sm:text-sm font-medium text-white hidden md:table-cell">volume (24h)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[--color-border]">
                              {marketData.map((coin, index) => (
                                <tr
                                  key={coin.id}
                                  onClick={() => router.push(`/dashboard/market/${coin.symbol.toUpperCase()}`)}
                                  className="group/row relative cursor-pointer hover:bg-[--color-surface]/40 transition-colors before:absolute before:left-0 before:top-1/2 before:h-8 before:w-1 before:-translate-y-1/2 before:rounded-r-full before:bg-gradient-to-b before:from-[#fc4f02] before:to-[#fda300] before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100"
                                >
                                  <td className="py-3 pl-0 text-left text-xs sm:text-sm font-medium text-slate-300 whitespace-nowrap">
                                    {index + 1}
                                  </td>
                                  <td className="py-3 pr-2 pl-0 text-left">
                                    <div className="flex items-center justify-start gap-2 sm:gap-3">
                                      <img src={coin.image} alt={coin.name} className="h-6 w-6 sm:h-8 sm:w-8 rounded-full flex-shrink-0" />
                                      <div className="text-left min-w-0">
                                        <p className="text-xs sm:text-sm font-medium text-white truncate">{coin.name}</p>
                                        <p className="text-[10px] sm:text-xs text-slate-400 uppercase">{coin.symbol}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-3 px-2 text-left text-xs sm:text-sm font-medium text-white whitespace-nowrap">{formatCurrency(coin.current_price)}</td>
                                  <td className={`py-3 px-2 text-left text-xs sm:text-sm font-medium whitespace-nowrap ${coin.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {formatPercent(coin.price_change_percentage_24h)}
                                  </td>
                                  <td className="py-3 px-2 text-left text-xs sm:text-sm text-slate-300 whitespace-nowrap hidden sm:table-cell">{formatLargeNumber(coin.market_cap)}</td>
                                  <td className="py-3 px-2 text-left text-xs sm:text-sm text-slate-300 whitespace-nowrap hidden md:table-cell">{formatLargeNumber(coin.total_volume)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="pt-2 sm:pt-4 text-center">
                          <button
                            onClick={() => router.push("/dashboard/market")}
                            className="rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-[#fc4f02]/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#fc4f02]/40"
                          >
                            View More
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="py-6 sm:py-8 text-center space-y-3">
                        <p className="text-xs sm:text-sm text-slate-400">
                          {marketError || "No market data available"}
                        </p>
                        {marketError && (
                          <button
                            onClick={() => fetchMarketData()}
                            className="px-3 sm:px-4 py-2 rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white text-xs sm:text-sm font-medium hover:shadow-lg hover:shadow-[#fc4f02]/30 transition-all"
                          >
                            Retry
                          </button>
                        )}
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Trade & AI Insights */}
        <div className="space-y-3 sm:space-y-4 md:space-y-6">
          {/* Trade Section */}
          <div className="space-y-2">
            {/* Trade Header - Outside Box */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
              <h2 className="text-base sm:text-lg font-semibold text-white">Trade</h2>
              {(connectionType === "crypto" || connectionType === "stocks") && (
                <button
                  onClick={() => router.push("/dashboard/top-trades")}
                  className="rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium text-white transition-all duration-300 hover:text-white hover:scale-105 shadow-lg shadow-[#fc4f02]/30 w-fit"
                >
                  View All Trades
                </button>
              )}
            </div>

            {/* Trade Cards - For both Crypto and Stocks */}
            {connectionType === "stocks" ? (
              isLoadingStockSignals ? (
                <div className="rounded-lg sm:rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)] bg-gradient-to-br from-white/[0.07] to-transparent p-6 sm:p-8 backdrop-blur text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 border-2 border-[#fc4f02] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-slate-400">Loading stock signals...</p>
                  </div>
                </div>
              ) : stockSignals.length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  {stockSignals.map((trade) => (
                    <div key={trade.id} className="rounded-lg sm:rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)] bg-gradient-to-br from-white/[0.07] to-transparent p-4 sm:p-6 backdrop-blur">
                      <div className="space-y-3 sm:space-y-4">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <span className={`rounded-lg px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm font-semibold text-white ${trade.type === "BUY"
                            ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300]"
                            : "bg-gradient-to-r from-red-500 to-red-600"
                            }`}>
                            {trade.type}
                          </span>
                          <span className="text-xs sm:text-sm font-medium text-white">{trade.pair}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] sm:text-xs text-slate-300 ${trade.confidence === "HIGH" ? "bg-slate-700" : "bg-slate-600"
                            }`}>{trade.confidence}</span>
                        </div>

                        <div className="space-y-1.5 sm:space-y-2">
                          <p className="text-[10px] sm:text-xs text-slate-400">Price: ${trade.ext}</p>
                          <div className="flex items-center gap-2 text-xs sm:text-sm">
                            <span className="text-slate-400">Entry</span>
                            <span className="font-medium text-white">${trade.entryShort}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs sm:text-sm">
                            <span className="text-slate-400">Stop Loss</span>
                            <span className="font-medium text-white">{trade.stopLossShort}</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1.5 sm:space-y-2">
                          <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-400">
                            <span>{trade.progressMin}</span>
                            <span>{trade.progressMax}</span>
                          </div>
                          <div className="h-1.5 sm:h-2 w-full overflow-hidden rounded-full bg-slate-800">
                            <div
                              className={`h-full bg-gradient-to-r ${trade.type === "BUY"
                                ? "from-green-500 to-emerald-500"
                                : "from-red-500 to-red-600"
                                }`}
                              style={{ width: `${trade.progressPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg sm:rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)] bg-gradient-to-br from-white/[0.07] to-transparent p-6 sm:p-8 backdrop-blur text-center">
                  <div className="flex flex-col items-center gap-3">
                    <svg className="h-12 w-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-white">No Signals Available</h3>
                    <p className="text-sm text-slate-400 max-w-md">Visit Top Trades to generate stock signals and view trading opportunities.</p>
                    <button
                      onClick={() => router.push("/dashboard/top-trades")}
                      className="mt-2 rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-4 py-2 text-sm font-medium text-white transition-all duration-300 hover:scale-105"
                    >
                      Go to Top Trades
                    </button>
                  </div>
                </div>
              )
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {trades.map((trade, index) => (
                 <div key={trade.id} className="rounded-lg sm:rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)] bg-gradient-to-br from-white/[0.07] to-transparent p-4 sm:p-6 backdrop-blur">
                  {/* Top Trade Opportunity */}
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className={`rounded-lg px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm font-semibold text-white ${trade.type === "BUY"
                        ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300]"
                        : "bg-gradient-to-r from-red-500 to-red-600"
                        }`}>
                        {trade.type}
                      </span>
                      <span className="text-xs sm:text-sm font-medium text-white">{trade.pair}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] sm:text-xs text-slate-300 ${trade.confidence === "HIGH" ? "bg-slate-700" : "bg-slate-600"
                        }`}>{trade.confidence}</span>
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <p className="text-[10px] sm:text-xs text-slate-400">Ext. {trade.ext}</p>
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <span className="text-slate-400">Entry</span>
                        <span className="font-medium text-white">{trade.entryShort}</span>
                        <span className="text-slate-500">&gt;</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <span className="text-slate-400">Stop Loss</span>
                        <span className="font-medium text-white">{trade.stopLossShort}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 sm:space-y-2">
                      <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-400">
                        <span>{trade.progressMin}</span>
                        <span>{trade.progressMax}</span>
                      </div>
                      <div className="h-1.5 sm:h-2 w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                          className={`h-full bg-gradient-to-r ${trade.type === "BUY"
                            ? "from-green-500 to-emerald-500"
                            : "from-red-500 to-red-600"
                            }`}
                          style={{ width: `${trade.progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-1.5 sm:gap-2 pt-2">
                      <button className="flex-1 rounded-lg sm:rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-[#fc4f02]/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#fc4f02]/40">
                        Auto Trade
                      </button>
                      <button
                        onClick={() => {
                          setSelectedTrade(index);
                          setShowTradeOverlay(true);
                        }}
                         className="rounded-lg sm:rounded-xl bg-[--color-surface] px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-slate-300 transition-all duration-300  hover:text-white"
                      >
                        View Trade
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            )}
          </div>

          {/* AI Insights Section */}
          <div className="space-y-2">
            {/* AI Insights Header - Outside Box */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
              <h2 className="text-base sm:text-lg font-semibold text-white">AI Insights</h2>
              {connectionType === "crypto" && (
                <button
                  onClick={() => router.push("/dashboard/ai-insights")}
                  className="rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium text-white transition-all duration-300 hover:text-white hover:scale-105 shadow-lg shadow-[#fc4f02]/30 w-fit"
                >
                  View All AI Insights
                </button>
              )}
            </div>

            {/* AI Insights News Cards - For both Crypto and Stocks */}
            <div className="space-y-2 sm:space-y-3">
              {isLoadingNews ? (
                <div className="flex items-center justify-center py-6 sm:py-8">
                  <div className="h-5 w-5 sm:h-6 sm:w-6 animate-spin rounded-full border-4 border-slate-700/30 border-t-[#fc4f02]"></div>
                </div>
              ) : newsError ? (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 sm:p-4 text-center">
                  <p className="text-xs sm:text-sm text-red-300">{newsError}</p>
                </div>
              ) : newsData && newsData.news_items.length > 0 ? (
                newsData.news_items.slice(0, 2).map((news, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      setSelectedNews(index);
                      setShowNewsOverlay(true);
                    }}
                     className="cursor-pointer rounded-lg sm:rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)] bg-gradient-to-br from-white/[0.07] to-transparent p-4 sm:p-6 backdrop-blur"
                  >
                    <div className="mb-3 sm:mb-4 flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                        <span className="rounded-md bg-[#fc4f02]/10 px-2 py-1 text-[10px] sm:text-xs font-semibold text-[#fc4f02]">
                          {news.symbol}
                        </span>
                        <span className="text-[10px] sm:text-xs text-slate-500">•</span>
                        <span className="text-[10px] sm:text-xs text-slate-400">
                          {news.published_at
                            ? new Date(news.published_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Recent"}
                        </span>
                        <span className="text-[10px] sm:text-xs text-slate-500">•</span>
                        <span className="text-[10px] sm:text-xs text-slate-400">{news.source}</span>
                      </div>
                      <SentimentBadge
                        label={news.sentiment.label}
                        score={news.sentiment.score}
                        confidence={news.sentiment.confidence}
                        size="sm"
                      />
                    </div>

                    <div className="space-y-2 sm:space-y-4">
                      {/* News Heading */}
                      <h3 className="text-sm sm:text-base font-semibold text-white">{news.title}</h3>

                      {/* Description */}
                      <div className="space-y-2 text-xs sm:text-sm text-slate-300">
                        <p className="line-clamp-2">
                          {news.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 sm:py-8 text-center text-slate-400">
                  <p className="text-xs sm:text-sm">No news available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Trade Details Overlay */}
      {showTradeOverlay && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowTradeOverlay(false)}
        >
          <div
             className="relative w-full max-w-2xl rounded-xl sm:rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] bg-gradient-to-br from-white/[0.07] to-transparent p-4 sm:p-6 backdrop-blur"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-4 sm:mb-6 flex items-center justify-between">
              <h2 className="text-lg sm:text-2xl font-bold text-white">Trade Details</h2>
              <button
                onClick={() => setShowTradeOverlay(false)}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-[--color-surface] hover:text-white"
                aria-label="Close"
              >
                <svg
                  className="h-4 w-4 sm:h-5 sm:w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Trade Info */}
            <div className="space-y-4 sm:space-y-6">
              {/* Pair and Type */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className={`rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base font-semibold text-white ${trades[selectedTrade].type === "BUY"
                    ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300]"
                    : "bg-gradient-to-r from-red-500 to-red-600"
                  }`}>
                  {trades[selectedTrade].type}
                </span>
                <span className="text-base sm:text-lg font-medium text-white">{trades[selectedTrade].pair}</span>
                <span className="rounded-full bg-slate-700 px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm text-slate-300">{trades[selectedTrade].confidence}</span>
              </div>

              {/* Trade Details */}
               <div className="space-y-2 sm:space-y-4 rounded-lg sm:rounded-xl bg-gradient-to-br from-white/[0.07] to-transparent p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-slate-400">Entry</span>
                  <span className="text-sm sm:text-base font-medium text-white">{trades[selectedTrade].entry}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-slate-400">Stop-Loss</span>
                  <span className="text-sm sm:text-base font-medium text-white">{trades[selectedTrade].stopLoss}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-slate-400">Take Profit 1</span>
                  <span className="text-sm sm:text-base font-medium text-white">{trades[selectedTrade].takeProfit1}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-slate-400">Additional Info</span>
                  <span className="text-sm sm:text-base font-medium text-slate-300">{trades[selectedTrade].additionalInfo}</span>
                </div>
              </div>

              {/* Reasons */}
              <div className="space-y-2 sm:space-y-3">
                <h3 className="text-sm sm:text-base font-semibold text-white">Reasons</h3>
                {trades[selectedTrade].reasons.map((reason: string, index: number) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="mt-1 sm:mt-1.5 h-1 w-1 sm:h-1.5 sm:w-1.5 flex-shrink-0 rounded-full bg-green-400" />
                    <p className="text-xs sm:text-sm text-slate-300">{reason}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* News Overlay */}
      {showNewsOverlay && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowNewsOverlay(false)}
        >
          <div
             className="relative w-full max-w-2xl rounded-xl sm:rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] bg-gradient-to-br from-white/[0.07] to-transparent p-4 sm:p-6 backdrop-blur"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-3 sm:mb-6 flex items-center justify-between gap-2">
              <h2 className="text-sm sm:text-2xl font-bold text-white line-clamp-2">
                {newsData?.news_items[selectedNews]?.title || "News"}
              </h2>
              <button
                onClick={() => setShowNewsOverlay(false)}
                className="flex-shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-[--color-surface] hover:text-white"
                aria-label="Close"
              >
                <svg
                  className="h-4 w-4 sm:h-5 sm:w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Timestamp and Source */}
            {newsData?.news_items[selectedNews] && (
              <div className="mb-3 sm:mb-4 flex flex-wrap items-center gap-1.5 sm:gap-3">
                <span className="text-[10px] sm:text-xs text-slate-400">
                  {newsData.news_items[selectedNews].published_at
                    ? new Date(newsData.news_items[selectedNews].published_at).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Recent"}
                </span>
                <span className="text-[10px] sm:text-xs text-slate-500">•</span>
                <span className="text-[10px] sm:text-xs text-slate-400">{newsData.news_items[selectedNews].source}</span>
                {newsData.news_items[selectedNews].url && (
                  <>
                    <span className="text-[10px] sm:text-xs text-slate-500">•</span>
                    <a
                      href={newsData.news_items[selectedNews].url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] sm:text-xs text-[#fc4f02] hover:underline"
                    >
                      Read full article
                    </a>
                  </>
                )}
              </div>
            )}

            {/* Sentiment Badge */}
            {newsData?.news_items[selectedNews]?.sentiment && (
              <div className="mb-3 sm:mb-4">
                <SentimentBadge
                  label={newsData.news_items[selectedNews].sentiment.label}
                  score={newsData.news_items[selectedNews].sentiment.score}
                  confidence={newsData.news_items[selectedNews].sentiment.confidence}
                  size="md"
                />
              </div>
            )}

            {/* Description */}
            <div className="space-y-4">
              <div className="space-y-2 text-xs sm:text-sm leading-relaxed text-slate-300">
                <p>{newsData?.news_items[selectedNews]?.description || "No description available"}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

