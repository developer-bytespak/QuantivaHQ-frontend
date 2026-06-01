"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getCohorts, getEarnings, getFunnel } from "@/lib/api/affiliate";
import type {
  CohortsResponse,
  EarningsResponse,
  FunnelResponse,
} from "@/lib/api/affiliate";

export default function AffiliateAnalyticsPage() {
  const [funnel, setFunnel] = useState<FunnelResponse | null>(null);
  const [earnings, setEarnings] = useState<EarningsResponse | null>(null);
  const [cohorts, setCohorts] = useState<CohortsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getFunnel(), getEarnings(), getCohorts()])
      .then(([f, e, c]) => {
        if (cancelled) return;
        setFunnel(f);
        setEarnings(e);
        setCohorts(c);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
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

      {/* Funnel */}
      <div className="rounded-xl border border-slate-800/80 bg-gradient-to-b from-[#0b1220] to-[#070d17] p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Conversion funnel
        </p>
        <p className="text-sm text-slate-500">
          Signup → First payment → Active subscriber
        </p>
        <div className="mt-4 space-y-3">
          {funnel?.steps.map((step, i) => {
            const max = funnel.steps[0]?.count || 1;
            const widthPct = max ? (step.count / max) * 100 : 0;
            return (
              <div key={i}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-white">{step.name}</span>
                  <span className="text-slate-400">
                    {step.count.toLocaleString()}
                    {step.rate != null && (
                      <span className="ml-2 text-xs text-slate-500">
                        ({(step.rate * 100).toFixed(0)}% of signups)
                      </span>
                    )}
                  </span>
                </div>
                <div className="mt-1 h-3 w-full rounded-full bg-slate-800/60">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-[#fc4f02] to-[#fda300]"
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Earnings by month */}
      <div className="rounded-xl border border-slate-800/80 bg-gradient-to-b from-[#0b1220] to-[#070d17] p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Earnings by month
        </p>
        <p className="text-sm text-slate-500">Last 12 months of commissions</p>
        <div className="mt-4 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={earnings?.by_month ?? []}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                stroke="#475569"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
              />
              <YAxis
                stroke="#475569"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                tickFormatter={(v: number) => `$${v}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0b1220",
                  border: "1px solid #1e293b",
                  borderRadius: 8,
                  color: "#e2e8f0",
                }}
                formatter={(v) => [
                  `$${Number((v as number | string | undefined) ?? 0).toFixed(2)}`,
                  "Earnings",
                ]}
              />
              <Bar dataKey="earnings_usd" fill="#fc4f02" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top earning referred users */}
      <div className="rounded-xl border border-slate-800/80 bg-gradient-to-b from-[#0b1220] to-[#070d17] p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Top earning referrals
        </p>
        <p className="text-sm text-slate-500">By lifetime commissions</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800/80 text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-2 py-2 font-medium">User</th>
                <th className="px-2 py-2 font-medium">Events</th>
                <th className="px-2 py-2 font-medium">Lifetime earnings</th>
              </tr>
            </thead>
            <tbody>
              {earnings?.by_referred_user.length ? (
                earnings.by_referred_user.map((row) => (
                  <tr
                    key={row.user_id_hash}
                    className="border-b border-slate-800/60 text-slate-200"
                  >
                    <td className="px-2 py-2 font-mono text-xs text-slate-400">
                      …{row.user_id_hash}
                    </td>
                    <td className="px-2 py-2">{row.events}</td>
                    <td className="px-2 py-2">
                      ${row.earnings_usd.toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={3}
                    className="py-6 text-center text-sm text-slate-500"
                  >
                    No commission events yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cohort retention */}
      <div className="rounded-xl border border-slate-800/80 bg-gradient-to-b from-[#0b1220] to-[#070d17] p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Cohort retention
        </p>
        <p className="text-sm text-slate-500">
          % of each month's signups still actively subscribing today
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800/80 text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-2 py-2 font-medium">Signup month</th>
                <th className="px-2 py-2 font-medium">Total signups</th>
                <th className="px-2 py-2 font-medium">Still active</th>
                <th className="px-2 py-2 font-medium">Retention</th>
              </tr>
            </thead>
            <tbody>
              {cohorts?.cohorts.length ? (
                cohorts.cohorts.map((c) => (
                  <tr
                    key={c.signup_month}
                    className="border-b border-slate-800/60 text-slate-200"
                  >
                    <td className="px-2 py-2">{c.signup_month}</td>
                    <td className="px-2 py-2">{c.total_signups}</td>
                    <td className="px-2 py-2">{c.still_active}</td>
                    <td className="px-2 py-2">
                      {(c.retention_rate * 100).toFixed(0)}%
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="py-6 text-center text-sm text-slate-500"
                  >
                    No referred users yet.
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
