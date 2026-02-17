"use client";

import { useState, useEffect } from "react";
import useSubscriptionStore from "@/state/subscription-store";
import { PlanTier } from "@/mock-data/subscription-dummy-data";
import { useSubscription } from "@/hooks/useSubscription";

export function SubscriptionSettings() {
  const [activeTab, setActiveTab] = useState<"current" | "billing" | "usage" | "change">("current");
  const {
    currentSubscription,
    paymentHistory,
    usageStats,
    allSubscriptions,
    getDaysUntilNextBilling,
    isTrialActive,
    getFeatureLimitInfo,
    fetchSubscriptionData,
    setSelectedPlanId,
  } = useSubscriptionStore();

  const {updateSubscription} = useSubscription();

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  useEffect(() => {
    // Cleanup: clear selectedPlanId when component unmounts
    return () => {
      setSelectedPlanId(null);
    };
  }, [setSelectedPlanId]);

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
    // Implement plan upgrade logic here, e.g. call API to update subscription
    console.log("Upgrading to plan ID:", planId);
    const data = {
      plan_id:planId,
      billing_provider :"stripe",
      auto_renew: true,
    }
    updateSubscription.mutate(data,{
      onSuccess: (response) => {
        console.log("Subscription updated successfully:", response);
        fetchSubscriptionData(); // Refresh subscription data after successful update
      },
      onError: (error) => {
        console.error("Error updating subscription:", error);
        // toast.error("Failed to update subscription. Please try again.");
        // Optionally show an error message to the user
      },
    });
  }

  return (
    <div className="w-full h-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Subscription Settings</h1>
        <p className="text-slate-400">Manage your subscription plan, billing, and payment methods</p>
      </div>

      {!currentSubscription ? (
        <div className="rounded-lg border border-[--color-border] bg-[--color-surface-alt]/50 p-6 text-center">
          <p className="text-slate-400">Loading subscription data...</p>
        </div>
      ) : (
        <>
      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-[--color-border]">
        {[
          { id: "current", label: "Current Plan" },
          { id: "billing", label: "Billing History" },
          { id: "usage", label: "Usage Analytics" },
          { id: "change", label: "Change Plan" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-3 font-medium transition-all border-b-2 ${
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
      <div className="rounded-lg border border-[--color-border] bg-[--color-surface-alt]/50 p-6">
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

              {/* Plan Details */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Billing Cycle</p>
                  <p className="text-white font-semibold">{currentSubscription.billing_period}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Auto-Renewal</p>
                  <p className="text-white font-semibold">
                    {currentSubscription.auto_renew ? "Enabled ✓" : "Disabled"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Current Period Start</p>
                  <p className="text-white font-semibold">
                    {currentSubscription.current_period_start.toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Current Period End</p>
                  <p className="text-white font-semibold">
                    {currentSubscription.current_period_end.toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Next Billing Date</p>
                  <p className="text-white font-semibold">
                    {currentSubscription.next_billing_date.toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Days Until Next Billing</p>
                  <p className="text-white font-semibold">{getDaysUntilNextBilling()} days</p>
                </div>
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
              <div className="flex gap-3">
                <button className="px-4 py-2 bg-[#fc4f02] text-white rounded-lg hover:bg-[#e04502] transition-colors text-sm font-medium">
                  Upgrade Plan
                </button>
                <button className="px-4 py-2 border border-[--color-border] text-white rounded-lg hover:bg-[--color-surface] transition-colors text-sm font-medium">
                  Manage Auto-Renewal
                </button>
                <button className="px-4 py-2 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors text-sm font-medium">
                  Cancel Subscription
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Billing History Tab */}
        {activeTab === "billing" && (
          <div className="space-y-4">
            <table className="w-full">
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

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-sm text-blue-300">
                <span className="font-semibold">📊 Billing Period:</span>{" "}
                {usageStats[Object.keys(usageStats)[0]].period_start.toLocaleDateString()} to{" "}
                {usageStats[Object.keys(usageStats)[0]].period_end.toLocaleDateString()}
              </p>
            </div>
          </div>
        )}

        {/* Change Plan Tab */}
        {activeTab === "change" && (
          <div className="space-y-8">
            {/* Group plans by tier */}
            {["PRO", "ELITE"].map((tierName) => (
              <div key={tierName}>
                <div className="mb-4">
                  <h3 className={`text-2xl font-bold mb-2 ${tierName === "ELITE" ? "text-blue-400" : "text-[#fc4f02]"}`}>
                    {tierName} Plan
                  </h3>
                  <p className="text-slate-400 text-sm">
                    {tierName === "PRO"
                      ? "Perfect for active traders with custom strategies"
                      : "Unlimited access with early features and VC pool"}
                  </p>
                </div>

                {/* Billing Period Options */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {["MONTHLY", "QUARTERLY", "YEARLY"].map((billingPeriod) => {
                    const plan = allSubscriptions?.find(
                      (p: any) => p.tier === tierName && p.billing_period === billingPeriod
                    );

                    if (!plan) return null;

                    const basePrice = parseFloat(plan.base_price);
                    const currentPrice = parseFloat(plan.price);
                    const discount = parseInt(plan.discount_percent);
                    const isCurrentPlan =
                      currentSubscription?.tier === tierName &&
                      currentSubscription?.billing_period === billingPeriod;

                    return (
                      <div
                        key={`${tierName}-${billingPeriod}`}
                        onClick={() => setSelectedPlanId(plan.plan_id)}
                        className={`rounded-lg border-2 p-6 cursor-pointer transition-all relative ${
                          isCurrentPlan
                            ? tierName === "ELITE"
                              ? "border-blue-500/50 bg-blue-500/10"
                              : "border-[#fc4f02]/50 bg-[#fc4f02]/10"
                            : "border-[--color-border] hover:border-[--color-border]/50"
                        }`}
                      >
                        {/* Discount Badge */}
                        {discount > 0 && (
                          <div className={`absolute -top-3 right-4 px-3 py-1 rounded-full text-xs font-bold text-white ${tierName === "ELITE" ? "bg-blue-500" : "bg-[#fc4f02]"}`}>
                            Save {discount}%
                          </div>
                        )}

                        {/* Plan Title */}
                        <h4 className="text-lg font-semibold text-white mb-2">
                          {billingPeriod === "MONTHLY" && "Monthly"}
                          {billingPeriod === "QUARTERLY" && "Quarterly"}
                          {billingPeriod === "YEARLY" && "Yearly"}
                        </h4>

                        {/* Pricing */}
                        <div className="mb-4">
                          <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-bold text-white">
                              ${currentPrice}
                            </p>
                            {discount > 0 && (
                              <p className="text-sm text-slate-400 line-through">
                                ${basePrice}
                              </p>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            {billingPeriod === "MONTHLY" && "per month"}
                            {billingPeriod === "QUARTERLY" && "per 3 months"}
                            {billingPeriod === "YEARLY" && "per year"}
                          </p>
                        </div>

                        {/* Features List */}
                        <div className="mb-6 space-y-2">
                          {plan.plan_features?.map((feature: any) => (
                            <div key={feature.feature_id} className="flex items-center gap-2 text-sm text-slate-300">
                              <span className="text-green-400">✓</span>
                              <span>
                                {feature.feature_type === "CUSTOM_STRATEGIES"
                                  ? `Custom Strategies ${feature.limit_value ? `(Limit: ${feature.limit_value})` : "(Unlimited)"}`
                                  : feature.feature_type === "EARLY_ACCESS"
                                  ? "Early Access to Features"
                                  : "VC Pool Access"}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Action Button */}
                        {isCurrentPlan ? (
                          <button
                            disabled
                            className="w-full px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm font-semibold cursor-not-allowed"
                          >
                            ✓ Current Plan
                          </button>
                        ) : (
                          <button className={`w-full px-4 py-2 rounded-lg text-white font-semibold transition-colors text-sm ${tierName === "ELITE" ? "bg-blue-600 hover:bg-blue-700" : "bg-[#fc4f02] hover:bg-[#e04502]"}`}
                          onClick={()=>{
                            handleUpgradePlan(plan?.plan_id)
                          }}
                          >
                            Select Plan
                          </button>
                        )}
                      </div>
                    );
                  })}
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
