"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from "@/lib/api/client";
import { useExchange } from "@/context/ExchangeContext";
import useSubscriptionStore from "@/state/subscription-store";
import { PlanTier } from "@/mock-data/subscription-dummy-data";

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
  asset_type?: 'crypto' | 'stock';
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
}

export default function MyStrategiesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referrer = searchParams.get("from") || null; // null if no referrer
  
  // Get page name for display
  const pageNames: Record<string, string> = {
    "paper-trading": "Paper Trading",
    "top-trades": "Top Trades",
  };
  const previousPageName = referrer ? pageNames[referrer] || referrer : null;
  
  // Get connection type from global context
  const { connectionType } = useExchange();
  const { currentSubscription } = useSubscriptionStore();
  
  const [strategies, setStrategies] = useState<UserStrategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<UserStrategy | null>(null);
  const [deletingStrategy, setDeletingStrategy] = useState<string | null>(null);
  const [modalSignals, setModalSignals] = useState<any[]>([]);
  const [loadingModalSignals, setLoadingModalSignals] = useState(false);

  const fetchStrategies = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use asset_type filter based on connection type
      const assetType = connectionType === "stocks" ? "stock" : connectionType === "crypto" ? "crypto" : null;
      const queryParam = assetType ? `?asset_type=${assetType}` : "";
      const data = await apiRequest<never, UserStrategy[]>({ 
        path: `/strategies/my-strategies${queryParam}`, 
        method: "GET" 
      });
      if (!Array.isArray(data)) {
        setStrategies([]);
      } else {
        setStrategies(data);
      }
    } catch (err: any) {
      console.error("Failed to load strategies:", err);
      setError(err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch when connection type is determined
    if (connectionType !== null) {
      fetchStrategies();
    }
  }, [connectionType]);

  const handleToggleActive = async (strategyId: string) => {
    try {
      await apiRequest<never, any>({
        path: `/strategies/my-strategies/${strategyId}/toggle-active`,
        method: "POST",
      });
      fetchStrategies(); // Refresh
    } catch (err: any) {
      alert(`Failed to toggle strategy: ${err?.message || err}`);
    }
  };

  const fetchStrategySignals = async (strategyId: string) => {
    setLoadingModalSignals(true);
    try {
      const signals = await apiRequest<never, any[]>({
        path: `/strategies/my-strategies/${strategyId}/signals?latest_only=true`,
        method: "GET",
      });
      setModalSignals(signals || []);
    } catch (err: any) {
      console.error(`Failed to load signals for strategy ${strategyId}:`, err);
      setModalSignals([]);
    } finally {
      setLoadingModalSignals(false);
    }
  };

  const handleDeleteStrategy = async (strategyId: string) => {
    if (!confirm('Are you sure you want to delete this strategy? This action cannot be undone.')) {
      return;
    }
    setDeletingStrategy(strategyId);
    try {
      await apiRequest<never, any>({
        path: `/strategies/my-strategies/${strategyId}`,
        method: "DELETE",
      });
      setShowModal(false);
      setSelected(null);
      fetchStrategies(); // Refresh
    } catch (err: any) {
      alert(`Failed to delete strategy: ${err?.message || err}`);
    } finally {
      setDeletingStrategy(null);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Hero Section */}
      <div className="relative rounded-2xl bg-gradient-to-br from-[var(--primary)]/20 via-[var(--primary-light)]/10 to-transparent p-6 sm:p-8 border border-[var(--primary)]/20 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[var(--primary)]/30 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative">
          {/* Back Button - Dynamic based on referrer */}
          {referrer && previousPageName ? (
            <Link
              href={referrer === "paper-trading" ? "/dashboard/paper-trading" : referrer === "top-trades" ? "/dashboard/top-trades" : "/dashboard"}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-white/90 hover:text-[var(--primary-light)] transition-colors mb-3 group"
            >
              <svg className="w-4 h-4 text-white group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-white/90 group-hover:text-[var(--primary-light)]">Back to {previousPageName}</span>
            </Link>
          ) : (
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-white/90 hover:text-[var(--primary-light)] transition-colors mb-3 group"
            >
              <svg className="w-4 h-4 text-white group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-white/90 group-hover:text-[var(--primary-light)]">Back</span>
            </button>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] flex items-center justify-center shadow-lg shadow-[rgba(var(--primary-rgb),0.3)]/30">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">My Strategies</h2>
              </div>
              <p className="text-sm sm:text-base text-slate-400 max-w-md">Build powerful custom trading strategies with AI-powered signals and automated execution</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              {/* Custom Trading Button */}
              <Link
                href={`/dashboard/custom-strategies-trading?mode=${referrer === "top-trades" ? "live" : "paper"}&from=${referrer || "paper-trading"}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-slate-800 to-slate-700 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white hover:from-slate-700 hover:to-slate-600 transition-all border border-slate-600/50 hover:border-slate-500/50 shadow-lg shadow-slate-900/30"
                title="Trade using your custom strategies"
              >
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-white">Custom Trading</span>
              </Link>
              {/* Create Strategy Button */}
              <Link
                href={`/dashboard/my-strategies/create${referrer ? `?from=${referrer}&via=my-strategies` : ""}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] text-white font-semibold hover:shadow-xl hover:shadow-[rgba(var(--primary-rgb),0.3)]/30 hover:scale-[1.02] transition-all duration-200 group"
              >
                <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Strategy
              </Link>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-gradient-to-br from-white/[0.05] to-transparent p-12 text-center border border-white/5">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-3 border-[var(--primary)]/30 border-t-[var(--primary)] mb-4"></div>
          <p className="text-slate-300 font-medium">Loading your strategies...</p>
        </div>
      ) : error ? (
        <div className="rounded-xl bg-red-600/10 p-6 text-center text-red-300">
          <p className="font-medium">Error loading strategies</p>
          <p className="text-sm mt-1">{error}</p>
          <button 
            onClick={fetchStrategies}
            className="mt-3 px-4 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300"
          >
            Retry
          </button>
        </div>
      ) : strategies.length === 0 ? (
        <div className="relative rounded-2xl bg-gradient-to-br from-white/[0.05] to-transparent p-12 text-center border border-white/5 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/5 via-transparent to-[var(--primary-light)]/5"></div>
          <div className="relative">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary-light)]/20 flex items-center justify-center border border-[var(--primary)]/30">
              <svg className="w-10 h-10 text-[var(--primary-light)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-xl font-semibold text-white mb-3">No strategies yet</p>
            <p className="text-slate-400 mb-6 max-w-sm mx-auto">Create your first custom stock trading strategy and let AI generate powerful signals for you.</p>
            <Link
              href="/dashboard/my-strategies/create"
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] text-white font-semibold hover:shadow-xl hover:shadow-[rgba(var(--primary-rgb),0.3)]/30 hover:scale-[1.02] transition-all duration-200 group"
            >
              <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Your First Strategy
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {strategies.map((s) => (
            <div 
              key={s.strategy_id} 
              className="group rounded-2xl bg-gradient-to-br from-white/[0.07] via-white/[0.03] to-transparent p-5 backdrop-blur border border-white/10 hover:border-[var(--primary)]/40 transition-all duration-300 hover:shadow-xl hover:shadow-[rgba(var(--primary-rgb),0.3)]/10 hover:-translate-y-1"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-block w-2 h-2 rounded-full ${s.is_active ? 'bg-emerald-400' : 'bg-slate-500'}`}></span>
                    <span className="text-xs text-slate-400">{s.is_active ? 'Active' : 'Inactive'}</span>
                  </div>
                  <p className="text-lg font-semibold text-white line-clamp-1">{s.name}</p>
                </div>
                <button
                  onClick={() => handleToggleActive(s.strategy_id)}
                  className={`px-2 py-1 rounded text-xs ${s.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}
                >
                  {s.is_active ? 'ON' : 'OFF'}
                </button>
              </div>

              {/* Target Stocks */}
              <div className="mb-4">
                <p className="text-xs text-slate-400 mb-2 font-medium">Target Stocks</p>
                <div className="flex flex-wrap gap-1.5">
                  {(s.target_assets || []).slice(0, 5).map((symbol) => (
                    <span key={symbol} className="px-2.5 py-1 bg-gradient-to-r from-[var(--primary)]/10 to-[var(--primary-light)]/10 border border-[var(--primary)]/20 rounded-lg text-xs text-white font-medium">
                      {symbol}
                    </span>
                  ))}
                  {(s.target_assets || []).length > 5 && (
                    <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-400">
                      +{(s.target_assets || []).length - 5} more
                    </span>
                  )}
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-gradient-to-r from-black/30 to-black/20 rounded-xl border border-white/5">
                <div className="text-center">
                  <p className="text-xl font-bold text-emerald-400">{s.metrics.buy_signals}</p>
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">BUY</p>
                </div>
                <div className="text-center border-x border-white/5">
                  <p className="text-xl font-bold text-red-400">{s.metrics.sell_signals}</p>
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">SELL</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-[var(--primary-light)]">{s.metrics.hold_signals}</p>
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">HOLD</p>
                </div>
              </div>

              {/* Risk & Timeframe */}
              <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                <span>Risk: <span className={`font-medium ${s.risk_level === 'high' ? 'text-red-400' : s.risk_level === 'medium' ? 'text-yellow-400' : 'text-emerald-400'}`}>{s.risk_level}</span></span>
                <span>SL: {s.stop_loss_value || '—'}% / TP: {s.take_profit_value || '—'}%</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Link
                  href={`/dashboard/custom-strategies-trading?strategy=${s.strategy_id}&from=my-strategies&mode=${referrer === "top-trades" ? "live" : "paper"}`}
                  className="flex-1 rounded-xl px-3 py-2.5 text-xs bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] text-white font-semibold hover:shadow-lg hover:shadow-[rgba(var(--primary-rgb),0.3)]/30 transition-all duration-200 flex items-center justify-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                  View Signals
                </Link>
                <button
                  className="rounded-xl px-4 py-2.5 text-xs bg-white/5 text-white font-medium hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-200"
                  onClick={() => { setSelected(s); setShowModal(true); fetchStrategySignals(s.strategy_id); }}
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Show more strategies — for PRO users: CTA to upgrade for more */}
      {!loading && !error && strategies.length > 0 && currentSubscription?.tier === PlanTier.PRO && (
        <div className="rounded-2xl bg-gradient-to-br from-[var(--primary)]/15 via-[var(--primary-light)]/10 to-transparent p-6 border border-[var(--primary)]/25 text-center">
          <p className="text-slate-300 mb-3">Want more strategies? Upgrade to Elite for unlimited custom strategies.</p>
          <Link
            href="/dashboard/settings/subscription?tab=change"
            className="inline-flex items-center gap-2 rounded-xl px-5 py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] text-white font-semibold hover:shadow-xl hover:shadow-[rgba(var(--primary-rgb),0.3)]/30 hover:scale-[1.02] transition-all duration-200 group"
          >
            <span>Show more strategies</span>
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}

      {/* Modal: show strategy details */}
      {showModal && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4" onClick={() => { setShowModal(false); setSelected(null); }}>
          <div className="w-full max-w-4xl rounded-2xl bg-[#0e0e18] border border-white/10 p-4 sm:p-5 text-slate-100 shadow-2xl mt-16" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-block w-2 h-2 rounded-full ${selected.is_active ? 'bg-emerald-400' : 'bg-slate-500'}`}></span>
                  <span className="text-xs text-slate-400">{selected.is_active ? 'Active' : 'Inactive'}</span>
                </div>
                <h3 className="text-lg font-semibold">{selected.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{selected.description || 'No description'}</p>
              </div>
              <button
                onClick={() => { setShowModal(false); setSelected(null); }}
                className="p-1 hover:bg-slate-700 rounded"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Target Stocks + Stats side by side */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <p className="text-xs text-slate-400 mb-1.5">Target Stocks</p>
                <div className="flex flex-wrap gap-1.5">
                  {(selected.target_assets || []).length === 0 ? (
                    <span className="text-xs text-emerald-400">All trending assets</span>
                  ) : (selected.target_assets || []).map((symbol) => (
                    <span key={symbol} className="px-2 py-0.5 bg-slate-800 rounded text-xs text-white font-medium">
                      {symbol}
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 p-2 bg-black/20 rounded-lg">
                <div className="text-center">
                  <p className="text-lg font-bold text-white">{selected.metrics.total_signals}</p>
                  <p className="text-[10px] text-slate-400">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-emerald-400">{selected.metrics.buy_signals}</p>
                  <p className="text-[10px] text-slate-400">BUY</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-red-400">{selected.metrics.sell_signals}</p>
                  <p className="text-[10px] text-slate-400">SELL</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-blue-400">{(selected.metrics.avg_confidence * 100).toFixed(0)}%</p>
                  <p className="text-[10px] text-slate-400">Confidence</p>
                </div>
              </div>
            </div>

            {/* Config + Entry Rules side by side */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] text-slate-400 mb-0.5">Risk Level</p>
                  <p className={`text-sm font-medium ${selected.risk_level === 'high' ? 'text-red-400' : selected.risk_level === 'medium' ? 'text-yellow-400' : 'text-emerald-400'}`}>
                    {selected.risk_level?.toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 mb-0.5">Timeframe</p>
                  <p className="text-sm text-white">{selected.timeframe || '1d'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 mb-0.5">Stop Loss</p>
                  <p className="text-sm text-white">{selected.stop_loss_value ? `${selected.stop_loss_value}%` : '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 mb-0.5">Take Profit</p>
                  <p className="text-sm text-white">{selected.take_profit_value ? `${selected.take_profit_value}%` : '—'}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1.5">Entry Rules (BUY Conditions)</p>
                <div className="bg-black/20 p-2 rounded-lg">
                  {(selected.entry_rules || []).length === 0 ? (
                    <p className="text-sm text-slate-500">No entry rules defined</p>
                  ) : (
                    <ul className="space-y-1">
                      {(selected.entry_rules || []).map((r: any, i: number) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          {i > 0 && <span className="text-xs text-slate-500">{r.logic || 'AND'}</span>}
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-xs">{r.field || r.indicator}</span>
                          <span className="text-slate-400">{r.operator}</span>
                          <span className="text-white font-medium">{r.value}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Signals */}
            <div className="mb-3">
              <p className="text-xs text-slate-400 mb-1.5">Recent Signals</p>
              <div className="bg-black/20 p-2 rounded-lg">
                {loadingModalSignals ? (
                  <div className="flex items-center justify-center py-2">
                    <div className="w-4 h-4 border-2 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin"></div>
                    <span className="ml-2 text-sm text-slate-400">Loading signals...</span>
                  </div>
                ) : modalSignals.length === 0 ? (
                  <p className="text-sm text-slate-500">No signals yet</p>
                ) : (
                  <div className="grid grid-cols-2 gap-1.5">
                    {modalSignals.slice(0, 6).map((sig: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                            sig.action === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' :
                            sig.action === 'SELL' ? 'bg-red-500/20 text-red-400' :
                            'bg-slate-700 text-slate-400'
                          }`}>
                            {sig.action}
                          </span>
                          <span className="text-white text-xs">{sig.asset?.symbol || 'Unknown'}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">{((sig.final_score || 0) * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between gap-3 pt-3 border-t border-white/10">
              <button
                onClick={() => handleDeleteStrategy(selected.strategy_id)}
                disabled={deletingStrategy === selected.strategy_id}
                className="rounded-lg px-4 py-1.5 bg-red-600/20 text-red-400 hover:bg-red-600/30 disabled:opacity-50 transition-colors text-sm"
              >
                {deletingStrategy === selected.strategy_id ? 'Deleting...' : 'Delete Strategy'}
              </button>
              <button
                className="rounded-lg px-4 py-1.5 bg-slate-700 text-white hover:bg-slate-600 text-sm"
                onClick={() => { setShowModal(false); setSelected(null); }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
