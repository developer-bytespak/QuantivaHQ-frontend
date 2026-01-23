"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { binanceTestnetService } from "@/lib/api/binance-testnet.service";
import { alpacaPaperTradingService, type AlpacaPosition, type AlpacaOrder, type AlpacaDashboard } from "@/lib/api/alpaca-paper-trading.service";
import { apiRequest } from "@/lib/api/client";
import type { Strategy, StockMarketData } from "@/lib/api/strategies";
import { getPreBuiltStrategySignals, getTrendingAssetsWithInsights, getStocksForTopTrades, seedPopularStocks, triggerStockSignals } from "@/lib/api/strategies";
import { exchangesService } from "@/lib/api/exchanges.service";
import { ComingSoon } from "@/components/common/coming-soon";
import { BalanceOverview } from "./components/balance-overview";
import { StrategyCard } from "./components/strategy-card";
import { AutoTradeModal } from "./components/auto-trade-modal";
import { ManualTradeModal } from "./components/manual-trade-modal";
import { StockAutoTradeModal } from "./components/stock-auto-trade-modal";
import { StockManualTradeModal } from "./components/stock-manual-trade-modal";
import { StockOrdersPanel } from "./components/stock-orders-panel";
import TradeLeaderboard from "./components/trade-leaderboard";
import { OrdersPanel } from "./components/orders-panel";
import { useRealtimePaperTrading } from "@/hooks/useRealtimePaperTrading";

// ⏱️ API Refresh Intervals (in milliseconds) - Increased since WebSocket provides real-time updates
const ACCOUNT_DATA_REFRESH_INTERVAL = 600000;  // 10 minutes - Fallback only
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
  // Connection type detection
  const [connectionType, setConnectionType] = useState<"crypto" | "stocks" | null>(null);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);

  // WebSocket connection for real-time updates (only for crypto, not stocks)
  const [socketKey, setSocketKey] = useState(0);
  const isCryptoMode = connectionType === "crypto";
  const realtimeData = useRealtimePaperTrading('default-user', socketKey, isCryptoMode);
  
  // Refs to track last fetch times and prevent aggressive reloads
  const lastAccountDataFetch = useRef<number>(0);
  const lastAllOrdersFetch = useRef<number>(0);
  const isPageVisible = useRef<boolean>(true);
  const isInitialMount = useRef<boolean>(true);
  
  // Rate limit protection - global lock to prevent any API calls during cooldown
  const [isRateLimited, setIsRateLimited] = useState(false);
  
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
        // Don't redirect on error - just log and allow page to render
        console.error("Failed to check connection type:", error);
        // Set connection type to null so page can still render
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

  // Stock market data state (for stocks connection)
  const [stockMarketData, setStockMarketData] = useState<StockMarketData[]>([]);
  const [marketDataSource, setMarketDataSource] = useState<'alpaca' | 'database'>('database');
  const [lastMarketDataUpdate, setLastMarketDataUpdate] = useState<Date | null>(null);
  const [loadingMarketData, setLoadingMarketData] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isGeneratingSignals, setIsGeneratingSignals] = useState(false);

  // Stock paper trading state (Alpaca integration)
  const [stockPaperBalance, setStockPaperBalance] = useState(0);
  const [stockPortfolioValue, setStockPortfolioValue] = useState(0);
  const [stockOpenOrders, setStockOpenOrders] = useState(0);
  const [stockPositions, setStockPositions] = useState<AlpacaPosition[]>([]);
  const [stockOrders, setStockOrders] = useState<AlpacaOrder[]>([]);
  const [stockTradeRecords, setStockTradeRecords] = useState<TradeRecord[]>([]);
  const [alpacaConnected, setAlpacaConnected] = useState(false);
  const [alpacaMarketOpen, setAlpacaMarketOpen] = useState(false);
  const [loadingAlpaca, setLoadingAlpaca] = useState(false);
  const [alpacaError, setAlpacaError] = useState<string | null>(null);

  // --- Load testnet status on mount ---
  useEffect(() => {
    // Only attempt to contact Binance testnet for crypto connections
    if (connectionType !== "crypto") return;

    const loadStatus = async () => {
      try {
        const testnetStatus = await binanceTestnetService.getStatus();
        setStatus(testnetStatus);
      } catch (err: any) {
        console.error("Failed to load testnet status:", err);
      }
    };
    loadStatus();
  }, [connectionType]);

  // --- Load Alpaca paper trading data for stocks connections ---
  const loadAlpacaData = async () => {
    if (connectionType !== "stocks") return;
    
    setLoadingAlpaca(true);
    setAlpacaError(null);
    
    console.log("📡 Calling Alpaca Paper Trading API...");
    
    try {
      const dashboard = await alpacaPaperTradingService.getDashboard();
      
      console.log("📊 Raw Alpaca dashboard response:", dashboard);
      
      // Update balance (use CASH instead of buying power - buying power includes margin/leverage)
      setStockPaperBalance(dashboard.balance?.cash || 0);
      setStockPortfolioValue(dashboard.balance?.portfolioValue || 0);
      
      // Update positions
      setStockPositions(dashboard.positions || []);
      
      // Update orders
      setStockOrders([...(dashboard.openOrders || []), ...(dashboard.recentOrders || [])]);
      setStockOpenOrders(dashboard.openOrders?.length || 0);
      
      // Update market status
      setAlpacaMarketOpen(dashboard.clock?.isOpen || false);
      setAlpacaConnected(true);
      
      // Convert recent filled orders to trade records for leaderboard
      const filledOrders = (dashboard.recentOrders || []).filter(o => o.status === 'filled');
      const records: TradeRecord[] = filledOrders.map(order => ({
        id: order.id,
        timestamp: new Date(order.filled_at || order.updated_at).getTime(),
        symbol: order.symbol,
        type: order.side.toUpperCase() as "BUY" | "SELL",
        entryPrice: order.filled_avg_price || '0',
        profitValue: 0, // Would need position data to calculate actual P/L
        strategyName: 'Alpaca Paper Trade',
      }));
      setStockTradeRecords(records);
      
      console.log("✅ Alpaca paper trading data loaded (FROM API):", {
        cash: dashboard.balance?.cash || 0,
        buyingPower: dashboard.balance?.buyingPower || 0,
        portfolioValue: dashboard.balance?.portfolioValue || 0,
        equity: dashboard.balance?.equity || 0,
        positions: dashboard.positions?.length || 0,
        openOrders: dashboard.openOrders?.length || 0,
        marketOpen: dashboard.clock?.isOpen || false,
        accountMultiplier: dashboard.account?.multiplier || 1,
      });
      
      console.log("💰 Balance Breakdown:", {
        "💵 Cash (shown in UI)": `$${dashboard.balance.cash?.toLocaleString() || '0'}`,
        "📊 Buying Power (includes margin)": `$${dashboard.balance.buyingPower?.toLocaleString() || '0'}`,
        "📈 Portfolio Value": `$${dashboard.balance.portfolioValue?.toLocaleString() || '0'}`,
        "🔢 Margin Multiplier": `${dashboard.account?.multiplier || 1}x`,
        "📦 Long Positions": `$${dashboard.balance.longMarketValue?.toLocaleString() || '0'}`,
        "⚠️ Note": dashboard.clock?.isOpen 
          ? "Market OPEN - Orders execute immediately"
          : "Market CLOSED - Orders queued for next open",
      });
    } catch (err: any) {
      console.error("❌ Failed to load Alpaca data:", err);
      setAlpacaError(err?.message || "Failed to connect to Alpaca");
      setAlpacaConnected(false);
      
      // Fall back to default values if Alpaca is not configured
      console.log("⚠️ Using FALLBACK values (not connected to Alpaca)");
      setStockPaperBalance(100000);
      setStockOpenOrders(0);
    } finally {
      setLoadingAlpaca(false);
    }
  };

  useEffect(() => {
    if (connectionType === "stocks") {
      loadAlpacaData();
      
      // Refresh Alpaca data every 30 seconds
      const interval = setInterval(loadAlpacaData, 30000);
      return () => clearInterval(interval);
    }
  }, [connectionType]);

  // --- Page Visibility API: Pause polling when tab is hidden ---
  useEffect(() => {
    const handleVisibilityChange = () => {
      isPageVisible.current = !document.hidden;
      
      if (!document.hidden) {
        // Tab became visible - check if we need to refresh data
        const now = Date.now();
        
        // Only refresh if data is stale (older than 10 minutes) AND WebSocket disconnected AND not rate limited
        if (now - lastAccountDataFetch.current > 600000 && !realtimeData.connected && !isRateLimited) {
          console.log("Tab visible again, refreshing stale account data");
          loadAccountData();
        }
        
        // Only refresh orders if the Orders panel is open (user explicitly requested orders)
        if (showOrdersPanel && now - lastAllOrdersFetch.current > 600000 && !realtimeData.connected && !isRateLimited) {
          console.log("Tab visible again, refreshing stale orders data (Orders panel open)");
          loadAllOrders();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [status?.configured, showOrdersPanel, realtimeData.connected, isRateLimited]);

  // --- Load account data on mount (one-time initial load) ---
  useEffect(() => {
    if (status && status.configured) {
      // Single initial load with delay to allow WebSocket to connect
      if (isInitialMount.current) {
        isInitialMount.current = false;
        console.log("⏸️ Initial mount - waiting for WebSocket connection");
        
        const initialDelay = setTimeout(() => {
          // Load once. If WebSocket is not connected OR it is connected but NOT providing balance data,
          // fall back to the REST balance snapshot to ensure the UI has immediate balances.
          if (!realtimeData.connected || !realtimeData.balance || Object.keys(realtimeData.balance).length === 0) {
            console.log("Loading initial account data (REST fallback)");
            loadAccountData();
          } else {
            console.log("✓ WebSocket connected and providing balance - using real-time updates");
          }
        }, 10000);
        
        return () => clearTimeout(initialDelay);
      }
    }
  }, [status?.configured, realtimeData.connected, realtimeData.balance]);

  // --- Load initial orders on mount ---
  useEffect(() => {
    // Intentionally not auto-loading orders on mount.
    // Orders are loaded only when the user opens the Orders panel (OrdersPanel will fetch them).
  }, [status?.configured]);

  // --- Sync WebSocket order updates with open orders count ---
  useEffect(() => {
    if (realtimeData.orders && realtimeData.orders.length > 0) {
      // Count open orders from WebSocket data
      const openCount = realtimeData.orders.filter(
        (order) => order.status === 'NEW' || order.status === 'PARTIALLY_FILLED'
      ).length;
      setOpenOrdersCount(openCount);
      
      // Trigger OrdersPanel refresh
      setOrdersRefreshKey((k) => k + 1);
    }
  }, [realtimeData.orders]);

  // If WebSocket connects but we haven't received a balance snapshot via socket yet,
  // fetch a REST balance snapshot so the UI shows immediate balances.
  useEffect(() => {
    if (realtimeData.connected && (!realtimeData.balance || Object.keys(realtimeData.balance).length === 0) && !isRateLimited) {
      const now = Date.now();
      // Avoid repeated immediate calls - only fetch if last fetch > 60s
      if (now - lastAccountDataFetch.current > 60000) {
        console.log("WebSocket connected but no balance received — fetching REST balance snapshot");
        loadAccountData();
      }
    }
  }, [realtimeData.connected, realtimeData.balance, isRateLimited]);

  // --- Sync WebSocket balance with local state ---
  useEffect(() => {
    if (realtimeData.balance) {
      // Calculate total balance in USD (simplified - assuming USDT as proxy for USD)
      const usdtBalance = realtimeData.balance['USDT'];
      if (usdtBalance) {
        const totalUSD = parseFloat(usdtBalance.free) + parseFloat(usdtBalance.locked);
        setBalance(totalUSD);
      }
    }
  }, [realtimeData.balance]);

  const loadAllOrders = async () => {
    // Rate limit protection
    if (isRateLimited) {
      console.log("⛔ API calls blocked - in rate limit cooldown period");
      return;
    }
    
    try {
      lastAllOrdersFetch.current = Date.now();
      await binanceTestnetService.getAllOrders(undefined, 100);
    } catch (err: any) {
      console.error("Failed to fetch all orders:", err);
      
      // Detect rate limiting
      if (err?.message?.includes('Rate limit') || err?.statusCode === 400 || err?.statusCode === 429) {
        console.error("⛔ RATE LIMITED - Blocking all API calls for 10 minutes");
        setIsRateLimited(true);
        setTimeout(() => {
          console.log("✅ Rate limit cooldown complete - API calls re-enabled");
          setIsRateLimited(false);
        }, 600000); // 10 minute cooldown
      }
    }
  };

  const loadAccountData = async () => {
    // Only load account data for crypto connections
    if (connectionType !== "crypto") {
      console.log("Skipping account data load: not a crypto connection");
      return;
    }
    // Rate limit protection
    if (isRateLimited) {
      console.log("⛔ API calls blocked - in rate limit cooldown period");
      return;
    }

    try {
      lastAccountDataFetch.current = Date.now();
      setLoadingBalance(true);

      // Fetch only the account snapshot (fast single call to /balance)
      const balanceData = await binanceTestnetService.getAccountBalance();
      setBalance(balanceData.totalBalanceUSD);

      // Do NOT fetch orders here - only update open orders count from WebSocket if available.
      // This prevents the expensive /orders/all aggregation unless explicitly requested by the user.
      if (realtimeData.orders && Array.isArray(realtimeData.orders)) {
        const openCount = realtimeData.orders.filter(
          (order: any) => order.status === 'NEW' || order.status === 'PARTIALLY_FILLED'
        ).length;
        setOpenOrdersCount(openCount);
      }
    } catch (err: any) {
      console.error("Failed to load account data:", err);

      // Detect rate limiting
      if (err?.message?.includes('Rate limit') || err?.statusCode === 400 || err?.statusCode === 429) {
        console.error("⛔ RATE LIMITED - Blocking all API calls for 10 minutes");
        setIsRateLimited(true);
        setTimeout(() => {
          console.log("✅ Rate limit cooldown complete - API calls re-enabled");
          setIsRateLimited(false);
        }, 600000); // 10 minute cooldown
      }
    } finally {
      setLoadingBalance(false);
    }
  };

  // Determine if stocks connection
  const isStocksConnection = connectionType === "stocks";

  // --- Fetch stock market data from Alpaca (for stocks connection) ---
  const fetchStockMarketData = async () => {
    if (!isStocksConnection) return;
    
    setLoadingMarketData(true);
    try {
      const response = await getStocksForTopTrades(20);
      setStockMarketData(response.stocks);
      setMarketDataSource(response.source);
      setLastMarketDataUpdate(new Date(response.updated_at));
    } catch (err) {
      console.error("Failed to load stock market data:", err);
    } finally {
      setLoadingMarketData(false);
    }
  };

  // Handler for seeding popular stocks
  const handleSeedStocks = async () => {
    setIsSeeding(true);
    try {
      const result = await seedPopularStocks();
      if (result.success) {
        // Refresh market data after seeding
        await fetchStockMarketData();
        // Trigger signal generation - fire and forget (don't await)
        // This prevents the request from being cancelled on page refresh
        setIsGeneratingSignals(true);
        triggerStockSignals()
          .then((res) => console.log("Signal generation:", res.message))
          .catch((err) => console.warn("Signal trigger request cancelled (signals still generating):", err.message));
        
        // Signals generate in background - refresh at intervals
        // The backend continues processing even if this page refreshes
        setTimeout(() => {
          preBuiltStrategies.forEach((strategy) => {
            fetchStrategySignals(strategy.strategy_id);
          });
        }, 5000);
        
        setTimeout(() => {
          preBuiltStrategies.forEach((strategy) => {
            fetchStrategySignals(strategy.strategy_id);
          });
          setIsGeneratingSignals(false);
        }, 30000);
        
        setTimeout(() => {
          preBuiltStrategies.forEach((strategy) => {
            fetchStrategySignals(strategy.strategy_id);
          });
        }, 60000);
      }
    } catch (err) {
      console.error("Failed to seed stocks:", err);
      setIsGeneratingSignals(false);
    } finally {
      setIsSeeding(false);
    }
  };

  // Handler for refreshing stock data
  const handleRefreshStockData = async () => {
    await fetchStockMarketData();
    // Also refresh signals
    preBuiltStrategies.forEach((strategy) => {
      fetchStrategySignals(strategy.strategy_id);
    });
  };

  // --- Fetch pre-built strategies ---
  useEffect(() => {
    // Load strategies for both crypto and stocks connections
    if (connectionType !== "crypto" && connectionType !== "stocks") return;

    let mounted = true;
    (async () => {
      try {
        setLoadingPreBuilt(true);
        
        // For stocks, also fetch stock market data
        if (connectionType === "stocks") {
          fetchStockMarketData();
        }
        
        const data = await apiRequest<never, Strategy[]>({
          path: "/strategies/pre-built",
          method: "GET",
        });
        if (!mounted) return;
        const adminOnly = (data || []).filter((s) => s?.type === "admin");
        
        // Filter strategies based on connection type
        let filteredStrategies: Strategy[];
        if (connectionType === "stocks") {
          // For stocks, only show strategies with "(Stocks)" in the name
          filteredStrategies = adminOnly.filter((s) => s?.name?.includes("(Stocks)"));
        } else {
          // For crypto, show strategies WITHOUT "(Stocks)" in the name
          filteredStrategies = adminOnly.filter((s) => !s?.name?.includes("(Stocks)")).slice(0, 4);
        }
        
        setPreBuiltStrategies(filteredStrategies);
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
  }, [connectionType]);

  // --- Fetch signals for a strategy ---
  const fetchStrategySignals = async (strategyId: string) => {
    if (loadingSignals[strategyId]) return;
    // Guard: only fetch signals when connection is crypto or stocks
    if (connectionType !== "crypto" && connectionType !== "stocks") return;

    setLoadingSignals((p) => ({ ...p, [strategyId]: true }));
    setSignalsError((p) => {
      const c = { ...p };
      delete c[strategyId];
      return c;
    });

    try {
      // For stocks, use the trending-with-insights endpoint (same as Top Trades)
      if (connectionType === "stocks") {
        const response = await getTrendingAssetsWithInsights(strategyId, 10);
        const assets = response.assets || [];
        
        // Map assets to signals format for compatibility
        const signals = assets.map((asset: any) => ({
          signal_id: asset.signal?.signal_id || asset.asset_id,
          strategy_id: strategyId,
          asset_id: asset.asset_id,
          asset: {
            asset_id: asset.asset_id,
            symbol: asset.symbol,
            display_name: asset.display_name || asset.name,
            asset_type: asset.asset_type,
          },
          action: asset.signal?.action || 'HOLD',
          confidence: asset.signal?.confidence || 0,
          final_score: asset.signal?.final_score || 0,
          entry_price: asset.signal?.entry_price,
          stop_loss_price: asset.signal?.stop_loss,
          take_profit_price: asset.signal?.take_profit_1,
          stop_loss: asset.signal?.stop_loss_pct,
          take_profit: asset.signal?.take_profit_pct,
          realtime_data: {
            price: asset.price_usd,
            priceChangePercent: asset.price_change_24h,
            volume24h: asset.volume_24h,
          },
          hasAiInsight: asset.hasAiInsight,
          aiInsight: asset.aiInsight,
          // Include timestamp for time filtering
          poll_timestamp: asset.poll_timestamp,
          timestamp: asset.signal?.timestamp || asset.poll_timestamp,
        }));
        
        setStrategySignals((p) => ({ ...p, [strategyId]: signals }));
        return;
      }

      // For crypto, use the existing logic
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
      // Get clean symbol - handle both crypto (with USDT suffix) and stocks
      const rawSymbol = asset.symbol || asset.asset_id || signal.asset_id || "Unknown";
      const isStock = connectionType === "stocks" || asset.asset_type === "stock";
      
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

      const realtimePrice = signal.realtime_data?.price ?? null;
      const realtimeVolume = signal.realtime_data?.volume24h ?? null;
      const realtimePriceChange = signal.realtime_data?.priceChangePercent ?? null;

      const entryPrice = realtimePrice ?? signal.price ?? signal.last_price ?? 0;
      const stopLoss = signal.stop_loss ?? "-5%";
      const takeProfit = signal.take_profit ?? "+10%";

      // Calculate hours ago from signal timestamp or poll_timestamp
      const signalTimestamp = signal.timestamp || signal.poll_timestamp || signal.created_at;
      let hoursAgo = 0;
      if (signalTimestamp) {
        const signalDate = new Date(signalTimestamp);
        const now = new Date();
        hoursAgo = Math.floor((now.getTime() - signalDate.getTime()) / (1000 * 60 * 60));
      }

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
        hoursAgo,
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
    
    // Add to appropriate trade records based on connection type
    if (isStocksConnection) {
      setStockTradeRecords((p) => [rec, ...p]);
    } else {
      setTradeRecords((p) => [rec, ...p]);
    }
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
    
    // For crypto, reload account data. For stocks, update placeholder balance
    if (isStocksConnection) {
      // Placeholder: simulate balance change for stocks
      const tradeValue = Number(signalToRecord?.entryPrice || 0) * 10; // Assume 10 shares
      if (signalToRecord?.type === 'BUY') {
        setStockPaperBalance((prev) => prev - tradeValue);
      }
      setStockOpenOrders((prev) => prev + 1);
    } else {
      loadAccountData();
    }
    
    // Trigger instant refresh in OrdersPanel
    setOrdersRefreshKey((k) => k + 1);
  };
  
  // Handlers for stock paper trading via Alpaca
  const handleStockAutoTrade = (signal: any) => {
    setSelectedSignal(signal);
    setShowAutoTradeModal(true);
  };

  const handleStockManualTrade = (signal: any) => {
    setSelectedSignal(signal);
    setShowManualTradeModal(true);
  };

  const handleStockTradeSuccess = (result?: any) => {
    // Record the trade in leaderboard
    if (result?.signal) {
      addTradeRecordFromSignal(result.signal);
    }
    setSuccessMessage("Trade executed successfully via Alpaca!");
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
    
    // Refresh Alpaca data immediately
    console.log("🔄 Refreshing Alpaca data after trade...");
    loadAlpacaData();
    
    // Also refresh after 2 seconds to catch any delayed updates
    setTimeout(() => {
      console.log("🔄 Secondary refresh to ensure balance is updated...");
      loadAlpacaData();
    }, 2000);
    
    // Trigger OrdersPanel refresh
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

  // Show loading while checking connection
  if (isCheckingConnection) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700/30 border-t-[#fc4f02]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-6 pb-8 p-4 sm:p-0">

      {/* WebSocket Connection Status - Only for crypto */}
      {!isStocksConnection && realtimeData.reconnecting && (
        <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-3 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
          <span className="text-sm text-yellow-300">Reconnecting to live data stream...</span>
        </div>
      )}
      {!isStocksConnection && realtimeData.binanceStatus?.state === 'RATE_LIMITED' && (
        <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-3 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
          <span className="text-sm text-yellow-300">
            {realtimeData.error || 'Binance API temporarily unavailable - automatic retry in progress'}
          </span>
        </div>
      )}

      {!isStocksConnection && realtimeData.connected && realtimeData.binanceStatus?.state === 'CONNECTED' && (
        <div className="rounded-lg bg-green-500/10 border border-green-500/30 p-2 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-xs text-green-300">Live data stream active - no API polling</span>
        </div>
      )}

      {/* Stocks Info Banner with Controls */}
      {isStocksConnection && (
        <div className="rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${marketDataSource === 'alpaca' ? 'bg-green-500 animate-pulse' : 'bg-blue-500'}`} />
              <span className="text-sm text-blue-300">
                Stock Strategies - {marketDataSource === 'alpaca' ? 'Real-time Alpaca data' : 'Database cached data'}
              </span>
              {lastMarketDataUpdate && (
                <span className="text-xs text-slate-500">
                  Updated: {lastMarketDataUpdate.toLocaleTimeString()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefreshStockData}
                disabled={loadingMarketData}
                className="flex items-center gap-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 px-3 py-1.5 text-xs font-medium text-blue-300 transition-all disabled:opacity-50"
              >
                <svg className={`w-3.5 h-3.5 ${loadingMarketData ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
              <button
                onClick={handleSeedStocks}
                disabled={isSeeding || isGeneratingSignals}
                className="flex items-center gap-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 px-3 py-1.5 text-xs font-medium text-purple-300 transition-all disabled:opacity-50"
                title="Seed popular stocks and generate signals"
              >
                {isSeeding ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {isGeneratingSignals ? 'Generating signals...' : 'Seeding...'}
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Seed & Generate
                  </>
                )}
              </button>
            </div>
          </div>
          {stockMarketData.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {stockMarketData.slice(0, 8).map(stock => (
                <div key={stock.symbol} className="flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1">
                  <span className="text-xs font-medium text-white">{stock.symbol}</span>
                  <span className={`text-xs ${stock.price_change_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {stock.price_change_24h >= 0 ? '+' : ''}{stock.price_change_24h.toFixed(2)}%
                  </span>
                </div>
              ))}
              {stockMarketData.length > 8 && (
                <span className="text-xs text-slate-500 self-center">+{stockMarketData.length - 8} more</span>
              )}
            </div>
          )}
          <div className="mt-2 space-y-1">
            <p className="text-xs text-slate-400">
              {alpacaConnected 
                ? "✅ Connected to Alpaca Paper Trading API. Execute trades with real market simulation." 
                : "⚠️ Alpaca not connected. Configure ALPACA_PAPER_API_KEY and ALPACA_PAPER_SECRET_KEY to enable paper trading."
              }
            </p>
            {alpacaConnected && !alpacaMarketOpen && (
              <p className="text-xs text-yellow-400 font-medium">
                ⏰ Market is currently closed. Orders will be queued and execute when market opens at 9:30 AM ET.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-white">
            {isStocksConnection ? "Stock Trading Strategies" : "Paper Trading Strategies"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {isStocksConnection 
              ? "AI-powered trading signals for stocks based on sentiment, fundamentals, and market analysis"
              : "Execute trades on Binance testnet using AI-powered strategy signals"
            }
          </p>
        </div>

        {/* Buttons - Show for both crypto and stocks */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          {/* Create Strategy - crypto only for now */}
          {!isStocksConnection && (
            <button
              onClick={() => setShowCreateModal(true)}
              className={`rounded-md px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-medium transition-all bg-gradient-to-r from-[#10b981] to-[#06b6d4] text-white w-full sm:w-auto`}
            >
              Create Strategy
            </button>
          )}
          {/* Orders button - show for both */}
          <button
            onClick={() => setShowOrdersPanel(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-800 to-blue-700 px-4 py-2 text-sm font-medium text-blue-200 hover:from-blue-700 hover:to-blue-600 transition-all border border-blue-600/50"
            title={isStocksConnection ? "View orders (Alpaca paper trading coming soon)" : "View all orders"}
          >
            <span>Orders</span>
            <span className="text-xs bg-gradient-to-r from-blue-500 to-blue-400 text-white px-2 py-0.5 rounded-full font-bold">
              {isStocksConnection ? stockOpenOrders : openOrdersCount}
            </span>
          </button>
          {/* Leaderboard button - show for both */}
          <button
            onClick={() => setShowLeaderboard(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-slate-800 to-slate-700 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-slate-200 hover:from-slate-700 hover:to-slate-600 transition-all border border-slate-600/50 w-full sm:w-auto"
            title="Open session leaderboard"
          >
            <span>Leaderboard</span>
            <span className="text-xs bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white px-2 py-0.5 rounded-full font-bold">
              {isStocksConnection ? stockTradeRecords.length : tradeRecords.length}
            </span>
          </button>
        </div>
      </div>

      {/* Balance Overview - Show for both crypto and stocks */}
      <BalanceOverview
        balance={isStocksConnection ? stockPaperBalance : balance}
        openOrdersCount={isStocksConnection ? stockOpenOrders : openOrdersCount}
        loading={isStocksConnection ? loadingAlpaca : loadingBalance}
        isStockMode={isStocksConnection}
        alpacaConnected={alpacaConnected}
        marketOpen={alpacaMarketOpen}
        positionsCount={stockPositions.length}
        dailyChange={0}
        dailyChangePercent={0}
        portfolioValue={stockPortfolioValue}
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
                                  onAutoTrade={isStocksConnection ? () => handleStockAutoTrade(trade) : () => handleAutoTrade(trade)}
                                  onManualTrade={isStocksConnection ? () => handleStockManualTrade(trade) : () => handleManualTrade(trade)}
                                  onViewDetails={() => handleViewTrade(index)}
                                  hideTradeButtons={false}
                                  isStockMode={isStocksConnection}
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
                ? `No signals available for ${currentStrategy.name}. ${isStocksConnection ? 'Stock signals are generated every 10 minutes during market hours.' : 'Signals are generated every 10 minutes.'}`
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

      {/* Modals - Stock mode uses Alpaca modals, Crypto mode uses Binance modals */}
      {showAutoTradeModal && selectedSignal && (
        isStocksConnection ? (
          <StockAutoTradeModal
            signal={selectedSignal}
            balance={stockPaperBalance}
            onClose={() => setShowAutoTradeModal(false)}
            onSuccess={handleStockTradeSuccess}
            marketOpen={alpacaMarketOpen}
          />
        ) : (
          <AutoTradeModal
            signal={selectedSignal}
            balance={balance}
            onClose={() => setShowAutoTradeModal(false)}
            onSuccess={handleTradeSuccess}
          />
        )
      )}

      {showManualTradeModal && selectedSignal && (
        isStocksConnection ? (
          <StockManualTradeModal
            signal={selectedSignal}
            balance={stockPaperBalance}
            onClose={() => setShowManualTradeModal(false)}
            onSuccess={handleStockTradeSuccess}
            marketOpen={alpacaMarketOpen}
          />
        ) : (
          <ManualTradeModal
            signal={selectedSignal}
            balance={balance}
            onClose={() => setShowManualTradeModal(false)}
            onSuccess={handleTradeSuccess}
          />
        )
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-8 right-8 z-[10000] animate-fade-in rounded-lg bg-green-600 px-6 py-3 text-white shadow-lg">
          {successMessage}
        </div>
      )}

      {/* Leaderboard panel - Show for both crypto and stocks */}
      {showLeaderboard && (
        <TradeLeaderboard
          trades={isStocksConnection ? stockTradeRecords : tradeRecords}
          onClose={() => setShowLeaderboard(false)}
          onClear={() => isStocksConnection ? setStockTradeRecords([]) : setTradeRecords([])}
        />
      )}

      {/* Create Custom Strategy Modal - Only for crypto */}
      {!isStocksConnection && showCreateModal && (
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

      {/* Orders Panel - Crypto uses Binance testnet, Stocks uses Alpaca paper trading */}
      {showOrdersPanel && (
        isStocksConnection ? (
          <StockOrdersPanel
            onClose={() => setShowOrdersPanel(false)}
            refreshTrigger={ordersRefreshKey}
          />
        ) : (
          <OrdersPanel
            onClose={() => setShowOrdersPanel(false)}
            refreshTrigger={ordersRefreshKey}
          />
        )
      )}
    </div>
  );
}
