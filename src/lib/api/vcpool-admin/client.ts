/**
 * VC Pool Admin API client — Phase 1A
 * Base path: /admin. Uses separate admin JWT (quantivahq_admin_* in localStorage).
 * Does not use the user API client or user tokens.
 */

import axios, { AxiosInstance } from "axios";
import type {
  AdminLoginRequest,
  AdminLoginResponse,
  AdminRefreshResponse,
  AdminProfile,
  UpdateBinanceRequest,
  UpdateBinanceResponse,
  UpdateFeesRequest,
  UpdateFeesResponse,
  AdminPoolsListResponse,
  AdminPoolDetails,
  CreatePoolRequest,
  UpdatePoolRequest,
  AdminPaymentsListResponse,
  AdminReservationsListResponse,
  AdminMembersListResponse,
  AdminApprovePaymentResponse,
  AdminRejectPaymentResponse,
  AdminRejectPaymentRequest,
  AdminStartPoolResponse,
  AdminPoolTrade,
  AdminOpenTradeRequest,
  AdminCloseTradeRequest,
  AdminTradesListResponse,
  AdminCancellationsListResponse,
  AdminApproveCancellationResponse,
  AdminRejectCancellationRequest,
  AdminRejectCancellationResponse,
  AdminMarkRefundedRequest,
  AdminMarkRefundedResponse,
  AdminCompletePoolResponse,
  AdminPayoutsListResponse,
  AdminMarkPayoutPaidRequest,
  AdminMarkPayoutPaidResponse,
  AdminCancelPoolResponse,
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
const ADMIN_ACCESS_KEY = "quantivahq_admin_access_token";
const ADMIN_REFRESH_KEY = "quantivahq_admin_refresh_token";

function getAdminAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ADMIN_ACCESS_KEY);
}

function getAdminRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ADMIN_REFRESH_KEY);
}

export function setAdminTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ADMIN_ACCESS_KEY, accessToken);
  localStorage.setItem(ADMIN_REFRESH_KEY, refreshToken);
}

export function clearAdminTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ADMIN_ACCESS_KEY);
  localStorage.removeItem(ADMIN_REFRESH_KEY);
}

export function hasAdminToken(): boolean {
  return !!getAdminAccessToken();
}

const adminAxios: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

adminAxios.interceptors.request.use((config) => {
  const token = getAdminAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

adminAxios.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = getAdminRefreshToken();
      if (refresh) {
        try {
          const { data } = await axios.post<AdminRefreshResponse>(
            `${API_BASE_URL}/admin/auth/refresh`,
            {},
            { withCredentials: true }
          );
          if (data.accessToken) {
            setAdminTokens(data.accessToken, data.refreshToken);
            original.headers.Authorization = `Bearer ${data.accessToken}`;
            return adminAxios(original);
          }
        } catch {
          clearAdminTokens();
          if (typeof window !== "undefined") {
            window.location.href = "/admin/login";
          }
        }
      }
    }
    const message = err.response?.data?.message ?? err.message ?? "Request failed";
    err.message = Array.isArray(message) ? message.join(", ") : message;
    throw err;
  }
);

/** POST /admin/auth/login */
export async function adminLogin(
  body: AdminLoginRequest
): Promise<AdminLoginResponse> {
  const { data } = await axios.post<AdminLoginResponse>(
    `${API_BASE_URL}/admin/auth/login`,
    body,
    { withCredentials: true }
  );
  if (data.accessToken && data.refreshToken) {
    setAdminTokens(data.accessToken, data.refreshToken);
  }
  return data;
}

/** POST /admin/auth/refresh */
export async function adminRefresh(): Promise<AdminRefreshResponse> {
  const { data } = await axios.post<AdminRefreshResponse>(
    `${API_BASE_URL}/admin/auth/refresh`,
    {},
    { withCredentials: true }
  );
  if (data.accessToken && data.refreshToken) {
    setAdminTokens(data.accessToken, data.refreshToken);
  }
  return data;
}

/** POST /admin/auth/logout */
export async function adminLogout(): Promise<{ message: string }> {
  try {
    const { data } = await adminAxios.post<{ message: string }>("/admin/auth/logout");
    return data;
  } finally {
    clearAdminTokens();
  }
}

/** GET /admin/auth/me */
export async function adminMe(): Promise<AdminProfile> {
  const { data } = await adminAxios.get<AdminProfile>("/admin/auth/me");
  return data;
}

/** GET /admin/settings (same as me) */
export async function adminGetSettings(): Promise<AdminProfile> {
  const { data } = await adminAxios.get<AdminProfile>("/admin/settings");
  return data;
}

/** PUT /admin/settings/binance */
export async function adminUpdateBinance(
  body: UpdateBinanceRequest
): Promise<UpdateBinanceResponse> {
  const { data } = await adminAxios.put<UpdateBinanceResponse>(
    "/admin/settings/binance",
    body
  );
  return data;
}

/** PUT /admin/settings/fees */
export async function adminUpdateFees(
  body: UpdateFeesRequest
): Promise<UpdateFeesResponse> {
  const { data } = await adminAxios.put<UpdateFeesResponse>(
    "/admin/settings/fees",
    body
  );
  return data;
}

// ---- Phase 1B: Admin pool management ----

/** GET /admin/pools?status=&page=&limit= */
export async function adminListPools(params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<AdminPoolsListResponse> {
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));
  const query = search.toString();
  const { data } = await adminAxios.get<AdminPoolsListResponse>(
    `/admin/pools${query ? `?${query}` : ""}`
  );
  return data;
}

/** POST /admin/pools */
export async function adminCreatePool(
  body: CreatePoolRequest
): Promise<AdminPoolDetails> {
  const { data } = await adminAxios.post<AdminPoolDetails>("/admin/pools", body);
  return data;
}

/** GET /admin/pools/:id */
export async function adminGetPool(id: string): Promise<AdminPoolDetails> {
  const { data } = await adminAxios.get<AdminPoolDetails>(`/admin/pools/${id}`);
  return data;
}

/** PUT /admin/pools/:id */
export async function adminUpdatePool(
  id: string,
  body: UpdatePoolRequest
): Promise<AdminPoolDetails> {
  const { data } = await adminAxios.put<AdminPoolDetails>(
    `/admin/pools/${id}`,
    body
  );
  return data;
}

/** DELETE /admin/pools/:id — Soft delete (draft pools only) */
export async function adminDeletePool(poolId: string): Promise<{ message: string }> {
  const { data } = await adminAxios.delete<{ message: string }>(
    `/admin/pools/${poolId}`
  );
  return data;
}

/** PUT /admin/pools/:id/publish */
export async function adminPublishPool(id: string): Promise<AdminPoolDetails> {
  const { data } = await adminAxios.put<AdminPoolDetails>(
    `/admin/pools/${id}/publish`,
    {}
  );
  return data;
}

/** POST /admin/pools/:id/clone */
export async function adminClonePool(id: string): Promise<AdminPoolDetails> {
  const { data } = await adminAxios.post<AdminPoolDetails>(
    `/admin/pools/${id}/clone`,
    {}
  );
  return data;
}

// ---- Phase 1C: Admin payments, reservations, members ----

/** GET /admin/pools/:poolId/payments */
export async function adminListPayments(
  poolId: string,
  params?: { status?: string; payment_method?: string; page?: number; limit?: number }
): Promise<AdminPaymentsListResponse> {
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  if (params?.payment_method) search.set("payment_method", params.payment_method);
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));
  const query = search.toString();
  const { data } = await adminAxios.get<AdminPaymentsListResponse>(
    `/admin/pools/${poolId}/payments${query ? `?${query}` : ""}`
  );
  return data;
}

/** GET /admin/pools/:poolId/reservations */
export async function adminListReservations(
  poolId: string
): Promise<AdminReservationsListResponse> {
  const { data } = await adminAxios.get<AdminReservationsListResponse>(
    `/admin/pools/${poolId}/reservations`
  );
  return data;
}

/** GET /admin/pools/:poolId/members */
export async function adminListMembers(
  poolId: string
): Promise<AdminMembersListResponse> {
  const { data } = await adminAxios.get<AdminMembersListResponse>(
    `/admin/pools/${poolId}/members`
  );
  return data;
}

/** PUT /admin/pools/:poolId/payments/:submissionId/approve */
export async function adminApprovePayment(
  poolId: string,
  submissionId: string
): Promise<AdminApprovePaymentResponse> {
  const { data } = await adminAxios.put<AdminApprovePaymentResponse>(
    `/admin/pools/${poolId}/payments/${submissionId}/approve`,
    {}
  );
  return data;
}

/** PUT /admin/pools/:poolId/payments/:submissionId/reject */
export async function adminRejectPayment(
  poolId: string,
  submissionId: string,
  body: AdminRejectPaymentRequest
): Promise<AdminRejectPaymentResponse> {
  const { data } = await adminAxios.put<AdminRejectPaymentResponse>(
    `/admin/pools/${poolId}/payments/${submissionId}/reject`,
    body
  );
  return data;
}

// ---- Phase 1D: Start pool + trades ----

/** PUT /admin/pools/:id/start — Transition full pool to active */
export async function adminStartPool(poolId: string): Promise<AdminStartPoolResponse> {
  const { data } = await adminAxios.put<AdminStartPoolResponse>(
    `/admin/pools/${poolId}/start`,
    {}
  );
  return data;
}

/** POST /admin/pools/:poolId/trades — Open a new trade */
export async function adminCreateTrade(
  poolId: string,
  body: AdminOpenTradeRequest
): Promise<AdminPoolTrade> {
  const { data } = await adminAxios.post<AdminPoolTrade>(
    `/admin/pools/${poolId}/trades`,
    body
  );
  return data;
}

/** GET /admin/pools/:poolId/trades?status=&page=&limit= */
export async function adminListTrades(
  poolId: string,
  params?: { status?: "open" | "closed"; page?: number; limit?: number }
): Promise<AdminTradesListResponse> {
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  if (params?.page != null) search.set("page", String(params.page));
  if (params?.limit != null) search.set("limit", String(params.limit));
  const query = search.toString();
  const { data } = await adminAxios.get<AdminTradesListResponse>(
    `/admin/pools/${poolId}/trades${query ? `?${query}` : ""}`
  );
  return data;
}

/** PUT /admin/pools/:poolId/trades/:tradeId/close — Close trade with exit price */
export async function adminCloseTrade(
  poolId: string,
  tradeId: string,
  body: AdminCloseTradeRequest
): Promise<AdminPoolTrade> {
  const { data } = await adminAxios.put<AdminPoolTrade>(
    `/admin/pools/${poolId}/trades/${tradeId}/close`,
    body
  );
  return data;
}

// ---- Phase 1E: Cancellations, Payouts, Complete, Cancel pool ----

/** GET /admin/pools/:id/cancellations */
export async function adminListCancellations(poolId: string): Promise<AdminCancellationsListResponse> {
  const { data } = await adminAxios.get<AdminCancellationsListResponse>(
    `/admin/pools/${poolId}/cancellations`
  );
  return data;
}

/** PUT /admin/pools/:id/cancellations/:cid/approve */
export async function adminApproveCancellation(
  poolId: string,
  cancellationId: string
): Promise<AdminApproveCancellationResponse> {
  const { data } = await adminAxios.put<AdminApproveCancellationResponse>(
    `/admin/pools/${poolId}/cancellations/${cancellationId}/approve`,
    {}
  );
  return data;
}

/** PUT /admin/pools/:id/cancellations/:cid/reject */
export async function adminRejectCancellation(
  poolId: string,
  cancellationId: string,
  body: AdminRejectCancellationRequest
): Promise<AdminRejectCancellationResponse> {
  const { data } = await adminAxios.put<AdminRejectCancellationResponse>(
    `/admin/pools/${poolId}/cancellations/${cancellationId}/reject`,
    body
  );
  return data;
}

/** PUT /admin/pools/:id/cancellations/:cid/mark-refunded */
export async function adminMarkRefunded(
  poolId: string,
  cancellationId: string,
  body: AdminMarkRefundedRequest
): Promise<AdminMarkRefundedResponse> {
  const { data } = await adminAxios.put<AdminMarkRefundedResponse>(
    `/admin/pools/${poolId}/cancellations/${cancellationId}/mark-refunded`,
    body
  );
  return data;
}

/** PUT /admin/pools/:id/complete */
export async function adminCompletePool(poolId: string): Promise<AdminCompletePoolResponse> {
  const { data } = await adminAxios.put<AdminCompletePoolResponse>(
    `/admin/pools/${poolId}/complete`,
    {}
  );
  return data;
}

/** GET /admin/pools/:id/payouts */
export async function adminListPayouts(poolId: string): Promise<AdminPayoutsListResponse> {
  const { data } = await adminAxios.get<AdminPayoutsListResponse>(
    `/admin/pools/${poolId}/payouts`
  );
  return data;
}

/** PUT /admin/pools/:id/payouts/:pid/mark-paid */
export async function adminMarkPayoutPaid(
  poolId: string,
  payoutId: string,
  body: AdminMarkPayoutPaidRequest
): Promise<AdminMarkPayoutPaidResponse> {
  const { data } = await adminAxios.put<AdminMarkPayoutPaidResponse>(
    `/admin/pools/${poolId}/payouts/${payoutId}/mark-paid`,
    body
  );
  return data;
}

/** PUT /admin/pools/:id/cancel — Cancel open/full pool (full refund) */
export async function adminCancelPool(poolId: string): Promise<AdminCancelPoolResponse> {
  const { data } = await adminAxios.put<AdminCancelPoolResponse>(
    `/admin/pools/${poolId}/cancel`,
    {}
  );
  return data;
}

// ---- Admin strategy APIs (same as Top Trades, using admin JWT for Signals tab) ----

export interface AdminPreBuiltStrategy {
  strategy_id: string;
  name: string;
  type: string;
  asset_type?: string;
  description?: string;
}

/** GET /strategies/pre-built?asset_type=crypto — List pre-built strategies for admin */
export async function adminGetPreBuiltStrategies(
  assetType: "crypto" | "stock" = "crypto"
): Promise<AdminPreBuiltStrategy[]> {
  const { data } = await adminAxios.get<AdminPreBuiltStrategy[]>(
    `/strategies/pre-built?asset_type=${assetType}`
  );
  return Array.isArray(data) ? data : [];
}

export interface AdminTrendingAssetSignal {
  signal_id: string;
  action: string;
  confidence: number;
  final_score: number;
  entry_price?: number;
  stop_loss?: number;
  take_profit_1?: number;
}

export interface AdminTrendingAsset {
  asset_id: string;
  symbol: string;
  display_name: string;
  asset_type?: string;
  price_usd: number;
  price_change_24h?: number;
  volume_24h?: number;
  trend_score?: number;
  signal?: AdminTrendingAssetSignal;
}

export interface AdminTrendingWithInsightsResponse {
  strategy: { id: string; name: string; description?: string };
  assets: AdminTrendingAsset[];
}

/** GET /strategies/pre-built/:id/trending-with-insights — Trending assets with signals for admin */
export async function adminGetTrendingAssetsWithInsights(
  strategyId: string,
  limit: number = 500
): Promise<AdminTrendingWithInsightsResponse> {
  const { data } = await adminAxios.get<AdminTrendingWithInsightsResponse>(
    `/strategies/pre-built/${strategyId}/trending-with-insights?limit=${limit}`,
    { timeout: 120000 }
  );
  return data;
}
