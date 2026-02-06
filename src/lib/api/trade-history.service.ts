import { apiRequest } from "./client";

export interface ClosedTrade {
  id: string;
  symbol: string;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  profitLoss: number;
  profitLossPercent: number;
  entryTime: string;
  exitTime: string;
  duration: string;
  entryOrderId?: string;
  exitOrderId?: string;
}

export interface TradeHistorySummary {
  totalTrades: number;
  profitableTrades: number;
  losingTrades: number;
  totalProfitLoss: number;
  winRate: number;
  avgProfit: number;
}

export interface TradeHistoryResponse {
  success: boolean;
  data: ClosedTrade[];
  summary: TradeHistorySummary;
}

export const tradeHistoryService = {
  async getTradeHistory(params?: {
    limit?: number;
    after?: string;
    until?: string;
  }): Promise<TradeHistoryResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.after) queryParams.append('after', params.after);
    if (params?.until) queryParams.append('until', params.until);
    
    const query = queryParams.toString();
    const path = `/alpaca-paper-trading/trade-history${query ? `?${query}` : ''}`;
    
    const response = await apiRequest<null, TradeHistoryResponse>({
      path,
      method: 'GET',
    });
    return response;
  },

  async getCryptoTradeHistory(params?: {
    limit?: number;
    after?: string;
    until?: string;
  }): Promise<TradeHistoryResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.after) queryParams.append('after', params.after);
    if (params?.until) queryParams.append('until', params.until);
    
    const query = queryParams.toString();
    const path = `/alpaca-paper-trading/trade-history${query ? `?${query}` : ''}`;
    
    const response = await apiRequest<null, TradeHistoryResponse>({
      path,
      method: 'GET',
    });
    return response;
  },
};
