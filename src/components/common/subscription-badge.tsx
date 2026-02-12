"use client";

import useSubscriptionStore from "@/state/subscription-store";
import { PlanTier } from "@/mock-data/subscription-dummy-data";

export function SubscriptionBadge() {
  const { currentSubscription, getDaysUntilNextBilling, isTrialActive } = useSubscriptionStore();

  if (!currentSubscription) {
    return (
      <div className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-600 text-white">
        Loading...
      </div>
    );
  }

  const getTierColor = (tier: PlanTier) => {
    switch (tier) {
      case PlanTier.FREE:
        return "bg-slate-600 text-white";
      case PlanTier.PRO:
        return "bg-[#fc4f02] text-white";
      case PlanTier.ELITE:
        return "bg-blue-600 text-white";
      default:
        return "bg-slate-500 text-white";
    }
  };

  const badgeText = (() => {
    if (isTrialActive()) {
      return `${currentSubscription.tier} Trial`;
    }
    return currentSubscription.tier;
  })();

  const daysUntilBilling = getDaysUntilNextBilling();
  const showWarning = !isTrialActive() && daysUntilBilling <= 3 && daysUntilBilling > 0;

  return (
    <div className="relative inline-block">
      <div
        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getTierColor(
          currentSubscription.tier
        )}`}
      >
        {badgeText}
      </div>
      {showWarning && (
        <div className="absolute -top-8 left-0 bg-orange-500 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
          Renewal in {daysUntilBilling} days
        </div>
      )}
    </div>
  );
}
