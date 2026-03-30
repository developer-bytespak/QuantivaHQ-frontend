'use client';

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
    <div className="bg-[--color-surface] border border-[--color-border] rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">QHQ Balance</h2>
        <span className="text-xs text-slate-400 bg-[--color-surface-alt] px-2 py-1 rounded">
          Base Network
        </span>
      </div>

      {isLoadingBalance ? (
        <div className="h-16 flex items-center">
          <div className="h-6 w-32 bg-slate-700 animate-pulse rounded" />
        </div>
      ) : (
        <div className="mb-6">
          <div className="text-4xl font-bold text-white">
            {pendingBalance}{' '}
            <span className="text-xl text-[--color-primary]">QHQ</span>
          </div>
          <p className="text-sm text-slate-400 mt-1">Available to claim on-chain</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[--color-border]">
        <div>
          <p className="text-xs text-slate-500">Lifetime Earned</p>
          <p className="text-sm font-medium text-green-400">{lifetimeEarned}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Lifetime Spent</p>
          <p className="text-sm font-medium text-orange-400">{lifetimeSpent}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Lifetime Burned</p>
          <p className="text-sm font-medium text-red-400">{lifetimeBurned}</p>
        </div>
      </div>
    </div>
  );
}
