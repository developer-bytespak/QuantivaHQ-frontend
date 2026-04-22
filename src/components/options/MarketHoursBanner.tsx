"use client";

import { useEffect, useState } from "react";

/**
 * US equity options trade on a fixed schedule:
 *   Regular Trading Hours: 09:30 – 16:00 ET, Mon–Fri
 *   Pre-market extension:  none for options
 *
 * Shown only for the Alpaca (stock options) venue. Crypto options on Binance
 * trade 24/7, so the page does not render this banner for that venue.
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

export function MarketHoursBanner({ className = "" }: { className?: string }) {
  const [session, setSession] = useState(() => getUsEquityOptionsSession());

  useEffect(() => {
    const id = setInterval(() => setSession(getUsEquityOptionsSession()), 30_000);
    return () => clearInterval(id);
  }, []);

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
