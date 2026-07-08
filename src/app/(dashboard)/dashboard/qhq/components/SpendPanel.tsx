'use client';

import { useState } from 'react';
import { toast } from 'react-toastify';
import { qhqApi } from '@/lib/api/qhq-token';
import useQhqStore from '@/state/qhq-store';

const DISCOUNT_OPTIONS = [
  { qhq: 50, discount: 5 },
  { qhq: 100, discount: 10 },
  { qhq: 200, discount: 15 },
];

export function SpendPanel() {
  const { balance, fetchBalance } = useQhqStore();
  const [selected, setSelected] = useState<number | null>(null);
  const [isSpending, setIsSpending] = useState(false);

  const pendingBalance = balance ? parseFloat(balance.pending_balance) : 0;

  const handleSpend = async () => {
    if (!selected) return;
    setIsSpending(true);
    try {
      await qhqApi.spendForSubscriptionDiscount(selected);
      await fetchBalance();
      toast.success(`Applied ${DISCOUNT_OPTIONS.find((o) => o.qhq === selected)?.discount}% subscription discount!`);
      setSelected(null);
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to apply discount');
    } finally {
      setIsSpending(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-white/[0.09] bg-gradient-to-b from-white/[0.055] via-white/[0.02] to-white/[0.015] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.45)] transition-colors duration-300 hover:border-white/[0.14]">
      <div className="flex items-center gap-3 mb-4 sm:mb-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--primary)]/25 bg-[var(--primary)]/10">
          <svg className="h-4 w-4 text-[var(--primary-light)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        </span>
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-white">Spend QHQ</h3>
          <p className="mt-0.5 text-[10px] sm:text-xs text-slate-500">Redeem for discounts</p>
        </div>
      </div>

      <p className="text-xs text-slate-400 rounded-xl px-3 py-2 border border-white/[0.08] bg-white/[0.04] mb-4">
        Use QHQ to get a discount on your next subscription renewal. 10% of spent QHQ is burned.
      </p>

      <div className="space-y-2 mb-4">
        {DISCOUNT_OPTIONS.map((option) => {
          const affordable = pendingBalance >= option.qhq;
          const isSelected = selected === option.qhq;
          return (
            <button
              key={option.qhq}
              onClick={() => affordable && setSelected(isSelected ? null : option.qhq)}
              disabled={!affordable}
              className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                isSelected
                  ? 'border-[var(--primary)]/60 bg-gradient-to-b from-[rgba(var(--primary-rgb),0.12)] via-white/[0.03] to-white/[0.015] hover:scale-[1.01] active:scale-[0.99]'
                  : affordable
                  ? 'border-white/[0.08] bg-white/[0.03] hover:border-[var(--primary)]/40 hover:bg-white/[0.05] group'
                  : 'border-white/[0.06] bg-white/[0.02] opacity-40 cursor-not-allowed'
              }`}
            >
              <span className="text-sm text-white">
                Spend <span className="font-semibold text-[var(--primary-light)] [font-variant-numeric:tabular-nums]">{option.qhq} QHQ</span>
              </span>
              <span className="text-sm font-bold text-green-400 bg-green-400/10 px-3 py-1 rounded-full border border-green-400/20 [font-variant-numeric:tabular-nums]">
                {option.discount}% off
              </span>
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span className="text-[10px] sm:text-xs font-medium uppercase tracking-[0.14em] text-slate-400">Spending</span>
            <span className="[font-variant-numeric:tabular-nums]">{selected} / {pendingBalance.toFixed(0)} QHQ</span>
          </div>
          <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] rounded-full transition-all duration-300"
              style={{ width: `${Math.min((selected / pendingBalance) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      <button
        onClick={handleSpend}
        disabled={!selected || isSpending}
        className={`w-full py-3 px-4 rounded-full font-semibold transition-all ${
          selected && !isSpending
            ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] text-white shadow-lg shadow-[rgba(var(--primary-rgb),0.3)] hover:scale-[1.03] active:scale-[0.98]'
            : 'border border-white/[0.08] bg-white/[0.04] text-slate-500 cursor-not-allowed'
        }`}
      >
        {isSpending ? 'Applying...' : selected ? `Apply ${selected} QHQ Discount` : 'Select a discount tier'}
      </button>
    </div>
  );
}
