"use client";

import { useEffect, useState } from "react";
import { KpiTile } from "@/components/affiliate/kpi-tile";
import { ReferralCodeCard } from "@/components/affiliate/referral-code-card";
import { PerformanceChart } from "@/components/affiliate/performance-chart";
import { AccountProvisionedBanner } from "@/components/affiliate/account-provisioned-banner";
import {
  getDashboardSummary,
  getPerformance,
  getReferrals,
  getReferralAssets,
} from "@/lib/api/affiliate";
import type {
  DashboardSummary,
  PerformanceSeries,
  ReferralAssets,
  ReferralsPage,
} from "@/lib/api/affiliate";

const RANGES = [
  { label: "30D", value: 30 as const },
  { label: "90D", value: 90 as const },
  { label: "1Y", value: 365 as const },
];

export default function AffiliateDashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [range, setRange] = useState<30 | 90 | 365>(30);
  const [perf, setPerf] = useState<PerformanceSeries | null>(null);
  const [referrals, setReferrals] = useState<ReferralsPage | null>(null);
  const [assets, setAssets] = useState<ReferralAssets | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      getDashboardSummary(),
      getPerformance(range),
      getReferrals(1, 10),
      getReferralAssets(),
    ])
      .then(([s, p, r, a]) => {
        if (cancelled) return;
        setSummary(s);
        setPerf(p);
        setReferrals(r);
        setAssets(a);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError((err as { message?: string })?.message ?? "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [range]);

  const signupsDelta =
    summary?.current_month?.signups != null &&
    summary?.previous_month?.signups != null
      ? summary.current_month.signups - summary.previous_month.signups
      : undefined;
  const earningsDelta =
    summary?.current_month?.earnings_usd != null &&
    summary?.previous_month?.earnings_usd != null
      ? summary.current_month.earnings_usd -
        summary.previous_month.earnings_usd
      : undefined;

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">
          {error}
        </div>
      )}

      <AccountProvisionedBanner />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile
          label="Signups (this month)"
          value={summary?.current_month?.signups ?? 0}
          subValue={summary?.previous_month?.signups ?? 0}
          delta={signupsDelta}
          hint="vs last month"
        />
        <KpiTile
          label="Active subscribers"
          value={summary?.totals?.active_subscribers ?? 0}
          hint="Paying users you referred"
        />
        <KpiTile
          label="Earnings (this month)"
          value={summary?.current_month?.earnings_usd ?? 0}
          subValue={summary?.previous_month?.earnings_usd ?? 0}
          delta={earningsDelta}
          currency
          hint="vs last month"
        />
        <KpiTile
          label="Pending payout"
          value={summary?.totals?.pending_balance_usd ?? 0}
          hint="Eligible at next payout cycle"
          currency
        />
      </div>

      <ReferralCodeCard
        code={assets?.referral_code ?? null}
        link={assets?.referral_link ?? null}
      />

      <div className="rounded-xl border border-slate-800/80 bg-gradient-to-b from-[#0b1220] to-[#070d17] p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Performance
            </p>
            <p className="text-sm text-slate-500">
              Daily signups and earnings
            </p>
          </div>
          <div className="flex gap-1 rounded-lg border border-slate-700 p-1">
            {RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                  range === r.value
                    ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="flex h-72 items-center justify-center text-sm text-slate-500">
            Loading…
          </div>
        ) : (
          <PerformanceChart data={perf?.series ?? []} />
        )}
      </div>

      <div className="rounded-xl border border-slate-800/80 bg-gradient-to-b from-[#0b1220] to-[#070d17] p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Recent referrals
          </p>
          <span className="text-xs text-slate-500">
            {referrals?.total ?? 0} total
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800/80 text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-2 py-2 font-medium">User</th>
                <th className="px-2 py-2 font-medium">Signed up</th>
                <th className="px-2 py-2 font-medium">Tier</th>
                <th className="px-2 py-2 font-medium">Lifetime earnings</th>
                <th className="px-2 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {referrals?.items.length ? (
                referrals.items.map((row) => (
                  <tr
                    key={row.user_id_hash}
                    className="border-b border-slate-800/60 text-slate-200"
                  >
                    <td className="px-2 py-2 font-mono text-xs text-slate-400">
                      …{row.user_id_hash}
                    </td>
                    <td className="px-2 py-2">{row.signup_date}</td>
                    <td className="px-2 py-2">
                      <span className="rounded-full bg-slate-700/40 px-2 py-0.5 text-xs">
                        {row.current_tier}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      ${row.lifetime_commissions_usd.toFixed(2)}
                    </td>
                    <td className="px-2 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          row.status === "Active"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-slate-500/20 text-slate-400"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="py-6 text-center text-sm text-slate-500"
                  >
                    No referred users yet. Share your link to start earning.
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
