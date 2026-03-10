"use client";

import { useMemo, useState } from "react";
import type { OptionContract } from "@/lib/api/options.service";
import { Tooltip } from "./Tooltip";

// ── Types ────────────────────────────────────────────────────────────────────

interface OptionsChainTableProps {
  contracts: OptionContract[];
  selectedExpiry: string | null;
  onSelectContract: (contract: OptionContract) => void;
  selectedContractSymbol?: string | null;
  isLoading?: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(value: number): string {
  if (value === 0) return "—";
  if (value >= 1) return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return value.toFixed(4);
}

function formatIV(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatVolume(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

// ── Component ────────────────────────────────────────────────────────────────

export function OptionsChainTable({
  contracts,
  selectedExpiry,
  onSelectContract,
  selectedContractSymbol,
  isLoading,
}: OptionsChainTableProps) {
  const [filterType, setFilterType] = useState<"ALL" | "CALL" | "PUT">("ALL");

  // Group contracts by strike, filtered by expiry
  const { calls, puts, strikes } = useMemo(() => {
    let filtered = contracts;
    if (selectedExpiry) {
      // selectedExpiry is date-only "2026-03-09", contract.expiry may be ISO "2026-03-09T08:00:00.000Z"
      filtered = filtered.filter((c) => c.expiry?.startsWith(selectedExpiry));
    }

    const callMap = new Map<number, OptionContract>();
    const putMap = new Map<number, OptionContract>();
    const strikeSet = new Set<number>();

    for (const c of filtered) {
      strikeSet.add(c.strike);
      if (c.type === "CALL") callMap.set(c.strike, c);
      else putMap.set(c.strike, c);
    }

    const sortedStrikes = Array.from(strikeSet).sort((a, b) => a - b);
    return { calls: callMap, puts: putMap, strikes: sortedStrikes };
  }, [contracts, selectedExpiry]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#fc4f02] border-t-transparent" />
        <span className="ml-3 text-sm text-slate-400">Loading options chain…</span>
      </div>
    );
  }

  if (strikes.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-slate-500">
        No contracts available for the selected expiry.
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Type filter toggle */}
      <div className="mb-3 flex items-center gap-1">
        {(["ALL", "CALL", "PUT"] as const).map((t) => (
          <Tooltip
            key={t}
            content={
              t === "ALL"
                ? "Show both calls and puts side by side"
                : t === "CALL"
                  ? "Right to BUY the asset at the strike price. Profit when price goes up."
                  : "Right to SELL the asset at the strike price. Profit when price goes down."
            }
            position="top"
          >
            <button
              onClick={() => setFilterType(t)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filterType === t
                  ? "bg-[#fc4f02]/15 text-[#fc4f02]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              {t}
            </button>
          </Tooltip>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/[0.06] bg-white/[0.02]">
              {(filterType === "ALL" || filterType === "CALL") && (
                <>
                  <th className="px-3 py-2.5 text-left font-medium text-green-400/80">
                    <Tooltip content="Bid: Highest price a buyer is willing to pay for this call option" position="top">
                      <span>C Bid</span>
                    </Tooltip>
                  </th>
                  <th className="px-3 py-2.5 text-left font-medium text-green-400/80">
                    <Tooltip content="Ask: Lowest price a seller is asking. You pay this price when buying." position="top">
                      <span>C Ask</span>
                    </Tooltip>
                  </th>
                  <th className="px-3 py-2.5 text-left font-medium text-green-400/80">
                    <Tooltip content="Last traded price for this call contract" position="top">
                      <span>C Last</span>
                    </Tooltip>
                  </th>
                  <th className="px-3 py-2.5 text-left font-medium text-green-400/80">
                    <Tooltip content="Volume: Number of contracts traded today. Higher = more liquid." position="top">
                      <span>C Vol</span>
                    </Tooltip>
                  </th>
                  <th className="px-3 py-2.5 text-left font-medium text-green-400/80">
                    <Tooltip content="Open Interest: Total outstanding contracts. High OI = established market." position="top">
                      <span>C OI</span>
                    </Tooltip>
                  </th>
                  <th className="px-3 py-2.5 text-left font-medium text-green-400/80">
                    <Tooltip content="Implied Volatility: Market's expected price swing. High IV = expensive premiums." position="top">
                      <span>C IV</span>
                    </Tooltip>
                  </th>
                </>
              )}
              <th className="px-3 py-2.5 text-center font-semibold text-slate-200 bg-white/[0.03]">
                <Tooltip content="Strike Price: The price at which you can buy (call) or sell (put) the underlying asset at expiry." position="top">
                  <span>Strike</span>
                </Tooltip>
              </th>
              {(filterType === "ALL" || filterType === "PUT") && (
                <>
                  <th className="px-3 py-2.5 text-left font-medium text-red-400/80">
                    <Tooltip content="Bid: Highest price a buyer is willing to pay for this put option" position="top">
                      <span>P Bid</span>
                    </Tooltip>
                  </th>
                  <th className="px-3 py-2.5 text-left font-medium text-red-400/80">
                    <Tooltip content="Ask: Lowest price a seller is asking. You pay this price when buying." position="top">
                      <span>P Ask</span>
                    </Tooltip>
                  </th>
                  <th className="px-3 py-2.5 text-left font-medium text-red-400/80">
                    <Tooltip content="Last traded price for this put contract" position="top">
                      <span>P Last</span>
                    </Tooltip>
                  </th>
                  <th className="px-3 py-2.5 text-left font-medium text-red-400/80">
                    <Tooltip content="Volume: Number of contracts traded today. Higher = more liquid." position="top">
                      <span>P Vol</span>
                    </Tooltip>
                  </th>
                  <th className="px-3 py-2.5 text-left font-medium text-red-400/80">
                    <Tooltip content="Open Interest: Total outstanding contracts. High OI = established market." position="top">
                      <span>P OI</span>
                    </Tooltip>
                  </th>
                  <th className="px-3 py-2.5 text-left font-medium text-red-400/80">
                    <Tooltip content="Implied Volatility: Market's expected price swing. High IV = expensive premiums." position="top">
                      <span>P IV</span>
                    </Tooltip>
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {strikes.map((strike) => {
              const call = calls.get(strike);
              const put = puts.get(strike);
              return (
                <tr
                  key={strike}
                  className="border-b border-white/[0.03] transition-colors hover:bg-white/[0.02]"
                >
                  {(filterType === "ALL" || filterType === "CALL") && (
                    <>
                      <td
                        className={`cursor-pointer px-3 py-2 text-slate-300 hover:text-green-400 ${
                          selectedContractSymbol === call?.symbol
                            ? "bg-green-500/10"
                            : ""
                        }`}
                        onClick={() => call && onSelectContract(call)}
                      >
                        {call ? formatPrice(call.bidPrice) : "—"}
                      </td>
                      <td
                        className={`cursor-pointer px-3 py-2 text-slate-300 hover:text-green-400 ${
                          selectedContractSymbol === call?.symbol
                            ? "bg-green-500/10"
                            : ""
                        }`}
                        onClick={() => call && onSelectContract(call)}
                      >
                        {call ? formatPrice(call.askPrice) : "—"}
                      </td>
                      <td className="px-3 py-2 text-slate-400">
                        {call ? formatPrice(call.lastPrice) : "—"}
                      </td>
                      <td className="px-3 py-2 text-slate-500">
                        {call ? formatVolume(call.volume) : "—"}
                      </td>
                      <td className="px-3 py-2 text-slate-500">
                        {call ? formatVolume(call.openInterest) : "—"}
                      </td>
                      <td className="px-3 py-2 text-slate-500">
                        {call ? formatIV(call.greeks?.impliedVolatility ?? 0) : "—"}
                      </td>
                    </>
                  )}
                  <td className="px-3 py-2 text-center font-mono font-semibold text-slate-100 bg-white/[0.02]">
                    {strike.toLocaleString()}
                  </td>
                  {(filterType === "ALL" || filterType === "PUT") && (
                    <>
                      <td
                        className={`cursor-pointer px-3 py-2 text-slate-300 hover:text-red-400 ${
                          selectedContractSymbol === put?.symbol
                            ? "bg-red-500/10"
                            : ""
                        }`}
                        onClick={() => put && onSelectContract(put)}
                      >
                        {put ? formatPrice(put.bidPrice) : "—"}
                      </td>
                      <td
                        className={`cursor-pointer px-3 py-2 text-slate-300 hover:text-red-400 ${
                          selectedContractSymbol === put?.symbol
                            ? "bg-red-500/10"
                            : ""
                        }`}
                        onClick={() => put && onSelectContract(put)}
                      >
                        {put ? formatPrice(put.askPrice) : "—"}
                      </td>
                      <td className="px-3 py-2 text-slate-400">
                        {put ? formatPrice(put.lastPrice) : "—"}
                      </td>
                      <td className="px-3 py-2 text-slate-500">
                        {put ? formatVolume(put.volume) : "—"}
                      </td>
                      <td className="px-3 py-2 text-slate-500">
                        {put ? formatVolume(put.openInterest) : "—"}
                      </td>
                      <td className="px-3 py-2 text-slate-500">
                        {put ? formatIV(put.greeks?.impliedVolatility ?? 0) : "—"}
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
