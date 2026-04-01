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
    <div className="bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur-xl rounded-xl sm:rounded-2xl p-6 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)]">
      <div className="flex items-center gap-3 mb-4 sm:mb-5">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#fc4f02]/20 to-[#fc4f02]/10 border border-[#fc4f02]/20 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-white">Transaction History</h3>
        {transactionTotal > 0 && (
          <span className="text-xs text-slate-400 bg-white/[0.07] px-2.5 py-0.5 rounded-full">
            {transactionTotal}
          </span>
        )}
      </div>

      {isLoadingTransactions ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-white/[0.07] animate-pulse rounded-xl" />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#fc4f02]/10 to-[#fc4f02]/5 border border-[#fc4f02]/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-[#fc4f02]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-slate-400 text-sm">No transactions yet. Start earning QHQ!</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-gradient-to-br from-white/[0.07] to-transparent hover:from-white/[0.1] hover:to-transparent transition-all duration-200"
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
                  <p className={`text-sm font-semibold ${amountColor(tx.type)}`}>
                    {amountPrefix(tx.type)}{parseFloat(tx.amount).toFixed(2)} QHQ
                  </p>
                  {tx.tx_hash && (
                    <a
                      href={`https://basescan.org/tx/${tx.tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-[#fc4f02] bg-[#fc4f02]/10 px-2 py-0.5 rounded-full border border-[#fc4f02]/20 hover:bg-[#fc4f02]/20 transition-colors"
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
                className="px-4 py-1.5 text-sm bg-gradient-to-br from-white/[0.07] to-transparent text-slate-400 rounded-lg border border-[--color-border] disabled:opacity-40 hover:text-white hover:border-[#fc4f02]/50 transition-all duration-200"
              >
                Prev
              </button>
              <span className="text-sm text-slate-400">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-1.5 text-sm bg-gradient-to-br from-white/[0.07] to-transparent text-slate-400 rounded-lg border border-[--color-border] disabled:opacity-40 hover:text-white hover:border-[#fc4f02]/50 transition-all duration-200"
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
