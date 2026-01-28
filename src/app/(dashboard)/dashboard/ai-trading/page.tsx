"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import alpacaPaperTradingService, {
  AutoTradingStatus,
  AutoTradingStats,
  AutoTradeRecord,
  AiMessage,
} from "@/lib/api/alpaca-paper-trading.service";

// Polling interval (3 seconds)
const POLLING_INTERVAL = 3000;

// Format helpers
const formatCurrency = (v: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);
};

const formatPercent = (v: number) => {
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
};

const formatTime = (dateStr: string | null) => {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function AITradingPage() {
  // State
  const [status, setStatus] = useState<AutoTradingStatus | null>(null);
  const [stats, setStats] = useState<AutoTradingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Polling ref
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch status (lightweight, for polling)
  const fetchStatus = useCallback(async () => {
    try {
      const data = await alpacaPaperTradingService.getAutoTradingStatus();
      setStatus(data);
      setError(null);
    } catch (err: any) {
      console.error("Failed to fetch status:", err);
      setError(err?.message || "Failed to fetch status");
    }
  }, []);

  // Fetch full stats (heavier, less frequent)
  const fetchStats = useCallback(async () => {
    try {
      const data = await alpacaPaperTradingService.getAutoTradingStats();
      setStats(data);
    } catch (err: any) {
      console.error("Failed to fetch stats:", err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([fetchStatus(), fetchStats()]);
      setIsLoading(false);
    };
    init();
  }, [fetchStatus, fetchStats]);

  // Polling
  useEffect(() => {
    pollingRef.current = setInterval(fetchStatus, POLLING_INTERVAL);
    
    // Also refresh stats every 30 seconds
    const statsInterval = setInterval(fetchStats, 30000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      clearInterval(statsInterval);
    };
  }, [fetchStatus, fetchStats]);

  // Action handlers
  const handleStart = async () => {
    setActionLoading(true);
    try {
      const result = await alpacaPaperTradingService.startAutoTrading();
      if (!result.success) {
        setError(result.message);
      }
      await fetchStatus();
      await fetchStats();
    } catch (err: any) {
      setError(err?.message || "Failed to start");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePause = async () => {
    setActionLoading(true);
    try {
      await alpacaPaperTradingService.pauseAutoTrading();
      await fetchStatus();
    } catch (err: any) {
      setError(err?.message || "Failed to pause");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async () => {
    setActionLoading(true);
    try {
      await alpacaPaperTradingService.resumeAutoTrading();
      await fetchStatus();
    } catch (err: any) {
      setError(err?.message || "Failed to resume");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStop = async () => {
    setActionLoading(true);
    try {
      await alpacaPaperTradingService.stopAutoTrading();
      await fetchStatus();
    } catch (err: any) {
      setError(err?.message || "Failed to stop");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReset = async () => {
    setActionLoading(true);
    try {
      await alpacaPaperTradingService.resetAutoTrading();
      await fetchStatus();
      await fetchStats();
    } catch (err: any) {
      setError(err?.message || "Failed to reset");
    } finally {
      setActionLoading(false);
    }
  };

  const handleExecuteNow = async () => {
    setActionLoading(true);
    try {
      const result = await alpacaPaperTradingService.executeAutoTradingNow();
      if (!result.success) {
        setError(result.message);
      }
      await fetchStatus();
      await fetchStats();
    } catch (err: any) {
      setError(err?.message || "Failed to execute");
    } finally {
      setActionLoading(false);
    }
  };

  const handleExecuteSingle = async () => {
    setActionLoading(true);
    try {
      const result = await alpacaPaperTradingService.executeAutoTradingSingle();
      if (!result.success) {
        setError(result.message);
      }
      await fetchStatus();
    } catch (err: any) {
      setError(err?.message || "Failed to execute");
    } finally {
      setActionLoading(false);
    }
  };

  // Status badge color
  const getStatusColor = (s: string) => {
    switch (s) {
      case "running":
        return "bg-green-500";
      case "paused":
        return "bg-yellow-500";
      case "stopped":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  // Message type color
  const getMessageColor = (type: string) => {
    switch (type) {
      case "success":
        return "text-green-400";
      case "warning":
        return "text-yellow-400";
      case "trade":
        return "text-blue-400";
      default:
        return "text-gray-400";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Initializing AI Trading System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
              AI Trading System
            </h1>
            <p className="text-gray-400 mt-1">
              Automated paper trading powered by AI strategies
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={`px-4 py-2 rounded-full flex items-center gap-2 ${getStatusColor(
                status?.status || "idle"
              )}`}
            >
              {status?.isExecuting && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              )}
              <span className="font-semibold uppercase">
                {status?.status || "Idle"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 bg-red-500/20 border border-red-500 rounded-lg p-4 flex items-center justify-between">
          <span className="text-red-400">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-300"
          >
            ✕
          </button>
        </div>
      )}

      {/* Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        {/* Main Controls */}
        <div className="lg:col-span-1 bg-[#12121a] rounded-xl p-6 border border-gray-800">
          <h2 className="text-lg font-semibold mb-4">Controls</h2>
          <div className="space-y-3">
            {status?.status === "idle" && (
              <button
                onClick={handleStart}
                disabled={actionLoading}
                className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg font-semibold transition"
              >
                {actionLoading ? "Starting..." : "🚀 Start Trading"}
              </button>
            )}
            {status?.status === "running" && (
              <>
                <button
                  onClick={handlePause}
                  disabled={actionLoading}
                  className="w-full py-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 rounded-lg font-semibold transition"
                >
                  {actionLoading ? "..." : "⏸️ Pause"}
                </button>
                <button
                  onClick={handleStop}
                  disabled={actionLoading}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded-lg font-semibold transition"
                >
                  {actionLoading ? "..." : "⏹️ Stop"}
                </button>
              </>
            )}
            {status?.status === "paused" && (
              <>
                <button
                  onClick={handleResume}
                  disabled={actionLoading}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg font-semibold transition"
                >
                  {actionLoading ? "..." : "▶️ Resume"}
                </button>
                <button
                  onClick={handleStop}
                  disabled={actionLoading}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded-lg font-semibold transition"
                >
                  {actionLoading ? "..." : "⏹️ Stop"}
                </button>
              </>
            )}
            {status?.status === "stopped" && (
              <button
                onClick={handleReset}
                disabled={actionLoading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-semibold transition"
              >
                {actionLoading ? "..." : "🔄 Reset Session"}
              </button>
            )}
            
            <div className="border-t border-gray-700 pt-3 mt-3">
              <p className="text-xs text-gray-500 mb-2">Manual Triggers</p>
              <button
                onClick={handleExecuteNow}
                disabled={actionLoading || status?.status !== "running"}
                className="w-full py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg text-sm transition mb-2"
              >
                ⚡ Execute All Strategies
              </button>
              <button
                onClick={handleExecuteSingle}
                disabled={actionLoading || status?.status !== "running"}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg text-sm transition"
              >
                🎯 Execute Single Trade
              </button>
            </div>
          </div>

          {/* Next Run Timer */}
          {status?.nextRunTime && status.status === "running" && (
            <div className="mt-6 p-4 bg-[#1a1a2a] rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Next Scheduled Run</p>
              <p className="text-lg font-mono text-purple-400">
                {formatDate(status.nextRunTime)}
              </p>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#12121a] rounded-xl p-5 border border-gray-800">
            <p className="text-gray-500 text-sm mb-1">Portfolio Value</p>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(stats?.currentBalance || 0)}
            </p>
            <p
              className={`text-sm mt-1 ${
                (stats?.dailyChangePercent || 0) >= 0
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {formatPercent(stats?.dailyChangePercent || 0)} today
            </p>
          </div>

          <div className="bg-[#12121a] rounded-xl p-5 border border-gray-800">
            <p className="text-gray-500 text-sm mb-1">Total Trades</p>
            <p className="text-2xl font-bold text-white">
              {status?.stats?.totalTrades || 0}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {status?.stats?.todayTrades || 0} today
            </p>
          </div>

          <div className="bg-[#12121a] rounded-xl p-5 border border-gray-800">
            <p className="text-gray-500 text-sm mb-1">Win Rate</p>
            <p className="text-2xl font-bold text-green-400">
              {(status?.stats?.winRate || 0).toFixed(1)}%
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {status?.stats?.successfulTrades || 0} successful
            </p>
          </div>

          <div className="bg-[#12121a] rounded-xl p-5 border border-gray-800">
            <p className="text-gray-500 text-sm mb-1">Total Volume</p>
            <p className="text-2xl font-bold text-blue-400">
              {formatCurrency(status?.stats?.totalVolume || 0)}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Avg: {formatCurrency(stats?.avgTradeSize || 0)}
            </p>
          </div>

          <div className="bg-[#12121a] rounded-xl p-5 border border-gray-800">
            <p className="text-gray-500 text-sm mb-1">Session P&L</p>
            <p
              className={`text-2xl font-bold ${
                (status?.stats?.profitLoss || 0) >= 0
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {formatCurrency(status?.stats?.profitLoss || 0)}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {formatPercent(status?.stats?.profitLossPercent || 0)}
            </p>
          </div>

          <div className="bg-[#12121a] rounded-xl p-5 border border-gray-800">
            <p className="text-gray-500 text-sm mb-1">Buying Power</p>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(stats?.buyingPower || 0)}
            </p>
            <p className="text-sm text-gray-400 mt-1">Available</p>
          </div>

          <div className="bg-[#12121a] rounded-xl p-5 border border-gray-800">
            <p className="text-gray-500 text-sm mb-1">Open Positions</p>
            <p className="text-2xl font-bold text-white">
              {stats?.openPositions || 0}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {formatCurrency(stats?.totalPositionValue || 0)}
            </p>
          </div>

          <div className="bg-[#12121a] rounded-xl p-5 border border-gray-800">
            <p className="text-gray-500 text-sm mb-1">Session Duration</p>
            <p className="text-2xl font-bold text-purple-400">
              {stats?.sessionDuration || "—"}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Since {formatDate(status?.startTime || null)}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Console (Live Messages) */}
        <div className="lg:col-span-1 bg-[#12121a] rounded-xl border border-gray-800 overflow-hidden">
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <h2 className="font-semibold">AI Console</h2>
            </div>
            <span className="text-xs text-gray-500">Live</span>
          </div>
          <div className="h-[400px] overflow-y-auto p-4 font-mono text-sm space-y-2">
            {(status?.aiMessages || []).map((msg, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-gray-600 flex-shrink-0">
                  {formatTime(msg.timestamp)}
                </span>
                <span className={getMessageColor(msg.type)}>{msg.message}</span>
              </div>
            ))}
            {(!status?.aiMessages || status.aiMessages.length === 0) && (
              <div className="text-gray-600 text-center py-8">
                <p>No messages yet.</p>
                <p className="text-xs mt-1">Start trading to see AI activity.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Trades */}
        <div className="lg:col-span-2 bg-[#12121a] rounded-xl border border-gray-800 overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h2 className="font-semibold">Recent Trades</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#1a1a2a]">
                <tr className="text-left text-gray-500 text-sm">
                  <th className="p-4">Time</th>
                  <th className="p-4">Symbol</th>
                  <th className="p-4">Strategy</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {(status?.recentTrades || []).map((trade) => (
                  <tr
                    key={trade.id}
                    className="border-b border-gray-800 hover:bg-[#1a1a2a] transition"
                  >
                    <td className="p-4 text-gray-400 text-sm">
                      {formatTime(trade.timestamp)}
                    </td>
                    <td className="p-4 font-semibold">{trade.symbol}</td>
                    <td className="p-4 text-gray-400 text-sm">
                      {trade.strategyName}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          trade.action === "BUY"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {trade.action}
                      </span>
                    </td>
                    <td className="p-4">{formatCurrency(trade.amount)}</td>
                    <td className="p-4">{formatCurrency(trade.price)}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          trade.status === "filled"
                            ? "bg-green-500/20 text-green-400"
                            : trade.status === "failed"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-yellow-500/20 text-yellow-400"
                        }`}
                      >
                        {trade.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-500 rounded-full"
                            style={{ width: `${trade.confidence * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-400">
                          {(trade.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!status?.recentTrades || status.recentTrades.length === 0) && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-600">
                      No trades yet. Start the AI trading system to execute trades.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Strategy Performance */}
      {stats?.strategyPerformance && stats.strategyPerformance.length > 0 && (
        <div className="mt-6 bg-[#12121a] rounded-xl border border-gray-800 overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h2 className="font-semibold">Strategy Performance</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
            {stats.strategyPerformance.map((strategy) => (
              <div
                key={strategy.strategyId}
                className="bg-[#1a1a2a] rounded-lg p-4"
              >
                <h3 className="font-semibold text-white mb-3">
                  {strategy.strategyName}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Trades</span>
                    <span className="text-white">{strategy.totalTrades}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Win Rate</span>
                    <span className="text-green-400">
                      {strategy.winRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Volume</span>
                    <span className="text-blue-400">
                      {formatCurrency(strategy.totalVolume)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Avg Confidence</span>
                    <span className="text-purple-400">
                      {(strategy.avgConfidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Visualization */}
      <div className="mt-6 bg-[#12121a] rounded-xl border border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Neural Network Activity</h2>
          {status?.status === "running" && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
              <span className="text-xs text-green-400">Processing</span>
            </div>
          )}
        </div>
        <div className="h-32 flex items-center justify-center relative overflow-hidden">
          {/* Animated visualization */}
          <div className="flex gap-1">
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={i}
                className={`w-1 bg-gradient-to-t from-purple-600 to-blue-400 rounded-full transition-all duration-300 ${
                  status?.status === "running"
                    ? "animate-pulse"
                    : "opacity-30"
                }`}
                style={{
                  height: `${20 + Math.random() * 80}px`,
                  animationDelay: `${i * 50}ms`,
                }}
              ></div>
            ))}
          </div>
          {status?.status !== "running" && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#12121a]/80">
              <p className="text-gray-500">
                {status?.status === "idle"
                  ? "Start trading to activate neural network"
                  : status?.status === "paused"
                  ? "Neural network paused"
                  : "Neural network stopped"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
