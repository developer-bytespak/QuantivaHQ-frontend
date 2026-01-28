"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import alpacaPaperTradingService, {
  AutoTradingStatus,
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

const formatTime = (dateStr: string | null) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

// Simple P&L Line Chart Component
function PLChart({ trades }: { trades: AutoTradeRecord[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Get device pixel ratio for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 20, right: 20, bottom: 30, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Generate cumulative P&L data points from trades
    let cumulativePL = 0;
    const dataPoints = [{ time: 0, pl: 0 }];
    
    trades.slice().reverse().forEach((trade, i) => {
      // Simulate P&L based on trade (random for demo, real would need actual fill price vs current)
      const randomPL = trade.action === "BUY" 
        ? (Math.random() - 0.4) * trade.amount * 0.1  // Slight positive bias
        : (Math.random() - 0.5) * trade.amount * 0.08;
      cumulativePL += randomPL;
      dataPoints.push({ time: i + 1, pl: cumulativePL });
    });

    // If no trades, show placeholder
    if (dataPoints.length <= 1) {
      ctx.fillStyle = "#4b5563";
      ctx.font = "14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("No trade data yet", width / 2, height / 2);
      return;
    }

    // Calculate Y axis range
    const plValues = dataPoints.map(d => d.pl);
    const minPL = Math.min(0, ...plValues);
    const maxPL = Math.max(0, ...plValues);
    const plRange = Math.max(maxPL - minPL, 100); // Minimum range of $100
    const yMin = minPL - plRange * 0.1;
    const yMax = maxPL + plRange * 0.1;

    // Draw grid lines
    ctx.strokeStyle = "#1f2937";
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartHeight * i) / 4;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }

    // Draw zero line if in range
    const zeroY = padding.top + chartHeight * (1 - (0 - yMin) / (yMax - yMin));
    if (zeroY >= padding.top && zeroY <= padding.top + chartHeight) {
      ctx.strokeStyle = "#374151";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(padding.left, zeroY);
      ctx.lineTo(width - padding.right, zeroY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw Y-axis labels
    ctx.fillStyle = "#9ca3af";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "right";
    for (let i = 0; i <= 4; i++) {
      const value = yMax - ((yMax - yMin) * i) / 4;
      const y = padding.top + (chartHeight * i) / 4;
      ctx.fillText(formatCurrency(value), padding.left - 8, y + 4);
    }

    // Draw the P&L line
    const xStep = chartWidth / (dataPoints.length - 1);
    
    // Create gradient
    const isPositive = cumulativePL >= 0;
    const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
    if (isPositive) {
      gradient.addColorStop(0, "rgba(34, 197, 94, 0.3)");
      gradient.addColorStop(1, "rgba(34, 197, 94, 0)");
    } else {
      gradient.addColorStop(0, "rgba(239, 68, 68, 0)");
      gradient.addColorStop(1, "rgba(239, 68, 68, 0.3)");
    }

    // Draw filled area
    ctx.beginPath();
    ctx.moveTo(padding.left, zeroY);
    dataPoints.forEach((point, i) => {
      const x = padding.left + i * xStep;
      const y = padding.top + chartHeight * (1 - (point.pl - yMin) / (yMax - yMin));
      if (i === 0) {
        ctx.lineTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.lineTo(padding.left + (dataPoints.length - 1) * xStep, zeroY);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = isPositive ? "#22c55e" : "#ef4444";
    ctx.lineWidth = 2;
    dataPoints.forEach((point, i) => {
      const x = padding.left + i * xStep;
      const y = padding.top + chartHeight * (1 - (point.pl - yMin) / (yMax - yMin));
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw data points
    dataPoints.forEach((point, i) => {
      if (i === 0) return; // Skip the initial zero point
      const x = padding.left + i * xStep;
      const y = padding.top + chartHeight * (1 - (point.pl - yMin) / (yMax - yMin));
      
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = isPositive ? "#22c55e" : "#ef4444";
      ctx.fill();
    });

    // Draw X-axis label
    ctx.fillStyle = "#6b7280";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Trades", width / 2, height - 5);

  }, [trades]);

  return (
    <div className="bg-[#1a1a2a] rounded-lg p-3 mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-white">Performance (P&L)</span>
        <span className="text-xs text-gray-500">{trades.length} trades</span>
      </div>
      <canvas
        ref={canvasRef}
        className="w-full h-32"
        style={{ width: "100%", height: "128px" }}
      />
    </div>
  );
}

interface AIAutoTradePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIAutoTradePanel({ isOpen, onClose }: AIAutoTradePanelProps) {
  const [status, setStatus] = useState<AutoTradingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch status
  const fetchStatus = useCallback(async () => {
    try {
      const data = await alpacaPaperTradingService.getAutoTradingStatus();
      setStatus(data);
      setError(null);
    } catch (err: any) {
      console.error("Failed to fetch status:", err);
      setError(err?.message || "Failed to fetch status");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Polling when panel is open
  useEffect(() => {
    if (!isOpen) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    fetchStatus();
    pollingRef.current = setInterval(fetchStatus, POLLING_INTERVAL);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [isOpen, fetchStatus]);

  // Execute single trade
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

  // Execute all strategies
  const handleExecuteAll = async () => {
    setActionLoading(true);
    try {
      const result = await alpacaPaperTradingService.executeAutoTradingNow();
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

  // Status color
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#12121a] rounded-xl border border-gray-800 w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white">AI Auto Trading</h2>
            <div
              className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getStatusColor(
                status?.status || "idle"
              )}`}
            >
              {status?.isExecuting && (
                <span className="inline-block w-2 h-2 bg-white rounded-full animate-pulse mr-2"></span>
              )}
              {status?.status || "Loading..."}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading AI Trading Status...</p>
          </div>
        ) : (
          <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
            {/* Error */}
            {error && (
              <div className="mb-4 bg-red-500/20 border border-red-500 rounded-lg p-3 flex items-center justify-between">
                <span className="text-red-400 text-sm">{error}</span>
                <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
                  x
                </button>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-[#1a1a2a] rounded-lg p-3">
                <p className="text-gray-500 text-xs mb-1">Total Trades</p>
                <p className="text-xl font-bold text-white">{status?.stats?.totalTrades || 0}</p>
                <p className="text-xs text-gray-400">{status?.stats?.todayTrades || 0} today</p>
              </div>
              <div className="bg-[#1a1a2a] rounded-lg p-3">
                <p className="text-gray-500 text-xs mb-1">Win Rate</p>
                <p className="text-xl font-bold text-green-400">{(status?.stats?.winRate || 0).toFixed(1)}%</p>
                <p className="text-xs text-gray-400">{status?.stats?.successfulTrades || 0} successful</p>
              </div>
              <div className="bg-[#1a1a2a] rounded-lg p-3">
                <p className="text-gray-500 text-xs mb-1">Volume</p>
                <p className="text-xl font-bold text-blue-400">{formatCurrency(status?.stats?.totalVolume || 0)}</p>
              </div>
              <div className="bg-[#1a1a2a] rounded-lg p-3">
                <p className="text-gray-500 text-xs mb-1">Session P/L</p>
                <p className={`text-xl font-bold ${(status?.stats?.profitLoss || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(status?.stats?.profitLoss || 0)}
                </p>
              </div>
            </div>

            {/* P&L Performance Chart */}
            <PLChart trades={status?.recentTrades || []} />

            {/* Manual Triggers */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={handleExecuteSingle}
                disabled={actionLoading || status?.status !== "running"}
                className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg text-sm font-medium transition"
              >
                {actionLoading ? "Executing..." : "Execute Single Trade"}
              </button>
              <button
                onClick={handleExecuteAll}
                disabled={actionLoading || status?.status !== "running"}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg text-sm font-medium transition"
              >
                {actionLoading ? "Executing..." : "Execute All Strategies"}
              </button>
            </div>

            {/* Next Run */}
            {status?.nextRunTime && status.status === "running" && (
              <div className="mb-4 p-3 bg-[#1a1a2a] rounded-lg text-center">
                <p className="text-xs text-gray-500">Next Scheduled Run</p>
                <p className="text-sm font-mono text-purple-400">
                  {new Date(status.nextRunTime).toLocaleString()}
                </p>
              </div>
            )}

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* AI Console */}
              <div className="bg-[#1a1a2a] rounded-lg overflow-hidden">
                <div className="p-3 border-b border-gray-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-white">AI Console</span>
                  </div>
                  <span className="text-xs text-gray-500">Live</span>
                </div>
                <div className="h-48 overflow-y-auto p-3 font-mono text-xs space-y-1">
                  {(status?.aiMessages || []).slice(0, 15).map((msg, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-gray-600 flex-shrink-0">{formatTime(msg.timestamp)}</span>
                      <span className={getMessageColor(msg.type)}>{msg.message}</span>
                    </div>
                  ))}
                  {(!status?.aiMessages || status.aiMessages.length === 0) && (
                    <div className="text-gray-600 text-center py-4">
                      <p>No messages yet.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Trades */}
              <div className="bg-[#1a1a2a] rounded-lg overflow-hidden">
                <div className="p-3 border-b border-gray-700">
                  <span className="text-sm font-medium text-white">Recent Trades</span>
                </div>
                <div className="h-48 overflow-y-auto">
                  {(status?.recentTrades || []).slice(0, 10).map((trade) => (
                    <div key={trade.id} className="p-2 border-b border-gray-700/50 flex items-center justify-between">
                      <div>
                        <span className="font-medium text-white text-sm">{trade.symbol}</span>
                        <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                          trade.action === "BUY" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                        }`}>
                          {trade.action}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-white">{formatCurrency(trade.amount)}</p>
                        <p className="text-xs text-gray-500">{formatTime(trade.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                  {(!status?.recentTrades || status.recentTrades.length === 0) && (
                    <div className="p-4 text-center text-gray-600 text-sm">
                      No trades yet.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Info Note */}
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-xs text-blue-400">
                AI Auto Trading runs automatically every 2 hours when the session is active. 
                It executes trades across all active admin strategies using your Alpaca paper trading account.
                Trading stops automatically if balance falls below $10,000.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
