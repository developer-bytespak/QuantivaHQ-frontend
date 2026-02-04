"use client";

import { useState, useMemo, useEffect } from "react";
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiRequest } from "@/lib/api/client";
import type { Strategy, StockMarketData } from "@/lib/api/strategies";
import { getPreBuiltStrategySignals, getTrendingAssetsWithInsights, generateAssetInsight, getStocksForTopTrades, seedPopularStocks, triggerStockSignals } from "@/lib/api/strategies";
import { exchangesService } from "@/lib/api/exchanges.service";
import { ComingSoon } from "@/components/common/coming-soon";

// --- Formatting helpers ---
const formatCurrency = (v: any) => {
  if (v === null || v === undefined || v === '—' || v === '') return '—';
  const n = Number(String(v));
  if (isNaN(n)) return String(v);
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);
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
  if (s.endsWith('%')) return s;
  const n = Number(s);
  if (isNaN(n)) return s;
  return `${n}%`;
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

export default function TopTradesPage() {
  // Connection type detection
  const [connectionType, setConnectionType] = useState<"crypto" | "stocks" | null>(null);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);

  // --- Page state ---
  const [trendingTrades, setTrendingTrades] = useState<Trade[]>([]);
  const [loadingTrending, setLoadingTrending] = useState(true);

  // pre-built strategies
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

  // AI insights state with timestamps
  const [aiInsights, setAiInsights] = useState<Record<string, Record<string, { text: string; timestamp: number }>>>({});
  const [loadingInsight, setLoadingInsight] = useState<Record<string, boolean>>({});

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
        profit: priceChange ? `${Number(priceChange).toFixed(2)}%` : "0%",
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

  // Check connection type on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await exchangesService.getActiveConnection();
        setConnectionType(response.data?.exchange?.type || null);
      } catch (error) {
        console.error("Failed to check connection type:", error);
      } finally {
        setIsCheckingConnection(false);
      }
    };
    checkConnection();
  }, []);

  // Determine if stocks connection
  const isStocksConnection = connectionType === "stocks";

  // --- Fetch stock market data from Alpaca (for stocks connection) ---
  const fetchStockMarketData = async () => {
    if (!isStocksConnection) return;
    
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
  }, [connectionType, isStocksConnection]);

  // --- Fetch pre-built strategies ---
  useEffect(() => {
    // Load strategies for both crypto and stocks connections
    if (connectionType !== "crypto" && connectionType !== "stocks") return;

    let mounted = true;
    (async () => {
      try {
        setLoadingPreBuilt(true);
        const data = await apiRequest<never, Strategy[]>({ path: "/strategies/pre-built", method: "GET" });
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
    return () => { mounted = false; };
  }, [connectionType]);

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
    if (connectionType !== "crypto" && connectionType !== "stocks") return;
    if (preBuiltStrategies.length > 0) {
      const activeStrategy = preBuiltStrategies[activeTab];
      if (activeStrategy && !strategySignals[activeStrategy.strategy_id] && !loadingSignals[activeStrategy.strategy_id]) {
        fetchStrategySignals(activeStrategy.strategy_id);
      }
    }
  }, [preBuiltStrategies, connectionType, activeTab]);

  // --- Auto-refresh signals every 60 seconds (only for active strategy) ---
  useEffect(() => {
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
  }, [preBuiltStrategies, connectionType, activeTab]);

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
        profit: realtimePriceChange ? `${Number(realtimePriceChange).toFixed(2)}%` : "0%",
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

  useEffect(() => { setCurrentPage(1); }, [timeFilter, sortBy, currentTrades.length, activeTab]);

  // --- View Trade handler ---
  const handleViewTrade = async (index: number) => {
    setSelectedTradeIndex(index);
    setShowTradeOverlay(true);
  };

  // Show loading while checking connection
  if (isCheckingConnection) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700/30 border-t-[#fc4f02]"></div>
      </div>
    );
  }

  // Stocks connection - no longer show coming soon, show stock strategies

  // --- UI Rendering (reuse existing layout and style) ---
  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6 pb-8 p-4 sm:p-0">
      {/* Stocks Info Banner with Controls */}
      {isStocksConnection && (
        <div className="rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${marketDataSource === 'alpaca' ? 'bg-green-500 animate-pulse' : 'bg-blue-500'}`} />
              <span className="text-sm text-blue-300">
                Stock Trading Signals - {marketDataSource === 'alpaca' ? 'Real-time Alpaca data' : 'Database cached data'}
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
        </div>
      )}

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
        <div className="flex flex-wrap gap-1 sm:gap-2 rounded-lg bg-[--color-surface]/60 p-1">
          <Link
            href="/dashboard/my-strategies?from=top-trades"
            className="rounded-md px-2 sm:px-4 py-1.5 sm:py-2 text-xs font-medium transition-all bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 whitespace-nowrap flex items-center gap-1.5 text-white"
          >
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-white">My Strategies</span>
          </Link>
          <Link
            href="/dashboard/custom-strategies-trading?mode=live"
            className="rounded-md px-2 sm:px-4 py-1.5 sm:py-2 text-xs font-medium transition-all bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 hover:border-green-500/50 whitespace-nowrap flex items-center gap-1.5 text-green-400"
            title="Trade with your custom strategies (Live)"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Trade Custom</span>
          </Link>
          {(["24h", "7d", "30d", "all"] as const).map((period) => (
            <button
              key={period}
              onClick={() => setTimeFilter(period)}
              className={`rounded-md px-2 sm:px-4 py-1.5 sm:py-2 text-xs font-medium transition-all whitespace-nowrap ${timeFilter === period
                ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white shadow-lg shadow-[#fc4f02]/30"
                : "text-slate-400 hover:text-white"
                }`}
            >
              {period === "all" ? "All" : period}
            </button>
          ))}
        </div>
      </div>

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
                        ? 'bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white shadow-lg shadow-[#fc4f02]/30'
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
              {/* Custom Strategy Button */}
              <Link
                href="/dashboard/my-strategies/create?from=top-trades"
                className="px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold transition-all rounded-lg whitespace-nowrap bg-gradient-to-r from-[#fc4f02]/20 to-[#fda300]/20 text-white hover:from-[#fc4f02]/30 hover:to-[#fda300]/30 border border-[#fc4f02]/40 hover:border-[#fc4f02]/60 flex items-center gap-1.5 shadow-lg shadow-[#fc4f02]/10"
              >
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-white">Custom</span>
              </Link>
            </div>
          </div>
          
          {/* Strategy Description Card */}
          {currentStrategy && (
            <div className="rounded-lg sm:rounded-xl bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur border border-[#fc4f02]/20 p-4 sm:p-5">
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
        <div className="rounded-lg sm:rounded-xl bg-gradient-to-br from-white/[0.02] to-transparent p-4 sm:p-6 text-center">
          <p className="text-xs sm:text-sm text-slate-400">No pre-built strategies available</p>
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
              className="rounded-lg  bg-[--color-surface] px-3 py-1.5 text-xs font-medium text-white focus:border-[#fc4f02] focus:outline-none focus:ring-2 focus:ring-[#fc4f02]/20"
            >
              <option value="profit">Profit</option>
              <option value="volume">Volume</option>
              <option value="winrate">Win Rate</option>
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
              className="mt-4 rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-4 py-2 text-sm font-medium text-white"
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
                      <span className={`rounded-lg px-3 py-1 text-sm font-semibold text-white ${trade.type === "BUY" ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300]" : "bg-gradient-to-r from-red-500 to-red-600"}`}>
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
                        <div className="absolute top-0 left-0 right-0 h-[1px] bg-[#fc4f02]/30"></div>
                        <div><span className="text-slate-400">Profit: </span><span className="font-medium text-green-400">{trade.profitValue ? formatPercent(trade.profitValue) : trade.profit ?? '—'}</span></div>
                        <div><span className="text-slate-400">Volume: </span><span className="font-medium text-white">{formatNumberCompact(trade.volumeValue ?? trade.volume)}</span></div>
                        <div><span className="text-slate-400">Win Rate: </span><span className="font-medium text-green-400">{formatPercent(trade.winRateValue ?? trade.winRate)}</span></div>
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
                          <div className="absolute top-0 left-0 right-0 h-[1px] bg-[#fc4f02]/30"></div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-[#fc4f02]" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M13 7H7v6h6V7z" />
                                <path fillRule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z" clipRule="evenodd" />
                              </svg>
                              <span className="text-xs font-semibold text-[#fc4f02]">AI Insight</span>
                            </div>
                            {hasInsight && insightData && (
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-500">{formatTimeAgo(insightData.timestamp)}</span>
                                <button
                                  onClick={() => handleGenerateInsight(currentStrategy.strategy_id, assetId)}
                                  disabled={loading}
                                  className="text-slate-400 hover:text-[#fc4f02] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                            <div className="rounded-lg bg-gradient-to-br from-[#fc4f02]/10 to-[#fda300]/5 p-3 text-xs text-slate-300 leading-relaxed border border-[#fc4f02]/20">
                              {insightData.text}
                            </div>
                          ) : assetId ? (
                            <button
                              onClick={() => handleGenerateInsight(currentStrategy.strategy_id, assetId)}
                              disabled={loading}
                              className="w-full rounded-lg bg-gradient-to-r from-slate-700/50 to-slate-600/50 px-3 py-2 text-xs font-medium text-slate-300 transition-all hover:from-[#fc4f02]/20 hover:to-[#fda300]/20 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed border border-slate-600/30 hover:border-[#fc4f02]/50"
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
                      {!isStocksConnection && (
                        <button className="flex-1 rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#fc4f02]/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#fc4f02]/40">Auto Trade</button>
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
                <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="rounded-md bg-[--color-surface] px-3 py-1 text-xs text-slate-300 disabled:opacity-40">Prev</button>
                <div className="text-xs text-slate-400">Page {currentPage} of {totalPages}</div>
                <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="rounded-md bg-[--color-surface] px-3 py-1 text-xs text-slate-300 disabled:opacity-40">Next</button>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl  bg-gradient-to-br from-white/[0.07] to-transparent p-8 text-center backdrop-blur shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)]">
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
        <div className="fixed inset-0 z-[9999] isolate flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowTradeOverlay(false)}>
          <div className="relative mx-4 w-full max-w-4xl max-h-[700px] rounded-2xl  bg-gradient-to-br from-white/[0.15] to-white/[0.05] p-4 shadow-2xl shadow-black/50 backdrop-blur" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Trade Details</h2>
              <button onClick={() => setShowTradeOverlay(false)} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-[--color-surface] hover:text-white" aria-label="Close">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className={`rounded-lg px-4 py-2 text-base font-semibold text-white ${filteredAndSortedTrades[selectedTradeIndex].type === "BUY" ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300]" : "bg-gradient-to-r from-red-500 to-red-600"}`}>
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
                      <div className="rounded-lg bg-gradient-to-br from-[#fc4f02]/10 to-[#fda300]/5 p-4 border border-[#fc4f02]/20">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-4 h-4 text-[#fc4f02]" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13 7H7v6h6V7z" />
                            <path fillRule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z" clipRule="evenodd" />
                          </svg>
                          <span className="text-xs font-semibold text-[#fc4f02]">AI Analysis</span>
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


    </div>
  );
}