"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { exchangesService } from "@/lib/api/exchanges.service";
import CoinDetailHeader from "@/components/market/CoinDetailHeader";
import CoinPriceChart from "@/components/market/CoinPriceChart";
import StockPriceChart from "@/components/market/StockPriceChart";
import TradingPanel from "@/components/market/TradingPanel";
import InfoTab from "@/components/market/InfoTab";
import TradingDataTab from "@/components/market/TradingDataTab";

interface CoinDetailData {
  symbol: string;
  tradingPair: string;
  currentPrice: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  availableBalance: number;
  quoteCurrency: string;
  candles: Array<{
    openTime: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    closeTime: number;
  }>;
}

interface StockDetailData {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  marketCap: number | null;
  volume24h: number;
  high52Week?: number;
  low52Week?: number;
  peRatio?: number;
  dividendYield?: number;
  marketCapFormatted?: string;
  description?: string;
}

export default function MarketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const symbol = params.coinSymbol as string;

  const [coinData, setCoinData] = useState<CoinDetailData | null>(null);
  const [stockData, setStockData] = useState<StockDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [connectionType, setConnectionType] = useState<"crypto" | "stocks" | null>(null);
  const [activeTab, setActiveTab] = useState<"Price" | "Info" | "Trading Data">("Price");
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("1D");
  const [selectedInterval, setSelectedInterval] = useState<string>("1d");

  // Map timeframe to interval
  const timeframeMap: Record<string, string> = {
    "8H": "8h",
    "1D": "1d",
    "1W": "1w",
    "1M": "1M",
    "3M": "1M", // Will need to calculate from startTime
    "6M": "1M", // Will need to calculate from startTime
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get active connection
        const connectionResponse = await exchangesService.getActiveConnection();
        if (!connectionResponse.success || !connectionResponse.data) {
          throw new Error("No active exchange connection found");
        }

        const activeConnection = connectionResponse.data;
        setConnectionId(activeConnection.connection_id);
        setConnectionType(activeConnection.exchange?.type || "crypto");

        if (activeConnection.exchange?.type === "stocks") {
          // Fetch stock detail data
          const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
          const response = await fetch(`${API_BASE_URL}/api/stocks-market/stocks/${symbol.toUpperCase()}`);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch stock data: ${response.status} ${response.statusText}`);
          }
          
          const result = await response.json();
          // Handle both wrapped and unwrapped responses
          const stockInfo = result.success ? result.data : result;
          if (stockInfo && stockInfo.symbol) {
            setStockData(stockInfo as StockDetailData);
          } else {
            console.error("Stock API response:", result);
            throw new Error("Invalid stock data received");
          }
        } else {
          // Crypto logic
          const tradingPair = `${symbol.toUpperCase()}USDT`;
          
          // Fetch coin detail data
          const response = await exchangesService.getCoinDetail(
            activeConnection.connection_id,
            tradingPair
          );

          if (response.success && response.data) {
            setCoinData(response.data as CoinDetailData);
          } else {
            throw new Error("Failed to fetch coin data");
          }
        }
      } catch (err: any) {
        // Silently handle 404 (no connection) - this is expected for users without exchange connection
        if (err?.status !== 404 && err?.statusCode !== 404) {
          console.error("Failed to fetch coin data:", err);
        }
        setError(err.message || "Failed to load coin data");
      } finally {
        setIsLoading(false);
      }
    };

    if (symbol) {
      fetchData();
    }
  }, [symbol]);

  const handleTimeframeChange = (timeframe: string) => {
    setSelectedTimeframe(timeframe);
    const interval = timeframeMap[timeframe] || "1d";
    setSelectedInterval(interval);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700/30 border-t-[#fc4f02]"></div>
      </div>
    );
  }

  if (error || (!coinData && !stockData)) {
    return (
      <div className="p-6">
        <div className="rounded-lg border-l-4 border-red-500/50 bg-red-500/10 p-4">
          <p className="text-sm text-red-200">{error || "Failed to load data"}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 rounded-lg border border-[--color-border] bg-[--color-surface] px-4 py-2 text-sm font-medium text-white transition-colors hover:border-[#fc4f02]/50"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const displayData = connectionType === "stocks" ? stockData : coinData;
  const displaySymbol = connectionType === "stocks" ? stockData?.symbol : coinData?.symbol;
  const displayName = connectionType === "stocks" ? stockData?.name : coinData?.tradingPair;

  return (
    <div className="space-y-6 pb-8">
      <CoinDetailHeader
        coinSymbol={displaySymbol || symbol}
        coinData={connectionType === "crypto" ? (coinData ?? undefined) : undefined}
        stockData={connectionType === "stocks" ? (stockData ?? undefined) : undefined}
        connectionType={connectionType}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onBack={() => router.back()}
      />

      {activeTab === "Price" && (
        <>
          {/* Enhanced Price Display */}
          <div className="relative overflow-hidden rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)] bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur p-6 sm:p-8">
            {/* Decorative gradient overlay */}
            <div className="absolute top-0 right-0 h-32 w-32 bg-gradient-to-br from-[#fc4f02]/20 to-transparent rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 h-24 w-24 bg-gradient-to-tr from-[#fda300]/20 to-transparent rounded-full blur-xl"></div>
            
            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
                {/* Main Price Section */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#fc4f02] to-[#fda300] flex items-center justify-center shadow-lg shadow-[#fc4f02]/30">
                      <span className="text-white font-bold text-sm">{(displaySymbol || symbol).toUpperCase().slice(0, 2)}</span>
                    </div>
                    <div>
                      <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                        {connectionType === "stocks" 
                          ? `${(displaySymbol || symbol).toUpperCase()} Stock`
                          : `${(displaySymbol || symbol).toUpperCase()}/USDT`
                        }
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">Current Price</p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-4xl sm:text-5xl font-bold text-white mb-2 tracking-tight">
                      ${connectionType === "stocks" 
                        ? (stockData?.price || 0).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : (coinData?.currentPrice || 0).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 6,
                          })
                      }
                    </p>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold ${
                          (connectionType === "stocks" ? (stockData?.changePercent24h || 0) : (coinData?.changePercent24h || 0)) >= 0 
                            ? "bg-green-500/20 text-green-400" 
                            : "bg-red-500/20 text-red-400"
                        }`}>
                          {(connectionType === "stocks" ? (stockData?.changePercent24h || 0) : (coinData?.changePercent24h || 0)) >= 0 ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                          )}
                          {(connectionType === "stocks" ? (stockData?.changePercent24h || 0) : (coinData?.changePercent24h || 0)) >= 0 ? "+" : ""}
                          {(connectionType === "stocks" ? (stockData?.changePercent24h || 0) : (coinData?.changePercent24h || 0)).toFixed(2)}%
                        </span>
                        <span className="text-xs text-slate-500">24h</span>
                      </div>
                      <div className="text-xs text-slate-500">
                        ${(connectionType === "stocks" ? (stockData?.change24h || 0) : (coinData?.change24h || 0)) >= 0 ? "+" : ""}
                        {(connectionType === "stocks" ? (stockData?.change24h || 0) : (coinData?.change24h || 0)).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 6,
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Price Stats Section */}
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                  <div className="bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur-sm rounded-xl p-4 min-w-[140px]">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">24h High</p>
                    </div>
                    <p className="text-lg font-bold text-white">
                      ${connectionType === "stocks" 
                        ? (stockData?.high52Week || stockData?.price || 0).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : (coinData?.high24h || 0).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 6,
                          })
                      }
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur-sm rounded-xl p-4 min-w-[140px]">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                      </svg>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">24h Low</p>
                    </div>
                    <p className="text-lg font-bold text-white">
                      ${connectionType === "stocks" 
                        ? (stockData?.low52Week || stockData?.price || 0).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : (coinData?.low24h || 0).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 6,
                          })
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Inverse Price */}
              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">Inverse Price</p>
                  <p className="text-sm font-mono text-slate-300">
                    {coinData?.currentPrice && coinData.currentPrice > 0
                      ? (1 / coinData.currentPrice).toFixed(8)
                      : "0"}{" "}
                    <span className="text-slate-500">{symbol.toUpperCase()}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Timeframe Selector */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {["8H", "1D", "1W", "1M", "3M", "6M"].map((tf) => (
              <button
                key={tf}
                onClick={() => handleTimeframeChange(tf)}
                className={`whitespace-nowrap rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  selectedTimeframe === tf
                    ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white shadow-lg shadow-[#fc4f02]/40 scale-105"
                    : "bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur text-slate-300 hover:text-white hover:scale-105"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Chart */}
          {connectionType === "stocks" ? (
            <StockPriceChart
              symbol={symbol.toUpperCase()}
              interval={selectedInterval}
              timeframe={selectedTimeframe}
            />
          ) : (
            connectionId && coinData && (
              <CoinPriceChart
                connectionId={connectionId}
                symbol={coinData.tradingPair}
                interval={selectedInterval}
                timeframe={selectedTimeframe}
              />
            )
          )}

          {/* Enhanced Market Data Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="group relative overflow-hidden rounded-xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)] bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur p-5 transition-all duration-300 hover:shadow-lg hover:shadow-[#fc4f02]/10">
              <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-xl"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Market Cap</p>
                </div>
                <p className="text-2xl font-bold text-white">
                  {connectionType === "stocks" 
                    ? `$${(stockData?.marketCap ? (stockData.marketCap / 1e9).toFixed(1) + "B" : "N/A")}`
                    : `$${(coinData?.volume24h && coinData.volume24h > 0 ? (coinData.volume24h * 10).toFixed(1) + "B" : "N/A")}`
                  }
                </p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)] bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur p-5 transition-all duration-300 hover:shadow-lg hover:shadow-[#fc4f02]/10">
              <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-xl"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">24h Volume</p>
                </div>
                <p className="text-2xl font-bold text-white">
                  ${connectionType === "stocks" 
                    ? (stockData?.volume24h ? (stockData.volume24h / 1e9).toFixed(3) + "B" : "N/A")
                    : (coinData?.volume24h && coinData.volume24h > 0 ? (coinData.volume24h / 1e9).toFixed(3) + "B" : "N/A")
                  }
                </p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)] bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur p-5 transition-all duration-300 hover:shadow-lg hover:shadow-[#fc4f02]/10">
              <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full blur-xl"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-amber-500/20">
                    <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rank</p>
                </div>
                <p className="text-2xl font-bold text-white">#1</p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)] bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur p-5 transition-all duration-300 hover:shadow-lg hover:shadow-[#fc4f02]/10">
              <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-xl"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">24h Range</p>
                </div>
                <p className="text-sm font-semibold text-white">
                  {connectionType === "stocks" 
                    ? `$${(stockData?.low52Week || 0).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })} - $${(stockData?.high52Week || 0).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    : `$${(coinData?.low24h || 0).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 4,
                      })} - $${(coinData?.high24h || 0).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 4,
                      })}`
                  }
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === "Info" && (
        <InfoTab 
          coinSymbol={symbol}
          stockData={connectionType === "stocks" ? (stockData ?? undefined) : undefined}
          connectionType={connectionType}
        />
      )}

      {activeTab === "Trading Data" && connectionType === "crypto" && connectionId && coinData && (
        <TradingDataTab connectionId={connectionId} symbol={coinData.tradingPair} />
      )}

      {activeTab === "Trading Data" && connectionType === "stocks" && (
        <div className="rounded-lg sm:rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)] bg-gradient-to-br from-white/[0.07] to-transparent p-6 sm:p-8 backdrop-blur text-center">
          <div className="flex flex-col items-center gap-3">
            <svg className="h-12 w-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="text-lg font-semibold text-white">Coming Soon</h3>
            <p className="text-sm text-slate-400 max-w-md">Trading data for stocks is currently under development. Stay tuned!</p>
          </div>
        </div>
      )}

      {/* Trading Panel - Show on Price tab */}
      {activeTab === "Price" && connectionId && coinData && (
        <TradingPanel
          connectionId={connectionId}
          symbol={coinData.tradingPair}
          baseSymbol={symbol.toUpperCase()}
          currentPrice={coinData.currentPrice}
          availableBalance={coinData.availableBalance}
          quoteCurrency={coinData.quoteCurrency}
        />
      )}
    </div>
  );
}

