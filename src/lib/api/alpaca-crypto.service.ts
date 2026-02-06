const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface AlpacaBalance {
  cash: number;
  portfolioValue: number;
  buyingPower: number;
  equity: number;
  longMarketValue: number;
  shortMarketValue: number;
  dailyChange: number;
  dailyChangePercent: number;
}

interface AlpacaPosition {
  symbol: string;
  qty: string;
  avg_entry_price: string;
  current_price: string;
  market_value: string;
  cost_basis: string;
  unrealized_pl: string;
  unrealized_plpc: string;
  side: 'long' | 'short';
}

interface AlpacaOrder {
  id: string;
  symbol: string;
  qty: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  time_in_force: string;
  filled_avg_price?: string;
  filled_qty?: string;
  status: 'new' | 'partially_filled' | 'filled' | 'canceled' | 'expired' | 'rejected';
  created_at: string;
  updated_at: string;
  filled_at?: string;
}

interface AlpacaDashboard {
  account: any;
  balance: AlpacaBalance;
  positions: AlpacaPosition[];
  openOrders: AlpacaOrder[];
  recentOrders: AlpacaOrder[];
  clock: {
    timestamp: string;
    isOpen: boolean;
    nextOpen: string;
    nextClose: string;
  };
}

class AlpacaCryptoService {
  private baseUrl = `${API_BASE_URL}/alpaca-paper-trading`;

  /**
   * Get Alpaca status and connection
   */
  async getStatus() {
    const response = await fetch(`${this.baseUrl}/status`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to get Alpaca status");
    }

    return response.json();
  }

  /**
   * Get account balance - formatted for compatibility with Binance UI
   */
  async getAccountBalance(): Promise<{
    balances: Array<{
      asset: string;
      free: number;
      locked: number;
    }>;
    totalBalanceUSD: number;
  }> {
    const response = await fetch(`${this.baseUrl}/balance`, {
      credentials: "include",
    });

    if (!response.ok) {
      let errorMessage = "Failed to fetch balance";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        errorMessage = `Failed to fetch balance: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    const balance = result.data;

    // Convert Alpaca balance to Binance-compatible format
    return {
      balances: [
        {
          asset: 'USD',
          free: balance.cash || 0,
          locked: 0,
        },
      ],
      totalBalanceUSD: balance.portfolioValue || 0,
    };
  }

  /**
   * Get dashboard data (account, positions, orders)
   */
  async getDashboard(): Promise<AlpacaDashboard> {
    const response = await fetch(`${this.baseUrl}/dashboard`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch dashboard data");
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Get all positions
   */
  async getPositions(): Promise<AlpacaPosition[]> {
    const response = await fetch(`${this.baseUrl}/positions`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch positions");
    }

    const result = await response.json();
    return result.data || [];
  }

  /**
   * Get orders with optional status filter
   */
  async getOrders(status: 'open' | 'closed' | 'all' = 'all'): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/orders?status=${status}`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch orders");
    }

    const result = await response.json();
    const orders = result.data || [];
    
    // Filter to only crypto orders (symbol contains '/')
    // Transform to Binance-compatible format
    return orders
      .filter((order: AlpacaOrder) => order.symbol.includes('/'))
      .map((order: AlpacaOrder) => ({
        orderId: parseInt(order.id.replace(/[^0-9]/g, '').slice(-9)) || Date.now(), // Convert UUID to number
        symbol: order.symbol.replace('/', ''), // BTC/USD -> BTCUSD
        side: order.side.toUpperCase() as 'BUY' | 'SELL',
        type: order.type.toUpperCase() as 'MARKET' | 'LIMIT',
        quantity: parseFloat(order.qty),
        price: parseFloat(order.filled_avg_price || '0'),
        status: this.mapAlpacaStatus(order.status),
        timestamp: new Date(order.created_at).getTime(),
        executedQuantity: parseFloat(order.filled_qty || '0'),
        cumulativeQuoteAssetTransacted: parseFloat(order.filled_avg_price || '0') * parseFloat(order.filled_qty || '0'),
      }));
  }

  /**
   * Map Alpaca order status to Binance-compatible status
   */
  private mapAlpacaStatus(status: string): 'NEW' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELED' | 'REJECTED' | 'EXPIRED' {
    const statusMap: Record<string, any> = {
      'new': 'NEW',
      'partially_filled': 'PARTIALLY_FILLED',
      'filled': 'FILLED',
      'canceled': 'CANCELED',
      'expired': 'EXPIRED',
      'rejected': 'REJECTED',
    };
    return statusMap[status] || 'NEW';
  }

  /**
   * Get ticker price for a symbol
   */
  async getTickerPrice(symbol: string): Promise<{ price: number }> {
    const response = await fetch(`${this.baseUrl}/quote/${symbol}`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ticker price for ${symbol}`);
    }

    const result = await response.json();
    const quote = result.data;
    
    // Return midpoint of bid/ask as price
    const price = quote.ap ? parseFloat(quote.ap) : 0;
    return { price };
  }

  /**
   * Place an order
   */
  async placeOrder(payload: {
    symbol: string;
    side: 'buy' | 'sell';
    type: 'market' | 'limit';
    qty: number;
    limit_price?: number;
  }): Promise<AlpacaOrder> {
    const response = await fetch(`${this.baseUrl}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to place order");
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/orders/${orderId}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to cancel order");
    }
  }

  /**
   * Close a position
   */
  async closePosition(symbol: string, qty?: number): Promise<AlpacaOrder> {
    const url = qty 
      ? `${this.baseUrl}/positions/${symbol}?qty=${qty}`
      : `${this.baseUrl}/positions/${symbol}`;
      
    const response = await fetch(url, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to close position");
    }

    const result = await response.json();
    return result.data;
  }
}

// Export singleton instance
export const alpacaCryptoService = new AlpacaCryptoService();
export default alpacaCryptoService;
