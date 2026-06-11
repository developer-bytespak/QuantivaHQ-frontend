/**
 * Super-admin affiliate API. Uses the existing admin axios instance / admin
 * JWT — affiliates here are subjects under super-admin oversight, not auth
 * principals.
 */

import { adminAxios } from "./client";

// ─── Types ──────────────────────────────────────────────────────────

export type AffiliateAdminStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "SUSPENDED"
  | "PAUSED";
export type AffiliateApplicationStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "INFO_REQUESTED";
export interface AffiliateListItem {
  affiliate_id: string;
  email: string;
  display_name: string;
  full_name: string | null;
  country: string | null;
  referral_code: string | null;
  status: AffiliateAdminStatus;
  commission_pct: string | number | null;
  signup_count: number;
  conversion_count: number;
  revenue_generated: string | number;
  pending_balance: string | number;
  paid_total: string | number;
  last_activity_at: string | null;
  created_at: string;
  application: { primary_channel: string } | null;
}

export interface AffiliateListResponse {
  page: number;
  page_size: number;
  total: number;
  items: AffiliateListItem[];
}

export interface AffiliateApplicationItem {
  application_id: string;
  affiliate_id: string;
  primary_channel: string;
  primary_channel_custom_name: string | null;
  channel_url: string | null;
  additional_channels:
    | Array<{ type: string; url?: string | null; customName?: string | null }>
    | null;
  audience_size: number | null;
  pitch: string;
  status: AffiliateApplicationStatus;
  rejection_reason: string | null;
  reviewed_by_admin_id: string | null;
  reviewed_at: string | null;
  ip_address: string | null;
  device_id: string | null;
  created_at: string;
  affiliate: {
    affiliate_id: string;
    email: string;
    display_name: string;
    full_name: string | null;
    country: string | null;
    status: string;
    created_at: string;
  };
}

export interface AffiliateApplicationsResponse {
  page: number;
  page_size: number;
  total: number;
  items: AffiliateApplicationItem[];
}

export interface AffiliateApplicationDetail extends AffiliateApplicationItem {
  affiliate: AffiliateApplicationItem["affiliate"] & {
    tax_residency: string | null;
  };
  enrichment: {
    prior_accounts_with_same_email: Array<{
      affiliate_id: string;
      status: string;
      created_at: string;
    }>;
    prior_applications_from_same_ip: Array<{
      application_id: string;
      affiliate_id: string;
      status: string;
      created_at: string;
    }>;
  };
}

export interface AffiliateDetail {
  affiliate_id: string;
  email: string;
  display_name: string;
  full_name: string | null;
  country: string | null;
  tax_residency: string | null;
  referral_code: string | null;
  status: AffiliateAdminStatus;
  linked_user_id: string | null;
  commission_pct: string | number | null;
  payout_instructions: string | null;
  pending_balance: string | number;
  paid_total: string | number;
  clawed_back_total: string | number;
  signup_count: number;
  conversion_count: number;
  revenue_generated: string | number;
  last_activity_at: string | null;
  created_at: string;
  application: AffiliateApplicationItem | null;
}

export interface PayoutListItem {
  payout_id: string;
  affiliate_id: string;
  period: string;
  gross_usd: string | number;
  net_usd: string | number;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  payment_reference: string | null;
  processed_by_admin_id: string | null;
  created_at: string;
  paid_at: string | null;
  affiliate?: {
    affiliate_id: string;
    email: string;
    display_name: string;
    payout_instructions: string | null;
  };
}

export interface PayoutsListResponse {
  page: number;
  page_size: number;
  total: number;
  items: PayoutListItem[];
}

export interface ProgramSettings {
  version: number;
  is_active: boolean;
  subscription_commission_pct: string | number;
  recurring_months_cap: number;
  attribution_window_days: number;
  refund_clawback_days: number;
  payout_threshold_usd: string | number;
  payout_cycle: string;
  affiliate_signup_velocity_24h: number;
  updated_by_admin_id: string | null;
  created_at: string;
}

// ─── Filters ────────────────────────────────────────────────────────

export interface ListAffiliatesFilters {
  status?: string;
  country?: string;
  channel?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
  sort?: string;
  page?: number;
  page_size?: number;
}

function buildQuery(filters: Record<string, unknown>) {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v != null && v !== "") search.set(k, String(v));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

// ─── List + applications ────────────────────────────────────────────

export async function superListAffiliates(
  filters: ListAffiliatesFilters = {}
): Promise<AffiliateListResponse> {
  const { data } = await adminAxios.get<AffiliateListResponse>(
    `/admin/super-admin/affiliates${buildQuery(filters as Record<string, unknown>)}`
  );
  return data;
}

export async function superExportAffiliatesCSV(
  filters: ListAffiliatesFilters = {}
): Promise<string> {
  const { data } = await adminAxios.get<string>(
    `/admin/super-admin/affiliates/export${buildQuery(filters as Record<string, unknown>)}`,
    { responseType: "text" }
  );
  return data;
}

export async function superListAffiliateApplications(
  filters: { status?: string; page?: number; page_size?: number } = {}
): Promise<AffiliateApplicationsResponse> {
  const { data } = await adminAxios.get<AffiliateApplicationsResponse>(
    `/admin/super-admin/affiliates/applications${buildQuery(filters as Record<string, unknown>)}`
  );
  return data;
}

export async function superGetAffiliateApplication(
  id: string
): Promise<AffiliateApplicationDetail> {
  const { data } = await adminAxios.get<AffiliateApplicationDetail>(
    `/admin/super-admin/affiliates/applications/${id}`
  );
  return data;
}

export async function superApproveAffiliateApplication(
  id: string,
  body: {
    referral_code: string;
    commission_pct: number;
    notes?: string;
  }
): Promise<{ ok: true }> {
  const { data } = await adminAxios.post<{ ok: true }>(
    `/admin/super-admin/affiliates/applications/${id}/approve`,
    body
  );
  return data;
}

export async function superRejectAffiliateApplication(
  id: string,
  body: { reason: string; message?: string }
): Promise<{ ok: true }> {
  const { data } = await adminAxios.post<{ ok: true }>(
    `/admin/super-admin/affiliates/applications/${id}/reject`,
    body
  );
  return data;
}

export async function superRequestInfoOnAffiliateApplication(
  id: string,
  body: { message: string }
): Promise<{ ok: true }> {
  const { data } = await adminAxios.post<{ ok: true }>(
    `/admin/super-admin/affiliates/applications/${id}/request-info`,
    body
  );
  return data;
}

// ─── Detail + per-affiliate actions ─────────────────────────────────

export async function superGetAffiliateDetail(
  id: string
): Promise<AffiliateDetail> {
  const { data } = await adminAxios.get<AffiliateDetail>(
    `/admin/super-admin/affiliates/${id}`
  );
  return data;
}

export async function superGetAffiliateReferrals(
  id: string,
  page = 1,
  pageSize = 20
) {
  const { data } = await adminAxios.get(
    `/admin/super-admin/affiliates/${id}/referrals${buildQuery({ page, page_size: pageSize })}`
  );
  return data as {
    page: number;
    page_size: number;
    total: number;
    items: Array<{
      user_id: string;
      email: string;
      signup_date: string;
      kyc_status: string;
      current_tier: string;
      lifetime_revenue_usd: string | number;
      attributed_commissions_usd: string | number;
      status: "Active" | "Churned";
      referral_code_used: string;
      attributed_at: string;
    }>;
  };
}

export async function superGetAffiliateTransactions(
  id: string,
  page = 1,
  pageSize = 50
) {
  const { data } = await adminAxios.get(
    `/admin/super-admin/affiliates/${id}/transactions${buildQuery({ page, page_size: pageSize })}`
  );
  return data as {
    page: number;
    page_size: number;
    total: number;
    items: Array<Record<string, unknown>>;
  };
}

export async function superGetAffiliatePayouts(
  id: string,
  page = 1,
  pageSize = 20
) {
  const { data } = await adminAxios.get(
    `/admin/super-admin/affiliates/${id}/payouts${buildQuery({ page, page_size: pageSize })}`
  );
  return data as {
    page: number;
    page_size: number;
    total: number;
    items: PayoutListItem[];
  };
}

export async function superGetAffiliateAuditLog(
  id: string,
  page = 1,
  pageSize = 50
) {
  const { data } = await adminAxios.get(
    `/admin/super-admin/affiliates/${id}/audit-log${buildQuery({ page, page_size: pageSize })}`
  );
  return data as {
    page: number;
    page_size: number;
    total: number;
    items: Array<{
      log_id: string;
      affiliate_id: string | null;
      application_id: string | null;
      actor_admin_id: string | null;
      action: string;
      metadata: Record<string, unknown> | null;
      created_at: string;
    }>;
  };
}

export async function superPauseAffiliate(id: string, reason?: string) {
  const { data } = await adminAxios.post(
    `/admin/super-admin/affiliates/${id}/pause`,
    { reason }
  );
  return data;
}
export async function superSuspendAffiliate(id: string, reason?: string) {
  const { data } = await adminAxios.post(
    `/admin/super-admin/affiliates/${id}/suspend`,
    { reason }
  );
  return data;
}
export async function superResumeAffiliate(id: string, reason?: string) {
  const { data } = await adminAxios.post(
    `/admin/super-admin/affiliates/${id}/resume`,
    { reason }
  );
  return data;
}
export async function superResetAffiliateCode(
  id: string,
  referralCode: string
) {
  const { data } = await adminAxios.post(
    `/admin/super-admin/affiliates/${id}/reset-code`,
    { referral_code: referralCode }
  );
  return data;
}
export async function superSetAffiliateCommissionRate(
  id: string,
  body: { commission_pct: number; reason?: string }
) {
  const { data } = await adminAxios.post(
    `/admin/super-admin/affiliates/${id}/commission-rate`,
    body
  );
  return data;
}
export async function superAdjustAffiliateBalance(
  id: string,
  body: { delta_usd: number; reason: string }
) {
  const { data } = await adminAxios.post(
    `/admin/super-admin/affiliates/${id}/adjust-balance`,
    body
  );
  return data;
}
export async function superGrantAffiliateQhq(
  id: string,
  body: { amount: number; reason: string }
): Promise<{
  ok: true;
  amount: number;
  user_id: string;
  balance_after: string | null;
}> {
  const { data } = await adminAxios.post(
    `/admin/super-admin/affiliates/${id}/grant-qhq`,
    body
  );
  return data;
}
export async function superAddAffiliateNote(id: string, note: string) {
  const { data } = await adminAxios.post(
    `/admin/super-admin/affiliates/${id}/notes`,
    { note }
  );
  return data;
}

export interface DeleteAffiliateResult {
  ok: true;
  deleted: {
    affiliate_id: string;
    email: string;
    display_name: string;
    referrals: number;
    commission_events: number;
    payouts: number;
    audit_log_rows: number;
    users_unlinked: number;
  };
}

export async function superDeleteAffiliate(
  id: string,
  body: { confirm_display_name?: string } = {}
): Promise<DeleteAffiliateResult> {
  const { data } = await adminAxios.delete<DeleteAffiliateResult>(
    `/admin/super-admin/affiliates/${id}`,
    { data: body }
  );
  return data;
}

export interface SimulateSubscriptionPaymentResult {
  ok: true;
  payment: {
    payment_id: string;
    subscription_id: string;
    amount_usd: number;
    external_payment_id: string;
    paid_at: string | null;
  };
  subscription_tier: string;
  user: {
    user_id: string;
    email: string;
    referred_by_affiliate_id: string | null;
  };
  commission: {
    event_id: string;
    gross_amount_usd: number;
    commission_rate: number;
    commission_usd: number;
    status: string;
    created_at: string;
  } | null;
  affiliate: {
    affiliate_id: string;
    display_name: string;
    email: string;
    commission_pct: number | null;
    pending_balance: number;
    paid_total: number;
    conversion_count: number;
  } | null;
}

export async function superSimulateSubscriptionPayment(body: {
  user_id: string;
  amount_usd: number;
}): Promise<SimulateSubscriptionPaymentResult> {
  const { data } = await adminAxios.post<SimulateSubscriptionPaymentResult>(
    `/admin/super-admin/affiliates/test/simulate-subscription-payment`,
    body
  );
  return data;
}

// ─── Payouts ────────────────────────────────────────────────────────

export async function superListAffiliatePayouts(
  filters: { status?: string; page?: number; page_size?: number } = {}
): Promise<PayoutsListResponse> {
  const { data } = await adminAxios.get<PayoutsListResponse>(
    `/admin/super-admin/affiliates/payouts${buildQuery(filters as Record<string, unknown>)}`
  );
  return data;
}

export async function superRunAffiliatePayoutBatch() {
  const { data } = await adminAxios.post(
    `/admin/super-admin/affiliates/payouts/run`
  );
  return data as { period: string; created_payouts: string[] };
}

export async function superMarkAffiliatePayoutPaid(
  payoutId: string,
  body: { payment_reference?: string }
) {
  const { data } = await adminAxios.post(
    `/admin/super-admin/affiliates/payouts/${payoutId}/mark-paid`,
    body
  );
  return data as { ok: true };
}

// ─── Program settings ───────────────────────────────────────────────

export async function superGetAffiliateProgramSettings(): Promise<ProgramSettings> {
  const { data } = await adminAxios.get<ProgramSettings>(
    `/admin/super-admin/affiliates/settings`
  );
  return data;
}

export async function superUpdateAffiliateProgramSettings(
  body: Partial<{
    subscription_commission_pct: number;
    recurring_months_cap: number;
    attribution_window_days: number;
    refund_clawback_days: number;
    payout_threshold_usd: number;
    payout_cycle: "MONTHLY" | "QUARTERLY";
    affiliate_signup_velocity_24h: number;
  }>
): Promise<ProgramSettings> {
  const { data } = await adminAxios.put<ProgramSettings>(
    `/admin/super-admin/affiliates/settings`,
    body
  );
  return data;
}
