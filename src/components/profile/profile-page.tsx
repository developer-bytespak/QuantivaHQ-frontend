"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useCallback, useState } from "react";
import { useExchange } from "@/context/ExchangeContext";
import { exchangesService, type DashboardData } from "@/lib/api/exchanges.service";
import { optionsService, type OptionsAccount } from "@/lib/api/options.service";

const formatNumber = (num: number, decimals: number = 2): string => {
  return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const formatCryptoAmount = (num: number): string => {
  const str = num.toFixed(6);
  return str.replace(/\.?0+$/, "");
};

export function ProfilePage() {
  const router = useRouter();
  const { connectionId, connectionType, isLoading: isLoadingConnection } = useExchange();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [optionsAccount, setOptionsAccount] = useState<OptionsAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async (connId: string) => {
    try {
      setError(null);
      const [dashRes, optsAcc] = await Promise.allSettled([
        exchangesService.getDashboard(connId),
        optionsService.getBalance(connId),
      ]);
      if (dashRes.status === "fulfilled") setDashboardData(dashRes.value.data);
      else {
        console.error("Profile: failed to fetch dashboard", dashRes.reason);
        setDashboardData(null);
      }
      // Options balance is only meaningful for Binance crypto connections; silently ignore failures
      setOptionsAccount(optsAcc.status === "fulfilled" ? optsAcc.value : null);
    } catch (err: unknown) {
      console.error("Profile: failed to fetch dashboard", err);
      setError(err instanceof Error ? err.message : "Failed to load portfolio");
      setDashboardData(null);
      setOptionsAccount(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoadingConnection) return;
    if (!connectionId) {
      setIsLoading(false);
      setDashboardData(null);
      return;
    }
    setIsLoading(true);
    fetchDashboard(connectionId);
  }, [connectionId, isLoadingConnection, fetchDashboard]);

  const spotHoldingValue = dashboardData?.portfolio?.totalValue ?? 0;
  const portfolioChange = dashboardData?.portfolio?.pnlPercent ?? 0;
  const usdAsset = dashboardData?.balance?.assets?.find((a) => /^(USD|USDT|BUSD)$/i.test(a.symbol));
  const availableSpotUSD =
    (dashboardData?.balance?.buyingPower ?? 0) ||
    Number(usdAsset?.total ?? usdAsset?.free ?? 0);
  const availableMarginUSD = optionsAccount?.availableBalance ?? 0;
  const marginTotal = optionsAccount?.totalBalance ?? 0;
  // Holding value = spot portfolio total + options margin wallet total
  const holdingValue = spotHoldingValue + marginTotal;
  const positions = dashboardData?.positions ?? [];
  const isCrypto = connectionType === "crypto";
  const sectionTitle = isCrypto ? "Crypto" : "Stocks";

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
      {/* Portfolio Summary Card */}
      <div className="relative overflow-hidden rounded-lg sm:rounded-2xl bg-gradient-to-br from-[#c93d02] via-[#d45a00] to-[#d46a00] p-4 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-0 pr-12 sm:pr-14">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Portfolio</h1>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <p className="text-xs sm:text-sm text-white/80 mb-1">Holding value</p>
                <p className="text-3xl sm:text-4xl font-bold text-white">${formatNumber(holdingValue)}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 mt-4 sm:mt-6">
                <div>
                  <p className="text-xs sm:text-sm text-white/80 mb-1">Invested value</p>
                  <p className="text-base sm:text-xl font-semibold text-white">${formatNumber(holdingValue - availableSpotUSD - availableMarginUSD)}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-white/80 mb-1">Available USD (Spot)</p>
                  <p className="text-base sm:text-xl font-semibold text-white">${formatNumber(availableSpotUSD)}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-white/80 mb-1">Available USD (Margin)</p>
                  <p className="text-base sm:text-xl font-semibold text-white">${formatNumber(availableMarginUSD)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => router.push("/dashboard/settings")}
          className="absolute top-3 sm:top-4 right-3 sm:right-4 z-20 p-2 sm:p-3 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] min-w-[2.5rem] min-h-[2.5rem] sm:min-w-[3rem] sm:min-h-[3rem] flex items-center justify-center touch-manipulation"
          aria-label="Settings"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white pointer-events-none shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* Portfolio loading / error / no connection */}
      {isLoadingConnection || (connectionId && isLoading) ? (
        <div className="rounded-lg sm:rounded-2xl bg-white/[0.07] backdrop-blur-xl p-6 sm:p-8 flex items-center justify-center min-h-[120px]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700/30 border-t-[var(--primary)]" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : !connectionId ? (
        <div className="rounded-lg sm:rounded-2xl bg-white/[0.07] backdrop-blur-xl p-6 sm:p-8 text-center text-slate-400 text-sm">
          Connect an exchange to see your portfolio here.
        </div>
      ) : (
        /* Single section: Crypto or Stocks based on connection type */
        <div className="bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur-xl rounded-lg sm:rounded-2xl p-4 sm:p-6 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(var(--primary-rgb),0.08),0_0_30px_rgba(var(--primary-light-rgb),0.06)]">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">{sectionTitle}</h2>
          <div className="space-y-3 sm:space-y-4">
            {positions.length === 0 ? (
              <p className="text-sm text-slate-400 py-4">No {sectionTitle.toLowerCase()} holdings</p>
            ) : (
              positions.map((pos, index) => {
                const symbol = pos.symbol.replace(/USDT|BUSD/i, "").trim() || pos.symbol;
                const value = pos.currentPrice * pos.quantity;
                const trend = pos.pnlPercent >= 0 ? "up" : "down";
                const iconBg = isCrypto
                  ? "from-[var(--primary)]/20 to-[var(--primary)]/10 border-[var(--primary)]/20"
                  : "from-[#1d4ed8]/20 to-[#3b82f6]/10 border-[#1d4ed8]/20";
                return (
                  <div
                    key={`${pos.symbol}-${index}`}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gradient-to-br from-white/[0.07] to-transparent hover:from-white/[0.1] hover:to-transparent transition-all duration-200 group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      <div
                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br border flex items-center justify-center text-lg sm:text-2xl flex-shrink-0 shadow-sm ${iconBg}`}
                      >
                        {isCrypto ? "🪙" : "📈"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base font-semibold text-white truncate">{symbol}</p>
                        <p className="text-xs sm:text-sm text-slate-400">
                          {isCrypto
                            ? `${formatCryptoAmount(pos.quantity)} ${pos.symbol}`
                            : `${formatCryptoAmount(pos.quantity)} shares (${pos.symbol})`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4 ml-0 sm:ml-4">
                      <div className="hidden sm:block relative w-48 h-16 flex-shrink-0">
                        <Image
                          src={trend === "up" ? "/upper_trend.png" : "/downtrend.png"}
                          alt={`${trend} trend`}
                          width={192}
                          height={64}
                          className="object-contain w-full h-full"
                          unoptimized
                        />
                      </div>
                      <div className="text-right">
                        <p className="text-sm sm:text-base font-semibold text-white">${formatNumber(value)}</p>
                        <p
                          className={`text-xs sm:text-sm font-medium ${pos.pnlPercent >= 0 ? "text-green-400" : "text-red-400"}`}
                        >
                          {pos.pnlPercent >= 0 ? "+" : ""}
                          {pos.pnlPercent.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
