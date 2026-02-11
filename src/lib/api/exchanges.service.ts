import { apiRequest } from "./client";

export interface Exchange {
  exchange_id: string;
  name: string;
  type: "crypto" | "stocks";
  supports_oauth: boolean;
  created_at: string;
}

export interface CreateConnectionDto {
  exchange_id: string;
  api_key: string;
  api_secret: string;
  enable_trading: boolean;
}

export interface Connection {
  connection_id: string;
  user_id: string;
  exchange_id: string;
  auth_type: string;
  status: "pending" | "active" | "invalid" | "revoked";
  connection_metadata?: {
    enable_trading?: boolean;
    permissions?: string[];
    accountType?: string;
    verified_at?: string;
  };
  last_synced_at?: string;
  created_at: string;
  updated_at?: string;
  exchange?: Exchange;
}

export interface VerifyConnectionResponse {
  success: boolean;
  data: {
    valid: boolean;
    status: "pending" | "active" | "invalid" | "revoked";
    permissions: string[];
  };
  last_updated: string;
}

export interface AccountBalance {
  assets: Array<{
    symbol: string;
    free: string;
    locked: string;
    total: string;
  }>;
  totalValueUSD: number;
}

export interface Position {
  symbol: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  pnlPercent: number;
  asset_type?: "crypto" | "stock";
  logoUrl?: string; // Logo URL returned from backend
}

export interface Order {
  orderId: string;
  symbol: string;
  side: "BUY" | "SELL";
  type: string;
  quantity: number;
  price: number;
  status: string;
  time: number;
}

export interface Portfolio {
  totalValue: number;
  totalCost: number;
  totalPnl: number;
  pnlPercent: number;
  assets: Array<{
    symbol: string;
    quantity: number;
    value: number;
    cost: number;
    pnl: number;
    pnlPercent: number;
  }>;
}

export interface TickerPrice {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
}

export interface DashboardData {
  balance: AccountBalance;
  positions: Position[];
  orders: Order[];
  portfolio: Portfolio;
  prices: TickerPrice[];
  logos: Record<string, string>;
  asset_types?: Record<string, "crypto" | "stock">;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  last_updated?: string;
  cached?: boolean;
  message?: string;
}

export const exchangesService = {
  /**
   * Get all available exchanges
   */
  async getExchanges(): Promise<Exchange[]> {
    return apiRequest<never, Exchange[]>({
      path: "/exchanges",
      method: "GET",
      credentials: "include",
    });
  },

  /**
   * Get exchange by ID
   */
  async getExchange(exchangeId: string): Promise<Exchange> {
    return apiRequest<never, Exchange>({
      path: `/exchanges/${exchangeId}`,
      method: "GET",
      credentials: "include",
    });
  },

  /**
   * Create or get exchange by name (ensures exchange exists)
   */
  async ensureExchange(name: string, type: "crypto" | "stocks"): Promise<Exchange> {
    // First try to get existing exchanges
    const exchanges = await this.getExchanges();
    let exchange = exchanges.find((e) => e.name === name);
    
    if (!exchange) {
      // Exchange doesn't exist, create it
      return apiRequest<{ name: string; type: "crypto" | "stocks"; supports_oauth: boolean }, Exchange>({
        path: "/exchanges",
        method: "POST",
        body: {
          name,
          type,
          supports_oauth: false,
        },
        credentials: "include",
      });
    }
    
    return exchange;
  },

  /**
   * Get user's connections
   */
  async getUserConnections(userId: string): Promise<Connection[]> {
    return apiRequest<never, Connection[]>({
      path: `/exchanges/connections/${userId}`,
      method: "GET",
      credentials: "include",
    });
  },

  /**
   * Get active connection for current user (secure, no localStorage needed)
   */
  async getActiveConnection(): Promise<{
    success: boolean;
    data: {
      connection_id: string;
      exchange: Exchange;
      status: string;
    };
  }> {
    return apiRequest<never, {
      success: boolean;
      data: {
        connection_id: string;
        exchange: Exchange;
        status: string;
      };
    }>({
      path: "/exchanges/connections/active",
      method: "GET",
      credentials: "include",
    });
  },

  /**
   * Create a new exchange connection
   */
  async createConnection(data: CreateConnectionDto): Promise<ApiResponse<{
    connection_id: string;
    status: string;
  }>> {
    return apiRequest<CreateConnectionDto, ApiResponse<{
      connection_id: string;
      status: string;
    }>>({
      path: "/exchanges/connections",
      method: "POST",
      body: data,
      credentials: "include",
    });
  },

  /**
   * Verify connection API keys
   */
  async verifyConnection(connectionId: string): Promise<VerifyConnectionResponse> {
    return apiRequest<never, VerifyConnectionResponse>({
      path: `/exchanges/connections/${connectionId}/verify`,
      method: "POST",
      credentials: "include",
    });
  },

  /**
   * Get account balance
   */
  async getBalance(connectionId: string): Promise<ApiResponse<AccountBalance>> {
    return apiRequest<never, ApiResponse<AccountBalance>>({
      path: `/exchanges/connections/${connectionId}/balance`,
      method: "GET",
      credentials: "include",
    });
  },

  /**
   * Get positions
   */
  async getPositions(connectionId: string): Promise<ApiResponse<Position[]>> {
    return apiRequest<never, ApiResponse<Position[]>>({
      path: `/exchanges/connections/${connectionId}/positions`,
      method: "GET",
      credentials: "include",
    });
  },

  /**
   * Get orders
   */
  async getOrders(
    connectionId: string,
    options?: { status?: "open" | "all"; limit?: number }
  ): Promise<ApiResponse<Order[]>> {
    const params = new URLSearchParams();
    if (options?.status) params.append("status", options.status);
    if (options?.limit) params.append("limit", options.limit.toString());

    const queryString = params.toString();
    const path = `/exchanges/connections/${connectionId}/orders${queryString ? `?${queryString}` : ""}`;

    return apiRequest<never, ApiResponse<Order[]>>({
      path,
      method: "GET",
      credentials: "include",
    });
  },

  /**
   * Get portfolio
   */
  async getPortfolio(connectionId: string): Promise<ApiResponse<Portfolio>> {
    return apiRequest<never, ApiResponse<Portfolio>>({
      path: `/exchanges/connections/${connectionId}/portfolio`,
      method: "GET",
      credentials: "include",
    });
  },

  /**
   * Get ticker price
   */
  async getTickerPrice(connectionId: string, symbol: string): Promise<ApiResponse<TickerPrice>> {
    return apiRequest<never, ApiResponse<TickerPrice>>({
      path: `/exchanges/connections/${connectionId}/ticker/${symbol}`,
      method: "GET",
      credentials: "include",
    });
  },

  /**
   * Get combined dashboard data (optimized)
   */
  async getDashboard(connectionId: string): Promise<ApiResponse<DashboardData>> {
    return apiRequest<never, ApiResponse<DashboardData>>({
      path: `/exchanges/connections/${connectionId}/dashboard`,
      method: "GET",
      credentials: "include",
    });
  },

  /**
   * Get candlestick/OHLCV data
   */
  async getCandlestickData(
    connectionId: string,
    symbol: string,
    interval: string = "1h",
    limit: number = 100,
    startTime?: number,
    endTime?: number
  ): Promise<ApiResponse<Array<{
    openTime: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    closeTime: number;
  }>>> {
    const params = new URLSearchParams();
    params.append("interval", interval);
    params.append("limit", limit.toString());
    if (startTime) params.append("startTime", startTime.toString());
    if (endTime) params.append("endTime", endTime.toString());

    return apiRequest<never, ApiResponse<Array<{
      openTime: number;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
      closeTime: number;
    }>>>({
      path: `/exchanges/connections/${connectionId}/candles/${symbol}?${params.toString()}`,
      method: "GET",
      credentials: "include",
    });
  },

  /**
   * Get coin detail data
   */
  async getCoinDetail(
    connectionId: string,
    symbol: string
  ): Promise<ApiResponse<{
    symbol: string;
    tradingPair: string;
    currentPrice: number;
    change24h: number;
    changePercent24h: number;
    high24h: number;
    low24h: number;
    volume24h: number;
    availableBalance: number;
    quoteCurrency: string;
    candles: Array<{
      openTime: number;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
      closeTime: number;
    }>;
  }>> {
    return apiRequest<never, ApiResponse<{
      symbol: string;
      tradingPair: string;
      currentPrice: number;
      change24h: number;
      changePercent24h: number;
      high24h: number;
      low24h: number;
      volume24h: number;
      availableBalance: number;
      quoteCurrency: string;
      candles: Array<{
        openTime: number;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
        closeTime: number;
      }>;
    }>>({
      path: `/exchanges/connections/${connectionId}/coin/${symbol}`,
      method: "GET",
      credentials: "include",
    });
  },

  /**
   * Check trading permissions
   */
  async checkTradingPermissions(connectionId: string): Promise<ApiResponse<{
    canTrade: boolean;
    reason?: string;
  }>> {
    return apiRequest<never, ApiResponse<{
      canTrade: boolean;
      reason?: string;
    }>>({
      path: `/exchanges/connections/${connectionId}/trading-permissions`,
      method: "GET",
      credentials: "include",
    });
  },

  /**
   * Place an order
   */
  async placeOrder(
    connectionId: string,
    orderData: {
      symbol: string;
      side: "BUY" | "SELL";
      type: "MARKET" | "LIMIT";
      quantity: number;
      price?: number;
    }
  ): Promise<ApiResponse<Order>> {
    return apiRequest<{
      symbol: string;
      side: "BUY" | "SELL";
      type: "MARKET" | "LIMIT";
      quantity: number;
      price?: number;
    }, ApiResponse<Order>>({
      path: `/exchanges/connections/${connectionId}/orders/place`,
      method: "POST",
      body: orderData,
      credentials: "include",
    });
  },

  async getOrderBook(
    connectionId: string,
    symbol: string,
    limit: number = 20,
  ): Promise<ApiResponse<OrderBook>> {
    return apiRequest<never, ApiResponse<OrderBook>>({
      path: `/exchanges/connections/${connectionId}/orderbook/${symbol}?limit=${limit}`,
      method: "GET",
      credentials: "include",
    });
  },

  async getRecentTrades(
    connectionId: string,
    symbol: string,
    limit: number = 50,
  ): Promise<ApiResponse<RecentTrade[]>> {
    return apiRequest<never, ApiResponse<RecentTrade[]>>({
      path: `/exchanges/connections/${connectionId}/trades/${symbol}?limit=${limit}`,
      method: "GET",
      credentials: "include",
    });
  },

  /**
   * Get all user connections for current authenticated user
   */
  async getConnections(): Promise<any[]> {
    try {
      const response = await apiRequest<never, any>({
        path: "/exchanges/my-connections",
        method: "GET",
        credentials: "include",
      });
      
      // Handle different response structures
      if (Array.isArray(response)) {
        return response;
      }
      if (response?.data && Array.isArray(response.data)) {
        return response.data;
      }
      if (response?.success && Array.isArray(response.data)) {
        return response.data;
      }
      console.warn("Unexpected response format for getConnections:", response);
      return [];
    } catch (error: any) {
      console.error("Failed to fetch connections:", error);
      return [];
    }
  },

  /**
   * Update an exchange connection with new credentials
   */
  async updateConnection(
    connectionId: string,
    data: {
      api_key: string;
      api_secret: string;
      password: string;
      passphrase?: string;
    }
  ): Promise<any> {
    return apiRequest<any, any>({
      path: `/exchanges/connections/${connectionId}`,
      method: "PUT",
      body: data,
      credentials: "include",
    });
  },

  /**
   * Delete an exchange connection
   */
  async deleteConnection(connectionId: string): Promise<any> {
    return apiRequest<never, any>({
      path: `/exchanges/connections/${connectionId}`,
      method: "DELETE",
      credentials: "include",
    });
  },

  /**
   * Verify an exchange account with provided credentials
   */
  async verifyExchangeAccount(
    exchangeName: string,
    apiKey: string,
    apiSecret: string,
    passphrase?: string
  ): Promise<any> {
    return apiRequest<any, any>({
      path: "/exchanges/verify-account",
      method: "POST",
      body: {
        exchange_name: exchangeName,
        api_key: apiKey,
        api_secret: apiSecret,
        ...(passphrase && { passphrase }),
      },
      credentials: "include",
    });
  },
};

export interface OrderBook {
  bids: Array<{
    price: number;
    quantity: number;
    total?: number;
  }>;
  asks: Array<{
    price: number;
    quantity: number;
    total?: number;
  }>;
  lastUpdateId: number;
  spread: number;
  spreadPercent: number;
}

export interface RecentTrade {
  id: string;
  price: number;
  quantity: number;
  time: number;
  isBuyerMaker: boolean;
}

