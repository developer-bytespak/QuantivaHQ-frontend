import { apiRequest, uploadFile } from "./client";

// ---- Phase 1C: Join + payment status + screenshot ----

export type PaymentMethod = "binance" | "stripe";

export interface JoinPoolRequest {
  payment_method: PaymentMethod;
  user_binance_uid?: string;
  user_wallet_address?: string;
}

export interface JoinPoolResponse {
  member_id?: string;
  reservation_id: string;
  submission_id: string;
  total_amount: number;
  investment_amount: number;
  pool_fee_amount: number;
  coin: string;
  admin_binance_uid?: string;
  admin_wallet_address?: string;
  /** "Binance" | "Binance.US" | null — which exchange the admin is connected to. */
  admin_exchange_name?: string | null;
  payment_network?: string;
  deposit_coin?: string;
  deposit_method?: string;
  deadline: string;
  minutes_remaining: number;
  payment_method: PaymentMethod;
  instructions?: string[];
  message?: string;
  is_rejoin?: boolean;
  previous_cancellation?: {
    cancellation_id: string;
    requested_at: string;
    refunded_at: string;
    refund_amount: number;
  };
}

export interface PaymentStatusResponse {
  pool_id: string;
  membership: { exists: boolean; is_active?: boolean };
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
    tx_hash: string | null;
    binance_tx_id: string | null;
    binance_payment_status: string | null;
    payment_status: string | null;
    user_wallet_address: string | null;
    exact_amount_expected: string | null;
  } | null;
  cancellation?: {
    has_cancellation: boolean;
    is_historical?: boolean;
    status?: string;
    cancellation_id?: string;
    contribution_amount?: number;
    pool_fee_amount?: number;
    cancellation_fee_amount?: number;
    refund_amount?: number;
    requested_at?: string;
    approved_at?: string | null;
    refund_completed_at?: string | null;
    rejection_reason?: string | null;
    reviewed_by?: { name: string; email: string } | null;
    user_wallet_address?: string | null;
  };
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
  admin_wallet_address: string | null;
  payment_network: string | null;
  deposit_coin: string | null;
  deposit_method: string | null;
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

export interface PoolFinancials {
  total_invested_usdt: number;
  current_pool_value_usdt: number;
  total_profit_usdt: number;
  total_pool_fees_usdt: number;
  pool_roi_pct: number;
}

export interface AdminInfo {
  binance_uid: string;
  wallet_address: string;
  payment_network: string;
  deposit_coin: string;
  deposit_method: string;
}

export interface UserContext {
  is_member: boolean;
  member_id: string | null;
  invested_amount_usdt: number;
  current_share_percent: number;
  joined_at: string | null;
  exited_at: string | null;
  is_active: boolean;
  payment_method: string | null;
  current_member_value_usdt: number;
  unrealized_pnl_usdt: number;
  unrealized_pnl_pct: number;
}

export interface PoolTimeline {
  started_at: string | null;
  end_date: string | null;
  completed_at: string | null;
  days_remaining: number;
  progress_percent: number;
}

export interface VcPoolDetails extends VcPoolSummary {
  verified_members_count: number;
  reserved_seats_count: number;
  status: string;
  started_at: string | null;
  end_date: string | null;
  pool_financials?: PoolFinancials;
  admin_info?: AdminInfo;
  user_context?: UserContext;
  pool_timeline?: PoolTimeline;
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
  status: string;
  contribution_amount: number;
  pool_fee_amount: number;
  cancellation_fee_amount: number;
  refund_amount: number;
  requested_at: string;
  approved_at: string | null;
  refund_completed_at: string | null;
  rejection_reason: string | null;
  reviewed_by: { name: string; email: string } | null;
  user_wallet_address: string | null;
  message: string;
}

export async function cancelMembership(poolId: string): Promise<CancelMembershipResponse> {
  return apiRequest<never, CancelMembershipResponse>({
    path: `/api/vc-pools/${poolId}/request-exit`,
    method: "POST",
    body: undefined as never,
  });
}

export interface MyCancellationItem {
  cancellation_id: string;
  status: string;
  contribution_amount: number;
  pool_fee_amount: number;
  cancellation_fee_amount: number;
  refund_amount: number;
  requested_at: string;
  approved_at: string | null;
  refund_completed_at: string | null;
  rejection_reason: string | null;
  reviewed_by: { name: string; email: string } | null;
  user_wallet_address: string | null;
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

export type MembershipStatus =
  | 'active_in_pool'
  | 'completed_and_paid'
  | 'exited_with_refund'
  | 'rejoined_after_exit'
  | 'exit_requested_pending_approval'
  | 'exit_approved_pending_refund'
  | 'pool_cancelled_refund';

export interface StatusDetail {
  // For active_in_pool
  joined_at?: string;

  // For completed_and_paid
  payout_id?: string;
  payout_amount?: string;
  gross_payout?: string;
  admin_fee_deducted?: string;
  profit_loss?: string;
  payout_status?: string;
  paid_at?: string;
  payout_type?: string;

  // For exited_with_refund
  cancellation_id?: string;
  refund_amount?: string;
  requested_at?: string;
  reviewed_at?: string;
  refund_completed_at?: string;

  // For rejoined_after_exit
  rejoined_at?: string;
  previous_member_count?: number;

  // For exit_requested_pending_approval
  // (shares cancellation_id, refund_amount, requested_at)

  // For exit_approved_pending_refund
  // (shares all exit fields)

  // For pool_cancelled_refund
  payout_id_cancel?: string;
  payout_status_cancel?: string;
}

export interface MyPoolMembership {
  membership: {
    member_id: string;
    pool_id: string;
    pool_name: string;
    pool_status: string;
    coin_type: string;
    is_active: boolean;
    joined_at: string;
    exited_at: string | null;
    completed_at: string | null;
    started_at: string | null;
    end_date: string | null;
    payment_method: string;
  };
  membership_status: MembershipStatus;
  status_detail: StatusDetail;
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

// ---- Phase Binance P2P: Auto-verification payment flow ----

export type PaymentStatus = "pending" | "verified" | "rejected" | "refunded";
/** @deprecated Use PaymentStatus */
export type BinancePaymentStatus = PaymentStatus;

export interface SubmitTxHashRequest {
  tx_hash?: string;
  binance_tx_id?: string;
}

/** @deprecated Use SubmitTxHashRequest */
export type SubmitBinanceTxRequest = {
  binance_tx_id?: string;
  binance_tx_timestamp?: string;
  tx_hash?: string;
};

export interface SubmitTxHashResponse {
  message: string;
  submission_id: string;
  binance_tx_id: string | null;
  tx_hash: string | null;
  exact_amount_expected: number;
  status: string;
  payment_status: PaymentStatus;
  binance_payment_status: PaymentStatus;
}

/** @deprecated Use SubmitTxHashResponse */
export type SubmitBinanceTxResponse = SubmitTxHashResponse;

export interface MyPaymentSubmission {
  submission_id: string;
  pool_id: string;
  pool_name: string;
  coin_type: string;
  payment_method: string;
  total_amount: string;
  investment_amount: string;
  pool_fee_amount: string;
  binance_tx_id: string | null;
  tx_hash: string | null;
  status: string;
  binance_payment_status: PaymentStatus;
  payment_status: PaymentStatus;
  exact_amount_expected: string;
  exact_amount_received: string | null;
  refund_reason: string | null;
  rejection_reason: string | null;
  verified_at: string | null;
  submitted_at: string;
  payment_deadline: string;
}

export interface PaymentSubmissionDetail extends MyPaymentSubmission {
  screenshot_url: string | null;
  reservation_status: string;
  reservation_expires_at: string;
  admin_binance_uid: string;
  admin_wallet_address: string | null;
  /** "Binance" | "Binance.US" | null — which exchange the admin is connected to. */
  admin_exchange_name: string | null;
  payment_network: string | null;
  deposit_coin: string | null;
  deposit_method: string | null;
}

export interface MyTransaction {
  transaction_id: string;
  pool_id: string;
  pool_name: string;
  transaction_type: "payment_submitted" | "payment_verified" | "payment_rejected";
  amount_usdt: string;
  binance_tx_id: string | null;
  tx_hash: string | null;
  expected_amount: string;
  actual_amount_received: string | null;
  status: string;
  description: string;
  created_at: string;
  resolved_at: string | null;
}

export async function submitTxHash(
  poolId: string,
  body: SubmitTxHashRequest
): Promise<SubmitTxHashResponse> {
  return apiRequest<SubmitTxHashRequest, SubmitTxHashResponse>({
    path: `/api/vc-pools/${poolId}/submit-binance-tx`,
    method: "POST",
    body,
  });
}

/** @deprecated Use submitTxHash */
export const submitBinanceTx = submitTxHash;

export async function getMyPaymentSubmissions(): Promise<MyPaymentSubmission[]> {
  return apiRequest<never, MyPaymentSubmission[]>({
    path: `/api/vc-pools/payments/my-submissions`,
    method: "GET",
  });
}

export async function getPaymentSubmissionDetail(
  submissionId: string
): Promise<PaymentSubmissionDetail> {
  return apiRequest<never, PaymentSubmissionDetail>({
    path: `/api/vc-pools/payments/submissions/${submissionId}`,
    method: "GET",
  });
}

export async function getMyTransactions(): Promise<MyTransaction[]> {
  return apiRequest<never, MyTransaction[]>({
    path: `/api/vc-pools/payments/my-transactions`,
    method: "GET",
  });
}

// ---- Enhanced Transactions: filtered list, summary, detail ----

export interface TransactionFilters {
  status?: string;
  type?: string;
  pool_id?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export interface TransactionsListResponse {
  transactions: MyTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TransactionSummary {
  total_transactions: number;
  total_deposited: number;
  total_withdrawn: number;
  pending_count: number;
  verified_count: number;
  rejected_count: number;
}

export interface TransactionDetail extends MyTransaction {
  user_wallet_address: string | null;
  admin_wallet_address: string | null;
  payment_method: string;
  screenshot_url: string | null;
  payment_network: string | null;
  verified_at: string | null;
  rejection_reason: string | null;
}

export async function getAllTransactions(
  filters: TransactionFilters = {}
): Promise<TransactionsListResponse> {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.type) params.set("type", filters.type);
  if (filters.pool_id) params.set("pool_id", filters.pool_id);
  if (filters.date_from) params.set("date_from", filters.date_from);
  if (filters.date_to) params.set("date_to", filters.date_to);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.sort_by) params.set("sort_by", filters.sort_by);
  if (filters.sort_order) params.set("sort_order", filters.sort_order);
  const qs = params.toString();
  return apiRequest<never, TransactionsListResponse>({
    path: `/api/vc-pools/payments/my-transactions${qs ? `?${qs}` : ""}`,
    method: "GET",
  });
}

export async function getTransactionSummary(): Promise<TransactionSummary> {
  return apiRequest<never, TransactionSummary>({
    path: `/api/vc-pools/payments/transactions-summary`,
    method: "GET",
  });
}

export async function getTransactionDetail(
  transactionId: string
): Promise<TransactionDetail> {
  return apiRequest<never, TransactionDetail>({
    path: `/api/vc-pools/payments/transactions/${encodeURIComponent(transactionId)}`,
    method: "GET",
  });
}

