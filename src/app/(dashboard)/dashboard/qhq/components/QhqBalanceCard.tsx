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
    <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#c93d02] via-[#d45a00] to-[#d46a00] p-6 sm:p-8 shadow-xl animate-fade-in">
      {/* Floating token image */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 opacity-15 pointer-events-none">
        <Image src="/qhq_token.png" alt="" width={80} height={80} className="sm:w-[120px] sm:h-[120px]" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-white">QHQ Balance</h2>
          <span className="text-xs text-white/80 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20">
            Base Network
          </span>
        </div>

        {isLoadingBalance ? (
          <div className="h-16 flex items-center">
            <div className="h-8 w-40 bg-white/20 animate-pulse rounded-lg" />
          </div>
        ) : (
          <div className="mb-6">
            <div className="text-4xl sm:text-5xl font-bold text-white">
              {pendingBalance}{' '}
              <span className="text-xl sm:text-2xl text-white/80">QHQ</span>
            </div>
            <p className="text-sm text-white/70 mt-1">Available to claim on-chain</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/20">
          <div>
            <p className="text-xs sm:text-sm text-white/60">Lifetime Earned</p>
            <p className="text-sm font-semibold text-green-300">{lifetimeEarned}</p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-white/60">Lifetime Spent</p>
            <p className="text-sm font-semibold text-white">{lifetimeSpent}</p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-white/60">Lifetime Burned</p>
            <p className="text-sm font-semibold text-red-300">{lifetimeBurned}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
