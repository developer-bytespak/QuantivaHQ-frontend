import { INDICATORS, isIndicatorAvailable } from "./registry";

export const BASE_CHART_HEIGHT = 400;
export const OSCILLATOR_PANE_HEIGHT = 150;

/**
 * Total chart height for a given active study set. Each active pane study
 * (RSI/MACD/ATR) renders in its own pane below the price, so we grow the
 * chart to keep the price pane readable instead of letting the panes crush it.
 * Studies unavailable on the current interval (VWAP on daily bars) are not
 * drawn and so take no space.
 */
export function chartHeightFor(activeIds: string[], intraday = true): number {
  const panes = activeIds.filter(
    (id) => INDICATORS[id]?.placement === "pane" && isIndicatorAvailable(id, intraday),
  ).length;
  return BASE_CHART_HEIGHT + panes * OSCILLATOR_PANE_HEIGHT;
}
