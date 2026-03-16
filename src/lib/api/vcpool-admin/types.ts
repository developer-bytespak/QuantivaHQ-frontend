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
  wallet_address: string | null;
  payment_network: string | null;
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
  binance_uid?: string;
  wallet_address?: string;
  payment_network?: string;
}

export interface UpdateBinanceResponse {
  message: string;
  binance_uid: string;
  wallet_address: string;
  payment_network: string;
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
  tx_hash: string | null;
  binance_tx_id: string | null;
  user_wallet_address: string | null;
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

// ---- Phase 1E: Cancellations, Payouts, Complete, Cancel pool ----

export interface AdminCancellationMember {
  member_id: string;
  user: { user_id: string; email?: string; full_name?: string };
  invested_amount: number;
  share_percent: number;
}

export interface AdminCancellation {
  cancellation_id: string;
  member: AdminCancellationMember;
  pool_status_at_request: string;
  member_value_at_exit: number;
  fee_amount: number;
  refund_amount: number;
  status: string;
  requested_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  refunded_at: string | null;
  binance_refund_tx_id: string | null;
}

export interface AdminCancellationsListResponse {
  cancellations: AdminCancellation[];
}

export interface AdminApproveCancellationResponse {
  cancellation_id: string;
  refund_amount: number;
  message: string;
}

export interface AdminRejectCancellationRequest {
  rejection_reason: string;
}

export interface AdminRejectCancellationResponse {
  cancellation_id: string;
  status: string;
  message: string;
}

export interface AdminMarkRefundedRequest {
  binance_tx_id?: string;
  notes?: string;
}

export interface AdminMarkRefundedResponse {
  cancellation_id: string;
  status: string;
  message: string;
  notes?: string;
}

export interface AdminCompletePoolResponse {
  pool_id: string;
  status: string;
  completed_at: string;
  final_pool_value: number;
  total_profit: number;
  admin_fee_earned: number;
  total_pool_fees: number;
  payouts_created: number;
  payouts: Array<{ payout_id: string; member_id: string; net_payout: number; profit_loss: number; status: string }>;
  message: string;
}

export interface AdminPayoutMember {
  member_id: string;
  user: { user_id: string; email?: string; full_name?: string };
  payment_method: string;
}

export interface AdminPayout {
  payout_id: string;
  member: AdminPayoutMember;
  payout_type: string;
  initial_investment: number;
  share_percent: number;
  pool_final_value: number;
  gross_payout: number;
  admin_fee_deducted: number;
  net_payout: number;
  profit_loss: number;
  status: string;
  paid_at: string | null;
  notes: string | null;
  binance_tx_id: string | null;
  created_at: string;
}

export interface AdminPayoutsListResponse {
  payouts: AdminPayout[];
}

export interface AdminMarkPayoutPaidRequest {
  binance_tx_id?: string;
  notes?: string;
}

export interface AdminMarkPayoutPaidResponse {
  payout_id: string;
  status: string;
  paid_at: string;
  message: string;
}

export interface AdminCancelPoolResponse {
  pool_id: string;
  status: string;
  cancelled_at: string;
  refunds_created: number;
  payouts: Array<{ payout_id: string; member_id: string; net_payout: number; status: string }>;
  message: string;
}

