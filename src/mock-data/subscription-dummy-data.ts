/**
 * SUBSCRIPTION DATA - Backend API Integration
 * Production data from Quantiva Backend API
 * All plans and features are fetched from backend
 */

export enum PlanTier {
  FREE = "FREE",
  PRO = "PRO",
  ELITE = "ELITE",
}

export enum BillingPeriod {
  MONTHLY = "MONTHLY",
  QUARTERLY = "QUARTERLY",
  YEARLY = "YEARLY",
}

export enum FeatureType {
  CUSTOM_STRATEGIES = "CUSTOM_STRATEGIES",
  VC_POOL_ACCESS = "VC_POOL_ACCESS",
  EARLY_ACCESS = "EARLY_ACCESS",
  REAL_TIME_DATA = "REAL_TIME_DATA",
  AUTO_EXECUTION = "AUTO_EXECUTION",
  MOBILE_ACCESS = "MOBILE_ACCESS",
  MULTI_EXCHANGE = "MULTI_EXCHANGE",
  COMMUNITY_ACCESS = "COMMUNITY_ACCESS",
}

export enum PaymentStatus {
  PENDING = "pending",
  SUCCEEDED = "succeeded",
  FAILED = "failed",
  REFUNDED = "refunded",
  CANCELLED = "cancelled",
}

// ============= SUBSCRIPTION PLANS - Backend API Format =============
export interface PlanFeature {
  feature_id: string;
  plan_id: string;
  feature_type: FeatureType;
  enabled: boolean;
  limit_value: number | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlan {
  plan_id: string;
  tier: PlanTier;
  billing_period: BillingPeriod;
  price: string;
  base_price: string;
  discount_percent: string;
  name: string;
  description: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  plan_features: PlanFeature[];
}

// Backend API Response Data
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    plan_id: "7f9d7f16-5a77-444b-9f67-b59365374c83",
    tier: PlanTier.PRO,
    billing_period: BillingPeriod.MONTHLY,
    price: "19.99",
    base_price: "19.99",
    discount_percent: "0",
    name: "PRO Plan",
    description: "Perfect for active traders with custom strategies",
    is_active: true,
    display_order: 2,
    created_at: "2026-02-12T19:15:49.478Z",
    updated_at: "2026-02-12T19:15:49.478Z",
    plan_features: [
      {
        feature_id: "e61c8403-9df8-4b1c-9d75-f74acee2227f",
        plan_id: "7f9d7f16-5a77-444b-9f67-b59365374c83",
        feature_type: FeatureType.CUSTOM_STRATEGIES,
        enabled: true,
        limit_value: 5,
        created_at: "2026-02-12T19:15:49.705Z",
        updated_at: "2026-02-12T19:15:49.705Z"
      }
    ]
  },
  {
    plan_id: "769f431f-a667-40ff-a976-2d2ae1a3f706",
    tier: PlanTier.PRO,
    billing_period: BillingPeriod.QUARTERLY,
    price: "50.97",
    base_price: "19.99",
    discount_percent: "15",
    name: "PRO Plan",
    description: "Perfect for active traders with custom strategies",
    is_active: true,
    display_order: 2,
    created_at: "2026-02-12T19:15:50.257Z",
    updated_at: "2026-02-12T19:15:50.257Z",
    plan_features: [
      {
        feature_id: "c56d5332-2cf5-4b49-95a3-8bca1ce218ea",
        plan_id: "769f431f-a667-40ff-a976-2d2ae1a3f706",
        feature_type: FeatureType.CUSTOM_STRATEGIES,
        enabled: true,
        limit_value: 5,
        created_at: "2026-02-12T19:15:50.366Z",
        updated_at: "2026-02-12T19:15:50.366Z"
      }
    ]
  },
  {
    plan_id: "4fd51395-790d-4f2c-974e-7e807a72e5d4",
    tier: PlanTier.PRO,
    billing_period: BillingPeriod.YEARLY,
    price: "191.9",
    base_price: "19.99",
    discount_percent: "20",
    name: "PRO Plan",
    description: "Perfect for active traders with custom strategies",
    is_active: true,
    display_order: 2,
    created_at: "2026-02-12T19:15:50.689Z",
    updated_at: "2026-02-12T19:15:50.689Z",
    plan_features: [
      {
        feature_id: "2af12565-0c28-40ef-b695-6f6f48900242",
        plan_id: "4fd51395-790d-4f2c-974e-7e807a72e5d4",
        feature_type: FeatureType.CUSTOM_STRATEGIES,
        enabled: true,
        limit_value: 5,
        created_at: "2026-02-12T19:15:50.796Z",
        updated_at: "2026-02-12T19:15:50.796Z"
      }
    ]
  }
];

// ============= CURRENT USER SUBSCRIPTION =============
export const CURRENT_USER_SUBSCRIPTION: null = null; // Will be fetched from backend

// ============= USAGE STATS =============
export interface UsageData {
  [key: string]: {
    used: number;
    limit: number | -1;
    period_start: Date;
    period_end: Date;
  };
}

export const USER_USAGE_STATS: UsageData = {}; // Will be fetched from backend

// ============= PAYMENT HISTORY =============
export interface PaymentRecord {
  payment_id: string;
  subscription_id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_provider: string;
  external_payment_id: string;
  payment_method: string;
  invoice_url: string | null;
  receipt_url: string | null;
  failure_reason: string | null;
  paid_at: Date | null;
  created_at: Date;
}

export const PAYMENT_HISTORY: PaymentRecord[] = []; // Will be fetched from backend

// ============= HELPER FUNCTIONS =============

/**
 * Get feature info from a specific plan
 */
export const getFeatureFromPlan = (
  planId: string,
  featureType: FeatureType
): PlanFeature | undefined => {
  const plan = SUBSCRIPTION_PLANS.find((p) => p.plan_id === planId);
  if (!plan) return undefined;
  return plan.plan_features.find((f) => f.feature_type === featureType);
};

/**
 * Get all plans for a specific tier
 */
export const getPlansByTier = (tier: PlanTier): SubscriptionPlan[] => {
  return SUBSCRIPTION_PLANS.filter((p) => p.tier === tier);
};

/**
 * Get price information for a plan
 */
export const getPriceInfo = (plan: SubscriptionPlan) => {
  return {
    price: parseFloat(plan.price),
    basePrice: parseFloat(plan.base_price),
    discount: parseInt(plan.discount_percent),
    saving: parseFloat(plan.base_price) - parseFloat(plan.price),
  };
};

/**
 * Group plans by billing period
 */
export const getPlansByBillingPeriod = (
  period: BillingPeriod
): SubscriptionPlan[] => {
  return SUBSCRIPTION_PLANS.filter((p) => p.billing_period === period);
};

/**
 * Get plans grouped by tier
 */
export const getPlansGroupedByTier = () => {
  const grouped: { [key in PlanTier]?: SubscriptionPlan[] } = {};
  SUBSCRIPTION_PLANS.forEach((plan) => {
    if (!grouped[plan.tier]) {
      grouped[plan.tier] = [];
    }
    grouped[plan.tier]?.push(plan);
  });
  return grouped;
};

/**
 * Calculate price with discount for a specific tier and billing period
 */
export const calculatePrice = (
  tier: PlanTier,
  period: BillingPeriod
): { price: number; discount: number; saving: number } => {
  const plans = SUBSCRIPTION_PLANS.filter((p) => p.tier === tier && p.billing_period === period);
  if (plans.length === 0) return { price: 0, discount: 0, saving: 0 };

  const plan = plans[0];
  const price = parseFloat(plan.price);
  const basePrice = parseFloat(plan.base_price);
  const discount = parseInt(plan.discount_percent);

  // Calculate savings based on monthly equivalent
  let totalMonths = 1;
  if (period === BillingPeriod.QUARTERLY) totalMonths = 3;
  if (period === BillingPeriod.YEARLY) totalMonths = 12;

  const monthlyEquivalentTotal = basePrice * totalMonths;
  const saving = monthlyEquivalentTotal - price;

  return {
    price,
    discount,
    saving: Math.round(saving * 100) / 100,
  };
};
