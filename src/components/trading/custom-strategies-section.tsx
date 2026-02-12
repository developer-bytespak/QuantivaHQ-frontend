"use client";

import { useState } from "react";
import useSubscriptionStore from "@/state/subscription-store";
import { FeatureType, PlanTier } from "@/mock-data/subscription-dummy-data";
import { LockedFeatureOverlay } from "@/components/common/feature-guard";

export function CustomStrategiesSection() {
  const {
    currentSubscription,
    usageStats,
    canAccessFeature,
    getUsagePercentage,
    isFeatureLimitReached,
  } = useSubscriptionStore();

  const canCreateStrategies = canAccessFeature(FeatureType.CUSTOM_STRATEGIES);
  const usage = usageStats[FeatureType.CUSTOM_STRATEGIES];
  const percentage = getUsagePercentage(FeatureType.CUSTOM_STRATEGIES);
  const limitReached = isFeatureLimitReached(FeatureType.CUSTOM_STRATEGIES);

  // Dummy strategies data
  const strategies = [
    {
      id: 1,
      name: "Moving Average Crossover",
      type: "Technical Analysis",
      status: "active",
      winRate: "62%",
      totalTrades: 128,
    },
    {
      id: 2,
      name: "RSI Oversold Strategy",
      type: "Momentum",
      status: "active",
      winRate: "58%",
      totalTrades: 95,
    },
    {
      id: 3,
      name: "Support/Resistance Bounce",
      type: "Price Action",
      status: "paused",
      winRate: "71%",
      totalTrades: 42,
    },
  ];

  const displayedStrategies =
    !currentSubscription || currentSubscription.tier === PlanTier.FREE ? [] : strategies;

  return (
    <div className="relative">
      {/* Lock overlay for FREE users */}
      {!canCreateStrategies && <LockedFeatureOverlay featureName="Custom Strategies" />}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Custom Strategies</h2>
            <p className="text-slate-400">Create and manage your own trading strategies</p>
          </div>
          {canCreateStrategies && !limitReached && (
            <button className="px-4 py-2 bg-[#fc4f02] text-white rounded-lg hover:bg-[#e04502] transition-colors font-semibold">
              + New Strategy
            </button>
          )}
        </div>

        {/* Usage Info */}
        {canCreateStrategies && usage.limit !== -1 && (
          <div className="bg-[--color-surface-alt] border border-[--color-border] rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-white">Strategies Created</span>
              <span className="text-sm font-semibold text-slate-300">
                {usage.used}/{usage.limit}
              </span>
            </div>
            <div className="w-full bg-slate-700/50 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  percentage >= 80 ? "bg-red-500" : "bg-[#fc4f02]"
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
            {limitReached && (
              <p className="text-xs text-red-400 mt-2">
                ❌ Limit reached. Upgrade to ELITE for unlimited strategies.
              </p>
            )}
            {percentage >= 80 && !limitReached && (
              <p className="text-xs text-orange-400 mt-2">
                ⚠️ {usage.limit - usage.used} strategy slot{usage.limit - usage.used !== 1 ? 's' : ''} remaining
              </p>
            )}
          </div>
        )}

        {/* Strategies List */}
        {displayedStrategies.length > 0 ? (
          <div className="grid gap-4">
            {displayedStrategies.map((strategy) => (
              <div
                key={strategy.id}
                className="border border-[--color-border] rounded-lg p-4 hover:border-[#fc4f02]/50 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{strategy.name}</h3>
                    <p className="text-xs text-slate-400">{strategy.type}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      strategy.status === "active"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-yellow-500/20 text-yellow-400"
                    }`}
                  >
                    {strategy.status.charAt(0).toUpperCase() + strategy.status.slice(1)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Win Rate</p>
                    <p className="text-white font-semibold">{strategy.winRate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Total Trades</p>
                    <p className="text-white font-semibold">{strategy.totalTrades}</p>
                  </div>
                  <div className="text-right">
                    <button className="text-xs text-[#fc4f02] hover:text-[#e04502] font-semibold">
                      View Details →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-400 mb-3">No strategies created yet</p>
            {canCreateStrategies && (
              <button className="px-4 py-2 bg-[#fc4f02] text-white rounded-lg hover:bg-[#e04502] transition-colors font-semibold text-sm">
                Create Your First Strategy
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
