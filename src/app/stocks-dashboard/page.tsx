"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useStocksMarket, useStocksSectors } from "@/hooks/useStocksMarket";
import { exchangesService, DashboardData } from "@/lib/api/exchanges.service";
import {
  formatMarketCap,
  formatPrice,
  formatPercent,
  formatVolume,
  formatTimeAgo,
  getChangeColorClass,
} from "@/lib/utils/format";
import { MarketTable } from "@/components/market/MarketTable";

interface Activity {
  id: number;
  type: "buy" | "sell" | "tp" | "earnings" | "rebalance";
  title: string;
  description: string;
  timestamp: string;
  iconColor: string;
  iconBg: string;
}

interface Holding {
  symbol: string;
  name: string;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  marketValue: number;
  pl: number;
  plPercent: number;
  dayChange: number;
  weight: number;
}

const allActivities: Activity[] = [
  {
    id: 1,
    type: "buy",
    title: "BUY 50 AAPL at $182.45",
    description: "New signal: AAPL high confidence",
    timestamp: "2m ago",
    iconColor: "text-green-400",
    iconBg: "bg-green-500/20",
  },
  {
    id: 2,
    type: "tp",
    title: "MSFT TP1 hit (+3.2%)",
    description: "Take profit target reached",
    timestamp: "12m ago",
    iconColor: "text-blue-400",
    iconBg: "bg-blue-500/20",
  },
  {
    id: 3,
    type: "earnings",
    title: "NVDA earnings today 4PM",
    description: "Q4 earnings report scheduled",
    timestamp: "18m ago",
    iconColor: "text-yellow-400",
    iconBg: "bg-yellow-500/20",
  },
  {
    id: 4,
    type: "rebalance",
    title: "Portfolio rebalanced: +$1,240",
    description: "Automatic rebalancing executed",
    timestamp: "35m ago",
    iconColor: "text-purple-400",
    iconBg: "bg-purple-500/20",
  },
  {
    id: 5,
    type: "buy",
    title: "BUY 25 GOOGL at $122.93",
    description: "Bullish momentum detected",
    timestamp: "1h ago",
    iconColor: "text-green-400",
    iconBg: "bg-green-500/20",
  },
];

const dashboardTrades = [
  {
    id: 1,
    symbol: "AAPL",
    type: "BUY",
    confidence: "HIGH",
    entry: "$182.45",
    stopLoss: "$176.20",
    tp1: "$189.50",
    tp2: "$195.00",
    progress: 65,
    insights: [
      "Earnings beat, guidance raised 12%",
      "Breakout above 200-day MA with volume",
      "Sentiment improving: 78% positive mentions",
    ],
  },
  {
    id: 2,
    symbol: "MSFT",
    type: "BUY",
    confidence: "HIGH",
    entry: "$203.64",
    stopLoss: "$198.00",
    tp1: "$210.00",
    tp2: "$218.50",
    progress: 45,
    insights: [
      "Azure cloud revenue surges 25% YoY",
      "AI integration driving enterprise adoption",
      "Strong technical breakout pattern",
    ],
  },
  {
    id: 3,
    symbol: "NVDA",
    type: "BUY",
    confidence: "HIGH",
    entry: "$254.86",
    stopLoss: "$245.00",
    tp1: "$265.00",
    tp2: "$275.00",
    progress: 55,
    insights: [
      "Strong GPU demand for AI workloads",
      "Data center revenue growth accelerating",
      "Positive analyst upgrades across board",
    ],
  },
];

export default function StocksDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"holdings" | "market">("holdings");
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [showTradeOverlay, setShowTradeOverlay] = useState(false);
  const [selectedTradeIndex, setSelectedTradeIndex] = useState<number>(0);
  const [showHoldingOverlay, setShowHoldingOverlay] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState<Holding | null>(null);

  // Connection and dashboard data state
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const hasInitialized = useRef(false);

  // Fetch active connection from backend
  const fetchActiveConnection = useCallback(async () => {
    try {
      const response = await exchangesService.getActiveConnection();
      setConnectionId(response.data.connection_id);
      return response.data.connection_id;
    } catch (err: any) {
      if (err?.status !== 401 && err?.statusCode !== 401) {
        console.error("Failed to fetch active connection:", err);
      }
      setProfileError("No active connection found.");
      setIsLoadingProfile(false);
      return null;
    }
  }, []);

  // Fetch dashboard/profile data
  const fetchDashboardData = useCallback(async (connId: string) => {
    try {
      setIsLoadingProfile(true);
      const response = await exchangesService.getDashboard(connId);
      setDashboardData(response.data);
    } catch (err: any) {
      console.error("Failed to fetch dashboard data:", err);
      setProfileError(err.message || "Failed to load profile data.");
    } finally {
      setIsLoadingProfile(false);
    }
  }, []);

  // Initial load: fetch connection and profile data
  useEffect(() => {
    if (hasInitialized.current) return;
    
    const initialize = async () => {
      hasInitialized.current = true;
      const connId = await fetchActiveConnection();
      if (connId) {
        await fetchDashboardData(connId);
      }
    };
    
    initialize();
  }, [fetchActiveConnection, fetchDashboardData]);

  // Fetch market data for S&P 500 stocks (only when market tab is active)
  const {
    data: marketStocks,
    loading: marketLoading,
    error: marketError,
    warnings: marketWarnings,
    timestamp: marketTimestamp,
    refresh: refreshMarket,
    nextRefreshIn,
  } = useStocksMarket({
    limit: 5, // Show top 5 stocks on dashboard
    autoRefresh: activeTab === "market", // Only auto-refresh when market tab is active
    refreshInterval: 5 * 60 * 1000, // 5 minutes
    enabled: activeTab === "market", // Only fetch when market tab is active
  });

  // Fetch all stocks for market overview calculation (always enabled on dashboard)
  const {
    data: allStocks,
    loading: allStocksLoading,
  } = useStocksMarket({
    limit: 500, // Fetch all stocks for sentiment calculation
    autoRefresh: true, // Always auto-refresh on dashboard
    refreshInterval: 5 * 60 * 1000, // 5 minutes
    enabled: true, // Always fetch market overview data on dashboard
  });

  // Calculate market overview data
  const marketOverview = useMemo(() => {
    if (!allStocks || allStocks.length === 0) {
      return {
        sp500: { price: 0, change: 0 },
        nasdaq: { price: 0, change: 0 },
        dow: { price: 0, change: 0 },
        vix: { value: 0, level: 'Low' as 'Low' | 'Moderate' | 'High' },
        sentiment: { label: 'Neutral' as 'Bullish' | 'Neutral' | 'Bearish', percentage: 0 },
      };
    }

    // Find major indices
    const spy = allStocks.find(s => s.symbol === 'SPY');
    const qqq = allStocks.find(s => s.symbol === 'QQQ');
    const dia = allStocks.find(s => s.symbol === 'DIA');

    // Calculate market sentiment (% of stocks with positive change)
    const positiveStocks = allStocks.filter(s => s.changePercent24h > 0).length;
    const sentimentPercentage = (positiveStocks / allStocks.length) * 100;
    
    let sentimentLabel: 'Bullish' | 'Neutral' | 'Bearish' = 'Neutral';
    if (sentimentPercentage > 55) sentimentLabel = 'Bullish';
    else if (sentimentPercentage < 45) sentimentLabel = 'Bearish';

    // Estimate VIX level from market volatility (simplified)
    const avgAbsChange = allStocks.reduce((sum, s) => sum + Math.abs(s.changePercent24h), 0) / allStocks.length;
    let vixLevel: 'Low' | 'Moderate' | 'High' = 'Low';
    let vixValue = avgAbsChange * 10; // Rough approximation
    if (vixValue > 25) vixLevel = 'High';
    else if (vixValue > 15) vixLevel = 'Moderate';

    return {
      sp500: { price: spy?.price || 0, change: spy?.changePercent24h || 0 },
      nasdaq: { price: qqq?.price || 0, change: qqq?.changePercent24h || 0 },
      dow: { price: dia?.price || 0, change: dia?.changePercent24h || 0 },
      vix: { value: vixValue, level: vixLevel },
      sentiment: { label: sentimentLabel, percentage: sentimentPercentage },
    };
  }, [allStocks]);

  // Holding data for the card on dashboard
  const dashboardHolding: Holding = {
    symbol: "AAPL",
    name: "Apple Inc.",
    quantity: 150,
    avgCost: 168.50,
    currentPrice: 182.45,
    marketValue: 27367.50,
    pl: 2092.50,
    plPercent: 8.20,
    dayChange: 0.62,
    weight: 11.0,
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - Main Dashboard Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Portfolio - Main Box with Two Inner Boxes */}
          <div className="rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)] bg-gradient-to-br from-white/[0.07] to-transparent p-6 backdrop-blur">
            <h2 className="mb-4 text-lg font-semibold text-white">Portfolio</h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Total Portfolio Value Inner Box */}
              <div className="rounded-xl bg-gradient-to-br from-white/[0.07] to-transparent p-4">
                <p className="mb-2 text-xs text-slate-400">Total Portfolio Value</p>
                <p className="mb-2 text-2xl font-bold text-white">
                  {isLoadingProfile ? "Loading..." : `$${dashboardData?.portfolio?.totalValue?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`}
                </p>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${(dashboardData?.portfolio?.totalPnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {(dashboardData?.portfolio?.totalPnl || 0) >= 0 ? '+' : ''}${Math.abs(dashboardData?.portfolio?.totalPnl || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className={`text-sm ${(dashboardData?.portfolio?.pnlPercent || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ({(dashboardData?.portfolio?.pnlPercent || 0) >= 0 ? '+' : ''}{(dashboardData?.portfolio?.pnlPercent || 0).toFixed(2)}% today)
                  </span>
                </div>
              </div>

              {/* Asset Mix Inner Box */}
              <div className="rounded-xl bg-gradient-to-br from-white/[0.07] to-transparent p-4">
                <p className="mb-2 text-xs text-slate-400">Asset Mix</p>
                <p className="mb-2 text-2xl font-bold text-white">
                  {isLoadingProfile ? "Loading..." : `${dashboardData?.positions?.length || 0} positions`}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-300">
                    {dashboardData?.positions?.length ? `${new Set(dashboardData.positions.map((p: any) => p.sector)).size} sectors` : "No positions"}
                  </span>
                </div>
                {(dashboardData?.positions?.length ?? 0) > 0 && (
                  <div className="mt-2 flex gap-1">
                    <div className="h-2 flex-1 rounded-full bg-blue-500"></div>
                    <div className="h-2 flex-1 rounded-full bg-green-500"></div>
                    <div className="h-2 flex-1 rounded-full bg-orange-500"></div>
                    <div className="h-2 flex-1 rounded-full bg-purple-500"></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Holdings and Portfolio Stats - Horizontal Layout */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Holdings Section */}
            <div className="flex flex-col space-y-2">
              {/* Holdings Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Holdings</h2>
                <button
                  onClick={() => router.push("/dashboard/holdings")}
                  className="rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-3 py-1.5 text-xs font-medium text-white transition-all duration-300 hover:text-white hover:scale-105 shadow-lg shadow-[#fc4f02]/30"
                >
                  View All Holdings
                </button>
              </div>

              {/* Holding Card or Empty State */}
              {isLoadingProfile ? (
                <div className="flex-1 rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)] bg-gradient-to-br from-white/[0.07] to-transparent p-6 backdrop-blur">
                  <div className="flex items-center justify-center h-full">
                    <p className="text-slate-400">Loading holdings...</p>
                  </div>
                </div>
              ) : dashboardData?.positions && dashboardData.positions.length > 0 ? (
                <div
                  onClick={() => {
                    const firstPosition = dashboardData.positions[0];
                    setSelectedHolding({
                      symbol: firstPosition.symbol,
                      name: firstPosition.symbol,
                      quantity: firstPosition.quantity,
                      avgCost: firstPosition.entryPrice,
                      currentPrice: firstPosition.currentPrice,
                      marketValue: firstPosition.quantity * firstPosition.currentPrice,
                      pl: firstPosition.unrealizedPnl,
                      plPercent: firstPosition.pnlPercent,
                      dayChange: 0,
                      weight: 0,
                    });
                    setShowHoldingOverlay(true);
                  }}
                  className="flex-1 rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)] bg-gradient-to-br from-white/[0.07] to-transparent p-6 backdrop-blur cursor-pointer transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="flex flex-col h-full justify-between">
                    <div className="flex items-center justify-between pb-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/20 text-base font-semibold text-white">
                          {dashboardData.positions[0].symbol.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{dashboardData.positions[0].symbol}</h3>
                          <p className="text-sm text-slate-400">{dashboardData.positions[0].symbol}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-semibold text-white">${dashboardData.positions[0].currentPrice.toFixed(2)}</p>
                        <p className={`text-sm font-medium ${dashboardData.positions[0].pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {dashboardData.positions[0].pnlPercent >= 0 ? '+' : ''}{dashboardData.positions[0].pnlPercent.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                    
                    <div className="relative grid grid-cols-2 gap-x-6 gap-y-6 pt-6">
                      <div className="absolute top-0 left-0 right-0 h-[1px] bg-[#fc4f02]/30"></div>
                      <div className="space-y-2">
                        <p className="text-sm text-slate-400">Quantity</p>
                        <p className="text-xl font-semibold text-white">{dashboardData.positions[0].quantity}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-slate-400">Market Value</p>
                        <p className="text-xl font-semibold text-white">${(dashboardData.positions[0].quantity * dashboardData.positions[0].currentPrice).toFixed(2)}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-slate-400">P/L</p>
                        <p className={`text-xl font-semibold ${dashboardData.positions[0].unrealizedPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {dashboardData.positions[0].unrealizedPnl >= 0 ? '+' : ''}${Math.abs(dashboardData.positions[0].unrealizedPnl).toFixed(2)}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-slate-400">P/L %</p>
                        <p className={`text-xl font-semibold ${dashboardData.positions[0].pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {dashboardData.positions[0].pnlPercent >= 0 ? '+' : ''}{dashboardData.positions[0].pnlPercent.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)] bg-gradient-to-br from-white/[0.07] to-transparent p-6 backdrop-blur">
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <p className="text-lg font-semibold text-white mb-2">No Holdings Yet</p>
                    <p className="text-sm text-slate-400">Start investing to see your positions here</p>
                  </div>
                </div>
              )}
            </div>

            {/* Strategy Allocation and Buying Power */}
            <div className="flex flex-col space-y-2">
              {/* Portfolio Stats Container */}
              <div className="flex-1 flex flex-col space-y-3">
                {/* Strategy Allocation */}
                <div className="rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)] bg-gradient-to-br from-white/[0.07] to-transparent p-6 backdrop-blur">
                  <h3 className="mb-2 text-sm font-semibold text-slate-400">Strategy Allocation</h3>
                  <p className="mb-1 text-2xl font-bold text-white">$89,420</p>
                  <p className="mb-4 text-xs text-slate-400">36% of portfolio • 5 active strategies</p>
                  <div className="h-2 w-full rounded-full bg-slate-800">
                    <div className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600" style={{ width: "36%" }}></div>
                  </div>
                </div>

                {/* Buying Power */}
                <div className="flex-1 rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)] bg-gradient-to-br from-white/[0.07] to-transparent p-6 backdrop-blur">
                  <h3 className="mb-2 text-sm font-semibold text-slate-400">Buying Power</h3>
                  <p className="mb-1 text-2xl font-bold text-white">
                    {isLoadingProfile ? "Loading..." : `$${(dashboardData?.balance?.totalValueUSD || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  </p>
                  <p className="mb-4 text-xs text-slate-400">
                    {dashboardData?.balance?.assets?.length ? `${dashboardData.balance.assets.length} asset${dashboardData.balance.assets.length > 1 ? 's' : ''}` : "No cash balance"}
                  </p>
                  <button className="w-full rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:scale-105 shadow-lg shadow-[#fc4f02]/30">
                    Deposit Funds
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Action Center - Recent Activities */}
          <div className="rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)] bg-gradient-to-br from-white/[0.07] to-transparent p-6 backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Action Center</h2>
              <button
                onClick={() => setShowAllActivities(true)}
                className="rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-3 py-1.5 text-xs font-medium text-white transition-all duration-300 hover:text-white hover:scale-105 shadow-lg shadow-[#fc4f02]/30"
              >
                View All Activity
              </button>
            </div>
            <div className="space-y-4">
              {/* Activity Items */}
              {allActivities.slice(0, 3).map((activity) => (
                <div
                  key={activity.id}
                  className="cursor-pointer flex items-start gap-3 rounded-xl bg-gradient-to-br from-white/[0.07] to-transparent p-4 transition-all duration-300 hover:from-white/[0.1] hover:to-transparent hover:scale-[1.01]"
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${activity.iconBg}`}>
                    {activity.type === "buy" ? (
                      <svg className={`h-4 w-4 ${activity.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : activity.type === "tp" ? (
                      <svg className={`h-4 w-4 ${activity.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : activity.type === "earnings" ? (
                      <svg className={`h-4 w-4 ${activity.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    ) : (
                      <svg className={`h-4 w-4 ${activity.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{activity.title}</p>
                    {activity.description && (
                      <p className="text-xs text-slate-400">{activity.description}</p>
                    )}
                    <p className="mt-1 text-xs text-slate-500">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Holdings & Market */}
          <div className="rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)] bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur">
            <div className="relative p-6 pb-4">
              <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-[#fc4f02]/30"></div>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">Holdings & Market</h2>
                  {activeTab === "market" && nextRefreshIn && (
                    <p className="text-xs text-slate-400 mt-1">
                      Next refresh in {Math.floor(nextRefreshIn / 1000 / 60)}m {Math.floor((nextRefreshIn / 1000) % 60)}s
                    </p>
                  )}
                </div>
                <div className="flex gap-2 rounded-lg bg-[--color-surface]/60 p-1">
                  <button
                    onClick={() => setActiveTab("holdings")}
                    className={`rounded-md px-4 py-2 text-xs font-medium transition-all ${activeTab === "holdings"
                      ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white shadow-lg shadow-[#fc4f02]/30"
                      : "text-slate-400 hover:text-white"
                      }`}
                  >
                    My Holdings
                  </button>
                  <button
                    onClick={() => setActiveTab("market")}
                    className={`rounded-md px-4 py-2 text-xs font-medium transition-all ${activeTab === "market"
                      ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white shadow-lg shadow-[#fc4f02]/30"
                      : "text-slate-400 hover:text-white"
                      }`}
                  >
                    S&P 500 Market
                  </button>
                </div>
              </div>
            </div>
            
            {/* Holdings Tab */}
            {activeTab === "holdings" && (
              <div className="overflow-x-auto p-6">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[--color-border]">
                      <th className="pb-3 text-left text-xs font-medium uppercase text-slate-400">Symbol</th>
                      <th className="pb-3 text-left text-xs font-medium uppercase text-slate-400">Quantity</th>
                      <th className="pb-3 text-left text-xs font-medium uppercase text-slate-400">Current Price</th>
                      <th className="pb-3 text-left text-xs font-medium uppercase text-slate-400">Market Value</th>
                      <th className="pb-3 text-left text-xs font-medium uppercase text-slate-400">P/L</th>
                      <th className="pb-3 text-left text-xs font-medium uppercase text-slate-400">Day Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[--color-border]">
                    {isLoadingProfile ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          Loading holdings...
                        </td>
                      </tr>
                    ) : profileError ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          {profileError}
                        </td>
                      </tr>
                    ) : !dashboardData?.positions || dashboardData.positions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          No holdings found
                        </td>
                      </tr>
                    ) : (
                      dashboardData.positions.slice(0, 4).map((position) => (
                        <tr key={position.symbol} className="group/row relative hover:bg-[--color-surface]/40 transition-colors before:absolute before:left-0 before:top-1/2 before:h-8 before:w-1 before:-translate-y-1/2 before:rounded-r-full before:bg-gradient-to-b before:from-[#fc4f02] before:to-[#fda300] before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100">
                          <td className="py-3 text-sm font-medium text-white">{position.symbol}</td>
                          <td className="py-3 text-sm text-slate-300">{position.quantity}</td>
                          <td className="py-3 text-sm text-slate-300">{formatPrice(position.currentPrice)}</td>
                          <td className="py-3 text-sm text-slate-300">{formatPrice(position.quantity * position.currentPrice)}</td>
                          <td className={`py-3 text-sm font-medium ${getChangeColorClass(position.pnlPercent)}`}>
                            {formatPercent(position.pnlPercent)}
                          </td>
                          <td className="py-3 text-sm font-medium text-slate-400">-</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Market Tab - S&P 500 Stocks */}
            {activeTab === "market" && (
              <div>
                <MarketTable 
                  stocks={marketStocks} 
                  loading={marketLoading} 
                  error={marketError} 
                />
                {marketStocks.length > 0 && (
                  <div className="pt-4 text-center">
                    <button
                      onClick={() => router.push("/dashboard/market")}
                      className="rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#fc4f02]/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#fc4f02]/40"
                    >
                      View More
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Market Insights */}
        <div className="space-y-6">
          {/* Top Trades Section */}
          <div className="space-y-2">
            {/* Top Trades Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Trades</h2>
              <button
                onClick={() => router.push("/dashboard/top-trades")}
                className="rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-3 py-1.5 text-xs font-medium text-white transition-all duration-300 hover:text-white hover:scale-105 shadow-lg shadow-[#fc4f02]/30"
              >
                View All Trades
              </button>
            </div>

            {/* Top Trade Cards */}
            <div className="space-y-6">
              {dashboardTrades.slice(0, 2).map((trade, index) => (
                <div
                  key={trade.id}
                  className="rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)] bg-gradient-to-br from-white/[0.07] to-transparent p-6 backdrop-blur cursor-pointer transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-lg px-3 py-1 text-sm font-semibold text-white ${trade.type === "BUY"
                        ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300]"
                        : "bg-gradient-to-r from-red-500 to-red-600"
                        }`}>
                        {trade.type}
                      </span>
                      <span className="text-sm font-medium text-white">{trade.symbol}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs text-slate-300 ${trade.confidence === "HIGH" ? "bg-green-500/20 text-green-400" : "bg-slate-600"
                        }`}>{trade.confidence}</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-400">Entry</span>
                        <span className="font-medium text-white">{trade.entry}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-400">Stop Loss</span>
                        <span className="font-medium text-red-400">{trade.stopLoss}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-400">TP1</span>
                        <span className="font-medium text-green-400">{trade.tp1}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>{trade.entry}</span>
                        <span>{trade.tp1}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                          className={`h-full bg-gradient-to-r ${trade.type === "BUY"
                            ? "from-green-500 to-emerald-500"
                            : "from-red-500 to-red-600"
                            }`}
                          style={{ width: `${trade.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <button className="flex-1 rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#fc4f02]/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#fc4f02]/40">
                        Auto Trade
                      </button>
                      <button
                        onClick={() => {
                          setSelectedTradeIndex(index);
                          setShowTradeOverlay(true);
                        }}
                        className="rounded-xl  bg-[--color-surface] px-4 py-2.5 text-sm font-medium text-slate-300 transition-all duration-300 hover:text-white"
                      >
                        View Trade
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Insights Section */}
          <div className="space-y-2 mt-12">
            {/* AI Insights Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">AI Insights</h2>
              <button
                onClick={() => router.push("/dashboard/ai-insights")}
                className="rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-3 py-1.5 text-xs font-medium text-white transition-all duration-300 hover:text-white hover:scale-105 shadow-lg shadow-[#fc4f02]/30"
              >
                View All AI Insights
              </button>
            </div>

            {/* AI Insights News Cards */}
            <div className="space-y-6">
              {[
                {
                  id: 1,
                  title: "Apple Earnings Beat Expectations",
                  description: "AAPL reported strong Q4 earnings with revenue up 12%. iPhone sales exceeded forecasts. Guidance raised for next quarter.",
                  timestamp: "2 min ago",
                },
                {
                  id: 2,
                  title: "Microsoft Cloud Revenue Surges",
                  description: "MSFT Azure growth accelerates with enterprise adoption. AI integration driving new contract signings. Positive momentum expected.",
                  timestamp: "15 min ago",
                },
              ].map((news) => (
                <div
                  key={news.id}
                  onClick={() => router.push("/dashboard/ai-insights")}
                  className="cursor-pointer rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)] bg-gradient-to-br from-white/[0.07] to-transparent p-6 backdrop-blur transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">{news.timestamp}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* News Heading */}
                    <h3 className="text-base font-semibold text-white">{news.title}</h3>

                    {/* Description */}
                    <div className="space-y-2 text-sm text-slate-300">
                      <p className="line-clamp-2">
                        {news.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Market Data */}
          <div className="rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)] bg-gradient-to-br from-white/[0.07] to-transparent p-6 backdrop-blur">
            <h3 className="mb-4 text-sm font-semibold text-slate-400">Market Overview</h3>
            {allStocksLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-6 rounded bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">S&P 500 (SPY)</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{formatPrice(marketOverview.sp500.price)}</span>
                    <span className={`text-xs font-medium ${getChangeColorClass(marketOverview.sp500.change)}`}>
                      {formatPercent(marketOverview.sp500.change)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">NASDAQ (QQQ)</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{formatPrice(marketOverview.nasdaq.price)}</span>
                    <span className={`text-xs font-medium ${getChangeColorClass(marketOverview.nasdaq.change)}`}>
                      {formatPercent(marketOverview.nasdaq.change)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Dow (DIA)</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{formatPrice(marketOverview.dow.price)}</span>
                    <span className={`text-xs font-medium ${getChangeColorClass(marketOverview.dow.change)}`}>
                      {formatPercent(marketOverview.dow.change)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Volatility</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{marketOverview.vix.value.toFixed(2)}</span>
                    <div className="flex items-center gap-1">
                      <div className={`h-1.5 w-1.5 rounded-full ${
                        marketOverview.vix.level === 'Low' ? 'bg-green-400' :
                        marketOverview.vix.level === 'Moderate' ? 'bg-yellow-400' : 'bg-red-400'
                      }`}></div>
                      <span className="text-xs text-slate-300">{marketOverview.vix.level}</span>
                    </div>
                  </div>
                </div>
                <div className="relative pt-2">
                  <div className="absolute top-0 left-0 right-0 h-[1px] bg-[#fc4f02]/30"></div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Market Sentiment</span>
                    <div className="flex items-center gap-1">
                      <div className={`h-1.5 w-1.5 rounded-full ${
                        marketOverview.sentiment.label === 'Bullish' ? 'bg-green-400' :
                        marketOverview.sentiment.label === 'Neutral' ? 'bg-yellow-400' : 'bg-red-400'
                      }`}></div>
                      <span className={`text-xs font-semibold ${
                        marketOverview.sentiment.label === 'Bullish' ? 'text-green-400' :
                        marketOverview.sentiment.label === 'Neutral' ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {marketOverview.sentiment.label} ({marketOverview.sentiment.percentage.toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trade Details Overlay */}
      {showTradeOverlay && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowTradeOverlay(false)}
        >
          <div
            className="relative mx-4 w-full max-w-2xl rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] bg-gradient-to-br from-white/[0.07] to-transparent p-6 backdrop-blur"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Trade Details</h2>
              <button
                onClick={() => setShowTradeOverlay(false)}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-[--color-surface] hover:text-white"
                aria-label="Close"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Trade Info */}
            {dashboardTrades[selectedTradeIndex] && (
              <div className="space-y-6">
                {/* Symbol and Type */}
                <div className="flex items-center gap-3">
                  <span className={`rounded-lg px-4 py-2 text-base font-semibold text-white ${dashboardTrades[selectedTradeIndex].type === "BUY"
                      ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300]"
                      : "bg-gradient-to-r from-red-500 to-red-600"
                    }`}>
                    {dashboardTrades[selectedTradeIndex].type}
                  </span>
                  <span className="text-lg font-medium text-white">{dashboardTrades[selectedTradeIndex].symbol}</span>
                  <span className="rounded-full bg-slate-700 px-3 py-1 text-sm text-slate-300">{dashboardTrades[selectedTradeIndex].confidence}</span>
                </div>

                {/* Trade Details */}
                <div className="space-y-4 rounded-xl bg-gradient-to-br from-white/[0.07] to-transparent p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Entry</span>
                    <span className="text-base font-medium text-white">{dashboardTrades[selectedTradeIndex].entry}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Stop-Loss</span>
                    <span className="text-base font-medium text-red-400">{dashboardTrades[selectedTradeIndex].stopLoss}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Take Profit 1</span>
                    <span className="text-base font-medium text-green-400">{dashboardTrades[selectedTradeIndex].tp1}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Take Profit 2</span>
                    <span className="text-base font-medium text-green-400">{dashboardTrades[selectedTradeIndex].tp2}</span>
                  </div>
                </div>

                {/* Insights/Reasons */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-white">Insights</h3>
                  {dashboardTrades[selectedTradeIndex].insights.map((insight: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-green-400" />
                      <p className="text-sm text-slate-300">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* All Activities Overlay */}
      {showAllActivities && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowAllActivities(false)}
        >
          <div
            className="relative mx-4 w-full max-w-2xl rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] bg-gradient-to-br from-white/[0.07] to-transparent p-6 backdrop-blur"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">All Activities</h2>
              <button
                onClick={() => setShowAllActivities(false)}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-[--color-surface] hover:text-white"
                aria-label="Close"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Activities List */}
            <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-2">
              {allActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="group/item cursor-pointer flex items-start gap-3 rounded-xl bg-gradient-to-br from-white/[0.07] to-transparent p-4 transition-all duration-300 hover:from-white/[0.1] hover:to-transparent hover:scale-[1.01]"
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${activity.iconBg}`}
                  >
                    {activity.type === "buy" || activity.type === "sell" ? (
                      <svg
                        className={`h-4 w-4 ${activity.iconColor}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d={activity.type === "buy" ? "M5 13l4 4L19 7" : "M19 13l-4 4L5 7"}
                        />
                      </svg>
                    ) : activity.type === "tp" ? (
                      <svg
                        className={`h-4 w-4 ${activity.iconColor}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    ) : activity.type === "earnings" ? (
                      <svg
                        className={`h-4 w-4 ${activity.iconColor}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className={`h-4 w-4 ${activity.iconColor}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{activity.title}</p>
                    {activity.description && (
                      <p className="mt-1 text-xs text-slate-400">{activity.description}</p>
                    )}
                    <p className="mt-1 text-xs text-slate-500">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Holding Details Overlay */}
      {showHoldingOverlay && selectedHolding && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowHoldingOverlay(false)}
        >
          <div
            className="relative mx-4 w-full max-w-2xl rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] bg-gradient-to-br from-white/[0.07] to-transparent p-6 backdrop-blur"
            onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedHolding.name}</h2>
                <p className="mt-1 text-sm text-slate-400">{selectedHolding.symbol}</p>
              </div>
              <button
                onClick={() => setShowHoldingOverlay(false)}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-[--color-surface] hover:text-white"
                aria-label="Close"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Holding Details */}
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-gradient-to-br from-white/[0.07] to-transparent p-4">
                  <p className="text-xs text-slate-400">Quantity</p>
                  <p className="mt-1 text-xl font-bold text-white">{selectedHolding.quantity} shares</p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-white/[0.07] to-transparent p-4">
                  <p className="text-xs text-slate-400">Current Price</p>
                  <p className="mt-1 text-xl font-bold text-white">${selectedHolding.currentPrice.toFixed(2)}</p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-white/[0.07] to-transparent p-4">
                  <p className="text-xs text-slate-400">Average Cost</p>
                  <p className="mt-1 text-xl font-bold text-white">${selectedHolding.avgCost.toFixed(2)}</p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-white/[0.07] to-transparent p-4">
                  <p className="text-xs text-slate-400">Market Value</p>
                  <p className="mt-1 text-xl font-bold text-white">${selectedHolding.marketValue.toLocaleString()}</p>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="space-y-4 rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4">
                <h3 className="text-sm font-semibold text-white">Performance</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400">Profit/Loss</p>
                    <p className="mt-1 text-lg font-bold text-green-400">
                      +${selectedHolding.pl.toLocaleString()} ({selectedHolding.plPercent.toFixed(2)}%)
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Daily Change</p>
                    <p className="mt-1 text-lg font-bold text-green-400">+{selectedHolding.dayChange.toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Portfolio Weight</p>
                    <p className="mt-1 text-lg font-bold text-white">{selectedHolding.weight.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Total Investment</p>
                    <p className="mt-1 text-lg font-bold text-white">
                      ${(selectedHolding.quantity * selectedHolding.avgCost).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button className="flex-1 rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#fc4f02]/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#fc4f02]/40">
                  Buy More
                </button>
                <button className="flex-1 rounded-xl  bg-[--color-surface] px-4 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-[--color-surface-alt]">
                  Sell
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
