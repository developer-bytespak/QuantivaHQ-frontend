'use client';

import { useEffect, useState } from 'react';
import useQhqStore from '@/state/qhq-store';

const TYPE_LABELS: Record<string, string> = {
  EARN_SUBSCRIPTION: 'Subscription',
  EARN_TRADING: 'Trade',
  EARN_STRATEGY: 'Strategy',
  EARN_BACKTEST: 'Backtest',
  EARN_REFERRAL: 'Referral',
  EARN_BETA: 'Beta Reward',
  EARN_LOYALTY_BONUS: 'Loyalty Bonus',
  CLAIM_TO_WALLET: 'Claimed',
  SPEND_SUBSCRIPTION_DISCOUNT: 'Subscription Discount',
  SPEND_VC_FEE_REDUCTION: 'VC Pool Fee Reduction',
  SPEND_FEATURE_UNLOCK: 'Feature Unlock',
  BURN_ON_SPEND: 'Burned',
  ADMIN_GRANT: 'Admin Grant',
  ADMIN_DEDUCT: 'Admin Deduct',
};

function typeColor(type: string): string {
  if (type.startsWith('EARN')) return 'text-green-400';
  if (type.startsWith('SPEND') || type.startsWith('BURN') || type === 'CLAIM_TO_WALLET') return 'text-orange-400';
  if (type.startsWith('ADMIN_DEDUCT')) return 'text-red-400';
  return 'text-slate-300';
}

function amountPrefix(type: string): string {
  if (type.startsWith('EARN') || type === 'ADMIN_GRANT') return '+';
  return '-';
}

export function TransactionHistory() {
  const { transactions, transactionTotal, isLoadingTransactions, fetchTransactions } = useQhqStore();
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    fetchTransactions(page, limit);
  }, [page, fetchTransactions]);

  const totalPages = Math.ceil(transactionTotal / limit);

  return (
    <div className="bg-[--color-surface] border border-[--color-border] rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Transaction History</h3>

      {isLoadingTransactions ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-slate-700 animate-pulse rounded" />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <p className="text-slate-400 text-sm text-center py-8">No transactions yet. Start earning QHQ!</p>
      ) : (
        <>
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 bg-[--color-surface-alt] rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {TYPE_LABELS[tx.type] ?? tx.type}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{tx.description}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(tx.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right ml-4">
                  <p className={`text-sm font-semibold ${typeColor(tx.type)}`}>
                    {amountPrefix(tx.type)}{parseFloat(tx.amount).toFixed(2)} QHQ
                  </p>
                  {tx.tx_hash && (
                    <a
                      href={`https://basescan.org/tx/${tx.tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[--color-primary] hover:underline"
                    >
                      On-chain
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm bg-[--color-surface-alt] text-slate-400 rounded disabled:opacity-40 hover:text-white transition"
              >
                Prev
              </button>
              <span className="text-sm text-slate-400">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-sm bg-[--color-surface-alt] text-slate-400 rounded disabled:opacity-40 hover:text-white transition"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
