/**
 * Client-side candle roll-ups for intervals a data source does not offer
 * natively (Binance has no yearly klines).
 */

export interface RollupCandle {
  /** Bar open time in UNIX milliseconds. */
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;
}

/**
 * Roll monthly (or finer) candles up into one candle per UTC calendar year.
 * Input must be sorted ascending. The current, partial year is kept, which
 * mirrors how Binance itself returns a partial current month.
 */
export function aggregateCandlesByUtcYear<T extends RollupCandle>(candles: T[]): T[] {
  const out: T[] = [];
  let current: T | null = null;
  let currentYear = -1;

  for (const c of candles) {
    const year = new Date(c.openTime).getUTCFullYear();
    if (current === null || year !== currentYear) {
      if (current) out.push(current);
      current = { ...c, openTime: Date.UTC(year, 0, 1) };
      currentYear = year;
      continue;
    }
    current = {
      ...current,
      high: Math.max(current.high, c.high),
      low: Math.min(current.low, c.low),
      close: c.close,
      volume: current.volume + c.volume,
      closeTime: c.closeTime,
    };
  }
  if (current) out.push(current);
  return out;
}
