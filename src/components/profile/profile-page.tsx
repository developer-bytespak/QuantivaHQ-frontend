"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

// Static data matching the profile UI (no backend APIs)
const STATIC = {
  userName: "ghalib",
  holdingValue: 2.66,
  portfolioChange: 0,
  investedValue: 2.66,
  availableUSD: 0,
  coins: [
    {
      id: "1",
      name: "USDT",
      symbol: "USDT",
      amount: 0.005384,
      value: 0,
      change: 0,
      trend: "up" as const,
      icon: "🪙",
    },
  ],
  stocks: [
    {
      id: "1",
      name: "BNB",
      symbol: "BNB",
      shares: 0.00438589,
      value: 2.66,
      change: 0,
      trend: "up" as const,
      icon: "📈",
    },
  ],
};

const formatNumber = (num: number, decimals: number = 2): string => {
  return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const formatCryptoAmount = (num: number): string => {
  const str = num.toFixed(6);
  return str.replace(/\.?0+$/, "");
};

export function ProfilePage() {
  const router = useRouter();
  const { holdingValue, portfolioChange, investedValue, availableUSD, coins, stocks } = STATIC;

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
                <div className="flex items-baseline gap-2 sm:gap-3">
                  <p className="text-3xl sm:text-4xl font-bold text-white">${formatNumber(holdingValue)}</p>
                  <span className={`text-base sm:text-lg font-semibold ${portfolioChange >= 0 ? "text-green-300" : "text-red-300"}`}>
                    {portfolioChange >= 0 ? "+" : ""}{portfolioChange.toFixed(2)}%
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-6 mt-4 sm:mt-6">
                <div>
                  <p className="text-xs sm:text-sm text-white/80 mb-1">Invested value</p>
                  <p className="text-base sm:text-xl font-semibold text-white">${formatNumber(investedValue)}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-white/80 mb-1">Available USD</p>
                  <p className="text-base sm:text-xl font-semibold text-white">${formatNumber(availableUSD)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => router.push("/dashboard/settings")}
          className="absolute top-3 sm:top-4 right-3 sm:right-4 z-20 p-2 sm:p-3 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all duration-200 hover:scale-105 min-w-[2.5rem] min-h-[2.5rem] sm:min-w-[3rem] sm:min-h-[3rem] flex items-center justify-center touch-manipulation"
          aria-label="Settings"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white pointer-events-none shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* Coins and Stocks Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Your Coins */}
        <div className="bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur-xl rounded-lg sm:rounded-2xl p-4 sm:p-6 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)]">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Your Coins</h2>
          <div className="space-y-3 sm:space-y-4">
            {coins.map((coin) => (
              <div
                key={coin.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gradient-to-br from-white/[0.07] to-transparent hover:from-white/[0.1] hover:to-transparent transition-all duration-200 group cursor-pointer"
              >
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#fc4f02]/20 to-[#fc4f02]/10 border border-[#fc4f02]/20 flex items-center justify-center text-lg sm:text-2xl flex-shrink-0 shadow-sm">
                    {coin.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-semibold text-white truncate">{coin.name}</p>
                    <p className="text-xs sm:text-sm text-slate-400">{formatCryptoAmount(coin.amount)} {coin.symbol}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 ml-0 sm:ml-4">
                  <div className="hidden sm:block relative w-48 h-16 flex-shrink-0">
                    <Image
                      src={coin.trend === "up" ? "/upper_trend.png" : "/downtrend.png"}
                      alt={`${coin.trend} trend`}
                      width={192}
                      height={64}
                      className="object-contain w-full h-full"
                      unoptimized
                    />
                  </div>
                  <div className="text-right">
                    <p className="text-sm sm:text-base font-semibold text-white">${formatNumber(coin.value)}</p>
                    <p className={`text-xs sm:text-sm font-medium ${coin.change >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {coin.change >= 0 ? "+" : ""}{coin.change.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Your Stocks */}
        <div className="bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur-xl rounded-lg sm:rounded-2xl p-4 sm:p-6 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)]">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Your Stocks</h2>
          <div className="space-y-3 sm:space-y-4">
            {stocks.map((stock) => (
              <div
                key={stock.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gradient-to-br from-white/[0.07] to-transparent hover:from-white/[0.1] hover:to-transparent transition-all duration-200 group cursor-pointer"
              >
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#1d4ed8]/20 to-[#3b82f6]/10 border border-[#1d4ed8]/20 flex items-center justify-center text-lg sm:text-2xl flex-shrink-0 shadow-sm">
                    {stock.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-semibold text-white truncate">{stock.name}</p>
                    <p className="text-xs sm:text-sm text-slate-400">{formatCryptoAmount(stock.shares)} shares ({stock.symbol})</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 ml-0 sm:ml-4">
                  <div className="hidden sm:block relative w-48 h-16 flex-shrink-0">
                    <Image
                      src={stock.trend === "up" ? "/upper_trend.png" : "/downtrend.png"}
                      alt={`${stock.trend} trend`}
                      width={192}
                      height={64}
                      className="object-contain w-full h-full"
                      unoptimized
                    />
                  </div>
                  <div className="text-right">
                    <p className="text-sm sm:text-base font-semibold text-white">${formatNumber(stock.value)}</p>
                    <p className={`text-xs sm:text-sm font-medium ${stock.change >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {stock.change >= 0 ? "+" : ""}{stock.change.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
