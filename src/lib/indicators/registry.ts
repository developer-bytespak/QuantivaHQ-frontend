/**
 * Declarative catalog of the studies offered on the price charts. The
 * ChartIndicators manager reads these to know what to draw; the toggle menu
 * reads them to know what to list. Add an indicator here and both pick it up.
 */

export type IndicatorGroup = "ma" | "osc";
export type IndicatorKind = "sma" | "ema" | "rsi" | "macd";

export interface IndicatorDef {
  id: string;
  label: string;
  group: IndicatorGroup;
  kind: IndicatorKind;
  /** Period for MA/RSI kinds; MACD uses fixed 12/26/9. */
  period?: number;
  /** Line colour for overlays / the primary oscillator line. */
  color: string;
  /** Stable ordering within a group (pane order for oscillators). */
  order: number;
  /**
   * Rough minimum candles for the study to render meaningfully. Purely
   * informational for the UI (e.g. MA200 needs a long timeframe); the math
   * itself just yields nulls when data is short.
   */
  minCandles: number;
}

export const INDICATOR_LIST: IndicatorDef[] = [
  // ---- Moving averages (overlay the price, pane 0) ----
  { id: "sma20", label: "SMA 20", group: "ma", kind: "sma", period: 20, color: "#fbbf24", order: 1, minCandles: 20 },
  { id: "sma50", label: "SMA 50", group: "ma", kind: "sma", period: 50, color: "#f97316", order: 2, minCandles: 50 },
  { id: "sma200", label: "SMA 200", group: "ma", kind: "sma", period: 200, color: "#ef4444", order: 3, minCandles: 200 },
  { id: "ema20", label: "EMA 20", group: "ma", kind: "ema", period: 20, color: "#38bdf8", order: 4, minCandles: 20 },
  { id: "ema50", label: "EMA 50", group: "ma", kind: "ema", period: 50, color: "#818cf8", order: 5, minCandles: 50 },
  { id: "ema200", label: "EMA 200", group: "ma", kind: "ema", period: 200, color: "#a78bfa", order: 6, minCandles: 200 },

  // ---- Oscillators (each in its own pane below the price) ----
  { id: "rsi", label: "RSI (14)", group: "osc", kind: "rsi", period: 14, color: "#c084fc", order: 1, minCandles: 15 },
  { id: "macd", label: "MACD (12, 26, 9)", group: "osc", kind: "macd", color: "#38bdf8", order: 2, minCandles: 35 },
];

export const INDICATORS: Record<string, IndicatorDef> = Object.fromEntries(
  INDICATOR_LIST.map((d) => [d.id, d]),
);

/** Default studies shown before the user customises anything. */
export const DEFAULT_INDICATORS: string[] = ["sma20", "sma50"];
