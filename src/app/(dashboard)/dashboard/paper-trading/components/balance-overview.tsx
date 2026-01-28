"use client";

import { formatCurrency } from "@/lib/trading/paper-trading-utils";

interface BalanceOverviewProps {
  balance: number;
  openOrdersCount: number;
  loading: boolean;
  isStockMode?: boolean;
  alpacaConnected?: boolean;
  marketOpen?: boolean;
  dailyChange?: number;
  dailyChangePercent?: number;
  positionsCount?: number;
  portfolioValue?: number;
}

export function BalanceOverview({ 
  balance, 
  openOrdersCount, 
  loading, 
  isStockMode = false,
  alpacaConnected = false,
  marketOpen = false,
  dailyChange = 0,
  dailyChangePercent = 0,
  positionsCount = 0,
  portfolioValue = 0,
}: BalanceOverviewProps) {
  const isPositiveChange = dailyChange >= 0;
  
  return (
    <div className={`rounded-lg sm:rounded-xl bg-gradient-to-br from-white/[0.07] to-transparent p-4 sm:p-6 backdrop-blur shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_${isStockMode ? 'rgba(59,130,246,0.08)' : 'rgba(252,79,2,0.08)'}]`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
        <div>
          <p className="text-xs sm:text-sm text-slate-400 mb-1">
            {isStockMode ? 'Cash Balance' : 'Testnet Balance'}
          </p>
          {loading ? (
            <div className="h-7 sm:h-8 w-32 animate-pulse rounded bg-slate-700/50" />
          ) : (
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-white">{formatCurrency(balance)}</p>
              {isStockMode && alpacaConnected && (
                <p className="text-xs sm:text-sm mt-1 text-slate-400">
                  Portfolio Value: {formatCurrency(portfolioValue)}
                </p>
              )}
              {isStockMode && alpacaConnected && dailyChange !== 0 && (
                <p className={`text-xs sm:text-sm mt-1 ${isPositiveChange ? 'text-green-400' : 'text-red-400'}`}>
                  {isPositiveChange ? '+' : ''}{formatCurrency(dailyChange)} ({isPositiveChange ? '+' : ''}{dailyChangePercent.toFixed(2)}%) today
                </p>
              )}
            </div>
          )}
        </div>
        
        {isStockMode && alpacaConnected ? (
          <div className="flex gap-6">
            <div className="text-left sm:text-right">
              <p className="text-xs sm:text-sm text-slate-400 mb-1">Positions</p>
              {loading ? (
                <div className="h-7 sm:h-8 w-10 animate-pulse rounded bg-slate-700/50" />
              ) : (
                <p className="text-2xl sm:text-3xl font-bold text-blue-400">{positionsCount}</p>
              )}
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs sm:text-sm text-slate-400 mb-1">Open Orders</p>
              {loading ? (
                <div className="h-7 sm:h-8 w-10 animate-pulse rounded bg-slate-700/50" />
              ) : (
                <p className="text-2xl sm:text-3xl font-bold text-blue-400">{openOrdersCount}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-left sm:text-right">
            <p className="text-xs sm:text-sm text-slate-400 mb-1">Open Positions</p>
            {loading ? (
              <div className="h-7 sm:h-8 w-16 animate-pulse rounded bg-slate-700/50" />
            ) : (
              <p className={`text-2xl sm:text-3xl font-bold ${isStockMode ? 'text-blue-400' : 'text-orange-400'}`}>{openOrdersCount}</p>
            )}
          </div>
        )}
      </div>
      
      <div className="mt-3 sm:mt-4 flex items-center gap-2 text-xs text-slate-400">
        <div className={`h-2 w-2 rounded-full ${
          isStockMode 
            ? (alpacaConnected ? (marketOpen ? 'bg-green-500 animate-pulse' : 'bg-yellow-500') : 'bg-red-500')
            : 'bg-green-500 animate-pulse'
        }`} />
        <span>
          {isStockMode 
            ? alpacaConnected
              ? `Connected to Alpaca Paper Trading${marketOpen ? ' • Market Open' : ' • Market Closed'}`
              : 'Connecting to Alpaca Paper Trading...'
            : 'Connected to Binance Testnet'
          }
        </span>
      </div>
    </div>
  );
}
