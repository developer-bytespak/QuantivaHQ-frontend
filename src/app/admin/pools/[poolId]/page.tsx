"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  adminGetPool,
  adminPublishPool,
  adminClonePool,
  adminUpdatePool,
  adminListPayments,
  adminListReservations,
  adminListMembers,
  adminApprovePayment,
  adminRejectPayment,
  type AdminPoolDetails,
  type AdminPaymentSubmission,
  type AdminReservation,
  type AdminPoolMember,
} from "@/lib/api/vcpool-admin";
import { useNotification, Notification } from "@/components/common/notification";

type Tab = "payments" | "reservations" | "members";

export default function AdminPoolDetailsPage() {
  const params = useParams<{ poolId: string }>();
  const router = useRouter();
  const poolId = String(params.poolId ?? "");
  const { notification, showNotification, hideNotification } = useNotification();
  const [pool, setPool] = useState<AdminPoolDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("payments");
  const [payments, setPayments] = useState<AdminPaymentSubmission[]>([]);
  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [members, setMembers] = useState<AdminPoolMember[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [actionSubmitting, setActionSubmitting] = useState<string | null>(null);

  const isDraft = pool?.status === "draft";

  const load = () => {
    if (!poolId) return;
    setLoading(true);
    adminGetPool(poolId)
      .then(setPool)
      .catch((err: unknown) => {
        showNotification((err as { message?: string })?.message ?? "Failed to load pool", "error");
      })
      .finally(() => setLoading(false));
  };

  const loadPayments = () => {
    if (!poolId) return;
    setPaymentsLoading(true);
    adminListPayments(poolId, { page: 1, limit: 50 })
      .then((r) => setPayments(r.submissions))
      .catch(() => setPayments([]))
      .finally(() => setPaymentsLoading(false));
  };

  const loadReservations = () => {
    if (!poolId) return;
    adminListReservations(poolId).then((r) => setReservations(r.reservations)).catch(() => setReservations([]));
  };

  const loadMembers = () => {
    if (!poolId) return;
    adminListMembers(poolId).then((r) => setMembers(r.members)).catch(() => setMembers([]));
  };

  useEffect(() => {
    load();
  }, [poolId]);

  useEffect(() => {
    if (!poolId || !pool || pool.status === "draft") return;
    loadPayments();
    loadReservations();
    loadMembers();
  }, [poolId, pool?.status]);

  const handlePublish = async () => {
    if (!pool) return;
    setSaving(true);
    try {
      const updated = await adminPublishPool(pool.pool_id);
      setPool(updated);
      showNotification("Pool published", "success");
    } catch (err: any) {
      showNotification(err?.message || "Failed to publish pool", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleClone = async () => {
    if (!pool) return;
    setSaving(true);
    try {
      const cloned = await adminClonePool(pool.pool_id);
      showNotification("Pool cloned as draft", "success");
      router.push(`/admin/pools/${cloned.pool_id}`);
    } catch (err: any) {
      showNotification(err?.message || "Failed to clone pool", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (submissionId: string) => {
    if (!poolId) return;
    setActionSubmitting(submissionId);
    try {
      await adminApprovePayment(poolId, submissionId);
      showNotification("Payment approved. User is now a member.", "success");
      load();
      loadPayments();
      loadReservations();
      loadMembers();
    } catch (err: unknown) {
      showNotification((err as { message?: string })?.message ?? "Failed to approve", "error");
    } finally {
      setActionSubmitting(null);
    }
  };

  const handleReject = async (submissionId: string) => {
    const reason = window.prompt("Rejection reason (shown to user):", "Screenshot unclear or invalid");
    if (reason === null) return;
    if (!poolId) return;
    setActionSubmitting(submissionId);
    try {
      await adminRejectPayment(poolId, submissionId, { rejection_reason: reason.trim() || "Rejected by admin" });
      showNotification("Payment rejected. Seat released.", "success");
      load();
      loadPayments();
      loadReservations();
      loadMembers();
    } catch (err: unknown) {
      showNotification((err as { message?: string })?.message ?? "Failed to reject", "error");
    } finally {
      setActionSubmitting(null);
    }
  };

  const handleQuickEdit = async (field: "name" | "contribution_amount" | "max_members") => {
    if (!pool || !isDraft) return;
    const current =
      field === "name"
        ? pool.name
        : field === "contribution_amount"
        ? pool.contribution_amount
        : String(pool.max_members);
    const label =
      field === "name" ? "Pool name" : field === "contribution_amount" ? "Contribution amount" : "Max members";
    // eslint-disable-next-line no-alert
    const value = window.prompt(`Edit ${label}`, current);
    if (value === null) return;
    const body: any = {};
    if (field === "name") body.name = value;
    if (field === "contribution_amount") body.contribution_amount = Number(value);
    if (field === "max_members") body.max_members = Number(value);
    setSaving(true);
    try {
      const updated = await adminUpdatePool(pool.pool_id, body);
      setPool(updated);
      showNotification("Pool updated", "success");
    } catch (err: any) {
      showNotification(err?.message || "Failed to update pool", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={hideNotification}
        />
      )}

      <button
        onClick={() => router.push("/admin/pools")}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Pools
      </button>

      {loading && (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#fc4f02] border-t-transparent" />
        </div>
      )}

      {!loading && pool && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-white">{pool.name}</h1>
              <p className="text-xs text-slate-400">
                Status: <span className="capitalize">{pool.status}</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleClone}
                disabled={saving}
                className="rounded-xl border border-[--color-border] px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-[--color-surface-alt] disabled:opacity-60"
              >
                Clone
              </button>
              {isDraft && (
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={saving}
                  className="rounded-xl bg-[#fc4f02] px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60"
                >
                  Publish
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-5 text-sm text-slate-300 space-y-3">
              <h2 className="text-sm font-semibold text-white">Basics</h2>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleQuickEdit("name")}
                  disabled={!isDraft || saving}
                  className="flex w-full items-center justify-between rounded-lg bg-[--color-surface-alt] px-3 py-2 text-left hover:bg-[--color-surface-alt]/80 disabled:opacity-60"
                >
                  <span className="text-xs text-slate-400">Name</span>
                  <span className="text-xs font-medium text-white">{pool.name}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickEdit("contribution_amount")}
                  disabled={!isDraft || saving}
                  className="flex w-full items-center justify-between rounded-lg bg-[--color-surface-alt] px-3 py-2 text-left hover:bg-[--color-surface-alt]/80 disabled:opacity-60"
                >
                  <span className="text-xs text-slate-400">Contribution per seat</span>
                  <span className="text-xs font-medium text-white">
                    ${pool.contribution_amount} {pool.coin_type}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickEdit("max_members")}
                  disabled={!isDraft || saving}
                  className="flex w-full items-center justify-between rounded-lg bg-[--color-surface-alt] px-3 py-2 text-left hover:bg-[--color-surface-alt]/80 disabled:opacity-60"
                >
                  <span className="text-xs text-slate-400">Max members</span>
                  <span className="text-xs font-medium text-white">
                    {pool.max_members}
                  </span>
                </button>
                <div className="flex items-center justify-between rounded-lg bg-[--color-surface-alt] px-3 py-2 text-xs">
                  <span className="text-slate-400">Duration</span>
                  <span className="font-medium text-white">
                    {pool.duration_days} days
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-5 text-sm text-slate-300 space-y-3">
              <h2 className="text-sm font-semibold text-white">Members & seats</h2>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-lg bg-[--color-surface-alt] px-3 py-2 text-xs">
                  <span className="text-slate-400">Verified members</span>
                  <span className="font-medium text-white">
                    {pool.verified_members_count}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-[--color-surface-alt] px-3 py-2 text-xs">
                  <span className="text-slate-400">Reserved seats</span>
                  <span className="font-medium text-white">
                    {pool.reserved_seats_count}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-[--color-surface-alt] px-3 py-2 text-xs">
                  <span className="text-slate-400">Available seats</span>
                  <span className="font-medium text-white">
                    {pool.max_members -
                      pool.verified_members_count -
                      pool.reserved_seats_count}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Phase 1C: Payments, Reservations, Members (only for non-draft pools) */}
          {!isDraft && (
            <div className="rounded-xl border border-[--color-border] bg-[--color-surface] overflow-hidden">
              <div className="flex border-b border-[--color-border]">
                {(["payments", "reservations", "members"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-3 text-sm font-medium capitalize transition-colors ${
                      activeTab === tab
                        ? "bg-[#fc4f02]/20 text-[#fc4f02] border-b-2 border-[#fc4f02]"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="p-4">
                {activeTab === "payments" && (
                  <>
                    {paymentsLoading ? (
                      <div className="flex items-center gap-2 text-sm text-slate-400 py-4">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#fc4f02] border-t-transparent" />
                        Loading…
                      </div>
                    ) : payments.length === 0 ? (
                      <p className="text-sm text-slate-400 py-4">No payment submissions yet.</p>
                    ) : (
                      <div className="space-y-3 overflow-x-auto">
                        {payments.map((p) => (
                          <div
                            key={p.submission_id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[--color-surface-alt] p-3 text-sm"
                          >
                            <div>
                              <p className="font-medium text-white">
                                {p.user_email ?? p.user_username ?? p.user_id}
                              </p>
                              <p className="text-xs text-slate-400">
                                {p.payment_method} · {p.total_amount} ·{" "}
                                <span className="capitalize">{p.status}</span>
                              </p>
                              {p.screenshot_url && (
                                <a
                                  href={p.screenshot_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-[#fc4f02] hover:underline mt-1 inline-block"
                                >
                                  View screenshot
                                </a>
                              )}
                              {p.rejection_reason && (
                                <p className="text-xs text-red-400 mt-1">Rejected: {p.rejection_reason}</p>
                              )}
                            </div>
                            {p.status === "processing" && (
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleApprove(p.submission_id)}
                                  disabled={actionSubmitting !== null}
                                  className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-500 disabled:opacity-60"
                                >
                                  {actionSubmitting === p.submission_id ? "…" : "Approve"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleReject(p.submission_id)}
                                  disabled={actionSubmitting !== null}
                                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-60"
                                >
                                  {actionSubmitting === p.submission_id ? "…" : "Reject"}
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
                {activeTab === "reservations" && (
                  <>
                    {reservations.length === 0 ? (
                      <p className="text-sm text-slate-400 py-4">No active reservations.</p>
                    ) : (
                      <div className="space-y-2 overflow-x-auto">
                        {reservations.map((r) => (
                          <div
                            key={r.reservation_id}
                            className="flex items-center justify-between rounded-lg bg-[--color-surface-alt] px-3 py-2 text-sm text-slate-300"
                          >
                            <span className="font-medium text-white">
                              {r.user_email ?? r.user_username ?? r.user_id}
                            </span>
                            <span className="text-xs capitalize">{r.status}</span>
                            <span className="text-xs text-slate-400">
                              Expires: {new Date(r.expires_at).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
                {activeTab === "members" && (
                  <>
                    {members.length === 0 ? (
                      <p className="text-sm text-slate-400 py-4">No members yet.</p>
                    ) : (
                      <div className="space-y-2 overflow-x-auto">
                        {members.map((m) => (
                          <div
                            key={m.member_id}
                            className="flex items-center justify-between rounded-lg bg-[--color-surface-alt] px-3 py-2 text-sm text-slate-300"
                          >
                            <span className="font-medium text-white">
                              {m.user_email ?? m.user_username ?? m.user_id}
                            </span>
                            <span className="text-xs">Share: {m.share_percent}%</span>
                            <span className="text-xs text-slate-400">
                              Joined {new Date(m.joined_at).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

