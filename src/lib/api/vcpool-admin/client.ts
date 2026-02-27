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
