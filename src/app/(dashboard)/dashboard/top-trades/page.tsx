"use client";

import { useState, useMemo, useEffect } from "react";
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiRequest } from "@/lib/api/client";
import type { Strategy } from "@/lib/api/strategies";
import { getPreBuiltStrategySignals, getTrendingAssetsWithInsights, generateAssetInsight } from "@/lib/api/strategies";

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

  // AI insights state
  const [aiInsights, setAiInsights] = useState<Record<string, Record<string, string>>>({});
  const [loadingInsight, setLoadingInsight] = useState<Record<string, boolean>>({});

  // UI filters / pagination / overlay
  const [timeFilter, setTimeFilter] = useState<"24h" | "7d" | "30d" | "all">("all");
  const [sortBy, setSortBy] = useState<"profit" | "volume" | "winrate">("profit");
  const ITEMS_PER_PAGE = 8;
  const [currentPage, setCurrentPage] = useState(1);
  const [showTradeOverlay, setShowTradeOverlay] = useState(false);
  const [selectedTradeIndex, setSelectedTradeIndex] = useState<number>(0);
  // create-custom modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createStopLoss, setCreateStopLoss] = useState("5");
  const [createTakeProfit, setCreateTakeProfit] = useState("10");
  const [createRiskLevel, setCreateRiskLevel] = useState<"low"|"medium"|"high">("medium");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // --- Helpers: map backend response into Trade[] (defensive) ---
  const mapBackendToTrades = (data: any[]): Trade[] => {
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
      const symbol = item.symbol ?? item.asset_symbol ?? (item.asset?.symbol) ?? `ASSET-${idx}`;
      const pair = item.pair ?? `${symbol} / USDT`;
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

  // --- Fetch trending assets (DISCOVERY) ---
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingTrending(true);
        const data = await apiRequest<never, any[]>({ path: "/strategies/trending-assets?limit=20&realtime=true", method: "GET" });
        if (!mounted) return;
        if (!data || !Array.isArray(data) || data.length === 0) {
          setTrendingTrades([]);
          setLoadingTrending(false);
          return;
        }
        const mapped = mapBackendToTrades(data);
        setTrendingTrades(mapped);
      } catch (err) {
        console.error("Failed to load trending assets:", err);
        setTrendingTrades([]); // show no mock by default; mock kept only on hard error in previous behaviour
      } finally {
        if (mounted) setLoadingTrending(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // --- Fetch pre-built strategies ---
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingPreBuilt(true);
        const data = await apiRequest<never, Strategy[]>({ path: "/strategies/pre-built", method: "GET" });
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
    return () => { mounted = false; };
  }, []);

  // --- Fetch signals for a strategy with AI insights ---
  const fetchStrategySignals = async (strategyId: string) => {
    if (loadingSignals[strategyId]) return;
    
    setLoadingSignals((p) => ({ ...p, [strategyId]: true }));
    setSignalsError((p) => { const c = { ...p }; delete c[strategyId]; return c; });

    try {
      // Use new AI insights endpoint that returns top 2 with insights
      const response = await getTrendingAssetsWithInsights(strategyId, 10);
      const assets = response.assets || [];
      
      // Store AI insights separately
      const insights: Record<string, string> = {};
      assets.forEach(asset => {
        if (asset.hasAiInsight && asset.aiInsight) {
          insights[asset.asset_id] = asset.aiInsight;
        }
      });
      setAiInsights((p) => ({ ...p, [strategyId]: insights }));
      
      // Map assets to signals format for compatibility with existing code
      const signals = assets.map(asset => ({
        signal_id: asset.signal?.signal_id || asset.asset_id,
        strategy_id: strategyId,
        asset_id: asset.asset_id,
        asset: {
          asset_id: asset.asset_id,
          symbol: asset.symbol,
          display_name: asset.display_name,
        },
        action: asset.signal?.action || 'HOLD',
        confidence: asset.signal?.confidence || 0,
        final_score: asset.signal?.final_score || 0,
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
      }));
      
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
      
      // Update AI insights
      setAiInsights((p) => ({
        ...p,
        [strategyId]: {
          ...(p[strategyId] || {}),
          [assetId]: response.insight,
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
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [preBuiltStrategies]);

  // --- Map signals to trades for display ---
  const mapSignalsToTrades = (signals: any[]): Trade[] => {
    if (!signals || signals.length === 0) return [];
    
    return signals.map((signal, idx) => {
      const asset = signal.asset || {};
      const symbol = asset.symbol || asset.asset_id || 'Unknown';
      const pair = `${symbol} / USDT`;
      const score = Number(signal.final_score ?? 0);
      const confidence: Trade["confidence"] = score >= 0.7 ? "HIGH" : score >= 0.4 ? "MEDIUM" : "LOW";
      
      // Use realtime_data if available
      const realtimePrice = signal.realtime_data?.price ?? null;
      const realtimeVolume = signal.realtime_data?.volume24h ?? null;
      const realtimePriceChange = signal.realtime_data?.priceChangePercent ?? null;
      
      // Get entry price from signal details or asset or realtime data
      const entryPrice = signal.details?.[0]?.entry_price || signal.entry_price || signal.entry || realtimePrice || null;
      const stopLossPrice = signal.details?.[0]?.stop_loss || signal.stop_loss_price || null;
      const takeProfitPrice = signal.details?.[0]?.take_profit_1 || signal.take_profit_price || null;
      
      // Get stop loss and take profit percentages from strategy
      const stopLossPct = signal.stop_loss || null;
      const takeProfitPct = signal.take_profit || null;
      
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
        stopLoss: stopLossPct ? String(stopLossPct) : "—",
        progressMin: 0,
        progressMax: 100,
        progressValue: Math.min(100, Math.max(0, Math.floor((score || 0) * 100))),
        entryPrice: entryPrice ? String(entryPrice) : "—",
        stopLossPrice: stopLossPrice ? String(stopLossPrice) : "—",
        takeProfit1: takeProfitPct ? String(takeProfitPct) : "—",
        target: "",
        insights: explanationText ? [explanationText] : [],
        profit: realtimePriceChange ? `${Number(realtimePriceChange).toFixed(2)}%` : "0%",
        profitValue: Number(realtimePriceChange ?? 0) || 0,
        volume: realtimeVolume ? String(Number(realtimeVolume).toLocaleString()) : "—",
        volumeValue: Number(realtimeVolume ?? 0) || 0,
        winRate: "—",
        winRateValue: 0,
        hoursAgo: signal.timestamp ? Math.floor((Date.now() - new Date(signal.timestamp).getTime()) / (1000 * 60 * 60)) : 0,
        trend_score: score,
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
    const previewPath = isUserStrategy ? `/strategies/${strategyId}/preview?limit=20` : `/strategies/pre-built/${strategyId}/preview?limit=20`;

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

  // --- UI Rendering (reuse existing layout and style) ---
  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-400">Track your best performing trades and strategies</p>
        </div>
        <div className="flex gap-2 rounded-lg bg-[--color-surface]/60 p-1">
          <Link href="/dashboard/my-strategies" className="rounded-md px-3 py-2 text-xs font-medium transition-all bg-transparent text-slate-300 hover:text-white border border-transparent hover:border-white/10">My Strategies</Link>
          <button
            onClick={() => setShowCreateModal(true)}
            className={`rounded-md px-4 py-2 text-xs font-medium transition-all bg-gradient-to-r from-[#10b981] to-[#06b6d4] text-white`}
          >
            Create Custom Strategy
          </button>
          {(["24h", "7d", "30d", "all"] as const).map((period) => (
            <button
              key={period}
              onClick={() => setTimeFilter(period)}
              className={`rounded-md px-4 py-2 text-xs font-medium transition-all ${timeFilter === period
                ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white shadow-lg shadow-[#fc4f02]/30"
                : "text-slate-400 hover:text-white"
                }`}
            >
              {period === "all" ? "All Time" : period}
            </button>
          ))}
        </div>
      </div>

      {/* Strategy Tabs */}
      {loadingPreBuilt ? (
        <div className="rounded-xl bg-gradient-to-br from-white/[0.02] to-transparent p-6 text-center">
          <p className="text-sm text-slate-400">Loading strategies...</p>
        </div>
      ) : preBuiltError ? (
        <div className="rounded-xl bg-red-600/10 p-6 text-center">
          <p className="text-sm text-red-300">Failed to load strategies: {preBuiltError}</p>
        </div>
      ) : preBuiltStrategies.length > 0 ? (
        <div className="rounded-xl bg-gradient-to-br from-white/[0.07] to-transparent p-4 backdrop-blur">
          <div className="flex gap-2 border-b border-slate-700/50">
            {preBuiltStrategies.map((strategy, idx) => {
              const strategyId = strategy.strategy_id;
              const isLoading = loadingSignals[strategyId];
              const error = signalsError[strategyId];
              const signalCount = strategySignals[strategyId]?.length || 0;
              
              return (
                <button
                  key={strategyId}
                  onClick={() => setActiveTab(idx)}
                  className={`px-4 py-2 text-sm font-medium transition-all rounded-t-lg ${
                    activeTab === idx
                      ? 'bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white shadow-lg shadow-[#fc4f02]/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
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
          
          {/* Tab Content */}
          {currentStrategy && (
            <div className="mt-4">
              <div className="mb-4 rounded-lg bg-[--color-surface]/50 p-4">
                <h3 className="text-lg font-semibold text-white mb-1">{currentStrategy.name}</h3>
                <p className="text-sm text-slate-400">{currentStrategy.description || "No description"}</p>
                <div className="mt-2 flex gap-4 text-xs text-slate-300">
                  <span>Risk: <span className="text-white">{currentStrategy.risk_level}</span></span>
                  <span>Stop Loss: <span className="text-white">{currentStrategy.stop_loss_value}%</span></span>
                  <span>Take Profit: <span className="text-white">{currentStrategy.take_profit_value}%</span></span>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl bg-gradient-to-br from-white/[0.02] to-transparent p-6 text-center">
          <p className="text-sm text-slate-400">No pre-built strategies available</p>
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
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {paginatedTrades.map((trade, index) => (
                <div key={trade.id} className="rounded-2xl  bg-gradient-to-br from-white/[0.07] to-transparent p-6 backdrop-blur">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
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
                        <span className="font-medium text-white">{(trade.stopLoss ?? '—') ? `${formatPercent(trade.stopLoss)} (${formatCurrency(trade.stopLossPrice ?? trade.stopLoss)})` : '—'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-400">Take Profit</span>
                        <span className="font-medium text-white">{trade.takeProfit1 ? `${formatPercent(trade.takeProfit1)} (${formatCurrency((trade as any).take_profit_price ?? trade.takeProfit1)})` : '—'}</span>
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
                      const insight = assetId ? strategyInsights[assetId] : null;
                      const hasInsight = (trade as any).hasAiInsight || !!insight;
                      const key = `${currentStrategy.strategy_id}-${assetId}`;
                      const loading = loadingInsight[key];

                      return (
                        <div className="relative pt-3 space-y-2">
                          <div className="absolute top-0 left-0 right-0 h-[1px] bg-[#fc4f02]/30"></div>
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-[#fc4f02]" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M13 7H7v6h6V7z" />
                              <path fillRule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xs font-semibold text-[#fc4f02]">AI Insight</span>
                          </div>
                          
                          {hasInsight && insight ? (
                            <div className="rounded-lg bg-gradient-to-br from-[#fc4f02]/10 to-[#fda300]/5 p-3 text-xs text-slate-300 leading-relaxed border border-[#fc4f02]/20">
                              {insight}
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
                      <button className="flex-1 rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#fc4f02]/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#fc4f02]/40">Auto Trade</button>
                      <button
                        onClick={() => handleViewTrade(index)}
                        className="rounded-xl  bg-[--color-surface] px-4 py-2.5 text-sm font-medium text-slate-300 transition-all duration-300  hover:text-white"
                      >
                        View Trade
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
                ? `No signals available for ${currentStrategy.name}. Signals are generated every 10 minutes.`
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
                  <div className="flex items-center justify-between"><span className="text-sm text-slate-400">Stop-Loss</span><span className="text-base font-medium text-white">{((filteredAndSortedTrades[selectedTradeIndex] as any).stop_loss ?? filteredAndSortedTrades[selectedTradeIndex].stopLoss) ? `${formatPercent((filteredAndSortedTrades[selectedTradeIndex] as any).stop_loss ?? filteredAndSortedTrades[selectedTradeIndex].stopLoss)} (${formatCurrency((filteredAndSortedTrades[selectedTradeIndex] as any).stop_loss_price ?? filteredAndSortedTrades[selectedTradeIndex].stopLossPrice)})` : '—'}</span></div>
                  <div className="flex items-center justify-between"><span className="text-sm text-slate-400">Take Profit 1</span><span className="text-base font-medium text-white">{(filteredAndSortedTrades[selectedTradeIndex] as any).take_profit ? `${formatPercent((filteredAndSortedTrades[selectedTradeIndex] as any).take_profit)} (${formatCurrency((filteredAndSortedTrades[selectedTradeIndex] as any).take_profit_price ?? filteredAndSortedTrades[selectedTradeIndex].takeProfit1)})` : (filteredAndSortedTrades[selectedTradeIndex].takeProfit1 ? `${formatPercent(filteredAndSortedTrades[selectedTradeIndex].takeProfit1)} (${formatCurrency((filteredAndSortedTrades[selectedTradeIndex] as any).take_profit_price ?? filteredAndSortedTrades[selectedTradeIndex].takeProfit1)})` : '—')}</span></div>
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

              {/* Insights below - full width */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white">Insights</h3>
                {filteredAndSortedTrades[selectedTradeIndex].insights.map((insight: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-green-400" />
                    <p className="text-sm text-slate-300">{insight}</p>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>
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
                        description: createDescription || "Created from Top Trades UI",
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
    </div>
  );
}