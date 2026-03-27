'use client';

import { useEffect } from 'react';
import useQhqStore from '@/state/qhq-store';

const RULE_DESCRIPTIONS: Record<string, { label: string; description: string }> = {
  MONTHLY_PRO: { label: 'PRO Subscription', description: 'Earn QHQ each billing cycle on PRO plan' },
  MONTHLY_ELITE: { label: 'ELITE Subscription', description: 'Earn QHQ each billing cycle on ELITE plan' },
  TRADE_EXECUTED: { label: 'Execute a Live Trade', description: 'Up to 10 rewards per day' },
  STRATEGY_CREATED: { label: 'Create a Strategy', description: 'Earn when you build a custom strategy' },
  BACKTEST_RUN: { label: 'Run a Backtest', description: 'Earn for each backtest you run' },
  REFERRAL_SIGNUP: { label: 'Refer a Friend', description: 'When your referral subscribes' },
  LOYALTY_12_MONTHS: { label: '12-Month Loyalty Bonus', description: 'One-time bonus for 12+ months tenure' },
};

export function EarnOpportunities() {
  const { rewardRules, fetchRewardRules } = useQhqStore();

  useEffect(() => {
    fetchRewardRules();
  }, [fetchRewardRules]);

  const activeRules = rewardRules.filter((r) => r.is_active);

  return (
    <div className="bg-[--color-surface] border border-[--color-border] rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Earn QHQ</h3>

      {activeRules.length === 0 ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 bg-slate-700 animate-pulse rounded" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {activeRules.map((rule) => {
            const meta = RULE_DESCRIPTIONS[rule.rule_key];
            return (
              <div
                key={rule.id}
                className="flex items-center justify-between p-3 bg-[--color-surface-alt] rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-white">{meta?.label ?? rule.rule_key}</p>
                  <p className="text-xs text-slate-400">{meta?.description ?? rule.description}</p>
                </div>
                <span className="text-sm font-bold text-green-400 ml-4 shrink-0">
                  +{parseFloat(rule.amount).toFixed(1)} QHQ
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
