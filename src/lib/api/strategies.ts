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

export interface Strategy {
  strategy_id: string;
  user_id?: string;
  name: string;
  type: string;
  description?: string;
  risk_level: string;
  timeframe?: string;
  entry_rules?: EntryRule[];
  exit_rules?: ExitRule[];
  indicators?: IndicatorConfig[];
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
 * Get signals for a strategy
 */
export async function getStrategySignals(strategyId: string): Promise<StrategySignal[]> {
  return apiRequest<unknown, StrategySignal[]>({ path: `/signals?strategyId=${strategyId}` });
}

/**
 * Update a strategy
 */
export async function updateStrategy(
  strategyId: string,
  data: Partial<CreateStrategyDto>
): Promise<Strategy> {
  return apiRequest<Partial<CreateStrategyDto>, Strategy>({
    path: `/strategies/${strategyId}`,
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

