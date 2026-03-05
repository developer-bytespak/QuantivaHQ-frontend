/**
 * Dummy data for VC Pool strategies and pool performance.
 * Used until real trade/performance APIs are connected.
 */

export interface VcPoolStrategyDummy {
  id: string;
  name: string;
  type: string;
  risk_level: "low" | "medium" | "high";
  description: string;
  timeframe: string;
  target_assets: string[];
  /** Pool IDs that use this strategy */
  pool_ids: string[];
}

export interface PoolPerformancePoint {
  time: string; // YYYY-MM-DD for lightweight-charts
  value: number;
}

/** Dummy strategies shown on VC Pool page */
export const VC_POOL_STRATEGIES_DUMMY: VcPoolStrategyDummy[] = [
  {
    id: "strat-1",
    name: "Trend Following (BTC/ETH)",
    type: "Momentum",
    risk_level: "medium",
    description: "Follows 20/50 EMA crossovers on BTC and ETH with strict stop-loss. Best for medium-term swings.",
    timeframe: "4H / 1D",
    target_assets: ["BTC", "ETH"],
    pool_ids: [],
  },
  {
    id: "strat-2",
    name: "Conservative DCA",
    type: "DCA",
    risk_level: "low",
    description: "Weekly fixed amount into top 5 caps. Low volatility, steady growth over 90 days.",
    timeframe: "1W",
    target_assets: ["BTC", "ETH", "SOL", "BNB", "XRP"],
    pool_ids: [],
  },
  {
    id: "strat-3",
    name: "Aggressive Scalping",
    type: "Scalping",
    risk_level: "high",
    description: "Short-term entries on 15m/1h with tight TP/SL. Higher risk, higher potential returns.",
    timeframe: "15m / 1H",
    target_assets: ["BTC", "ETH", "SOL", "DOGE"],
    pool_ids: [],
  },
];

/**
 * Generate dummy performance series (equity curve) for a pool.
 * Starts at 100 (base) and trends up with small variance over ~30 days so the graph clearly goes up.
 */
function generateDummyPerformanceSeries(
  poolId: string,
  _seed: number = 0
): PoolPerformancePoint[] {
  const points: PoolPerformancePoint[] = [];
  const base = 100;
  let value = base;
  const now = new Date();
  // Slight upward bias so chart clearly shows "faida" / growth
  const seed = poolId.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 100;
  const dailyDrift = 0.15 + (seed % 20) / 100;
  for (let i = 30; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayStr = d.toISOString().slice(0, 10);
    const noise = ((seed + i * 7) % 40) / 100 - 0.2;
    value = value * (1 + (dailyDrift + noise) / 100);
    points.push({ time: dayStr, value: Math.round(value * 100) / 100 });
  }
  return points;
}

/** Cache per-pool dummy series so charts stay consistent */
const performanceCache: Record<string, PoolPerformancePoint[]> = {};

/**
 * Get dummy performance time-series for a pool (for chart).
 * Same pool_id always returns same series.
 */
export function getDummyPoolPerformance(poolId: string): PoolPerformancePoint[] {
  if (!performanceCache[poolId]) {
    performanceCache[poolId] = generateDummyPerformanceSeries(poolId);
  }
  return performanceCache[poolId];
}

/**
 * Get summary stats from dummy performance (for display on cards).
 */
export function getDummyPoolPerformanceSummary(poolId: string): {
  startValue: number;
  currentValue: number;
  changePercent: number;
  trend: "up" | "down" | "flat";
} {
  const series = getDummyPoolPerformance(poolId);
  if (series.length < 2) {
    return { startValue: 100, currentValue: 100, changePercent: 0, trend: "flat" };
  }
  const startValue = series[0].value;
  const currentValue = series[series.length - 1].value;
  const changePercent = ((currentValue - startValue) / startValue) * 100;
  let trend: "up" | "down" | "flat" = "flat";
  if (changePercent > 1) trend = "up";
  else if (changePercent < -1) trend = "down";
  return { startValue, currentValue, changePercent, trend };
}
