import { describe, expect, it } from "vitest";
import { atr, ema, macd, rsi, sma, vwap } from "./calculations";

const bar = (high: number, low: number, close: number, volume = 100, extra?: { vwap?: number }) => ({
  high,
  low,
  close,
  volume,
  ...extra,
});

describe("sma / ema / rsi / macd (regression smoke tests)", () => {
  it("sma averages the trailing window and pads the warm-up with nulls", () => {
    expect(sma([1, 2, 3, 4], 2)).toEqual([null, 1.5, 2.5, 3.5]);
  });

  it("ema seeds with an SMA then smooths", () => {
    const out = ema([1, 2, 3, 4], 2);
    expect(out[0]).toBeNull();
    expect(out[1]).toBeCloseTo(1.5);
    expect(out[2]).toBeCloseTo(2.5);
    expect(out[3]).toBeCloseTo(3.5);
  });

  it("rsi is 100 for a series that only rises", () => {
    const closes = Array.from({ length: 20 }, (_, i) => i + 1);
    const out = rsi(closes, 14);
    expect(out.slice(0, 14).every((v) => v === null)).toBe(true);
    expect(out.slice(14).every((v) => v === 100)).toBe(true);
  });

  it("macd returns same-length series with the conventional warm-up", () => {
    const closes = Array.from({ length: 60 }, (_, i) => 100 + Math.sin(i / 3) * 5);
    const { macd: line, signal, histogram } = macd(closes);
    expect(line).toHaveLength(60);
    expect(signal).toHaveLength(60);
    expect(histogram).toHaveLength(60);
    expect(line.findIndex((v) => v !== null)).toBe(25);
    expect(signal.findIndex((v) => v !== null)).toBe(33);
  });
});

describe("atr", () => {
  it("returns all nulls when there are fewer bars than the period", () => {
    const bars = [bar(10, 9, 9.5), bar(11, 10, 10.5)];
    expect(atr(bars, 14)).toEqual([null, null]);
  });

  it("equals the bar range when every bar has the same range and no gaps", () => {
    const bars = Array.from({ length: 20 }, () => bar(101, 99, 100));
    const out = atr(bars, 14);
    expect(out.slice(0, 13).every((v) => v === null)).toBe(true);
    for (const v of out.slice(13)) expect(v).toBeCloseTo(2);
  });

  it("applies Wilder smoothing after the SMA seed", () => {
    // TR: 2, 2, 3 -> seed (2+2)/2 = 2, then (2*1 + 3)/2 = 2.5
    const bars = [bar(10, 8, 9), bar(11, 9, 10), bar(12, 9, 11)];
    const out = atr(bars, 2);
    expect(out[0]).toBeNull();
    expect(out[1]).toBeCloseTo(2);
    expect(out[2]).toBeCloseTo(2.5);
  });

  it("includes gaps from the previous close in the true range", () => {
    const bars = [bar(10, 9, 10), bar(20, 19, 20)];
    const out = atr(bars, 1);
    expect(out[0]).toBeCloseTo(1);
    expect(out[1]).toBeCloseTo(10);
  });
});

describe("vwap", () => {
  it("accumulates typical price weighted by volume inside one session", () => {
    const bars = [bar(12, 8, 10), bar(22, 18, 20)];
    const out = vwap(bars, ["a", "a"]);
    expect(out[0]).toBeCloseTo(10);
    expect(out[1]).toBeCloseTo(15);
  });

  it("resets when the session key changes", () => {
    const bars = [bar(12, 8, 10), bar(22, 18, 20)];
    const out = vwap(bars, ["a", "b"]);
    expect(out[0]).toBeCloseTo(10);
    expect(out[1]).toBeCloseTo(20);
  });

  it("skips null-key bars without resetting the session", () => {
    const bars = [bar(12, 8, 10), bar(102, 98, 100), bar(32, 28, 30)];
    const out = vwap(bars, ["a", null, "a"]);
    expect(out[0]).toBeCloseTo(10);
    expect(out[1]).toBeNull();
    expect(out[2]).toBeCloseTo(20);
  });

  it("prefers a source-provided per-bar vwap over the typical price", () => {
    const bars = [bar(12, 8, 10, 100, { vwap: 50 })];
    expect(vwap(bars, ["a"])[0]).toBeCloseTo(50);
  });

  it("yields null while cumulative volume is zero", () => {
    const bars = [bar(12, 8, 10, 0), bar(12, 8, 10, 100)];
    const out = vwap(bars, ["a", "a"]);
    expect(out[0]).toBeNull();
    expect(out[1]).toBeCloseTo(10);
  });
});
