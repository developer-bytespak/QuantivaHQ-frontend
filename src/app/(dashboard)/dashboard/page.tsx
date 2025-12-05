"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { exchangesService, DashboardData } from "@/lib/api/exchanges.service";
import { getTopCoins, CoinGeckoCoin } from "@/lib/api/coingecko.service";

interface Activity {
  id: number;
  type: "buy" | "sell" | "tp" | "sentiment";
  title: string;
  description: string;
  timestamp: string;
  iconColor: string;
  iconBg: string;
}

// Activities will be loaded from backend API when available

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"holdings" | "market">("holdings");
  const [showNewsOverlay, setShowNewsOverlay] = useState(false);
  const [showTradeOverlay, setShowTradeOverlay] = useState(false);
  const [selectedNews, setSelectedNews] = useState<number>(0);
  const [selectedTrade, setSelectedTrade] = useState<number>(0);
  
  // Binance data state
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Store connection ID in component state (not localStorage)
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Ref to track if initialization has happened (prevents duplicate calls)
  const hasInitialized = useRef(false);
  
  // Market data state
  const [marketData, setMarketData] = useState<CoinGeckoCoin[]>([]);
  const [isLoadingMarket, setIsLoadingMarket] = useState(false);

  const newsItems = [
    {
      id: 1,
      title: "Bitcoin Momentum Building",
      description: "Market momentum on 15 U CV in BTC and BTC liquidity returning 90% in last 48 hours. BTC may break out if BTC sustains above $34.500",
      timestamp: "2 min ago",
    },
    {
      id: 2,
      title: "Ethereum Network Upgrade Success",
      description: "ETH network successfully completed its latest upgrade, reducing gas fees by 40% and improving transaction speed. Validators report 99.9% uptime during transition.",
      timestamp: "15 min ago",
    },
  ];

  const trades = [
    {
      id: 1,
      pair: "ETH / USDT",
      type: "BUY",
      confidence: "HIGH",
      entry: "$2,120",
      stopLoss: "$120",
      takeProfit1: "$240",
      additionalInfo: "20,045-",
      ext: "22,000",
      entryShort: "1,020",
      stopLossShort: "1.317 $",
      progressMin: "$790",
      progressMax: "$200",
      progressPercent: 75,
      reasons: [
        "Bullish momentum on 1h and 4h charts",
        "Sentiment improved 20% in last 3 hours",
        "High liquidity reduces execution risk"
      ]
    },
    {
      id: 2,
      pair: "BTC / USDT",
      type: "SELL",
      confidence: "MEDIUM",
      entry: "$34,500",
      stopLoss: "$35,200",
      takeProfit1: "$33,800",
      additionalInfo: "15,230-",
      ext: "18,500",
      entryShort: "34,500",
      stopLossShort: "35,200 $",
      progressMin: "$520",
      progressMax: "$150",
      progressPercent: 60,
      reasons: [
        "Resistance level at $35,000 showing strong rejection",
        "Volume declining on upward moves",
        "RSI showing bearish divergence on 4h timeframe"
      ]
    },
  ];

  // Fetch active connection from backend (secure, no localStorage)
  const fetchActiveConnection = useCallback(async () => {
    try {
      const response = await exchangesService.getActiveConnection();
      setConnectionId(response.data.connection_id);
      return response.data.connection_id;
    } catch (err: any) {
      // Silently handle 401 errors (not logged in) - this is expected
      if (err?.status !== 401 && err?.statusCode !== 401) {
        console.error("Failed to fetch active connection:", err);
      }
      setError("No active connection found. Please connect your exchange account.");
      setIsLoading(false);
      return null;
    }
  }, []);

  // Fetch dashboard data (only uses combined dashboard API)
  const fetchDashboardData = useCallback(async (connId: string, isInitial = false) => {
    try {
      // Only show loading on initial load, not on polling updates
      if (isInitial) {
        setIsLoading(true);
      }
      setError(null);
      
      // Use combined dashboard endpoint - single API call for all data
      const response = await exchangesService.getDashboard(connId);
      
      // Smooth state update without full re-render
      setDashboardData((prev) => {
        // Only update if data actually changed (prevents unnecessary re-renders)
        if (prev && JSON.stringify(prev) === JSON.stringify(response.data)) {
          return prev;
        }
        return response.data;
      });
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error("Failed to fetch dashboard data:", err);
      // Only show error on initial load, silent updates on polling
      if (isInitial) {
        setError(err.message || "Failed to load dashboard data. Please try again.");
      }
    } finally {
      if (isInitial) {
        setIsLoading(false);
        setIsInitialLoad(false);
      }
    }
  }, []);

  // Initial load: fetch connection, then fetch data (runs only once on mount)
  useEffect(() => {
    // Prevent re-initialization (especially in React Strict Mode)
    if (hasInitialized.current) return;
    
    const initializeDashboard = async () => {
      hasInitialized.current = true;
      const connId = await fetchActiveConnection();
      if (connId) {
        await fetchDashboardData(connId, true);
      }
    };
    
    initializeDashboard();
    // Empty deps - run only once on mount
  }, []);

  // Polling: only update data, no loading state, no connection fetch
  useEffect(() => {
    if (!connectionId || isInitialLoad) return;

    // Set up polling every 30 seconds (reduced from 8s to save resources)
    // Silent updates - no loading state, smooth transitions
    const pollInterval = setInterval(() => {
      if (connectionId) {
        fetchDashboardData(connectionId, false);
      }
    }, 30000); // 30 seconds instead of 8 seconds

    return () => clearInterval(pollInterval);
    // Remove fetchDashboardData from deps - it's stable with useCallback
  }, [connectionId, isInitialLoad]);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Format percentage
  const formatPercent = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}%`;
  };

  // Format large numbers (market cap, volume)
  const formatLargeNumber = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  // Fetch market data when market tab is active
  const fetchMarketData = useCallback(async () => {
    setIsLoadingMarket(true);
    try {
      const coins = await getTopCoins(5);
      setMarketData(coins);
    } catch (error) {
      console.error("Failed to fetch market data:", error);
    } finally {
      setIsLoadingMarket(false);
    }
  }, []);

  // Fetch market data when market tab is selected
  useEffect(() => {
    if (activeTab === "market") {
      fetchMarketData();
    }
  }, [activeTab, fetchMarketData]);

  return (
    <div className="space-y-6 pb-8">
      {/* Error Display */}
      {error && (
        <div className="rounded-lg border-l-4 border-red-500/50 bg-red-500/10 p-4">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 shrink-0 text-red-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-red-200">{error}</p>
              <button
                onClick={() => {
                  if (connectionId) {
                    fetchDashboardData(connectionId, true);
                  } else {
                    fetchActiveConnection().then((connId) => {
                      if (connId) {
                        fetchDashboardData(connId, true);
                      }
                    });
                  }
                }}
                className="mt-2 text-xs text-red-300 hover:text-red-200 underline"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - Main Dashboard Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Portfolio - Main Box with Two Inner Boxes */}
          <div className="rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-6 backdrop-blur shadow-xl shadow-blue-900/10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Portfolio</h2>
              {lastUpdated && (
                <p className="text-xs text-slate-400">
                  Updated {lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>

            {isLoading && !dashboardData ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700/30 border-t-[#fc4f02]"></div>
              </div>
            ) : dashboardData ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Total Profit Value Inner Box */}
                <div className="rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4">
                  <p className="mb-2 text-xs text-slate-400">Total Portfolio Value</p>
                  <p className="mb-2 text-2xl font-bold text-white">
                    {formatCurrency(dashboardData.portfolio.totalValue)}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${dashboardData.portfolio.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(dashboardData.portfolio.totalPnl)}
                    </span>
                    <span className={`text-sm ${dashboardData.portfolio.pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ({formatPercent(dashboardData.portfolio.pnlPercent)})
                    </span>
                  </div>
                </div>

                {/* Active Strategies Inner Box */}
                <div className="rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4">
                  <p className="mb-2 text-xs text-slate-400">Active Positions</p>
                  <p className="mb-2 text-2xl font-bold text-white">
                    {dashboardData.positions.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-400">
                      {dashboardData.orders.filter(o => o.status === 'NEW' || o.status === 'PARTIALLY_FILLED').length} open orders
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {dashboardData.positions.length} {dashboardData.positions.length === 1 ? 'position' : 'positions'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                No portfolio data available
              </div>
            )}
          </div>

          {/* Action Center - Recent Activities */}
          <div className="rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-6 backdrop-blur shadow-xl shadow-blue-900/10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Action Center</h2>
            </div>
            <div className="space-y-4">
              <div className="py-8 text-center text-slate-400">
                <p className="text-sm">No activities yet</p>
                <p className="mt-1 text-xs text-slate-500">Activities will appear here when available</p>
              </div>
            </div>
          </div>

          {/* Holdings & Market */}
          <div className="rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 backdrop-blur shadow-xl shadow-blue-900/10">
            <div className="border-b border-[--color-border] p-6 pb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Holdings & Market</h2>
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
                    Market
                  </button>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto p-6">
              {activeTab === "holdings" ? (
              <table className="w-full">
                <thead className="divide-y divide-[--color-border]">
                  <tr className="group/row relative hover:bg-[--color-surface]/40 transition-colors before:absolute before:left-0 before:top-1/2 before:h-8 before:w-1 before:-translate-y-1/2 before:rounded-r-full before:bg-gradient-to-b before:from-[#fc4f02] before:to-[#fda300] before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100">
                    <th className="py-3 text-sm font-medium text-white text-left">Assets</th>
                    <th className="py-3 text-sm font-medium text-white text-left">holding</th>
                    <th className="py-3 text-sm font-medium text-white text-left">values</th>
                    <th className="py-3 text-sm font-medium text-white text-left">entry</th>
                    <th className="py-3 text-sm font-medium text-white text-left">P/L</th>
                    <th className="py-3 text-sm font-medium text-white text-left">P/L value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[--color-border]">
                  {isLoading && !dashboardData ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center">
                        <div className="flex items-center justify-center">
                          <div className="h-6 w-6 animate-spin rounded-full border-4 border-slate-700/30 border-t-[#fc4f02]"></div>
                        </div>
                      </td>
                    </tr>
                  ) : dashboardData && dashboardData.positions.length > 0 ? (
                    dashboardData.positions.map((position, index) => {
                      const symbol = position.symbol.replace('USDT', '').replace('BUSD', '');
                      return (
                        <tr
                          key={index}
                          className="group/row relative hover:bg-[--color-surface]/40 transition-colors before:absolute before:left-0 before:top-1/2 before:h-8 before:w-1 before:-translate-y-1/2 before:rounded-r-full before:bg-gradient-to-b before:from-[#fc4f02] before:to-[#fda300] before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100"
                        >
                          <td className="py-3 text-sm font-medium text-white">{symbol}</td>
                          <td className="py-3 text-sm text-slate-300">{position.quantity.toFixed(4)}</td>
                          <td className="py-3 text-sm text-slate-300">{formatCurrency(position.currentPrice * position.quantity)}</td>
                          <td className="py-3 text-sm text-slate-300">{formatCurrency(position.entryPrice)}</td>
                          <td className={`py-3 text-sm font-medium ${position.pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {formatPercent(position.pnlPercent)}
                          </td>
                          <td className={`py-3 text-sm text-slate-400 ${position.unrealizedPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {formatCurrency(position.unrealizedPnl)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No positions found
                      </td>
                    </tr>
                  )}
                  </tbody>
                </table>
              ) : (
                <div className="space-y-4">
                  {isLoadingMarket ? (
                    <div className="py-8 text-center">
                      <div className="flex items-center justify-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-4 border-slate-700/30 border-t-[#fc4f02]"></div>
                      </div>
                    </div>
                  ) : marketData.length > 0 ? (
                    <>
                      <div className="w-full -ml-6">
                        <table className="w-full table-auto">
                          <colgroup>
                            <col style={{ width: '25%' }} />
                            <col style={{ width: '20%' }} />
                            <col style={{ width: '20%' }} />
                            <col style={{ width: '17.5%' }} />
                            <col style={{ width: '17.5%' }} />
                          </colgroup>
                          <thead className="divide-y divide-[--color-border]">
                            <tr className="group/row relative hover:bg-[--color-surface]/40 transition-colors before:absolute before:left-0 before:top-1/2 before:h-8 before:w-1 before:-translate-y-1/2 before:rounded-r-full before:bg-gradient-to-b before:from-[#fc4f02] before:to-[#fda300] before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100">
                              <th className="py-3 pr-2 pl-0 text-left text-xs sm:text-sm font-medium text-white">Assets</th>
                              <th className="py-3 px-2 text-left text-xs sm:text-sm font-medium text-white">price</th>
                              <th className="py-3 px-2 text-left text-xs sm:text-sm font-medium text-white">24h change</th>
                              <th className="py-3 px-2 text-left text-xs sm:text-sm font-medium text-white hidden sm:table-cell">Market cap</th>
                              <th className="py-3 px-2 text-left text-xs sm:text-sm font-medium text-white hidden md:table-cell">volume (24h)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[--color-border]">
                            {marketData.map((coin) => (
                              <tr
                                key={coin.id}
                                className="group/row relative hover:bg-[--color-surface]/40 transition-colors before:absolute before:left-0 before:top-1/2 before:h-8 before:w-1 before:-translate-y-1/2 before:rounded-r-full before:bg-gradient-to-b before:from-[#fc4f02] before:to-[#fda300] before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100"
                              >
                                <td className="py-3 pr-2 pl-0 text-left">
                                  <div className="flex items-center justify-start gap-2 sm:gap-3">
                                    <img src={coin.image} alt={coin.name} className="h-6 w-6 sm:h-8 sm:w-8 rounded-full flex-shrink-0" />
                                    <div className="text-left min-w-0">
                                      <p className="text-xs sm:text-sm font-medium text-white truncate">{coin.name}</p>
                                      <p className="text-[10px] sm:text-xs text-slate-400 uppercase">{coin.symbol}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-2 text-left text-xs sm:text-sm font-medium text-white whitespace-nowrap">{formatCurrency(coin.current_price)}</td>
                                <td className={`py-3 px-2 text-left text-xs sm:text-sm font-medium whitespace-nowrap ${coin.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {formatPercent(coin.price_change_percentage_24h)}
                                </td>
                                <td className="py-3 px-2 text-left text-xs sm:text-sm text-slate-300 whitespace-nowrap hidden sm:table-cell">{formatLargeNumber(coin.market_cap)}</td>
                                <td className="py-3 px-2 text-left text-xs sm:text-sm text-slate-300 whitespace-nowrap hidden md:table-cell">{formatLargeNumber(coin.total_volume)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="pt-4 text-center">
                        <button
                          onClick={() => router.push("/dashboard/market")}
                          className="rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#fc4f02]/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#fc4f02]/40"
                        >
                          View More
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="py-8 text-center text-slate-400">
                      <p className="text-sm">Failed to load market data</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Trade & AI Insights */}
        <div className="space-y-6">
          {/* Trade Section */}
          <div className="space-y-2">
            {/* Trade Header - Outside Box */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Trade</h2>
              <button
                onClick={() => router.push("/dashboard/top-trades")}
                className="rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-3 py-1.5 text-xs font-medium text-white transition-all duration-300 hover:text-white hover:scale-105 shadow-lg shadow-[#fc4f02]/30"
              >
                View All Trades
              </button>
            </div>

            {/* Trade Cards */}
            <div className="space-y-3">
              {trades.map((trade, index) => (
                <div key={trade.id} className="rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-6 backdrop-blur shadow-xl shadow-blue-900/10">
                  {/* Top Trade Opportunity */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-lg px-3 py-1 text-sm font-semibold text-white ${trade.type === "BUY"
                        ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300]"
                        : "bg-gradient-to-r from-red-500 to-red-600"
                        }`}>
                        {trade.type}
                      </span>
                      <span className="text-sm font-medium text-white">{trade.pair}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs text-slate-300 ${trade.confidence === "HIGH" ? "bg-slate-700" : "bg-slate-600"
                        }`}>{trade.confidence}</span>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs text-slate-400">Ext. {trade.ext}</p>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-400">Entry</span>
                        <span className="font-medium text-white">{trade.entryShort}</span>
                        <span className="text-slate-500">&gt;</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-400">Stop Loss</span>
                        <span className="font-medium text-white">{trade.stopLossShort}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>{trade.progressMin}</span>
                        <span>{trade.progressMax}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                          className={`h-full bg-gradient-to-r ${trade.type === "BUY"
                            ? "from-green-500 to-emerald-500"
                            : "from-red-500 to-red-600"
                            }`}
                          style={{ width: `${trade.progressPercent}%` }}
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
                          setSelectedTrade(index);
                          setShowTradeOverlay(true);
                        }}
                        className="rounded-xl border border-[--color-border] bg-[--color-surface] px-4 py-2.5 text-sm font-medium text-slate-300 transition-all duration-300 hover:border-[#fc4f02]/50 hover:text-white"
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
          <div className="space-y-2">
            {/* AI Insights Header - Outside Box */}
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
            <div className="space-y-3">
              {newsItems.map((news, index) => (
                <div
                  key={news.id}
                  onClick={() => {
                    setSelectedNews(index);
                    setShowNewsOverlay(true);
                  }}
                  className="cursor-pointer rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-6 backdrop-blur shadow-xl shadow-blue-900/10"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">{news.timestamp}</span>
                      <button className="text-slate-400 hover:text-white transition-colors">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
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
        </div>
      </div>

      {/* Trade Details Overlay */}
      {showTradeOverlay && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowTradeOverlay(false)}
        >
          <div
            className="relative mx-4 w-full max-w-2xl rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/95 to-[--color-surface-alt]/90 p-6 shadow-2xl shadow-black/50 backdrop-blur"
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
            <div className="space-y-6">
              {/* Pair and Type */}
              <div className="flex items-center gap-3">
                <span className={`rounded-lg px-4 py-2 text-base font-semibold text-white ${trades[selectedTrade].type === "BUY"
                    ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300]"
                    : "bg-gradient-to-r from-red-500 to-red-600"
                  }`}>
                  {trades[selectedTrade].type}
                </span>
                <span className="text-lg font-medium text-white">{trades[selectedTrade].pair}</span>
                <span className="rounded-full bg-slate-700 px-3 py-1 text-sm text-slate-300">{trades[selectedTrade].confidence}</span>
              </div>

              {/* Trade Details */}
              <div className="space-y-4 rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Entry</span>
                  <span className="text-base font-medium text-white">{trades[selectedTrade].entry}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Stop-Loss</span>
                  <span className="text-base font-medium text-white">{trades[selectedTrade].stopLoss}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Take Profit 1</span>
                  <span className="text-base font-medium text-white">{trades[selectedTrade].takeProfit1}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Additional Info</span>
                  <span className="text-base font-medium text-slate-300">{trades[selectedTrade].additionalInfo}</span>
                </div>
              </div>

              {/* Reasons */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white">Reasons</h3>
                {trades[selectedTrade].reasons.map((reason: string, index: number) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-green-400" />
                    <p className="text-sm text-slate-300">{reason}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* News Overlay */}
      {showNewsOverlay && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowNewsOverlay(false)}
        >
          <div
            className="relative mx-4 w-full max-w-2xl rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/95 to-[--color-surface-alt]/90 p-6 shadow-2xl shadow-black/50 backdrop-blur"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">{newsItems[selectedNews].title}</h2>
              <button
                onClick={() => setShowNewsOverlay(false)}
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

            {/* Timestamp */}
            <div className="mb-4 flex items-center gap-2">
              <span className="text-xs text-slate-400">{newsItems[selectedNews].timestamp}</span>
                  </div>

            {/* Description */}
            <div className="space-y-4">
              <div className="space-y-2 text-sm leading-relaxed text-slate-300">
                <p>{newsItems[selectedNews].description}</p>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

