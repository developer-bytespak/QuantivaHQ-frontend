"use client";

import { useState, useEffect } from "react";
import { adminGetSettings, adminMe } from "@/lib/api/vcpool-admin";
import { useNotification, Notification } from "@/components/common/notification";
import { SettingsBackButton } from "@/components/settings/settings-back-button";

export default function AdminSettingsFeesPage() {
  const { notification, showNotification, hideNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [fees, setFees] = useState({
    default_pool_fee_percent: 5,
    default_admin_profit_fee_percent: 20,
    default_cancellation_fee_percent: 5,
    default_payment_window_minutes: 30,
  });

  useEffect(() => {
    Promise.all([adminGetSettings(), adminMe()])
      .then(([data, me]) => {
        setIsSuperAdmin(!!me.is_super_admin);
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
  }, []);

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
      <SettingsBackButton backHref="/admin/settings" />
      <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-6">
        <h2 className="text-lg font-semibold text-white mb-2">Default fee settings</h2>
        <p className="text-sm text-slate-400 mb-6">
          These are the default fees applied to new pools.
        </p>
        {!isSuperAdmin && (
          <div className="mb-4 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
            <p className="text-sm text-blue-300">
              Default fees are managed by the Super Admin. These values are read-only.
            </p>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-slate-300">Pool fee %</label>
            <input
              type="number"
              value={fees.default_pool_fee_percent}
              className="w-full rounded-xl border border-[--color-border] bg-[--color-background] px-4 py-2.5 text-white opacity-70 cursor-not-allowed"
              disabled
              readOnly
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-300">Admin profit fee %</label>
            <input
              type="number"
              value={fees.default_admin_profit_fee_percent}
              className="w-full rounded-xl border border-[--color-border] bg-[--color-background] px-4 py-2.5 text-white opacity-70 cursor-not-allowed"
              disabled
              readOnly
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-300">Cancellation fee %</label>
            <input
              type="number"
              value={fees.default_cancellation_fee_percent}
              className="w-full rounded-xl border border-[--color-border] bg-[--color-background] px-4 py-2.5 text-white opacity-70 cursor-not-allowed"
              disabled
              readOnly
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-300">Payment window (minutes)</label>
            <input
              type="number"
              value={fees.default_payment_window_minutes}
              className="w-full rounded-xl border border-[--color-border] bg-[--color-background] px-4 py-2.5 text-white opacity-70 cursor-not-allowed"
              disabled
              readOnly
            />
          </div>
        </div>
      </div>
    </div>
  );
}
