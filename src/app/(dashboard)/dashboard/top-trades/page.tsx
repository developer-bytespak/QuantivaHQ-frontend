"use client";

import { useState, useMemo, useEffect } from "react";
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiRequest } from "@/lib/api/client";
import type { Strategy } from "@/lib/api/strategies";

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
      return { color: 'bg-green-500/20 text-green-400', icon: '📈', label: 'UP' };
    case 'TRENDING_DOWN':
      return { color: 'bg-red-500/20 text-red-400', icon: '📉', label: 'DOWN' };
    default:
      return { color: 'bg-slate-500/20 text-slate-300', icon: '→', label: 'STABLE' };
  }
};

// Helper to get volume status color
const getVolumeStatusBadge = (status?: string) => {
  switch (status) {
    case 'MASSIVE_SURGE':
      return { color: 'bg-purple-500/20 text-purple-300', icon: '🚀', label: 'SURGE' };
    case 'VOLUME_SURGE':
      return { color: 'bg-blue-500/20 text-blue-300', icon: '📊', label: 'SURGE' };
    default:
      return { color: 'bg-slate-600/20 text-slate-400', icon: '◆', label: 'NORMAL' };
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
  // user-created strategies
  const [userStrategies, setUserStrategies] = useState<Strategy[]>([]);
  const [loadingPreBuilt, setLoadingPreBuilt] = useState(false);
  const [preBuiltError, setPreBuiltError] = useState<string | null>(null);

  // state machine per strategy (DISCOVERY | PREVIEW | EXECUTED)
  const [strategyState, setStrategyState] = useState<Record<string, StrategyState>>({});
  // cache preview responses per strategy while page is open
  const [previewCache, setPreviewCache] = useState<Record<string, any>>({});
  // last applied strategy (used when user clicks "View Trade")
  const [currentAppliedStrategyId, setCurrentAppliedStrategyId] = useState<string | null>(null);

  // generated/executed signals cache keyed by `${strategyId}:${assetId}`
  const [generatedSignals, setGeneratedSignals] = useState<Record<string, any[]>>({});
  const [executionLoading, setExecutionLoading] = useState<Record<string, boolean>>({});
  const [executionError, setExecutionError] = useState<Record<string, string>>({});

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
      const price = item.price ?? item.last_price ?? item.quote ?? null;
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
        profit: item.changePercent ? `${item.changePercent}%` : (item.profit ? String(item.profit) : "0%"),
        profitValue: Number(String(item.changePercent ?? item.profit ?? 0)) || 0,
        volume: item.volume ? String(item.volume) : (item.volumeValue ? String(item.volumeValue) : "—"),
        volumeValue: Number(item.volume) || Number(item.volumeValue) || 0,
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
        const data = await apiRequest<never, any[]>({ path: "/strategies/trending-assets?limit=20", method: "GET" });
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

  // --- Fetch pre-built strategies (DISCOVERY) ---
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingPreBuilt(true);
        const data = await apiRequest<never, Strategy[]>({ path: "/strategies/pre-built", method: "GET" });
        // also fetch user-created strategies so users can use their custom strategies like templates
        const users = await apiRequest<never, Strategy[]>({ path: "/strategies?type=user", method: "GET" }).catch(() => []);
        if (!mounted) return;
        const adminOnly = (data || []).filter((s) => s?.type === "admin");
        setPreBuiltStrategies(adminOnly.slice(0, 4));
        setUserStrategies((users || []).slice(0, 6));
      } catch (err: any) {
        console.error("Failed to load pre-built strategies:", err);
        setPreBuiltError(err?.message || String(err));
      } finally {
        if (mounted) setLoadingPreBuilt(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // auto-apply from query param (when redirected from My Strategies)
  const searchParams = useSearchParams();
  const router = useRouter();
  useEffect(() => {
    const applyId = searchParams?.get?.('applyStrategy');
    if (applyId) {
      // preview and then remove param
      previewStrategy(applyId).catch(() => {});
      // replace the URL without the query param to avoid re-applying
      try {
        router.replace('/dashboard/top-trades');
      } catch (e) {
        // best-effort
      }
    }
  }, [searchParams]);

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
      applyPreviewToTrending(previewCache[strategyId], strategyId);
      return;
    }

    try {
      setStrategyState((s) => ({ ...s, [strategyId]: "DISCOVERY" }));

      // Try to find strategy locally (admin templates or user-created). If not present, fetch details from API.
      let strategy = preBuiltStrategies.find((s) => s.strategy_id === strategyId) || userStrategies.find((s) => s.strategy_id === strategyId);
      if (!strategy) {
        try {
          strategy = await apiRequest<never, Strategy>({ path: `/strategies/${strategyId}`, method: "GET" }).catch(() => null as any);
        } catch {
          strategy = null as any;
        }
      }

      // Choose preview endpoint based on strategy type if available. User strategies use the generic preview path.
      const isUserStrategy = (strategy as any)?.type === "user" || userStrategies.some((s) => s.strategy_id === strategyId);
      const previewPath = isUserStrategy ? `/strategies/${strategyId}/preview?limit=20` : `/strategies/pre-built/${strategyId}/preview?limit=20`;

      // Fetch preview assets (try appropriate endpoint)
      const preview = await apiRequest<never, any>({ path: previewPath, method: "GET" });

      // Combine preview with strategy parameters (use fetched strategy if needed)
      const strategyAny = strategy as any;
      const previewWithParams = {
        assets: Array.isArray(preview) ? preview : (preview?.assets ?? preview?.results ?? []),
        stop_loss_value: strategyAny?.stop_loss_value ?? strategyAny?.stopLossValue ?? null,
        take_profit_value: strategyAny?.take_profit_value ?? strategyAny?.takeProfitValue ?? null,
        entry_rules: strategyAny?.entry_rules ?? strategyAny?.entryRules ?? null,
        exit_rules: strategyAny?.exit_rules ?? strategyAny?.exitRules ?? null,
        engine_weights: strategyAny?.engine_weights ?? strategyAny?.engineWeights ?? null,
      };

      setPreviewCache((p) => ({ ...p, [strategyId]: previewWithParams }));
      setStrategyState((s) => ({ ...s, [strategyId]: "PREVIEW" }));
      setCurrentAppliedStrategyId(strategyId);
      applyPreviewToTrending(previewWithParams, strategyId);
    } catch (err) {
      console.error("Failed to preview strategy:", err);
      setStrategyState((s) => ({ ...s, [strategyId]: "DISCOVERY" }));
    }
  };

  // Apply preview payload to trendingTrades (modify trade fields inline)
  const applyPreviewToTrending = (preview: any, strategyId: string) => {
    // preview might be an object with `assets` array or a map keyed by asset_id; handle both
    const assetsPreview: any[] = Array.isArray(preview) ? preview : (preview?.assets ?? preview?.results ?? []);
    const strategyStopLoss = preview?.stop_loss_value;
    const strategyTakeProfit = preview?.take_profit_value;
    const strategyEntryRules = preview?.entry_rules ?? null;
    const strategyExitRules = preview?.exit_rules ?? null;
    const strategyEngineWeights = preview?.engine_weights ?? null;

    setTrendingTrades((prev) => {
      const byAssetId = new Map<string, any>();
      const bySymbol = new Map<string, any>();
      for (const a of assetsPreview) {
        const aid = a.asset_id ?? a.asset?.asset_id ?? a.assetId ?? null;
        const sym = (a.symbol ?? a.asset?.symbol ?? a.asset_symbol ?? '').toString().toUpperCase();
        if (aid) byAssetId.set(aid, a);
        if (sym) bySymbol.set(sym, a);
      }
      return prev.map((t) => {
        if (!t.assetId && !t.pair) return t;
        // try by asset id first, then by symbol extracted from pair
        let p = t.assetId ? byAssetId.get(t.assetId) : undefined;
        if (!p) {
          const symFromPair = (t.pair ?? '').split('/')[0].trim().toUpperCase();
          p = bySymbol.get(symFromPair) ?? bySymbol.get((t.pair ?? '').trim().toUpperCase());
        }

        // Build entry/exit rules display: per-asset preview overrides strategy-level rules
        const entryRules = p?.entry_rules ?? strategyEntryRules ?? [];
        const exitRules = p?.exit_rules ?? strategyExitRules ?? [];

        // Flexible field extraction with many fallbacks
        const extVal = p?.price ?? p?.price_usd ?? p?.priceUsd ?? p?.last_price ?? p?.quote ?? p?.market_price ?? t.ext;
        // Prefer explicit entry values from preview, otherwise fall back to preview price or existing trade entry
        const entryVal = p?.entry ?? p?.entry_price ?? p?.entryPrice ?? p?.suggested_entry ?? extVal ?? t.entry;
        const entryPriceVal = p?.entryPrice ?? p?.entry_price ?? p?.entry ?? extVal ?? t.entryPrice;
        const stopLossVal = p?.stop_loss ?? p?.stopLoss ?? strategyStopLoss ?? t.stopLoss;
        const stopLossPriceVal = p?.stop_loss_price ?? p?.stopLossPrice ?? stopLossVal ?? t.stopLossPrice;
        const takeProfitVal = p?.take_profit ?? p?.takeProfit ?? strategyTakeProfit ?? t.takeProfit1;

        // Profit / change
        const profitRaw = p?.changePercent ?? p?.change_pct ?? p?.profit ?? p?.pnl ?? t.profitValue ?? null;
        const profitDisplay = profitRaw !== null && profitRaw !== undefined ? (String(profitRaw).toString().includes('%') ? String(profitRaw) : `${String(profitRaw)}%`) : t.profit;
        const profitValue = Number(String(profitRaw ?? t.profitValue ?? 0)) || 0;

        // Volume
        const volumeVal = p?.market_volume ?? p?.volume ?? p?.volumeValue ?? t.volume;
        const volumeValue = Number(p?.market_volume ?? p?.volume ?? p?.volumeValue ?? t.volumeValue ?? 0) || 0;

        // Win rate
        const winRateRaw = p?.winRate ?? p?.win_rate ?? p?.win_pct ?? t.winRate;
        const winRateDisplay = winRateRaw !== null && winRateRaw !== undefined ? (String(winRateRaw).toString().includes('%') ? String(winRateRaw) : `${String(winRateRaw)}%`) : t.winRate;
        const winRateValue = Number(String(winRateRaw ?? t.winRateValue ?? 0)) || 0;

        // Apply preview fields if available, otherwise use strategy-level parameters
        return {
          ...t,
          ext: String(extVal ?? entryPriceVal ?? entryVal ?? t.ext ?? '—'),
          entry: entryVal ?? t.entry,
          entryPrice: entryPriceVal ?? t.entryPrice,
          stopLoss: stopLossVal ?? t.stopLoss,
          stopLossPrice: stopLossPriceVal ?? t.stopLossPrice,
          takeProfit1: takeProfitVal ?? t.takeProfit1,
          insights: (p?.insights ?? p?.reasons ?? t.insights) as string[],
          target: p?.target ?? t.target,
          profit: profitDisplay ?? t.profit,
          profitValue,
          volume: volumeVal ?? t.volume,
          volumeValue,
          winRate: winRateDisplay ?? t.winRate,
          winRateValue,
          // attach rules and engine weights for UI
          entryRules: entryRules,
          exitRules: exitRules,
          engineWeights: strategyEngineWeights ?? (t as any).engineWeights ?? null,
        } as Trade & { entryRules?: any[]; exitRules?: any[]; engineWeights?: any };
      });
    });
  };

  // --- Execute/View Trade: generate signals then fetch signals ---
  const executeStrategyForAsset = async (strategyId: string, assetId?: string) => {
    if (!strategyId) return;
    const key = `${strategyId}:${assetId ?? "all"}`;
    if (executionLoading[key]) return;

    setExecutionLoading((p) => ({ ...p, [key]: true }));
    setExecutionError((p) => { const c = { ...p }; delete c[key]; return c; });

    try {
      // Call POST /strategies/:id/generate-signals with optional assetIds
      await apiRequest<unknown, any>({ path: `/strategies/${strategyId}/generate-signals`, method: "POST", body: assetId ? { assetIds: [assetId] } : {} });

      // Then fetch signals for the strategy (latest_only=true to get one per asset)
      const signals = await apiRequest<never, any[]>({ path: `/strategies/${strategyId}/signals?latest_only=true`, method: "GET" });
      // filter signals for this asset if assetId provided
      const filtered = Array.isArray(signals) ? (assetId ? signals.filter((s) => (s.asset?.asset_id ?? s.asset_id ?? s.asset)?.toString() === assetId) : signals) : [];
      setGeneratedSignals((p) => ({ ...p, [key]: filtered }));
      // mark strategy as executed
      setStrategyState((s) => ({ ...s, [strategyId]: "EXECUTED" }));
    } catch (err: any) {
      console.error("Execution failed:", err);
      setExecutionError((p) => ({ ...p, [key]: err?.message ?? String(err) }));
    } finally {
      setExecutionLoading((p) => ({ ...p, [key]: false }));
    }
  };

  // --- Pagination / sorting helpers ---
  const filteredAndSortedTrades = useMemo(() => {
    let filtered = [...trendingTrades];
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
  }, [timeFilter, sortBy, trendingTrades]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedTrades.length / ITEMS_PER_PAGE));
  const paginatedTrades = filteredAndSortedTrades.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [timeFilter, sortBy, trendingTrades.length]);

  // --- View Trade handler (opens overlay and triggers execution when appropriate) ---
  const handleViewTrade = async (index: number) => {
    setSelectedTradeIndex(index);
    const trade = paginatedTrades[index];
    // if there is an applied strategy, execute for this asset and then show overlay
    if (currentAppliedStrategyId && trade?.assetId) {
      // attempt to reuse cached execution
      const key = `${currentAppliedStrategyId}:${trade.assetId}`;
      if (!generatedSignals[key] && !executionLoading[key]) {
        await executeStrategyForAsset(currentAppliedStrategyId, trade.assetId);
      }
    }
    setShowTradeOverlay(true);
  };

  // Utility to render signal info inside overlay for current trade
  const currentSignalForOverlay = () => {
    const trade = filteredAndSortedTrades[selectedTradeIndex];
    if (!trade) return null;
    const strategyId = currentAppliedStrategyId;
    if (!strategyId || !trade.assetId) return null;
    const key = `${strategyId}:${trade.assetId}`;
    return generatedSignals[key] ?? null;
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

      {/* Pre-built strategies list (Discovery) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loadingPreBuilt ? (
          <div className="col-span-full rounded-xl bg-gradient-to-br from-white/[0.02] to-transparent p-6 text-center">
            <p className="text-sm text-slate-400">Loading templates...</p>
          </div>
        ) : preBuiltError ? (
          <div className="col-span-full rounded-xl bg-red-600/10 p-6 text-center">
            <p className="text-sm text-red-300">Failed to load templates: {preBuiltError}</p>
          </div>
        ) : preBuiltStrategies.length > 0 ? (
          preBuiltStrategies.map((s, idx) => {
            const id = s.strategy_id || String(idx);
            const state = strategyState[id] ?? "DISCOVERY";
            return (
              <div key={id} className={`rounded-xl bg-gradient-to-br from-white/[0.07] to-transparent p-4 backdrop-blur ${currentAppliedStrategyId === id ? 'ring-2 ring-[#fc4f02]/40' : ''}`}>
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <p className="mb-1 text-xs text-slate-400">Template</p>
                    <p className="text-2xl font-bold text-white">{s.name}</p>
                    <p className="text-xs text-slate-400">Risk: <span className="text-white">{s.risk_level}</span></p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => previewStrategy(id)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium ${state === "PREVIEW" ? 'bg-[#06b6d4] text-white' : 'bg-[--color-surface] text-slate-300 hover:text-white'}`}
                    >
                      {state === "PREVIEW" ? 'Applied' : (state === "EXECUTED" ? 'Executed' : 'Apply Strategy')}
                    </button>
                  </div>
                </div>

                <div className="mt-3 space-y-2 rounded-md bg-[--color-surface] p-3 text-xs text-slate-300">
                  <div>
                    <p className="text-sm text-white font-semibold">{s.name}</p>
                    <p className="text-xs text-slate-400">{s.description || "No description"}</p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">Entry Rules</p>
                    {s.entry_rules && s.entry_rules.length > 0 ? (
                      <ul className="ml-3 list-disc">
                        {s.entry_rules.map((r, i) => (
                          <li key={i} className="text-xs text-slate-300">{r.indicator} {r.operator} {String(r.value)}{r.timeframe ? ` (${r.timeframe})` : ''}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-400">None</p>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <div>
                      <p className="text-xs text-slate-400">Stop Loss</p>
                      <p className="text-sm text-white">{s.stop_loss_type || '—'} {s.stop_loss_value ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Take Profit</p>
                      <p className="text-sm text-white">{s.take_profit_type || '—'} {s.take_profit_value ?? '—'}</p>
                    </div>
                  </div>

                  {/* show cached preview results when available */}
                  {previewCache[id] && (
                    <div className="mt-3 space-y-2 rounded-md bg-[--color-surface]/80 p-3 text-xs text-slate-200">
                      <p className="text-sm font-semibold text-white">Preview Applied</p>
                      <p className="text-xs text-slate-400">Preview cached while page open</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full rounded-xl bg-gradient-to-br from-white/[0.02] to-transparent p-6 text-center">
            <p className="text-sm text-slate-400">No pre-built admin templates available</p>
          </div>
        )}
      </div>

      {/* Top Trades List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Top Performing Trades</h2>
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

        {filteredAndSortedTrades.length > 0 ? (
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
                            {trendBadge.icon} {trendBadge.label}
                          </span>
                        );
                      })()}
                      
                      {/* NEW: Volume Status Badge */}
                      {(() => {
                        const volBadge = getVolumeStatusBadge(trade.volume_status);
                        return (
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${volBadge.color}`}>
                            {volBadge.icon} {volBadge.label}
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
            <p className="text-sm text-slate-400">No trades found for the selected time period</p>
          </div>
        )}
      </div>

      {/* Trade Details Overlay */}
      {showTradeOverlay && filteredAndSortedTrades[selectedTradeIndex] && (
        <div className="fixed inset-0 z-[9999] isolate flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowTradeOverlay(false)}>
          <div className="relative mx-4 w-full max-w-2xl rounded-2xl  bg-gradient-to-br from-white/[0.07] to-transparent p-6 shadow-2xl shadow-black/50 backdrop-blur" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Trade Details</h2>
              <button onClick={() => setShowTradeOverlay(false)} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-[--color-surface] hover:text-white" aria-label="Close">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className={`rounded-lg px-4 py-2 text-base font-semibold text-white ${filteredAndSortedTrades[selectedTradeIndex].type === "BUY" ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300]" : "bg-gradient-to-r from-red-500 to-red-600"}`}>
                  {filteredAndSortedTrades[selectedTradeIndex].type}
                </span>
                <span className="text-lg font-medium text-white">{filteredAndSortedTrades[selectedTradeIndex].pair}</span>
                <span className="rounded-full bg-slate-700 px-3 py-1 text-sm text-slate-300">{filteredAndSortedTrades[selectedTradeIndex].confidence}</span>
              </div>

                <div className="space-y-4 rounded-xl bg-gradient-to-br from-white/[0.07] to-transparent p-4">
                  <div className="flex items-center justify-between"><span className="text-sm text-slate-400">Entry</span><span className="text-base font-medium text-white">{formatCurrency(filteredAndSortedTrades[selectedTradeIndex].entryPrice ?? filteredAndSortedTrades[selectedTradeIndex].entry)}</span></div>
                  <div className="flex items-center justify-between"><span className="text-sm text-slate-400">Stop-Loss</span><span className="text-base font-medium text-white">{((filteredAndSortedTrades[selectedTradeIndex] as any).stop_loss ?? filteredAndSortedTrades[selectedTradeIndex].stopLoss) ? `${formatPercent((filteredAndSortedTrades[selectedTradeIndex] as any).stop_loss ?? filteredAndSortedTrades[selectedTradeIndex].stopLoss)} (${formatCurrency((filteredAndSortedTrades[selectedTradeIndex] as any).stop_loss_price ?? filteredAndSortedTrades[selectedTradeIndex].stopLossPrice)})` : '—'}</span></div>
                  <div className="flex items-center justify-between"><span className="text-sm text-slate-400">Take Profit 1</span><span className="text-base font-medium text-white">{(filteredAndSortedTrades[selectedTradeIndex] as any).take_profit ? `${formatPercent((filteredAndSortedTrades[selectedTradeIndex] as any).take_profit)} (${formatCurrency((filteredAndSortedTrades[selectedTradeIndex] as any).take_profit_price ?? filteredAndSortedTrades[selectedTradeIndex].takeProfit1)})` : (filteredAndSortedTrades[selectedTradeIndex].takeProfit1 ? `${formatPercent(filteredAndSortedTrades[selectedTradeIndex].takeProfit1)} (${formatCurrency((filteredAndSortedTrades[selectedTradeIndex] as any).take_profit_price ?? filteredAndSortedTrades[selectedTradeIndex].takeProfit1)})` : '—')}</span></div>
                  <div className="flex items-center justify-between"><span className="text-sm text-slate-400">Additional Info</span><span className="text-base font-medium text-slate-300">{filteredAndSortedTrades[selectedTradeIndex].target}</span></div>
                </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white">Insights</h3>
                {filteredAndSortedTrades[selectedTradeIndex].insights.map((insight: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-green-400" />
                    <p className="text-sm text-slate-300">{insight}</p>
                  </div>
                ))}
              </div>

              {/* Execution / Signals area */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white">Execution & Signals</h3>
                <div className="rounded-xl bg-gradient-to-br from-white/[0.03] to-transparent p-4 text-xs text-slate-300">
                  {currentAppliedStrategyId ? (
                    <>
                      <p className="text-xs text-slate-400">Applied Strategy: <span className="text-white">{currentAppliedStrategyId}</span></p>
                      <div className="mt-3">
                        {(() => {
                          const trade = filteredAndSortedTrades[selectedTradeIndex];
                          const key = `${currentAppliedStrategyId}:${trade.assetId ?? "all"}`;
                          if (executionLoading[key]) return <p className="text-xs text-slate-400">Generating signals...</p>;
                          if (executionError[key]) return <p className="text-xs text-red-300">Error: {executionError[key]}</p>;
                          const sigs = generatedSignals[key];
                          if (!sigs) {
                            return (
                              <div>
                                <p className="text-xs text-slate-400">No execution data yet.</p>
                                <div className="mt-2 flex gap-2">
                                  <button onClick={() => executeStrategyForAsset(currentAppliedStrategyId, trade.assetId)} className="rounded-md bg-gradient-to-r from-[#10b981] to-[#06b6d4] px-3 py-1.5 text-xs font-medium text-white">Generate Signals</button>
                                </div>
                              </div>
                            );
                          }
                          if (sigs.length === 0) return <p className="text-xs text-slate-400">No signals returned</p>;
                          return (
                            <div className="space-y-3">
                              {sigs.map((sig: any, i: number) => (
                                <div key={i} className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-xs text-slate-400">{sig.asset?.symbol ?? sig.asset_id ?? 'ASSET'}</p>
                                      <p className="text-sm font-medium text-white">{(sig.action || sig.final_action || sig.recommendation || 'HOLD').toString()}</p>
                                      <p className="text-xs text-slate-400">Score: {sig.final_score ?? sig.score ?? sig.confidence ?? '—'}</p>
                                    </div>
                                    <div className="max-w-[60%] text-xs text-slate-300">{sig.explanations && sig.explanations.length > 0 ? sig.explanations[0].text : sig.explanation || sig.summary || 'No explanation'}</div>
                                  </div>
                                  {/* score breakdown if present */}
                                  {sig.breakdown && (
                                    <div className="mt-1 grid grid-cols-2 gap-2 text-xs text-slate-400">
                                      {Object.entries(sig.breakdown).map(([k, v]) => <div key={k}><span className="text-slate-300">{k}:</span> <span className="ml-1 text-white">{String(v)}</span></div>)}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-slate-400">No strategy applied. Click "Apply Strategy" on a template to preview it against trending assets.</p>
                  )}
                </div>
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