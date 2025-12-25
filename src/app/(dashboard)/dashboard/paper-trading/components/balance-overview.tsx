"use client";

import { formatCurrency } from "@/lib/trading/paper-trading-utils";

interface BalanceOverviewProps {
  balance: number;
  openOrdersCount: number;
  loading: boolean;
}

export function BalanceOverview({ balance, openOrdersCount, loading }: BalanceOverviewProps) {
  return (
    <div className="rounded-lg sm:rounded-xl bg-gradient-to-br from-white/[0.07] to-transparent p-4 sm:p-6 backdrop-blur shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08)]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
        <div>
          <p className="text-xs sm:text-sm text-slate-400 mb-1">Testnet Balance</p>
          {loading ? (
            <div className="h-7 sm:h-8 w-32 animate-pulse rounded bg-slate-700/50" />
          ) : (
            <p className="text-2xl sm:text-3xl font-bold text-white">{formatCurrency(balance)}</p>
          )}
        </div>
        
        <div className="text-left sm:text-right">
          <p className="text-xs sm:text-sm text-slate-400 mb-1">Open Orders</p>
          {loading ? (
            <div className="h-7 sm:h-8 w-16 animate-pulse rounded bg-slate-700/50" />
          ) : (
            <p className="text-2xl sm:text-3xl font-bold text-cyan-400">{openOrdersCount}</p>
          )}
        </div>
      </div>
      
      <div className="mt-3 sm:mt-4 flex items-center gap-2 text-xs text-slate-400">
        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        <span>Connected to Binance Testnet</span>
      </div>
    </div>
  );
}
