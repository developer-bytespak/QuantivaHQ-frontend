/**
 * Subscription catalogue constants.
 *
 * Quantiva sells a single paid plan ("Premium") in three billing periods
 * (monthly, quarterly, yearly), each with a 7-day free trial for first-time
 * subscribers. Legacy tiers (PRO / ELITE / ELITE_PLUS) may still appear on
 * existing rows for a short while and are treated as paid.
 */

export type PremiumBillingPeriod = "MONTHLY" | "QUARTERLY" | "YEARLY";

/** Display order for billing-period toggles. */
export const PREMIUM_BILLING_PERIODS: readonly PremiumBillingPeriod[] = [
  "MONTHLY",
  "QUARTERLY",
  "YEARLY",
] as const;

/** Fallback list prices used until GET /subscriptions has loaded. */
export const PREMIUM_PRICES: Record<PremiumBillingPeriod, string> = {
  MONTHLY: "29.99",
  QUARTERLY: "79.99",
  YEARLY: "299.99",
};

/** Monthly fallback, kept for callers that predate the three-period catalogue. */
export const PREMIUM_PRICE_FALLBACK = PREMIUM_PRICES.MONTHLY;

export const PREMIUM_PERIOD_LABELS: Record<PremiumBillingPeriod, string> = {
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  YEARLY: "Yearly",
};

/** Suffix shown right after the big price on a plan card. */
export const PREMIUM_PERIOD_SUFFIX: Record<PremiumBillingPeriod, string> = {
  MONTHLY: "/month",
  QUARTERLY: "/3 months",
  YEARLY: "/year",
};

/** "renews <phrase>" wording for footnotes. */
export const PREMIUM_PERIOD_RENEWAL: Record<PremiumBillingPeriod, string> = {
  MONTHLY: "monthly",
  QUARTERLY: "every 3 months",
  YEARLY: "yearly",
};

/** Number of months covered by one charge of each period. */
export const PREMIUM_PERIOD_MONTHS: Record<PremiumBillingPeriod, number> = {
  MONTHLY: 1,
  QUARTERLY: 3,
  YEARLY: 12,
};

export const TRIAL_DAYS = 7;

export const PLAN_DISPLAY_NAMES: Record<string, string> = {
  FREE: "Free",
  PREMIUM: "Premium",
  PRO: "Pro (legacy)",
  ELITE: "Elite (legacy)",
  ELITE_PLUS: "Elite Plus (legacy)",
};

export const LEGACY_PAID_TIERS = ["PRO", "ELITE", "ELITE_PLUS"] as const;

export function isPremiumBillingPeriod(value: unknown): value is PremiumBillingPeriod {
  return typeof value === "string" && (PREMIUM_BILLING_PERIODS as readonly string[]).includes(value);
}

/**
 * Normalise a raw price (string decimal from the API, number, or nothing) to a
 * two-decimal amount string such as "79.99", falling back to the list price
 * for the period.
 */
export function formatPremiumAmount(
  price: string | number | null | undefined,
  period: PremiumBillingPeriod = "MONTHLY",
): string {
  const parsed = price !== undefined && price !== null ? parseFloat(String(price)) : NaN;
  if (Number.isFinite(parsed) && parsed > 0) return parsed.toFixed(2);
  return PREMIUM_PRICES[period];
}

/**
 * Full price label for a period, e.g. "$29.99/month", "$79.99 every 3 months",
 * "$299.99/year". `price` defaults to the list price for the period.
 */
export function premiumPriceLabel(
  period: PremiumBillingPeriod,
  price?: string | number | null,
): string {
  const amount = formatPremiumAmount(price, period);
  switch (period) {
    case "QUARTERLY":
      return `$${amount} every 3 months`;
    case "YEARLY":
      return `$${amount}/year`;
    default:
      return `$${amount}/month`;
  }
}

/**
 * Percent saved versus paying monthly for the same span, rounded to a whole
 * number. Always 0 for MONTHLY. Prices default to the list prices.
 */
export function premiumSavingsPercent(
  period: PremiumBillingPeriod,
  periodPrice?: string | number | null,
  monthlyPrice?: string | number | null,
): number {
  if (period === "MONTHLY") return 0;
  const monthly = parseFloat(formatPremiumAmount(monthlyPrice, "MONTHLY"));
  const actual = parseFloat(formatPremiumAmount(periodPrice, period));
  const full = monthly * PREMIUM_PERIOD_MONTHS[period];
  if (!Number.isFinite(full) || full <= 0 || !Number.isFinite(actual)) return 0;
  return Math.max(0, Math.round(((full - actual) / full) * 100));
}

export function isLegacyPaidTier(tier: string | null | undefined): boolean {
  if (!tier) return false;
  return (LEGACY_PAID_TIERS as readonly string[]).includes(tier);
}

/** PREMIUM or any legacy paid tier. */
export function isPaidTier(tier: string | null | undefined): boolean {
  if (!tier) return false;
  return tier === "PREMIUM" || isLegacyPaidTier(tier);
}

export function getPlanDisplayName(tier: string | null | undefined): string {
  if (!tier) return PLAN_DISPLAY_NAMES.FREE;
  return PLAN_DISPLAY_NAMES[tier] ?? tier;
}

/** "October 8, 2026" style date used across subscription copy. */
export function formatPlanDate(value: string | Date | null | undefined): string {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

/** "Oct 8" style date for compact UI such as the top bar. */
export function formatPlanDateShort(value: string | Date | null | undefined): string {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
