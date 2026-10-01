/**
 * SUBSCRIPTION DATA - Backend API Integration
 * Production data from Quantiva Backend API
 * All plans and features are fetched from backend
 */

export enum PlanTier {
  FREE = "FREE",
  /** The single paid plan, sold monthly, quarterly or yearly with a 7-day trial for first-time subscribers. */
  PREMIUM = "PREMIUM",
  /** @deprecated legacy tier */
  PRO = "PRO",
  /** @deprecated legacy tier */
  ELITE = "ELITE",
  /** @deprecated legacy tier */
  ELITE_PLUS = "ELITE_PLUS",
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
  OPTIONS_TRADING = "OPTIONS_TRADING",
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
// The hardcoded multi-tier catalogue (SUBSCRIPTION_PLANS, getPlansByTier,
// getPriceInfo, getPlansByBillingPeriod, getPlansGroupedByTier,
// getFeatureFromPlan) was removed when Quantiva moved to a single Premium
// plan. Plans now come exclusively from GET /subscriptions (see
// subscription-store.ts) and pricing constants live in @/config/subscription.
