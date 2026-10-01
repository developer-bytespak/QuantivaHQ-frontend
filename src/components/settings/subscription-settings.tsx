"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { apiRequest } from "@/lib/api/client";
import useSubscriptionStore from "@/state/subscription-store";
import { BillingPeriod, PlanTier } from "@/mock-data/subscription-dummy-data";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "react-toastify";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import { BillingPeriodToggle } from "@/components/subscription/billing-period-toggle";
import {
  PLAN_DISPLAY_NAMES,
  PREMIUM_BILLING_PERIODS,
  PREMIUM_PERIOD_LABELS,
  PREMIUM_PERIOD_RENEWAL,
  PREMIUM_PERIOD_SUFFIX,
  TRIAL_DAYS,
  formatPlanDate,
  formatPremiumAmount,
  isLegacyPaidTier,
  isPremiumBillingPeriod,
  premiumPriceLabel,
} from "@/config/subscription";

const TAB_IDS = ["current", "change", "billing", "usage", "fees"] as const;
type TabId = (typeof TAB_IDS)[number];

const SUBSCRIPTION_ACTIVATED_EVENT = "quantiva:subscription-activated";

/** Short feature list shown on every Change Plan card (one plan, every feature). */
const PREMIUM_CARD_FEATURES = [
  "AI signals and auto execution",
  "Unlimited custom strategies",
  "Options trading",
  "VC Pool access",
] as const;

function resolveTab(raw: string | null): TabId {
  return (TAB_IDS as readonly string[]).includes(raw ?? "") ? (raw as TabId) : "current";
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "object" && error !== null) {
    const e = error as { message?: unknown; response?: { data?: { message?: unknown } } };
    const fromResponse = e.response?.data?.message;
    if (typeof fromResponse === "string" && fromResponse.trim()) return fromResponse;
    if (Array.isArray(fromResponse) && fromResponse.length) return fromResponse.join(", ");
    if (typeof e.message === "string" && e.message.trim()) return e.message;
  }
  return fallback;
}

export function SubscriptionSettings() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const [activeTab, setActiveTab] = useState<TabId>(() => resolveTab(tabParam));
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  /** Period the user is checking out for (which Change Plan card shows "Loading..."). */
  const [checkoutPeriod, setCheckoutPeriod] = useState<BillingPeriod | null>(null);
  /** Period awaiting confirmation in the "Switch to ... billing?" dialog. */
  const [pendingPeriod, setPendingPeriod] = useState<BillingPeriod | null>(null);
  /** Period whose change-period request is in flight. */
  const [switchingPeriod, setSwitchingPeriod] = useState<BillingPeriod | null>(null);
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
    premiumPlans,
    paymentHistory,
    usageStats,
    getFeatureLimitInfo,
    fetchSubscriptionData,
    isPremium,
    isTrialActive,
    getTrialDaysLeft,
    isCancelScheduled,
    getAccessEndsAt,
    getPremiumPriceLabel,
    getPremiumSavingsPercent,
    getCurrentPremiumPrice,
    selectedBillingPeriod,
    setSelectedBillingPeriod,
    isTrialEligible,
  } = useSubscriptionStore();

  const { createCheckout, cancelSubscription, resumeSubscription, changeBillingPeriod } = useSubscription();

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
      // user may not have fees yet: silent
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

  // Follow ?tab= changes after mount (unknown values fall back to "current")
  useEffect(() => {
    setActiveTab(resolveTab(tabParam));
  }, [tabParam]);

  // Fetch subscription data once when user lands on this page
  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchSubscriptionData();
  }, [fetchSubscriptionData]);

  // Refresh when the activation watcher confirms a new Premium subscription
  useEffect(() => {
    const onActivated = () => { void fetchSubscriptionData(); };
    window.addEventListener(SUBSCRIPTION_ACTIVATED_EVENT, onActivated);
    return () => window.removeEventListener(SUBSCRIPTION_ACTIVATED_EVENT, onActivated);
  }, [fetchSubscriptionData]);

  const tier = currentSubscription?.tier ?? PlanTier.FREE;
  const isFreePlan = !isPremium();
  const isLegacy = isLegacyPaidTier(tier);
  // Period the user is paying for (paid plans) and the one they are choosing (Free upgrade CTA).
  const currentPeriod = isPremiumBillingPeriod(currentSubscription?.billing_period)
    ? currentSubscription!.billing_period
    : "MONTHLY";
  const currentPeriodLabel = PREMIUM_PERIOD_LABELS[currentPeriod];
  const currentPriceLabel = premiumPriceLabel(currentPeriod, getCurrentPremiumPrice());
  const upgradeAmount = getPremiumPriceLabel(selectedBillingPeriod);
  const upgradePriceLabel = premiumPriceLabel(selectedBillingPeriod, upgradeAmount);
  const upgradeRenewal = PREMIUM_PERIOD_RENEWAL[selectedBillingPeriod];
  const trialActive = isTrialActive();
  const cancelScheduled = isCancelScheduled();
  const isAppleBilled = currentSubscription?.billing_provider === "apple";
  const isAdminComp = currentSubscription?.billing_provider === "admin_override";
  const accessEndsAt = getAccessEndsAt();
  const trialEndDate = currentSubscription?.trial_end ?? null;
  const trialDaysLeft = getTrialDaysLeft();

  const statusLabel = (() => {
    const provider = currentSubscription?.provider_status;
    if (provider === "past_due") return "Payment issue";
    if (trialActive || provider === "trialing") return "Trial";
    const status = currentSubscription?.status ?? "active";
    if (status === "active") return "Active";
    return status.charAt(0).toUpperCase() + status.slice(1);
  })();
  const statusColor =
    statusLabel === "Payment issue"
      ? "text-red-400"
      : statusLabel === "Trial"
        ? "text-blue-400"
        : isFreePlan
          ? "text-slate-400"
          : "text-green-400";

  const planTitle = isFreePlan
    ? "Free Plan"
    : isLegacy
      ? PLAN_DISPLAY_NAMES[tier] ?? tier
      : `Premium Plan, ${currentPeriodLabel}`;

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
      {},
      {
        onSuccess: (data) => {
          const until = formatPlanDate(data?.access_until ?? data?.current_period_end ?? accessEndsAt);
          toast.success(
            until
              ? `Cancellation scheduled. You keep access until ${until}.`
              : "Cancellation scheduled. You keep access until the end of your billing period.",
          );
          fetchSubscriptionData();
        },
        onError: (error: unknown) => {
          const msg = getErrorMessage(error, "Failed to cancel subscription. Please try again.");
          console.error("Failed to cancel subscription:", msg);
          toast.error(msg);
        },
      }
    );
  };

  const handleResumeSubscription = () => {
    resumeSubscription.mutate(
      {},
      {
        onSuccess: (data) => {
          const renews = formatPlanDate(data?.current_period_end ?? accessEndsAt);
          toast.success(
            renews ? `Premium will renew on ${renews}.` : "Premium will renew at the end of your billing period.",
          );
          fetchSubscriptionData();
        },
        onError: (error: unknown) => {
          toast.error(getErrorMessage(error, "Failed to resume subscription. Please try again."));
        },
      }
    );
  };

  const startPremiumCheckout = (period: BillingPeriod = selectedBillingPeriod) => {
    setCheckoutLoading(true);
    setCheckoutPeriod(period);
    createCheckout.mutate(
      {
        billing_period: period,
        success_url: `${window.location.origin}/dashboard/settings/subscription?checkout=success`,
        cancel_url: `${window.location.origin}/dashboard/settings/subscription`,
      },
      {
        onSuccess: (data) => {
          if (data?.url) {
            window.location.href = data.url;
          } else {
            setCheckoutLoading(false);
            setCheckoutPeriod(null);
            toast.error("Could not start checkout.");
          }
        },
        onError: (error: unknown) => {
          setCheckoutLoading(false);
          setCheckoutPeriod(null);
          toast.error(getErrorMessage(error, "Failed to create checkout. Please try again."));
        },
      }
    );
  };

  const handleConfirmSwitch = () => {
    if (!pendingPeriod) return;
    const period = pendingPeriod;
    setPendingPeriod(null);
    setSwitchingPeriod(period);
    changeBillingPeriod.mutate(
      { billing_period: period },
      {
        onSuccess: (data) => {
          toast.success(
            data?.message?.trim() ||
              `Your plan switches to ${PREMIUM_PERIOD_LABELS[period]} billing at your next billing date.`,
          );
          fetchSubscriptionData();
        },
        onError: (error: unknown) => {
          toast.error(getErrorMessage(error, "Failed to change billing period. Please try again."));
        },
        onSettled: () => setSwitchingPeriod(null),
      }
    );
  };

  // Change Plan tab: why the switch buttons are locked, if they are.
  const changePlanNote = (() => {
    if (isFreePlan) return null;
    if (isAppleBilled) {
      return "Your subscription is billed through the App Store. Change it in iOS Settings > Subscriptions.";
    }
    if (isAdminComp) return "Your complimentary plan cannot be changed here.";
    if (cancelScheduled) {
      return `Your subscription is scheduled to end on ${formatPlanDate(accessEndsAt) || "the end of your billing period"}. Resume it from the Current Plan tab to change billing period.`;
    }
    return null;
  })();
  const changePlanLocked = changePlanNote !== null;

  const switchDialogTitle = pendingPeriod ? `Switch to ${PREMIUM_PERIOD_LABELS[pendingPeriod]} billing?` : "";
  const switchDialogMessage = (() => {
    if (!pendingPeriod) return "";
    const label = premiumPriceLabel(pendingPeriod, getPremiumPriceLabel(pendingPeriod));
    if (trialActive) {
      const endsOn =
        formatPlanDate(trialEndDate) || formatPlanDate(currentSubscription?.current_period_end) || "the end of your trial";
      return `Your plan switches to ${label} on ${endsOn}, when your trial ends. Nothing is charged today.`;
    }
    const switchOn =
      formatPlanDate(currentSubscription?.next_billing_date ?? currentSubscription?.current_period_end) ||
      "your next billing date";
    return `Your plan switches to ${label} on ${switchOn}. Nothing is charged today.`;
  })();

  const cancelDialogMessage = (() => {
    const endDate = formatPlanDate(accessEndsAt) || "the end of your billing period";
    const trialPrefix = trialActive
      ? `Your free trial ends on ${formatPlanDate(trialEndDate) || endDate}. Cancelling now means you will not be charged. `
      : "";
    if (outstandingFees?.has_outstanding) {
      return `${trialPrefix}Your Premium access continues until ${endDate}. You also have $${outstandingFees.total_fees_usd.toFixed(2)} in outstanding trade fees (${outstandingFees.total_trades} trades in ${outstandingFees.billing_month}); these will be charged to your card. Continue?`;
    }
    return `${trialPrefix}Your Premium access continues until ${endDate}. After that your account moves to Free and your card will not be charged again. Trade fees for trades you have already executed are still billed as usual.`;
  })();

  const checkoutBusy = checkoutLoading || createCheckout.isPending;
  const trialEligible = isTrialEligible();
  const upgradeCta = trialEligible
    ? `Start ${TRIAL_DAYS}-day free trial`
    : `Upgrade to Premium for ${upgradePriceLabel}`;

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
              { id: "change", label: "Change Plan" },
              { id: "billing", label: "Billing History" },
              { id: "usage", label: "Usage Analytics" },
              { id: "fees", label: "Trade Fees" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabId)}
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
                <div className={`rounded-lg border border-[var(--primary)]/30 ${isFreePlan ? "bg-slate-600/10" : "bg-[var(--primary)]/10"} p-6`}>
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-1">{planTitle}</h3>
                      <p className={`font-semibold ${statusColor}`}>{statusLabel}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {trialActive && !cancelScheduled && (
                        <span className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-300">
                          Free trial: {trialDaysLeft} {trialDaysLeft === 1 ? "day" : "days"} left
                        </span>
                      )}
                      {cancelScheduled && (
                        <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-300">
                          Cancellation scheduled
                        </span>
                      )}
                      {isAppleBilled && (
                        <span className="inline-flex items-center rounded-full border border-slate-500/30 bg-slate-500/20 px-3 py-1 text-xs font-semibold text-slate-300">
                          Billed through the App Store
                        </span>
                      )}
                    </div>
                  </div>

                  {isLegacy && (
                    <div className="mb-4 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
                      <p className="text-sm text-blue-300">
                        Your plan is moving to Premium. Nothing changes this month.
                      </p>
                    </div>
                  )}

                  {/* Plan summary */}
                  {isFreePlan ? (
                    <div className="mb-6 space-y-4">
                      <div>
                        <h4 className="text-lg font-semibold text-white">
                          {trialEligible ? `Try Premium free for ${TRIAL_DAYS} days` : "Upgrade to Premium"}
                        </h4>
                        <p className="mt-1 text-sm text-slate-300">
                          Execute AI signals, build unlimited strategies, trade options and join VC Pools.
                        </p>
                      </div>
                      <div>
                        <BillingPeriodToggle
                          size="sm"
                          value={selectedBillingPeriod}
                          onChange={setSelectedBillingPeriod}
                          getSavingsPercent={getPremiumSavingsPercent}
                          disabled={checkoutBusy}
                        />
                        <p className="mt-2 text-xs text-slate-400">
                          {trialEligible
                            ? `No charge today. On day ${TRIAL_DAYS + 1} your card is charged $${upgradeAmount} and Premium renews ${upgradeRenewal} unless you cancel first.`
                            : `Billed ${upgradePriceLabel}. Cancel anytime; you keep access until the end of your billing period.`}
                        </p>
                      </div>
                    </div>
                  ) : cancelScheduled ? (
                    <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
                      <p className="text-sm text-amber-200">
                        Your plan ends on {formatPlanDate(accessEndsAt) || "the end of your billing period"}. You keep full access until then. No further charges.
                      </p>
                    </div>
                  ) : trialActive ? (
                    <p className="mb-6 text-sm text-slate-300">
                      Trial ends on {formatPlanDate(trialEndDate) || formatPlanDate(accessEndsAt) || "the end of your trial"}, then {currentPriceLabel}.
                    </p>
                  ) : (
                    <p className="mb-6 text-sm text-slate-300">
                      Next charge: {currentPriceLabel} on {formatPlanDate(currentSubscription.next_billing_date ?? currentSubscription.current_period_end) || "your next billing date"}.
                    </p>
                  )}

                  {/* Period details (paid plans only) */}
                  {!isFreePlan && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
                      {[
                        { label: "Billing Cycle", value: currentPeriodLabel },
                        {
                          label: "Auto-Renewal",
                          value: cancelScheduled ? "Off (ends at period end)" : currentSubscription.auto_renew ? "Enabled" : "Disabled",
                        },
                        { label: "Current Period Start", value: formatPlanDate(currentSubscription.current_period_start) || "Not available" },
                        {
                          label: cancelScheduled ? "Access Until" : "Current Period End",
                          value: formatPlanDate(cancelScheduled ? accessEndsAt : currentSubscription.current_period_end) || "Not available",
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
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3">
                    {isFreePlan ? (
                      <>
                        <button
                          type="button"
                          onClick={() => startPremiumCheckout()}
                          disabled={checkoutBusy}
                          className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {checkoutBusy ? "Loading..." : upgradeCta}
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab("change")}
                          className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] underline-offset-4 hover:underline transition-colors"
                        >
                          Compare billing periods
                        </button>
                      </>
                    ) : isAppleBilled ? (
                      <p className="text-sm text-slate-400">Manage in iOS Settings &gt; Subscriptions</p>
                    ) : cancelScheduled ? (
                      <button
                        type="button"
                        onClick={handleResumeSubscription}
                        disabled={resumeSubscription.isPending}
                        className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {resumeSubscription.isPending ? "Resuming..." : "Resume Premium"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleCancelClick}
                        disabled={cancelSubscription.isPending || cancelCheckLoading}
                        className="px-4 py-2 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {cancelCheckLoading ? "Checking..." : cancelSubscription.isPending ? "Cancelling..." : "Cancel Subscription"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Change Plan Tab */}
            {activeTab === "change" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white">Premium billing periods</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    One plan with every feature. Pick how often you want to be billed.
                  </p>
                </div>

                {changePlanNote && (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
                    <p className="text-sm text-amber-200">{changePlanNote}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {PREMIUM_BILLING_PERIODS.map((raw) => {
                    const period = raw as BillingPeriod;
                    const plan = premiumPlans.find((p) => p.billing_period === period) ?? null;
                    const amount = formatPremiumAmount(plan?.price, period);
                    const savings = getPremiumSavingsPercent(period);
                    const periodLabel = PREMIUM_PERIOD_LABELS[period];
                    const priceLabel = premiumPriceLabel(period, amount);
                    const isCurrent = !isFreePlan && period === currentPeriod;
                    const isSwitching = switchingPeriod === period;
                    const isCheckingOut = checkoutPeriod === period;

                    let buttonLabel: string;
                    let buttonDisabled: boolean;
                    let onButtonClick: () => void;
                    if (isFreePlan) {
                      buttonLabel = isCheckingOut
                        ? "Loading..."
                        : trialEligible
                          ? `Start ${TRIAL_DAYS}-day free trial`
                          : `Subscribe for ${priceLabel}`;
                      buttonDisabled = checkoutBusy;
                      onButtonClick = () => startPremiumCheckout(period);
                    } else if (isCurrent) {
                      buttonLabel = "Current plan";
                      buttonDisabled = true;
                      onButtonClick = () => {};
                    } else {
                      buttonLabel = isSwitching ? "Switching..." : `Switch to ${periodLabel}`;
                      buttonDisabled = changePlanLocked || changeBillingPeriod.isPending;
                      onButtonClick = () => setPendingPeriod(period);
                    }

                    return (
                      <div
                        key={period}
                        className={`relative flex flex-col rounded-lg border p-5 ${
                          isCurrent
                            ? "border-[var(--primary)]/60 bg-[var(--primary)]/10"
                            : "border-[--color-border] bg-[--color-surface]/30"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <h4 className="text-base font-semibold text-white">{periodLabel}</h4>
                          <div className="flex flex-wrap justify-end gap-1.5">
                            {savings > 0 && (
                              <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
                                Save {savings}%
                              </span>
                            )}
                            {isCurrent && (
                              <span className="inline-flex items-center rounded-full border border-[var(--primary)]/40 bg-[var(--primary)]/20 px-2 py-0.5 text-[11px] font-semibold text-[var(--primary)]">
                                Current plan
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mb-4 flex items-baseline gap-1">
                          <span className="text-3xl font-bold text-white">${amount}</span>
                          <span className="text-sm text-slate-400">{PREMIUM_PERIOD_SUFFIX[period]}</span>
                        </div>

                        <div className="mb-5 flex-1">
                          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">Everything in Premium</p>
                          <ul className="space-y-1.5 text-sm text-slate-300">
                            {PREMIUM_CARD_FEATURES.map((feature) => (
                              <li key={feature} className="flex items-start gap-2">
                                <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--primary)]" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <button
                          type="button"
                          onClick={onButtonClick}
                          disabled={buttonDisabled}
                          className={`w-full px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                            isCurrent
                              ? "border border-[var(--primary)]/40 text-[var(--primary)]"
                              : "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]"
                          }`}
                        >
                          {buttonLabel}
                        </button>
                      </div>
                    );
                  })}
                </div>

                <p className="text-xs text-slate-400">
                  {isFreePlan
                    ? "Cancel anytime; you keep access until the end of your billing period."
                    : "Changes take effect at your next billing date. You are never charged twice for the same period."}
                </p>
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

                    {/* Options Trading Fees */}
                    <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-5">
                      <h4 className="text-sm font-semibold text-white mb-3">
                        Options Trading Fees
                      </h4>

                      <ul className="space-y-2 text-xs text-slate-400">
                        <li className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full mt-1.5"></span>
                          <span>
                            <strong className="text-slate-300">Execution Fee: 0.03%</strong> per trade when opening or closing an options position. Applies to all call and put contracts.
                          </span>
                        </li>

                        <li className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full mt-1.5"></span>
                          <span>
                            <strong className="text-slate-300">Performance Fee: 0.5% – 3%</strong> of net profit, charged only on profitable AI-driven trades. No fee if there is no profit.
                          </span>
                        </li>
                      </ul>

                      <div className="mt-3 rounded-md bg-slate-900/50 p-3">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500 mb-2">Performance Fee Tiers</p>
                        <div className="grid grid-cols-2 gap-1.5 text-xs">
                          <span className="text-slate-400">Under $100 profit</span>
                          <span className="text-right text-slate-300">0.5%</span>
                          <span className="text-slate-400">$100 – $1,000</span>
                          <span className="text-right text-slate-300">1%</span>
                          <span className="text-slate-400">$1,000 – $10,000</span>
                          <span className="text-right text-slate-300">2%</span>
                          <span className="text-slate-400">$10,000+</span>
                          <span className="text-right text-slate-300">3%</span>
                        </div>
                      </div>
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
                                {f.source?.startsWith("options_") && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-[var(--primary)]/15 text-[var(--primary)]">
                                    {f.source === "options_execution" ? "Options" : "AI Perf."}
                                  </span>
                                )}
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
        title="Cancel Premium?"
        message={cancelDialogMessage}
        confirmText="Cancel at period end"
        cancelText="Keep Premium"
        type="danger"
        onConfirm={handleCancelSubscription}
        onCancel={() => { setShowCancelModal(false); setOutstandingFees(null); }}
      />

      <ConfirmationDialog
        isOpen={pendingPeriod !== null}
        title={switchDialogTitle}
        message={switchDialogMessage}
        confirmText="Switch plan"
        cancelText="Keep current"
        type="info"
        onConfirm={handleConfirmSwitch}
        onCancel={() => setPendingPeriod(null)}
      />
    </div>
  );
}
