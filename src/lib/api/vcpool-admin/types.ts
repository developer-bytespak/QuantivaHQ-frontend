/**
 * VC Pool Admin API types — Phase 1A/1B
 * Auth + settings + pool management
 */

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AdminProfile {
  admin_id: string;
  email: string;
  full_name: string;
  binance_uid: string | null;
  default_pool_fee_percent: string;
  default_admin_profit_fee_percent: string;
  default_cancellation_fee_percent: string;
  default_payment_window_minutes: number;
  created_at: string;
}

export interface AdminLoginResponse {
  admin: {
    admin_id: string;
    email: string;
    full_name: string;
  };
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  message: string;
}

export interface AdminRefreshResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
}

export interface UpdateBinanceRequest {
  binance_uid: string;
}

export interface UpdateBinanceResponse {
  message: string;
  binance_uid: string;
}

export interface UpdateFeesRequest {
  default_pool_fee_percent: number;
  default_admin_profit_fee_percent: number;
  default_cancellation_fee_percent: number;
  default_payment_window_minutes: number;
}

export interface UpdateFeesResponse {
  message: string;
  admin_id: string;
  default_pool_fee_percent: string;
  default_admin_profit_fee_percent: string;
  default_cancellation_fee_percent: string;
  default_payment_window_minutes: number;
}

// ---- Phase 1B: Admin pool management ----

export type PoolStatus =
  | "draft"
  | "open"
  | "full"
  | "active"
  | "completed"
  | "cancelled";

export interface AdminPoolSummary {
  pool_id: string;
  name: string;
  status: PoolStatus;
  coin_type: string;
  contribution_amount: string;
  max_members: number;
  verified_members_count: number;
  reserved_seats_count: number;
  duration_days: number;
  pool_fee_percent: string;
  is_replica: boolean;
  started_at: string | null;
  end_date: string | null;
  total_invested_usdt: string | null;
  current_pool_value_usdt: string | null;
  total_profit_usdt: string | null;
  created_at: string;
}

export interface AdminPoolsListResponse {
  pools: AdminPoolSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminPoolDetails extends AdminPoolSummary {
  admin_id: string;
  description: string | null;
  admin_profit_fee_percent: string;
  cancellation_fee_percent: string;
  payment_window_minutes: number;
  is_archived: boolean;
  completed_at: string | null;
  cancelled_at: string | null;
  original_pool_id: string | null;
  _count: {
    members: number;
    seat_reservations: number;
    trades: number;
  };
}

export interface CreatePoolRequest {
  name: string;
  description?: string;
  coin_type: string;
  contribution_amount: number;
  max_members: number;
  duration_days: number;
  pool_fee_percent?: number;
  admin_profit_fee_percent?: number;
  cancellation_fee_percent?: number;
  payment_window_minutes?: number;
}

// All fields optional in update; backend validates draft status
export type UpdatePoolRequest = Partial<CreatePoolRequest>;

