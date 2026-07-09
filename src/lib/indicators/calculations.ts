/**
 * Pure technical-indicator math. Every function takes an array of closing
 * prices and returns an array of the SAME length, with `null` for the warmup
 * region where the indicator isn't defined yet. Callers map the nulls to gaps
 * (lightweight-charts skips missing points rather than drawing to zero).
 *
 * Shared by both the crypto (CoinPriceChart) and stock (StockPriceChart)
 * charts so the two never drift apart.
 */

export type Series = Array<number | null>;

/** Simple Moving Average. out[i] = mean(close[i-period+1..i]). */
export function sma(values: number[], period: number): Series {
  const out: Series = new Array(values.length).fill(null);
  if (period <= 0) return out;
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

/**
 * Exponential Moving Average, seeded with an SMA of the first `period` values
 * (the conventional seed). out[i] = close[i]*k + out[i-1]*(1-k).
 */
export function ema(values: number[], period: number): Series {
  const out: Series = new Array(values.length).fill(null);
  if (period <= 0 || values.length < period) return out;
  const k = 2 / (period + 1);
  // Seed: SMA of the first `period` closes, placed at index period-1.
  let seed = 0;
  for (let i = 0; i < period; i++) seed += values[i];
  seed /= period;
  out[period - 1] = seed;
  let prev = seed;
  for (let i = period; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k);
    out[i] = prev;
  }
  return out;
}

/**
 * RSI using Wilder's smoothing (the standard). Bands are drawn by the chart
 * at 30/70; this only returns the line. Default period 14.
 */
export function rsi(values: number[], period = 14): Series {
  const out: Series = new Array(values.length).fill(null);
  if (values.length <= period) return out;

  let avgGain = 0;
  let avgLoss = 0;
  // First average: simple mean of the first `period` changes.
  for (let i = 1; i <= period; i++) {
    const change = values[i] - values[i - 1];
    if (change >= 0) avgGain += change;
    else avgLoss -= change;
  }
  avgGain /= period;
  avgLoss /= period;
  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  // Subsequent: Wilder's smoothing.
  for (let i = period + 1; i < values.length; i++) {
    const change = values[i] - values[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return out;
}

/** EMA that tolerates a leading run of nulls (used for the MACD signal line). */
function emaOfSeries(values: Series, period: number): Series {
  const out: Series = new Array(values.length).fill(null);
  const firstIdx = values.findIndex((v) => v !== null);
  if (firstIdx === -1) return out;
  const tail = values.slice(firstIdx).map((v) => v as number);
  const emaTail = ema(tail, period);
  for (let i = 0; i < emaTail.length; i++) out[firstIdx + i] = emaTail[i];
  return out;
}

export interface MacdResult {
  macd: Series;
  signal: Series;
  histogram: Series;
}

/**
 * MACD (12, 26, 9 by default): the MACD line is fast EMA − slow EMA, the
 * signal line is an EMA of the MACD line, and the histogram is their
 * difference.
 */
export function macd(
  values: number[],
  fast = 12,
  slow = 26,
  signalPeriod = 9,
): MacdResult {
  const emaFast = ema(values, fast);
  const emaSlow = ema(values, slow);
  const macdLine: Series = values.map((_, i) =>
    emaFast[i] !== null && emaSlow[i] !== null
      ? (emaFast[i] as number) - (emaSlow[i] as number)
      : null,
  );
  const signal = emaOfSeries(macdLine, signalPeriod);
  const histogram: Series = macdLine.map((m, i) =>
    m !== null && signal[i] !== null ? m - (signal[i] as number) : null,
  );
  return { macd: macdLine, signal, histogram };
}
