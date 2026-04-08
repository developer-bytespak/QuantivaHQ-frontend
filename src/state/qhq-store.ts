import { create } from 'zustand';
import { qhqApi, QhqBalance, QhqTransaction, QhqWallet, QhqStats, QhqRewardRule } from '@/lib/api/qhq-token';

interface QhqState {
  // Data
  balance: QhqBalance | null;
  transactions: QhqTransaction[];
  transactionTotal: number;
  wallet: QhqWallet | null;
  stats: QhqStats | null;
  rewardRules: QhqRewardRule[];

  // UI state
  isLoadingBalance: boolean;
  isLoadingTransactions: boolean;
  isLoadingWallet: boolean;
  claimProofLoading: boolean;

  // Actions
  fetchBalance: () => Promise<void>;
  fetchTransactions: (page?: number, limit?: number) => Promise<void>;
  fetchWallet: () => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchRewardRules: () => Promise<void>;
  linkWallet: (address: string) => Promise<void>;
  disconnectWallet: () => Promise<{ success: boolean }>;
  confirmClaim: (txHash: string, amount: string) => Promise<void>;
}

const useQhqStore = create<QhqState>((set) => ({
  balance: null,
  transactions: [],
  transactionTotal: 0,
  wallet: null,
  stats: null,
  rewardRules: [],
  isLoadingBalance: false,
  isLoadingTransactions: false,
  isLoadingWallet: false,
  claimProofLoading: false,

  fetchBalance: async () => {
    set({ isLoadingBalance: true });
    try {
      const balance = await qhqApi.getBalance();
      set({ balance });
    } catch {
      // Silently fail — balance stays null
    } finally {
      set({ isLoadingBalance: false });
    }
  },

  fetchTransactions: async (page = 1, limit = 20) => {
    set({ isLoadingTransactions: true });
    try {
      const result = await qhqApi.getTransactions(page, limit);
      set({ transactions: result.transactions, transactionTotal: result.total });
    } catch {
      // Silently fail
    } finally {
      set({ isLoadingTransactions: false });
    }
  },

  fetchWallet: async () => {
    set({ isLoadingWallet: true });
    try {
      const wallet = await qhqApi.getWallet();
      set({ wallet });
    } catch {
      set({ wallet: null });
    } finally {
      set({ isLoadingWallet: false });
    }
  },

  fetchStats: async () => {
    try {
      const stats = await qhqApi.getStats();
      set({ stats });
    } catch {
      // Silently fail
    }
  },

  fetchRewardRules: async () => {
    try {
      const rewardRules = await qhqApi.getRewardRules();
      set({ rewardRules });
    } catch {
      // Silently fail
    }
  },

  linkWallet: async (address: string) => {
    const wallet = await qhqApi.linkWallet(address);
    set({ wallet });
  },

  disconnectWallet: async () => {
    try {
      await qhqApi.deleteWallet();
      set({ wallet: null });
      return { success: true };
    } catch (error) {
      throw error;
    }
  },

  confirmClaim: async (txHash: string, amount: string) => {
    await qhqApi.confirmClaim(txHash, amount);
    // Refresh balance after confirmed claim
    const balance = await qhqApi.getBalance();
    set({ balance });
  },
}));

export default useQhqStore;
