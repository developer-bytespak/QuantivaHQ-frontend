"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  adminGetPool,
  adminPublishPool,
  adminClonePool,
  adminUpdatePool,
  type AdminPoolDetails,
} from "@/lib/api/vcpool-admin";
import { useNotification, Notification } from "@/components/common/notification";

export default function AdminPoolDetailsPage() {
  const params = useParams<{ poolId: string }>();
  const router = useRouter();
  const { notification, showNotification, hideNotification } = useNotification();
  const [pool, setPool] = useState<AdminPoolDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isDraft = pool?.status === "draft";

  const load = () => {
    const id = params.poolId;
    if (!id) return;
    setLoading(true);
    adminGetPool(String(id))
      .then(setPool)
      .catch((err: unknown) => {
        showNotification((err as { message?: string })?.message ?? "Failed to load pool", "error");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.poolId]);

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
        </>
      )}
    </div>
  );
}

