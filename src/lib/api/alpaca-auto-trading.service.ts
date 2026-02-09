/**
 * Alpaca Auto-Trading Service
 * Frontend service for Alpaca paper trading automation (stocks + crypto)
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const AUTO_TRADING_URL = `${BASE_URL}/alpaca-paper-trading/auto-trading`;

export const alpacaAutoTradingService = {
  /**
   * Get auto-trading status (poll every 3 seconds)
   */
  async getStatus(): Promise<any> {
    const response = await fetch(`${AUTO_TRADING_URL}/status`, {
      method: "GET",
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to get auto-trading status");
    return response.json();
  },

  /**
   * Get comprehensive auto-trading stats
   */
  async getStats(): Promise<any> {
    const response = await fetch(`${AUTO_TRADING_URL}/stats`, {
      method: "GET",
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to get auto-trading stats");
    return response.json();
  },

  /**
   * Get quick summary (lightweight)
   */
  async getSummary(): Promise<any> {
    const response = await fetch(`${AUTO_TRADING_URL}/summary`, {
      method: "GET",
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to get auto-trading summary");
    return response.json();
  },

  /**
   * Get all trades
   */
  async getTrades(): Promise<any> {
    const response = await fetch(`${AUTO_TRADING_URL}/trades`, {
      method: "GET",
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to get auto-trading trades");
    return response.json();
  },

  /**
   * Get AI messages
   */
  async getMessages(): Promise<any> {
    const response = await fetch(`${AUTO_TRADING_URL}/messages`, {
      method: "GET",
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to get auto-trading messages");
    return response.json();
  },

  /**
   * Get bracket orders (equivalent to OCO orders)
   */
  async getBracketOrders(): Promise<any> {
    const response = await fetch(`${AUTO_TRADING_URL}/bracket-orders`, {
      method: "GET",
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to get bracket orders");
    return response.json();
  },

  /**
   * Start auto-trading
   */
  async start(): Promise<any> {
    const response = await fetch(`${AUTO_TRADING_URL}/start`, {
      method: "POST",
      credentials: "include",
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to start auto-trading");
    }
    return response.json();
  },

  /**
   * Pause auto-trading
   */
  async pause(): Promise<any> {
    const response = await fetch(`${AUTO_TRADING_URL}/pause`, {
      method: "POST",
      credentials: "include",
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to pause auto-trading");
    }
    return response.json();
  },

  /**
   * Resume auto-trading
   */
  async resume(): Promise<any> {
    const response = await fetch(`${AUTO_TRADING_URL}/resume`, {
      method: "POST",
      credentials: "include",
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to resume auto-trading");
    }
    return response.json();
  },

  /**
   * Stop auto-trading
   */
  async stop(): Promise<any> {
    const response = await fetch(`${AUTO_TRADING_URL}/stop`, {
      method: "POST",
      credentials: "include",
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to stop auto-trading");
    }
    return response.json();
  },

  /**
   * Reset auto-trading session
   */
  async reset(): Promise<any> {
    const response = await fetch(`${AUTO_TRADING_URL}/reset`, {
      method: "POST",
      credentials: "include",
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to reset auto-trading");
    }
    return response.json();
  },

  /**
   * Execute trades now (manual trigger)
   */
  async executeNow(): Promise<any> {
    const response = await fetch(`${AUTO_TRADING_URL}/execute-now`, {
      method: "POST",
      credentials: "include",
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to execute auto-trades");
    }
    return response.json();
  },

  /**
   * Execute a single trade (for testing)
   */
  async executeSingle(): Promise<any> {
    const response = await fetch(`${AUTO_TRADING_URL}/execute-single`, {
      method: "POST",
      credentials: "include",
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to execute single trade");
    }
    return response.json();
  },
};
