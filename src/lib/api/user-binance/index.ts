/**
 * User Binance API client
 * Base path: /users/binance — Uses user JWT (quantivahq_access_token in localStorage).
 */

import axios, { AxiosInstance } from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

function getUserAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("quantivahq_access_token");
}

export const userBinanceAxios: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

userBinanceAxios.interceptors.request.use((config) => {
  const token = getUserAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserBinanceBalance {
  asset: string;
  free: string;
  locked: string;
  total: string;
}

export interface UserBinanceAccountInfo {
  maker_commission: string;
  taker_commission: string;
  buy_commission: string;
  sell_commission: string;
  can_trade: boolean;
  can_deposit: boolean;
  can_withdraw: boolean;
}

export interface UserBinanceAccount {
  user_id: string;
  email: string;
  balances: UserBinanceBalance[];
  account_info: UserBinanceAccountInfo;
}

export interface UserDeposit {
  id: string;
  coin: string;
  amount: string;
  address: string;
  addressTag: string | null;
  txId: string;
  insertTime: number;
  status: number;
  statusText: string;
  confirmTimes: string;
  unlockConfirm: number;
  network: string;
}

export interface UserWithdrawal {
  id: string;
  coin: string;
  withdrawOrderId: string;
  network: string;
  address: string;
  addressTag: string | null;
  txId: string;
  amount: string;
  transactionFee: string;
  status: number;
  statusText: string;
  completeTime: number | null;
  applyTime: number;
}

export interface UserAssetBreakdown {
  asset: string;
  free_balance: string;
  locked_balance: string;
  total_balance: string;
  deposit_amount: string;
  withdrawal_amount: string;
}

export interface UserBinanceSummary {
  account_summary: {
    total_balance_usdt: string;
    total_deposits_count: number;
    total_deposits_amount: string;
    total_withdrawals_count: number;
    total_withdrawals_amount: string;
    net_amount: string;
  };
  deposits: {
    total_count: number;
    total_amount: string;
    pending_count: number;
    pending_amount: string;
    completed_count: number;
    completed_amount: string;
    success_rate_percent: string;
  };
  withdrawals: {
    total_count: number;
    total_amount: string;
    processing_count: number;
    processing_amount: string;
    completed_count: number;
    completed_amount: string;
    failed_count: number;
    failed_amount: string;
    success_rate_percent: string;
  };
  asset_breakdown: UserAssetBreakdown[];
}

// ─── API Functions ────────────────────────────────────────────────────────────

export async function userBinanceAccount(): Promise<{ data: UserBinanceAccount; last_updated: string }> {
  const res = await userBinanceAxios.get("/users/binance/account");
  return res.data;
}

export interface UserDepositParams {
  coin?: string;
  status?: number;
  offset?: number;
  limit?: number;
  startTime?: number;
  endTime?: number;
}

export async function userBinanceDeposits(
  params?: UserDepositParams
): Promise<{ data: UserDeposit[]; count: number; last_updated: string }> {
  const res = await userBinanceAxios.get("/users/binance/deposits", { params });
  return res.data;
}

export interface UserWithdrawalParams {
  coin?: string;
  status?: number;
  offset?: number;
  limit?: number;
  startTime?: number;
  endTime?: number;
}

export async function userBinanceWithdrawals(
  params?: UserWithdrawalParams
): Promise<{ data: UserWithdrawal[]; count: number; last_updated: string }> {
  const res = await userBinanceAxios.get("/users/binance/withdrawals", { params });
  return res.data;
}

export async function userBinanceSummary(
  coin?: string
): Promise<{ data: UserBinanceSummary; last_updated: string }> {
  const res = await userBinanceAxios.get("/users/binance/summary", { params: coin ? { coin } : undefined });
  return res.data;
}
