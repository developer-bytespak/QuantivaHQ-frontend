/**
 * Session keys for session-anchored studies (VWAP). Every bar gets a string
 * key; consecutive bars with the same key belong to the same session and a
 * change of key resets the study. A `null` key means the bar sits outside the
 * session (US pre-market) and is skipped without resetting.
 */

export type SessionMode = "utc" | "us-equity";

/** US regular session opens 09:30 ET = 570 minutes past midnight. */
const RTH_OPEN_MINUTES = 9 * 60 + 30;

let etFormatter: Intl.DateTimeFormat | null = null;

function getEtFormatter(): Intl.DateTimeFormat {
  if (!etFormatter) {
    etFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }
  return etFormatter;
}

interface EtClock {
  /** YYYY-MM-DD in Eastern time. */
  date: string;
  /** Minutes past midnight, Eastern time. */
  minutes: number;
}

function toEt(unixSeconds: number): EtClock {
  const parts = getEtFormatter().formatToParts(new Date(unixSeconds * 1000));
  let year = "";
  let month = "";
  let day = "";
  let hour = 0;
  let minute = 0;
  for (const p of parts) {
    switch (p.type) {
      case "year":
        year = p.value;
        break;
      case "month":
        month = p.value;
        break;
      case "day":
        day = p.value;
        break;
      case "hour":
        // Some engines print midnight as "24" with hour12: false.
        hour = parseInt(p.value, 10) % 24;
        break;
      case "minute":
        minute = parseInt(p.value, 10);
        break;
    }
  }
  return { date: `${year}-${month}-${day}`, minutes: hour * 60 + minute };
}

function utcDateKey(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toISOString().slice(0, 10);
}

/**
 * Build session keys for a series of bar open times (UNIX seconds).
 *
 * - `utc`: one session per UTC calendar day, every bar included. Matches how
 *   Binance and most crypto terminals anchor VWAP.
 * - `us-equity`: one session per Eastern calendar day. A bar is excluded
 *   (null) when it ends at or before the 09:30 ET open, so thin pre-market
 *   volume does not skew the anchor. Post-market bars stay in the session.
 *   Using the bar END keeps the 09:00 hourly bar, which contains half an
 *   hour of regular trading.
 */
export function sessionKeysFor(
  times: number[],
  barSeconds: number,
  mode: SessionMode,
): Array<string | null> {
  if (mode === "utc") return times.map(utcDateKey);

  return times.map((t) => {
    const start = toEt(t);
    const end = toEt(t + barSeconds);
    const endsBeforeOpen =
      end.date === start.date && end.minutes <= RTH_OPEN_MINUTES;
    return endsBeforeOpen ? null : start.date;
  });
}
