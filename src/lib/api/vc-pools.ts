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

// ---- Phase 1E: User cancellation + my pools ----

export interface CancelMembershipResponse {
  cancellation_id: string;
  pool_status_at_request: string;
  member_value_at_exit: number;
  fee_amount: number;
  refund_amount: number;
  status: string;
  message: string;
}

export async function cancelMembership(poolId: string): Promise<CancelMembershipResponse> {
  return apiRequest<never, CancelMembershipResponse>({
    path: `/api/vc-pools/${poolId}/cancel-membership`,
    method: "POST",
    body: undefined as never,
  });
}

export interface MyCancellationItem {
  cancellation_id: string;
  status: string;
  requested_at: string;
  member_value_at_exit: number;
  fee_amount: number;
  refund_amount: number;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  refunded_at: string | null;
}

export interface MyCancellationResponse {
  has_cancellation: boolean;
  cancellation?: MyCancellationItem;
}

export async function getMyCancellation(poolId: string): Promise<MyCancellationResponse> {
  return apiRequest<never, MyCancellationResponse>({
    path: `/api/vc-pools/${poolId}/my-cancellation`,
    method: "GET",
  });
}

export interface MyPoolMembership {
  membership: {
    member_id: string;
    pool_id: string;
    pool_name: string;
    pool_status: string;
    coin_type: string;
    started_at: string | null;
    end_date: string | null;
    payment_method: string;
  };
  my_investment: {
    invested_amount: number;
    share_percent: number;
  };
  pool_performance: {
    current_pool_value: number;
    total_profit: number;
    total_invested: number;
  };
  my_value: {
    current_value: number;
    profit_loss: number;
  };
  cancellation: MyCancellationItem | null;
}

export interface MyPoolsResponse {
  pools: MyPoolMembership[];
}

export async function getMyPools(): Promise<MyPoolsResponse> {
  return apiRequest<never, MyPoolsResponse>({
    path: `/api/vc-pools/my-pools`,
    method: "GET",
  });
}

