"use client";

import type { OptionsApprovalLevel } from "@/state/options-store";

/**
 * Informational banner shown on the Options page when the user's Alpaca
 * account is not yet approved for Level 3 (multi-leg) options strategies.
 *
 * Single-leg trading remains fully functional at any approved level; this
 * banner only nudges users toward upgrading so AI-generated multi-leg
 * strategies (iron condor, straddle, spreads) become placeable. When level
 * is 3+ the banner renders nothing.
 */
export function Level3GateBanner({
  level,
  className = "",
}: {
  level: OptionsApprovalLevel;
  className?: string;
}) {
  if (level >= 3) return null;

  const missing: string[] = [];
  if (level < 1) missing.push("covered calls / cash-secured puts");
  if (level < 2) missing.push("long calls and puts");
  if (level < 3) missing.push("multi-leg strategies (spreads, condors, straddles)");

  return (
    <div
      className={`flex flex-col gap-2 rounded-lg border border-sky-500/30 bg-sky-500/10 p-3 text-xs text-sky-200 md:flex-row md:items-center md:justify-between ${className}`.trim()}
    >
      <div className="flex items-start gap-2">
        <svg
          className="mt-0.5 h-4 w-4 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div>
          <div className="font-medium text-sky-100">
            Your Alpaca account is approved for Level {level} options.
          </div>
          <div className="mt-0.5 text-sky-200/80">
            Upgrade to Level 3 to unlock {missing.join(", ")}. Single-leg trading
            continues to work at your current level.
          </div>
        </div>
      </div>
      <a
        href="https://app.alpaca.markets/brokerage/settings/account"
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 rounded-md border border-sky-400/40 bg-sky-500/20 px-3 py-1.5 text-center font-medium text-sky-100 transition hover:bg-sky-500/30"
      >
        Upgrade on Alpaca →
      </a>
    </div>
  );
}
