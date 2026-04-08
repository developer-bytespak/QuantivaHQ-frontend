import { apiRequest } from './client';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface QhqBalance {
  pending_balance: string;
  cumulative_earned: string;
  lifetime_claimed: string;
  lifetime_spent: string;
  lifetime_burned: string;
}

export interface QhqTransaction {
  id: string;
  user_id: string;
  type: string;
  amount: string;
  balance_after: string;
  description: string;
  reference_id?: string;
  tx_hash?: string;
  created_at: string;
}

export interface QhqTransactionPage {
  transactions: QhqTransaction[];
  total: number;
  page: number;
  limit: number;
}

export interface QhqWallet {
  id: string;
  user_id: string;
  wallet_address: string;
  network: string;
  is_verified: boolean;
  linked_at: string;
}

export interface QhqClaimProof {
  proof: string[];
  cumulative_amount: string;
  cumulative_amount_wei: string;
  wallet_address: string;
  merkle_root: string;
}

export interface QhqStats {
  total_supply: string;
  circulating_supply: string;
  total_burned: string;
  contract_address: string | null;
  network: string;
}

export interface QhqRewardRule {
  id: string;
  rule_key: string;
  amount: string;
  is_active: boolean;
  description: string;
}

export interface QhqDiscountInfo {
  available_discounts: Array<{ qhq_amount: number; discount_percent: number }>;
  current_balance: string;
}

// ─── API Calls ────────────────────────────────────────────────────────────────

export const qhqApi = {
  getBalance: (): Promise<QhqBalance> =>
    apiRequest({ path: '/qhq/balance', method: 'GET' }),

  getTransactions: (page = 1, limit = 20): Promise<QhqTransactionPage> =>
    apiRequest({ path: `/qhq/transactions?page=${page}&limit=${limit}`, method: 'GET' }),

  getWallet: (): Promise<QhqWallet | null> =>
    apiRequest({ path: '/qhq/wallet', method: 'GET' }),

  linkWallet: (walletAddress: string): Promise<QhqWallet> =>
    apiRequest({ path: '/qhq/wallet/link', method: 'POST', body: { wallet_address: walletAddress } }),

  deleteWallet: (): Promise<{ success: boolean; message: string; wallet_address: string }> =>
    apiRequest({ path: '/qhq/wallet', method: 'DELETE' }),

  getClaimProof: (): Promise<QhqClaimProof> =>
    apiRequest({ path: '/qhq/claim/proof', method: 'GET' }),

  confirmClaim: (txHash: string, amount: string): Promise<void> =>
    apiRequest({ path: '/qhq/claim/confirm', method: 'POST', body: { tx_hash: txHash, amount } }),

  getStats: (): Promise<QhqStats> =>
    apiRequest({ path: '/qhq/stats', method: 'GET' }),

  getRewardRules: (): Promise<QhqRewardRule[]> =>
    apiRequest({ path: '/qhq/reward-rules', method: 'GET' }),

  getDiscountInfo: (): Promise<QhqDiscountInfo> =>
    apiRequest({ path: '/qhq/discount', method: 'GET' }),

  spendForSubscriptionDiscount: (qhqAmount: number): Promise<void> =>
    apiRequest({ path: '/qhq/spend/subscription-discount', method: 'POST', body: { qhq_amount: qhqAmount } }),
};
