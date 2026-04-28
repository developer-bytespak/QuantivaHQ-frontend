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
  is_super_admin: boolean;
  binance_uid: string | null;
  wallet_address: string | null;
  payment_network: string | null;
  /** Name of the exchange the admin is currently connected to ("Binance" / "Binance.US" / null if no active connection). */
  connected_exchange_name: string | null;
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
    is_super_admin: boolean;
  };
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  message: string;
}

export interface SuperAdminUsersFilters {
  search?: string;
  plan?: "FREE" | "PRO" | "ELITE";
  subscription_status?: "active" | "cancelled" | "trial" | "expired";
  kyc_status?: "pending" | "approved" | "rejected" | "review";
  page?: number;
  limit?: number;
}

export interface SuperAdminUserRow {
  user_id: string;
  email: string;
  username: string;
  full_name: string | null;
  current_tier: "FREE" | "PRO" | "ELITE" | "ELITE_PLUS";
  kyc_status: "pending" | "approved" | "rejected" | "review";
  created_at: string;
  last_active_at: string | null;
  subscription_status: "active" | "cancelled" | "trial" | "expired" | null;
  subscription_plan: "FREE" | "PRO" | "ELITE" | "ELITE_PLUS" | null;
  billing_period: "MONTHLY" | "QUARTERLY" | "YEARLY" | null;
  subscription_period_end: string | null;
  total_invested_usdt: number;
}

export interface SuperAdminUsersResponse {
  users: SuperAdminUserRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SuperAdminUsersAnalyticsResponse {
  summary: {
    total_users: number;
    active_last_30_days: number;
    paid_users: number;
    free_users: number;
  };
  plan_distribution: {
    FREE: number;
    PRO: number;
    ELITE: number;
    ELITE_PLUS: number;
  };
  recent_signups: Array<{
    user_id: string;
    email: string;
    full_name: string | null;
    current_tier: "FREE" | "PRO" | "ELITE" | "ELITE_PLUS";
    created_at: string;
  }>;
  exchange_connections: {
    crypto_connections: number;
    stock_connections: number;
    active_connections: number;
    pending_connections: number;
    recent_synced_users: Array<{
      connection_id: string;
      status: string;
      last_synced_at: string | null;
      exchange_name: string;
      exchange_type: "crypto" | "stocks";
      user_id: string;
      email: string;
      full_name: string | null;
    }>;
  };
}

export interface SuperAdminUsersGrowthFilters {
  year?: number;
  subscription_plan?: "FREE" | "PRO" | "ELITE" | "ELITE_PLUS";
  active_only?: boolean;
}

export interface SuperAdminUsersGrowthPoint {
  month: number;
  label: string;
  users: number;
  cumulative_users: number;
}

export interface SuperAdminUsersGrowthResponse {
  year: number;
  filters: {
    subscription_plan: "ALL" | "FREE" | "PRO" | "ELITE" | "ELITE_PLUS";
    active_only: boolean;
  };
  total_users: number;
  monthly: SuperAdminUsersGrowthPoint[];
  available_years: number[];
}

export interface VcPoolAdminRow {
  admin_id: string;
  email: string;
  full_name: string | null;
  is_super_admin: boolean;
  created_at: string;
  active_pools_count: number;
}

export interface VcPoolAdminsResponse {
  admins: VcPoolAdminRow[];
}

export interface CreateVcPoolAdminRequest {
  email: string;
  password: string;
  full_name?: string;
  is_super_admin?: boolean;
  currentPassword: string;
}

export interface DeleteVcPoolAdminRequest {
  currentPassword: string;
}

export interface CreateVcPoolAdminResponse {
  message: string;
  admin: VcPoolAdminRow;
}

export interface DeleteVcPoolAdminResponse {
  message: string;
  admin_id: string;
  email: string;
}

export interface SuperAdminPoolOversightRow {
  pool_id: string;
  admin_id: string;
  owner_name: string | null;
  owner_email: string;
  owner_is_super_admin: boolean;
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
  counts: {
    members: number;
    reservations: number;
    trades: number;
  };
}

export interface SuperAdminPoolsOversightResponse {
  summary: {
    total_pools: number;
    draft: number;
    open: number;
    full: number;
    active: number;
    completed: number;
    cancelled: number;
    total_invested_usdt: number;
    current_value_usdt: number;
    total_profit_usdt: number;
  };
  pools: SuperAdminPoolOversightRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SuperAdminFinanceChartPoint {
  label: string;
  value: number;
}

export interface SuperAdminFinanceGroup {
  key:
    | "SUBSCRIPTION"
    | "TRADE_FEES"
    | "VC_POOL_COLLECTIONS"
    | "VC_POOL_PAYOUTS_REFUNDS"
    | "TREASURY_BINANCE";
  title: string;
  is_dummy: boolean;
  summary: Record<string, number>;
  chart: SuperAdminFinanceChartPoint[];
  meta?: Record<string, unknown>;
}

export interface SuperAdminUnifiedFinanceResponse {
  overview: {
    total_inflow: number;
    total_outflow: number;
    net_revenue: number;
  };
  filters: {
    year: number;
    plan_tier: "ALL" | "PRO" | "ELITE";
    billing_period: "ALL" | "MONTHLY" | "QUARTERLY" | "YEARLY";
    vc_collection_source: "ALL" | "JOIN" | "CANCEL" | "COMPLETION";
  };
  available_years: number[];
  groups: SuperAdminFinanceGroup[];
}

export interface SuperAdminUnifiedFinanceFilters {
  year?: number;
  plan_tier?: "PRO" | "ELITE";
  billing_period?: "MONTHLY" | "QUARTERLY" | "YEARLY";
  vc_collection_source?: "JOIN" | "CANCEL" | "COMPLETION";
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

export interface SuperAdminUpdateDefaultFeesRequest {
  default_pool_fee_percent: number;
  default_admin_profit_fee_percent: number;
  default_cancellation_fee_percent: number;
  default_payment_window_minutes: number;
  currentPassword: string;
}

export interface SuperAdminUpdateDefaultFeesResponse {
  message: string;
  updated_count: number;
  default_pool_fee_percent: number;
  default_admin_profit_fee_percent: number;
  default_cancellation_fee_percent: number;
  default_payment_window_minutes: number;
}

export interface AdminChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface AdminChangePasswordResponse {
  message: string;
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
  user?: {
    user_id: string;
    email?: string;
    username?: string | null;
    full_name?: string | null;
  };
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
  user?: {
    user_id: string;
    email?: string;
    username?: string | null;
    full_name?: string | null;
  };
}

export interface AdminReservationsListResponse {
  reservations: AdminReservation[];
  pagination?: { page: number; limit: number; total: number; totalPages: number };
}

export interface AdminPoolMember {
  member_id: string;
  user_id: string;
  pool_id?: string;
  payment_method: string;
  invested_amount_usdt?: string | number;
  share_percent: string | number;
  is_active?: boolean;
  joined_at: string;
  exited_at?: string | null;
  user_wallet_address?: string | null;
  user?: {
    user_id: string;
    email: string;
    username: string | null;
    full_name: string | null;
  } | null;
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
  binance_order_id: string | null;
  strategy: { strategy_id: string; name: string } | null;
}

export interface AdminTradesSummary {
  open_trades: number;
  closed_trades: number;
  realized_pnl: number;
  total_allocated_usdt: number;
  available_capital_usdt: number;
  utilization_pct: number;
}

export interface AdminPoolCapital {
  total_usdt: number;
  allocated_usdt: number;
  available_usdt: number;
  utilization_pct: number;
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
  pool_capital: AdminPoolCapital;
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
  user_wallet_address: string | null;
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
  user_wallet_address?: string | null;
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

// ---- Binance Deposits / Withdrawals / Analytics ----

export interface AdminBinanceDeposit {
  deposit_id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  pool_id: string;
  pool_name: string;
  amount_usdt: number;
  tx_hash: string | null;
  binance_tx_id: string | null;
  status: "pending" | "verified" | "rejected" | "expired";
  payment_method: string;
  submitted_at: string;
  verified_at: string | null;
  rejection_reason: string | null;
}

export interface AdminBinanceDepositsResponse {
  deposits: AdminBinanceDeposit[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  summary: {
    total_deposits: number;
    total_amount: number;
    pending_count: number;
    verified_count: number;
    rejected_count: number;
  };
}

export interface AdminBinanceWithdrawal {
  withdrawal_id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  pool_id: string;
  pool_name: string;
  type: "payout" | "refund";
  amount_usdt: number;
  tx_hash: string | null;
  binance_tx_id: string | null;
  status: "pending" | "paid" | "processing";
  created_at: string;
  paid_at: string | null;
}

export interface AdminBinanceWithdrawalsResponse {
  withdrawals: AdminBinanceWithdrawal[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  summary: {
    total_withdrawals: number;
    total_amount: number;
    pending_count: number;
    paid_count: number;
    processing_count: number;
  };
}

export interface AdminBinanceAnalytics {
  total_deposits: number;
  total_deposit_amount: number;
  total_withdrawals: number;
  total_withdrawal_amount: number;
  net_flow: number;
  deposits_by_status: { pending: number; verified: number; rejected: number; expired: number };
  withdrawals_by_status: { pending: number; paid: number; processing: number };
  deposits_by_pool: Array<{ pool_id: string; pool_name: string; count: number; amount: number }>;
  withdrawals_by_pool: Array<{ pool_id: string; pool_name: string; count: number; amount: number }>;
}

export interface AdminBinanceTransactionFilters {
  status?: string;
  pool_id?: string;
  user_id?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

// ---- Exchange Orders (direct Binance MARKET/LIMIT orders) ----

export interface AdminExchangeOrder {
  order_id: string;
  pool_id: string;
  symbol: string;
  side: "BUY" | "SELL";
  order_type: "MARKET" | "LIMIT";
  quantity: number;
  entry_price_usdt: number;
  exchange_order_id: string | null;
  is_open: boolean;
  exit_price_usdt: number | null;
  realized_pnl_usdt: number | null;
  opened_at: string;
  closed_at: string | null;
  price?: number | null;
}

export interface AdminPlaceExchangeOrderRequest {
  symbol: string;
  side: "BUY" | "SELL";
  type: "MARKET" | "LIMIT";
  quantity: number;
  price?: number | null;
}

export interface AdminExchangeOrdersSummary {
  open_positions: number;
  closed_positions: number;
  realized_pnl_usdt: number;
}

export interface AdminExchangeOrdersListResponse {
  orders: AdminExchangeOrder[];
  summary: AdminExchangeOrdersSummary;
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface AdminPlaceExchangeOrderResponse {
  order: AdminExchangeOrder;
  exchangeResponse: {
    orderId: string;
    symbol: string;
    side: string;
    type: string;
    quantity: number;
    price: number;
    status: string;
    time: number;
  };
}

export interface AdminCloseExchangeOrderRequest {
  exit_price_usdt: number;
}

// ---- Super Admin: Upgrade user subscription ----

export type PlanTier = "FREE" | "PRO" | "ELITE" | "ELITE_PLUS";
export type BillingPeriod = "MONTHLY" | "QUARTERLY" | "YEARLY";

export interface AdminSuperUpgradeSubscriptionRequest {
  email: string;
  tier: PlanTier;
  billing_period: BillingPeriod;
}

export interface AdminSuperUpgradeSubscriptionResponse {
  message: string;
  user: {
    user_id: string;
    email: string;
    username: string;
    full_name: string | null;
    previous_tier: PlanTier;
    new_tier: PlanTier;
  };
  subscription: {
    subscription_id: string;
    tier: PlanTier;
    billing_period: BillingPeriod;
    status: string;
    current_period_start: string;
    current_period_end: string;
    billing_provider: string;
  };
}

export interface AdminSuperUserLookupResponse {
  found: boolean;
  is_us_user: boolean;
  email?: string;
  username?: string;
  current_tier?: PlanTier;
}

