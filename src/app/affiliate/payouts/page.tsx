"use client";

import { useEffect, useState } from "react";
import { KpiTile } from "@/components/affiliate/kpi-tile";
import { getPayoutsOverview } from "@/lib/api/affiliate";
import type { PayoutsOverview } from "@/lib/api/affiliate";

function statusClass(status: string) {
  switch (status) {
    case "COMPLETED":
      return "bg-emerald-500/20 text-emerald-300";
    case "PROCESSING":
      return "bg-amber-500/20 text-amber-300";
    case "FAILED":
      return "bg-rose-500/20 text-rose-300";
    default:
      return "bg-slate-500/20 text-slate-300";
  }
}

export default function AffiliatePayoutsPage() {
  const [data, setData] = useState<PayoutsOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getPayoutsOverview()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError((err as { message?: string })?.message ?? "Failed to load");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiTile
          label="Pending balance"
          value={data?.balance.pending_usd ?? 0}
          currency
          hint={data?.next_payout.eligible ? "Eligible for next payout" : "Below threshold"}
        />
        <KpiTile
          label="Lifetime paid"
          value={data?.balance.paid_total_usd ?? 0}
          currency
        />
        <KpiTile
          label="Clawed back"
          value={data?.balance.clawed_back_total_usd ?? 0}
          currency
          hint="Refund reversals"
        />
      </div>

      <div className="rounded-xl border border-slate-800/80 bg-gradient-to-b from-[#0b1220] to-[#070d17] p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Next payout
        </p>
        {data?.next_payout && (
          <div className="mt-2 flex flex-wrap items-baseline gap-x-6 gap-y-1 text-sm">
            <span className="text-slate-300">
              Scheduled for{" "}
              <span className="font-semibold text-white">
                {data.next_payout.scheduled_for}
              </span>
            </span>
            <span className="text-slate-500">
              Cycle: {data.next_payout.cycle}
            </span>
            <span className="text-slate-500">
              Threshold: ${data.next_payout.threshold_usd.toFixed(2)}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                data.next_payout.eligible
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "bg-slate-500/20 text-slate-300"
              }`}
            >
              {data.next_payout.eligible
                ? "Eligible"
                : "Not eligible yet"}
            </span>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-800/80 bg-gradient-to-b from-[#0b1220] to-[#070d17] p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Payout history
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800/80 text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-2 py-2 font-medium">Period</th>
                <th className="px-2 py-2 font-medium">Gross</th>
                <th className="px-2 py-2 font-medium">Net</th>
                <th className="px-2 py-2 font-medium">Status</th>
                <th className="px-2 py-2 font-medium">Paid at</th>
                <th className="px-2 py-2 font-medium">Reference</th>
              </tr>
            </thead>
            <tbody>
              {data?.history.length ? (
                data.history.map((row) => (
                  <tr
                    key={row.payout_id}
                    className="border-b border-slate-800/60 text-slate-200"
                  >
                    <td className="px-2 py-2 font-mono">{row.period}</td>
                    <td className="px-2 py-2">${row.gross_usd.toFixed(2)}</td>
                    <td className="px-2 py-2">${row.net_usd.toFixed(2)}</td>
                    <td className="px-2 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${statusClass(row.status)}`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-slate-400">
                      {row.paid_at ? new Date(row.paid_at).toISOString().slice(0, 10) : "—"}
                    </td>
                    <td className="px-2 py-2 text-slate-400">
                      {row.payment_reference ?? "—"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="py-6 text-center text-sm text-slate-500"
                  >
                    No payouts yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
