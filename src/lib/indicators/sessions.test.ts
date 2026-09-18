import { describe, expect, it } from "vitest";
import { sessionKeysFor } from "./sessions";

const utc = (y: number, m: number, d: number, hh: number, mm = 0) =>
  Date.UTC(y, m - 1, d, hh, mm) / 1000;

const MIN = 60;
const HOUR = 3600;

describe("sessionKeysFor: utc", () => {
  it("keys bars by UTC calendar day and includes every bar", () => {
    const times = [utc(2026, 3, 2, 23, 59), utc(2026, 3, 3, 0, 0), utc(2026, 3, 3, 12, 0)];
    expect(sessionKeysFor(times, MIN, "utc")).toEqual([
      "2026-03-02",
      "2026-03-03",
      "2026-03-03",
    ]);
  });
});

describe("sessionKeysFor: us-equity", () => {
  // 2026-03-02 is in EST (UTC-5): 09:30 ET = 14:30 UTC.
  it("excludes a 1m bar that ends at the 09:30 open and includes the next one", () => {
    const times = [utc(2026, 3, 2, 14, 29), utc(2026, 3, 2, 14, 30)];
    expect(sessionKeysFor(times, MIN, "us-equity")).toEqual([null, "2026-03-02"]);
  });

  it("keeps the 09:00 hourly bar because it ends inside regular hours", () => {
    const times = [utc(2026, 3, 2, 13, 0), utc(2026, 3, 2, 14, 0)];
    expect(sessionKeysFor(times, HOUR, "us-equity")).toEqual([null, "2026-03-02"]);
  });

  it("keeps post-market bars in the same session", () => {
    const times = [utc(2026, 3, 2, 20, 0), utc(2026, 3, 2, 21, 30)];
    expect(sessionKeysFor(times, MIN, "us-equity")).toEqual(["2026-03-02", "2026-03-02"]);
  });

  it("keeps a bar that spans midnight even though it ends before the open", () => {
    // 4h bar starting 20:00 ET on 03-02 (01:00 UTC 03-03) ends 00:00 ET 03-03.
    const times = [utc(2026, 3, 3, 1, 0)];
    expect(sessionKeysFor(times, 4 * HOUR, "us-equity")).toEqual(["2026-03-02"]);
  });

  // 2026-07-06 is in EDT (UTC-4): 09:30 ET = 13:30 UTC.
  it("respects daylight saving time", () => {
    const times = [utc(2026, 7, 6, 13, 29), utc(2026, 7, 6, 13, 30)];
    expect(sessionKeysFor(times, MIN, "us-equity")).toEqual([null, "2026-07-06"]);
  });

  it("starts a new session on the next Eastern calendar day", () => {
    const times = [utc(2026, 3, 2, 15, 0), utc(2026, 3, 3, 15, 0)];
    expect(sessionKeysFor(times, MIN, "us-equity")).toEqual(["2026-03-02", "2026-03-03"]);
  });
});
