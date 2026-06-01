"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AffiliateAdminTabs } from "@/components/affiliate/affiliate-admin-tabs";
import {
  superListAffiliateApplications,
  type AffiliateApplicationsResponse,
} from "@/lib/api/vcpool-admin/affiliates";

const STATUSES = ["PENDING", "INFO_REQUESTED", "APPROVED", "REJECTED"];

function statusClass(s: string) {
  switch (s) {
    case "APPROVED":
      return "bg-emerald-500/20 text-emerald-300";
    case "PENDING":
      return "bg-amber-500/20 text-amber-300";
    case "INFO_REQUESTED":
      return "bg-sky-500/20 text-sky-300";
    case "REJECTED":
      return "bg-rose-500/20 text-rose-300";
    default:
      return "bg-slate-500/20 text-slate-300";
  }
}

export default function SuperAffiliateApplicationsPage() {
  const [status, setStatus] = useState<string>("PENDING");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AffiliateApplicationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    superListAffiliateApplications({ status, page, page_size: 25 })
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
  }, [status, page]);

  const totalPages = data ? Math.ceil(data.total / data.page_size) : 1;

  return (
    <div>
      <AffiliateAdminTabs />

      <div className="mb-4 flex gap-2 rounded-lg border border-slate-700 p-1">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
              status === s
                ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white"
                : "text-slate-300 hover:text-white"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-gradient-to-b from-[#0b1220] to-[#070d17]">
        <table className="w-full min-w-[800px] text-sm">
          <thead>
            <tr className="border-b border-slate-800/80 text-left text-xs uppercase tracking-wider text-slate-500">
              <th className="px-3 py-2 font-medium">Applicant</th>
              <th className="px-3 py-2 font-medium">Channel</th>
              <th className="px-3 py-2 font-medium text-right">Audience</th>
              <th className="px-3 py-2 font-medium">Country</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Submitted</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-slate-500">
                  Loading…
                </td>
              </tr>
            ) : data && data.items.length > 0 ? (
              data.items.map((app) => (
                <tr
                  key={app.application_id}
                  className="border-b border-slate-800/60 text-slate-200 hover:bg-slate-800/30"
                >
                  <td className="px-3 py-2">
                    <div className="font-medium text-white">
                      {app.affiliate.display_name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {app.affiliate.email}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-xs">{app.primary_channel}</td>
                  <td className="px-3 py-2 text-right">
                    {app.audience_size?.toLocaleString() ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {app.affiliate.country ?? "—"}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${statusClass(app.status)}`}
                    >
                      {app.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-400">
                    {app.created_at.slice(0, 10)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Link
                      href={`/super/admin/affiliates/applications/${app.application_id}`}
                      className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:border-[#fc4f02] hover:text-[#fc4f02]"
                    >
                      Review
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-slate-500">
                  No applications in this status.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && (
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
          <span>
            {data.total} total · page {data.page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-md border border-slate-700 px-2 py-1 disabled:opacity-40"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
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
