import { apiRequest } from "./client";

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
  private basePath = "/alpaca-paper-trading";

  async getStatus() {
    return apiRequest({ path: `${this.basePath}/status` });
  }

  async getAccountBalance(): Promise<{
    balances: Array<{ asset: string; free: number; locked: number }>;
    totalBalanceUSD: number;
  }> {
    const result: any = await apiRequest({ path: `${this.basePath}/balance` });
    const balance = result.data;
    return {
      balances: [{ asset: 'USD', free: balance.cash || 0, locked: 0 }],
      totalBalanceUSD: balance.portfolioValue || 0,
    };
  }

  async getDashboard(): Promise<AlpacaDashboard> {
    const result: any = await apiRequest({ path: `${this.basePath}/dashboard` });
    return result.data;
  }

  async getPositions(): Promise<AlpacaPosition[]> {
    const result: any = await apiRequest({ path: `${this.basePath}/positions` });
    return result.data || [];
  }

  async getOrders(status: 'open' | 'closed' | 'all' = 'all'): Promise<any[]> {
    const result: any = await apiRequest({ path: `${this.basePath}/orders?status=${status}` });
    const orders = result.data || [];
    return orders
      .filter((order: AlpacaOrder) => order.symbol.includes('/'))
      .map((order: AlpacaOrder) => ({
        orderId: parseInt(order.id.replace(/[^0-9]/g, '').slice(-9)) || Date.now(),
        symbol: order.symbol,
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

  async getTickerPrice(symbol: string): Promise<{ price: number }> {
    const result: any = await apiRequest({ path: `${this.basePath}/quote/${symbol}` });
    const quote = result.data;
    const price = quote.ap ? parseFloat(quote.ap) : 0;
    return { price };
  }

  async placeOrder(payload: {
    symbol: string;
    side: 'buy' | 'sell';
    type: 'market' | 'limit';
    qty: number;
    limit_price?: number;
    time_in_force?: 'gtc' | 'ioc' | 'fok';
  }): Promise<AlpacaOrder> {
    const orderPayload = { ...payload, time_in_force: payload.time_in_force || 'gtc' };
    const result: any = await apiRequest({ path: `${this.basePath}/orders`, method: "POST", body: orderPayload });
    return result.data;
  }

  async cancelOrder(orderId: string): Promise<void> {
    await apiRequest({ path: `${this.basePath}/orders/${orderId}`, method: "DELETE" });
  }

  async closePosition(symbol: string, qty?: number): Promise<AlpacaOrder> {
    const path = qty
      ? `${this.basePath}/positions/${symbol}?qty=${qty}`
      : `${this.basePath}/positions/${symbol}`;
    const result: any = await apiRequest({ path, method: "DELETE" });
    return result.data;
  }
}

export const alpacaCryptoService = new AlpacaCryptoService();
export default alpacaCryptoService;
