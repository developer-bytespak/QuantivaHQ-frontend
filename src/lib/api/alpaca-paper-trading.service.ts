import { apiRequest } from './client';

// Types
export interface AlpacaAccount {
  id: string;
  account_number: string;
  status: string;
  currency: string;
  buying_power: string;
  cash: string;
  portfolio_value: string;
  pattern_day_trader: boolean;
  trading_blocked: boolean;
  transfers_blocked: boolean;
  account_blocked: boolean;
  created_at: string;
  shorting_enabled: boolean;
  multiplier: string;
  long_market_value: string;
  short_market_value: string;
  equity: string;
  last_equity: string;
  initial_margin: string;
  maintenance_margin: string;
  daytrade_count: number;
  daytrading_buying_power: string;
  regt_buying_power: string;
}

export interface AlpacaPosition {
  asset_id: string;
  symbol: string;
  exchange: string;
  asset_class: string;
  avg_entry_price: string;
  qty: string;
  side: string;
  market_value: string;
  cost_basis: string;
  unrealized_pl: string;
  unrealized_plpc: string;
  unrealized_intraday_pl: string;
  unrealized_intraday_plpc: string;
  current_price: string;
  lastday_price: string;
  change_today: string;
}

export interface AlpacaOrder {
  id: string;
  client_order_id: string;
  created_at: string;
  updated_at: string;
  submitted_at: string;
  filled_at: string | null;
  expired_at: string | null;
  canceled_at: string | null;
  failed_at: string | null;
  asset_id: string;
  symbol: string;
  asset_class: string;
  qty: string;
  filled_qty: string;
  filled_avg_price: string | null;
  order_type: string;
  type: string;
  side: string;
  time_in_force: string;
  limit_price: string | null;
  stop_price: string | null;
  status: string;
  extended_hours: boolean;
}

export interface AlpacaBalance {
  buyingPower: number;
  cash: number;
  portfolioValue: number;
  equity: number;
  longMarketValue: number;
  shortMarketValue: number;
  dailyChange: number;
  dailyChangePercent: number;
}

export interface AlpacaDashboard {
  account: AlpacaAccount;
  balance: AlpacaBalance;
  positions: AlpacaPosition[];
  openOrders: AlpacaOrder[];
  recentOrders: AlpacaOrder[];
  clock: {
    isOpen: boolean;
    nextOpen: string;
    nextClose: string;
  };
}

export interface PlaceOrderParams {
  symbol: string;
  qty?: number;
  notional?: number;
  side: 'buy' | 'sell';
  type?: 'market' | 'limit' | 'stop' | 'stop_limit' | 'trailing_stop';
  time_in_force?: 'day' | 'gtc' | 'opg' | 'cls' | 'ioc' | 'fok';
  limit_price?: number;
  stop_price?: number;
  trail_price?: number;
  trail_percent?: number;
  extended_hours?: boolean;
  order_class?: 'simple' | 'bracket' | 'oco' | 'oto';
  take_profit?: {
    limit_price: number;
  };
  stop_loss?: {
    stop_price: number;
    limit_price?: number;
  };
}

// API Service
export const alpacaPaperTradingService = {
  /**
   * Get service status
   */
  async getStatus(): Promise<{
    configured: boolean;
    connected: boolean;
    endpoint: string;
    timestamp: string;
  }> {
    return apiRequest({
      path: '/alpaca-paper-trading/status',
      method: 'GET',
    });
  },

  /**
   * Get full dashboard data
   */
  async getDashboard(): Promise<AlpacaDashboard> {
    const response = await apiRequest<never, { success: boolean; data: AlpacaDashboard }>({
      path: '/alpaca-paper-trading/dashboard',
      method: 'GET',
    });
    return response.data;
  },

  /**
   * Get account information
   */
  async getAccount(): Promise<AlpacaAccount> {
    const response = await apiRequest<never, { success: boolean; data: AlpacaAccount }>({
      path: '/alpaca-paper-trading/account',
      method: 'GET',
    });
    return response.data;
  },

  /**
   * Get balance summary
   */
  async getBalance(): Promise<AlpacaBalance> {
    const response = await apiRequest<never, { success: boolean; data: AlpacaBalance }>({
      path: '/alpaca-paper-trading/balance',
      method: 'GET',
    });
    return response.data;
  },

  /**
   * Get all positions
   */
  async getPositions(): Promise<AlpacaPosition[]> {
    const response = await apiRequest<never, { success: boolean; data: AlpacaPosition[]; count: number }>({
      path: '/alpaca-paper-trading/positions',
      method: 'GET',
    });
    return response.data;
  },

  /**
   * Get position for specific symbol
   */
  async getPosition(symbol: string): Promise<AlpacaPosition | null> {
    const response = await apiRequest<never, { success: boolean; data: AlpacaPosition | null }>({
      path: `/alpaca-paper-trading/positions/${symbol}`,
      method: 'GET',
    });
    return response.data;
  },

  /**
   * Close a position
   */
  async closePosition(
    symbol: string,
    options?: { qty?: number; percentage?: number }
  ): Promise<AlpacaOrder> {
    const params = new URLSearchParams();
    if (options?.qty) params.append('qty', options.qty.toString());
    if (options?.percentage) params.append('percentage', options.percentage.toString());
    
    const url = `/alpaca-paper-trading/positions/${symbol}${params.toString() ? `?${params}` : ''}`;
    const response = await apiRequest<never, { success: boolean; data: AlpacaOrder }>({
      path: url,
      method: 'DELETE',
    });
    return response.data;
  },

  /**
   * Close all positions
   */
  async closeAllPositions(cancelOrders: boolean = true): Promise<AlpacaOrder[]> {
    const response = await apiRequest<never, { success: boolean; data: AlpacaOrder[] }>({
      path: `/alpaca-paper-trading/positions?cancel_orders=${cancelOrders}`,
      method: 'DELETE',
    });
    return response.data;
  },

  /**
   * Get orders
   */
  async getOrders(params?: {
    status?: 'open' | 'closed' | 'all';
    limit?: number;
    after?: string;
    until?: string;
    direction?: 'asc' | 'desc';
    symbols?: string;
    nested?: boolean;
  }): Promise<AlpacaOrder[]> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.after) searchParams.append('after', params.after);
    if (params?.until) searchParams.append('until', params.until);
    if (params?.direction) searchParams.append('direction', params.direction);
    if (params?.symbols) searchParams.append('symbols', params.symbols);
    // Add nested=true to show parent-child relationships for bracket orders
    if (params?.nested !== undefined) {
      searchParams.append('nested', params.nested.toString());
    } else {
      // Default to nested=true to show bracket order relationships
      searchParams.append('nested', 'true');
    }

    const url = `/alpaca-paper-trading/orders${searchParams.toString() ? `?${searchParams}` : ''}`;
    const response = await apiRequest<never, { success: boolean; data: AlpacaOrder[]; count: number }>({
      path: url,
      method: 'GET',
    });
    return response.data;
  },

  /**
   * Get specific order
   */
  async getOrder(orderId: string): Promise<AlpacaOrder> {
    const response = await apiRequest<never, { success: boolean; data: AlpacaOrder }>({
      path: `/alpaca-paper-trading/orders/${orderId}`,
      method: 'GET',
    });
    return response.data;
  },

  /**
   * Place a new order
   */
  async placeOrder(params: PlaceOrderParams): Promise<AlpacaOrder> {
    const response = await apiRequest<PlaceOrderParams, { success: boolean; data: AlpacaOrder; message: string }>({
      path: '/alpaca-paper-trading/orders',
      method: 'POST',
      body: params,
    });
    return response.data;
  },

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string): Promise<void> {
    await apiRequest<never, { success: boolean; message: string }>({
      path: `/alpaca-paper-trading/orders/${orderId}`,
      method: 'DELETE',
    });
  },

  /**
   * Cancel all orders
   */
  async cancelAllOrders(): Promise<void> {
    await apiRequest<never, { success: boolean; message: string }>({
      path: '/alpaca-paper-trading/orders',
      method: 'DELETE',
    });
  },

  /**
   * Replace/modify an order
   */
  async replaceOrder(
    orderId: string,
    params: {
      qty?: number;
      time_in_force?: string;
      limit_price?: number;
      stop_price?: number;
      trail?: number;
    }
  ): Promise<AlpacaOrder> {
    const response = await apiRequest<typeof params, { success: boolean; data: AlpacaOrder }>({
      path: `/alpaca-paper-trading/orders/${orderId}`,
      method: 'PATCH',
      body: params,
    });
    return response.data;
  },

  /**
   * Get portfolio history
   */
  async getPortfolioHistory(params?: {
    period?: string;
    timeframe?: string;
    date_end?: string;
    extended_hours?: boolean;
  }): Promise<{
    timestamp: number[];
    equity: number[];
    profit_loss: number[];
    profit_loss_pct: number[];
    base_value: number;
    timeframe: string;
  }> {
    const searchParams = new URLSearchParams();
    if (params?.period) searchParams.append('period', params.period);
    if (params?.timeframe) searchParams.append('timeframe', params.timeframe);
    if (params?.date_end) searchParams.append('date_end', params.date_end);
    if (params?.extended_hours !== undefined) searchParams.append('extended_hours', String(params.extended_hours));

    const url = `/alpaca-paper-trading/portfolio/history${searchParams.toString() ? `?${searchParams}` : ''}`;
    const response = await apiRequest<never, { success: boolean; data: any }>({
      path: url,
      method: 'GET',
    });
    return response.data;
  },

  /**
   * Get market clock
   */
  async getClock(): Promise<{
    timestamp: string;
    is_open: boolean;
    next_open: string;
    next_close: string;
  }> {
    const response = await apiRequest<never, { success: boolean; data: any }>({
      path: '/alpaca-paper-trading/clock',
      method: 'GET',
    });
    return response.data;
  },

  /**
   * Get trading calendar
   */
  async getCalendar(start?: string, end?: string): Promise<{
    date: string;
    open: string;
    close: string;
  }[]> {
    const searchParams = new URLSearchParams();
    if (start) searchParams.append('start', start);
    if (end) searchParams.append('end', end);

    const url = `/alpaca-paper-trading/calendar${searchParams.toString() ? `?${searchParams}` : ''}`;
    const response = await apiRequest<never, { success: boolean; data: any }>({
      path: url,
      method: 'GET',
    });
    return response.data;
  },

  /**
   * Get account activities
   */
  async getActivities(params?: {
    activity_types?: string;
    after?: string;
    until?: string;
    direction?: 'asc' | 'desc';
    page_size?: number;
  }): Promise<any[]> {
    const searchParams = new URLSearchParams();
    if (params?.activity_types) searchParams.append('activity_types', params.activity_types);
    if (params?.after) searchParams.append('after', params.after);
    if (params?.until) searchParams.append('until', params.until);
    if (params?.direction) searchParams.append('direction', params.direction);
    if (params?.page_size) searchParams.append('page_size', params.page_size.toString());

    const url = `/alpaca-paper-trading/activities${searchParams.toString() ? `?${searchParams}` : ''}`;
    const response = await apiRequest<never, { success: boolean; data: any[]; count: number }>({
      path: url,
      method: 'GET',
    });
    return response.data;
  },
};

export default alpacaPaperTradingService;
