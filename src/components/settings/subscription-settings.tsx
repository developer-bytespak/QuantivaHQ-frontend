"use client";

import { useState, useEffect, useRef } from "react";
import useSubscriptionStore from "@/state/subscription-store";
import { PlanTier, BillingPeriod } from "@/mock-data/subscription-dummy-data";
import type { SubscriptionPlan } from "@/mock-data/subscription-dummy-data";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "react-toastify";

export function SubscriptionSettings() {
  const [activeTab, setActiveTab] = useState<"current" | "billing" | "usage" | "change">("current");
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);
  const {
    currentSubscription,
    paymentHistory,
    usageStats,
    allSubscriptions,
    getDaysUntilNextBilling,
    isTrialActive,
    getFeatureLimitInfo,
    getPlansGroupedByTier,
    fetchSubscriptionData,
  } = useSubscriptionStore();

  const { updateSubscription } = useSubscription();

  // Fetch subscription data once when user lands on this page
  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchSubscriptionData();
  }, [fetchSubscriptionData]);

  const getBillingLabel = (period: BillingPeriod) => {
    switch (period) {
      case BillingPeriod.MONTHLY:
        return "/month";
      case BillingPeriod.QUARTERLY:
        return "/3 months";
      case BillingPeriod.YEARLY:
        return "/year";
      default:
        return "";
    }
  };

  const renderPlanCard = (plan: SubscriptionPlan) => {
    const isCurrentPlan = currentSubscription?.plan_id === plan.plan_id;
    const isUpgrade =
      !currentSubscription ||
      currentSubscription.tier === PlanTier.FREE ||
      (currentSubscription.tier === PlanTier.PRO && plan.tier === PlanTier.ELITE);
    const isDowngrade = !isUpgrade && !isCurrentPlan;
    const isThisPlanLoading = loadingPlanId === plan.plan_id;

    // Different colors for PRO vs ELITE
    const isElite = plan.tier === PlanTier.ELITE;
    const borderColor = isCurrentPlan
      ? isElite
        ? "border-blue-400 bg-blue-500/10"
        : "border-[#fc4f02] bg-[#fc4f02]/10"
      : isElite
      ? "border-[--color-border] hover:border-blue-400/50 bg-blue-500/5"
      : "border-[--color-border] hover:border-[#fc4f02]/50";
    
    const buttonColor = isElite
      ? "bg-blue-500 text-white hover:bg-blue-600"
      : "bg-[#fc4f02] text-white hover:bg-[#e04502]";

    return (
      <div
        key={plan.plan_id}
        className={`flex flex-col min-h-[260px] h-full rounded-lg border-2 p-4 cursor-pointer transition-all ${borderColor}`}
      >
        <h4 className="text-sm font-medium text-slate-400 mb-1">{plan.billing_period}</h4>
        <p className="text-xl sm:text-2xl font-bold text-white mb-2">
          ${plan.price}
          <span className="text-sm text-slate-400 font-normal">{getBillingLabel(plan.billing_period)}</span>
        </p>
        <div className="min-h-[20px] mb-2">
          {plan.discount_percent !== "0" && (
            <p className="text-xs text-green-400">Save {plan.discount_percent}%</p>
          )}
        </div>
        <div className="flex-grow flex flex-col justify-end">
          {isCurrentPlan ? (
            <button
              disabled
              className="w-full px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm font-semibold cursor-not-allowed"
            >
              Current Plan
            </button>
          ) : (
            <button 
              className={`w-full px-4 py-2 ${buttonColor} rounded-lg transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed`}
              onClick={() => handleUpgradePlan(plan.plan_id)}
              disabled={isThisPlanLoading || updateSubscription.isPending}
            >
              {isThisPlanLoading ? "Upgrading..." : isUpgrade ? "Upgrade" : "Downgrade"}
            </button>
          )}
          {!isCurrentPlan && (
            <p className="text-xs text-slate-400 mt-3 text-center">
              {isUpgrade ? "Add features & increase limits" : "Reduce features & limits"}
            </p>
          )}
        </div>
      </div>
    );
  };

  const getTierColor = (tier: PlanTier) => {
    switch (tier) {
      case PlanTier.FREE:
        return "text-slate-400";
      case PlanTier.PRO:
        return "text-[#fc4f02]";
      case PlanTier.ELITE:
        return "text-blue-500";
      default:
        return "text-white";
    }
  };

  const getTierBgColor = (tier: PlanTier) => {
    switch (tier) {
      case PlanTier.FREE:
        return "bg-slate-600/10";
      case PlanTier.PRO:
        return "bg-[#fc4f02]/10";
      case PlanTier.ELITE:
        return "bg-blue-500/10";
      default:
        return "bg-slate-500/10";
    }
  };

  const handleUpgradePlan = (planId: string) => {
    setLoadingPlanId(planId);
    const data = {
      plan_id: planId,
      status: "active",
      auto_renew: true,
      billing_provider: "stripe",
    };
    updateSubscription.mutate(data, {
      onSuccess: () => {
        fetchSubscriptionData();
        setLoadingPlanId(null);
        console.log("Plan upgraded successfully");
        toast.success("Plan upgraded successfully");
        // Refresh subscription data after successful upgrade
      },
      onError: (error) => {
        console.error("Failed to upgrade plan:", error);
        toast.error("Failed to upgrade plan. Please try again.");
        setLoadingPlanId(null);
      }
    });
  };

  return (
    <div className="w-full h-full overflow-x-hidden">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Subscription Settings</h1>
        <p className="text-sm sm:text-base text-slate-400">Manage your subscription plan, billing, and payment methods</p>
      </div>

      {!currentSubscription ? (
        <div className="rounded-lg border border-[--color-border] bg-[--color-surface-alt]/50 p-6 text-center">
          <p className="text-slate-400">Loading subscription data...</p>
        </div>
      ) : (
        <>
      {/* Tabs - scrollable on mobile */}
      <div className="flex gap-2 mb-6 border-b border-[--color-border] overflow-x-auto scrollbar-hide pb-px">
        {[
          { id: "current", label: "Current Plan" },
          { id: "billing", label: "Billing History" },
          { id: "usage", label: "Usage Analytics" },
          { id: "change", label: "Change Plan" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-shrink-0 px-3 sm:px-4 py-3 text-sm sm:text-base font-medium transition-all border-b-2 whitespace-nowrap ${
              activeTab === tab.id
                ? "text-[#fc4f02] border-[#fc4f02]"
                : "text-slate-400 border-transparent hover:text-slate-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="rounded-lg border border-[--color-border] bg-[--color-surface-alt]/50 p-4 sm:p-6 overflow-x-hidden">
        {/* Current Plan Tab */}
        {activeTab === "current" && (
          <div className="space-y-6">
            {/* Current Plan Card */}
            <div className={`rounded-lg border border-[#fc4f02]/30 ${getTierBgColor(currentSubscription.tier)} p-6`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">
                    {currentSubscription.tier} Plan
                  </h3>
                  <p className={`font-semibold ${getTierColor(currentSubscription.tier)}`}>
                    {currentSubscription.status.toUpperCase()}
                  </p>
                </div>
              </div>

              {/* Plan Details - equal div sizes, aligned content */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
                {[
                  { label: "Billing Cycle", value: currentSubscription.billing_period },
                  {
                    label: "Auto-Renewal",
                    value: currentSubscription.auto_renew ? "Enabled ✓" : "Disabled",
                  },
                  {
                    label: "Current Period Start",
                    value: currentSubscription.current_period_start.toLocaleDateString(),
                  },
                  {
                    label: "Current Period End",
                    value: currentSubscription.current_period_end.toLocaleDateString(),
                  },
                  {
                    label: "Next Billing Date",
                    value: currentSubscription.next_billing_date.toLocaleDateString(),
                  },
                  {
                    label: "Days Until Next Billing",
                    value: `${getDaysUntilNextBilling()} days`,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="min-h-[56px] flex flex-col justify-center border border-[--color-border]/50 rounded-lg px-3 py-3 bg-[--color-surface]/30"
                  >
                    <p className="text-xs text-slate-500 mb-1">{item.label}</p>
                    <p className="text-white font-semibold">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Trial Badge */}
              {isTrialActive() && (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg mb-6">
                  <span className="text-blue-400 text-sm">
                    🎯 Trial active - {getDaysUntilNextBilling()} days remaining
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {/* <button className="px-4 py-2 bg-[#fc4f02] text-white rounded-lg hover:bg-[#e04502] transition-colors text-sm font-medium">
                  Upgrade Plan
                </button>
                <button className="px-4 py-2 border border-[--color-border] text-white rounded-lg hover:bg-[--color-surface] transition-colors text-sm font-medium">
                  Manage Auto-Renewal
                </button> */}
                <button 
                
                onClick={()=>{
                  toast.error("This feature is not available yet");
                }}
                className="px-4 py-2 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors text-sm font-medium">
                  Cancel Subscription
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Billing History Tab */}
        {activeTab === "billing" && (
          <div className="space-y-4 overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-[--color-border]">
                  <th className="text-left py-3 px-4 font-semibold text-slate-300 text-sm">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-300 text-sm">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-300 text-sm">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-300 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paymentHistory.map((payment) => (
                  <tr
                    key={payment.payment_id}
                    className="border-b border-[--color-border] hover:bg-[--color-surface]/30 transition-colors"
                  >
                    <td className="py-3 px-4 text-sm text-white">
                      {payment.created_at.toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-sm font-semibold text-white">
                      ${payment.amount.toFixed(2)} {payment.currency}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          payment.status === "succeeded"
                            ? "bg-green-500/20 text-green-400"
                            : payment.status === "failed"
                            ? "bg-red-500/20 text-red-400"
                            : payment.status === "pending"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-slate-500/20 text-slate-300"
                        }`}
                      >
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {payment.invoice_url && (
                        <a
                          href={payment.invoice_url}
                          className="text-[#fc4f02] hover:text-[#e04502] transition-colors"
                        >
                          Invoice
                        </a>
                      )}
                      {payment.receipt_url && (
                        <>
                          {payment.invoice_url && <span className="text-slate-500"> • </span>}
                          <a
                            href={payment.receipt_url}
                            className="text-[#fc4f02] hover:text-[#e04502] transition-colors"
                          >
                            Receipt
                          </a>
                        </>
                      )}
                      {payment.status === "failed" && (
                        <span className="text-red-400 text-xs">
                          {payment.failure_reason}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Usage Analytics Tab */}
        {activeTab === "usage" && (
          <div className="space-y-6">
            {Object.entries(usageStats).map(([feature, stats]) => {
              const { limit } = getFeatureLimitInfo(feature as any);
              const percentage =
                limit === -1 ? 100 : limit === 0 ? 0 : (stats.used / (stats.limit || 1)) * 100;

              return (
                <div key={feature} className="border border-[--color-border] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-white capitalize">
                      {feature.replace(/_/g, " ")}
                    </h4>
                    <span className="text-sm font-semibold text-slate-300">
                      {stats.limit === -1 ? "Unlimited" : `${stats.used}/${stats.limit}`}
                    </span>
                  </div>

                  {stats.limit !== -1 && stats.limit !== 0 && (
                    <>
                      <div className="w-full bg-slate-700/50 rounded-full h-2 mb-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            percentage >= 80 ? "bg-red-500" : "bg-[#fc4f02]"
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-400">
                        {Math.round(percentage)}% used this billing period
                      </p>
                    </>
                  )}

                  {limit === 0 && (
                    <p className="text-xs text-red-400">
                      Feature not available in your plan
                    </p>
                  )}
                </div>
              );
            })}

            {/* <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-sm text-blue-300">
                <span className="font-semibold">📊 Billing Period:</span>{" "}
                {usageStats[Object.keys(usageStats)[0]].period_start.toLocaleDateString()} to{" "}
                {usageStats[Object.keys(usageStats)[0]].period_end.toLocaleDateString()}
              </p>
            </div> */}
          </div>
        )}

        {/* Change Plan Tab */}
        {activeTab === "change" && (
          <div className="space-y-6">
            {/* PRO Plan Group - 3 plans */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-white mb-3">PRO Plan</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
                {getPlansGroupedByTier()[PlanTier.PRO].map((plan) => renderPlanCard(plan))}
              </div>
            </div>

            {/* ELITE Plan Group - 3 plans */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-white mb-3">ELITE Plan</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
                {getPlansGroupedByTier()[PlanTier.ELITE].map((plan) => renderPlanCard(plan))}
              </div>
            </div>

            {currentSubscription.tier !== PlanTier.FREE &&
              currentSubscription.tier !== PlanTier.ELITE && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <p className="text-sm text-blue-300">
                    <span className="font-semibold">💡 Tip:</span> If you upgrade mid-cycle, we'll
                    prorate your payment based on your remaining days.
                  </p>
                </div>
              </div>
            ))}

            {/* Info Box */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-sm text-blue-300">
                <span className="font-semibold">💡 Tip:</span> Yearly plans offer the best savings with up to 20% discount. Subscribe today and start trading smarter!
              </p>
            </div>
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
}
