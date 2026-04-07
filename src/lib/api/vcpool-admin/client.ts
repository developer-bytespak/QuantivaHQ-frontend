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
  AdminChangePasswordRequest,
  AdminChangePasswordResponse,
  SuperAdminUsersFilters,
  SuperAdminUsersResponse,
  SuperAdminUsersAnalyticsResponse,
  SuperAdminUsersGrowthFilters,
  SuperAdminUsersGrowthResponse,
  SuperAdminPoolsOversightResponse,
  SuperAdminUnifiedFinanceFilters,
  SuperAdminUnifiedFinanceResponse,
  VcPoolAdminsResponse,
  CreateVcPoolAdminRequest,
  CreateVcPoolAdminResponse,
  DeleteVcPoolAdminRequest,
  DeleteVcPoolAdminResponse,
  SuperAdminUpdateDefaultFeesRequest,
  SuperAdminUpdateDefaultFeesResponse,
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
  AdminBinanceDepositsResponse,
  AdminBinanceWithdrawalsResponse,
  AdminBinanceAnalytics,
  AdminBinanceTransactionFilters,
  AdminExchangeOrder,
  AdminPlaceExchangeOrderRequest,
  AdminPlaceExchangeOrderResponse,
  AdminExchangeOrdersListResponse,
  AdminCloseExchangeOrderRequest,
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
const ADMIN_ACCESS_KEY = "quantivahq_admin_access_token";
const ADMIN_REFRESH_KEY = "quantivahq_admin_refresh_token";
const ADMIN_ME_CACHE_TTL_MS = 5000;

let adminMeCache: { value: AdminProfile; expiresAt: number } | null = null;
let adminMeInFlight: Promise<AdminProfile> | null = null;

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
  adminMeCache = null;
  adminMeInFlight = null;
}

export function hasAdminToken(): boolean {
  return !!getAdminAccessToken();
}

export const adminAxios: AxiosInstance = axios.create({
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
          // Send refresh token in body so refresh works when cookies aren't sent (e.g. cross-origin dev)
          const { data } = await axios.post<AdminRefreshResponse>(
            `${API_BASE_URL}/admin/auth/refresh`,
            { refreshToken: refresh },
            { withCredentials: true }
          );
          if (data.accessToken && data.refreshToken) {
            setAdminTokens(data.accessToken, data.refreshToken);
            original.headers.Authorization = `Bearer ${data.accessToken}`;
            return adminAxios(original);
          }
        } catch {
          clearAdminTokens();
          if (typeof window !== "undefined") {
            const target = window.location.pathname.startsWith("/super/admin")
              ? "/super/admin/login"
              : "/vc-pool/admin/login";
            window.location.href = target;
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
  const now = Date.now();
  if (adminMeCache && adminMeCache.expiresAt > now) {
    return adminMeCache.value;
  }

  if (adminMeInFlight) {
    return adminMeInFlight;
  }

  adminMeInFlight = adminAxios
    .get<AdminProfile>("/admin/auth/me")
    .then(({ data }) => {
      adminMeCache = {
        value: data,
        expiresAt: Date.now() + ADMIN_ME_CACHE_TTL_MS,
      };
      return data;
    })
    .finally(() => {
      adminMeInFlight = null;
    });

  return adminMeInFlight;
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

/** PUT /admin/settings/password — Change admin password */
export async function adminChangePassword(
  body: AdminChangePasswordRequest
): Promise<AdminChangePasswordResponse> {
  const { data } = await adminAxios.put<AdminChangePasswordResponse>(
    "/admin/settings/password",
    body
  );
  return data;
}

/** GET /admin/super-admin/users */
export async function adminSuperListUsers(
  params?: SuperAdminUsersFilters
): Promise<SuperAdminUsersResponse> {
  const search = new URLSearchParams();
  if (params?.search) search.set("search", params.search);
  if (params?.plan) search.set("plan", params.plan);
  if (params?.subscription_status) {
    search.set("subscription_status", params.subscription_status);
  }
  if (params?.kyc_status) search.set("kyc_status", params.kyc_status);
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));

  const query = search.toString();
  const { data } = await adminAxios.get<SuperAdminUsersResponse>(
    `/admin/super-admin/users${query ? `?${query}` : ""}`
  );

  return data;
}

/** GET /admin/super-admin/users/analytics */
export async function adminSuperUsersAnalytics(): Promise<SuperAdminUsersAnalyticsResponse> {
  const { data } = await adminAxios.get<SuperAdminUsersAnalyticsResponse>(
    "/admin/super-admin/users/analytics"
  );

  return data;
}

/** GET /admin/super-admin/users/growth */
export async function adminSuperUsersGrowth(
  params?: SuperAdminUsersGrowthFilters
): Promise<SuperAdminUsersGrowthResponse> {
  const search = new URLSearchParams();
  if (params?.year) search.set("year", String(params.year));
  if (params?.subscription_plan) {
    search.set("subscription_plan", params.subscription_plan);
  }
  if (params?.active_only != null) {
    search.set("active_only", String(params.active_only));
  }

  const query = search.toString();
  const { data } = await adminAxios.get<SuperAdminUsersGrowthResponse>(
    `/admin/super-admin/users/growth${query ? `?${query}` : ""}`
  );

  return data;
}

/** GET /admin/super-admin/vc-pool-admins */
export async function adminSuperListVcPoolAdmins(): Promise<VcPoolAdminsResponse> {
  const { data } = await adminAxios.get<VcPoolAdminsResponse>(
    "/admin/super-admin/vc-pool-admins"
  );

  return data;
}

/** POST /admin/super-admin/vc-pool-admins */
export async function adminSuperCreateVcPoolAdmin(
  body: CreateVcPoolAdminRequest
): Promise<CreateVcPoolAdminResponse> {
  const { data } = await adminAxios.post<CreateVcPoolAdminResponse>(
    "/admin/super-admin/vc-pool-admins",
    body
  );

  return data;
}

/** DELETE /admin/super-admin/vc-pool-admins/:adminId */
export async function adminSuperDeleteVcPoolAdmin(
  adminId: string,
  body: DeleteVcPoolAdminRequest
): Promise<DeleteVcPoolAdminResponse> {
  const { data } = await adminAxios.delete<DeleteVcPoolAdminResponse>(
    `/admin/super-admin/vc-pool-admins/${adminId}`,
    { data: body }
  );

  return data;
}

/** PUT /admin/super-admin/default-fees */
export async function adminSuperUpdateDefaultFees(
  body: SuperAdminUpdateDefaultFeesRequest
): Promise<SuperAdminUpdateDefaultFeesResponse> {
  const { data } = await adminAxios.put<SuperAdminUpdateDefaultFeesResponse>(
    "/admin/super-admin/default-fees",
    body
  );

  return data;
}

/** GET /admin/super-admin/pools-oversight */
export async function adminSuperListPoolsOversight(params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<SuperAdminPoolsOversightResponse> {
  const search = new URLSearchParams();
  if (params?.status && params.status !== "all") search.set("status", params.status);
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));

  const query = search.toString();
  const { data } = await adminAxios.get<SuperAdminPoolsOversightResponse>(
    `/admin/super-admin/pools-oversight${query ? `?${query}` : ""}`
  );

  return data;
}

/** GET /admin/super-admin/finance/unified */
export async function adminSuperUnifiedFinance(
  params?: SuperAdminUnifiedFinanceFilters
): Promise<SuperAdminUnifiedFinanceResponse> {
  const search = new URLSearchParams();
  if (params?.year) search.set("year", String(params.year));
  if (params?.plan_tier) search.set("plan_tier", params.plan_tier);
  if (params?.billing_period) search.set("billing_period", params.billing_period);
  if (params?.vc_collection_source) {
    search.set("vc_collection_source", params.vc_collection_source);
  }

  const query = search.toString();
  const { data } = await adminAxios.get<SuperAdminUnifiedFinanceResponse>(
    `/admin/super-admin/finance/unified${query ? `?${query}` : ""}`
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

/** POST /admin/pools/:poolId/trades/from-signal — Open a trade from a strategy signal */
export async function adminTradeFromSignal(
  poolId: string,
  signalId: string
): Promise<AdminPoolTrade> {
  const { data } = await adminAxios.post<AdminPoolTrade>(
    `/admin/pools/${poolId}/trades/from-signal`,
    { signal_id: signalId }
  );
  return data;
}

/** POST /admin/pools/:poolId/orders/place — Place a direct MARKET or LIMIT order on Binance */
export async function adminPlaceExchangeOrder(
  poolId: string,
  body: AdminPlaceExchangeOrderRequest
): Promise<AdminPlaceExchangeOrderResponse> {
  const { data } = await adminAxios.post<AdminPlaceExchangeOrderResponse>(
    `/admin/pools/${poolId}/orders/place`,
    body
  );
  return data;
}

/** GET /admin/pools/:poolId/exchange-trades?status=&page=&limit= */
export async function adminListExchangeOrders(
  poolId: string,
  params?: { status?: "open" | "closed"; page?: number; limit?: number }
): Promise<AdminExchangeOrdersListResponse> {
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  if (params?.page != null) search.set("page", String(params.page));
  if (params?.limit != null) search.set("limit", String(params.limit));
  const query = search.toString();
  const { data } = await adminAxios.get<AdminExchangeOrdersListResponse>(
    `/admin/pools/${poolId}/exchange-trades${query ? `?${query}` : ""}`
  );
  return data;
}

/** PUT /admin/pools/:poolId/exchange-orders/:orderId/close — Close an exchange order */
export async function adminCloseExchangeOrder(
  poolId: string,
  orderId: string,
  body: AdminCloseExchangeOrderRequest
): Promise<AdminExchangeOrder> {
  const { data } = await adminAxios.put<AdminExchangeOrder>(
    `/admin/pools/${poolId}/exchange-orders/${orderId}/close`,
    body
  );
  return data;
}

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

// ---- Admin Binance APIs (Real Binance Stream) ----

export interface BinanceDeposit {
  id: string;
  coin: string;
  amount: string;
  address: string;
  addressTag: string | null;
  txId: string;
  insertTime: number;
  status: number;
  statusText: string;
  confirmTimes: string;
  unlockConfirm: number;
  network: string;
}

export interface BinanceWithdrawal {
  id: string;
  coin: string;
  withdrawOrderId: string;
  network: string;
  address: string;
  addressTag: string | null;
  txId: string;
  amount: string;
  transactionFee: string;
  status: number;
  statusText: string;
  completeTime: number;
  insertTime: number;
  failedReason?: string;
}

export interface BinanceAccountBalance {
  asset: string;
  free: string;
  locked: string;
  total: string;
}

export interface BinanceAccount {
  account_id: string;
  email: string;
  balances: BinanceAccountBalance[];
  account_info: {
    maker_commission: string;
    taker_commission: string;
    buy_commission: string;
    sell_commission: string;
    can_trade: boolean;
    can_deposit: boolean;
    can_withdraw: boolean;
  };
}

export interface BinanceTrade {
  symbol: string;
  id: string;
  orderId: string;
  price: string;
  qty: string;
  commission: string;
  commissionAsset: string;
  time: number;
  isBuyer: boolean;
  isMaker: boolean;
  isBestMatch: boolean;
}

export interface BinanceSummaryDeposit {
  id: string;
  coin: string;
  amount: number;
  network: string;
  status: number;
  address: string;
  addressTag: string;
  txId: string;
  insertTime: number;
  transferType: number;
  confirmTimes: string;
}

export interface BinanceSummaryWithdrawal {
  id: string;
  coin: string;
  amount: number;
  network: string;
  address: string;
  txId: string;
  status: number;
  completeTime: string;
  applyTime: string;
  transferType: number;
}

export interface BinanceSummary {
  account_info: {
    assets: Array<{
      symbol: string;
      free: string;
      locked: string;
      total: string;
    }>;
    totalValueUSD: number;
  };
  deposits: BinanceSummaryDeposit[];
  withdrawals: BinanceSummaryWithdrawal[];
  summary: {
    total_deposits: number;
    total_withdrawals: number;
    total_deposit_amount: number;
    total_withdrawal_amount: number;
  };
}

/** GET /admin/binance/health - No auth required */
export async function adminBinanceHealth() {
  const { data } = await axios.get("/admin/binance/health");
  return data;
}

/** GET /admin/binance/stream-status */
export async function adminBinanceStreamStatus() {
  const { data } = await adminAxios.get("/admin/binance/stream-status");
  return data;
}

/** GET /admin/binance/account */
export async function adminBinanceAccount(): Promise<{ success: boolean; data: BinanceAccount; last_updated: string }> {
  const { data } = await adminAxios.get("/admin/binance/account");
  return data;
}

/** GET /admin/binance/deposits */
export async function adminBinanceDeposits(params?: {
  coin?: string;
  status?: number;
  offset?: number;
  limit?: number;
  startTime?: number;
  endTime?: number;
}): Promise<{ success: boolean; data: BinanceDeposit[]; count: number; last_updated: string }> {
  const query = new URLSearchParams();
  if (params?.coin) query.set("coin", params.coin);
  if (params?.status !== undefined) query.set("status", String(params.status));
  if (params?.offset !== undefined) query.set("offset", String(params.offset));
  if (params?.limit !== undefined) query.set("limit", String(params.limit));
  if (params?.startTime) query.set("startTime", String(params.startTime));
  if (params?.endTime) query.set("endTime", String(params.endTime));
  
  const { data } = await adminAxios.get(
    `/admin/binance/deposits${query.toString() ? `?${query.toString()}` : ""}`
  );
  return data;
}

/** GET /admin/binance/withdrawals */
export async function adminBinanceWithdrawals(params?: {
  coin?: string;
  status?: number;
  offset?: number;
  limit?: number;
  startTime?: number;
  endTime?: number;
}): Promise<{ success: boolean; data: BinanceWithdrawal[]; count: number; last_updated: string }> {
  const query = new URLSearchParams();
  if (params?.coin) query.set("coin", params.coin);
  if (params?.status !== undefined) query.set("status", String(params.status));
  if (params?.offset !== undefined) query.set("offset", String(params.offset));
  if (params?.limit !== undefined) query.set("limit", String(params.limit));
  if (params?.startTime) query.set("startTime", String(params.startTime));
  if (params?.endTime) query.set("endTime", String(params.endTime));
  
  const { data } = await adminAxios.get(
    `/admin/binance/withdrawals${query.toString() ? `?${query.toString()}` : ""}`
  );
  return data;
}

/** GET /admin/binance/trades/:symbol */
export async function adminBinanceTrades(
  symbol: string,
  limit: number = 50
): Promise<{ success: boolean; data: BinanceTrade[]; count: number; symbol: string; last_updated: string }> {
  const { data } = await adminAxios.get(
    `/admin/binance/trades/${symbol}?limit=${limit}`
  );
  return data;
}

/** GET /admin/binance/summary */
export async function adminBinanceSummary(coin?: string): Promise<{ success: boolean; data: BinanceSummary; last_updated: string }> {
  const query = new URLSearchParams();
  if (coin) query.set("coin", coin);

  const { data } = await adminAxios.get(
    `/admin/binance/summary${query.toString() ? `?${query.toString()}` : ""}`
  );
  return data;
}

// ---- Contact Submissions ----

export interface ContactSubmissionRow {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  subject: string;
  message: string;
  source: string;
  created_at: string;
  user: { user_id: string; username: string; email: string } | null;
}

export interface ContactSubmissionsResponse {
  submissions: ContactSubmissionRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/** GET /admin/super-admin/contact-submissions */
export async function adminSuperListContactSubmissions(params?: {
  page?: number;
  limit?: number;
  source?: string;
  subject?: string;
  search?: string;
}): Promise<ContactSubmissionsResponse> {
  const search = new URLSearchParams();
  if (params?.source && params.source !== "all") search.set("source", params.source);
  if (params?.subject && params.subject !== "all") search.set("subject", params.subject);
  if (params?.search) search.set("search", params.search);
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));

  const query = search.toString();
  const { data } = await adminAxios.get<ContactSubmissionsResponse>(
    `/admin/super-admin/contact-submissions${query ? `?${query}` : ""}`
  );

  return data;
}
