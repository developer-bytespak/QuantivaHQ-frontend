/**
 * Alpaca Auto-Trading Service
 * Frontend service for Alpaca paper trading automation (stocks + crypto)
 */

import { apiRequest } from "./client";

const AUTO_TRADING_PATH = "/alpaca-paper-trading/auto-trading";

export const alpacaAutoTradingService = {
  async getStatus(): Promise<any> {
    return apiRequest({ path: `${AUTO_TRADING_PATH}/status` });
  },

  async getStats(): Promise<any> {
    return apiRequest({ path: `${AUTO_TRADING_PATH}/stats` });
  },

  async getSummary(): Promise<any> {
    return apiRequest({ path: `${AUTO_TRADING_PATH}/summary` });
  },

  async getTrades(): Promise<any> {
    return apiRequest({ path: `${AUTO_TRADING_PATH}/trades` });
  },

  async getMessages(): Promise<any> {
    return apiRequest({ path: `${AUTO_TRADING_PATH}/messages` });
  },

  async getBracketOrders(): Promise<any> {
    return apiRequest({ path: `${AUTO_TRADING_PATH}/bracket-orders` });
  },

  async start(): Promise<any> {
    return apiRequest({ path: `${AUTO_TRADING_PATH}/start`, method: "POST" });
  },

  async pause(): Promise<any> {
    return apiRequest({ path: `${AUTO_TRADING_PATH}/pause`, method: "POST" });
  },

  async resume(): Promise<any> {
    return apiRequest({ path: `${AUTO_TRADING_PATH}/resume`, method: "POST" });
  },

  async stop(): Promise<any> {
    return apiRequest({ path: `${AUTO_TRADING_PATH}/stop`, method: "POST" });
  },

  async reset(): Promise<any> {
    return apiRequest({ path: `${AUTO_TRADING_PATH}/reset`, method: "POST" });
  },

  async executeNow(): Promise<any> {
    return apiRequest({ path: `${AUTO_TRADING_PATH}/execute-now`, method: "POST" });
  },

  async executeSingle(): Promise<any> {
    return apiRequest({ path: `${AUTO_TRADING_PATH}/execute-single`, method: "POST" });
  },
};
