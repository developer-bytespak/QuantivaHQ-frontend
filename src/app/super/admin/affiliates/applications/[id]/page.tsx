"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  superApproveAffiliateApplication,
  superGetAffiliateApplication,
  superGetAffiliateProgramSettings,
  superRejectAffiliateApplication,
  superRequestInfoOnAffiliateApplication,
  type AffiliateApplicationDetail,
} from "@/lib/api/vcpool-admin/affiliates";

const REJECTION_REASONS = [
  "Audience too small",
  "Policy fit",
  "Sanctioned region",
  "Duplicate / multiple accounts",
  "Suspected fraud",
  "Other",
];

export default function SuperAffiliateApplicationDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [app, setApp] = useState<AffiliateApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<
    "none" | "approve" | "reject" | "info"
  >("none");

  // Approve form
  const [approveCode, setApproveCode] = useState("");
  const [approveRatePct, setApproveRatePct] = useState("20");
  const [approveNotes, setApproveNotes] = useState("");

  // Reject form
  const [rejectReason, setRejectReason] = useState(REJECTION_REASONS[0]);
  const [rejectMessage, setRejectMessage] = useState("");

  // Info-request form
  const [infoMessage, setInfoMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const detail = await superGetAffiliateApplication(id);
      setApp(detail);
      // Default code suggestion from the display name
      const suggested = detail.affiliate.display_name
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "-")
        .slice(0, 40);
      setApproveCode(suggested);
      // Pre-fill the rate from the current program default. Falls back to 20%
      // if settings can't be loaded.
      try {
        const settings = await superGetAffiliateProgramSettings();
        setApproveRatePct(
          (Number(settings.subscription_commission_pct) * 100).toFixed(2),
        );
      } catch {
        // keep 20% default
      }
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

  const onApprove = async () => {
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await superApproveAffiliateApplication(id, {
        referral_code: approveCode,
        commission_pct: Number(approveRatePct) / 100,
        notes: approveNotes || undefined,
      });
      setSuccess(
        "Application approved. Approval email sent with their code and dashboard link.",
      );
      setActiveAction("none");
      await load();
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? "Approval failed");
    } finally {
      setSubmitting(false);
    }
  };

  const onReject = async () => {
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await superRejectAffiliateApplication(id, {
        reason: rejectReason,
        message: rejectMessage || undefined,
      });
      setSuccess("Application rejected.");
      setActiveAction("none");
      await load();
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? "Rejection failed");
    } finally {
      setSubmitting(false);
    }
  };

  const onRequestInfo = async () => {
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await superRequestInfoOnAffiliateApplication(id, {
        message: infoMessage,
      });
      setSuccess("Info request sent. Status set to INFO_REQUESTED.");
      setActiveAction("none");
      await load();
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? "Request failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800/80 bg-[#0b1220] p-8 text-center text-sm text-slate-400">
        Loading application…
      </div>
    );
  }
  if (!app) return null;

  return (
    <div className="space-y-6">
      <Link
        href="/super/admin/affiliates/applications"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
      >
        ← Back to applications
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

      <div className="rounded-xl border border-slate-800/80 bg-gradient-to-b from-[#0b1220] to-[#070d17] p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-white">
              {app.affiliate.display_name}
            </h1>
            <p className="text-sm text-slate-400">
              {app.affiliate.email} · {app.primary_channel}
            </p>
          </div>
          <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-300">
            {app.status}
          </span>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Stat label="Full name" value={app.affiliate.full_name ?? "—"} />
          <Stat label="Country" value={app.affiliate.country ?? "—"} />
          <Stat
            label="Tax residency"
            value={app.affiliate.tax_residency ?? "—"}
          />
          <Stat label="Audience size" value={String(app.audience_size ?? "—")} />
          <Stat
            label="Primary channel"
            value={
              app.primary_channel === "OTHER" && app.primary_channel_custom_name
                ? `Other — ${app.primary_channel_custom_name}`
                : app.primary_channel
            }
          />
          <Stat
            label="Channel URL"
            value={app.channel_url ?? "—"}
            href={safeHttpUrl(app.channel_url)}
          />
          <Stat
            label="Submission IP"
            value={app.ip_address ?? "—"}
          />
        </div>

        {app.additional_channels && app.additional_channels.length > 0 && (
          <div className="mt-5 border-t border-slate-800/80 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Additional channels ({app.additional_channels.length})
            </p>
            <ul className="mt-2 space-y-1.5 text-sm text-slate-200">
              {app.additional_channels.map((c, i) => (
                <li key={i} className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-medium text-white">
                    {c.type === "OTHER" && c.customName
                      ? `Other — ${c.customName}`
                      : c.type}
                  </span>
                  {c.url &&
                    (safeHttpUrl(c.url) ? (
                      <a
                        href={safeHttpUrl(c.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all text-xs text-[#fc4f02] hover:underline"
                      >
                        {c.url}
                      </a>
                    ) : (
                      <span className="break-all text-xs text-slate-400">
                        {c.url}
                      </span>
                    ))}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-5 border-t border-slate-800/80 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Pitch
          </p>
          <p className="mt-1 text-sm text-slate-200">{app.pitch}</p>
        </div>
      </div>

      {/* Enrichment */}
      <div className="rounded-xl border border-slate-800/80 bg-gradient-to-b from-[#0b1220] to-[#070d17] p-6">
        <h2 className="text-sm font-semibold text-white">Enrichment</h2>
        <div className="mt-3 space-y-3 text-xs text-slate-300">
          <div>
            <p className="text-slate-500">
              Prior accounts with same email:{" "}
              {app.enrichment.prior_accounts_with_same_email.length}
            </p>
            {app.enrichment.prior_accounts_with_same_email.map((p) => (
              <div key={p.affiliate_id} className="ml-2">
                · {p.status} (joined {p.created_at.slice(0, 10)})
              </div>
            ))}
          </div>
          <div>
            <p className="text-slate-500">
              Prior applications from same IP:{" "}
              {app.enrichment.prior_applications_from_same_ip.length}
            </p>
            {app.enrichment.prior_applications_from_same_ip.map((p) => (
              <div key={p.application_id} className="ml-2">
                · {p.status} on {p.created_at.slice(0, 10)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      {app.status !== "APPROVED" && app.status !== "REJECTED" && (
        <div className="rounded-xl border border-slate-800/80 bg-gradient-to-b from-[#0b1220] to-[#070d17] p-6">
          <h2 className="text-sm font-semibold text-white">Actions</h2>

          {activeAction === "none" && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => setActiveAction("approve")}
                className="rounded-md bg-emerald-500/20 px-3 py-1.5 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/30"
              >
                Approve
              </button>
              <button
                onClick={() => setActiveAction("reject")}
                className="rounded-md bg-rose-500/20 px-3 py-1.5 text-sm font-semibold text-rose-200 hover:bg-rose-500/30"
              >
                Reject
              </button>
              <button
                onClick={() => setActiveAction("info")}
                className="rounded-md bg-sky-500/20 px-3 py-1.5 text-sm font-semibold text-sky-200 hover:bg-sky-500/30"
              >
                Request info
              </button>
            </div>
          )}

          {activeAction === "approve" && (
            <div className="mt-3 space-y-3">
              <Field label="Referral code">
                <input
                  value={approveCode}
                  onChange={(e) =>
                    setApproveCode(
                      e.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9_\-]/g, ""),
                    )
                  }
                  className={inputCls}
                  placeholder="ALEX-QHQ"
                />
              </Field>
              <Field label="Commission rate">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={approveRatePct}
                    onChange={(e) => setApproveRatePct(e.target.value)}
                    className={inputCls}
                    placeholder="20"
                  />
                  <span className="text-sm text-slate-400">%</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Pre-filled with the program default. Change if you negotiated
                  a custom rate with this affiliate.
                </p>
              </Field>
              <Field label="Internal notes (optional)">
                <textarea
                  value={approveNotes}
                  onChange={(e) => setApproveNotes(e.target.value)}
                  rows={3}
                  className={inputCls}
                />
              </Field>
              <div className="flex gap-2">
                <button
                  onClick={onApprove}
                  disabled={
                    submitting ||
                    !approveCode ||
                    !approveRatePct ||
                    Number(approveRatePct) < 0 ||
                    Number(approveRatePct) > 100
                  }
                  className="rounded-md bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/30 disabled:opacity-50"
                >
                  {submitting ? "Approving…" : "Confirm approval"}
                </button>
                <button
                  onClick={() => setActiveAction("none")}
                  className="rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {activeAction === "reject" && (
            <div className="mt-3 space-y-3">
              <Field label="Reason">
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className={inputCls}
                >
                  {REJECTION_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Message to applicant (optional)">
                <textarea
                  value={rejectMessage}
                  onChange={(e) => setRejectMessage(e.target.value)}
                  rows={3}
                  className={inputCls}
                  placeholder="What we'll include in the rejection email"
                />
              </Field>
              <div className="flex gap-2">
                <button
                  onClick={onReject}
                  disabled={submitting}
                  className="rounded-md bg-rose-500/20 px-4 py-2 text-sm font-semibold text-rose-200 hover:bg-rose-500/30 disabled:opacity-50"
                >
                  {submitting ? "Rejecting…" : "Confirm rejection"}
                </button>
                <button
                  onClick={() => setActiveAction("none")}
                  className="rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {activeAction === "info" && (
            <div className="mt-3 space-y-3">
              <Field label="What additional info do you need?">
                <textarea
                  value={infoMessage}
                  onChange={(e) => setInfoMessage(e.target.value)}
                  rows={4}
                  className={inputCls}
                  placeholder="E.g. Please share screenshots of your channel analytics."
                />
              </Field>
              <div className="flex gap-2">
                <button
                  onClick={onRequestInfo}
                  disabled={submitting || infoMessage.length < 5}
                  className="rounded-md bg-sky-500/20 px-4 py-2 text-sm font-semibold text-sky-200 hover:bg-sky-500/30 disabled:opacity-50"
                >
                  {submitting ? "Sending…" : "Send info request"}
                </button>
                <button
                  onClick={() => setActiveAction("none")}
                  className="rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {app.status === "APPROVED" && (
        <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          This application has been approved.{" "}
          <button
            onClick={() =>
              router.push(`/super/admin/affiliates/${app.affiliate_id}`)
            }
            className="font-semibold underline hover:no-underline"
          >
            Open affiliate detail →
          </button>
        </div>
      )}
      {app.status === "REJECTED" && (
        <div className="rounded-md border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          Rejected: {app.rejection_reason ?? "—"}
        </div>
      )}
    </div>
  );
}

const inputCls =
  "w-full rounded-md border border-slate-700 bg-[#070d17] px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-[#fc4f02] focus:outline-none";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-300">
        {label}
      </label>
      {children}
    </div>
  );
}

function Stat({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-800/80 bg-[#070d17] p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 block break-all text-sm font-medium text-[#fc4f02] hover:underline"
        >
          {value}
        </a>
      ) : (
        <p className="mt-1 break-words text-sm font-medium text-white">{value}</p>
      )}
    </div>
  );
}

// Only link out to real web URLs — anything else renders as plain text.
function safeHttpUrl(url?: string | null): string | undefined {
  return url && /^https?:\/\//i.test(url.trim()) ? url.trim() : undefined;
}
