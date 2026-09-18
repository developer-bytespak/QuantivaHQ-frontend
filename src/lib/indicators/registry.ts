/**
 * Declarative catalog of the studies offered on the price charts. The
 * ChartIndicators manager reads these to know what to draw; the toggle menu
 * reads them to know what to list. Add an indicator here and both pick it up.
 */

/** Menu section the study is listed under. */
export type IndicatorGroup = "ma" | "vwap" | "osc" | "vol";
export type IndicatorKind = "sma" | "ema" | "vwap" | "rsi" | "macd" | "atr";
/** Where the study is drawn: on the price pane, or in its own pane below. */
export type IndicatorPlacement = "overlay" | "pane";

export interface IndicatorDef {
  id: string;
  label: string;
  group: IndicatorGroup;
  kind: IndicatorKind;
  placement: IndicatorPlacement;
  /** Period for MA/RSI/ATR kinds; MACD uses fixed 12/26/9. */
  period?: number;
  /** Line colour for overlays / the primary pane line. */
  color: string;
  /** Stable ordering within a group (pane order for pane studies). */
  order: number;
  /**
   * Rough minimum candles for the study to render meaningfully. Purely
   * informational for the UI (e.g. MA200 needs a long timeframe); the math
   * itself just yields nulls when data is short.
   */
  minCandles: number;
  /**
   * Session-anchored studies (VWAP) only make sense on intraday bars. The
   * manager skips these on daily+ intervals and the menu disables the row.
   */
  intradayOnly?: boolean;
}

/** Menu sections in display order. */
export const INDICATOR_GROUPS: Array<{ id: IndicatorGroup; heading: string }> = [
  { id: "ma", heading: "Moving Averages" },
  { id: "vwap", heading: "Volume" },
  { id: "osc", heading: "Oscillators" },
  { id: "vol", heading: "Volatility" },
];

export const INDICATOR_LIST: IndicatorDef[] = [
  // ---- Moving averages (overlay the price, pane 0) ----
  { id: "sma20", label: "SMA 20", group: "ma", kind: "sma", placement: "overlay", period: 20, color: "#fbbf24", order: 1, minCandles: 20 },
  { id: "sma50", label: "SMA 50", group: "ma", kind: "sma", placement: "overlay", period: 50, color: "#f97316", order: 2, minCandles: 50 },
  { id: "sma200", label: "SMA 200", group: "ma", kind: "sma", placement: "overlay", period: 200, color: "#ef4444", order: 3, minCandles: 200 },
  { id: "ema20", label: "EMA 20", group: "ma", kind: "ema", placement: "overlay", period: 20, color: "#38bdf8", order: 4, minCandles: 20 },
  { id: "ema50", label: "EMA 50", group: "ma", kind: "ema", placement: "overlay", period: 50, color: "#818cf8", order: 5, minCandles: 50 },
  { id: "ema200", label: "EMA 200", group: "ma", kind: "ema", placement: "overlay", period: 200, color: "#a78bfa", order: 6, minCandles: 200 },

  // ---- Volume-weighted (overlay, session anchored, intraday only) ----
  { id: "vwap", label: "VWAP", group: "vwap", kind: "vwap", placement: "overlay", color: "#f472b6", order: 7, minCandles: 1, intradayOnly: true },

  // ---- Oscillators (each in its own pane below the price) ----
  { id: "rsi", label: "RSI (14)", group: "osc", kind: "rsi", placement: "pane", period: 14, color: "#c084fc", order: 1, minCandles: 15 },
  { id: "macd", label: "MACD (12, 26, 9)", group: "osc", kind: "macd", placement: "pane", color: "#38bdf8", order: 2, minCandles: 35 },

  // ---- Volatility (own pane) ----
  { id: "atr14", label: "ATR (14)", group: "vol", kind: "atr", placement: "pane", period: 14, color: "#fb923c", order: 3, minCandles: 15 },
];

export const INDICATORS: Record<string, IndicatorDef> = Object.fromEntries(
  INDICATOR_LIST.map((d) => [d.id, d]),
);

/** Default studies shown before the user customises anything. */
export const DEFAULT_INDICATORS: string[] = ["sma20", "sma50"];

/** Whether a study can be drawn on the current interval. */
export function isIndicatorAvailable(id: string, intraday: boolean): boolean {
  const def = INDICATORS[id];
  if (!def) return false;
  return !def.intradayOnly || intraday;
}
