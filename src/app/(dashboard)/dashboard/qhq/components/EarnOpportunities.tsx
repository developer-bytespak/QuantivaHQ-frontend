'use client';

import { useEffect } from 'react';
import useQhqStore from '@/state/qhq-store';

const RULE_META: Record<string, { label: string; description: string; icon: string }> = {
  MONTHLY_PRO: {
    label: 'PRO Subscription',
    description: 'Earn QHQ each billing cycle on PRO plan',
    icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  },
  MONTHLY_ELITE: {
    label: 'ELITE Subscription',
    description: 'Earn QHQ each billing cycle on ELITE plan',
    icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
  },
  TRADE_EXECUTED: {
    label: 'Execute a Live Trading Signal',
    description: 'Up to 10 rewards per day',
    icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  },
  STRATEGY_CREATED: {
    label: 'Create a Strategy',
    description: 'Earn when you build a custom strategy',
    icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
  },
  REFERRAL_SIGNUP: {
    label: 'Refer a Friend',
    description: 'When your referral subscribes',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  },
  LOYALTY_12_MONTHS: {
    label: '12-Month Loyalty Bonus',
    description: 'One-time bonus for 12+ months tenure',
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  },
};

export function EarnOpportunities() {
  const { rewardRules, fetchRewardRules } = useQhqStore();

  useEffect(() => {
    fetchRewardRules();
  }, [fetchRewardRules]);

  const activeRules = rewardRules.filter((r) => r.is_active);

  return (
    <div className="bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur-xl rounded-xl sm:rounded-2xl p-6 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(var(--primary-rgb),0.08),0_0_30px_rgba(var(--primary-rgb),0.06)]">
      <div className="flex items-center gap-3 mb-4 sm:mb-5">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/10 border border-[var(--primary)]/20 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-white">Earn QHQ</h3>
      </div>

      {activeRules.length === 0 ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-white/[0.07] animate-pulse rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {activeRules.map((rule) => {
            const meta = RULE_META[rule.rule_key];
            return (
              <div
                key={rule.id}
                className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-gradient-to-br from-white/[0.07] to-transparent hover:from-white/[0.1] hover:to-transparent transition-all duration-200 group"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/10 border border-[var(--primary)]/20 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={meta?.icon ?? 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 1v8m0 0v1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'} />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{meta?.label ?? rule.rule_key}</p>
                  <p className="text-xs text-slate-400">{meta?.description ?? rule.description}</p>
                </div>
                <span className="text-sm font-bold text-green-400 bg-green-400/10 px-3 py-1 rounded-full border border-green-400/20 shrink-0">
                  +{parseFloat(rule.amount).toFixed(1)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
