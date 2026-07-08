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

function typeBadge(type: string): string {
  if (type.startsWith('EARN')) return 'bg-green-400/10 text-green-400 border-green-400/20';
  if (type.startsWith('SPEND')) return 'bg-orange-400/10 text-orange-400 border-orange-400/20';
  if (type === 'CLAIM_TO_WALLET') return 'bg-blue-400/10 text-blue-400 border-blue-400/20';
  if (type.startsWith('BURN')) return 'bg-red-400/10 text-red-400 border-red-400/20';
  if (type.startsWith('ADMIN')) return 'bg-purple-400/10 text-purple-400 border-purple-400/20';
  return 'bg-slate-400/10 text-slate-400 border-slate-400/20';
}

function amountColor(type: string): string {
  if (type.startsWith('EARN') || type === 'ADMIN_GRANT') return 'text-green-400';
  if (type.startsWith('BURN') || type === 'ADMIN_DEDUCT') return 'text-red-400';
  return 'text-orange-400';
}

function amountPrefix(type: string): string {
  if (type.startsWith('EARN') || type === 'ADMIN_GRANT') return '+';
  return '';
}

function iconPath(type: string): string {
  if (type.startsWith('EARN') || type === 'ADMIN_GRANT') return 'M5 10l7-7m0 0l7 7m-7-7v18';
  if (type === 'CLAIM_TO_WALLET') return 'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14';
  return 'M19 14l-7 7m0 0l-7-7m7 7V3';
}

function iconBg(type: string): string {
  if (type.startsWith('EARN') || type === 'ADMIN_GRANT') return 'from-green-400/20 to-green-400/10 border-green-400/20 text-green-400';
  if (type === 'CLAIM_TO_WALLET') return 'from-blue-400/20 to-blue-400/10 border-blue-400/20 text-blue-400';
  if (type.startsWith('BURN')) return 'from-red-400/20 to-red-400/10 border-red-400/20 text-red-400';
  return 'from-orange-400/20 to-orange-400/10 border-orange-400/20 text-orange-400';
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
    <div className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-white/[0.09] bg-gradient-to-b from-white/[0.055] via-white/[0.02] to-white/[0.015] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.45)] transition-colors duration-300 hover:border-white/[0.14]">
      <div className="flex items-center gap-3 mb-4 sm:mb-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--primary)]/25 bg-[var(--primary)]/10">
          <svg className="h-4 w-4 text-[var(--primary-light)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </span>
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-white">Transaction History</h3>
          <p className="mt-0.5 text-[10px] sm:text-xs text-slate-500">Recent QHQ activity</p>
        </div>
        {transactionTotal > 0 && (
          <span className="rounded-md border border-white/[0.08] bg-white/[0.05] px-2 py-0.5 text-[10px] sm:text-xs font-medium text-slate-300 [font-variant-numeric:tabular-nums]">
            {transactionTotal}
          </span>
        )}
      </div>

      {isLoadingTransactions ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-white/[0.05] animate-pulse rounded-xl" />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12">
          <div className="relative mx-auto mb-4 h-14 w-14">
            <div aria-hidden className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle,rgba(var(--primary-rgb),0.18),transparent_70%)] blur-md" />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.09] bg-gradient-to-b from-white/[0.06] to-white/[0.02]">
              <svg className="h-6 w-6 text-[var(--primary-light)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-sm font-medium text-slate-300">No transactions yet. Start earning QHQ!</p>
          <p className="mt-1 text-[11px] text-slate-500">Your QHQ activity will appear here</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center gap-3 p-3 sm:p-4 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.03] transition-colors duration-200"
              >
                <div className={`w-9 h-9 rounded-full bg-gradient-to-br border flex items-center justify-center shrink-0 ${iconBg(tx.type)}`}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath(tx.type)} />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${typeBadge(tx.type)}`}>
                      {TYPE_LABELS[tx.type] ?? tx.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">{tx.description}</p>
                  <p className="text-[10px] text-slate-500">
                    {new Date(tx.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <div className="text-right ml-2 shrink-0">
                  <p className={`text-sm font-semibold [font-variant-numeric:tabular-nums] ${amountColor(tx.type)}`}>
                    {amountPrefix(tx.type)}{parseFloat(tx.amount).toFixed(2)} QHQ
                  </p>
                  {tx.tx_hash && (
                    <a
                      href={`https://basescan.org/tx/${tx.tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-0.5 rounded-full border border-[var(--primary)]/20 hover:bg-[var(--primary)]/20 transition-colors"
                    >
                      On-chain
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-1.5 text-sm rounded-full border border-white/[0.1] bg-white/[0.04] text-slate-300 disabled:opacity-50 hover:text-white hover:border-white/[0.2] hover:bg-white/[0.08] transition-all duration-200"
              >
                Prev
              </button>
              <span className="text-sm text-slate-400 [font-variant-numeric:tabular-nums]">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-1.5 text-sm rounded-full border border-white/[0.1] bg-white/[0.04] text-slate-300 disabled:opacity-50 hover:text-white hover:border-white/[0.2] hover:bg-white/[0.08] transition-all duration-200"
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
