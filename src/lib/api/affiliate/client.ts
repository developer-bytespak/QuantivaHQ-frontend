/**
 * Affiliate API client. Mirrors `vcpool-admin/client.ts` exactly but with its
 * own axios instance, its own pair of localStorage tokens, and its own refresh
 * endpoint. Affiliates never share auth with users or admins.
 */

import axios, { AxiosInstance } from "axios";
import type {
  AffiliateAuthResponse,
  AffiliateLoginRequest,
  AffiliateProfile,
  AffiliateRefreshResponse,
  AffiliateSettings,
  AffiliateSignupRequest,
  CohortsResponse,
  DashboardSummary,
  EarningsResponse,
  FunnelResponse,
  PayoutsOverview,
  PerformanceSeries,
  ReferralAssets,
  ReferralsPage,
  UpdateAffiliateSettingsRequest,
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
const ACCESS_KEY = "quantivahq_affiliate_access_token";
const REFRESH_KEY = "quantivahq_affiliate_refresh_token";
const ME_CACHE_TTL_MS = 5000;

let meCache: { value: AffiliateProfile; expiresAt: number } | null = null;
let meInFlight: Promise<AffiliateProfile> | null = null;

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function setAffiliateTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearAffiliateTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  meCache = null;
  meInFlight = null;
}

export function hasAffiliateToken(): boolean {
  return !!getAccessToken();
}

export const affiliateAxios: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

affiliateAxios.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

affiliateAxios.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = getRefreshToken();
      if (refresh) {
        try {
          const { data } = await axios.post<AffiliateRefreshResponse>(
            `${API_BASE_URL}/affiliate/auth/refresh`,
            { refreshToken: refresh },
            { withCredentials: true }
          );
          if (data.accessToken && data.refreshToken) {
            setAffiliateTokens(data.accessToken, data.refreshToken);
            original.headers.Authorization = `Bearer ${data.accessToken}`;
            return affiliateAxios(original);
          }
        } catch {
          clearAffiliateTokens();
          if (typeof window !== "undefined") {
            window.location.href = "/affiliate/login";
          }
        }
      }
    }
    const message =
      err.response?.data?.message ?? err.message ?? "Request failed";
    err.message = Array.isArray(message) ? message.join(", ") : message;
    throw err;
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────

export async function affiliateSendCode(
  email: string
): Promise<{ message: string }> {
  const { data } = await axios.post<{ message: string }>(
    `${API_BASE_URL}/affiliate/auth/send-code`,
    { email },
    { withCredentials: true }
  );
  return data;
}

export async function affiliateVerifyCode(
  email: string,
  code: string
): Promise<{ verified: true }> {
  const { data } = await axios.post<{ verified: true }>(
    `${API_BASE_URL}/affiliate/auth/verify-code`,
    { email, code },
    { withCredentials: true }
  );
  return data;
}

export async function affiliateSignup(
  body: AffiliateSignupRequest
): Promise<AffiliateAuthResponse> {
  const { data } = await axios.post<AffiliateAuthResponse>(
    `${API_BASE_URL}/affiliate/auth/signup`,
    body,
    { withCredentials: true }
  );
  return data;
}

export async function affiliateLogin(
  body: AffiliateLoginRequest
): Promise<AffiliateAuthResponse> {
  const { data } = await axios.post<AffiliateAuthResponse>(
    `${API_BASE_URL}/affiliate/auth/login`,
    body,
    { withCredentials: true }
  );
  return data;
}

export async function affiliateLogout(): Promise<void> {
  try {
    await affiliateAxios.post("/affiliate/auth/logout");
  } catch {
    // swallow — still clear tokens client-side
  }
  clearAffiliateTokens();
}

export async function affiliateMe(): Promise<AffiliateProfile> {
  if (meCache && meCache.expiresAt > Date.now()) {
    return meCache.value;
  }
  if (meInFlight) return meInFlight;

  meInFlight = affiliateAxios
    .get<AffiliateProfile>("/affiliate/auth/me")
    .then((res) => {
      meCache = { value: res.data, expiresAt: Date.now() + ME_CACHE_TTL_MS };
      meInFlight = null;
      return res.data;
    })
    .catch((err) => {
      meInFlight = null;
      throw err;
    });
  return meInFlight;
}

// ─── Dashboard ────────────────────────────────────────────────────────

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const { data } = await affiliateAxios.get<DashboardSummary>(
    "/affiliate/dashboard/summary"
  );
  return data;
}

export async function getPerformance(
  range: 30 | 90 | 365
): Promise<PerformanceSeries> {
  const { data } = await affiliateAxios.get<PerformanceSeries>(
    "/affiliate/dashboard/performance",
    { params: { range } }
  );
  return data;
}

export async function getReferrals(
  page = 1,
  pageSize = 20
): Promise<ReferralsPage> {
  const { data } = await affiliateAxios.get<ReferralsPage>(
    "/affiliate/dashboard/referrals",
    { params: { page, pageSize } }
  );
  return data;
}

export async function getFunnel(): Promise<FunnelResponse> {
  const { data } = await affiliateAxios.get<FunnelResponse>(
    "/affiliate/analytics/funnel"
  );
  return data;
}

export async function getEarnings(): Promise<EarningsResponse> {
  const { data } = await affiliateAxios.get<EarningsResponse>(
    "/affiliate/analytics/earnings"
  );
  return data;
}

export async function getCohorts(): Promise<CohortsResponse> {
  const { data } = await affiliateAxios.get<CohortsResponse>(
    "/affiliate/analytics/cohorts"
  );
  return data;
}

export async function getReferralAssets(): Promise<ReferralAssets> {
  const { data } = await affiliateAxios.get<ReferralAssets>(
    "/affiliate/referral-assets"
  );
  return data;
}

export async function getPayoutsOverview(): Promise<PayoutsOverview> {
  const { data } = await affiliateAxios.get<PayoutsOverview>(
    "/affiliate/payouts"
  );
  return data;
}

export async function getSettings(): Promise<AffiliateSettings> {
  const { data } = await affiliateAxios.get<AffiliateSettings>(
    "/affiliate/settings"
  );
  return data;
}

export async function updateSettings(
  body: UpdateAffiliateSettingsRequest
): Promise<AffiliateSettings> {
  const { data } = await affiliateAxios.put<AffiliateSettings>(
    "/affiliate/settings",
    body
  );
  return data;
}

