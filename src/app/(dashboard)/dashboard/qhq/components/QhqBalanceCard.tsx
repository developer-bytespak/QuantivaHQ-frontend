'use client';

import Image from 'next/image';
import useQhqStore from '@/state/qhq-store';
import { useEffect } from 'react';

export function QhqBalanceCard() {
  const { balance, isLoadingBalance, fetchBalance } = useQhqStore();

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const pendingBalance = balance ? parseFloat(balance.pending_balance).toFixed(2) : '0.00';
  const lifetimeEarned = balance ? parseFloat(balance.cumulative_earned).toFixed(2) : '0.00';
  const lifetimeSpent = balance ? parseFloat(balance.lifetime_spent).toFixed(2) : '0.00';
  const lifetimeBurned = balance ? parseFloat(balance.lifetime_burned).toFixed(2) : '0.00';

  return (
    <div className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-[var(--primary)]/15 bg-gradient-to-b from-[rgba(var(--primary-rgb),0.09)] via-white/[0.03] to-white/[0.015] p-6 sm:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.45)] transition-colors duration-300 hover:border-[var(--primary)]/35 animate-fade-in">
      {/* Corner aura */}
      <div aria-hidden className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(var(--primary-rgb),0.22),transparent_70%)] blur-xl" />
      {/* Floating token image */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 pointer-events-none">
        <div aria-hidden className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(var(--primary-rgb),0.35),transparent_70%)] blur-xl" />
        <Image src="/qhq_token.png" alt="" width={80} height={80} className="relative opacity-30 sm:w-[120px] sm:h-[120px]" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] shadow-lg shadow-[rgba(var(--primary-rgb),0.3)]">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-white">QHQ Balance</h2>
              <p className="mt-0.5 text-[10px] sm:text-xs text-slate-500">Your token rewards</p>
            </div>
          </div>
          <span className="rounded-md border border-white/[0.08] bg-white/[0.05] px-2 py-0.5 text-[10px] sm:text-xs font-medium text-slate-300">
            Base Network
          </span>
        </div>

        {isLoadingBalance ? (
          <div className="h-16 flex items-center">
            <div className="h-8 w-40 bg-white/[0.06] animate-pulse rounded-lg" />
          </div>
        ) : (
          <div className="mb-6">
            <p className="text-[10px] sm:text-xs font-medium uppercase tracking-[0.14em] text-slate-400">Available to claim on-chain</p>
            <div className="mt-1.5 text-2xl sm:text-[2rem] font-bold leading-tight tracking-tight text-white [font-variant-numeric:tabular-nums]">
              {pendingBalance}{' '}
              <span className="text-lg sm:text-xl font-semibold text-[var(--primary-light)]">QHQ</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/[0.08]">
          <div>
            <p className="text-[10px] sm:text-xs font-medium uppercase tracking-[0.14em] text-slate-400">Lifetime Earned</p>
            <p className="mt-1 text-sm font-semibold text-green-300 [font-variant-numeric:tabular-nums]">{lifetimeEarned}</p>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-medium uppercase tracking-[0.14em] text-slate-400">Lifetime Spent</p>
            <p className="mt-1 text-sm font-semibold text-white [font-variant-numeric:tabular-nums]">{lifetimeSpent}</p>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-medium uppercase tracking-[0.14em] text-slate-400">Lifetime Burned</p>
            <p className="mt-1 text-sm font-semibold text-red-300 [font-variant-numeric:tabular-nums]">{lifetimeBurned}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
