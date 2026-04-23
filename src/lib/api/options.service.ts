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
  /** Present on `POST /options/order` responses; absent on list/history reads. */
  success?: boolean;
  /** Present on `POST /options/order` responses — human-readable confirmation. */
  message?: string;
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
  ivPercentile?: number | null;
  recordedAt: string;
}

export interface PortfolioGreeks {
  totalDelta: number;
  totalGamma: number;
  totalTheta: number;
  totalVega: number;
  totalUnrealizedPnl: number;
  totalMaxLoss: number;
  positionCount: number;
  exposureByUnderlying: Record<string, { delta: number; positions: number }>;
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

export type MultiLegPositionIntent =
  | "buy_to_open"
  | "sell_to_open"
  | "buy_to_close"
  | "sell_to_close";

export interface MultiLegOrderLeg {
  contractSymbol: string;
  side: "buy" | "sell";
  ratioQty: number;
  positionIntent: MultiLegPositionIntent;
}

export interface PlaceMultiLegOrderRequest {
  connectionId: string;
  underlying: string;
  qty: number;
  type: "market" | "limit";
  limitPrice?: number;
  timeInForce?: "day" | "gtc";
  signalId?: string;
  legs: MultiLegOrderLeg[];
}

export interface MultiLegOrderResponse {
  groupId: string;
  brokerOrderId: string;
  legs: string[];
  status: string;
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
   * Pass `connectionId` to scope the list to the active venue (Alpaca
   * equities vs Binance crypto). Backend defaults to Binance if omitted.
   */
  async getAvailableUnderlyings(connectionId?: string): Promise<AvailableUnderlying[]> {
    const q = connectionId ? `?connectionId=${encodeURIComponent(connectionId)}` : "";
    return apiRequest<never, AvailableUnderlying[]>({
      path: `/options/underlyings${q}`,
      method: "GET",
    });
  },

  async getOptionsChain(
    underlying: string,
    connectionId?: string,
  ): Promise<OptionsChainResponse> {
    const q = connectionId ? `?connectionId=${encodeURIComponent(connectionId)}` : "";
    return apiRequest<never, OptionsChainResponse>({
      path: `/options/chain/${underlying}${q}`,
      method: "GET",
    });
  },

  async getGreeks(contractSymbol: string, connectionId?: string): Promise<Greeks> {
    const q = connectionId ? `?connectionId=${encodeURIComponent(connectionId)}` : "";
    return apiRequest<never, Greeks>({
      path: `/options/greeks/${encodeURIComponent(contractSymbol)}${q}`,
      method: "GET",
    });
  },

  async getTicker(contractSymbol: string, connectionId?: string): Promise<OptionTicker> {
    const q = connectionId ? `?connectionId=${encodeURIComponent(connectionId)}` : "";
    const raw = await apiRequest<never, OptionTicker>({
      path: `/options/ticker/${encodeURIComponent(contractSymbol)}${q}`,
      method: "GET",
    });
    return {
      ...raw,
      lastPrice: Number(raw.lastPrice) || 0,
      bidPrice: Number(raw.bidPrice) || 0,
      askPrice: Number(raw.askPrice) || 0,
      volume: Number(raw.volume) || 0,
      high: Number(raw.high) || 0,
      low: Number(raw.low) || 0,
      priceChange: Number(raw.priceChange) || 0,
      priceChangePercent: Number(raw.priceChangePercent) || 0,
    };
  },

  async getDepth(
    contractSymbol: string,
    limit?: number,
    connectionId?: string,
  ): Promise<OptionDepth> {
    const params = new URLSearchParams();
    if (limit) params.append("limit", String(limit));
    if (connectionId) params.append("connectionId", connectionId);
    const query = params.toString();
    return apiRequest<never, OptionDepth>({
      path: `/options/depth/${encodeURIComponent(contractSymbol)}${query ? `?${query}` : ""}`,
      method: "GET",
    });
  },

  /**
   * Returns the options approval level for the venue behind `connectionId`.
   * Binance always reports `{ level: 3, status: 'approved' }`; Alpaca
   * reports the user's real `options_approved_level` (0–3). The frontend
   * gates multi-leg entry points on `level >= 3`.
   */
  async getApprovalStatus(connectionId: string): Promise<{
    venue: "BINANCE" | "ALPACA";
    level: 0 | 1 | 2 | 3;
    status: "approved" | "pending" | "rejected" | "not_applied";
  }> {
    return apiRequest<never, {
      venue: "BINANCE" | "ALPACA";
      level: 0 | 1 | 2 | 3;
      status: "approved" | "pending" | "rejected" | "not_applied";
    }>({
      path: `/options/approval-status?connectionId=${encodeURIComponent(connectionId)}`,
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
  async getPositionHistory(venue?: string): Promise<OptionsPosition[]> {
    const params = new URLSearchParams();
    if (venue) params.append("venue", venue);
    return apiRequest<never, OptionsPosition[]>({
      path: `/options/positions/history?${params}`,
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
   * Place an Alpaca multi-leg (mleg) order. Up to 4 legs fill atomically.
   * Backend returns 403 if the user's Alpaca approval level is below 3.
   * Caller should catch the 403 and offer the single-leg fallback CTA.
   */
  async placeMultiLegOrder(
    dto: PlaceMultiLegOrderRequest,
  ): Promise<MultiLegOrderResponse> {
    return apiRequest<PlaceMultiLegOrderRequest, MultiLegOrderResponse>({
      path: "/options/orders/multi-leg",
      method: "POST",
      body: dto,
    });
  },

  /**
   * Get user's option orders from DB.
   */
  async getOrders(status?: string, limit?: number, venue?: string): Promise<OptionsOrder[]> {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (limit) params.append("limit", String(limit));
    if (venue) params.append("venue", venue);
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

  async getAiSignals(underlying?: string, limit?: number, venue?: string): Promise<AiOptionsSignal[]> {
    const params = new URLSearchParams();
    if (underlying) params.append("underlying", underlying);
    if (limit) params.append("limit", String(limit));
    if (venue) params.append("venue", venue);
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

  // ── Risk / Portfolio ────────────────────────────────

  async getPortfolioGreeks(): Promise<PortfolioGreeks> {
    return apiRequest<never, PortfolioGreeks>({
      path: "/options/portfolio-greeks",
      method: "GET",
    });
  },

  // ── IV Data ─────────────────────────────────────────────

  async getIvRank(underlying: string, venue?: string): Promise<IvRankData | null> {
    const params = new URLSearchParams();
    if (venue) params.append("venue", venue);
    return apiRequest<never, IvRankData | null>({
      path: `/options/iv/rank/${encodeURIComponent(underlying)}?${params}`,
      method: "GET",
    });
  },

  async getIvHistory(underlying: string, days?: number, venue?: string): Promise<IvHistoryPoint[]> {
    const params = new URLSearchParams();
    if (days) params.append("days", String(days));
    if (venue) params.append("venue", venue);
    return apiRequest<never, IvHistoryPoint[]>({
      path: `/options/iv/history/${encodeURIComponent(underlying)}?${params}`,
      method: "GET",
    });
  },
};
