"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from "@/lib/api/client";
import { exchangesService } from "@/lib/api/exchanges.service";

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
  signals?: any[];
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
  
  const [strategies, setStrategies] = useState<UserStrategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<UserStrategy | null>(null);
  const [generatingSignals, setGeneratingSignals] = useState<string | null>(null);
  const [deletingStrategy, setDeletingStrategy] = useState<string | null>(null);
  const [connectionType, setConnectionType] = useState<"crypto" | "stocks" | null>(null);


  // Check connection type on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await exchangesService.getActiveConnection();
        setConnectionType(response.data?.exchange?.type || null);
      } catch (error) {
        console.error("Failed to check connection type:", error);
      }
    };
    checkConnection();
  }, []);

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

  const handleGenerateSignals = async (strategyId: string) => {
    setGeneratingSignals(strategyId);
    try {
      const result = await apiRequest<never, any>({
        path: `/strategies/my-strategies/${strategyId}/generate-signals`,
        method: "POST",
      });
      alert(`Generated ${result.signals?.length || 0} signals successfully!`);
      fetchStrategies(); // Refresh to show new signal counts
    } catch (err: any) {
      alert(`Failed to generate signals: ${err?.message || err}`);
    } finally {
      setGeneratingSignals(null);
    }
  };

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
      <div className="relative rounded-2xl bg-gradient-to-br from-[#fc4f02]/20 via-[#fda300]/10 to-transparent p-6 sm:p-8 border border-[#fc4f02]/20 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#fc4f02]/30 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative">
          {/* Back Button - Dynamic based on referrer */}
          {referrer && previousPageName ? (
            <Link
              href={referrer === "paper-trading" ? "/dashboard/paper-trading" : referrer === "top-trades" ? "/dashboard/top-trades" : "/dashboard"}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-white/90 hover:text-[#fda300] transition-colors mb-3 group"
            >
              <svg className="w-4 h-4 text-white group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-white/90 group-hover:text-[#fda300]">Back to {previousPageName}</span>
            </Link>
          ) : (
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-white/90 hover:text-[#fda300] transition-colors mb-3 group"
            >
              <svg className="w-4 h-4 text-white group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-white/90 group-hover:text-[#fda300]">Back</span>
            </button>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#fc4f02] to-[#fda300] flex items-center justify-center shadow-lg shadow-[#fc4f02]/30">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">My Strategies</h2>
              </div>
              <p className="text-sm sm:text-base text-slate-400 max-w-md">Build powerful custom trading strategies with AI-powered signals and automated execution</p>
            </div>
            <Link
              href={`/dashboard/my-strategies/create${referrer ? `?from=${referrer}&via=my-strategies` : ""}`}
              className="rounded-xl px-5 py-3 bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white font-semibold hover:shadow-xl hover:shadow-[#fc4f02]/30 hover:scale-105 transition-all duration-200 flex items-center gap-2 group"
            >
              <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Strategy
            </Link>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-gradient-to-br from-white/[0.05] to-transparent p-12 text-center border border-white/5">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-3 border-[#fc4f02]/30 border-t-[#fc4f02] mb-4"></div>
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
          <div className="absolute inset-0 bg-gradient-to-br from-[#fc4f02]/5 via-transparent to-[#fda300]/5"></div>
          <div className="relative">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#fc4f02]/20 to-[#fda300]/20 flex items-center justify-center border border-[#fc4f02]/30">
              <svg className="w-10 h-10 text-[#fda300]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-xl font-semibold text-white mb-3">No strategies yet</p>
            <p className="text-slate-400 mb-6 max-w-sm mx-auto">Create your first custom stock trading strategy and let AI generate powerful signals for you.</p>
            <Link
              href="/dashboard/my-strategies/create"
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white font-semibold hover:shadow-xl hover:shadow-[#fc4f02]/30 hover:scale-105 transition-all duration-200 group"
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
              className="group rounded-2xl bg-gradient-to-br from-white/[0.07] via-white/[0.03] to-transparent p-5 backdrop-blur border border-white/10 hover:border-[#fc4f02]/40 transition-all duration-300 hover:shadow-xl hover:shadow-[#fc4f02]/10 hover:-translate-y-1"
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
                    <span key={symbol} className="px-2.5 py-1 bg-gradient-to-r from-[#fc4f02]/10 to-[#fda300]/10 border border-[#fc4f02]/20 rounded-lg text-xs text-white font-medium">
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
                  <p className="text-xl font-bold text-[#fda300]">{s.metrics.hold_signals}</p>
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
                <button
                  onClick={() => handleGenerateSignals(s.strategy_id)}
                  disabled={generatingSignals === s.strategy_id}
                  className="flex-1 rounded-xl px-3 py-2.5 text-xs bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white font-semibold hover:shadow-lg hover:shadow-[#fc4f02]/30 disabled:opacity-50 transition-all duration-200"
                >
                  {generatingSignals === s.strategy_id ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Generating...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      Generate
                    </span>
                  )}
                </button>
                <button
                  className="rounded-xl px-4 py-2.5 text-xs bg-white/5 text-white font-medium hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-200"
                  onClick={() => { setSelected(s); setShowModal(true); }}
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: show strategy details */}
      {showModal && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-xl bg-[--color-surface] p-4 sm:p-6 text-slate-100 ring-1 ring-white/5 shadow-lg max-h-[90vh] overflow-auto">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-block w-2 h-2 rounded-full ${selected.is_active ? 'bg-emerald-400' : 'bg-slate-500'}`}></span>
                  <span className="text-xs text-slate-400">{selected.is_active ? 'Active' : 'Inactive'}</span>
                </div>
                <h3 className="text-xl font-semibold">{selected.name}</h3>
                <p className="text-sm text-slate-400 mt-1">{selected.description || 'No description'}</p>
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

            {/* Target Stocks */}
            <div className="mb-4">
              <p className="text-xs text-slate-400 mb-2">Target Stocks</p>
              <div className="flex flex-wrap gap-2">
                {(selected.target_assets || []).map((symbol) => (
                  <span key={symbol} className="px-3 py-1 bg-slate-800 rounded-lg text-sm text-white font-medium">
                    {symbol}
                  </span>
                ))}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-3 mb-4 p-3 bg-black/20 rounded-lg">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{selected.metrics.total_signals}</p>
                <p className="text-xs text-slate-400">Total Signals</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-400">{selected.metrics.buy_signals}</p>
                <p className="text-xs text-slate-400">BUY</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-400">{selected.metrics.sell_signals}</p>
                <p className="text-xs text-slate-400">SELL</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">{(selected.metrics.avg_confidence * 100).toFixed(0)}%</p>
                <p className="text-xs text-slate-400">Avg Confidence</p>
              </div>
            </div>

            {/* Config */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-slate-400 mb-1">Risk Level</p>
                <p className={`font-medium ${selected.risk_level === 'high' ? 'text-red-400' : selected.risk_level === 'medium' ? 'text-yellow-400' : 'text-emerald-400'}`}>
                  {selected.risk_level?.toUpperCase()}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Timeframe</p>
                <p className="text-white">{selected.timeframe || '1d'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Stop Loss</p>
                <p className="text-white">{selected.stop_loss_value ? `${selected.stop_loss_value}%` : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Take Profit</p>
                <p className="text-white">{selected.take_profit_value ? `${selected.take_profit_value}%` : '—'}</p>
              </div>
            </div>

            {/* Entry Rules */}
            <div className="mb-4">
              <p className="text-xs text-slate-400 mb-2">Entry Rules (BUY Conditions)</p>
              <div className="bg-black/20 p-3 rounded-lg max-h-32 overflow-auto">
                {(selected.entry_rules || []).length === 0 ? (
                  <p className="text-sm text-slate-500">No entry rules defined</p>
                ) : (
                  <ul className="space-y-2">
                    {(selected.entry_rules || []).map((r: any, i: number) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        {i > 0 && <span className="text-xs text-slate-500">{r.logic || 'AND'}</span>}
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">{r.indicator}</span>
                        <span className="text-slate-400">{r.operator}</span>
                        <span className="text-white font-medium">{r.value}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Exit Rules */}
            <div className="mb-4">
              <p className="text-xs text-slate-400 mb-2">Exit Rules (SELL Conditions)</p>
              <div className="bg-black/20 p-3 rounded-lg max-h-32 overflow-auto">
                {(selected.exit_rules || []).length === 0 ? (
                  <p className="text-sm text-slate-500">No exit rules defined</p>
                ) : (
                  <ul className="space-y-2">
                    {(selected.exit_rules || []).map((r: any, i: number) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        {i > 0 && <span className="text-xs text-slate-500">{r.logic || 'OR'}</span>}
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded">{r.indicator}</span>
                        <span className="text-slate-400">{r.operator}</span>
                        <span className="text-white font-medium">{r.value}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Recent Signals */}
            {selected.signals && selected.signals.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-slate-400 mb-2">Recent Signals</p>
                <div className="bg-black/20 p-3 rounded-lg max-h-40 overflow-auto">
                  <div className="space-y-2">
                    {selected.signals.slice(0, 5).map((sig: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            sig.action === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' :
                            sig.action === 'SELL' ? 'bg-red-500/20 text-red-400' :
                            'bg-slate-700 text-slate-400'
                          }`}>
                            {sig.action}
                          </span>
                          <span className="text-white">{sig.asset?.symbol || 'Unknown'}</span>
                        </div>
                        <div className="text-xs text-slate-400">
                          Score: {((sig.final_score || 0) * 100).toFixed(0)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => handleDeleteStrategy(selected.strategy_id)}
                disabled={deletingStrategy === selected.strategy_id}
                className="rounded-lg px-4 py-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 disabled:opacity-50 transition-colors"
              >
                {deletingStrategy === selected.strategy_id ? 'Deleting...' : 'Delete Strategy'}
              </button>
              <div className="flex gap-3">
                <button 
                  className="rounded-lg px-4 py-2 bg-slate-700 text-white hover:bg-slate-600" 
                  onClick={() => { setShowModal(false); setSelected(null); }}
                >
                  Close
                </button>
                <button
                  onClick={() => handleGenerateSignals(selected.strategy_id)}
                  disabled={generatingSignals === selected.strategy_id}
                  className="rounded-lg px-4 py-2 bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {generatingSignals === selected.strategy_id ? 'Generating...' : '⚡ Generate Signals'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
