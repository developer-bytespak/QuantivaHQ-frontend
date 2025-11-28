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
};

