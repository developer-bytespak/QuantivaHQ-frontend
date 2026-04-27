"use client";

import { useEffect, useState } from "react";
import { optionsService, type MarketClock } from "@/lib/api/options.service";

/**
 * US equity options trade on a fixed schedule:
 *   Regular Trading Hours: 09:30 – 16:00 ET, Mon–Fri
 *   Pre-market extension:  none for options
 *
 * Shown only for the Alpaca (stock options) venue. Crypto options on Binance
 * trade 24/7, so the page does not render this banner for that venue.
 *
 * Source of truth is `GET /options/market-clock` (proxied from Alpaca and
 * holiday-aware). The local computation below is a fallback for when the
 * API errors or no connectionId is available — it does NOT know about
 * holidays or early-close days.
 */

type SessionState = "rth" | "closed" | "weekend";

export function getUsEquityOptionsSession(now: Date = new Date()): {
  state: SessionState;
  /** Human label shown in the banner — e.g. "Market closes in 2h 14m". */
  label: string;
} {
  const et = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" }),
  );
  const day = et.getDay(); // 0=Sun, 6=Sat

  if (day === 0 || day === 6) {
    return { state: "weekend", label: "Markets closed — options trading resumes Monday 09:30 ET" };
  }

  const minutes = et.getHours() * 60 + et.getMinutes();
  const open = 9 * 60 + 30; // 09:30
  const close = 16 * 60; // 16:00

  if (minutes < open) {
    const delta = open - minutes;
    const h = Math.floor(delta / 60);
    const m = delta % 60;
    return { state: "closed", label: `Market opens in ${h}h ${m}m (09:30 ET)` };
  }
  if (minutes >= close) {
    return { state: "closed", label: "Market closed — options trading resumes 09:30 ET next business day" };
  }

  const delta = close - minutes;
  const h = Math.floor(delta / 60);
  const m = delta % 60;
  return { state: "rth", label: `Market open — closes in ${h}h ${m}m (16:00 ET)` };
}

/**
 * Formats an Alpaca clock response into the same shape the local fallback
 * produces. Uses the wall-clock delta to the next session boundary so the
 * countdown text matches the local fallback's style.
 */
function formatFromClock(clock: MarketClock): { state: SessionState; label: string } {
  const now = Date.now();
  if (clock.isOpen && clock.nextClose) {
    const deltaMin = Math.max(0, Math.floor((Date.parse(clock.nextClose) - now) / 60_000));
    const h = Math.floor(deltaMin / 60);
    const m = deltaMin % 60;
    return { state: "rth", label: `Market open — closes in ${h}h ${m}m (16:00 ET)` };
  }
  if (!clock.isOpen && clock.nextOpen) {
    const deltaMin = Math.max(0, Math.floor((Date.parse(clock.nextOpen) - now) / 60_000));
    const h = Math.floor(deltaMin / 60);
    const m = deltaMin % 60;
    // > 24h means it's a weekend or holiday — use a clearer label.
    if (deltaMin > 24 * 60) {
      const nextOpenEt = new Date(clock.nextOpen).toLocaleString("en-US", {
        timeZone: "America/New_York",
        weekday: "long",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      return { state: "closed", label: `Market closed — reopens ${nextOpenEt} ET` };
    }
    return { state: "closed", label: `Market opens in ${h}h ${m}m (09:30 ET)` };
  }
  return { state: "closed", label: "Market closed" };
}

export function MarketHoursBanner({
  connectionId,
  className = "",
}: {
  connectionId?: string | null;
  className?: string;
}) {
  const [session, setSession] = useState(() => getUsEquityOptionsSession());

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      // Try the authoritative API first; fall back to local computation
      // on any error or when no Alpaca connection is available.
      if (connectionId) {
        try {
          const clock = await optionsService.getMarketClock(connectionId);
          if (!cancelled) setSession(formatFromClock(clock));
          return;
        } catch {
          // fall through to local
        }
      }
      if (!cancelled) setSession(getUsEquityOptionsSession());
    };

    refresh();
    const id = setInterval(refresh, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [connectionId]);

  const isOpen = session.state === "rth";
  const base =
    "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium";
  const styles = isOpen
    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
    : "border-amber-500/30 bg-amber-500/10 text-amber-300";

  return (
    <div className={`${base} ${styles} ${className}`.trim()}>
      <span
        className={`h-2 w-2 rounded-full ${isOpen ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`}
      />
      <span>{session.label}</span>
    </div>
  );
}
