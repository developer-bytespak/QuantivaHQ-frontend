import { create } from 'zustand';
import { 
  PlanTier, 
  BillingPeriod, 
  FeatureType,
  CURRENT_USER_SUBSCRIPTION,
  USER_USAGE_STATS,
  PAYMENT_HISTORY,
  SUBSCRIPTION_PLANS,
  getFeatureFromPlan,
  getPlansByTier,
  getPriceInfo,
  SubscriptionPlan,
  PlanFeature,
  PaymentRecord,
  UsageData,
} from '@/mock-data/subscription-dummy-data';

const HARDCODED_USER_ID = '741bd7d7-f365-4a02-b548-75bd37759561';
const API_BASE_URL =process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface CurrentSubscription {
  subscription_id: string;
  user_id: string;
  plan_id: string;
  tier: PlanTier;
  billing_period: BillingPeriod;
  status: string;
  current_period_start: Date;
  current_period_end: Date;
  next_billing_date: Date;
  last_payment_date: Date | null;
  trial_ends_at: Date | null;
  is_trial: boolean;
  auto_renew: boolean;
  cancelled_at: Date | null;
  external_id: string | null;
}

interface SubscriptionState {
  // Data
  currentSubscription: CurrentSubscription | null;
  allPlans: SubscriptionPlan[];
  allSubscriptions: any[]; // Direct frontend API response
  usageStats: UsageData;
  paymentHistory: PaymentRecord[];
  selectedBillingPeriod: BillingPeriod;
  selectedPlanId: string | null; // Track which plan user is viewing

  // UI States
  isLoading: boolean;
  error: string | null;
  showUpgradeModal: boolean;
  showCancelModal: boolean;
  showPaymentModal: boolean;

  // Actions
  setCurrentSubscription: (sub: CurrentSubscription | null) => void;
  setAllPlans: (plans: SubscriptionPlan[]) => void;
  setAllSubscriptions: (subs: any[]) => void;
  setUsageStats: (stats: UsageData) => void;
  setPaymentHistory: (history: PaymentRecord[]) => void;
  setSelectedBillingPeriod: (period: BillingPeriod) => void;
  setSelectedPlanId: (planId: string | null) => void;
  setShowUpgradeModal: (show: boolean) => void;
  setShowCancelModal: (show: boolean) => void;
  setShowPaymentModal: (show: boolean) => void;
  setError: (error: string | null) => void;
  setIsLoading: (loading: boolean) => void;

  // Helpers
  canAccessFeature: (feature: FeatureType) => boolean;
  getFeatureLimitInfo: (feature: FeatureType) => { enabled: boolean; limit: number | null };
  getUsagePercentage: (feature: FeatureType) => number;
  isFeatureLimitReached: (feature: FeatureType) => boolean;
  getDaysUntilNextBilling: () => number;
  isTrialActive: () => boolean;
  isSubscriptionActive: () => boolean;
  getAvailableUpgradePlans: () => SubscriptionPlan[];
  getCurrentPlan: () => SubscriptionPlan | null;
  getPlansByPeriod: (period: BillingPeriod) => SubscriptionPlan[];
  fetchSubscriptionData: () => Promise<void>;
}

const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  // Initial Data
  currentSubscription: CURRENT_USER_SUBSCRIPTION,
  allPlans: SUBSCRIPTION_PLANS,
  allSubscriptions: SUBSCRIPTION_PLANS,
  usageStats: USER_USAGE_STATS,
  paymentHistory: PAYMENT_HISTORY,
  selectedBillingPeriod: BillingPeriod.MONTHLY,
  selectedPlanId: null,

  // UI States
  isLoading: false,
  error: null,
  showUpgradeModal: false,
  showCancelModal: false,
  showPaymentModal: false,

  // Setters
  setCurrentSubscription: (sub) => set({ currentSubscription: sub }),

  setAllPlans: (plans) => set({ allPlans: plans }),

  setAllSubscriptions: (subs) => set({ allSubscriptions: subs }),

  setUsageStats: (stats) => set({ usageStats: stats }),

  setPaymentHistory: (history) => set({ paymentHistory: history }),

  setSelectedBillingPeriod: (period) => set({ selectedBillingPeriod: period }),

  setSelectedPlanId: (planId) => set({ selectedPlanId: planId }),

  setShowUpgradeModal: (show) => set({ showUpgradeModal: show }),

  setShowCancelModal: (show) => set({ showCancelModal: show }),

  setShowPaymentModal: (show) => set({ showPaymentModal: show }),

  setError: (error) => set({ error }),

  setIsLoading: (loading) => set({ isLoading: loading }),

  // Helper Functions
  canAccessFeature: (feature: FeatureType) => {
    const { currentSubscription, selectedPlanId, allSubscriptions } = get();
    
    // Use selectedPlanId if available (for viewing/comparing plans)
    const planId = selectedPlanId || currentSubscription?.plan_id;
    if (!planId) return false;
    
    // First try to find in allSubscriptions (from API)
    const plan = allSubscriptions.find((p: any) => p.plan_id === planId) ||
                 SUBSCRIPTION_PLANS.find((p) => p.plan_id === planId);
    
    if (!plan) return false;
    
    const planFeature = plan.plan_features.find((f: any) => f.feature_type === feature);
    return planFeature?.enabled ?? false;
  },

  getFeatureLimitInfo: (feature: FeatureType) => {
    const { currentSubscription, selectedPlanId, allSubscriptions } = get();
    
    // Use selectedPlanId if available (for viewing/comparing plans)
    const planId = selectedPlanId || currentSubscription?.plan_id;
    if (!planId) return { enabled: false, limit: null };
    
    // First try to find in allSubscriptions (from API)
    const plan = allSubscriptions.find((p: any) => p.plan_id === planId) ||
                 SUBSCRIPTION_PLANS.find((p) => p.plan_id === planId);
    
    if (!plan) return { enabled: false, limit: null };
    
    const planFeature = plan.plan_features.find((f: any) => f.feature_type === feature);
    return {
      enabled: planFeature?.enabled ?? false,
      limit: planFeature?.limit_value ?? null,
    };
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
    
    const today = new Date();
    const diff = currentSubscription.current_period_end.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  },

  isTrialActive: () => {
    const { currentSubscription } = get();
    if (!currentSubscription?.trial_ends_at) return false;
    
    const today = new Date();
    const diff = currentSubscription.trial_ends_at.getTime() - today.getTime();
    return diff > 0;
  },

  isSubscriptionActive: () => {
    const { currentSubscription } = get();
    return currentSubscription?.status === 'active' && !currentSubscription?.cancelled_at;
  },

  getAvailableUpgradePlans: () => {
    const { currentSubscription } = get();
    if (!currentSubscription) {
      return SUBSCRIPTION_PLANS.filter((p) => p.tier !== PlanTier.FREE);
    }

    const currentTier = currentSubscription.tier;

    // FREE can upgrade to PRO or ELITE
    if (currentTier === PlanTier.FREE) {
      return SUBSCRIPTION_PLANS.filter((p) => p.tier !== PlanTier.FREE);
    }

    // PRO can upgrade to ELITE or downgrade to FREE
    if (currentTier === PlanTier.PRO) {
      return SUBSCRIPTION_PLANS;
    }

    // ELITE can downgrade to PRO or FREE
    if (currentTier === PlanTier.ELITE) {
      return SUBSCRIPTION_PLANS;
    }

    return [];
  },

  getCurrentPlan: () => {
    const { currentSubscription } = get();
    if (!currentSubscription) return null;
    
    return SUBSCRIPTION_PLANS.find((p) => p.plan_id === currentSubscription.plan_id) || null;
  },

  getPlansByPeriod: (period: BillingPeriod) => {
    return SUBSCRIPTION_PLANS.filter((p) => p.billing_period === period);
  },

  fetchSubscriptionData: async () => {
    set({ isLoading: true, error: null });
    try {
      const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const response = await fetch(
        `${API_BASE_URL}/subscriptions/dashboard?userId=${HARDCODED_USER_ID}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          }
        }
      );

      console.log('API response status:', response);

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Fetched subscription data:', data);

      // Convert date strings to Date objects for currentSubscription
      let currentSubscription = data.current ? {
        ...data.current,
        current_period_start: new Date(data.current.current_period_start),
        current_period_end: new Date(data.current.current_period_end),
        next_billing_date: new Date(data.current.next_billing_date),
        last_payment_date: data.current.last_payment_date ? new Date(data.current.last_payment_date) : null,
        trial_ends_at: data.current.trial_ends_at ? new Date(data.current.trial_ends_at) : null,
        cancelled_at: data.current.cancelled_at ? new Date(data.current.cancelled_at) : null,
      } : null;

      // Convert date strings in payment history
      const paymentHistory = (data.payments || []).map((payment: any) => ({
        ...payment,
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

      // Map API response to store state
      set({
        currentSubscription,
        allPlans: data.allSubscriptions || SUBSCRIPTION_PLANS,
        allSubscriptions: data.allSubscriptions || SUBSCRIPTION_PLANS,
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
}));

export default useSubscriptionStore;
