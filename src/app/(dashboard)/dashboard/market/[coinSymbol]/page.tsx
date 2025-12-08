"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { exchangesService } from "@/lib/api/exchanges.service";
import CoinDetailHeader from "@/components/market/CoinDetailHeader";
import CoinPriceChart from "@/components/market/CoinPriceChart";
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

export default function CoinDetailPage() {
  const router = useRouter();
  const params = useParams();
  const coinSymbol = params.coinSymbol as string;

  const [coinData, setCoinData] = useState<CoinDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionId, setConnectionId] = useState<string | null>(null);
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

        // Map coin symbol to trading pair (e.g., "BTC" -> "BTCUSDT")
        const tradingPair = `${coinSymbol.toUpperCase()}USDT`;

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
      } catch (err: any) {
        console.error("Failed to fetch coin data:", err);
        setError(err.message || "Failed to load coin data");
      } finally {
        setIsLoading(false);
      }
    };

    if (coinSymbol) {
      fetchData();
    }
  }, [coinSymbol]);

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

  if (error || !coinData) {
    return (
      <div className="p-6">
        <div className="rounded-lg border-l-4 border-red-500/50 bg-red-500/10 p-4">
          <p className="text-sm text-red-200">{error || "Failed to load coin data"}</p>
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

  return (
    <div className="space-y-6 pb-8">
      <CoinDetailHeader
        coinSymbol={coinSymbol}
        coinData={coinData}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onBack={() => router.back()}
      />

      {activeTab === "Price" && (
        <>
          {/* Price Display */}
          <div className="rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-6">
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-3xl font-bold text-white">
                  ${coinData.currentPrice.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 6,
                  })}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  {coinData.currentPrice > 0
                    ? (1 / coinData.currentPrice).toFixed(8)
                    : "0"}{" "}
                  {coinSymbol.toUpperCase()}
                </p>
              </div>
              <div className="text-right">
                <p
                  className={`text-lg font-medium ${
                    coinData.changePercent24h >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {coinData.changePercent24h >= 0 ? "+" : ""}
                  {coinData.changePercent24h.toFixed(2)}%
                </p>
                <p className="text-xs text-slate-400">24h change</p>
              </div>
            </div>
          </div>

          {/* Timeframe Selector */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {["8H", "1D", "1W", "1M", "3M", "6M"].map((tf) => (
              <button
                key={tf}
                onClick={() => handleTimeframeChange(tf)}
                className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  selectedTimeframe === tf
                    ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white shadow-lg shadow-[#fc4f02]/30"
                    : "border border-[--color-border] bg-[--color-surface] text-slate-300 hover:border-[#fc4f02]/50 hover:text-white"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Chart */}
          {connectionId && (
            <CoinPriceChart
              connectionId={connectionId}
              symbol={coinData.tradingPair}
              interval={selectedInterval}
              timeframe={selectedTimeframe}
            />
          )}

          {/* Market Data Summary */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4">
              <p className="text-xs text-slate-400">MARKET CAP</p>
              <p className="mt-1 text-lg font-semibold text-white">
                ${coinData.volume24h > 0 ? (coinData.volume24h * 10).toFixed(1) + "B" : "N/A"}
              </p>
            </div>
            <div className="rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4">
              <p className="text-xs text-slate-400">24H VOLUME</p>
              <p className="mt-1 text-lg font-semibold text-white">
                ${coinData.volume24h > 0 ? (coinData.volume24h / 1e9).toFixed(3) + "B" : "N/A"}
              </p>
            </div>
            <div className="rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4">
              <p className="text-xs text-slate-400">RANK</p>
              <p className="mt-1 text-lg font-semibold text-white">#1</p>
            </div>
          </div>
        </>
      )}

      {activeTab === "Info" && <InfoTab coinSymbol={coinSymbol} />}

      {activeTab === "Trading Data" && connectionId && coinData && (
        <TradingDataTab connectionId={connectionId} symbol={coinData.tradingPair} />
      )}

      {/* Trading Panel - Show on Price tab */}
      {activeTab === "Price" && connectionId && coinData && (
        <TradingPanel
          connectionId={connectionId}
          symbol={coinData.tradingPair}
          baseSymbol={coinSymbol.toUpperCase()}
          currentPrice={coinData.currentPrice}
          availableBalance={coinData.availableBalance}
          quoteCurrency={coinData.quoteCurrency}
        />
      )}
    </div>
  );
}

