/**
 * Candle intervals offered on the market detail charts. One declarative list
 * drives the picker, the crypto chart (Binance interval strings) and the stock
 * chart (Alpaca timeframe strings), so the three can never disagree.
 */

export type ChartIntervalId =
  | "1m"
  | "3m"
  | "5m"
  | "15m"
  | "1h"
  | "4h"
  | "1D"
  | "1W"
  | "1M"
  | "1Y";

export interface ChartInterval {
  id: ChartIntervalId;
  /** Button text. */
  label: string;
  /** Binance klines interval. */
  binance: string;
  /** Alpaca Market Data bars timeframe. */
  alpaca: string;
  /** Nominal bar width in seconds (used for session math on intraday bars). */
  seconds: number;
  /** Intraday bars support session-anchored studies such as VWAP. */
  isIntraday: boolean;
  /**
   * Binance has no yearly interval, so 1Y fetches monthly candles and rolls
   * them up client-side. Alpaca supports 12Month natively.
   */
  aggregate?: "year";
}

const MIN = 60;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export const CHART_INTERVALS: ChartInterval[] = [
  { id: "1m", label: "1m", binance: "1m", alpaca: "1Min", seconds: MIN, isIntraday: true },
  { id: "3m", label: "3m", binance: "3m", alpaca: "3Min", seconds: 3 * MIN, isIntraday: true },
  { id: "5m", label: "5m", binance: "5m", alpaca: "5Min", seconds: 5 * MIN, isIntraday: true },
  { id: "15m", label: "15m", binance: "15m", alpaca: "15Min", seconds: 15 * MIN, isIntraday: true },
  { id: "1h", label: "1h", binance: "1h", alpaca: "1Hour", seconds: HOUR, isIntraday: true },
  { id: "4h", label: "4h", binance: "4h", alpaca: "4Hour", seconds: 4 * HOUR, isIntraday: true },
  { id: "1D", label: "1D", binance: "1d", alpaca: "1Day", seconds: DAY, isIntraday: false },
  { id: "1W", label: "1W", binance: "1w", alpaca: "1Week", seconds: 7 * DAY, isIntraday: false },
  { id: "1M", label: "1M", binance: "1M", alpaca: "1Month", seconds: 30 * DAY, isIntraday: false },
  { id: "1Y", label: "1Y", binance: "1M", alpaca: "12Month", seconds: 365 * DAY, isIntraday: false, aggregate: "year" },
];

export const CHART_INTERVAL_MAP: Record<ChartIntervalId, ChartInterval> = Object.fromEntries(
  CHART_INTERVALS.map((d) => [d.id, d]),
) as Record<ChartIntervalId, ChartInterval>;

export const DEFAULT_CHART_INTERVAL: ChartIntervalId = "1D";

/**
 * Candles fetched per interval. 300 gives the 200-period moving averages
 * enough warm-up while staying well inside Binance's 1000 cap and a single
 * Alpaca page.
 */
export const CHART_CANDLE_LIMIT = 300;

export function isChartIntervalId(value: unknown): value is ChartIntervalId {
  return typeof value === "string" && value in CHART_INTERVAL_MAP;
}
