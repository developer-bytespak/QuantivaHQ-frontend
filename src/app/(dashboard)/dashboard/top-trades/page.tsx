"use client";

import { useState, useMemo, useEffect } from "react";
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiRequest } from "@/lib/api/client";
import type { Strategy, StockMarketData } from "@/lib/api/strategies";
import { getPreBuiltStrategySignals, getTrendingAssetsWithInsights, generateAssetInsight, getStocksForTopTrades, seedPopularStocks, triggerStockSignals } from "@/lib/api/strategies";
import { useExchange } from "@/context/ExchangeContext";
import { ComingSoon } from "@/components/common/coming-soon";
import { ExchangeAutoTradeModal } from "./components/exchange-auto-trade-modal";
import { StockExchangeAutoTradeModal } from "./components/stock-exchange-auto-trade-modal";
import { TopTradeVcPoolContext } from "./context/top-trade-vc-pool-context";
import useSubscriptionStore from "@/state/subscription-store";
import { PlanTier } from "@/mock-data/subscription-dummy-data";
import { paperTradingDummy } from "@/mock-data/paper-trading-dummy";

export interface TopTradesPageProps {
  /** When set, page runs in admin VC Pool mode: trades execute via adminCreateTrade(poolId, body) */
  vcPoolId?: string;
  /** Override connection (used in admin mode when user context has no connection) */
  connectionId?: string;
  connectionType?: "crypto" | "stocks";
}

// --- Formatting helpers ---
const formatCurrency = (v: any) => {
  if (v === null || v === undefined || v === '—' || v === '') return '—';
  const n = Number(String(v));
  if (isNaN(n)) return String(v);
  // Use more decimals for small values so 0.00094 doesn't show as $0.00
  const abs = Math.abs(n);
  const fractionDigits = abs === 0 ? 2 : abs < 0.01 ? 6 : abs < 1 ? 4 : 2;
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: fractionDigits }).format(n);
};

const formatNumberCompact = (v: any) => {
  if (v === null || v === undefined || v === '—' || v === '') return '—';
  const n = Number(String(v));
  if (isNaN(n)) return String(v);
  return new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 2 }).format(n);
};

const formatPercent = (v: any) => {
  if (v === null || v === undefined || v === '—' || v === '') return '—';
  const s = String(v).trim();
  const normalized = s.endsWith('%') ? s.slice(0, -1).trim() : s;
  const n = Number(normalized);
  if (isNaN(n)) return s;
  return `${n.toFixed(1)}%`;
};

const formatQuantity = (v: number) => {
  if (!Number.isFinite(v)) return "0";
  if (v === 0) return "0";
  return v.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 12,
    useGrouping: true,
  });
};

// Helper to get trend direction color and icon
const getTrendDirectionBadge = (direction?: string) => {
  switch (direction) {
    case 'TRENDING_UP':
      return { color: 'bg-green-500/20 text-green-400', number: '1', label: 'UP' };
    case 'TRENDING_DOWN':
      return { color: 'bg-red-500/20 text-red-400', number: '2', label: 'DOWN' };
    default:
      return { color: 'bg-slate-500/20 text-slate-300', number: '3', label: 'STABLE' };
  }
};

// Helper to get volume status color
const getVolumeStatusBadge = (status?: string) => {
  switch (status) {
    case 'MASSIVE_SURGE':
      return { color: 'bg-purple-500/20 text-purple-300', number: '1', label: 'SURGE' };
    case 'VOLUME_SURGE':
      return { color: 'bg-blue-500/20 text-blue-300', number: '2', label: 'SURGE' };
    default:
      return { color: 'bg-slate-600/20 text-slate-400', number: '3', label: 'NORMAL' };
  }
};

type StrategyState = "DISCOVERY" | "PREVIEW" | "EXECUTED";

interface Trade {
  id: number;
  assetId?: string;
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
  takeProfitPrice?: string;
  target: string;
  insights: string[];
  profit: string;
  profitValue: number;
  volume: string;
  volumeValue: number;
  winRate: string;
  winRateValue: number;
  hoursAgo: number;
  // NEW: Tier-1 Trend Ranking fields
  trend_score?: number;
  trend_direction?: "TRENDING_UP" | "TRENDING_DOWN" | "STABLE";
  score_change?: number;
  volume_ratio?: number;
  volume_status?: "NORMAL" | "VOLUME_SURGE" | "MASSIVE_SURGE";
}

type ModalPosition = {
  symbol: string;
  quantity: number;
  avgEntryPrice: number;
  currentPrice: number;
  marketValue: number;
  totalCost: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  dailyChangePnl: number;
  dailyChangePercent: number;
  hasRealEntry: boolean;
};

type ModalOrder = {
  orderId: string;
  symbol: string;
  side: string;
  type: string;
  status: string;
  fillPercent: number;
  quantity: number;
  filledQuantity: number;
  avgFillPrice: number;
  orderPrice: string | number;
  totalValue: number;
  stopPrice: number | null;
  time: string;
  updateTime: string;
};

type ModalTradeHistory = {
  orderId: string;
  symbol: string;
  side: string;
  type: string;
  status: string;
  fillPercent: number;
  quantity: number;
  filledQuantity: number;
  avgPrice: number;
  orderPrice: string | number;
  totalValue: number;
  totalFee: number;
  feeAsset: string;
  time: string;
  profitLoss: number;
  profitPercent: number;
};

const toArray = (value: any): any[] => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.results)) return value.results;
  if (Array.isArray(value?.items)) return value.items;
  return [];
};

const toNumber = (value: any, fallback = 0): number => {
  if (value === null || value === undefined || value === "") return fallback;
  const n = Number(String(value).replace("%", "").trim());
  return Number.isFinite(n) ? n : fallback;
};

const toIso = (value: any): string | undefined => {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
};

const toDurationLabel = (minutes: number): string => {
  if (!Number.isFinite(minutes) || minutes <= 0) return "—";
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
};

const normalizeOrderStatus = (value: any): string => String(value ?? "UNKNOWN").toUpperCase();

export default function TopTradesPage(props?: TopTradesPageProps) {
  // Connection type detection - using global context
  const { vcPoolId, connectionId: propConnectionId, connectionType: propConnectionType } = props ?? {};
  const { connectionType: ctxConnectionType, connectionId: ctxConnectionId, isLoading: isCheckingConnection } = useExchange();
  const connectionId = propConnectionId ?? ctxConnectionId;
  const connectionType = propConnectionType ?? ctxConnectionType;
  const isStocksConnection = connectionType === "stocks";
  const { currentSubscription } = useSubscriptionStore();
  const canAccessTopTrades = !!vcPoolId || (currentSubscription && (currentSubscription.tier === PlanTier.PRO || currentSubscription.tier === PlanTier.ELITE));

  // AI insights state with timestamps
  const [aiInsights, setAiInsights] = useState<Record<string, Record<string, { text: string; timestamp: number }>>>({});
  const [loadingInsight, setLoadingInsight] = useState<Record<string, boolean>>({});

  // --- Page state ---
  const [trendingTrades, setTrendingTrades] = useState<Trade[]>([]);
  const [loadingTrending, setLoadingTrending] = useState(true);

  // Pre-built strategies state
  const [preBuiltStrategies, setPreBuiltStrategies] = useState<Strategy[]>([]);
  const [loadingPreBuilt, setLoadingPreBuilt] = useState(false);
  const [preBuiltError, setPreBuiltError] = useState<string | null>(null);

  // Preview/cache state for strategies
  const [previewCache, setPreviewCache] = useState<Record<string, any>>({});
  const [strategyState, setStrategyState] = useState<Record<string, StrategyState>>({});
  const [currentAppliedStrategyId, setCurrentAppliedStrategyId] = useState<string | null>(null);

  // Tab state: active tab index (0-3 for 4 strategies)
  const [activeTab, setActiveTab] = useState(0);
  
  // Signals for each strategy tab, keyed by strategy_id
  const [strategySignals, setStrategySignals] = useState<Record<string, any[]>>({});
  const [loadingSignals, setLoadingSignals] = useState<Record<string, boolean>>({});
  const [signalsError, setSignalsError] = useState<Record<string, string>>({});

  // Stock market data state (for stocks connection)
  const [stockMarketData, setStockMarketData] = useState<StockMarketData[]>([]);
  const [marketDataSource, setMarketDataSource] = useState<'alpaca' | 'database'>('database');
  const [lastMarketDataUpdate, setLastMarketDataUpdate] = useState<Date | null>(null);
  const [loadingMarketData, setLoadingMarketData] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isGeneratingSignals, setIsGeneratingSignals] = useState(false);

  // UI filters / pagination / overlay
  const [timeFilter, setTimeFilter] = useState<"24h" | "7d" | "30d" | "all">("all");
  const [sortBy, setSortBy] = useState<"profit" | "volume" | "winrate">("profit");
  const ITEMS_PER_PAGE = 8;
  const [currentPage, setCurrentPage] = useState(1);
  const [showTradeOverlay, setShowTradeOverlay] = useState(false);
  const [selectedTradeIndex, setSelectedTradeIndex] = useState<number>(0);
  const [showAutoTradeModal, setShowAutoTradeModal] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState<any>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Paper trading mock usage detection and pagination
  const searchParams = useSearchParams();
  const forcePaperMock = !!(searchParams && searchParams.get && searchParams.get('paperMock') === '1');
  const [paperMockEnabled, setPaperMockEnabled] = useState<boolean>(forcePaperMock || false);
  useEffect(() => {
    if (forcePaperMock) setPaperMockEnabled(true);
  }, [forcePaperMock]);
  const effectivePaperMock = paperMockEnabled || (!!(connectionType && String(connectionType).toLowerCase().includes('paper')));
  const [paperPositionsPage, setPaperPositionsPage] = useState(1);
  const PAPER_POS_PER_PAGE = 20;
  const paperPositions = (paperTradingDummy.positions || []);
  const paperPositionsTotalPages = Math.max(1, Math.ceil(paperPositions.length / PAPER_POS_PER_PAGE));
  const pagedPaperPositions = useMemo(() => {
    const s = (paperPositionsPage - 1) * PAPER_POS_PER_PAGE;
    return paperPositions.slice(s, s + PAPER_POS_PER_PAGE);
  }, [paperPositionsPage, paperPositions]);

  // Create strategy modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Positions and Leaderboard modal state
  const [showPositionsModal, setShowPositionsModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [positionsModalPage, setPositionsModalPage] = useState(1);
  const [positionsModalTab, setPositionsModalTab] = useState<"all" | "pending" | "filled" | "canceled">("all");
  const [leaderboardTab, setLeaderboardTab] = useState<"history" | "positions">("history");
  const [historyFilter, setHistoryFilter] = useState<"all" | "profitable" | "loss" | "recent" | "p&l">("all");
  const [leaderboardHistoryPage, setLeaderboardHistoryPage] = useState(1);
  const [tradeHistoryPeriod, setTradeHistoryPeriod] = useState<"all" | "1d" | "1w" | "1m" | "6m" | "custom">("all");
  const [tradeHistoryStartDate, setTradeHistoryStartDate] = useState("");
  const [tradeHistoryEndDate, setTradeHistoryEndDate] = useState("");
  const [leaderboardPositionsPage, setLeaderboardPositionsPage] = useState(1);
  const [ordersPeriod, setOrdersPeriod] = useState<"all" | "1d" | "1w" | "1m" | "6m" | "custom">("all");
  const [ordersStartDate, setOrdersStartDate] = useState("");
  const [ordersEndDate, setOrdersEndDate] = useState("");
  const [ordersSummary, setOrdersSummary] = useState<any>(null);
  const LEADERBOARD_ITEMS_PER_PAGE = 20;
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
  const [modalPositions, setModalPositions] = useState<ModalPosition[]>([]);
  const [modalOrders, setModalOrders] = useState<ModalOrder[]>([]);
  const [modalTradeHistory, setModalTradeHistory] = useState<ModalTradeHistory[]>([]);
  const [modalTradeSummary, setModalTradeSummary] = useState<any>(null);

  // Create strategy form state
  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createStopLoss, setCreateStopLoss] = useState("5");
  const [createTakeProfit, setCreateTakeProfit] = useState("10");
  const [createRiskLevel, setCreateRiskLevel] = useState<"low" | "medium" | "high">("medium");

  // --- Helpers: map backend response into Trade[] (defensive) ---
  const mapBackendToTrades = (data: any[], isStock: boolean = false): Trade[] => {
    const uniqueData: any[] = [];
    const seenIds = new Set<string>();
    for (const d of data) {
      const aid = d?.asset_id ?? d?.assetId ?? d?.asset?.asset_id ?? null;
      if (aid) {
        if (!seenIds.has(aid)) {
          seenIds.add(aid);
          uniqueData.push(d);
        }
      } else {
        uniqueData.push(d);
      }
    }

    return uniqueData.map((item: any, idx: number) => {
      const rawSymbol = item.symbol ?? item.asset_symbol ?? (item.asset?.symbol) ?? `ASSET-${idx}`;
      const assetType = item.asset?.asset_type || item.asset_type;
      const isStockAsset = isStock || assetType === 'stock';
      
      // For crypto: remove USDT suffix. For stocks: use as-is
      const cleanSymbol = isStockAsset 
        ? rawSymbol.trim() 
        : rawSymbol.replace(/USDT$/i, '').trim();
      
      // Format pair based on asset type
      const pair = item.pair ?? (isStockAsset ? `${cleanSymbol} / USD` : `${cleanSymbol} / USDT`);
      const score = Number(item.final_score ?? item.score ?? 0);
      const confidence: Trade["confidence"] = score >= 0.7 ? "HIGH" : score >= 0.4 ? "MEDIUM" : "LOW";
      
      // Use realtime_data if available, otherwise fallback to old fields
      const realtimePrice = item.realtime_data?.price ?? null;
      const realtimeVolume = item.realtime_data?.volume24h ?? null;
      const realtimePriceChange = item.realtime_data?.priceChangePercent ?? null;
      const price = realtimePrice ?? item.price ?? item.last_price ?? item.quote ?? null;
      const volume = realtimeVolume ?? item.volume ?? item.volumeValue ?? null;
      const priceChange = realtimePriceChange ?? item.changePercent ?? item.profit ?? null;
      
      return {
        id: idx + 1,
        assetId: item.asset_id ?? item.asset?.asset_id ?? item.assetId ?? null,
        pair,
        type: (item.action && item.action.toUpperCase() === 'SELL') ? 'SELL' : 'BUY',
        confidence,
        ext: price ? String(price) : "—",
        entry: price ? String(price) : (item.entry ?? "—"),
        stopLoss: item.stop_loss || item.stopLoss || "—",
        progressMin: 0,
        progressMax: 100,
        progressValue: Math.min(100, Math.max(0, Math.floor((score || 0) * 100))),
        entryPrice: item.entryPrice ? String(item.entryPrice) : price ? String(price) : "—",
        stopLossPrice: item.stopLossPrice ? String(item.stopLossPrice) : item.stop_loss ? String(item.stop_loss) : "—",
        takeProfit1: item.take_profit || item.takeProfit || "—",
        target: item.target || "",
        insights: item.insights || item.reasons || [],
        profit: priceChange ? `${Number(priceChange).toFixed(1)}%` : "0.0%",
        profitValue: Number(priceChange ?? 0) || 0,
        volume: volume ? String(Number(volume).toLocaleString()) : "—",
        volumeValue: Number(volume ?? 0) || 0,
        winRate: item.winRate ? `${item.winRate}%` : (item.win_rate ? `${item.win_rate}%` : "—"),
        winRateValue: Number(item.winRate ?? item.win_rate ?? 0) || 0,
        hoursAgo: Number(item.hoursAgo ?? item.age_hours ?? 0) || 0,
        // NEW: Tier-1 Trend Ranking fields
        trend_score: Number(item.trend_score ?? 0) || 0,
        trend_direction: item.trend_direction ?? "STABLE",
        score_change: Number(item.score_change ?? 0) || 0,
        volume_ratio: Number(item.volume_ratio ?? 1) || 1,
        volume_status: item.volume_status ?? "NORMAL",
      } as Trade;
    });
  };

  // Determine if stocks connection
  // (moved earlier since connectionType is now from context)

  // --- Fetch stock market data from Alpaca (for stocks connection) ---
  const fetchStockMarketData = async () => {
    if (!isStocksConnection || !canAccessTopTrades) return;

    setLoadingMarketData(true);
    try {
      // Fetch all stocks from market page (500 limit to match market page)
      // Explicitly pass 500 to ensure all stocks are fetched
      const response = await getStocksForTopTrades(500);
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
    // Only refresh signals for the active strategy
    const activeStrategy = preBuiltStrategies[activeTab];
    if (activeStrategy) {
      fetchStrategySignals(activeStrategy.strategy_id);
    }
  };

  // --- Fetch trending assets (DISCOVERY) ---
  useEffect(() => {
    if (!canAccessTopTrades) return;
    // Fetch for both crypto and stocks connections
    if (connectionType !== "crypto" && connectionType !== "stocks") return;

    let mounted = true;
    (async () => {
      try {
        setLoadingTrending(true);
        
        // For stocks, use the dedicated stocks API (skip crypto trending-assets endpoint)
        if (connectionType === "stocks") {
          await fetchStockMarketData();
          // Don't fetch crypto trending assets for stock accounts
          if (mounted) {
            setTrendingTrades([]);
            setLoadingTrending(false);
          }
          return;
        }
        
        // For crypto connections only, fetch crypto trending assets
        const data = await apiRequest<never, any[]>({ path: "/strategies/trending-assets?limit=20&realtime=true", method: "GET" });
        if (!mounted) return;
        if (!data || !Array.isArray(data) || data.length === 0) {
          setTrendingTrades([]);
          setLoadingTrending(false);
          return;
        }
        const mapped = mapBackendToTrades(data, false);
        setTrendingTrades(mapped);
      } catch (err) {
        console.error("Failed to load trending assets:", err);
        setTrendingTrades([]); // show no mock by default; mock kept only on hard error in previous behaviour
      } finally {
        if (mounted) setLoadingTrending(false);
      }
    })();
    return () => { mounted = false; };
  }, [connectionType, isStocksConnection, canAccessTopTrades]);

  // --- Fetch pre-built strategies ---
  useEffect(() => {
    if (!canAccessTopTrades) return;
    // Load strategies for both crypto and stocks connections
    if (connectionType !== "crypto" && connectionType !== "stocks") return;

    let mounted = true;
    (async () => {
      try {
        setLoadingPreBuilt(true);
        // Use asset_type query param to filter strategies on backend
        const assetType = connectionType === "stocks" ? "stock" : "crypto";
        const data = await apiRequest<never, Strategy[]>({ 
          path: `/strategies/pre-built?asset_type=${assetType}`, 
          method: "GET" 
        });
        if (!mounted) return;
        // Backend already filters by asset_type, just filter for admin strategies
        const adminOnly = (data || []).filter((s) => s?.type === "admin");
        setPreBuiltStrategies(adminOnly);
      } catch (err: any) {
        console.error("Failed to load pre-built strategies:", err);
        setPreBuiltError(err?.message || String(err));
      } finally {
        if (mounted) setLoadingPreBuilt(false);
      }
    })();
    return () => { mounted = false; };
  }, [connectionType, canAccessTopTrades]);

  // --- Fetch signals for a strategy with AI insights ---
  const fetchStrategySignals = async (strategyId: string) => {
    if (loadingSignals[strategyId]) return;
    // Guard: only fetch signals when connection is crypto or stocks
    if (connectionType !== "crypto" && connectionType !== "stocks") return;
    
    setLoadingSignals((p) => ({ ...p, [strategyId]: true }));
    setSignalsError((p) => { const c = { ...p }; delete c[strategyId]; return c; });

    try {
      // Use new AI insights endpoint - pass limit 500 to match market page
      // This matches the market page which shows all available stocks
      console.log(`[TopTrades] Fetching signals for strategy ${strategyId} with limit 500`);
      const response = await getTrendingAssetsWithInsights(strategyId, 500);
      const assets = response.assets || [];
      console.log(`[TopTrades] Received ${assets.length} assets from API for strategy ${strategyId}`);
      
      // Store AI insights separately with timestamps
      const insights: Record<string, { text: string; timestamp: number }> = {};
      assets.forEach(asset => {
        if (asset.hasAiInsight && asset.aiInsight) {
          insights[asset.asset_id] = {
            text: asset.aiInsight,
            timestamp: Date.now()
          };
        }
      });
      setAiInsights((p) => ({ ...p, [strategyId]: insights }));
      
      // Get strategy to access stop_loss_value and take_profit_value
      const strategy = preBuiltStrategies.find(s => s.strategy_id === strategyId);
      
      // Map assets to signals format for compatibility with existing code
      const signals = assets.map((asset, idx) => {
        // Debug log to see what we're getting (only for first asset)
        if (idx === 0) {
          console.log('[TopTrades] Sample asset:', {
            symbol: asset.symbol,
            hasSignal: !!asset.signal,
            signal: asset.signal,
            trend_score: asset.trend_score,
            strategy_stop_loss: strategy?.stop_loss_value,
            strategy_take_profit: strategy?.take_profit_value,
          });
        }
        
        return {
          signal_id: asset.signal?.signal_id || asset.asset_id,
          strategy_id: strategyId,
          asset_id: asset.asset_id,
          asset: {
            asset_id: asset.asset_id,
            symbol: asset.symbol,
            display_name: asset.display_name,
            asset_type: asset.asset_type, // Include asset type for stock detection
            trend_score: asset.trend_score, // Include trend_score from asset
          },
          action: asset.signal?.action || 'HOLD',
          confidence: asset.signal?.confidence || 0,
          final_score: asset.signal?.final_score || 0,
          entry_price: asset.signal?.entry_price,
          stop_loss_price: asset.signal?.stop_loss,
          take_profit_price: asset.signal?.take_profit_1,
          stop_loss: asset.signal?.stop_loss_pct ?? strategy?.stop_loss_value ?? null, // Percentage from signal or strategy
          take_profit: asset.signal?.take_profit_pct ?? strategy?.take_profit_value ?? null, // Percentage from signal or strategy
          stop_loss_pct: asset.signal?.stop_loss_pct ?? strategy?.stop_loss_value ?? null, // Also include as stop_loss_pct for mapSignalsToTrades
          take_profit_pct: asset.signal?.take_profit_pct ?? strategy?.take_profit_value ?? null, // Also include as take_profit_pct for mapSignalsToTrades
          trend_score: ((asset as any).signal?.trend_score) ?? null, // Trend score from signal (only available when signal exists)
          details: asset.signal ? [{
            entry_price: asset.signal.entry_price,
            stop_loss: asset.signal.stop_loss,
            take_profit_1: asset.signal.take_profit_1,
          }] : [],
          realtime_data: {
            price: asset.price_usd,
            priceChangePercent: asset.price_change_24h,
            volume24h: asset.volume_24h,
          },
          hasAiInsight: asset.hasAiInsight,
          // Include timestamp for time filtering (cast to any for dynamic fields)
          timestamp: (asset.signal as any)?.timestamp || (asset as any).poll_timestamp,
          poll_timestamp: (asset as any).poll_timestamp,
        };
      });
      
      setStrategySignals((p) => ({ ...p, [strategyId]: signals }));
    } catch (err: any) {
      console.error(`Failed to load signals for strategy ${strategyId}:`, err);
      setSignalsError((p) => ({ ...p, [strategyId]: err?.message || String(err) }));
      setStrategySignals((p) => ({ ...p, [strategyId]: [] }));
    } finally {
      setLoadingSignals((p) => ({ ...p, [strategyId]: false }));
    }
  };

  // --- Generate AI insight on-demand for specific asset ---
  const handleGenerateInsight = async (strategyId: string, assetId: string) => {
    const key = `${strategyId}-${assetId}`;
    if (loadingInsight[key]) return;
    
    setLoadingInsight((p) => ({ ...p, [key]: true }));
    
    try {
      const response = await generateAssetInsight(strategyId, assetId);
      
      // Update AI insights with timestamp
      setAiInsights((p) => ({
        ...p,
        [strategyId]: {
          ...(p[strategyId] || {}),
          [assetId]: {
            text: response.insight,
            timestamp: Date.now()
          },
        },
      }));
      
      // Update signal to mark it has insight
      setStrategySignals((p) => {
        const signals = p[strategyId] || [];
        return {
          ...p,
          [strategyId]: signals.map(s => 
            s.asset_id === assetId ? { ...s, hasAiInsight: true } : s
          ),
        };
      });
    } catch (err: any) {
      console.error(`Failed to generate insight for ${assetId}:`, err);
      alert(`Failed to generate insight: ${err.message}`);
    } finally {
      setLoadingInsight((p) => ({ ...p, [key]: false }));
    }
  };

  // --- Fetch signals for ONLY the active strategy (lazy loading) ---
  // This dramatically improves performance by only loading data for the currently viewed tab
  useEffect(() => {
    if (!canAccessTopTrades) return;
    if (connectionType !== "crypto" && connectionType !== "stocks") return;
    if (preBuiltStrategies.length > 0) {
      const activeStrategy = preBuiltStrategies[activeTab];
      if (activeStrategy && !strategySignals[activeStrategy.strategy_id] && !loadingSignals[activeStrategy.strategy_id]) {
        fetchStrategySignals(activeStrategy.strategy_id);
      }
    }
  }, [preBuiltStrategies, connectionType, activeTab, canAccessTopTrades]);

  // --- Auto-refresh signals every 60 seconds (only for active strategy) ---
  useEffect(() => {
    if (!canAccessTopTrades) return;
    if (connectionType !== "crypto" && connectionType !== "stocks") return;
    if (preBuiltStrategies.length === 0) return;

    const interval = setInterval(() => {
      // Only refresh the currently active strategy to reduce API load
      const activeStrategy = preBuiltStrategies[activeTab];
      if (activeStrategy) {
        fetchStrategySignals(activeStrategy.strategy_id);
      }
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [preBuiltStrategies, connectionType, activeTab, canAccessTopTrades]);

  // --- Map signals to trades for display ---
  const mapSignalsToTrades = (signals: any[]): Trade[] => {
    if (!signals || signals.length === 0) return [];
    
    return signals.map((signal, idx) => {
      const asset = signal.asset || {};
      const rawSymbol = asset.symbol || asset.asset_id || 'Unknown';
      const isStockAsset = isStocksConnection || asset.asset_type === 'stock';
      
      // For crypto: remove USDT suffix. For stocks: use as-is
      const cleanSymbol = isStockAsset 
        ? rawSymbol.trim() 
        : rawSymbol.replace(/USDT$/i, '').trim();
      
      // Format pair based on asset type
      const pair = isStockAsset 
        ? `${cleanSymbol} / USD` 
        : `${cleanSymbol} / USDT`;
      
      const score = Number(signal.final_score ?? 0);
      const confidence: Trade["confidence"] = score >= 0.7 ? "HIGH" : score >= 0.4 ? "MEDIUM" : "LOW";
      
      // Use realtime_data if available
      const realtimePrice = signal.realtime_data?.price ?? null;
      const realtimeVolume = signal.realtime_data?.volume24h ?? null;
      const realtimePriceChange = signal.realtime_data?.priceChangePercent ?? null;
      
      // Get entry price from signal details or asset or realtime data
      const entryPrice = signal.entry_price || signal.details?.[0]?.entry_price || realtimePrice || null;
      const stopLossPrice = signal.stop_loss_price || signal.details?.[0]?.stop_loss || null;
      const takeProfitPrice = signal.take_profit_price || signal.details?.[0]?.take_profit_1 || null;
      
      // Get stop loss and take profit percentages from signal (set from strategy in backend)
      // These are percentages like "5" or "10", format them with % sign
      const stopLossPct = signal.stop_loss_pct ?? signal.stop_loss ?? null;
      const takeProfitPct = signal.take_profit_pct ?? signal.take_profit ?? null;
      
      // Debug log for first signal to see what data we have
      if (idx === 0) {
        console.log('[TopTrades] mapSignalsToTrades - Sample signal:', {
          signal_id: signal.signal_id,
          stop_loss_pct: signal.stop_loss_pct,
          stop_loss: signal.stop_loss,
          take_profit_pct: signal.take_profit_pct,
          take_profit: signal.take_profit,
          trend_score: signal.trend_score,
          asset_trend_score: asset.trend_score,
          final_score: signal.final_score,
        });
      }
      
      // Get trend score from signal
      // For stocks, trend_score is only available when a signal has been generated
      // If no signal exists, trend_score will be null/0 (which is expected)
      const trendScore = signal.trend_score ?? (signal as any).asset?.trend_score ?? null;
      
      // Get win rate if available (might not be in signal data)
      const winRate = (signal as any).win_rate ?? (signal as any).winRate ?? null;
      
      // Get explanation text
      const explanationText = signal.explanations?.[0]?.text || signal.explanation?.text || 'No explanation available';
      
      return {
        id: idx + 1,
        assetId: asset.asset_id || signal.asset_id || null,
        pair,
        type: (signal.action && signal.action.toUpperCase() === 'SELL') ? 'SELL' : 'BUY',
        confidence,
        ext: entryPrice ? String(entryPrice) : "—",
        entry: entryPrice ? String(entryPrice) : "—",
        stopLoss: stopLossPct !== null && stopLossPct !== undefined ? `${stopLossPct}%` : "—",
        progressMin: 0,
        progressMax: 100,
        progressValue: Math.min(100, Math.max(0, Math.floor((score || 0) * 100))),
        entryPrice: entryPrice ? String(entryPrice) : "—",
        stopLossPrice: stopLossPrice ? String(stopLossPrice) : "—",
        takeProfit1: takeProfitPct !== null && takeProfitPct !== undefined ? `${takeProfitPct}%` : "—",
        takeProfitPrice: takeProfitPrice ? String(takeProfitPrice) : "—",
        target: "",
        insights: explanationText ? [explanationText] : [],
        profit: realtimePriceChange ? `${Number(realtimePriceChange).toFixed(1)}%` : "0.0%",
        profitValue: Number(realtimePriceChange ?? 0) || 0,
        volume: realtimeVolume ? String(Number(realtimeVolume).toLocaleString()) : "—",
        volumeValue: Number(realtimeVolume ?? 0) || 0,
        winRate: winRate !== null && winRate !== undefined ? `${winRate}%` : "—",
        winRateValue: Number(winRate ?? 0) || 0,
        hoursAgo: signal.timestamp ? Math.floor((Date.now() - new Date(signal.timestamp).getTime()) / (1000 * 60 * 60)) : 0,
        trend_score: trendScore !== null && trendScore !== undefined ? Number(trendScore) : 0, // Show 0 if no signal/trend_score available
        trend_direction: "STABLE",
        score_change: 0,
        volume_ratio: 1,
        volume_status: "NORMAL",
      } as Trade;
    });
  };

  // --- Get current strategy and its signals ---
  const currentStrategy = preBuiltStrategies[activeTab] || null;
  const currentSignals = currentStrategy ? (strategySignals[currentStrategy.strategy_id] || []) : [];
  const currentTrades = mapSignalsToTrades(currentSignals);

  // --- Preview: Apply strategy to trendingTrades but do NOT generate signals ---
  const previewStrategy = async (strategyId: string) => {
    if (strategyState[strategyId] === "PREVIEW") {
      // already previewed, make it the current applied
      setCurrentAppliedStrategyId(strategyId);
      return;
    }

    // if cached, reuse
    if (previewCache[strategyId]) {
      setStrategyState((s) => ({ ...s, [strategyId]: "PREVIEW" }));
      setCurrentAppliedStrategyId(strategyId);
      // apply preview to trendingTrades using cached content
      try {
        const preview = previewCache[strategyId];
        const mapped = mapBackendToTrades(preview.assets || preview);
        setTrendingTrades(mapped);
      } catch (err) {
        // ignore mapping errors
      }
      return;
    }

    // Fetch strategy (try to decide whether user strategy or pre-built)
    let strategy: any = null;
    try {
      strategy = await apiRequest<never, Strategy>({ path: `/strategies/${strategyId}`, method: "GET" }).catch(() => null as any);
    } catch {
      strategy = null as any;
    }

    // Choose preview endpoint based on strategy type if available. User strategies use the generic preview path.
    const isUserStrategy = (strategy as any)?.type === "user" || false;
    // Use 500 limit to match market page stocks, and specify asset_type=stock for stocks connection
    const assetTypeParam = isStocksConnection ? '&asset_type=stock' : '';
    const previewPath = isUserStrategy 
      ? `/strategies/${strategyId}/preview?limit=500${assetTypeParam}` 
      : `/strategies/pre-built/${strategyId}/preview?limit=500${assetTypeParam}`;

    try {
      const preview = await apiRequest<never, any>({ path: previewPath, method: "GET" });
      const strategyAny = strategy as any;
      const previewWithParams = {
        assets: Array.isArray(preview) ? preview : (preview?.assets ?? preview?.results ?? []),
        stop_loss_value: strategyAny?.stop_loss_value ?? strategyAny?.stopLossValue ?? null,
        take_profit_value: strategyAny?.take_profit_value ?? strategyAny?.takeProfitValue ?? null,
      } as any;

      // cache preview
      setPreviewCache((c) => ({ ...c, [strategyId]: previewWithParams }));
      setStrategyState((s) => ({ ...s, [strategyId]: "PREVIEW" }));
      setCurrentAppliedStrategyId(strategyId);

      // apply preview to trendingTrades (map preview assets into trades)
      try {
        const mapped = mapBackendToTrades(previewWithParams.assets || []);
        setTrendingTrades(mapped);
      } catch (err) {
        // best-effort
      }
    } catch (err) {
      console.error('Failed to fetch preview for strategy', strategyId, err);
    }
  };

  // --- Pagination / sorting helpers ---
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
  const paginatedTrades = filteredAndSortedTrades.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Orders modal — only fetches /orders/all
  useEffect(() => {
    if (!showPositionsModal) return;
    let cancelled = false;

    const loadOrders = async () => {
      try {
        setOrdersLoading(true);
        setOrdersError(null);
        const tradingApiBase = isStocksConnection ? "/alpaca-trading" : "/binance-trading";

        const ordersParams = new URLSearchParams({ limit: '500' });
        if (ordersPeriod !== 'all' && ordersPeriod !== 'custom') {
          ordersParams.set('period', ordersPeriod);
        }
        if (ordersPeriod === 'custom') {
          if (ordersStartDate) ordersParams.set('startTime', String(new Date(ordersStartDate).getTime()));
          if (ordersEndDate) ordersParams.set('endTime', String(new Date(ordersEndDate + 'T23:59:59').getTime()));
        }

        const ordersResponse = await apiRequest<never, any>({ path: `${tradingApiBase}/orders/all?${ordersParams.toString()}`, method: "GET" });
        if (cancelled) return;

        const normalizedOrders: ModalOrder[] = toArray(ordersResponse).map((o: any) => ({
          orderId: String(o.orderId ?? '—'),
          symbol: String(o.symbol ?? o.asset ?? '—'),
          side: String(o.side ?? '').toUpperCase(),
          type: String(o.type ?? '').toUpperCase(),
          status: normalizeOrderStatus(o.status),
          fillPercent: toNumber(o.fillPercent, 0),
          quantity: toNumber(o.quantity ?? o.origQty, 0),
          filledQuantity: toNumber(o.filledQuantity ?? o.executedQty, 0),
          avgFillPrice: toNumber(o.avgFillPrice ?? o.avgPrice ?? o.price, 0),
          orderPrice: o.orderPrice ?? o.price ?? 0,
          totalValue: toNumber(o.totalValue ?? o.cummulativeQuoteQty, 0),
          stopPrice: o.stopPrice ?? null,
          time: toIso(o.time) ?? '',
          updateTime: toIso(o.updateTime ?? o.time) ?? '',
        }));

        setModalOrders(normalizedOrders);
        setOrdersSummary(ordersResponse?.summary ?? null);
      } catch (err: any) {
        if (!cancelled) setOrdersError(err?.message || "Failed to load orders");
      } finally {
        if (!cancelled) setOrdersLoading(false);
      }
    };

    loadOrders();
    return () => { cancelled = true; };
  }, [showPositionsModal, isStocksConnection, ordersPeriod, ordersStartDate, ordersEndDate]);

  // Leaderboard modal — only fetches /positions + /trade-history
  useEffect(() => {
    if (!showLeaderboardModal) return;
    let cancelled = false;

    const loadLeaderboard = async () => {
      try {
        setLeaderboardLoading(true);
        setLeaderboardError(null);
        const tradingApiBase = isStocksConnection ? "/alpaca-trading" : "/binance-trading";

        const historyParams = new URLSearchParams({ limit: '500' });
        if (tradeHistoryPeriod !== 'all' && tradeHistoryPeriod !== 'custom') {
          historyParams.set('period', tradeHistoryPeriod);
        }
        if (tradeHistoryPeriod === 'custom') {
          if (tradeHistoryStartDate) historyParams.set('startTime', String(new Date(tradeHistoryStartDate).getTime()));
          if (tradeHistoryEndDate) historyParams.set('endTime', String(new Date(tradeHistoryEndDate + 'T23:59:59').getTime()));
        }

        const [positionsResponse, historyResponse] = await Promise.all([
          apiRequest<never, any>({ path: `/exchanges/connections/${connectionId}/positions`, method: "GET", credentials: "include" }),
          apiRequest<never, any>({ path: `${tradingApiBase}/trade-history?${historyParams.toString()}`, method: "GET" }),
        ]);
        if (cancelled) return;

        const normalizedPositions: ModalPosition[] = toArray(positionsResponse).map((p: any) => ({
          symbol: String(p.symbol ?? p.asset ?? '—'),
          quantity: toNumber(p.quantity ?? p.qty, 0),
          avgEntryPrice: toNumber(p.avgEntryPrice ?? p.avg_entry_price ?? p.entryPrice, 0),
          currentPrice: toNumber(p.currentPrice ?? p.current_price, 0),
          marketValue: toNumber(p.marketValue ?? p.market_value, 0),
          totalCost: toNumber(p.totalCost ?? p.total_cost, 0),
          unrealizedPnl: toNumber(p.unrealizedPnl ?? p.totalPnl ?? p.total_pnl, 0),
          unrealizedPnlPercent: toNumber(p.unrealizedPnlPercent ?? p.totalPnlPercent ?? p.total_pnl_percent, 0),
          dailyChangePnl: toNumber(p.dailyChangePnl ?? p.todayPnl ?? p.today_pnl, 0),
          dailyChangePercent: toNumber(p.dailyChangePercent ?? p.todayPnlPercent ?? p.pnlPercent, 0),
          hasRealEntry: !!p.hasRealEntry,
        }));

        const normalizedHistory: ModalTradeHistory[] = toArray(historyResponse).map((t: any) => ({
          orderId: String(t.orderId ?? '—'),
          symbol: String(t.symbol ?? t.asset ?? '—'),
          side: String(t.side ?? '').toUpperCase(),
          type: String(t.type ?? '').toUpperCase(),
          status: String(t.status ?? '').toUpperCase(),
          fillPercent: toNumber(t.fillPercent, 0),
          quantity: toNumber(t.quantity ?? t.origQty, 0),
          filledQuantity: toNumber(t.filledQuantity ?? t.executedQty ?? t.quantity, 0),
          avgPrice: toNumber(t.avgPrice ?? t.avg_price ?? t.price, 0),
          orderPrice: t.orderPrice ?? t.price ?? 0,
          totalValue: toNumber(t.totalValue ?? t.quoteQty, 0),
          totalFee: toNumber(t.totalFee ?? t.commission, 0),
          feeAsset: String(t.feeAsset ?? t.commissionAsset ?? ''),
          time: toIso(t.time ?? t.updateTime ?? t.createdAt) ?? '',
          profitLoss: toNumber(t.profitLoss ?? t.profit_loss ?? t.pnl, 0),
          profitPercent: toNumber(t.profitLossPercent ?? t.profitPercent ?? t.profit_percent, 0),
        }));

        setModalPositions(normalizedPositions);
        setModalTradeHistory(normalizedHistory);
        setModalTradeSummary(historyResponse?.summary ?? null);
      } catch (err: any) {
        if (!cancelled) setLeaderboardError(err?.message || "Failed to load leaderboard data");
      } finally {
        if (!cancelled) setLeaderboardLoading(false);
      }
    };

    loadLeaderboard();
    return () => { cancelled = true; };
  }, [showLeaderboardModal, isStocksConnection, tradeHistoryPeriod, tradeHistoryStartDate, tradeHistoryEndDate]);

  const ordersPending = useMemo(
    () => modalOrders.filter((o) => ["NEW", "PARTIALLY_FILLED", "PENDING", "PENDING_CANCEL"].includes(o.status)),
    [modalOrders],
  );
  const ordersFilled = useMemo(() => modalOrders.filter((o) => o.status === "FILLED"), [modalOrders]);
  const ordersCanceled = useMemo(
    () => modalOrders.filter((o) => ["CANCELED", "EXPIRED", "REJECTED"].includes(o.status)),
    [modalOrders],
  );

  const positionsTabRows = useMemo(() => {
    if (positionsModalTab === "all") return modalOrders;
    if (positionsModalTab === "pending") return ordersPending;
    if (positionsModalTab === "filled") return ordersFilled;
    return ordersCanceled;
  }, [modalOrders, ordersPending, ordersFilled, ordersCanceled, positionsModalTab]);

  const pagedPositionsTabRows = useMemo(
    () => positionsTabRows.slice((positionsModalPage - 1) * PAPER_POS_PER_PAGE, positionsModalPage * PAPER_POS_PER_PAGE),
    [positionsTabRows, positionsModalPage],
  );

  const historyRowsFiltered = useMemo(() => {
    let rows = [...modalTradeHistory];
    if (historyFilter === "profitable") rows = rows.filter((r) => r.profitLoss > 0);
    if (historyFilter === "loss") rows = rows.filter((r) => r.profitLoss < 0);
    if (historyFilter === "recent") rows = rows.sort((a, b) => new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime());
    if (historyFilter === "p&l") rows = rows.sort((a, b) => b.profitLoss - a.profitLoss);
    return rows;
  }, [modalTradeHistory, historyFilter]);

  const pagedHistoryRows = useMemo(
    () => historyRowsFiltered.slice((leaderboardHistoryPage - 1) * LEADERBOARD_ITEMS_PER_PAGE, leaderboardHistoryPage * LEADERBOARD_ITEMS_PER_PAGE),
    [historyRowsFiltered, leaderboardHistoryPage],
  );

  const sortedLeaderboardPositions = useMemo(
    () => {
      const stables = new Set(['USDT', 'USDC', 'BUSD', 'TUSD', 'USDP', 'DAI', 'FDUSD']);
      return [...modalPositions].sort((a, b) => {
        // Stablecoins first (USDT at very top)
        const aStable = stables.has(a.symbol) ? (a.symbol === 'USDT' ? -2 : -1) : 0;
        const bStable = stables.has(b.symbol) ? (b.symbol === 'USDT' ? -2 : -1) : 0;
        if (aStable !== bStable) return aStable - bStable;
        // Then sort by P&L descending
        return b.unrealizedPnl - a.unrealizedPnl;
      });
    },
    [modalPositions],
  );

  const pagedLeaderboardPositions = useMemo(
    () => sortedLeaderboardPositions.slice((leaderboardPositionsPage - 1) * LEADERBOARD_ITEMS_PER_PAGE, leaderboardPositionsPage * LEADERBOARD_ITEMS_PER_PAGE),
    [sortedLeaderboardPositions, leaderboardPositionsPage],
  );

  const leaderboardTotalPnl = useMemo(
    () => modalTradeHistory.reduce((sum, row) => sum + row.profitLoss, 0),
    [modalTradeHistory],
  );
  const sellTradeCount = modalTradeHistory.filter(t => t.side === 'SELL').length;
  const leaderboardAvgProfit = sellTradeCount > 0 ? leaderboardTotalPnl / sellTradeCount : 0;
  const leaderboardUpPositions = useMemo(() => modalPositions.filter((p) => p.unrealizedPnl > 0).length, [modalPositions]);
  const leaderboardDownPositions = useMemo(() => modalPositions.filter((p) => p.unrealizedPnl < 0).length, [modalPositions]);
  const leaderboardUnrealizedTotal = useMemo(
    () => modalPositions.reduce((sum, p) => sum + p.unrealizedPnl, 0),
    [modalPositions],
  );

  useEffect(() => {
    setPositionsModalPage(1);
  }, [positionsModalTab]);

  useEffect(() => {
    setLeaderboardHistoryPage(1);
  }, [historyFilter]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(positionsTabRows.length / PAPER_POS_PER_PAGE));
    if (positionsModalPage > maxPage) setPositionsModalPage(maxPage);
  }, [positionsTabRows.length, positionsModalPage]);

  useEffect(() => {
    const maxHistoryPage = Math.max(1, Math.ceil(historyRowsFiltered.length / LEADERBOARD_ITEMS_PER_PAGE));
    if (leaderboardHistoryPage > maxHistoryPage) setLeaderboardHistoryPage(maxHistoryPage);
  }, [historyRowsFiltered.length, leaderboardHistoryPage]);

  useEffect(() => {
    const maxPositionsPage = Math.max(1, Math.ceil(modalPositions.length / LEADERBOARD_ITEMS_PER_PAGE));
    if (leaderboardPositionsPage > maxPositionsPage) setLeaderboardPositionsPage(maxPositionsPage);
  }, [modalPositions.length, leaderboardPositionsPage]);

  useEffect(() => { setCurrentPage(1); }, [timeFilter, sortBy, currentTrades.length, activeTab]);

  // --- View Trade handler ---
  const handleViewTrade = async (index: number) => {
    setSelectedTradeIndex(index);
    setShowTradeOverlay(true);
  };

  const handleAutoTrade = (trade: any) => {
    setSelectedSignal(trade);
    setShowAutoTradeModal(true);
  };

  const handleAutoTradeSuccess = () => {
    setShowAutoTradeModal(false);
    setSelectedSignal(null);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
    if (currentStrategy) fetchStrategySignals(currentStrategy.strategy_id);
  };

  // Show loading while checking connection (skip when admin pool mode with connection override)
  if (!vcPoolId && isCheckingConnection) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700/30 border-t-[var(--primary)]"></div>
      </div>
    );
  }

  // Top Trades is PRO and ELITE only (skip when admin VC Pool mode)
  if (!vcPoolId && !currentSubscription) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700/30 border-t-[var(--primary)]"></div>
      </div>
    );
  }
  if (!canAccessTopTrades) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] rounded-2xl bg-gradient-to-br from-white/[0.03] to-transparent backdrop-blur p-8">
        <div className="text-center max-w-md">
          <h3 className="text-lg font-semibold text-white mb-2">Top Trades is for PRO and ELITE</h3>
          <p className="text-sm text-slate-400 mb-6">
            Generate stock signals and view trading opportunities. Upgrade to access Top Trades.
          </p>
          <Link
            href="/dashboard/settings/subscription"
            className="inline-block px-6 py-2.5 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors text-sm font-semibold"
          >
            Upgrade Now
          </Link>
        </div>
      </div>
    );
  }

  // --- UI Rendering (reuse existing layout and style) ---
  const content = (
    <div className="space-y-3 sm:space-y-4 md:space-y-6 pb-8 p-4 sm:p-0">
      {/* Stocks Info Banner removed per user request */}

      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs sm:text-sm text-slate-400">
            {isStocksConnection 
              ? "AI-powered trading signals for your stock portfolio"
              : "Track your best performing trades and strategies"
            }
          </p>
        </div>
        <div className="flex flex-wrap gap-1 sm:gap-2 rounded-lg bg-[--color-surface]/60 p-1 items-center">
          <Link
            href="/dashboard/custom-strategies-trading?mode=live&from=top-trades"
            className="rounded-md px-2 sm:px-4 py-1.5 sm:py-2 text-xs font-medium transition-all bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] hover:opacity-90 shadow-lg shadow-[rgba(var(--primary-rgb),0.3)]/30 whitespace-nowrap flex items-center gap-1.5 text-white"
            title="Trade with your custom strategies"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Custom Strategy</span>
          </Link>
          <button
            onClick={() => setShowPositionsModal(true)}
            className="rounded-md px-2 sm:px-4 py-1.5 sm:py-2 text-xs font-medium transition-all bg-blue-600/60 hover:bg-blue-600/80 border border-blue-500/50 hover:border-blue-400 whitespace-nowrap flex items-center gap-1.5 text-white"
            title="View your orders"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Orders</span>
          </button>
          <button
            onClick={() => setShowLeaderboardModal(true)}
            className="rounded-md px-2 sm:px-4 py-1.5 sm:py-2 text-xs font-medium transition-all bg-slate-700/40 hover:bg-slate-700/60 border border-slate-600/50 hover:border-slate-500 whitespace-nowrap flex items-center gap-1.5 text-slate-200 hover:text-white"
            title="View leaderboard"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Leaderboard</span>
          </button>
        </div>
      </div>

      {/* Paper Trading - Open Positions & Leaderboard (dummy data) */}
      {effectivePaperMock && (
        <div className="rounded-lg sm:rounded-xl bg-gradient-to-br from-white/[0.03] to-transparent p-4 sm:p-6 backdrop-blur grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm sm:text-base font-semibold text-white">Paper Trading — Open Positions</h3>
              <div className="text-xs text-slate-400">{paperPositions.length} positions</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="text-slate-400 text-[10px] sm:text-xs text-left">
                    <th className="py-2">Symbol</th>
                    <th className="py-2">Qty</th>
                    <th className="py-2">Value</th>
                    <th className="py-2">Entry</th>
                    <th className="py-2">P/L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[--color-border]">
                  {pagedPaperPositions.map((p, i) => (
                    <tr key={p.symbol + i} className="hover:bg-[--color-surface]/40">
                      <td className="py-2 font-medium text-white">{p.symbol}</td>
                      <td className="py-2 text-slate-300">{p.quantity}</td>
                      <td className="py-2 text-slate-300">{formatCurrency(p.currentPrice * p.quantity)}</td>
                      <td className="py-2 text-slate-300">{formatCurrency(p.entryPrice)}</td>
                      <td className={`py-2 font-medium ${p.unrealizedPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(p.unrealizedPnl)} • {formatPercent(p.pnlPercent)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between pt-3">
              <div className="text-xs text-slate-400">Showing {(paperPositionsPage - 1) * PAPER_POS_PER_PAGE + 1} - {Math.min(paperPositionsPage * PAPER_POS_PER_PAGE, paperPositions.length)} of {paperPositions.length}</div>
              <div className="flex items-center gap-2">
                <button onClick={() => setPaperPositionsPage(p => Math.max(1, p - 1))} disabled={paperPositionsPage === 1} className={`px-3 py-1 rounded-md text-xs ${paperPositionsPage === 1 ? 'opacity-50' : 'bg-[--color-surface]/60'}`}>Prev</button>
                <div className="text-xs text-slate-400">Page {paperPositionsPage} / {paperPositionsTotalPages}</div>
                <button onClick={() => setPaperPositionsPage(p => Math.min(paperPositionsTotalPages, p + 1))} disabled={paperPositionsPage === paperPositionsTotalPages} className={`px-3 py-1 rounded-md text-xs ${paperPositionsPage === paperPositionsTotalPages ? 'opacity-50' : 'bg-[--color-surface]/60'}`}>Next</button>
              </div>
            </div>
          </div>

          <div className="md:col-span-1">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-semibold text-white">Leaderboard</h3>
              <div className="text-xs text-slate-400">Top traders</div>
            </div>
            <div className="space-y-2">
              {paperTradingDummy.leaderboard.map((l, idx) => (
                <div key={l.user + idx} className="flex items-center justify-between p-2 rounded-md bg-[--color-surface]/30">
                  <div>
                    <div className="text-sm font-medium text-white">{l.user}</div>
                    <div className="text-xs text-slate-400">{l.trades} trades • {l.winrate}% winrate</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-white">{formatCurrency(l.profit)}</div>
                    <div className="text-xs text-slate-400">Profit</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Strategy Tabs */}
      {loadingPreBuilt ? (
        <div className="rounded-lg sm:rounded-xl bg-gradient-to-br from-white/[0.02] to-transparent p-4 sm:p-6 text-center">
          <p className="text-xs sm:text-sm text-slate-400">Loading strategies...</p>
        </div>
      ) : preBuiltError ? (
        <div className="rounded-lg sm:rounded-xl bg-red-600/10 p-4 sm:p-6 text-center border border-red-500/20">
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-full bg-red-600/20 p-3">
              <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.734 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-red-300 mb-1">Failed to load strategies</p>
              <p className="text-xs text-red-400/70">{preBuiltError}</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 px-3 py-1.5 text-xs text-red-300 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      ) : preBuiltStrategies.length > 0 ? (
        <div className="space-y-3 sm:space-y-4">
          {/* Strategy Tabs */}
          <div className="rounded-lg sm:rounded-xl bg-gradient-to-br from-white/[0.07] to-transparent p-2 sm:p-3 backdrop-blur overflow-x-auto smooth-scroll-horizontal">
            <div className="flex gap-1 sm:gap-2 min-w-max">
              {preBuiltStrategies.map((strategy, idx) => {
                const strategyId = strategy.strategy_id;
                const isLoading = loadingSignals[strategyId];
                const error = signalsError[strategyId];
                const signalCount = strategySignals[strategyId]?.length || 0;
                
                return (
                  <button
                    key={strategyId}
                    onClick={() => setActiveTab(idx)}
                    className={`px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-all rounded-lg whitespace-nowrap ${
                      activeTab === idx
                        ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] text-white shadow-lg shadow-[rgba(var(--primary-rgb),0.3)]/30'
                        : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{strategy.name}</span>
                      {isLoading && <span className="text-xs">⏳</span>}
                      {!isLoading && !error && signalCount > 0 && (
                        <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded">{signalCount}</span>
                      )}
                      {error && <span className="text-xs">⚠️</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Strategy Description Card */}
          {currentStrategy && (
            <div className="rounded-lg sm:rounded-xl bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur border border-[var(--primary)]/20 p-4 sm:p-5">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-2">{currentStrategy.name}</h3>
              <p className="text-xs sm:text-sm text-slate-300 mb-4 leading-relaxed">{currentStrategy.description || "No description available"}</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-[--color-surface]/50 p-3">
                  <span className="text-xs text-slate-400 block mb-1">Risk Level</span>
                  <span className="text-sm sm:text-base font-semibold text-white uppercase">{currentStrategy.risk_level || '—'}</span>
                </div>
                <div className="rounded-lg bg-[--color-surface]/50 p-3">
                  <span className="text-xs text-slate-400 block mb-1">Stop Loss</span>
                  <span className="text-sm sm:text-base font-semibold text-white">{currentStrategy.stop_loss_value || '—'}%</span>
                </div>
                <div className="rounded-lg bg-[--color-surface]/50 p-3">
                  <span className="text-xs text-slate-400 block mb-1">Take Profit</span>
                  <span className="text-sm sm:text-base font-semibold text-white">{currentStrategy.take_profit_value || '—'}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg sm:rounded-xl bg-gradient-to-br from-white/[0.05] to-transparent p-6 sm:p-8 text-center border border-white/10">
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-slate-800/50 p-4">
              <svg className="h-8 w-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-slate-300 mb-2">No trading strategies available</p>
              <p className="text-xs text-slate-500">Connect an exchange to view trading signals and strategies</p>
            </div>
            <Link 
              href="/dashboard/settings/exchange-configuration" 
              className="rounded-lg bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
            >
              Configure Exchange
            </Link>
          </div>
        </div>
      )}

      {/* Signals/Trades List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            {currentStrategy ? `${currentStrategy.name} Signals` : 'Trading Signals'}
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "profit" | "volume" | "winrate")}
              className="rounded-lg  bg-[--color-surface] px-3 py-1.5 text-xs font-medium text-white focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
            >
              <option value="profit">24h Change</option>
              <option value="volume">Volume</option>
            </select>
          </div>
        </div>

        {currentStrategy && loadingSignals[currentStrategy.strategy_id] ? (
          <div className="rounded-2xl bg-gradient-to-br from-white/[0.07] to-transparent p-8 text-center backdrop-blur">
            <p className="text-sm text-slate-400">Loading signals...</p>
          </div>
        ) : currentStrategy && signalsError[currentStrategy.strategy_id] ? (
          <div className="rounded-2xl bg-red-600/10 p-8 text-center">
            <p className="text-sm text-red-300">Failed to load signals: {signalsError[currentStrategy.strategy_id]}</p>
            <button
              onClick={() => fetchStrategySignals(currentStrategy.strategy_id)}
              className="mt-4 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] px-4 py-2 text-sm font-medium text-white"
            >
              Retry
            </button>
          </div>
        ) : filteredAndSortedTrades.length > 0 ? (
          <div>
            <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
              {paginatedTrades.map((trade, index) => (
                <div key={trade.id} className="rounded-lg sm:rounded-2xl bg-gradient-to-br from-white/[0.07] to-transparent p-4 sm:p-6 backdrop-blur">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                      <span className={`rounded-lg px-3 py-1 text-sm font-semibold text-white ${trade.type === "BUY" ? "bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)]" : "bg-gradient-to-r from-red-500 to-red-600"}`}>
                        {trade.type}
                      </span>
                      <span className="text-sm font-medium text-white">{trade.pair}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs text-slate-300 ${trade.confidence === "HIGH" ? "bg-slate-700" : trade.confidence === "MEDIUM" ? "bg-slate-600" : "bg-slate-500"}`}>
                        {trade.confidence}
                      </span>
                      
                      {/* NEW: Trend Direction Badge */}
                      {(() => {
                        const trendBadge = getTrendDirectionBadge(trade.trend_direction);
                        return (
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${trendBadge.color}`}>
                            #{trendBadge.number} {trendBadge.label}
                          </span>
                        );
                      })()}
                      
                      {/* NEW: Volume Status Badge */}
                      {(() => {
                        const volBadge = getVolumeStatusBadge(trade.volume_status);
                        return (
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${volBadge.color}`}>
                            #{volBadge.number} {volBadge.label}
                          </span>
                        );
                      })()}
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs text-slate-400">Ext. {trade.ext ? formatCurrency(trade.ext) : '—'}</p>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-400">Entry</span>
                        <span className="font-medium text-white">{formatCurrency(trade.entryPrice ?? trade.entry)}</span>
                        <span className="text-slate-500">&gt;</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-400">Stop Loss</span>
                        <span className="font-medium text-white">{trade.stopLoss && trade.stopLoss !== '—' ? `${formatPercent(trade.stopLoss)}${trade.stopLossPrice && trade.stopLossPrice !== '—' ? ` (${formatCurrency(trade.stopLossPrice)})` : ''}` : '—'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-400">Take Profit</span>
                        <span className="font-medium text-white">{trade.takeProfit1 && trade.takeProfit1 !== '—' ? `${formatPercent(trade.takeProfit1)}${trade.takeProfitPrice && trade.takeProfitPrice !== '—' ? ` (${formatCurrency(trade.takeProfitPrice)})` : ''}` : '—'}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>${trade.progressMin}</span>
                        <span>${trade.progressMax}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                        <div className={`h-full bg-gradient-to-r ${trade.type === "BUY" ? "from-green-500 to-emerald-500" : "from-red-500 to-red-600"}`} style={{ width: `${trade.progressValue}%` }} />
                      </div>
                    </div>

                      <div className="relative flex items-center gap-4 text-xs pt-3">
                        <div className="absolute top-0 left-0 right-0 h-[1px] bg-[var(--primary)]/30"></div>
                        <div><span className="text-slate-400">24h Change: </span><span className={`font-medium ${Number(trade.profitValue ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>{trade.profitValue ? formatPercent(trade.profitValue) : trade.profit ?? '—'}</span></div>
                        <div><span className="text-slate-400">Volume: </span><span className="font-medium text-white">{formatNumberCompact(trade.volumeValue ?? trade.volume)}</span></div>
                      </div>
                      
                      {/* NEW: Trend Score and Score Change */}
                      <div className="relative flex items-center gap-4 text-xs pt-2">
                        <div className="absolute top-0 left-0 right-0 h-[1px] bg-slate-700/50"></div>
                        <div><span className="text-slate-400">Trend Score: </span><span className="font-medium text-cyan-400">{trade.trend_score?.toFixed(2) ?? '0.00'}</span></div>
                        {trade.score_change !== undefined && trade.score_change !== 0 && (
                          <div>
                            <span className="text-slate-400">Change: </span>
                            <span className={`font-medium ${trade.score_change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {trade.score_change > 0 ? '+' : ''}{trade.score_change?.toFixed(2) ?? '0.00'} pts
                            </span>
                          </div>
                        )}
                        {trade.volume_ratio !== undefined && trade.volume_ratio !== 1 && (
                          <div>
                            <span className="text-slate-400">Vol. Ratio: </span>
                            <span className="font-medium text-slate-300">{trade.volume_ratio?.toFixed(2)}x</span>
                          </div>
                        )}
                      </div>

                    {/* AI Insights Section */}
                    {currentStrategy && (() => {
                      const assetId = (trade as any).assetId || (trade as any).asset_id;
                      const strategyInsights = aiInsights[currentStrategy.strategy_id] || {};
                      const insightData = assetId ? strategyInsights[assetId] : null;
                      const hasInsight = (trade as any).hasAiInsight || !!insightData;
                      const key = `${currentStrategy.strategy_id}-${assetId}`;
                      const loading = loadingInsight[key];

                      // Format timestamp
                      const formatTimeAgo = (timestamp: number) => {
                        const minutes = Math.floor((Date.now() - timestamp) / 60000);
                        if (minutes < 1) return 'just now';
                        if (minutes < 60) return `${minutes}m ago`;
                        const hours = Math.floor(minutes / 60);
                        if (hours < 24) return `${hours}h ago`;
                        const days = Math.floor(hours / 24);
                        return `${days}d ago`;
                      };

                      return (
                        <div className="relative pt-3 space-y-2">
                          <div className="absolute top-0 left-0 right-0 h-[1px] bg-[var(--primary)]/30"></div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-[var(--primary)]" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M13 7H7v6h6V7z" />
                                <path fillRule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z" clipRule="evenodd" />
                              </svg>
                              <span className="text-xs font-semibold text-[var(--primary)]">AI Insight</span>
                            </div>
                            {hasInsight && insightData && (
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-500">{formatTimeAgo(insightData.timestamp)}</span>
                                <button
                                  onClick={() => handleGenerateInsight(currentStrategy.strategy_id, assetId)}
                                  disabled={loading}
                                  className="text-slate-400 hover:text-[var(--primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Refresh insight"
                                >
                                  <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </div>
                          
                          {hasInsight && insightData ? (
                            <div className="rounded-lg bg-gradient-to-br from-[var(--primary)]/10 to-[var(--primary-light)]/5 p-3 text-xs text-slate-300 leading-relaxed border border-[var(--primary)]/20">
                              {insightData.text}
                            </div>
                          ) : assetId ? (
                            <button
                              onClick={() => handleGenerateInsight(currentStrategy.strategy_id, assetId)}
                              disabled={loading}
                              className="w-full rounded-lg bg-gradient-to-r from-slate-700/50 to-slate-600/50 px-3 py-2 text-xs font-medium text-slate-300 transition-all hover:from-[var(--primary)]/20 hover:to-[var(--primary-light)]/20 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed border border-slate-600/30 hover:border-[var(--primary)]/50"
                            >
                              {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                  </svg>
                                  Generating insight...
                                </span>
                              ) : (
                                'Generate AI Insight'
                              )}
                            </button>
                          ) : null}
                        </div>
                      );
                    })()}

                    <div className="flex gap-2 pt-2">
                      {connectionId && (
                        <button
                          onClick={() => handleAutoTrade(trade)}
                          className="flex-1 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[rgba(var(--primary-rgb),0.3)]/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-[rgba(var(--primary-rgb),0.3)]/40"
                        >
                          Auto Trade
                        </button>
                      )}
                      <button
                        onClick={() => handleViewTrade(index)}
                        className={`rounded-xl bg-[--color-surface] px-4 py-2.5 text-sm font-medium text-slate-300 transition-all duration-300 hover:text-white ${isStocksConnection ? 'flex-1' : ''}`}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-3">
                <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="rounded-md bg-[--color-surface] px-3 py-1 text-xs text-slate-300 disabled:opacity-50">Prev</button>
                <div className="text-xs text-slate-400">Page {currentPage} of {totalPages}</div>
                <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="rounded-md bg-[--color-surface] px-3 py-1 text-xs text-slate-300 disabled:opacity-50">Next</button>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl  bg-gradient-to-br from-white/[0.07] to-transparent p-8 text-center backdrop-blur shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(var(--primary-rgb),0.08),0_0_30px_rgba(var(--primary-light-rgb),0.06)]">
            <p className="text-sm text-slate-400">
              {currentStrategy 
                ? `No signals available for ${currentStrategy.name}. ${isStocksConnection ? 'Stock signals are generated every 10 minutes during market hours.' : 'Signals are generated every 10 minutes.'}`
                : 'No signals found for the selected time period'}
            </p>
          </div>
        )}
      </div>

      {/* Trade Details Overlay */}
      {showTradeOverlay && filteredAndSortedTrades[selectedTradeIndex] && (
        <div className="fixed inset-0 z-[400] isolate flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowTradeOverlay(false)}>
          <div className="relative mx-4 w-full max-w-4xl max-h-[700px] rounded-2xl  bg-gradient-to-br from-white/[0.15] to-white/[0.05] p-4 shadow-2xl shadow-black/50 backdrop-blur" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Trade Details</h2>
              <button onClick={() => setShowTradeOverlay(false)} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-[--color-surface] hover:text-white" aria-label="Close">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className={`rounded-lg px-4 py-2 text-base font-semibold text-white ${filteredAndSortedTrades[selectedTradeIndex].type === "BUY" ? "bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)]" : "bg-gradient-to-r from-red-500 to-red-600"}`}>
                  {filteredAndSortedTrades[selectedTradeIndex].type}
                </span>
                <span className="text-lg font-medium text-white">{filteredAndSortedTrades[selectedTradeIndex].pair}</span>
                <span className="rounded-full bg-slate-700 px-3 py-1 text-sm text-slate-300">{filteredAndSortedTrades[selectedTradeIndex].confidence}</span>
              </div>

              {/* Two-column layout for details and signal */}
              <div className="grid grid-cols-2 gap-4">
                {/* Left column - Trade Details */}
                <div className="space-y-4 rounded-xl bg-gradient-to-br from-white/[0.12] to-white/[0.03] p-4">
                  <div className="flex items-center justify-between"><span className="text-sm text-slate-400">Entry</span><span className="text-base font-medium text-white">{formatCurrency(filteredAndSortedTrades[selectedTradeIndex].entryPrice ?? filteredAndSortedTrades[selectedTradeIndex].entry)}</span></div>
                  <div className="flex items-center justify-between"><span className="text-sm text-slate-400">Stop-Loss</span><span className="text-base font-medium text-white">{filteredAndSortedTrades[selectedTradeIndex].stopLoss && filteredAndSortedTrades[selectedTradeIndex].stopLoss !== '—' ? `${formatPercent(filteredAndSortedTrades[selectedTradeIndex].stopLoss)}${filteredAndSortedTrades[selectedTradeIndex].stopLossPrice && filteredAndSortedTrades[selectedTradeIndex].stopLossPrice !== '—' ? ` (${formatCurrency(filteredAndSortedTrades[selectedTradeIndex].stopLossPrice)})` : ''}` : '—'}</span></div>
                  <div className="flex items-center justify-between"><span className="text-sm text-slate-400">Take Profit 1</span><span className="text-base font-medium text-white">{filteredAndSortedTrades[selectedTradeIndex].takeProfit1 && filteredAndSortedTrades[selectedTradeIndex].takeProfit1 !== '—' ? `${formatPercent(filteredAndSortedTrades[selectedTradeIndex].takeProfit1)}${filteredAndSortedTrades[selectedTradeIndex].takeProfitPrice && filteredAndSortedTrades[selectedTradeIndex].takeProfitPrice !== '—' ? ` (${formatCurrency(filteredAndSortedTrades[selectedTradeIndex].takeProfitPrice)})` : ''}` : '—'}</span></div>
                  <div className="flex items-center justify-between"><span className="text-sm text-slate-400">Additional Info</span><span className="text-base font-medium text-slate-300">{filteredAndSortedTrades[selectedTradeIndex].target}</span></div>
                </div>

                {/* Right column - Signal Details */}
                {(() => {
                  const trade = filteredAndSortedTrades[selectedTradeIndex];
                  const signal = currentSignals.find((s: any) => {
                    const assetId = s.asset?.asset_id || s.asset_id;
                    return assetId === trade.assetId;
                  });
                  
                  if (!signal) return null;
                  
                  return (
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-white">Signal Details</h3>
                      <div className="rounded-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-4 text-xs text-slate-300">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Action:</span>
                            <span className="font-medium text-white">{signal.action || 'HOLD'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Final Score:</span>
                            <span className="font-medium text-white">{signal.final_score ?? '—'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Confidence:</span>
                            <span className="font-medium text-white">{signal.confidence ?? '—'}</span>
                          </div>
                          {signal.explanations && signal.explanations.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-700/50">
                              <p className="text-xs text-slate-400 mb-2">Explanation:</p>
                              <p className="text-sm text-slate-200">{signal.explanations[0].text}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* AI Insights / Explanation below - full width */}
              {(() => {
                const trade = filteredAndSortedTrades[selectedTradeIndex];
                const assetId = trade.assetId;
                const strategyInsights = currentStrategy ? aiInsights[currentStrategy.strategy_id] || {} : {};
                const aiInsightData = assetId ? strategyInsights[assetId] : null;
                
                // Check if we have AI insight or default insights
                const hasAiInsight = !!aiInsightData?.text;
                const hasDefaultInsights = trade.insights && trade.insights.length > 0 && 
                  !trade.insights.every((i: string) => i === 'No explanation available');
                
                return (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-white">AI Insight</h3>
                    
                    {hasAiInsight ? (
                      <div className="rounded-lg bg-gradient-to-br from-[var(--primary)]/10 to-[var(--primary-light)]/5 p-4 border border-[var(--primary)]/20">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-4 h-4 text-[var(--primary)]" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13 7H7v6h6V7z" />
                            <path fillRule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z" clipRule="evenodd" />
                          </svg>
                          <span className="text-xs font-semibold text-[var(--primary)]">AI Analysis</span>
                        </div>
                        <p className="text-sm text-slate-200 leading-relaxed">{aiInsightData.text}</p>
                      </div>
                    ) : hasDefaultInsights ? (
                      <>
                        {trade.insights.map((insight: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-2">
                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-green-400" />
                            <p className="text-sm text-slate-300">{insight}</p>
                          </div>
                        ))}
                      </>
                    ) : (
                      <p className="text-sm text-slate-400 italic">No AI insight available yet. Generate one from the trade card.</p>
                    )}
                  </div>
                );
              })()}

            </div>
          </div>
        </div>
      )}

      {/* Create Custom Strategy Modal - Works for both crypto and stocks */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl bg-[--color-surface] p-6 text-slate-100 ring-1 ring-white/5 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Create Custom {isStocksConnection ? 'Stock' : 'Crypto'} Strategy</h3>
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
                        description: createDescription || `Created from Top Trades UI for ${isStocksConnection ? 'stocks' : 'crypto'}`,
                        risk_level: createRiskLevel,
                        // Use 'field' for new API format
                        entry_rules: [{ field: "final_score", operator: ">", value: 0.25 }],
                        exit_rules: [{ field: "final_score", operator: "<", value: -0.15 }],
                        indicators: [],
                        stop_loss_value: stopLossNum,
                        take_profit_value: takeProfitNum,
                        target_assets: [],
                        is_active: true,
                      };

                      // Use correct endpoint based on connection type
                      const endpoint = isStocksConnection ? "/strategies/custom/stocks" : "/strategies/custom/crypto";
                      const created = await apiRequest<typeof dto, any>({ path: endpoint, method: "POST", body: dto });
                      setPreBuiltStrategies((prev) => [created, ...prev]);
                      setShowCreateModal(false);
                      // apply preview automatically
                      if (created?.strategy_id) await previewStrategy(created.strategy_id);
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
                  {creating ? "Creating..." : "Create & Preview"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Crypto Auto Trade: uses user's Binance/Bybit connection (or admin pool trade) */}
      {showAutoTradeModal && selectedSignal && !isStocksConnection && (connectionId || vcPoolId) && (
        <ExchangeAutoTradeModal
          connectionId={connectionId ?? ""}
          signal={selectedSignal}
          onClose={() => { setShowAutoTradeModal(false); setSelectedSignal(null); }}
          onSuccess={handleAutoTradeSuccess}
          strategy={currentStrategy ?? undefined}
        />
      )}

      {/* Stocks Auto Trade: uses user's Alpaca connection */}
      {showAutoTradeModal && selectedSignal && isStocksConnection && connectionId && (
        <StockExchangeAutoTradeModal
          connectionId={connectionId}
          signal={selectedSignal}
          onClose={() => { setShowAutoTradeModal(false); setSelectedSignal(null); }}
          onSuccess={handleAutoTradeSuccess}
          strategy={currentStrategy ?? undefined}
        />
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-8 right-8 z-[10000] animate-fade-in rounded-lg bg-green-600 px-6 py-3 text-white shadow-lg">
          Trade executed successfully!
        </div>
      )}

      {/* Positions Modal */}
      {showPositionsModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl flex items-center justify-center z-[10000] p-4">
          <div className="bg-[--color-surface] rounded-lg sm:rounded-xl max-w-6xl w-full h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="flex-shrink-0 bg-[--color-surface] border-b border-slate-700 px-4 sm:px-6 py-3 flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-white">Order History</h2>
                <p className="text-xs text-slate-400">
                  {isStocksConnection ? "View all your Alpaca stock orders" : "View all your Binance testnet orders"}
                </p>
              </div>
              <button
                onClick={() => { setShowPositionsModal(false); setPositionsModalPage(1); setPositionsModalTab("all"); }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs + Filters */}
            <div className="flex-shrink-0 border-b border-slate-700 px-4 sm:px-6 py-2 space-y-2 bg-[--color-surface]/95 backdrop-blur">
              {/* Summary Stats */}
              <div className="grid grid-cols-4 gap-2">
                <div className="rounded-lg border border-slate-700 bg-[--color-surface]/70 px-3 py-2 text-center">
                  <div className="text-slate-400 text-xs">Total Orders</div>
                  <div className="text-lg font-bold text-white">{ordersSummary?.totalOrders ?? modalOrders.length}</div>
                </div>
                <div className="rounded-lg border border-slate-700 bg-[--color-surface]/70 px-3 py-2 text-center">
                  <div className="text-slate-400 text-xs">Filled</div>
                  <div className="text-lg font-bold text-green-400">{ordersSummary?.filledOrders ?? ordersFilled.length}</div>
                </div>
                <div className="rounded-lg border border-slate-700 bg-[--color-surface]/70 px-3 py-2 text-center">
                  <div className="text-slate-400 text-xs">Canceled</div>
                  <div className="text-lg font-bold text-red-400">{ordersSummary?.canceledOrders ?? ordersCanceled.length}</div>
                </div>
                <div className="rounded-lg border border-slate-700 bg-[--color-surface]/70 px-3 py-2 text-center">
                  <div className="text-slate-400 text-xs">Pending</div>
                  <div className="text-lg font-bold text-blue-400">{ordersSummary?.pendingOrders ?? ordersPending.length}</div>
                </div>
              </div>

              {/* Status + Period filters */}
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex gap-1.5 overflow-x-auto">
                  {(["all", "filled", "pending", "canceled"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => { setPositionsModalTab(tab); setPositionsModalPage(1); }}
                      className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap capitalize transition-all ${
                        positionsModalTab === tab
                          ? "text-white bg-gradient-to-r from-[#fc4f02] to-[#fda300]"
                          : "text-slate-400 hover:text-white bg-slate-700/50"
                      }`}
                    >
                      {tab === "all" ? `All (${modalOrders.length})` : tab === "filled" ? `Filled (${ordersFilled.length})` : tab === "pending" ? `Pending (${ordersPending.length})` : `Canceled (${ordersCanceled.length})`}
                    </button>
                  ))}
                </div>

                <div className="h-4 w-px bg-slate-700" />

                <div className="flex gap-1.5 overflow-x-auto">
                  {([["all", "All Time"], ["1d", "1D"], ["1w", "1W"], ["1m", "1M"], ["6m", "6M"], ["custom", "Custom"]] as const).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => { setOrdersPeriod(key as any); setPositionsModalPage(1); }}
                      className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-all ${
                        ordersPeriod === key
                          ? "text-white bg-gradient-to-r from-[#fc4f02] to-[#fda300]"
                          : "text-slate-400 hover:text-white bg-slate-700/50"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom date range */}
              {ordersPeriod === "custom" && (
                <div className="flex items-center gap-2">
                  <input type="date" value={ordersStartDate} onChange={(e) => setOrdersStartDate(e.target.value)}
                    className="px-2 py-1 text-xs rounded-md bg-slate-700/50 border border-slate-600 text-white focus:outline-none focus:border-[#fc4f02]" />
                  <span className="text-xs text-slate-500">to</span>
                  <input type="date" value={ordersEndDate} onChange={(e) => setOrdersEndDate(e.target.value)}
                    className="px-2 py-1 text-xs rounded-md bg-slate-700/50 border border-slate-600 text-white focus:outline-none focus:border-[#fc4f02]" />
                </div>
              )}
            </div>

            <div className="flex-1 min-h-0 flex flex-col">
              {/* Scrollable: Orders Table */}
              <div className="flex-1 overflow-y-auto">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-[--color-surface] z-10">
                      <tr className="text-slate-400 text-[10px] text-left border-b border-slate-700">
                        <th className="py-2.5 px-4 font-medium">Symbol</th>
                        <th className="py-2.5 px-3 font-medium">Side</th>
                        <th className="py-2.5 px-3 font-medium">Type</th>
                        <th className="py-2.5 px-3 font-medium">Qty (Filled/Total)</th>
                        <th className="py-2.5 px-3 font-medium">Avg Price</th>
                        <th className="py-2.5 px-3 font-medium">Total</th>
                        <th className="py-2.5 px-3 font-medium">Status</th>
                        <th className="py-2.5 px-3 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {ordersLoading && (
                        <tr><td colSpan={8} className="h-[60vh]">
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#fc4f02] border-r-transparent mb-3"></div>
                              <p className="text-sm text-slate-400">Loading orders...</p>
                            </div>
                          </div>
                        </td></tr>
                      )}
                      {ordersError && (
                        <tr><td colSpan={8} className="h-[60vh]">
                          <div className="flex items-center justify-center h-full">
                            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{ordersError}</div>
                          </div>
                        </td></tr>
                      )}
                      {pagedPositionsTabRows.map((order, i) => (
                        <tr key={`${order.orderId}-${i}`} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-2.5 px-4 font-semibold text-white">{order.symbol}</td>
                          <td className="py-2.5 px-3">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              order.side === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                            }`}>{order.side}</span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-300">
                            {order.type === 'MARKET' ? 'Market' : order.type === 'LIMIT' ? 'Limit' : order.type === 'STOP_LOSS_LIMIT' ? 'Stop Loss' : order.type === 'TAKE_PROFIT_LIMIT' ? 'Take Profit' : order.type || '—'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-300">
                            {formatQuantity(order.filledQuantity)} / {formatQuantity(order.quantity)}
                          </td>
                          <td className="py-2.5 px-3 text-slate-300">
                            {order.status === 'FILLED' && order.avgFillPrice > 0 ? formatCurrency(order.avgFillPrice) : order.orderPrice === 'Market' ? 'Market' : formatCurrency(Number(order.orderPrice) || 0)}
                          </td>
                          <td className="py-2.5 px-3 text-white font-medium">
                            {order.totalValue > 0 ? formatCurrency(order.totalValue) : '—'}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              order.status === 'FILLED' ? 'bg-green-500/15 text-green-400' :
                              ['CANCELED', 'EXPIRED', 'REJECTED'].includes(order.status) ? 'bg-red-500/15 text-red-400' :
                              'bg-blue-500/15 text-blue-400'
                            }`}>
                              {order.status === 'FILLED' ? `Filled ${order.fillPercent}%` : order.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 text-[10px]">
                            {order.updateTime ? new Date(order.updateTime).toLocaleString() : order.time ? new Date(order.time).toLocaleString() : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!ordersLoading && pagedPositionsTabRows.length === 0 && (
                    <div className="py-8 text-center text-slate-400 text-sm">No orders found</div>
                  )}
                </div>
              </div>

              <div className="flex-shrink-0 border-t border-slate-700 bg-[--color-surface]/95 backdrop-blur px-4 sm:px-6 py-2">

                {/* Pagination */}
                <div className="flex items-center justify-between border-t border-slate-700 pt-2">
                  <div className="text-xs text-slate-400">
                    Showing {Math.min((positionsModalPage - 1) * PAPER_POS_PER_PAGE + 1, positionsTabRows.length)} - {Math.min(positionsModalPage * PAPER_POS_PER_PAGE, positionsTabRows.length)} of {positionsTabRows.length}
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setPositionsModalPage(p => Math.max(1, p - 1))} 
                      disabled={positionsModalPage === 1} 
                      className={`px-3 py-1 rounded-md text-xs transition-colors ${positionsModalPage === 1 ? 'opacity-50 cursor-not-allowed' : 'bg-blue-600/50 hover:bg-blue-600/70'}`}
                    >
                      Prev
                    </button>
                    <div className="text-xs text-slate-400">Page {positionsModalPage} / {Math.max(1, Math.ceil(positionsTabRows.length / PAPER_POS_PER_PAGE))}</div>
                    <button 
                      onClick={() => setPositionsModalPage(p => Math.min(Math.max(1, Math.ceil(positionsTabRows.length / PAPER_POS_PER_PAGE)), p + 1))} 
                      disabled={positionsModalPage >= Math.max(1, Math.ceil(positionsTabRows.length / PAPER_POS_PER_PAGE))} 
                      className={`px-3 py-1 rounded-md text-xs transition-colors ${positionsModalPage >= Math.max(1, Math.ceil(positionsTabRows.length / PAPER_POS_PER_PAGE)) ? 'opacity-50 cursor-not-allowed' : 'bg-blue-600/50 hover:bg-blue-600/70'}`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Modal - Trading Performance */}
      {showLeaderboardModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl flex items-center justify-center z-[10000] p-4">
          <div className="bg-[--color-surface] rounded-lg sm:rounded-xl max-w-6xl w-full h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            {/* Fixed Header */}
            <div className="sticky top-0 flex-shrink-0 bg-[--color-surface] border-b border-slate-700 px-4 sm:px-6 py-3 flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-white">Trading Performance</h2>
                <p className="text-xs text-slate-400">View closed trades and open positions</p>
              </div>
              <button
                onClick={() => { setShowLeaderboardModal(false); setLeaderboardTab("history"); setHistoryFilter("all"); setLeaderboardHistoryPage(1); setLeaderboardPositionsPage(1); }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Fixed Main Tabs */}
            <div className="flex-shrink-0 border-b border-slate-700 px-4 sm:px-6 flex gap-3 overflow-x-auto bg-[--color-surface]/95 backdrop-blur">
              <button
                onClick={() => setLeaderboardTab("history")}
                className={`px-4 h-10 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                  leaderboardTab === "history"
                    ? "text-white bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] border-[var(--primary)]"
                    : "text-slate-400 hover:text-white border-transparent"
                }`}
              >
                Trade History
              </button>
              <button
                onClick={() => setLeaderboardTab("positions")}
                className={`px-4 h-10 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                  leaderboardTab === "positions"
                    ? "text-white bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] border-[var(--primary)]"
                    : "text-slate-400 hover:text-white border-transparent"
                }`}
              >
                Open Positions ({modalPositions.length})
              </button>
            </div>

            {/* Flex body: fills remaining height */}
            <div className="flex-1 min-h-0 flex flex-col">

              {/* Trade History Tab */}
              {leaderboardTab === "history" && (
                <>
                  {/* Fixed: Stats + Filter Tabs */}
                  <div className="flex-shrink-0 px-4 sm:px-6 py-2 space-y-2 border-b border-slate-700 bg-[--color-surface]/95 backdrop-blur">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-lg border border-slate-700 bg-[--color-surface]/70 px-3 py-2 text-center">
                        <div className="text-slate-400 text-xs">Total Trades</div>
                        <div className="text-lg font-bold text-white">{modalTradeSummary?.totalTrades ?? historyRowsFiltered.length}</div>
                      </div>
                      <div className="rounded-lg border border-slate-700 bg-[--color-surface]/70 px-3 py-2 text-center">
                        <div className="text-slate-400 text-xs">{leaderboardTotalPnl >= 0 ? 'Total Profit' : 'Total Loss'}</div>
                        <div className={`text-lg font-bold ${leaderboardTotalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatCurrency(Math.abs(modalTradeSummary?.totalProfitLoss ?? leaderboardTotalPnl))}
                        </div>
                      </div>
                      <div className="rounded-lg border border-slate-700 bg-[--color-surface]/70 px-3 py-2 text-center">
                        <div className="text-slate-400 text-xs">{leaderboardAvgProfit >= 0 ? 'Avg Profit' : 'Avg Loss'}</div>
                        <div className={`text-lg font-bold ${leaderboardAvgProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatCurrency(Math.abs(leaderboardAvgProfit))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap pb-1">
                      {/* P&L filters */}
                      <div className="flex gap-1.5 overflow-x-auto">
                        {["all", "profitable", "loss", "recent", "p&l"].map((filter) => (
                          <button
                            key={filter}
                            onClick={() => setHistoryFilter(filter as any)}
                            className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap capitalize transition-all ${
                              historyFilter === filter
                                ? "text-white bg-gradient-to-r from-[#fc4f02] to-[#fda300]"
                                : "text-slate-400 hover:text-white bg-slate-700/50"
                            }`}
                          >
                            {filter === "p&l" ? "P&L" : filter}
                          </button>
                        ))}
                      </div>

                      <div className="h-4 w-px bg-slate-700" />

                      {/* Period filters */}
                      <div className="flex gap-1.5 overflow-x-auto">
                        {([["all", "All Time"], ["1d", "1D"], ["1w", "1W"], ["1m", "1M"], ["6m", "6M"], ["custom", "Custom"]] as const).map(([key, label]) => (
                          <button
                            key={key}
                            onClick={() => { setTradeHistoryPeriod(key as any); setLeaderboardHistoryPage(1); }}
                            className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-all ${
                              tradeHistoryPeriod === key
                                ? "text-white bg-gradient-to-r from-[#fc4f02] to-[#fda300]"
                                : "text-slate-400 hover:text-white bg-slate-700/50"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom date range picker */}
                    {tradeHistoryPeriod === "custom" && (
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="date"
                          value={tradeHistoryStartDate}
                          onChange={(e) => setTradeHistoryStartDate(e.target.value)}
                          className="px-2 py-1 text-xs rounded-md bg-slate-700/50 border border-slate-600 text-white focus:outline-none focus:border-[#fc4f02]"
                        />
                        <span className="text-xs text-slate-500">to</span>
                        <input
                          type="date"
                          value={tradeHistoryEndDate}
                          onChange={(e) => setTradeHistoryEndDate(e.target.value)}
                          className="px-2 py-1 text-xs rounded-md bg-slate-700/50 border border-slate-600 text-white focus:outline-none focus:border-[#fc4f02]"
                        />
                      </div>
                    )}
                  </div>

                  {/* Scrollable: Trade List */}
                  <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-2 space-y-2">
                    {leaderboardLoading && (
                      <div className="flex items-center justify-center h-full min-h-[40vh]">
                        <div className="text-center">
                          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#fc4f02] border-r-transparent mb-3"></div>
                          <p className="text-sm text-slate-400">Loading trade history...</p>
                        </div>
                      </div>
                    )}
                    {leaderboardError && (
                      <div className="flex items-center justify-center h-full min-h-[40vh]">
                        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{leaderboardError}</div>
                      </div>
                    )}
                    {pagedHistoryRows.map((trade, idx) => (
                      <div key={`${trade.orderId}-${idx}`} className={`bg-slate-800/30 rounded-lg px-4 py-3 border-l-4 ${
                        trade.side === 'BUY' ? 'border-green-500' : trade.profitLoss >= 0 ? 'border-green-500' : 'border-red-500'
                      }`}>
                        {/* Top row: Left = Symbol + badges  |  Right = P&L or Entry Order */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-white">{trade.symbol}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              trade.side === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                            }`}>{trade.side}</span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-700/60 text-slate-300">
                              {trade.type === 'MARKET' ? 'Market' : trade.type === 'LIMIT' ? 'Limit' : trade.type === 'STOP_LOSS_LIMIT' ? 'Stop Loss' : trade.type === 'TAKE_PROFIT_LIMIT' ? 'Take Profit' : trade.type === 'STOP_LOSS' ? 'Stop Loss' : trade.type === 'TAKE_PROFIT' ? 'Take Profit' : trade.type || 'Order'}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/15 text-blue-300">
                              {trade.status === 'FILLED' ? `Filled ${trade.fillPercent}%` : trade.status}
                            </span>
                          </div>
                          <div className="flex-shrink-0 ml-4">
                            {trade.side === 'SELL' && trade.profitLoss !== 0 ? (
                              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs ${
                                trade.profitLoss < 0 ? 'bg-red-500/15' : 'bg-green-500/15'
                              }`}>
                                <span className={`font-medium uppercase text-[10px] ${
                                  trade.profitLoss < 0 ? 'text-red-400/70' : 'text-green-400/70'
                                }`}>{trade.profitLoss < 0 ? 'Loss' : 'Profit'}</span>
                                <span className={`font-bold ${
                                  trade.profitLoss < 0 ? 'text-red-400' : 'text-green-400'
                                }`}>{formatCurrency(Math.abs(trade.profitLoss))}</span>
                                <span className={`text-[10px] ${
                                  trade.profitLoss < 0 ? 'text-red-400/70' : 'text-green-400/70'
                                }`}>({Math.abs(trade.profitPercent).toFixed(2)}%)</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center px-2.5 py-1 rounded-md text-xs bg-blue-500/15">
                                <span className="font-medium uppercase text-[10px] text-blue-400">Entry Order</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Bottom row: Left = Fee + Date  |  Right = Qty, Avg, Total */}
                        <div className="flex items-center justify-between">
                          <div className="text-[11px] text-slate-500">
                            {trade.totalFee > 0 ? <><span>Fee</span> <span className="text-slate-400">{trade.totalFee} {trade.feeAsset}</span> <span className="mx-1">•</span></> : null}
                            {trade.time ? new Date(trade.time).toLocaleString() : '—'}
                          </div>
                          <div className="flex items-center gap-3 text-[11px] flex-shrink-0 ml-4">
                            <span className="text-slate-500">Qty <span className="text-slate-300">{formatQuantity(trade.filledQuantity)}</span></span>
                            <span className="text-slate-500">Avg <span className="text-slate-300">{formatCurrency(trade.avgPrice)}</span></span>
                            <span className="text-slate-500">Total <span className="text-white font-semibold">{formatCurrency(trade.totalValue)}</span></span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {!leaderboardLoading && pagedHistoryRows.length === 0 && (
                      <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4 text-center text-slate-400">
                        No trade history found
                      </div>
                    )}
                  </div>

                  {/* Fixed: Pagination */}
                  <div className="flex-shrink-0 border-t border-slate-700 px-4 sm:px-6 py-2 bg-[--color-surface]/95 backdrop-blur flex items-center justify-between">
                    <div className="text-xs text-slate-400">
                      Showing {Math.min((leaderboardHistoryPage - 1) * LEADERBOARD_ITEMS_PER_PAGE + 1, historyRowsFiltered.length)} - {Math.min(leaderboardHistoryPage * LEADERBOARD_ITEMS_PER_PAGE, historyRowsFiltered.length)} of {historyRowsFiltered.length} trades
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setLeaderboardHistoryPage(p => Math.max(1, p - 1))} 
                        disabled={leaderboardHistoryPage === 1} 
                        className={`px-3 py-1 rounded-md text-xs transition-colors ${leaderboardHistoryPage === 1 ? 'opacity-50 cursor-not-allowed' : 'bg-slate-700/70 hover:bg-slate-700 text-white'}`}
                      >
                        Prev
                      </button>
                      <div className="text-xs text-slate-400">Page {leaderboardHistoryPage} / {Math.max(1, Math.ceil(historyRowsFiltered.length / LEADERBOARD_ITEMS_PER_PAGE))}</div>
                      <button 
                        onClick={() => setLeaderboardHistoryPage(p => Math.min(Math.max(1, Math.ceil(historyRowsFiltered.length / LEADERBOARD_ITEMS_PER_PAGE)), p + 1))} 
                        disabled={leaderboardHistoryPage >= Math.max(1, Math.ceil(historyRowsFiltered.length / LEADERBOARD_ITEMS_PER_PAGE))} 
                        className={`px-3 py-1 rounded-md text-xs transition-colors ${leaderboardHistoryPage >= Math.max(1, Math.ceil(historyRowsFiltered.length / LEADERBOARD_ITEMS_PER_PAGE)) ? 'opacity-50 cursor-not-allowed' : 'bg-slate-700/70 hover:bg-slate-700 text-white'}`}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Open Positions Tab */}
              {leaderboardTab === "positions" && (
                <>
                  {/* Fixed: Stats + Section Header */}
                  <div className="flex-shrink-0 px-4 sm:px-6 py-2 space-y-2 border-b border-slate-700 bg-[--color-surface]/95 backdrop-blur">
                    <div className="grid grid-cols-4 gap-2">
                      <div className="rounded-lg border border-slate-700 bg-[--color-surface]/70 px-3 py-2 text-center">
                        <div className="text-slate-400 text-xs">Total Positions</div>
                        <div className="text-lg font-bold text-white">{modalPositions.length}</div>
                      </div>
                      <div className="rounded-lg border border-slate-700 bg-[--color-surface]/70 px-3 py-2 text-center">
                        <div className="text-slate-400 text-xs">Positions Up</div>
                        <div className="text-lg font-bold text-green-400">{leaderboardUpPositions}</div>
                      </div>
                      <div className="rounded-lg border border-slate-700 bg-[--color-surface]/70 px-3 py-2 text-center">
                        <div className="text-slate-400 text-xs">Positions Down</div>
                        <div className="text-lg font-bold text-red-400">{leaderboardDownPositions}</div>
                      </div>
                      <div className="rounded-lg border border-slate-700 bg-[--color-surface]/70 px-3 py-2 text-center">
                        <div className="text-slate-400 text-xs">{leaderboardUnrealizedTotal >= 0 ? 'Total Profit' : 'Total Loss'}</div>
                        <div className={`text-lg font-bold ${leaderboardUnrealizedTotal >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatCurrency(Math.abs(leaderboardUnrealizedTotal))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Scrollable: Positions List */}
                  <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-2 space-y-2">
                    {pagedLeaderboardPositions.map((position, idx) => {
                      const isStable = ['USDT', 'USDC', 'BUSD', 'TUSD', 'USDP', 'DAI', 'FDUSD'].includes(position.symbol);

                      if (isStable) {
                        return (
                          <div key={`${position.symbol}-${idx}`} className="bg-slate-800/30 rounded-lg px-4 py-3 border-l-4 border-slate-500">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-white">{position.symbol}</span>
                              <span className="text-sm font-bold text-white">{formatCurrency(position.marketValue)}</span>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={`${position.symbol}-${idx}`} className={`bg-slate-800/30 rounded-lg px-4 py-3 border-l-4 ${
                          position.unrealizedPnl < 0 ? 'border-red-500' : 'border-green-500'
                        }`}>
                          {/* Row 1: Symbol + Qty + Today  |  P&L label */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-white">{position.symbol}</span>
                              <span className="text-[10px] text-slate-400">{formatQuantity(position.quantity)}</span>
                              <span className="text-[10px] text-slate-500">•</span>
                              <span className="text-[10px] text-slate-500">Today{' '}
                                <span className={position.dailyChangePnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                                  {formatCurrency(Math.abs(position.dailyChangePnl))} ({Math.abs(position.dailyChangePercent).toFixed(2)}%)
                                </span>
                              </span>
                            </div>
                            <div className="flex-shrink-0 ml-4">
                              {position.hasRealEntry ? (
                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs ${
                                  position.unrealizedPnl < 0 ? 'bg-red-500/15' : 'bg-green-500/15'
                                }`}>
                                  <span className={`font-medium uppercase text-[10px] ${
                                    position.unrealizedPnl < 0 ? 'text-red-400/70' : 'text-green-400/70'
                                  }`}>{position.unrealizedPnl < 0 ? 'Loss' : 'Profit'}</span>
                                  <span className={`font-bold ${
                                    position.unrealizedPnl < 0 ? 'text-red-400' : 'text-green-400'
                                  }`}>{formatCurrency(Math.abs(position.unrealizedPnl))}</span>
                                  <span className={`text-[10px] ${
                                    position.unrealizedPnl < 0 ? 'text-red-400/70' : 'text-green-400/70'
                                  }`}>({Math.abs(position.unrealizedPnlPercent).toFixed(2)}%)</span>
                                </div>
                              ) : (
                                <span className="text-sm font-semibold text-white">{formatCurrency(position.marketValue)}</span>
                              )}
                            </div>
                          </div>

                          {/* Row 2: Left = Avg + Current  |  Right = Cost + Value */}
                          <div className="flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-3">
                              {position.hasRealEntry && (
                                <span className="text-slate-500">Avg Entry <span className="text-slate-300">{formatCurrency(position.avgEntryPrice)}</span></span>
                              )}
                              <span className="text-slate-500">Current <span className="text-slate-300">{formatCurrency(position.currentPrice)}</span></span>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                              {position.hasRealEntry && (
                                <span className="text-slate-500">Cost <span className="text-slate-300">{formatCurrency(position.totalCost)}</span></span>
                              )}
                              <span className="text-slate-500">Value <span className="text-white font-semibold">{formatCurrency(position.marketValue)}</span></span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {!leaderboardLoading && pagedLeaderboardPositions.length === 0 && (
                      <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4 text-center text-slate-400">
                        No open positions found
                      </div>
                    )}
                  </div>

                  {/* Fixed: Pagination */}
                  <div className="flex-shrink-0 border-t border-slate-700 px-4 sm:px-6 py-2 bg-[--color-surface]/95 backdrop-blur flex items-center justify-between">
                    <div className="text-xs text-slate-400">
                      Showing {Math.min((leaderboardPositionsPage - 1) * LEADERBOARD_ITEMS_PER_PAGE + 1, modalPositions.length)} - {Math.min(leaderboardPositionsPage * LEADERBOARD_ITEMS_PER_PAGE, modalPositions.length)} of {modalPositions.length} positions
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setLeaderboardPositionsPage(p => Math.max(1, p - 1))} 
                        disabled={leaderboardPositionsPage === 1} 
                        className={`px-3 py-1 rounded-md text-xs transition-colors ${leaderboardPositionsPage === 1 ? 'opacity-50 cursor-not-allowed' : 'bg-slate-700/70 hover:bg-slate-700 text-white'}`}
                      >
                        Prev
                      </button>
                      <div className="text-xs text-slate-400">Page {leaderboardPositionsPage} / {Math.max(1, Math.ceil(modalPositions.length / LEADERBOARD_ITEMS_PER_PAGE))}</div>
                      <button 
                        onClick={() => setLeaderboardPositionsPage(p => Math.min(Math.max(1, Math.ceil(modalPositions.length / LEADERBOARD_ITEMS_PER_PAGE)), p + 1))} 
                        disabled={leaderboardPositionsPage >= Math.max(1, Math.ceil(modalPositions.length / LEADERBOARD_ITEMS_PER_PAGE))} 
                        className={`px-3 py-1 rounded-md text-xs transition-colors ${leaderboardPositionsPage >= Math.max(1, Math.ceil(modalPositions.length / LEADERBOARD_ITEMS_PER_PAGE)) ? 'opacity-50 cursor-not-allowed' : 'bg-slate-700/70 hover:bg-slate-700 text-white'}`}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
  return vcPoolId ? (
    <TopTradeVcPoolContext.Provider value={vcPoolId}>
      {content}
    </TopTradeVcPoolContext.Provider>
  ) : (
    content
  );
}