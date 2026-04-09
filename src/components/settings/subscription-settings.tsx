"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { apiRequest } from "@/lib/api/client";
import useSubscriptionStore from "@/state/subscription-store";
import { PlanTier, BillingPeriod, getPlansByTier } from "@/mock-data/subscription-dummy-data";
import type { SubscriptionPlan } from "@/mock-data/subscription-dummy-data";

type SubscriptionPlanWithPriceId = SubscriptionPlan & { priceId: string };
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "react-toastify";
import { PRICE_IDS } from "@/constant";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";

const TAB_IDS = ["current", "billing", "usage", "fees", "change"] as const;
type TabId = (typeof TAB_IDS)[number];

export function SubscriptionSettings() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const initialTab: TabId =
    tabParam === "change" || tabParam === "billing" || tabParam === "usage" || tabParam === "current" || tabParam === "fees"
      ? tabParam
      : "current";

  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [outstandingFees, setOutstandingFees] = useState<{
    has_outstanding: boolean;
    total_fees_usd: number;
    total_trades: number;
    billing_month: string;
    message: string;
    will_be_charged: boolean;
  } | null>(null);
  const [cancelCheckLoading, setCancelCheckLoading] = useState(false);
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

  const { createCheckout, cancelSubscription } = useSubscription();

  // ─── Trade Fees state ──────────────────────────────────────────────
  const [feeData, setFeeData] = useState<any>(null);
  const [feeHistory, setFeeHistory] = useState<any[]>([]);
  const [feeLoading, setFeeLoading] = useState(false);
  const hasFetchedFeesRef = useRef(false);

  const fetchFeeData = useCallback(async () => {
    setFeeLoading(true);
    try {
      const [cur, hist] = await Promise.all([
        apiRequest({ path: "/trade-fees/my-fees" }),
        apiRequest({ path: "/trade-fees/history?limit=6" }),
      ]);
      setFeeData(cur);
      setFeeHistory((hist as any)?.months ?? []);
    } catch {
      // user may not have fees yet — silent
    } finally {
      setFeeLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "fees" && !hasFetchedFeesRef.current) {
      hasFetchedFeesRef.current = true;
      fetchFeeData();
    }
  }, [activeTab, fetchFeeData]);

  // Open Change Plan tab when coming from Upgrade Now (?tab=change)
  useEffect(() => {
    if (tabParam === "change") setActiveTab("change");
  }, [tabParam]);

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

  const handleCancelClick = async () => {
    setCancelCheckLoading(true);
    try {
      const data = await apiRequest({ path: "/trade-fees/outstanding" });
      setOutstandingFees(data as any);
    } catch {
      setOutstandingFees(null);
    } finally {
      setCancelCheckLoading(false);
      setShowCancelModal(true);
    }
  };

  const handleCancelSubscription = () => {
    setShowCancelModal(false);
    setOutstandingFees(null);
    cancelSubscription.mutate(
      {
        subscription_id: currentSubscription?.subscription_id || "",
      },
      {
        onSuccess: (data: any) => {
          console.log("data", data);
          console.log("Subscription cancelled successfully");
          toast.success("Subscription cancelled successfully");
          fetchSubscriptionData();
        },
        onError: (error: unknown) => {
          const msg =
            typeof error === "object" &&
              error !== null &&
              "response" in error &&
              typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message === "string"
              ? (error as { response: { data: { message: string } } }).response.data.message
              : "Failed to cancel subscription. Please try again.";
          console.error("Failed to cancel subscription:", msg);
          setLoadingPlanId(null);
          toast.error(msg);
        },
        onSettled: () => {
          setLoadingPlanId(null);
        },
      }
    );
  };

  const renderPlanCard = (plan: SubscriptionPlanWithPriceId, isStaticComingSoon = false) => {
    const isCurrentPlan = !isStaticComingSoon && currentSubscription?.plan_id === plan.plan_id;
    const isUpgrade = !isCurrentPlan;
    const isThisPlanLoading = loadingPlanId === plan.plan_id;

    // Different colors for PRO vs ELITE vs ELITE_PLUS
    const isElite = plan.tier === PlanTier.ELITE;
    const isElitePlus = plan.tier === PlanTier.ELITE_PLUS;
    const borderColor = isCurrentPlan
      ? isElitePlus
        ? "border-emerald-400 bg-emerald-500/10"
        : isElite
          ? "border-blue-400 bg-blue-500/10"
          : "border-[var(--primary)] bg-[var(--primary)]/10"
      : isElitePlus
        ? "border-[--color-border] hover:border-emerald-400/50 bg-emerald-500/5"
        : isElite
          ? "border-[--color-border] hover:border-blue-400/50 bg-blue-500/5"
          : "border-[--color-border] hover:border-[var(--primary)]/50";

    const buttonColor = isElitePlus
      ? "bg-emerald-500 text-white hover:bg-emerald-600"
      : isElite
        ? "bg-blue-500 text-white hover:bg-blue-600"
        : "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]";

    const benefits =
      plan.tier === PlanTier.PRO
        ? ["5 custom strategies", "Real-time news"]
        : plan.tier === PlanTier.ELITE_PLUS
          ? [
            "Unlimited custom strategies",
            "Real-time news",
            "Early access to new upgrades",
            "Option trading",
          ]
          : [
            "Unlimited custom strategies",
            "Real-time news",
            "Early access to new upgrades",
          ];

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
        <div className="flex-grow flex flex-col justify-between mt-2">
          <ul className="space-y-1 text-xs text-slate-300 mb-3">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-1">
                <span className="text-green-400 mt-[1px]">•</span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
          {/* show discount caption above the button so buttons align */}
          {!isCurrentPlan && plan.discount_percent !== "0" && (
            <p className="text-xs text-slate-400 mb-3 text-center">
              Save {plan.discount_percent}% with this plan
            </p>
          )}

          <div className="flex flex-col justify-end">
            {isCurrentPlan ? (
              <button
                disabled
                className="w-full px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm font-semibold cursor-not-allowed"
              >
                Current Plan
              </button>
            ) : isStaticComingSoon ? (
              <button
                disabled
                className="w-full px-4 py-2 bg-slate-500/30 text-slate-400 rounded-lg text-sm font-semibold cursor-not-allowed"
              >
                Coming Soon
              </button>
            ) : (
              <button
                className={`w-full px-4 py-2 ${buttonColor} rounded-lg transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed`}
                onClick={() => handleUpgradePlan({ planId: plan.plan_id, priceId: plan.priceId })}
                disabled={isThisPlanLoading || createCheckout.isPending}
              >
                {isThisPlanLoading ? "Upgrading..." : "Upgrade"}
              </button>
            )}

          </div>
        </div>
      </div>
    );
  };

  const getTierColor = (tier: PlanTier) => {
    switch (tier) {
      case PlanTier.FREE:
        return "text-slate-400";
      case PlanTier.PRO:
        return "text-[var(--primary)]";
      case PlanTier.ELITE:
        return "text-blue-500";
      case PlanTier.ELITE_PLUS:
        return "text-emerald-500";
      default:
        return "text-white";
    }
  };

  const getTierBgColor = (tier: PlanTier) => {
    switch (tier) {
      case PlanTier.FREE:
        return "bg-slate-600/10";
      case PlanTier.PRO:
        return "bg-[var(--primary)]/10";
      case PlanTier.ELITE:
        return "bg-blue-500/10";
      case PlanTier.ELITE_PLUS:
        return "bg-emerald-500/10";
      default:
        return "bg-slate-500/10";
    }
  };

  const handleUpgradePlan = ({ planId, priceId = "123" }: { planId: string, priceId?: string }) => {
    setLoadingPlanId(planId);
    const data = {
      plan_id: planId,
      price_id: priceId || "price_1QXQ52EzYvKYlo2C0986b63e",
      cancel_url: `${window.location.origin}/dashboard/settings/subscription`,
      success_url: `${window.location.origin}/dashboard/settings/subscription`,
    };

    console.log(data);

    // return 


    createCheckout.mutate(data, {
      onSuccess: (data: any) => {
        console.log("createCheckout success data", data);
        console.log("Checkout created successfully");
        toast.success("Checkout created successfully");
        window.location.href = data.url;
      },
      onError: (error: any) => {
        console.log("createCheckout error in component (raw):", error);

        const backendMessage =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.response?.data;

        if (error?.response) {
          console.log("createCheckout error status:", error.response.status);
          console.log("createCheckout error data:", error.response.data);
        }

        console.error("Failed to create checkout:", error);
        toast.error(
          backendMessage
            ? `${backendMessage}`
            : "Failed to create checkout. Please try again."
        );
      },
      onSettled: () => {
        setLoadingPlanId(null);
      },
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
              { id: "fees", label: "Trade Fees" },
              { id: "change", label: "Change Plan" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-shrink-0 px-3 sm:px-4 py-3 text-sm sm:text-base font-medium transition-all border-b-2 whitespace-nowrap ${activeTab === tab.id
                    ? "text-[var(--primary)] border-[var(--primary)]"
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
                <div className={`rounded-lg border border-[var(--primary)]/30 ${getTierBgColor(currentSubscription.tier)} p-6`}>
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
                  {(() => {
                    const isFreePlan = currentSubscription.tier === PlanTier.FREE;
                    const na = "—";
                    const periodStart = isFreePlan ? na : currentSubscription.current_period_start.toLocaleDateString();
                    const periodEnd = isFreePlan ? na : currentSubscription.current_period_end.toLocaleDateString();
                    const nextBilling = isFreePlan ? na : currentSubscription.next_billing_date.toLocaleDateString();
                    const daysUntil = isFreePlan ? na : `${getDaysUntilNextBilling()} days`;
                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
                        {[
                          { label: "Billing Cycle", value: isFreePlan ? na : currentSubscription.billing_period },
                          {
                            label: "Auto-Renewal",
                            value: isFreePlan ? na : (currentSubscription.auto_renew ? "Enabled ✓" : "Disabled"),
                          },
                          { label: "Current Period Start", value: periodStart },
                          { label: "Current Period End", value: periodEnd },
                          { label: "Next Billing Date", value: nextBilling },
                          { label: "Days Until Next Billing", value: daysUntil },
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
                    );
                  })()}

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
                    {/* <button className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors text-sm font-medium">
                  Upgrade Plan
                </button>
                <button className="px-4 py-2 border border-[--color-border] text-white rounded-lg hover:bg-[--color-surface] transition-colors text-sm font-medium">
                  Manage Auto-Renewal
                </button> */}
                    <button
                      type="button"
                      onClick={handleCancelClick}
                      disabled={cancelSubscription.isPending || cancelCheckLoading}
                      className="px-4 py-2 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors text-sm font-medium"
                    >
                      {cancelCheckLoading ? "Checking..." : cancelSubscription.isPending ? "Cancelling..." : "Cancel Subscription"}
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
                            className={`px-2 py-1 rounded text-xs font-semibold ${payment.status === "succeeded"
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
                              className="text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
                            >
                              Invoice
                            </a>
                          )}
                          {payment.receipt_url && (
                            <>
                              {payment.invoice_url && <span className="text-slate-500"> • </span>}
                              <a
                                href={payment.receipt_url}
                                className="text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
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
                              className={`h-2 rounded-full transition-all ${percentage >= 80 ? "bg-red-500" : "bg-[var(--primary)]"
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
                    {getPlansGroupedByTier()[PlanTier.PRO].map((plan) => {
                      let priceId = PRICE_IDS.PRO_PLAN_MONTHLY;
                      if (plan.billing_period === BillingPeriod.QUARTERLY) {
                        priceId = PRICE_IDS.PRO_PLAN_QUARTERLY;
                      } else if (plan.billing_period === BillingPeriod.YEARLY) {
                        priceId = PRICE_IDS.PRO_PLAN_YEARLY;
                      }
                      return renderPlanCard({ ...plan, priceId });
                    })}
                  </div>
                </div>

                {/* ELITE Plan Group - 3 plans */}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-3">ELITE Plan</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
                    {getPlansGroupedByTier()[PlanTier.ELITE].map((plan) => {
                      let priceId = PRICE_IDS.ELITE_PLAN_MONTHLY;
                      if (plan.billing_period === BillingPeriod.QUARTERLY) {
                        priceId = PRICE_IDS.ELITE_PLAN_QUARTERLY;
                      } else if (plan.billing_period === BillingPeriod.YEARLY) {
                        priceId = PRICE_IDS.ELITE_PLAN_YEARLY;
                      }
                      return renderPlanCard({ ...plan, priceId });
                    })}
                  </div>
                </div>

                {/* ELITE Plus Plan Group - 3 plans (static, coming soon) */}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-3">ELITE Plus Plan</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
                    {getPlansByTier(PlanTier.ELITE_PLUS).map((plan) =>
                      renderPlanCard({ ...plan, priceId: "" }, true)
                    )}
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
                  )}

                {/* Info Box */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <p className="text-sm text-blue-300">
                    <span className="font-semibold">💡 Tip:</span> Yearly plans offer the best savings with up to 20% discount. Subscribe today and start trading smarter!
                  </p>
                </div>
              </div>
            )}

            {/* Trade Fees Tab */}
            {activeTab === "fees" && (
              <div className="space-y-6">
                {feeLoading ? (
                  <div className="text-center py-8">
                    <div className="inline-block w-6 h-6 border-2 border-slate-600 border-t-[var(--primary)] rounded-full animate-spin" />
                    <p className="text-slate-400 mt-2 text-sm">Loading fee data...</p>
                  </div>
                ) : (
                  <>
                    {/* Current Month Summary */}
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-5">
                      <h3 className="text-lg font-semibold text-white mb-4">Current Month Fees</h3>
                      {feeData ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Billing Month</p>
                            <p className="text-sm font-medium text-white">{feeData.billing_month || "\u2014"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Total Trades</p>
                            <p className="text-sm font-medium text-white">{feeData.total_trades ?? 0}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Trade Volume</p>
                            <p className="text-sm font-medium text-white">${(feeData.total_trade_volume_usd ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Total Fees (0.1%)</p>
                            <p className="text-lg font-bold text-amber-400">${(feeData.total_fees_usd ?? 0).toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 5 })}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400">No trade fees recorded this month.</p>
                      )}
                    </div>

                    {/* How It Works */}
                    <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-5">
                      <h4 className="text-sm font-semibold text-white mb-3">
                        How Trade Fees Work
                      </h4>

                      <ul className="space-y-2 text-xs text-slate-400">
                        <li className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-1.5"></span>
                          <span>
                            A <strong className="text-slate-300">0.1% fee</strong> is charged on every trade you execute.
                          </span>
                        </li>

                        <li className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-1.5"></span>
                          <span>
                            Fees accumulate through the month and are billed via Stripe on the 1st.
                          </span>
                        </li>

                        <li className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-1.5"></span>
                          <span>
                            Minimum invoice amount is $0.50. Below that, fees carry over to the next month.
                          </span>
                        </li>
                      </ul>
                    </div>

                    {/* Monthly History */}
                    {feeHistory.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3">Monthly History</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-slate-700">
                                <th className="text-left text-slate-400 font-medium py-2 pr-4">Month</th>
                                <th className="text-right text-slate-400 font-medium py-2 px-4">Trades</th>
                                <th className="text-right text-slate-400 font-medium py-2 px-4">Volume</th>
                                <th className="text-right text-slate-400 font-medium py-2 px-4">Fees</th>
                                <th className="text-right text-slate-400 font-medium py-2 pl-4">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {feeHistory.map((m: any) => (
                                <tr key={m.billing_month} className="border-b border-slate-800">
                                  <td className="py-2.5 pr-4 text-white">{m.billing_month}</td>
                                  <td className="py-2.5 px-4 text-right text-slate-300">{m.total_trades}</td>
                                  <td className="py-2.5 px-4 text-right text-slate-300">${(m.total_trade_volume_usd ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                  <td className="py-2.5 px-4 text-right font-medium text-amber-400">${(m.total_fees_usd ?? 0).toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 5 })}</td>
                                  <td className="py-2.5 pl-4 text-right">
                                    <span className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium ${m.status === "PAID" ? "bg-green-500/20 text-green-400" : m.status === "PENDING" || m.status === "ACCUMULATING" ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}`}>{m.status}</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Recent Trades */}
                    {feeData?.recent_fees?.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3">Recent Trade Fees</h3>
                        <div className="space-y-2">
                          {feeData.recent_fees.slice(0, 10).map((f: any) => (
                            <div key={f.fee_id} className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/30 px-4 py-2.5">
                              <div className="flex items-center gap-3">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${f.side === "BUY" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>{f.side || "\u2014"}</span>
                                <span className="text-sm text-white font-medium">{f.asset_symbol}</span>
                                <span className="text-xs text-slate-500">{new Date(f.created_at).toLocaleDateString()}</span>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-slate-400">${(f.trade_value_usd ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} trade</p>
                                <p className="text-sm font-medium text-amber-400">${(f.fee_amount_usd ?? 0).toFixed(5)} fee</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </>
      )}

      <ConfirmationDialog
        isOpen={showCancelModal}
        title="Cancel Subscription"
        message={
          outstandingFees?.has_outstanding
            ? `You have $${outstandingFees.total_fees_usd.toFixed(4)} in outstanding trade fees (${outstandingFees.total_trades} trades in ${outstandingFees.billing_month}). This amount will be charged to your card upon cancellation. Do you want to proceed?`
            : "This action will immediately cancel your current subscription. Do you want to continue?"
        }
        confirmText={outstandingFees?.has_outstanding ? `Pay $${outstandingFees.total_fees_usd.toFixed(4)} & Cancel` : "Continue"}
        cancelText="Go Back"
        type="danger"
        onConfirm={handleCancelSubscription}
        onCancel={() => { setShowCancelModal(false); setOutstandingFees(null); }}
      />
    </div>
  );
}
