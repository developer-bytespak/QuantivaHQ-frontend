"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  superAddAffiliateNote,
  superAdjustAffiliateBalance,
  superChangeAffiliateTier,
  superGetAffiliateAuditLog,
  superGetAffiliateDetail,
  superGetAffiliatePayouts,
  superGetAffiliateReferrals,
  superGetAffiliateTransactions,
  superPauseAffiliate,
  superResetAffiliateCode,
  superResumeAffiliate,
  superSuspendAffiliate,
  type AffiliateDetail,
  type PayoutListItem,
} from "@/lib/api/vcpool-admin/affiliates";

type Tab = "overview" | "referrals" | "transactions" | "payouts" | "audit" | "actions";

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "referrals", label: "Referred users" },
  { id: "transactions", label: "Transactions" },
  { id: "payouts", label: "Payouts" },
  { id: "audit", label: "Audit log" },
  { id: "actions", label: "Actions" },
];

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

export default function SuperAffiliateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<Tab>("overview");
  const [detail, setDetail] = useState<AffiliateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const d = await superGetAffiliateDetail(id);
      setDetail(d);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading || !detail) {
    return (
      <div className="rounded-2xl border border-slate-800/80 bg-[#0b1220] p-8 text-center text-sm text-slate-400">
        Loading affiliate…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/super/admin/affiliates"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
      >
        ← Back to affiliates
      </Link>

      {error && (
        <div className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          {success}
        </div>
      )}

      {/* Header */}
      <div className="rounded-xl border border-slate-800/80 bg-gradient-to-b from-[#0b1220] to-[#070d17] p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-white">
              {detail.display_name}
            </h1>
            <p className="text-sm text-slate-400">
              {detail.email} · joined {detail.created_at.slice(0, 10)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(detail.status)}`}
            >
              {detail.status}
            </span>
            <span className="rounded-full bg-slate-700/40 px-3 py-1 text-xs text-slate-200">
              {detail.commission_tier}
            </span>
            {detail.referral_code && (
              <span className="rounded-full bg-[#fc4f02]/20 px-3 py-1 font-mono text-xs text-[#fc4f02]">
                {detail.referral_code}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto border-b border-slate-800/80">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition ${
              tab === t.id
                ? "border-[#fc4f02] text-white"
                : "border-transparent text-slate-400 hover:border-slate-700 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && <Overview detail={detail} />}
      {tab === "referrals" && <ReferralsTab affiliateId={id} />}
      {tab === "transactions" && <TransactionsTab affiliateId={id} />}
      {tab === "payouts" && <PayoutsTab affiliateId={id} />}
      {tab === "audit" && <AuditTab affiliateId={id} />}
      {tab === "actions" && (
        <ActionsTab
          detail={detail}
          onChanged={async () => {
            setSuccess("Action applied.");
            await load();
            setTimeout(() => setSuccess(null), 2500);
          }}
          onError={(msg) => setError(msg)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────

function Overview({ detail }: { detail: AffiliateDetail }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Kpi label="Signups" value={detail.signup_count} />
      <Kpi label="Paying conversions" value={detail.conversion_count} />
      <Kpi
        label="Revenue generated"
        value={`$${Number(detail.revenue_generated).toFixed(2)}`}
      />
      <Kpi
        label="Pending balance"
        value={`$${Number(detail.pending_balance).toFixed(2)}`}
      />
      <Kpi
        label="Lifetime paid"
        value={`$${Number(detail.paid_total).toFixed(2)}`}
      />
      <Kpi
        label="Clawed back"
        value={`$${Number(detail.clawed_back_total).toFixed(2)}`}
      />
      <div className="rounded-xl border border-slate-800/80 bg-[#0b1220] p-4 sm:col-span-2 lg:col-span-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Payout instructions
        </p>
        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-200">
          {detail.payout_instructions || "— (affiliate has not set any yet)"}
        </p>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-800/80 bg-[#0b1220] p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold text-white">{value}</p>
    </div>
  );
}

function ReferralsTab({ affiliateId }: { affiliateId: string }) {
  const [rows, setRows] = useState<Awaited<
    ReturnType<typeof superGetAffiliateReferrals>
  > | null>(null);
  useEffect(() => {
    superGetAffiliateReferrals(affiliateId, 1, 50).then(setRows).catch(() => null);
  }, [affiliateId]);
  if (!rows) {
    return <div className="text-sm text-slate-500">Loading…</div>;
  }
  if (!rows.items.length) {
    return (
      <div className="rounded-xl border border-slate-800/80 bg-[#0b1220] p-6 text-sm text-slate-500">
        No referred users yet.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-[#0b1220]">
      <table className="w-full min-w-[700px] text-sm">
        <thead>
          <tr className="border-b border-slate-800/80 text-left text-xs uppercase tracking-wider text-slate-500">
            <th className="px-3 py-2 font-medium">User</th>
            <th className="px-3 py-2 font-medium">Signed up</th>
            <th className="px-3 py-2 font-medium">KYC</th>
            <th className="px-3 py-2 font-medium">Tier</th>
            <th className="px-3 py-2 font-medium text-right">Revenue</th>
            <th className="px-3 py-2 font-medium text-right">Commissions</th>
            <th className="px-3 py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.items.map((r) => (
            <tr
              key={r.user_id}
              className="border-b border-slate-800/60 text-slate-200"
            >
              <td className="px-3 py-2 text-xs text-slate-400">{r.email}</td>
              <td className="px-3 py-2 text-xs">{r.signup_date.slice(0, 10)}</td>
              <td className="px-3 py-2 text-xs">{r.kyc_status}</td>
              <td className="px-3 py-2 text-xs">{r.current_tier}</td>
              <td className="px-3 py-2 text-right">
                ${Number(r.lifetime_revenue_usd).toFixed(2)}
              </td>
              <td className="px-3 py-2 text-right">
                ${Number(r.attributed_commissions_usd).toFixed(2)}
              </td>
              <td className="px-3 py-2 text-xs">{r.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TransactionsTab({ affiliateId }: { affiliateId: string }) {
  const [rows, setRows] = useState<Awaited<
    ReturnType<typeof superGetAffiliateTransactions>
  > | null>(null);
  useEffect(() => {
    superGetAffiliateTransactions(affiliateId, 1, 100)
      .then(setRows)
      .catch(() => null);
  }, [affiliateId]);
  if (!rows)
    return <div className="text-sm text-slate-500">Loading…</div>;
  if (!rows.items.length) {
    return (
      <div className="rounded-xl border border-slate-800/80 bg-[#0b1220] p-6 text-sm text-slate-500">
        No commission events yet.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-[#0b1220]">
      <table className="w-full min-w-[700px] text-sm">
        <thead>
          <tr className="border-b border-slate-800/80 text-left text-xs uppercase tracking-wider text-slate-500">
            <th className="px-3 py-2 font-medium">Created</th>
            <th className="px-3 py-2 font-medium">Type</th>
            <th className="px-3 py-2 font-medium text-right">Gross</th>
            <th className="px-3 py-2 font-medium text-right">Rate</th>
            <th className="px-3 py-2 font-medium text-right">Commission</th>
            <th className="px-3 py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.items.map((row, i) => {
            const r = row as Record<string, unknown>;
            return (
              <tr key={i} className="border-b border-slate-800/60 text-slate-200">
                <td className="px-3 py-2 text-xs">
                  {String(r.created_at ?? "").slice(0, 10)}
                </td>
                <td className="px-3 py-2 text-xs">{String(r.event_type ?? "")}</td>
                <td className="px-3 py-2 text-right text-xs">
                  ${Number(r.gross_amount_usd ?? 0).toFixed(2)}
                </td>
                <td className="px-3 py-2 text-right text-xs">
                  {(Number(r.commission_rate ?? 0) * 100).toFixed(2)}%
                </td>
                <td className="px-3 py-2 text-right text-xs">
                  ${Number(r.commission_usd ?? 0).toFixed(2)}
                </td>
                <td className="px-3 py-2 text-xs">{String(r.status ?? "")}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PayoutsTab({ affiliateId }: { affiliateId: string }) {
  const [rows, setRows] = useState<{ items: PayoutListItem[] } | null>(null);
  useEffect(() => {
    superGetAffiliatePayouts(affiliateId, 1, 50)
      .then((d) => setRows({ items: d.items as PayoutListItem[] }))
      .catch(() => null);
  }, [affiliateId]);
  if (!rows)
    return <div className="text-sm text-slate-500">Loading…</div>;
  if (!rows.items.length) {
    return (
      <div className="rounded-xl border border-slate-800/80 bg-[#0b1220] p-6 text-sm text-slate-500">
        No payouts yet.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-[#0b1220]">
      <table className="w-full min-w-[700px] text-sm">
        <thead>
          <tr className="border-b border-slate-800/80 text-left text-xs uppercase tracking-wider text-slate-500">
            <th className="px-3 py-2 font-medium">Period</th>
            <th className="px-3 py-2 font-medium text-right">Gross</th>
            <th className="px-3 py-2 font-medium text-right">Net</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Paid at</th>
            <th className="px-3 py-2 font-medium">Reference</th>
          </tr>
        </thead>
        <tbody>
          {rows.items.map((p) => (
            <tr
              key={p.payout_id}
              className="border-b border-slate-800/60 text-slate-200"
            >
              <td className="px-3 py-2 font-mono text-xs">{p.period}</td>
              <td className="px-3 py-2 text-right">
                ${Number(p.gross_usd).toFixed(2)}
              </td>
              <td className="px-3 py-2 text-right">
                ${Number(p.net_usd).toFixed(2)}
              </td>
              <td className="px-3 py-2 text-xs">{p.status}</td>
              <td className="px-3 py-2 text-xs text-slate-400">
                {p.paid_at ? p.paid_at.slice(0, 10) : "—"}
              </td>
              <td className="px-3 py-2 text-xs text-slate-400">
                {p.payment_reference ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AuditTab({ affiliateId }: { affiliateId: string }) {
  const [rows, setRows] = useState<Awaited<
    ReturnType<typeof superGetAffiliateAuditLog>
  > | null>(null);
  useEffect(() => {
    superGetAffiliateAuditLog(affiliateId, 1, 200)
      .then(setRows)
      .catch(() => null);
  }, [affiliateId]);
  if (!rows)
    return <div className="text-sm text-slate-500">Loading…</div>;
  if (!rows.items.length) {
    return (
      <div className="rounded-xl border border-slate-800/80 bg-[#0b1220] p-6 text-sm text-slate-500">
        No audit entries.
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {rows.items.map((row) => (
        <div
          key={row.log_id}
          className="rounded-lg border border-slate-800/80 bg-[#0b1220] p-3 text-sm text-slate-200"
        >
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-mono text-xs text-[#fc4f02]">
              {row.action}
            </span>
            <span className="text-xs text-slate-500">
              {row.created_at.replace("T", " ").slice(0, 16)}
            </span>
          </div>
          {row.metadata && (
            <pre className="mt-2 max-h-32 overflow-auto rounded bg-[#070d17] p-2 text-[11px] text-slate-400">
              {JSON.stringify(row.metadata, null, 2)}
            </pre>
          )}
        </div>
      ))}
    </div>
  );
}

function ActionsTab({
  detail,
  onChanged,
  onError,
}: {
  detail: AffiliateDetail;
  onChanged: () => Promise<void>;
  onError: (m: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");
  const [tier, setTier] = useState<"DEFAULT" | "PREMIUM" | "CUSTOM">(
    detail.commission_tier,
  );
  const [tierReason, setTierReason] = useState("");
  const [delta, setDelta] = useState("0");
  const [deltaReason, setDeltaReason] = useState("");
  const [note, setNote] = useState("");
  const [pauseReason, setPauseReason] = useState("");

  const wrap = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
      await onChanged();
    } catch (err: unknown) {
      onError((err as { message?: string })?.message ?? "Action failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <ActionCard title="Status">
        <p className="mb-2 text-xs text-slate-500">
          Current: <span className="text-slate-200">{detail.status}</span>
        </p>
        <input
          value={pauseReason}
          onChange={(e) => setPauseReason(e.target.value)}
          placeholder="Optional reason"
          className={inputCls}
        />
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            disabled={busy}
            onClick={() => wrap(() => superPauseAffiliate(detail.affiliate_id, pauseReason || undefined))}
            className="rounded-md bg-slate-500/20 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-500/30 disabled:opacity-50"
          >
            Pause
          </button>
          <button
            disabled={busy}
            onClick={() => wrap(() => superSuspendAffiliate(detail.affiliate_id, pauseReason || undefined))}
            className="rounded-md bg-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-200 hover:bg-rose-500/30 disabled:opacity-50"
          >
            Suspend
          </button>
          <button
            disabled={busy}
            onClick={() => wrap(() => superResumeAffiliate(detail.affiliate_id, pauseReason || undefined))}
            className="rounded-md bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/30 disabled:opacity-50"
          >
            Resume (set APPROVED)
          </button>
        </div>
      </ActionCard>

      <ActionCard title="Reset referral code">
        <p className="mb-2 text-xs text-slate-500">
          Current:{" "}
          <span className="font-mono text-[#fc4f02]">
            {detail.referral_code ?? "—"}
          </span>
        </p>
        <input
          value={code}
          onChange={(e) =>
            setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_\-]/g, ""))
          }
          placeholder="NEW-CODE"
          className={inputCls}
        />
        <button
          disabled={busy || !code}
          onClick={() => wrap(() => superResetAffiliateCode(detail.affiliate_id, code))}
          className="mt-2 rounded-md bg-[#fc4f02]/20 px-3 py-1.5 text-xs font-semibold text-[#fc4f02] hover:bg-[#fc4f02]/30 disabled:opacity-50"
        >
          Reset code
        </button>
      </ActionCard>

      <ActionCard title="Change tier">
        <select
          value={tier}
          onChange={(e) => setTier(e.target.value as typeof tier)}
          className={inputCls}
        >
          <option value="DEFAULT">DEFAULT</option>
          <option value="PREMIUM">PREMIUM</option>
          <option value="CUSTOM">CUSTOM</option>
        </select>
        <input
          value={tierReason}
          onChange={(e) => setTierReason(e.target.value)}
          placeholder="Optional reason"
          className={`${inputCls} mt-2`}
        />
        <button
          disabled={busy}
          onClick={() =>
            wrap(() =>
              superChangeAffiliateTier(detail.affiliate_id, {
                commission_tier: tier,
                reason: tierReason || undefined,
              }),
            )
          }
          className="mt-2 rounded-md bg-[#fc4f02]/20 px-3 py-1.5 text-xs font-semibold text-[#fc4f02] hover:bg-[#fc4f02]/30 disabled:opacity-50"
        >
          Apply tier
        </button>
      </ActionCard>

      <ActionCard title="Adjust pending balance">
        <p className="mb-2 text-xs text-slate-500">
          Current pending:{" "}
          <span className="text-slate-200">
            ${Number(detail.pending_balance).toFixed(2)}
          </span>
        </p>
        <input
          type="number"
          step="0.01"
          value={delta}
          onChange={(e) => setDelta(e.target.value)}
          className={inputCls}
          placeholder="e.g. -25.00"
        />
        <input
          value={deltaReason}
          onChange={(e) => setDeltaReason(e.target.value)}
          placeholder="Reason (required)"
          className={`${inputCls} mt-2`}
        />
        <button
          disabled={busy || !deltaReason || !Number(delta)}
          onClick={() =>
            wrap(() =>
              superAdjustAffiliateBalance(detail.affiliate_id, {
                delta_usd: Number(delta),
                reason: deltaReason,
              }),
            )
          }
          className="mt-2 rounded-md bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-500/30 disabled:opacity-50"
        >
          Adjust balance
        </button>
      </ActionCard>

      <ActionCard title="Add internal note">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className={inputCls}
          placeholder="Visible only in the audit log"
        />
        <button
          disabled={busy || note.length < 1}
          onClick={() => wrap(() => superAddAffiliateNote(detail.affiliate_id, note))}
          className="mt-2 rounded-md bg-slate-500/20 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-500/30 disabled:opacity-50"
        >
          Save note
        </button>
      </ActionCard>
    </div>
  );
}

function ActionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-800/80 bg-[#0b1220] p-4">
      <h3 className="mb-3 text-sm font-semibold text-white">{title}</h3>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-md border border-slate-700 bg-[#070d17] px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-[#fc4f02] focus:outline-none";
