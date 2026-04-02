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
    <div className="bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur-xl rounded-xl sm:rounded-2xl p-6 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(var(--primary-rgb),0.08),0_0_30px_rgba(var(--primary-rgb),0.06)]">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/10 border border-[var(--primary)]/20 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-white">Spend QHQ</h3>
      </div>

      <p className="text-xs text-slate-400 bg-white/[0.05] rounded-lg px-3 py-2 border border-[--color-border] mb-4">
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
                  ? 'border-2 border-[var(--primary)] bg-gradient-to-br from-[var(--primary)]/15 to-[var(--primary)]/5 hover:scale-[1.01] active:scale-[0.99]'
                  : affordable
                  ? 'border border-[--color-border] bg-gradient-to-br from-white/[0.07] to-transparent hover:border-[var(--primary)]/50 hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.15)] group'
                  : 'border border-[--color-border] bg-gradient-to-br from-white/[0.03] to-transparent opacity-40 cursor-not-allowed'
              }`}
            >
              <span className="text-sm text-white">
                Spend <span className="font-semibold text-[var(--primary)]">{option.qhq} QHQ</span>
              </span>
              <span className="text-sm font-bold text-green-400 bg-green-400/10 px-3 py-1 rounded-full border border-green-400/20">
                {option.discount}% off
              </span>
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Spending</span>
            <span>{selected} / {pendingBalance.toFixed(0)} QHQ</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
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
        className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
          selected && !isSpending
            ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] text-white hover:from-[#fd6a00] hover:to-[#fdb800] hover:scale-[1.02] active:scale-[0.98]'
            : 'bg-slate-700 text-slate-400 cursor-not-allowed'
        }`}
      >
        {isSpending ? 'Applying...' : selected ? `Apply ${selected} QHQ Discount` : 'Select a discount tier'}
      </button>
    </div>
  );
}
