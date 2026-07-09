import { INDICATORS } from "./registry";

export const BASE_CHART_HEIGHT = 400;
export const OSCILLATOR_PANE_HEIGHT = 150;

/**
 * Total chart height for a given active study set. Each active oscillator
 * (RSI/MACD) renders in its own pane below the price, so we grow the chart to
 * keep the price pane readable instead of letting the panes crush it.
 */
export function chartHeightFor(activeIds: string[]): number {
  const oscillators = activeIds.filter(
    (id) => INDICATORS[id]?.group === "osc",
  ).length;
  return BASE_CHART_HEIGHT + oscillators * OSCILLATOR_PANE_HEIGHT;
}
