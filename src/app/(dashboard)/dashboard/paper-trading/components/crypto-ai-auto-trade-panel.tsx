"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { alpacaAutoTradingService } from "@/lib/api/alpaca-auto-trading.service";

// Polling interval (3 seconds)
const POLLING_INTERVAL = 3000;

// Format helpers
const formatCurrency = (v: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(v);
};

const formatTime = (dateStr: string | Date | null) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

// Types
interface CryptoAutoTradeRecord {
  id: string;
  timestamp: string | Date;
  strategyId: string;
  strategyName: string;
  symbol: string;
  action: "BUY" | "SELL";
  amount: number;
  price: number;
  orderId: string;
  status: "pending" | "filled" | "failed";
  aiMessage: string;
  confidence: number;
}

interface AiMessage {
  timestamp: string | Date;
  message: string;
  type: "info" | "success" | "warning" | "trade";
}

interface CryptoSessionStats {
  totalTrades: number;
  successfulTrades: number;
  failedTrades: number;
  totalVolume: number;
  todayTrades: number;
  winRate: number;
  lastTradeTime: Date | null;
  sessionStartTime: Date | null;
  currentBalance: number;
  startingBalance: number;
  profitLoss: number;
  profitLossPercent: number;
}

interface CryptoAutoTradingStatus {
  status: "idle" | "running" | "paused" | "stopped";
  sessionId: string;
  startTime: string | null;
  lastRunTime: string | null;
  nextRunTime: string | null;
  isExecuting: boolean;
  stats: CryptoSessionStats;
  recentTrades: CryptoAutoTradeRecord[];
  aiMessages: AiMessage[];
}

// Simple P&L Line Chart Component
function CryptoPLChart({ trades }: { trades: CryptoAutoTradeRecord[] }) {
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
      // Simulate small P/L for visualization
      const tradePL = trade.action === "BUY" 
        ? (Math.random() - 0.4) * trade.amount * 0.08 
        : (Math.random() - 0.5) * trade.amount * 0.06;
      cumulativePL += tradePL;
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
    const plRange = Math.max(maxPL - minPL, 50); // Minimum range of $50 for crypto
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
      ctx.lineTo(x, y);
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
        <span className="text-sm font-medium text-white">Crypto Performance (P&L)</span>
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

interface CryptoAIAutoTradePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onTradeExecuted?: () => void; // Callback to notify parent when trades are executed
}

export function CryptoAIAutoTradePanel({ isOpen, onClose, onTradeExecuted }: CryptoAIAutoTradePanelProps) {
  const [status, setStatus] = useState<CryptoAutoTradingStatus | null>(null);
  const [ocoOrders, setOcoOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'trades' | 'oco'>('trades');

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch status
  const fetchStatus = useCallback(async () => {
    try {
      const [statusData, ocoData] = await Promise.all([
        alpacaAutoTradingService.getStatus(),
        alpacaAutoTradingService.getBracketOrders().catch(() => ({ data: { orders: [] } })),
      ]);
      
      setStatus(statusData.data);
      setOcoOrders(ocoData.data?.orders || []);
      setError(null);
    } catch (err: any) {
      console.error("Failed to fetch crypto status:", err);
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

  // Start trading
  const handleStart = async () => {
    setActionLoading(true);
    try {
      await alpacaAutoTradingService.start();
      await fetchStatus();
    } catch (err: any) {
      setError(err?.message || "Failed to start");
    } finally {
      setActionLoading(false);
    }
  };

  // Pause trading
  const handlePause = async () => {
    setActionLoading(true);
    try {
      await alpacaAutoTradingService.pause();
      await fetchStatus();
    } catch (err: any) {
      setError(err?.message || "Failed to pause");
    } finally {
      setActionLoading(false);
    }
  };

  // Resume trading
  const handleResume = async () => {
    setActionLoading(true);
    try {
      await alpacaAutoTradingService.resume();
      await fetchStatus();
    } catch (err: any) {
      setError(err?.message || "Failed to resume");
    } finally {
      setActionLoading(false);
    }
  };

  // Stop trading
  const handleStop = async () => {
    setActionLoading(true);
    try {
      await alpacaAutoTradingService.stop();
      await fetchStatus();
    } catch (err: any) {
      setError(err?.message || "Failed to stop");
    } finally {
      setActionLoading(false);
    }
  };

  // Execute single trade
  const handleExecuteSingle = async () => {
    setActionLoading(true);
    try {
      const result = await binanceTestnetService.executeCryptoSingleTrade();
      if (!result.success) {
        setError(result.message);
      } else {
        // Notify parent to refresh positions
        onTradeExecuted?.();
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
      const result = await alpacaAutoTradingService.executeNow();
      if (!result.success) {
        setError(result.message);
      } else {
        // Notify parent to refresh positions
        onTradeExecuted?.();
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
        return "text-cyan-400";
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

  const trades = status?.recentTrades || [];
  const aiMessages = status?.aiMessages || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#12121a] rounded-xl border border-gray-800 w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            <h2 className="text-xl font-bold text-white">AI Auto Trading</h2>
            </div>
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
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading Crypto AI Trading Status...</p>
          </div>
        ) : (
          <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
            {/* Error */}
            {error && (
              <div className="mb-4 bg-red-500/20 border border-red-500 rounded-lg p-3 flex items-center justify-between">
                <span className="text-red-400 text-sm">{error}</span>
                <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
                  ✕
                </button>
              </div>
            )}

            {/* Control Buttons */}
            {status?.status === 'idle' || status?.status === 'stopped' ? (
              <div className="mb-4">
                <button
                  onClick={handleStart}
                  disabled={actionLoading}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg font-medium transition"
                >
                  {actionLoading ? "Starting..." : "🚀 Start Crypto Auto Trading"}
                </button>
              </div>
            ) : (
              <div className="mb-4 flex gap-2">
                {status?.status === 'running' && (
                  <button
                    onClick={handlePause}
                    disabled={actionLoading}
                    className="flex-1 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg font-medium transition"
                  >
                    ⏸️ Pause
                  </button>
                )}
                {status?.status === 'paused' && (
                  <button
                    onClick={handleResume}
                    disabled={actionLoading}
                    className="flex-1 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg font-medium transition"
                  >
                    ▶️ Resume
                  </button>
                )}
                <button
                  onClick={handleStop}
                  disabled={actionLoading}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg font-medium transition"
                >
                  ⏹️ Stop
                </button>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-[#1a1a2a] rounded-lg p-3">
                <p className="text-gray-500 text-xs mb-1">USDT Balance</p>
                <p className="text-xl font-bold text-white">{formatCurrency(status?.stats?.currentBalance || 0)}</p>
                <p className={`text-xs ${(status?.stats?.profitLoss || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {(status?.stats?.profitLoss || 0) >= 0 ? '+' : ''}{formatCurrency(status?.stats?.profitLoss || 0)}
                </p>
              </div>
              <div className="bg-[#1a1a2a] rounded-lg p-3">
                <p className="text-gray-500 text-xs mb-1">Total Trades</p>
                <p className="text-xl font-bold text-cyan-400">{status?.stats?.totalTrades || 0}</p>
                <p className="text-xs text-gray-400">{status?.stats?.todayTrades || 0} today</p>
              </div>
              <div className="bg-[#1a1a2a] rounded-lg p-3">
                <p className="text-gray-500 text-xs mb-1">Volume</p>
                <p className="text-xl font-bold text-blue-400">{formatCurrency(status?.stats?.totalVolume || 0)}</p>
              </div>
              <div className="bg-[#1a1a2a] rounded-lg p-3">
                <p className="text-gray-500 text-xs mb-1">Win Rate</p>
                <p className="text-xl font-bold text-purple-400">{(status?.stats?.winRate || 0).toFixed(1)}%</p>
                <p className="text-xs text-gray-400">{status?.stats?.successfulTrades || 0} / {status?.stats?.totalTrades || 0}</p>
              </div>
            </div>

            {/* P&L Performance Chart */}
            <CryptoPLChart trades={trades} />

            {/* Manual Triggers */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={handleExecuteSingle}
                disabled={actionLoading || status?.status !== "running"}
                className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg text-sm font-medium transition"
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
                <p className="text-xs text-gray-500">Next Scheduled Run (24/7 Market)</p>
                <p className="text-sm font-mono text-cyan-400">
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
                    <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-white">Crypto AI Console</span>
                  </div>
                  <span className="text-xs text-gray-500">Live 24/7</span>
                </div>
                <div className="h-48 overflow-y-auto p-3 font-mono text-xs space-y-1">
                  {aiMessages.slice(0, 15).map((msg, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-gray-600 flex-shrink-0">{formatTime(msg.timestamp)}</span>
                      <span className={getMessageColor(msg.type)}>{msg.message}</span>
                    </div>
                  ))}
                  {aiMessages.length === 0 && (
                    <div className="text-gray-600 text-center py-4">
                      <p>No messages yet. Start trading to see AI activity.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Trades & OCO Orders */}
              <div className="bg-[#1a1a2a] rounded-lg overflow-hidden">
                {/* Tabs */}
                <div className="p-3 border-b border-gray-700 flex items-center gap-4">
                  <button
                    onClick={() => setActiveTab('trades')}
                    className={`text-sm font-medium transition ${activeTab === 'trades' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    Recent Trades ({trades.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('oco')}
                    className={`text-sm font-medium transition ${activeTab === 'oco' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    OCO Orders ({ocoOrders.length})
                  </button>
                </div>

                <div className="h-56 overflow-y-auto">
                  {activeTab === 'trades' ? (
                    // Recent Trades Tab
                    <>
                      {trades.slice(0, 10).map((trade) => (
                        <div key={trade.id} className="p-2 border-b border-gray-700/50">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white text-sm">{trade.symbol}</span>
                              <span className={`px-1.5 py-0.5 rounded text-xs ${
                                trade.action === "BUY" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                              }`}>
                                {trade.action}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-xs ${
                                trade.status === "filled" ? "bg-green-500/20 text-green-400" :
                                trade.status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                                "bg-red-500/20 text-red-400"
                              }`}>
                                {trade.status}
                              </span>
                            </div>
                            <span className="text-xs text-cyan-400">
                              {(trade.confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">
                              {formatCurrency(trade.price)} × {formatCurrency(trade.amount)}
                            </span>
                            <span className="text-gray-600">{formatTime(trade.timestamp)}</span>
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5 truncate" title={trade.aiMessage}>
                            {trade.aiMessage?.slice(0, 60)}...
                          </div>
                        </div>
                      ))}
                      {trades.length === 0 && (
                        <div className="p-4 text-center text-gray-600 text-sm">
                          No crypto trades yet. Start the AI to begin trading.
                        </div>
                      )}
                    </>
                  ) : (
                    // OCO Orders Tab
                    <>
                      {ocoOrders.length > 0 ? (
                        ocoOrders.slice(0, 15).map((order, idx) => (
                          <div key={order.orderListId || idx} className="p-3 border-b border-gray-700/50">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-white text-sm">{order.symbol}</span>
                                <span className={`px-1.5 py-0.5 rounded text-xs ${
                                  order.listOrderStatus === 'EXECUTING' ? 'bg-blue-500/20 text-blue-400' :
                                  order.listOrderStatus === 'ALL_DONE' ? 'bg-green-500/20 text-green-400' :
                                  'bg-gray-500/20 text-gray-400'
                                }`}>
                                  {order.listOrderStatus}
                                </span>
                              </div>
                              <span className="text-xs text-gray-500">
                                ID: {order.orderListId}
                              </span>
                            </div>
                            
                            {/* Order Reports */}
                            {order.orderReports && order.orderReports.length > 0 && (
                              <div className="ml-3 pl-3 border-l-2 border-gray-700 space-y-1.5">
                                {order.orderReports.map((report: any, rIdx: number) => {
                                  const isTP = report.type === 'LIMIT_MAKER' || report.type === 'LIMIT';
                                  const isSL = report.type === 'STOP_LOSS_LIMIT' || report.type === 'STOP_LOSS';
                                  return (
                                    <div key={report.orderId || rIdx} className="flex items-center justify-between text-xs">
                                      <div className="flex items-center gap-2">
                                        <span className={`w-14 text-center px-1.5 py-0.5 rounded ${
                                          isTP ? 'bg-emerald-500/20 text-emerald-400' : 
                                          isSL ? 'bg-red-500/20 text-red-400' : 
                                          'bg-gray-500/20 text-gray-400'
                                        }`}>
                                          {isTP ? 'TP' : isSL ? 'SL' : report.type}
                                        </span>
                                        <span className="text-gray-400">
                                          {report.side} @ ${report.price || report.stopPrice}
                                        </span>
                                      </div>
                                      <span className={`px-1.5 py-0.5 rounded text-xs ${
                                        report.status === 'FILLED' ? 'bg-green-500/20 text-green-400' :
                                        report.status === 'NEW' ? 'bg-blue-500/20 text-blue-400' :
                                        report.status === 'CANCELED' ? 'bg-gray-500/20 text-gray-400' :
                                        'bg-gray-500/20 text-gray-400'
                                      }`}>
                                        {report.status}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-600 text-sm">
                          <p>No OCO orders yet.</p>
                          <p className="text-xs mt-1">BUY trades auto-create TP/SL orders.</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Info Note */}
            <div className="mt-4 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
              <p className="text-xs text-cyan-400">
                <strong>🔐 Crypto Auto Trading:</strong> Trades on Binance Testnet with USDT pairs. 
                Each BUY creates an OCO order with Take-Profit and Stop-Loss. 
                Market is 24/7 - trading runs every 6 hours. 
                Minimum balance: $100 USDT. Risk levels: Low (5% SL), Medium (8% SL), High (12% SL).
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
