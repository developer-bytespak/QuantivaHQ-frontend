import { apiRequest } from './client';

export interface EntryRule {
  indicator: string;
  operator: string;
  value: number;
  timeframe?: string;
  logic?: string;
}

export interface ExitRule {
  indicator: string;
  operator: string;
  value: number;
  timeframe?: string;
  logic?: string;
}

export interface IndicatorConfig {
  name: string;
  parameters?: Record<string, any>;
  timeframe?: string;
}

export interface CreateStrategyDto {
  name: string;
  type: string;
  description?: string;
  risk_level: string;
  timeframe?: string;
  entry_rules: EntryRule[];
  exit_rules: ExitRule[];
  indicators: IndicatorConfig[];
  stop_loss_type?: string;
  stop_loss_value?: number;
  take_profit_type?: string;
  take_profit_value?: number;
  schedule_cron?: string;
  target_assets: string[];
  auto_trade_threshold?: number;
  is_active?: boolean;
}

export interface EngineWeights {
  sentiment: number;
  trend: number;
  fundamental: number;
  event_risk: number;
  liquidity: number;
}

export interface Strategy {
  strategy_id: string;
  user_id?: string;
  name: string;
  type: string;
  asset_type?: 'crypto' | 'stock';
  description?: string;
  risk_level: string;
  timeframe?: string;
  entry_rules?: EntryRule[];
  exit_rules?: ExitRule[];
  indicators?: IndicatorConfig[];
  engine_weights?: EngineWeights;
  stop_loss_type?: string;
  stop_loss_value?: number;
  take_profit_type?: string;
  take_profit_value?: number;
  schedule_cron?: string;
  target_assets?: string[];
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface StrategySignal {
  signal_id: string;
  strategy_id: string;
  asset_id: string;
  timestamp: string;
  final_score: number;
  action: string;
  confidence: number;
  sentiment_score?: number;
  trend_score?: number;
  fundamental_score?: number;
  liquidity_score?: number;
  event_risk_score?: number;
}

/**
 * Create a new custom trading strategy
 */
export async function createStrategy(data: CreateStrategyDto): Promise<Strategy> {
  return apiRequest<CreateStrategyDto, Strategy>({
    path: '/strategies/custom',
    method: 'POST',
    body: data,
  });
}

/**
 * Get all strategies for the current user
 */
export async function getStrategies(userId?: string): Promise<Strategy[]> {
  const url = userId ? `/strategies?userId=${userId}` : '/strategies';
  return apiRequest<unknown, Strategy[]>({ path: url });
}

/**
 * Get a single strategy by ID
 */
export async function getStrategy(strategyId: string): Promise<Strategy> {
  return apiRequest<unknown, Strategy>({ path: `/strategies/${strategyId}` });
}

/**
 * Get strategy rules
 */
export async function getStrategyRules(strategyId: string): Promise<{
  entry_rules: EntryRule[];
  exit_rules: ExitRule[];
  indicators: IndicatorConfig[];
  timeframe?: string;
}> {
  return apiRequest<unknown, {
    entry_rules: EntryRule[];
    exit_rules: ExitRule[];
    indicators: IndicatorConfig[];
    timeframe?: string;
  }>({ path: `/strategies/${strategyId}/rules` });
}

/**
 * Validate strategy rules
 */
export async function validateStrategy(data: {
  entry_rules: EntryRule[];
  exit_rules: ExitRule[];
  indicators: IndicatorConfig[];
  timeframe?: string;
}): Promise<{ valid: boolean; errors: string[] }> {
  return apiRequest<typeof data, { valid: boolean; errors: string[] }>({
    path: '/strategies/validate',
    method: 'POST',
    body: data,
  });
}

/**
 * Get signals for a strategy (latest only, one per asset)
 */
export async function getStrategySignals(strategyId: string): Promise<StrategySignal[]> {
  return apiRequest<unknown, StrategySignal[]>({ path: `/signals?strategyId=${strategyId}&latest_only=true` });
}

/**
 * Get signals for a pre-built strategy (latest only, one per asset)
 * Fetches system-generated signals from database with realtime OHLCV data
 */
export async function getPreBuiltStrategySignals(strategyId: string): Promise<StrategySignal[]> {
  return apiRequest<unknown, StrategySignal[]>({ 
    path: `/strategies/pre-built/${strategyId}/signals?latest_only=true&realtime=true`,
    method: 'GET',
  });
}

/**
 * Get trending assets with AI insights for a pre-built strategy
 * Returns top N assets with AI insights generated for the top 2
 * Uses the same data source as the market page (market_rankings table)
 * @param limit Maximum number of assets to return (default: 10000 to get all available)
 */
export async function getTrendingAssetsWithInsights(strategyId: string, limit: number = 10000): Promise<{
  strategy: { id: string; name: string; description: string };
  assets: Array<{
    asset_id: string;
    symbol: string;
    display_name: string;
    asset_type?: string;
    price_usd: number;
    price_change_24h: number;
    volume_24h: number;
    trend_score: number;
    hasAiInsight: boolean;
    aiInsight?: string;
    signal?: {
      signal_id: string;
      action: string;
      confidence: number;
      final_score: number;
      entry_price?: number;
      stop_loss?: number;
      take_profit_1?: number;
      stop_loss_pct?: number;
      take_profit_pct?: number;
      trend_score?: number;
      sentiment_score?: number;
    };
  }>;
}> {
  return apiRequest<unknown, any>({
    path: `/strategies/pre-built/${strategyId}/trending-with-insights?limit=${limit}`,
    method: 'GET',
    timeout: 300000, // 5 min - signal generation can run engines on many assets
  });
}

/**
 * Generate AI insight for a specific asset on-demand
 */
export async function generateAssetInsight(strategyId: string, assetId: string): Promise<{
  asset_id: string;
  strategy_id: string;
  insight: string;
  generated_at: string;
  signal?: any;
}> {
  return apiRequest<unknown, any>({
    path: `/strategies/pre-built/${strategyId}/assets/${assetId}/generate-insight`,
    method: 'POST',
  });
}

/**
 * Update a strategy (using backend-specified path)
 */
export async function updateStrategy(
  strategyId: string,
  data: Partial<CreateStrategyDto>
): Promise<Strategy> {
  return apiRequest<Partial<CreateStrategyDto>, Strategy>({
    path: `/strategies/my-strategies/${strategyId}`,
    method: 'PUT',
    body: data,
  });
}

/**
 * Delete a strategy
 */
export async function deleteStrategy(strategyId: string): Promise<void> {
  return apiRequest<unknown, void>({
    path: `/strategies/${strategyId}`,
    method: 'DELETE',
  });
}

/**
 * Activate a strategy
 */
export async function activateStrategy(strategyId: string): Promise<Strategy> {
  return updateStrategy(strategyId, { is_active: true });
}

/**
 * Deactivate a strategy
 */
export async function deactivateStrategy(strategyId: string): Promise<Strategy> {
  return updateStrategy(strategyId, { is_active: false });
}

// ============= STOCK MARKET DATA API =============

export interface StockMarketData {
  symbol: string;
  asset_id: string;
  name: string;
  sector?: string;
  price_usd: number;
  price_change_24h: number;
  price_change_24h_usd: number;
  volume_24h: number;
  high_24h: number;
  low_24h: number;
  day_open: number;
  prev_close: number;
  is_realtime: boolean;
  last_updated: string;
}

export interface StocksForTopTradesResponse {
  stocks: StockMarketData[];
  source: 'alpaca' | 'database';
  updated_at: string;
}

/**
 * Get stocks with real-time market data for Top Trades page
 * Data is sourced from Alpaca API with automatic caching
 */
export async function getStocksForTopTrades(limit: number = 500): Promise<StocksForTopTradesResponse> {
  return apiRequest<unknown, StocksForTopTradesResponse>({
    path: `/strategies/stocks/top-trades?limit=${limit}`,
    method: 'GET',
  });
}

/**
 * Get real-time market data for a specific stock
 */
export async function getStockMarketData(symbol: string): Promise<StockMarketData> {
  return apiRequest<unknown, StockMarketData>({
    path: `/strategies/stocks/${symbol}/market-data`,
    method: 'GET',
  });
}

/**
 * Manually trigger Alpaca market data sync (admin use)
 */
export async function syncAlpacaMarketData(): Promise<{
  success: boolean;
  updated: number;
  errors: string[];
}> {
  return apiRequest<unknown, any>({
    path: '/strategies/sync-alpaca-market-data',
    method: 'POST',
  });
}

/**
 * Seed popular stocks with real Alpaca data (admin use)
 */
export async function seedPopularStocks(): Promise<{
  success: boolean;
  count: number;
  errors: string[];
}> {
  return apiRequest<unknown, any>({
    path: '/strategies/seed-popular-stocks',
    method: 'POST',
  });
}

/**
 * Trigger stock signals generation (runs in background)
 * Returns immediately - signals will appear within 1-2 minutes
 */
export async function triggerStockSignals(): Promise<{
  message: string;
  status: string;
}> {
  return apiRequest<unknown, any>({
    path: '/strategies/trigger-stock-signals',
    method: 'POST',
    timeout: 60000, // 60 second timeout (though it returns immediately now)
  });
}

