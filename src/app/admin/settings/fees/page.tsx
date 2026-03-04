"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { adminGetSettings, adminUpdateFees } from "@/lib/api/vcpool-admin";
import { useNotification, Notification } from "@/components/common/notification";

export default function AdminSettingsFeesPage() {
  const { notification, showNotification, hideNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feesErrors, setFeesErrors] = useState<Record<string, string>>({});
  const [fees, setFees] = useState({
    default_pool_fee_percent: 5,
    default_admin_profit_fee_percent: 20,
    default_cancellation_fee_percent: 5,
    default_payment_window_minutes: 30,
  });

  useEffect(() => {
    adminGetSettings()
      .then((data) => {
        setFees({
          default_pool_fee_percent: parseFloat(data.default_pool_fee_percent) || 5,
          default_admin_profit_fee_percent: parseFloat(data.default_admin_profit_fee_percent) || 20,
          default_cancellation_fee_percent: parseFloat(data.default_cancellation_fee_percent) || 5,
          default_payment_window_minutes: data.default_payment_window_minutes ?? 30,
        });
      })
      .catch((err: unknown) => {
        showNotification((err as { message?: string })?.message ?? "Failed to load", "error");
      })
      .finally(() => setLoading(false));
  }, [showNotification]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeesErrors({});
    const { default_pool_fee_percent, default_admin_profit_fee_percent, default_cancellation_fee_percent, default_payment_window_minutes } = fees;
    if (
      default_pool_fee_percent < 0 || default_pool_fee_percent > 100 ||
      default_admin_profit_fee_percent < 0 || default_admin_profit_fee_percent > 100 ||
      default_cancellation_fee_percent < 0 || default_cancellation_fee_percent > 100
    ) {
      setFeesErrors({ percent: "All fee percentages must be between 0 and 100" });
      return;
    }
    if (default_payment_window_minutes < 1 || default_payment_window_minutes > 1440) {
      setFeesErrors({ window: "Payment window must be between 1 and 1440 minutes" });
      return;
    }
    setSaving(true);
    try {
      await adminUpdateFees(fees);
      showNotification("Fee settings updated", "success");
    } catch (err: unknown) {
      showNotification((err as { message?: string })?.message ?? "Failed to update", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#fc4f02] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {notification && (
        <Notification message={notification.message} type={notification.type} onClose={hideNotification} />
      )}
      <Link
        href="/admin/settings"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Settings
      </Link>
      <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-6">
        <h2 className="text-lg font-semibold text-white mb-2">Default fee settings</h2>
        <p className="text-sm text-slate-400 mb-6">
          Used for new pools. Percentages 0–100; payment window 1–1440 minutes.
        </p>
        {(feesErrors.percent || feesErrors.window) && (
          <p className="mb-4 text-sm text-red-400">{feesErrors.percent ?? feesErrors.window}</p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-slate-300">Pool fee %</label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.01}
                value={fees.default_pool_fee_percent}
                onChange={(e) => setFees((p) => ({ ...p, default_pool_fee_percent: parseFloat(e.target.value) || 0 }))}
                className="w-full rounded-xl border border-[--color-border] bg-[--color-background] px-4 py-2.5 text-white focus:border-[#fc4f02] focus:outline-none focus:ring-1 focus:ring-[#fc4f02]"
                disabled={saving}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-300">Admin profit fee %</label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.01}
                value={fees.default_admin_profit_fee_percent}
                onChange={(e) => setFees((p) => ({ ...p, default_admin_profit_fee_percent: parseFloat(e.target.value) || 0 }))}
                className="w-full rounded-xl border border-[--color-border] bg-[--color-background] px-4 py-2.5 text-white focus:border-[#fc4f02] focus:outline-none focus:ring-1 focus:ring-[#fc4f02]"
                disabled={saving}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-300">Cancellation fee %</label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.01}
                value={fees.default_cancellation_fee_percent}
                onChange={(e) => setFees((p) => ({ ...p, default_cancellation_fee_percent: parseFloat(e.target.value) || 0 }))}
                className="w-full rounded-xl border border-[--color-border] bg-[--color-background] px-4 py-2.5 text-white focus:border-[#fc4f02] focus:outline-none focus:ring-1 focus:ring-[#fc4f02]"
                disabled={saving}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-300">Payment window (minutes)</label>
              <input
                type="number"
                min={1}
                max={1440}
                value={fees.default_payment_window_minutes}
                onChange={(e) => setFees((p) => ({ ...p, default_payment_window_minutes: parseInt(e.target.value, 10) || 30 }))}
                className="w-full rounded-xl border border-[--color-border] bg-[--color-background] px-4 py-2.5 text-white focus:border-[#fc4f02] focus:outline-none focus:ring-1 focus:ring-[#fc4f02]"
                disabled={saving}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-[#fc4f02] px-5 py-2.5 font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save fee settings"}
          </button>
        </form>
      </div>
    </div>
  );
}
