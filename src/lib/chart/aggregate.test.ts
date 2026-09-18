import { describe, expect, it } from "vitest";
import { aggregateCandlesByUtcYear } from "./aggregate";

const monthly = (y: number, m: number, o: number, h: number, l: number, c: number, v: number) => {
  const openTime = Date.UTC(y, m - 1, 1);
  return { openTime, open: o, high: h, low: l, close: c, volume: v, closeTime: Date.UTC(y, m, 1) - 1 };
};

describe("aggregateCandlesByUtcYear", () => {
  it("rolls monthly candles into one candle per UTC year", () => {
    const input = [
      monthly(2024, 11, 10, 15, 9, 12, 100),
      monthly(2024, 12, 12, 20, 11, 18, 150),
      monthly(2025, 1, 18, 19, 5, 8, 200),
    ];
    const out = aggregateCandlesByUtcYear(input);
    expect(out).toHaveLength(2);

    expect(out[0].openTime).toBe(Date.UTC(2024, 0, 1));
    expect(out[0].open).toBe(10);
    expect(out[0].high).toBe(20);
    expect(out[0].low).toBe(9);
    expect(out[0].close).toBe(18);
    expect(out[0].volume).toBe(250);
    expect(out[0].closeTime).toBe(input[1].closeTime);

    expect(out[1].openTime).toBe(Date.UTC(2025, 0, 1));
    expect(out[1].open).toBe(18);
    expect(out[1].high).toBe(19);
    expect(out[1].low).toBe(5);
    expect(out[1].close).toBe(8);
    expect(out[1].volume).toBe(200);
  });

  it("returns an empty array for empty input", () => {
    expect(aggregateCandlesByUtcYear([])).toEqual([]);
  });
});
