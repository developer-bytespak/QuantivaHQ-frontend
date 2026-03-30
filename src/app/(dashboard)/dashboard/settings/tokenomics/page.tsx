"use client";

import { useState, useEffect } from "react";
import { SettingsBackButton } from "@/components/settings/settings-back-button";
import useQhqStore from "@/state/qhq-store";

const RULE_LABELS: Record<string, { label: string; icon: string }> = {
  MONTHLY_PRO: { label: "PRO Monthly Reward", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  MONTHLY_ELITE: { label: "ELITE Monthly Reward", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  TRADE_EXECUTED: { label: "Execute a Live Trade", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
  STRATEGY_CREATED: { label: "Create a Strategy", icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" },
  BACKTEST_RUN: { label: "Run a Backtest", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
  REFERRAL_SIGNUP: { label: "Refer a Friend", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
  LOYALTY_12_MONTHS: { label: "12-Month Loyalty Bonus", icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" },
};

const DISCOUNT_TIERS = [
  { qhq: 50, discount: 5 },
  { qhq: 100, discount: 10 },
  { qhq: 200, discount: 15 },
];

function formatNumber(val: string | undefined) {
  if (!val) return "0";
  const num = parseFloat(val);
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function truncateAddress(addr: string) {
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

export default function TokenomicsPage() {
  const { balance, stats, rewardRules, wallet, fetchBalance, fetchStats, fetchRewardRules, fetchWallet, isLoadingBalance, isLoadingWallet } = useQhqStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      await Promise.all([fetchBalance(), fetchStats(), fetchRewardRules(), fetchWallet()]);
      setIsLoading(false);
    })();
  }, [fetchBalance, fetchStats, fetchRewardRules, fetchWallet]);

  const activeRules = rewardRules.filter((r) => r.is_active);

  return (
    <div className="space-y-4 sm:space-y-6">
      <SettingsBackButton />

      {/* Header */}
      <div className="bg-gradient-to-br from-[--color-surface-alt]/90 to-[--color-surface-alt]/70 backdrop-blur-xl border border-[--color-border] rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-lg">
        <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#fc4f02]/20 to-[#fc4f02]/10 border border-[#fc4f02]/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 sm:w-6 h-5 sm:h-6 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-white">Tokenomics</h1>
            <p className="text-xs sm:text-sm text-slate-400">QHQ Token overview and earning details</p>
          </div>
        </div>

        {/* Token Stats Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-[--color-surface]/50 border border-[--color-border]/50 rounded-lg sm:rounded-xl p-3 sm:p-4 animate-pulse">
                <div className="h-3 w-16 bg-slate-700 rounded mb-2" />
                <div className="h-6 w-20 bg-slate-700 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-[--color-surface]/50 border border-[--color-border]/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
              <p className="text-xs text-slate-400 mb-1">Total Supply</p>
              <p className="text-lg sm:text-xl font-bold text-white">{formatNumber(stats?.total_supply)}</p>
              <p className="text-xs text-slate-500">QHQ</p>
            </div>
            <div className="bg-[--color-surface]/50 border border-[--color-border]/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
              <p className="text-xs text-slate-400 mb-1">Circulating</p>
              <p className="text-lg sm:text-xl font-bold text-[#fc4f02]">{formatNumber(stats?.circulating_supply)}</p>
              <p className="text-xs text-slate-500">QHQ</p>
            </div>
            <div className="bg-[--color-surface]/50 border border-[--color-border]/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
              <p className="text-xs text-slate-400 mb-1">Total Burned</p>
              <p className="text-lg sm:text-xl font-bold text-red-400">{formatNumber(stats?.total_burned)}</p>
              <p className="text-xs text-slate-500">QHQ</p>
            </div>
            <div className="bg-[--color-surface]/50 border border-[--color-border]/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
              <p className="text-xs text-slate-400 mb-1">Your Balance</p>
              <p className="text-lg sm:text-xl font-bold text-emerald-400">{formatNumber(balance?.pending_balance)}</p>
              <p className="text-xs text-slate-500">QHQ</p>
            </div>
          </div>
        )}
      </div>

      {/* Your QHQ Summary */}
      <div className="bg-gradient-to-br from-[--color-surface-alt]/90 to-[--color-surface-alt]/70 backdrop-blur-xl border border-[--color-border] rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-lg">
        <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">Your QHQ Summary</h2>
        {isLoading || isLoadingBalance ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-700/30 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {[
              { label: "Lifetime Earned", value: balance?.cumulative_earned, color: "text-emerald-400" },
              { label: "Lifetime Claimed (On-Chain)", value: balance?.lifetime_claimed, color: "text-blue-400" },
              { label: "Lifetime Spent", value: balance?.lifetime_spent, color: "text-amber-400" },
              { label: "Lifetime Burned", value: balance?.lifetime_burned, color: "text-red-400" },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-[--color-surface]/50 border border-[--color-border]/50 rounded-lg sm:rounded-xl p-4 sm:p-5 flex items-center justify-between"
              >
                <span className="text-sm text-slate-300">{item.label}</span>
                <span className={`text-base sm:text-lg font-semibold ${item.color}`}>
                  {formatNumber(item.value)} QHQ
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Wallet */}
      <div className="bg-gradient-to-br from-[--color-surface-alt]/90 to-[--color-surface-alt]/70 backdrop-blur-xl border border-[--color-border] rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-lg">
        <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">Linked Wallet</h2>
        {isLoadingWallet ? (
          <div className="h-16 bg-slate-700/30 rounded-lg animate-pulse" />
        ) : wallet ? (
          <div className="bg-[--color-surface]/50 border border-[--color-border]/50 rounded-lg sm:rounded-xl p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm text-slate-400 mb-1">Base Network</p>
                <p className="text-white font-mono text-sm sm:text-base">
                  <span className="hidden sm:inline">{wallet.wallet_address}</span>
                  <span className="sm:hidden">{truncateAddress(wallet.wallet_address)}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Connected
                </span>
                <a
                  href={`https://basescan.org/address/${wallet.wallet_address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1 text-xs rounded-lg bg-[--color-surface] border border-[--color-border] text-slate-300 hover:border-[#fc4f02]/50 transition-all duration-200"
                >
                  Basescan
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[--color-surface]/50 border border-[--color-border]/50 rounded-lg sm:rounded-xl p-4 sm:p-5 text-center">
            <p className="text-sm text-slate-400 mb-2">No wallet linked yet</p>
            <p className="text-xs text-slate-500">
              Connect your wallet from the{" "}
              <a href="/dashboard/qhq" className="text-[#fc4f02] hover:underline">
                QHQ Dashboard
              </a>{" "}
              to claim tokens on-chain
            </p>
          </div>
        )}
      </div>

      {/* Contract Info */}
      {stats?.contract_address && (
        <div className="bg-gradient-to-br from-[--color-surface-alt]/90 to-[--color-surface-alt]/70 backdrop-blur-xl border border-[--color-border] rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-lg">
          <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">Contract Details</h2>
          <div className="space-y-3">
            <div className="bg-[--color-surface]/50 border border-[--color-border]/50 rounded-lg sm:rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <p className="text-xs text-slate-400 mb-1">Contract Address</p>
                <p className="text-white font-mono text-xs sm:text-sm break-all">{stats.contract_address}</p>
              </div>
              <a
                href={`https://basescan.org/address/${stats.contract_address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 px-3 py-1.5 text-xs rounded-lg bg-[--color-surface] border border-[--color-border] text-slate-300 hover:border-[#fc4f02]/50 transition-all duration-200 w-fit"
              >
                View on Basescan
              </a>
            </div>
            <div className="bg-[--color-surface]/50 border border-[--color-border]/50 rounded-lg sm:rounded-xl p-4 sm:p-5 flex items-center justify-between">
              <span className="text-sm text-slate-400">Network</span>
              <span className="text-sm text-white font-medium capitalize">{stats.network || "Base"}</span>
            </div>
            <div className="bg-[--color-surface]/50 border border-[--color-border]/50 rounded-lg sm:rounded-xl p-4 sm:p-5 flex items-center justify-between">
              <span className="text-sm text-slate-400">Token Standard</span>
              <span className="text-sm text-white font-medium">ERC-20</span>
            </div>
          </div>
        </div>
      )}

      {/* Earning Rates */}
      <div className="bg-gradient-to-br from-[--color-surface-alt]/90 to-[--color-surface-alt]/70 backdrop-blur-xl border border-[--color-border] rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-lg">
        <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">Earning Rates</h2>
        <div className="space-y-3 sm:space-y-4">
          {activeRules.length === 0 && !isLoading ? (
            <p className="text-sm text-slate-400">No active reward rules found.</p>
          ) : (
            activeRules.map((rule) => {
              const meta = RULE_LABELS[rule.rule_key] || { label: rule.rule_key, icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 1v8m0 0v1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" };
              return (
                <div
                  key={rule.id}
                  className="bg-[--color-surface]/50 border border-[--color-border]/50 rounded-lg sm:rounded-xl p-4 sm:p-5 hover:border-[#fc4f02]/30 transition-all duration-200"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#fc4f02]/10 border border-[#fc4f02]/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={meta.icon} />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm sm:text-base font-medium text-white">{meta.label}</p>
                        <p className="text-xs text-slate-400 truncate">{rule.description}</p>
                      </div>
                    </div>
                    <span className="text-sm sm:text-base font-semibold text-[#fc4f02] whitespace-nowrap">
                      +{parseFloat(rule.amount)} QHQ
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Subscription Discounts */}
      <div className="bg-gradient-to-br from-[--color-surface-alt]/90 to-[--color-surface-alt]/70 backdrop-blur-xl border border-[--color-border] rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-lg">
        <h2 className="text-lg sm:text-xl font-semibold text-white mb-1">Spend QHQ for Discounts</h2>
        <p className="text-xs sm:text-sm text-slate-400 mb-3 sm:mb-4">
          Spend your QHQ tokens to get a discount on your subscription. 10% of spent tokens are burned.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {DISCOUNT_TIERS.map((tier) => (
            <div
              key={tier.qhq}
              className="bg-[--color-surface]/50 border border-[--color-border]/50 rounded-lg sm:rounded-xl p-4 sm:p-5 text-center hover:border-[#fc4f02]/30 transition-all duration-200"
            >
              <p className="text-2xl sm:text-3xl font-bold text-[#fc4f02] mb-1">{tier.discount}%</p>
              <p className="text-xs text-slate-400 mb-2">discount</p>
              <div className="inline-block px-3 py-1 rounded-full bg-[--color-surface] border border-[--color-border] text-xs text-slate-300">
                {tier.qhq} QHQ
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg sm:rounded-xl p-4 sm:p-6">
        <div className="flex items-start gap-2 sm:gap-3">
          <svg className="w-4 sm:w-5 h-4 sm:h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-xs sm:text-sm text-blue-300 font-medium mb-2">How QHQ Tokens Work</p>
            <ul className="text-xs text-blue-400/80 space-y-1">
              <li>Earn QHQ by trading, creating strategies, subscribing, and referring friends</li>
              <li>Tokens are credited off-chain instantly and can be claimed to your Base wallet anytime</li>
              <li>Spend QHQ on subscription discounts and fee reductions</li>
              <li>10% of spent tokens are automatically burned, reducing total supply over time</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
