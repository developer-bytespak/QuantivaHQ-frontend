import { create } from 'zustand';
import { logger } from '@/lib/utils/logger';
import { apiRequest } from '@/lib/api/client';
import {
  PREMIUM_BILLING_PERIODS,
  formatPremiumAmount,
  isPaidTier,
  isPremiumBillingPeriod,
  premiumSavingsPercent,
} from '@/config/subscription';
import {
  PlanTier,
  BillingPeriod,
  FeatureType,
  CURRENT_USER_SUBSCRIPTION,
  USER_USAGE_STATS,
  PAYMENT_HISTORY,
  SubscriptionPlan,
  PaymentRecord,
  UsageData,
} from '@/mock-data/subscription-dummy-data';

export interface CurrentSubscription {
  subscription_id: string;
  user_id: string;
  plan_id: string;
  tier: PlanTier;
  billing_period: BillingPeriod;
  status: string;
  billing_provider: string | null; // 'stripe' | 'apple' | 'admin_override' | null
  provider_status: string | null; // 'trialing' | 'active' | 'past_due' | null
  current_period_start: Date | null;
  current_period_end: Date | null;
  next_billing_date: Date | null;
  last_payment_date: Date | null;
  trial_start: Date | null;
  trial_end: Date | null;
  /** @deprecated use trial_end */
  trial_ends_at: Date | null;
  is_trialing: boolean;
  /** @deprecated use is_trialing */
  is_trial: boolean;
  auto_renew: boolean;
  cancel_at_period_end: boolean;
  cancelled_at: Date | null;
  access_until: Date | null;
  external_id: string | null;
  trial_eligible?: boolean;
}

interface SubscriptionState {
  // Data
  currentSubscription: CurrentSubscription | null;
  hasPlan: boolean | null; // from API: true = user has a plan, false = must see choose-plan
  trialEligible: boolean;
  /** The MONTHLY Premium row (kept for callers that predate billing periods). */
  premiumPlan: SubscriptionPlan | null;
  /** All active PREMIUM rows, ordered MONTHLY, QUARTERLY, YEARLY. */
  premiumPlans: SubscriptionPlan[];
  allPlans: SubscriptionPlan[];
  allSubscriptions: any[]; // Direct frontend API response
  usageStats: UsageData;
  paymentHistory: PaymentRecord[];
  selectedPlanId: string | null; // Track which plan user is viewing
  /** Billing period the user is currently looking at in pricing UI. */
  selectedBillingPeriod: BillingPeriod;

  // UI States
  isLoading: boolean;
  error: string | null;

  // Actions
  setCurrentSubscription: (sub: CurrentSubscription | null) => void;
  setAllPlans: (plans: SubscriptionPlan[]) => void;
  setAllSubscriptions: (subs: any[]) => void;
  setUsageStats: (stats: UsageData) => void;
  setPaymentHistory: (history: PaymentRecord[]) => void;
  setSelectedPlanId: (planId: string | null) => void;
  setSelectedBillingPeriod: (period: BillingPeriod) => void;
  setError: (error: string | null) => void;
  setIsLoading: (loading: boolean) => void;

  // Helpers
  canAccessFeature: (feature: FeatureType) => boolean;
  getFeatureLimitInfo: (feature: FeatureType) => { enabled: boolean; limit: number | null };
  getUsagePercentage: (feature: FeatureType) => number;
  isFeatureLimitReached: (feature: FeatureType) => boolean;
  getDaysUntilNextBilling: () => number;
  isTrialActive: () => boolean;
  getTrialDaysLeft: () => number;
  isSubscriptionActive: () => boolean;
  isPremium: () => boolean;
  isCancelScheduled: () => boolean;
  getAccessEndsAt: () => Date | null;
  getCurrentPlan: () => SubscriptionPlan | null;
  /** Premium row for `period` (defaults to selectedBillingPeriod, then MONTHLY). */
  getPremiumPlan: (period?: BillingPeriod) => SubscriptionPlan | null;
  /** Plain amount string such as "29.99" for `period` (defaults as getPremiumPlan). */
  getPremiumPriceLabel: (period?: BillingPeriod) => string;
  /** Whole-number percent saved versus paying monthly; 0 for MONTHLY. */
  getPremiumSavingsPercent: (period: BillingPeriod) => number;
  /** Plain amount string for the user's own billing period (what they are charged). */
  getCurrentPremiumPrice: () => string;
  isTrialEligible: () => boolean;
  fetchSubscriptionData: () => Promise<void>;
  pollUntilPremium: (opts?: { attempts?: number; intervalMs?: number }) => Promise<boolean>;
}

const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value as string);
  return Number.isNaN(d.getTime()) ? null : d;
};

const daysFromNow = (date: Date | null): number => {
  if (!date) return 0;
  const diff = date.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
};

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const PERIOD_ORDER: Record<string, number> = PREMIUM_BILLING_PERIODS.reduce(
  (acc, p, i) => ({ ...acc, [p]: i }),
  {} as Record<string, number>,
);

/** PREMIUM rows only, de-duplicated per period and ordered MONTHLY, QUARTERLY, YEARLY. */
const pickPremiumPlans = (plans: SubscriptionPlan[]): SubscriptionPlan[] => {
  const byPeriod = new Map<string, SubscriptionPlan>();
  for (const p of plans) {
    if (p?.tier !== PlanTier.PREMIUM) continue;
    const period = String(p.billing_period ?? BillingPeriod.MONTHLY);
    if (!byPeriod.has(period)) byPeriod.set(period, p);
  }
  return Array.from(byPeriod.values()).sort(
    (a, b) => (PERIOD_ORDER[a.billing_period] ?? 99) - (PERIOD_ORDER[b.billing_period] ?? 99),
  );
};

const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  // Initial Data - populated from backend API
  currentSubscription: CURRENT_USER_SUBSCRIPTION,
  hasPlan: null,
  trialEligible: false,
  premiumPlan: null,
  premiumPlans: [],
  allPlans: [],
  allSubscriptions: [],
  usageStats: USER_USAGE_STATS,
  paymentHistory: PAYMENT_HISTORY,
  selectedPlanId: null,
  selectedBillingPeriod: BillingPeriod.MONTHLY,

  // UI States
  isLoading: false,
  error: null,

  // Setters
  setCurrentSubscription: (sub) => set({ currentSubscription: sub }),

  setAllPlans: (plans) => set({ allPlans: plans }),

  setAllSubscriptions: (subs) => set({ allSubscriptions: subs }),

  setUsageStats: (stats) => set({ usageStats: stats }),

  setPaymentHistory: (history) => set({ paymentHistory: history }),

  setSelectedPlanId: (planId) => set({ selectedPlanId: planId }),

  setSelectedBillingPeriod: (period) =>
    set({ selectedBillingPeriod: isPremiumBillingPeriod(period) ? period : BillingPeriod.MONTHLY }),

  setError: (error) => set({ error }),

  setIsLoading: (loading) => set({ isLoading: loading }),

  // Helper Functions
  canAccessFeature: (feature: FeatureType) => {
    try {
      const { currentSubscription, allPlans } = get();
      if (!currentSubscription) return false;
      const plan = allPlans?.find((p) => p.plan_id === currentSubscription.plan_id);

      // Use tier from matched plan if found, otherwise fall back to currentSubscription.tier directly.
      // This handles users whose plan may not yet appear in allPlans (e.g. plan list
      // not loaded yet, or backend omits it from allSubscriptions).
      const tier = plan?.tier ?? currentSubscription.tier;

      // PREMIUM unlocks every feature.
      if (tier === PlanTier.PREMIUM) return true;

      // LEGACY-TIER: ELITE_PLUS gets access to all features including options
      if (tier === PlanTier.ELITE_PLUS) return true;

      // LEGACY-TIER: ELITE gets access to all features EXCEPT OPTIONS_TRADING
      if (tier === PlanTier.ELITE && feature !== FeatureType.OPTIONS_TRADING) return true;

      // Without the full plan object we cannot check per-feature flags
      if (!plan) return false;

      const features = plan.plan_features ?? [];
      const planFeature = features.find((f: any) => f.feature_type === feature);
      return planFeature?.enabled ?? false;
    } catch {
      return false;
    }
  },

  getFeatureLimitInfo: (feature: FeatureType) => {
    try {
      const { currentSubscription, allPlans } = get();
      if (!currentSubscription) return { enabled: false, limit: null };
      const plan = allPlans?.find((p) => p.plan_id === currentSubscription.plan_id);
      if (!plan) return { enabled: false, limit: null };
      const features = plan.plan_features ?? [];
      const planFeature = features.find((f: any) => f.feature_type === feature);
      return {
        enabled: planFeature?.enabled ?? false,
        limit: planFeature?.limit_value ?? null,
      };
    } catch {
      return { enabled: false, limit: null };
    }
  },

  getUsagePercentage: (feature: FeatureType) => {
    const { usageStats } = get();
    const stats = usageStats[feature];

    if (!stats || stats.limit === -1) return 0; // Unlimited
    if (stats.limit === 0) return 0; // Not available

    return (stats.used / stats.limit) * 100;
  },

  isFeatureLimitReached: (feature: FeatureType) => {
    const { usageStats } = get();
    const stats = usageStats[feature];

    if (!stats) return false;
    if (stats.limit === -1) return false; // Unlimited
    if (stats.limit === 0) return true; // Not available

    return stats.used >= stats.limit;
  },

  getDaysUntilNextBilling: () => {
    const { currentSubscription } = get();
    if (!currentSubscription) return 0;
    const end = currentSubscription.next_billing_date ?? currentSubscription.current_period_end;
    if (!end) return 0;
    const diff = end.getTime() - Date.now();
    return Math.ceil(diff / (1000 * 3600 * 24));
  },

  isTrialActive: () => {
    const { currentSubscription } = get();
    if (!currentSubscription) return false;
    if (currentSubscription.is_trialing) return true;
    const end = currentSubscription.trial_end ?? currentSubscription.trial_ends_at;
    if (!end) return false;
    return end.getTime() > Date.now();
  },

  getTrialDaysLeft: () => {
    const { currentSubscription } = get();
    if (!currentSubscription) return 0;
    const end = currentSubscription.trial_end ?? currentSubscription.trial_ends_at;
    return daysFromNow(end);
  },

  isSubscriptionActive: () => {
    const { currentSubscription } = get();
    if (!currentSubscription) return false;
    if (currentSubscription.status !== 'active') return false;
    // Cancel-at-period-end keeps access until the period closes.
    const accessEnd = currentSubscription.access_until ?? currentSubscription.current_period_end;
    return !accessEnd || accessEnd.getTime() > Date.now();
  },

  isPremium: () => {
    const { currentSubscription } = get();
    if (!currentSubscription) return false;
    return isPaidTier(currentSubscription.tier);
  },

  isCancelScheduled: () => {
    const { currentSubscription } = get();
    if (!currentSubscription) return false;
    if (currentSubscription.cancel_at_period_end) return true;
    return (
      !currentSubscription.auto_renew &&
      !!currentSubscription.cancelled_at &&
      currentSubscription.status === 'active'
    );
  },

  getAccessEndsAt: () => {
    const { currentSubscription } = get();
    if (!currentSubscription) return null;
    return currentSubscription.access_until ?? currentSubscription.current_period_end ?? null;
  },

  getCurrentPlan: () => {
    const { currentSubscription, allPlans } = get();
    if (!currentSubscription) return null;

    return allPlans.find((p) => p.plan_id === currentSubscription.plan_id) || null;
  },

  getPremiumPlan: (period?: BillingPeriod) => {
    const { premiumPlan, premiumPlans, allPlans, selectedBillingPeriod } = get();
    const target = period ?? selectedBillingPeriod ?? BillingPeriod.MONTHLY;
    const fromList =
      premiumPlans.find((p) => p.billing_period === target) ??
      allPlans.find((p) => p.tier === PlanTier.PREMIUM && p.billing_period === target);
    if (fromList) return fromList;
    // Monthly keeps the pre-billing-period behaviour: any PREMIUM row will do.
    if (target === BillingPeriod.MONTHLY) {
      return premiumPlan ?? allPlans.find((p) => p.tier === PlanTier.PREMIUM) ?? null;
    }
    return null;
  },

  getPremiumPriceLabel: (period?: BillingPeriod) => {
    const target = period ?? get().selectedBillingPeriod ?? BillingPeriod.MONTHLY;
    const plan = get().getPremiumPlan(target);
    return formatPremiumAmount(plan?.price, target);
  },

  getPremiumSavingsPercent: (period: BillingPeriod) => {
    if (period === BillingPeriod.MONTHLY) return 0;
    const { getPremiumPriceLabel } = get();
    return premiumSavingsPercent(
      period,
      getPremiumPriceLabel(period),
      getPremiumPriceLabel(BillingPeriod.MONTHLY),
    );
  },

  getCurrentPremiumPrice: () => {
    const { currentSubscription, getCurrentPlan, getPremiumPriceLabel } = get();
    const period = currentSubscription?.billing_period ?? BillingPeriod.MONTHLY;
    // Prefer the exact row the user is subscribed to; it carries the real price.
    const own = getCurrentPlan();
    if (own && isPaidTier(own.tier)) return formatPremiumAmount(own.price, period);
    return getPremiumPriceLabel(period);
  },

  isTrialEligible: () => get().trialEligible,

  fetchSubscriptionData: async () => {
    set({ isLoading: true, error: null });
    try {
      const data: any = await apiRequest({ path: "/subscriptions" });
      logger.info('Fetched subscription data:', data);

      // Convert date strings to Date objects for currentSubscription
      const c = data.current;
      const currentSubscription: CurrentSubscription | null = c
        ? {
            ...c,
            tier: (c.tier ?? PlanTier.FREE) as PlanTier,
            billing_period: (c.billing_period ?? BillingPeriod.MONTHLY) as BillingPeriod,
            status: c.status ?? 'active',
            billing_provider: c.billing_provider ?? null,
            provider_status: c.provider_status ?? null,
            current_period_start: toDate(c.current_period_start),
            current_period_end: toDate(c.current_period_end),
            next_billing_date: toDate(c.next_billing_date),
            last_payment_date: toDate(c.last_payment_date),
            trial_start: toDate(c.trial_start),
            trial_end: toDate(c.trial_end ?? c.trial_ends_at),
            trial_ends_at: toDate(c.trial_end ?? c.trial_ends_at),
            is_trialing: c.is_trialing === true,
            is_trial: c.is_trialing === true || c.is_trial === true,
            auto_renew: c.auto_renew !== false,
            cancel_at_period_end: c.cancel_at_period_end === true,
            cancelled_at: toDate(c.cancelled_at),
            access_until: toDate(c.access_until),
            external_id: c.external_id ?? null,
          }
        : null;

      // Convert date strings in payment history and normalize amount
      const paymentHistory = (data.payments || []).map((payment: any) => ({
        ...payment,
        amount:
          typeof payment.amount === 'string'
            ? parseFloat(payment.amount)
            : payment.amount,
        paid_at: payment.paid_at ? new Date(payment.paid_at) : null,
        created_at: new Date(payment.created_at),
      }));

      // Convert date strings in usage stats
      const usageStats: UsageData = {};
      if (data.usage) {
        Object.entries(data.usage).forEach(([key, value]: [string, any]) => {
          usageStats[key] = {
            ...value,
            period_start: new Date(value.period_start),
            period_end: new Date(value.period_end),
          };
        });
      }

      const allPlans: SubscriptionPlan[] = data.allSubscriptions || [];
      const premiumPlans: SubscriptionPlan[] = pickPremiumPlans(
        Array.isArray(data.premium_plans) && data.premium_plans.length > 0
          ? data.premium_plans
          : allPlans,
      );
      const premiumPlan: SubscriptionPlan | null =
        data.premium_plan ??
        premiumPlans.find((p) => p.billing_period === BillingPeriod.MONTHLY) ??
        premiumPlans[0] ??
        null;

      // Map API response to store state (hasPlan: true = skip choose-plan, false = show choose-plan)
      set({
        currentSubscription,
        hasPlan: data.hasPlan === true || data.hasPlan === false ? data.hasPlan : null,
        trialEligible: data.trial_eligible === true,
        premiumPlan,
        premiumPlans,
        allPlans,
        allSubscriptions: allPlans,
        usageStats,
        paymentHistory,
        isLoading: false,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch subscription data';
      set({
        error: errorMessage,
        isLoading: false,
      });
      // Keep using fallback data on error
      console.error('Subscription fetch error:', errorMessage);
    }
  },

  pollUntilPremium: async ({ attempts = 6, intervalMs = 1500 } = {}) => {
    for (let i = 0; i < attempts; i++) {
      await get().fetchSubscriptionData();
      if (get().isPremium()) return true;
      if (i < attempts - 1) await sleep(intervalMs);
    }
    return get().isPremium();
  },
}));

export default useSubscriptionStore;
