import { apiRequest } from "./client";

// ── Types ────────────────────────────────────────────────────────────────────

export type OptionType = "CALL" | "PUT";
export type OptionSide = "BUY" | "SELL";
export type OptionOrderStatus =
  | "pending"
  | "filled"
  | "partially_filled"
  | "cancelled"
  | "rejected"
  | "expired";

export interface Greeks {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  impliedVolatility?: number;
}

export interface OptionContract {
  symbol: string;         // e.g. BTC-260327-100000-C (backend field name)
  contractSymbol?: string; // alias for convenience
  underlying: string;     // e.g. BTC
  strike: number;
  expiry: string;         // ISO date
  type: OptionType;       // matches backend OptionContractDto.type
  bidPrice: number;
  askPrice: number;
  lastPrice: number;
  markPrice: number;
  volume: number;
  openInterest: number;
  greeks?: Greeks;
  contractSize?: number;
}

export interface OptionsChainResponse {
  underlying: string;
  underlyingPrice: number;
  expiryDates: string[];
  contracts: OptionContract[];
  timestamp: number;
}

export interface AvailableUnderlying {
  symbol: string;       // e.g. BTC
  indexPrice: number;   // current underlying price
  contractCount: number; // number of active option contracts
}

export interface OptionsAccount {
  totalBalance: number;
  availableBalance: number;
  unrealizedPnl: number;
  marginBalance: number;
}

export interface OptionsPosition {
  positionId?: string;
  contractSymbol: string;
  underlying: string;
  strike: number;
  expiry: string;
  optionType: OptionType;
  quantity: number;
  avgPremium: number;
  currentPremium: number;
  unrealizedPnl: number;
  realizedPnl: number;
  greeks?: Greeks;
  isOpen: boolean;
}

export interface OptionsOrder {
  orderId: string;
  contractSymbol: string;
  underlying: string;
  strike: number;
  expiry: string;
  optionType: OptionType;
  side: string;
  quantity: number;
  price: number;
  filledQuantity: number;
  avgFillPrice: number;
  fee: number;
  status: OptionOrderStatus;
  binanceOrderId: string;
  maxLoss: number;
  createdAt: string;
}

export interface OptionsRecommendation {
  signalId: string;
  assetSymbol: string;
  signalAction: string;
  signalConfidence: number;
  finalScore: number;
  recommendedType: OptionType;
  recommendedStrike: number;
  recommendedExpiry: string;
  estimatedPremium: number;
  maxLoss: number;
  recommendedQuantity: number;
  ivRank: number;
  ivValue: number;
  greeks?: Greeks;
  liquidityOk: boolean;
  reasoning: string;
  confidenceAdjustment: number;
}

// ── AI Signal Types ──────────────────────────────────────────────────────────

export interface AiSignalLeg {
  type: "CALL" | "PUT";
  side: "BUY" | "SELL";
  strike: number;
  expiry: string;
  ratio: number;
}

export interface AiOptionsSignal {
  id: string;
  underlying: string;
  strategy: string;
  direction: "bullish" | "bearish" | "neutral";
  score: number;
  confidence: number;
  iv_rank: number | null;
  iv_value: number | null;
  spot_price: number | null;
  legs: AiSignalLeg[];
  reasoning: string | null;
  risk_reward: string | null;
  max_profit: string | null;
  max_loss: string | null;
  expires_at: string;
  created_at: string;
}

export interface IvRankData {
  underlying: string;
  currentIv: number;
  ivRank: number | null;
  recordedAt: string;
}

export interface IvHistoryPoint {
  id: string;
  underlying: string;
  iv_value: number;
  iv_rank: number | null;
  recorded_at: string;
}

export interface PlaceOptionOrderRequest {
  connectionId: string;
  contractSymbol: string;
  underlying: string;
  strike: number;
  expiry: string;
  optionType: OptionType;
  side: OptionSide;
  quantity: number;
  price: number;
  signalId?: string;
}

export interface CancelOptionOrderRequest {
  connectionId: string;
  contractSymbol: string;
  orderId: string; // our DB order_id or binance order_id
}

export interface OptionTicker {
  symbol: string;
  lastPrice: number;
  bidPrice: number;
  askPrice: number;
  volume: number;
  high: number;
  low: number;
  priceChange: number;
  priceChangePercent: number;
}

export interface OptionDepthEntry {
  price: number;
  quantity: number;
}

export interface OptionDepth {
  bids: OptionDepthEntry[];
  asks: OptionDepthEntry[];
}

// ── API Service ──────────────────────────────────────────────────────────────

export const optionsService = {
  // ── Market Data ──────────────────────────────────────────

  /**
   * Get all available underlying assets for options trading.
   */
  async getAvailableUnderlyings(connectionId: string): Promise<AvailableUnderlying[]> {
    return apiRequest<never, AvailableUnderlying[]>({
      path: `/options/underlyings?connectionId=${connectionId}`,
      method: "GET",
    });
  },

  /**
   * Fetch full options chain for an underlying (BTC, ETH, SOL, etc.)
   */
  async getOptionsChain(underlying: string, connectionId: string): Promise<OptionsChainResponse> {
    return apiRequest<never, OptionsChainResponse>({
      path: `/options/chain/${underlying}?connectionId=${connectionId}`,
      method: "GET",
    });
  },

  /**
   * Fetch Greeks for a specific option contract.
   */
  async getGreeks(contractSymbol: string, connectionId: string): Promise<Greeks> {
    return apiRequest<never, Greeks>({
      path: `/options/greeks/${encodeURIComponent(contractSymbol)}?connectionId=${connectionId}`,
      method: "GET",
    });
  },

  /**
   * Fetch 24hr ticker for a specific option contract.
   */
  async getTicker(contractSymbol: string, connectionId: string): Promise<OptionTicker> {
    return apiRequest<never, OptionTicker>({
      path: `/options/ticker/${encodeURIComponent(contractSymbol)}?connectionId=${connectionId}`,
      method: "GET",
    });
  },

  /**
   * Fetch order book depth for an option contract.
   */
  async getDepth(contractSymbol: string, connectionId: string, limit?: number): Promise<OptionDepth> {
    const params = new URLSearchParams({ connectionId });
    if (limit) params.append("limit", String(limit));
    return apiRequest<never, OptionDepth>({
      path: `/options/depth/${encodeURIComponent(contractSymbol)}?${params}`,
      method: "GET",
    });
  },

  // ── Account ──────────────────────────────────────────────

  /**
   * Get options account balance.
   */
  async getBalance(connectionId: string): Promise<OptionsAccount> {
    return apiRequest<never, OptionsAccount>({
      path: `/options/account?connectionId=${connectionId}`,
      method: "GET",
    });
  },

  // ── Positions ────────────────────────────────────────────

  /**
   * Get open options positions (live from Binance + synced to DB).
   */
  async getPositions(connectionId: string): Promise<OptionsPosition[]> {
    return apiRequest<never, OptionsPosition[]>({
      path: `/options/positions?connectionId=${connectionId}`,
      method: "GET",
    });
  },

  /**
   * Get historical (closed) positions from DB.
   */
  async getPositionHistory(): Promise<OptionsPosition[]> {
    return apiRequest<never, OptionsPosition[]>({
      path: "/options/positions/history",
      method: "GET",
    });
  },

  // ── Orders ───────────────────────────────────────────────

  /**
   * Place a new option order.
   */
  async placeOrder(dto: PlaceOptionOrderRequest): Promise<OptionsOrder> {
    return apiRequest<PlaceOptionOrderRequest, OptionsOrder>({
      path: "/options/order",
      method: "POST",
      body: dto,
    });
  },

  /**
   * Cancel an open option order.
   */
  async cancelOrder(dto: CancelOptionOrderRequest): Promise<{ success: boolean }> {
    return apiRequest<CancelOptionOrderRequest, { success: boolean }>({
      path: "/options/order",
      method: "DELETE",
      body: dto,
    });
  },

  /**
   * Get user's option orders from DB.
   */
  async getOrders(status?: string, limit?: number): Promise<OptionsOrder[]> {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (limit) params.append("limit", String(limit));
    const query = params.toString();
    return apiRequest<never, OptionsOrder[]>({
      path: `/options/orders${query ? `?${query}` : ""}`,
      method: "GET",
    });
  },

  /**
   * Get open orders live from Binance.
   */
  async getOpenOrdersLive(connectionId: string, contractSymbol?: string): Promise<OptionsOrder[]> {
    const params = new URLSearchParams({ connectionId });
    if (contractSymbol) params.append("contractSymbol", contractSymbol);
    return apiRequest<never, OptionsOrder[]>({
      path: `/options/orders/live?${params}`,
      method: "GET",
    });
  },

  // ── AI Recommendations ──────────────────────────────────

  /**
   * Get AI-generated options recommendations.
   */
  async getRecommendations(connectionId: string, underlying?: string): Promise<OptionsRecommendation[]> {
    const params = new URLSearchParams({ connectionId });
    if (underlying) params.append("underlying", underlying);
    return apiRequest<never, OptionsRecommendation[]>({
      path: `/options/recommendations?${params}`,
      method: "GET",
    });
  },

  // ── AI Signals ──────────────────────────────────────────

  async getAiSignals(underlying?: string, limit?: number): Promise<AiOptionsSignal[]> {
    const params = new URLSearchParams();
    if (underlying) params.append("underlying", underlying);
    if (limit) params.append("limit", String(limit));
    return apiRequest<never, AiOptionsSignal[]>({
      path: `/options/ai-signals?${params}`,
      method: "GET",
    });
  },

  async getAiSignalById(id: string): Promise<AiOptionsSignal> {
    return apiRequest<never, AiOptionsSignal>({
      path: `/options/ai-signals/${encodeURIComponent(id)}`,
      method: "GET",
    });
  },

  // ── IV Data ─────────────────────────────────────────────

  async getIvRank(underlying: string): Promise<IvRankData | null> {
    return apiRequest<never, IvRankData | null>({
      path: `/options/iv/rank/${encodeURIComponent(underlying)}`,
      method: "GET",
    });
  },

  async getIvHistory(underlying: string, days?: number): Promise<IvHistoryPoint[]> {
    const params = new URLSearchParams();
    if (days) params.append("days", String(days));
    return apiRequest<never, IvHistoryPoint[]>({
      path: `/options/iv/history/${encodeURIComponent(underlying)}?${params}`,
      method: "GET",
    });
  },
};
