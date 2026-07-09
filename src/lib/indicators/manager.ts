/**
 * ChartIndicators — attaches technical studies to a lightweight-charts v5
 * chart and keeps them in sync with a user-selected set. Overlays (SMA/EMA)
 * live on the main price pane; oscillators (RSI/MACD) each get their own pane
 * stacked below.
 *
 * Lifecycle from a chart component:
 *   const ind = new ChartIndicators(chart);
 *   ind.setCandles(candles);         // whenever new data arrives
 *   ind.apply(activeIds);            // whenever data OR the active set changes
 *   // chart.remove() on unmount tears the series down with the chart.
 *
 * apply() is cheap to call repeatedly: it only rebuilds structure when the set
 * of series actually changes, otherwise it just re-pushes data.
 */

import {
  IChartApi,
  ISeriesApi,
  LineSeries,
  HistogramSeries,
  LineData,
  HistogramData,
  IPriceLine,
} from "lightweight-charts";
import { sma, ema, rsi, macd, Series } from "./calculations";
import { INDICATORS, IndicatorDef } from "./registry";

export interface IndicatorCandle {
  /** UNIX seconds, as lightweight-charts expects. */
  time: number;
  close: number;
}

const BAND_COLOR = "#64748b";
const MACD_LINE_COLOR = "#38bdf8";
const MACD_SIGNAL_COLOR = "#f97316";
const UP_FILL = "#22c55e80";
const DOWN_FILL = "#ef444480";

export class ChartIndicators {
  private chart: IChartApi;
  private candles: IndicatorCandle[] = [];

  /** Overlay series on pane 0, keyed by indicator id. */
  private overlays = new Map<string, ISeriesApi<"Line">>();
  /** Oscillator series (may be several per indicator), keyed by indicator id. */
  private oscillators = new Map<string, ISeriesApi<"Line" | "Histogram">[]>();
  /** Price lines (RSI 30/70 bands) so we can clean them up. */
  private priceLines: IPriceLine[] = [];
  /** Active oscillator ids in current pane order — used to detect changes. */
  private oscOrder: string[] = [];

  constructor(chart: IChartApi) {
    this.chart = chart;
  }

  setCandles(candles: IndicatorCandle[]) {
    this.candles = candles;
  }

  /** Reconcile the drawn studies with `activeIds`, then push data. */
  apply(activeIds: string[]) {
    const defs = activeIds
      .map((id) => INDICATORS[id])
      .filter((d): d is IndicatorDef => Boolean(d));

    const overlays = defs
      .filter((d) => d.group === "ma")
      .sort((a, b) => a.order - b.order);
    const oscillators = defs
      .filter((d) => d.group === "osc")
      .sort((a, b) => a.order - b.order);

    this.reconcileOverlays(overlays);
    this.reconcileOscillators(oscillators);
    this.refresh();
  }

  // --- overlays: add/remove individually on pane 0 ---
  private reconcileOverlays(defs: IndicatorDef[]) {
    const wanted = new Set(defs.map((d) => d.id));

    for (const id of [...this.overlays.keys()]) {
      if (!wanted.has(id)) {
        this.chart.removeSeries(this.overlays.get(id)!);
        this.overlays.delete(id);
      }
    }

    for (const d of defs) {
      if (this.overlays.has(d.id)) continue;
      const series = this.chart.addSeries(LineSeries, {
        color: d.color,
        lineWidth: 2,
        title: d.label,
        priceScaleId: "right",
        priceLineVisible: false,
        lastValueVisible: false,
      });
      this.overlays.set(d.id, series as ISeriesApi<"Line">);
    }
  }

  // --- oscillators: rebuild wholesale when the ordered set changes, so pane
  //     indices stay gap-free (RSI above MACD, no empty panes) ---
  private reconcileOscillators(defs: IndicatorDef[]) {
    const nextOrder = defs.map((d) => d.id);
    if (nextOrder.join(",") === this.oscOrder.join(",")) return;

    // Tear down existing oscillator series. Their price-line bands are owned
    // by the series and get dropped along with them.
    for (const series of this.oscillators.values()) {
      for (const s of series) this.chart.removeSeries(s);
    }
    this.oscillators.clear();
    this.priceLines = [];

    // Rebuild with consecutive pane indices starting at 1.
    let pane = 1;
    for (const d of defs) {
      this.oscillators.set(d.id, this.buildOscillator(d, pane));
      pane += 1;
    }
    this.oscOrder = nextOrder;

    // Drop any panes left over from a previous, larger configuration.
    this.trimPanes(1 + defs.length);
  }

  private buildOscillator(
    d: IndicatorDef,
    pane: number,
  ): ISeriesApi<"Line" | "Histogram">[] {
    if (d.kind === "rsi") {
      const line = this.chart.addSeries(
        LineSeries,
        {
          color: d.color,
          lineWidth: 2,
          title: d.label,
          priceScaleId: "right",
          lastValueVisible: false,
          priceLineVisible: false,
        },
        pane,
      ) as ISeriesApi<"Line">;
      for (const level of [70, 30]) {
        this.priceLines.push(
          line.createPriceLine({
            price: level,
            color: BAND_COLOR,
            lineWidth: 1,
            lineStyle: 2,
            axisLabelVisible: true,
            title: String(level),
          }),
        );
      }
      return [line];
    }

    // MACD: histogram behind, MACD + signal lines in front.
    const histogram = this.chart.addSeries(
      HistogramSeries,
      { priceScaleId: "right", lastValueVisible: false, priceLineVisible: false },
      pane,
    ) as ISeriesApi<"Histogram">;
    const macdLine = this.chart.addSeries(
      LineSeries,
      {
        color: MACD_LINE_COLOR,
        lineWidth: 2,
        title: "MACD",
        priceScaleId: "right",
        lastValueVisible: false,
        priceLineVisible: false,
      },
      pane,
    ) as ISeriesApi<"Line">;
    const signalLine = this.chart.addSeries(
      LineSeries,
      {
        color: MACD_SIGNAL_COLOR,
        lineWidth: 2,
        title: "Signal",
        priceScaleId: "right",
        lastValueVisible: false,
        priceLineVisible: false,
      },
      pane,
    ) as ISeriesApi<"Line">;
    return [histogram, macdLine, signalLine];
  }

  private trimPanes(desiredCount: number) {
    const panes = this.chart.panes();
    for (let i = panes.length - 1; i >= desiredCount; i--) {
      try {
        this.chart.removePane(i);
      } catch {
        /* pane already gone */
      }
    }
  }

  /** Recompute every active study from the current candles and push it. */
  private refresh() {
    if (this.candles.length === 0) return;
    const closes = this.candles.map((c) => c.close);
    const times = this.candles.map((c) => c.time);

    const toLine = (vals: Series): LineData[] => {
      const out: LineData[] = [];
      for (let i = 0; i < vals.length; i++) {
        if (vals[i] !== null) {
          out.push({ time: times[i] as LineData["time"], value: vals[i] as number });
        }
      }
      return out;
    };

    for (const [id, series] of this.overlays) {
      const d = INDICATORS[id];
      const vals = d.kind === "ema" ? ema(closes, d.period!) : sma(closes, d.period!);
      series.setData(toLine(vals));
    }

    for (const [id, series] of this.oscillators) {
      const d = INDICATORS[id];
      if (d.kind === "rsi") {
        (series[0] as ISeriesApi<"Line">).setData(toLine(rsi(closes, d.period ?? 14)));
      } else if (d.kind === "macd") {
        const result = macd(closes);
        const [histogram, macdLine, signalLine] = series as [
          ISeriesApi<"Histogram">,
          ISeriesApi<"Line">,
          ISeriesApi<"Line">,
        ];
        const hist: HistogramData[] = [];
        for (let i = 0; i < result.histogram.length; i++) {
          const v = result.histogram[i];
          if (v !== null) {
            hist.push({
              time: times[i] as HistogramData["time"],
              value: v,
              color: v >= 0 ? UP_FILL : DOWN_FILL,
            });
          }
        }
        histogram.setData(hist);
        macdLine.setData(toLine(result.macd));
        signalLine.setData(toLine(result.signal));
      }
    }
  }

  /** Clear internal references. The chart's own remove() drops the series. */
  dispose() {
    this.overlays.clear();
    this.oscillators.clear();
    this.priceLines = [];
    this.oscOrder = [];
    this.candles = [];
  }
}
