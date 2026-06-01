"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AffiliateAdminTabs } from "@/components/affiliate/affiliate-admin-tabs";
import {
  superListAffiliatePayouts,
  superMarkAffiliatePayoutPaid,
  superRunAffiliatePayoutBatch,
  type PayoutListItem,
  type PayoutsListResponse,
} from "@/lib/api/vcpool-admin/affiliates";

const STATUSES = ["PENDING", "PROCESSING", "COMPLETED", "FAILED", "ALL"];

function statusClass(s: string) {
  switch (s) {
    case "COMPLETED":
      return "bg-emerald-500/20 text-emerald-300";
    case "PENDING":
      return "bg-amber-500/20 text-amber-300";
    case "PROCESSING":
      return "bg-sky-500/20 text-sky-300";
    case "FAILED":
      return "bg-rose-500/20 text-rose-300";
    default:
      return "bg-slate-500/20 text-slate-300";
  }
}

export default function SuperAffiliatePayoutsPage() {
  const [status, setStatus] = useState<string>("PENDING");
  const [data, setData] = useState<PayoutsListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // mark-paid modal state
  const [markingPayout, setMarkingPayout] = useState<PayoutListItem | null>(null);
  const [markingReference, setMarkingReference] = useState("");
  const [submittingMark, setSubmittingMark] = useState(false);
  const [submittingRun, setSubmittingRun] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await superListAffiliatePayouts({
        status: status === "ALL" ? undefined : status,
        page: 1,
        page_size: 100,
      });
      setData(d);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const runBatch = async () => {
    setSubmittingRun(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await superRunAffiliatePayoutBatch();
      setSuccess(
        `Generated ${res.created_payouts.length} payout(s) for ${res.period}.`,
      );
      await load();
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? "Batch run failed");
    } finally {
      setSubmittingRun(false);
    }
  };

  const confirmMarkPaid = async () => {
    if (!markingPayout) return;
    setSubmittingMark(true);
    setError(null);
    setSuccess(null);
    try {
      await superMarkAffiliatePayoutPaid(markingPayout.payout_id, {
        payment_reference: markingReference || undefined,
      });
      setSuccess("Payout marked paid.");
      setMarkingPayout(null);
      setMarkingReference("");
      await load();
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? "Mark paid failed");
    } finally {
      setSubmittingMark(false);
    }
  };

  return (
    <div>
      <AffiliateAdminTabs />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 rounded-lg border border-slate-700 p-1">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
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
        <button
          type="button"
          disabled={submittingRun}
          onClick={runBatch}
          className="rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-3 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          {submittingRun ? "Generating…" : "Run monthly payout batch"}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          {success}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-gradient-to-b from-[#0b1220] to-[#070d17]">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-slate-800/80 text-left text-xs uppercase tracking-wider text-slate-500">
              <th className="px-3 py-2 font-medium">Affiliate</th>
              <th className="px-3 py-2 font-medium">Period</th>
              <th className="px-3 py-2 font-medium text-right">Gross</th>
              <th className="px-3 py-2 font-medium text-right">Net</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Created</th>
              <th className="px-3 py-2 font-medium">Reference</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-slate-500">
                  Loading…
                </td>
              </tr>
            ) : data && data.items.length > 0 ? (
              data.items.map((p) => (
                <tr
                  key={p.payout_id}
                  className="border-b border-slate-800/60 text-slate-200"
                >
                  <td className="px-3 py-2">
                    <Link
                      href={`/super/admin/affiliates/${p.affiliate_id}`}
                      className="font-medium text-white hover:text-[#fc4f02]"
                    >
                      {p.affiliate?.display_name ?? p.affiliate_id.slice(0, 8)}
                    </Link>
                    <div className="text-xs text-slate-500">
                      {p.affiliate?.email}
                    </div>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{p.period}</td>
                  <td className="px-3 py-2 text-right">
                    ${Number(p.gross_usd).toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-white">
                    ${Number(p.net_usd).toFixed(2)}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${statusClass(p.status)}`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-400">
                    {p.created_at.slice(0, 10)}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-400">
                    {p.payment_reference ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {p.status === "PENDING" && (
                      <button
                        type="button"
                        onClick={() => {
                          setMarkingPayout(p);
                          setMarkingReference("");
                        }}
                        className="rounded-md bg-emerald-500/20 px-2 py-1 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/30"
                      >
                        Mark paid
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-slate-500">
                  No payouts in this status.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {markingPayout && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => !submittingMark && setMarkingPayout(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-slate-800/80 bg-gradient-to-b from-[#0b1220] to-[#070d17] p-6 shadow-2xl"
          >
            <h2 className="text-lg font-semibold text-white">
              Mark payout as paid
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Confirms this payout was paid out-of-band. Flips linked commission
              events to PAID and moves the affiliate's balance.
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <dt className="text-slate-500">Affiliate</dt>
              <dd className="text-slate-200">
                {markingPayout.affiliate?.display_name}
              </dd>
              <dt className="text-slate-500">Period</dt>
              <dd className="text-slate-200">{markingPayout.period}</dd>
              <dt className="text-slate-500">Net amount</dt>
              <dd className="font-semibold text-white">
                ${Number(markingPayout.net_usd).toFixed(2)}
              </dd>
            </dl>
            {markingPayout.affiliate?.payout_instructions && (
              <div className="mt-3 rounded-md border border-slate-800/80 bg-[#070d17] p-3 text-xs text-slate-300">
                <p className="font-semibold text-slate-400">
                  Payout instructions:
                </p>
                <pre className="mt-1 whitespace-pre-wrap font-sans">
                  {markingPayout.affiliate.payout_instructions}
                </pre>
              </div>
            )}
            <div className="mt-4">
              <label className="block text-xs font-medium text-slate-300">
                Payment reference (optional)
              </label>
              <input
                value={markingReference}
                onChange={(e) => setMarkingReference(e.target.value)}
                placeholder="e.g. Wise transfer #abc123"
                className="mt-1 w-full rounded-md border border-slate-700 bg-[#070d17] px-3 py-2 text-sm text-white"
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setMarkingPayout(null)}
                disabled={submittingMark}
                className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmMarkPaid}
                disabled={submittingMark}
                className="rounded-md bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-4 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {submittingMark ? "Saving…" : "Confirm paid"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
