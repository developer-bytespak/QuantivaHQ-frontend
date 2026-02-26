import { apiRequest, uploadFile } from "./client";

// ---- Phase 1C: Join + payment status + screenshot ----

export type PaymentMethod = "binance" | "stripe";

export interface JoinPoolRequest {
  payment_method: PaymentMethod;
  user_binance_uid?: string;
}

export interface JoinPoolResponse {
  reservation_id: string;
  submission_id: string;
  total_amount: number;
  investment_amount: number;
  pool_fee_amount: number;
  coin: string;
  admin_binance_uid?: string;
  deadline: string;
  minutes_remaining: number;
  payment_method: PaymentMethod;
  instructions?: string[];
  message?: string;
}

export interface PaymentStatusResponse {
  pool_id: string;
  membership: { exists: boolean };
  reservation: {
    reservation_id: string;
    status: string;
    expires_at: string;
    payment_method: string;
    minutes_remaining: number;
  } | null;
  payment: {
    submission_id: string;
    payment_method: string;
    status: string;
    total_amount: string;
    investment_amount: string;
    pool_fee_amount: string;
    screenshot_url: string | null;
    rejection_reason: string | null;
    payment_deadline: string;
    verified_at: string | null;
  } | null;
}

export interface UploadScreenshotResponse {
  message: string;
  submission_id: string;
  screenshot_url: string;
}

export async function joinPool(
  poolId: string,
  body: JoinPoolRequest
): Promise<JoinPoolResponse> {
  return apiRequest<JoinPoolRequest, JoinPoolResponse>({
    path: `/api/vc-pools/${poolId}/join`,
    method: "POST",
    body,
  });
}

export async function getPaymentStatus(
  poolId: string
): Promise<PaymentStatusResponse> {
  return apiRequest<never, PaymentStatusResponse>({
    path: `/api/vc-pools/${poolId}/payment-status`,
    method: "GET",
  });
}

export async function uploadPoolScreenshot(
  poolId: string,
  file: File
): Promise<UploadScreenshotResponse> {
  return uploadFile<UploadScreenshotResponse>({
    path: `/api/vc-pools/${poolId}/upload-screenshot`,
    file,
    fieldName: "screenshot",
    timeout: 60000,
  });
}

// ---- Browse (Phase 1B) ----

export interface VcPoolSummary {
  pool_id: string;
  name: string;
  description: string | null;
  coin_type: string;
  contribution_amount: string;
  max_members: number;
  available_seats: number;
  duration_days: number;
  pool_fee_percent: string;
  payment_window_minutes: number;
  admin_binance_uid: string | null;
  created_at: string;
}

export interface VcPoolsListResponse {
  pools: VcPoolSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface VcPoolDetails extends VcPoolSummary {
  verified_members_count: number;
  reserved_seats_count: number;
  status: string;
  started_at: string | null;
  end_date: string | null;
}

export async function getAvailableVcPools(
  page = 1,
  limit = 20
): Promise<VcPoolsListResponse> {
  const search = new URLSearchParams();
  search.set("page", String(page));
  search.set("limit", String(limit));

  return apiRequest<never, VcPoolsListResponse>({
    path: `/api/vc-pools/available?${search.toString()}`,
    method: "GET",
    credentials: "include",
  });
}

export async function getVcPoolById(id: string): Promise<VcPoolDetails> {
  return apiRequest<never, VcPoolDetails>({
    path: `/api/vc-pools/${id}`,
    method: "GET",
    credentials: "include",
  });
}

