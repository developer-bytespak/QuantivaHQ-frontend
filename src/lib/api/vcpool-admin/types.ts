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

// ---- Phase 1C: Admin payments, reservations, members ----

export interface AdminPaymentSubmission {
  submission_id: string;
  user_id: string;
  reservation_id: string;
  payment_method: string;
  status: string;
  total_amount: string;
  investment_amount: string;
  pool_fee_amount: string;
  screenshot_url: string | null;
  rejection_reason: string | null;
  payment_deadline: string;
  verified_at: string | null;
  created_at: string;
  user_email?: string;
  user_username?: string;
}

export interface AdminPaymentsListResponse {
  submissions: AdminPaymentSubmission[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface AdminReservation {
  reservation_id: string;
  user_id: string;
  status: string;
  expires_at: string;
  payment_method: string;
  created_at: string;
  user_email?: string;
  user_username?: string;
}

export interface AdminReservationsListResponse {
  reservations: AdminReservation[];
  pagination?: { page: number; limit: number; total: number; totalPages: number };
}

export interface AdminPoolMember {
  member_id: string;
  user_id: string;
  payment_method: string;
  share_percent: string;
  joined_at: string;
  user_email?: string;
  user_username?: string;
}

export interface AdminMembersListResponse {
  members: AdminPoolMember[];
  pagination?: { page: number; limit: number; total: number; totalPages: number };
}

export interface AdminApprovePaymentResponse {
  message: string;
  submission_id: string;
  member_id: string;
  status: string;
}

export interface AdminRejectPaymentResponse {
  message: string;
  submission_id: string;
  status: string;
}

export interface AdminRejectPaymentRequest {
  rejection_reason: string;
}

// ---- Phase 1D: Start pool + manual trades ----

export interface AdminStartPoolResponse {
  pool_id: string;
  status: PoolStatus;
  started_at: string;
  end_date: string;
  total_invested_usdt: string;
  current_pool_value_usdt: string;
  total_profit_usdt: string;
  verified_members_count: number;
  max_members: number;
}

export type TradeAction = "BUY" | "SELL";

export interface AdminPoolTrade {
  trade_id: string;
  pool_id: string;
  admin_id?: string;
  asset_pair: string;
  action: TradeAction;
  quantity: string;
  entry_price_usdt: string;
  exit_price_usdt: string | null;
  pnl_usdt: string | null;
  is_open: boolean;
  notes: string | null;
  traded_at: string;
  closed_at: string | null;
}

export interface AdminTradesSummary {
  open_trades: number;
  closed_trades: number;
  realized_pnl: number;
}

export interface AdminOpenTradeRequest {
  asset_pair: string;
  action: TradeAction;
  quantity: number;
  entry_price_usdt: number;
  strategy_id?: string | null;
  notes?: string | null;
}

export interface AdminCloseTradeRequest {
  exit_price_usdt: number;
}

export interface AdminTradesListResponse {
  trades: AdminPoolTrade[];
  summary: AdminTradesSummary;
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

