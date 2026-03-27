'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import useQhqStore from '@/state/qhq-store';

export function QhqBalanceChip() {
  const { balance, isLoadingBalance, fetchBalance } = useQhqStore();

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  if (isLoadingBalance && !balance) return null;

  const pending = balance ? parseFloat(balance.pending_balance) : 0;

  return (
    <Link
      href="/dashboard/qhq"
      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[--color-primary]/20 text-[--color-primary] border border-[--color-primary]/30 hover:bg-[--color-primary]/30 transition-colors"
      title="View QHQ Token Wallet"
    >
      <span className="text-[10px] font-bold">QHQ</span>
      <span>{pending.toFixed(1)}</span>
    </Link>
  );
}
