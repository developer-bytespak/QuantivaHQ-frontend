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
    <div className="bg-[--color-surface] border border-[--color-border] rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-2">Spend QHQ</h3>
      <p className="text-sm text-slate-400 mb-4">
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
              className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                isSelected
                  ? 'border-[--color-primary] bg-[--color-primary]/10'
                  : affordable
                  ? 'border-[--color-border] bg-[--color-surface-alt] hover:border-[--color-primary]/50'
                  : 'border-[--color-border] bg-[--color-surface-alt] opacity-40 cursor-not-allowed'
              }`}
            >
              <span className="text-sm text-white">
                Spend <span className="font-semibold text-orange-400">{option.qhq} QHQ</span>
              </span>
              <span className="text-sm font-bold text-green-400">{option.discount}% off next renewal</span>
            </button>
          );
        })}
      </div>

      <button
        onClick={handleSpend}
        disabled={!selected || isSpending}
        className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
          selected && !isSpending
            ? 'bg-orange-500 text-white hover:bg-orange-600'
            : 'bg-slate-700 text-slate-400 cursor-not-allowed'
        }`}
      >
        {isSpending ? 'Applying...' : selected ? `Apply ${selected} QHQ Discount` : 'Select a discount tier'}
      </button>
    </div>
  );
}
