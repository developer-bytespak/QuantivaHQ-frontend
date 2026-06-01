"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AffiliateAdminTabs } from "@/components/affiliate/affiliate-admin-tabs";
import {
  superExportAffiliatesCSV,
  superListAffiliates,
  type AffiliateListResponse,
  type ListAffiliatesFilters,
} from "@/lib/api/vcpool-admin/affiliates";

const STATUS_OPTIONS = [
  "",
  "PENDING",
  "APPROVED",
  "REJECTED",
  "SUSPENDED",
  "PAUSED",
];
const TIER_OPTIONS = ["", "DEFAULT", "PREMIUM", "CUSTOM"];

function statusClass(s: string) {
  switch (s) {
    case "APPROVED":
      return "bg-emerald-500/20 text-emerald-300";
    case "PENDING":
      return "bg-amber-500/20 text-amber-300";
    case "REJECTED":
    case "SUSPENDED":
      return "bg-rose-500/20 text-rose-300";
    case "PAUSED":
      return "bg-slate-500/20 text-slate-300";
    default:
      return "bg-slate-500/20 text-slate-300";
  }
}

export default function SuperAffiliatesPage() {
  const [filters, setFilters] = useState<ListAffiliatesFilters>({
    page: 1,
    page_size: 25,
  });
  const [data, setData] = useState<AffiliateListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    superListAffiliates(filters)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError((err as { message?: string })?.message ?? "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filters]);

  const updateFilter = <K extends keyof ListAffiliatesFilters>(
    key: K,
    value: ListAffiliatesFilters[K],
  ) => setFilters((p) => ({ ...p, [key]: value, page: 1 }));

  const downloadCsv = async () => {
    try {
      const csv = await superExportAffiliatesCSV(filters);
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "affiliates.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? "Export failed");
    }
  };

  const totalPages = data ? Math.ceil(data.total / data.page_size) : 1;

  return (
    <div>
      <AffiliateAdminTabs />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Field label="Search">
          <input
            value={filters.search ?? ""}
            onChange={(e) => updateFilter("search", e.target.value)}
            placeholder="email / display name / code"
            className={inputCls}
          />
        </Field>
        <Field label="Status">
          <select
            value={filters.status ?? ""}
            onChange={(e) => updateFilter("status", e.target.value)}
            className={inputCls}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s || "All"}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tier">
          <select
            value={filters.tier ?? ""}
            onChange={(e) => updateFilter("tier", e.target.value)}
            className={inputCls}
          >
            {TIER_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t || "All"}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Country">
          <input
            value={filters.country ?? ""}
            onChange={(e) => updateFilter("country", e.target.value)}
            placeholder="US"
            className={inputCls}
          />
        </Field>
        <button
          type="button"
          onClick={() => setFilters({ page: 1, page_size: 25 })}
          className="rounded-md border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 hover:border-slate-500 hover:text-white"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={downloadCsv}
          className="ml-auto rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-3 py-2 text-xs font-semibold text-white hover:opacity-90"
        >
          Export CSV
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-gradient-to-b from-[#0b1220] to-[#070d17]">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-slate-800/80 text-left text-xs uppercase tracking-wider text-slate-500">
              <th className="px-3 py-2 font-medium">Affiliate</th>
              <th className="px-3 py-2 font-medium">Code</th>
              <th className="px-3 py-2 font-medium">Channel</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Tier</th>
              <th className="px-3 py-2 font-medium text-right">Signups</th>
              <th className="px-3 py-2 font-medium text-right">Revenue</th>
              <th className="px-3 py-2 font-medium text-right">Pending</th>
              <th className="px-3 py-2 font-medium text-right">Paid</th>
              <th className="px-3 py-2 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="px-3 py-6 text-center text-slate-500">
                  Loading…
                </td>
              </tr>
            ) : data && data.items.length > 0 ? (
              data.items.map((a) => (
                <tr
                  key={a.affiliate_id}
                  className="border-b border-slate-800/60 text-slate-200 hover:bg-slate-800/30"
                >
                  <td className="px-3 py-2">
                    <Link
                      href={`/super/admin/affiliates/${a.affiliate_id}`}
                      className="font-medium text-white hover:text-[#fc4f02]"
                    >
                      {a.display_name}
                    </Link>
                    <div className="text-xs text-slate-500">{a.email}</div>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-[#fc4f02]">
                    {a.referral_code ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-400">
                    {a.application?.primary_channel ?? "—"}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${statusClass(a.status)}`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs">{a.commission_tier}</td>
                  <td className="px-3 py-2 text-right">{a.signup_count}</td>
                  <td className="px-3 py-2 text-right">
                    ${Number(a.revenue_generated).toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    ${Number(a.pending_balance).toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    ${Number(a.paid_total).toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-400">
                    {a.created_at.slice(0, 10)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={10} className="px-3 py-6 text-center text-slate-500">
                  No affiliates match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && (
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
          <span>
            Showing {(data.page - 1) * data.page_size + 1}–
            {Math.min(data.page * data.page_size, data.total)} of {data.total}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={data.page <= 1}
              onClick={() => setFilters((p) => ({ ...p, page: (p.page ?? 1) - 1 }))}
              className="rounded-md border border-slate-700 px-2 py-1 disabled:opacity-40"
            >
              Prev
            </button>
            <span>
              Page {data.page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={data.page >= totalPages}
              onClick={() => setFilters((p) => ({ ...p, page: (p.page ?? 1) + 1 }))}
              className="rounded-md border border-slate-700 px-2 py-1 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls =
  "rounded-md border border-slate-700 bg-[#070d17] px-2.5 py-1.5 text-sm text-white placeholder-slate-500 focus:border-[#fc4f02] focus:outline-none";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </label>
      {children}
    </div>
  );
}
