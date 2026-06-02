/**
 * Types for the affiliate-facing API surface.
 * These mirror the response shapes returned by the NestJS controllers under
 * `src/modules/affiliate/`. Keep narrow and stable — only what the dashboard
 * actually reads.
 */

export type AffiliateStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "SUSPENDED"
  | "PAUSED";

export type AffiliateChannel =
  | "YOUTUBE"
  | "X"
  | "INSTAGRAM"
  | "TIKTOK"
  | "DISCORD"
  | "TELEGRAM"
  | "OTHER";

export interface AffiliateAdditionalChannelInput {
  type: AffiliateChannel;
  url?: string;
  customName?: string;
}

export interface AffiliateAuthResponse {
  affiliate: AffiliateProfile;
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  message: string;
}

export interface AffiliateRefreshResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
}

export interface AffiliateProfile {
  affiliate_id: string;
  email: string;
  display_name: string;
  full_name?: string | null;
  country?: string | null;
  tax_residency?: string | null;
  referral_code?: string | null;
  status: AffiliateStatus;
  commission_pct?: number | null;
  payout_instructions?: string | null;
  tax_form_url?: string | null;
  pending_balance?: number;
  paid_total?: number;
  clawed_back_total?: number;
  signup_count?: number;
  conversion_count?: number;
  revenue_generated?: number;
  last_activity_at?: string | null;
  created_at?: string;
  application?: {
    primary_channel: AffiliateChannel;
    primary_channel_custom_name?: string | null;
    channel_url?: string | null;
    additional_channels?:
      | Array<{
          type: AffiliateChannel;
          url?: string | null;
          customName?: string | null;
        }>
      | null;
    audience_size?: number | null;
    pitch: string;
    status: "PENDING" | "APPROVED" | "REJECTED" | "INFO_REQUESTED";
    rejection_reason?: string | null;
    reviewed_at?: string | null;
  } | null;
}

export interface AffiliateSignupRequest {
  email: string;
  password: string;
  displayName: string;
  fullName: string;
  country?: string;
  taxResidency?: string;
  primaryChannel: AffiliateChannel;
  primaryChannelCustomName?: string;
  channelUrl?: string;
  additionalChannels?: AffiliateAdditionalChannelInput[];
  audienceSize?: number;
  pitch: string;
}

export interface AffiliateLoginRequest {
  email: string;
  password: string;
}

// ─── Dashboard ──────────────────────────────────────────────────────────

export interface DashboardSummary {
  current_month: { signups: number; earnings_usd: number };
  previous_month: { signups: number; earnings_usd: number };
  totals: {
    signups: number;
    conversions: number;
    active_subscribers: number;
    revenue_generated_usd: number;
    pending_balance_usd: number;
    paid_total_usd: number;
    clawed_back_total_usd: number;
  };
}

export interface PerformanceSeries {
  range: 30 | 90 | 365;
  from: string;
  to: string;
  series: Array<{ date: string; signups: number; earnings_usd: number }>;
}

export interface ReferralsPage {
  page: number;
  page_size: number;
  total: number;
  items: Array<{
    user_id_hash: string;
    signup_date: string;
    current_tier: string;
    lifetime_commissions_usd: number;
    status: "Active" | "Churned";
  }>;
}

export interface FunnelResponse {
  steps: Array<{ name: string; count: number; rate: number | null }>;
}

export interface EarningsResponse {
  by_month: Array<{ month: string; earnings_usd: number; events: number }>;
  by_referred_user: Array<{
    user_id_hash: string;
    earnings_usd: number;
    events: number;
  }>;
}

export interface CohortsResponse {
  cohorts: Array<{
    signup_month: string;
    total_signups: number;
    still_active: number;
    retention_rate: number;
  }>;
}

export interface ReferralAssets {
  referral_code: string | null;
  referral_link: string | null;
  qr_payload: string | null;
}

export interface PayoutsOverview {
  balance: {
    pending_usd: number;
    paid_total_usd: number;
    clawed_back_total_usd: number;
  };
  next_payout: {
    scheduled_for: string;
    threshold_usd: number;
    cycle: string;
    eligible: boolean;
  };
  history: Array<{
    payout_id: string;
    period: string;
    gross_usd: number;
    net_usd: number;
    status: string;
    payment_reference: string | null;
    created_at: string;
    paid_at: string | null;
  }>;
}

export interface AffiliateSettings {
  affiliate_id: string;
  email: string;
  display_name: string;
  full_name: string | null;
  country: string | null;
  tax_residency: string | null;
  payout_instructions: string | null;
  tax_form_url: string | null;
  commission_pct: number | null;
  status: AffiliateStatus;
}

export interface UpdateAffiliateSettingsRequest {
  full_name?: string;
  country?: string;
  tax_residency?: string;
  payout_instructions?: string;
  tax_form_url?: string;
}
