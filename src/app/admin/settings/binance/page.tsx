"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { adminGetSettings, adminUpdateBinance } from "@/lib/api/vcpool-admin";
import { useNotification, Notification } from "@/components/common/notification";

export default function AdminSettingsBinancePage() {
  const router = useRouter();
  const { notification, showNotification, hideNotification } = useNotification();
  const [binanceUid, setBinanceUid] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminGetSettings()
      .then((data) => setBinanceUid(data.binance_uid ?? ""))
      .catch((err: unknown) => {
        showNotification((err as { message?: string })?.message ?? "Failed to load", "error");
      })
      .finally(() => setLoading(false));
  }, [showNotification]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminUpdateBinance({ binance_uid: binanceUid.trim() });
      showNotification("Binance UID updated", "success");
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
        className="inline-flex items-center gap-2 text-slate-400 hover:text-[#fc4f02] text-xs sm:text-sm font-medium transition-colors group"
      >
        <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Settings
      </Link>
      <div className="rounded-xl sm:rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur p-6 sm:p-8 shadow-[0_0_20px_rgba(252,79,2,0.04)]">
        <h2 className="text-lg font-semibold text-white mb-2">Binance UID</h2>
        <p className="text-sm text-slate-400 mb-6">
          This UID is shown to users for manual payment transfers.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1">
            <label htmlFor="binance-uid" className="mb-1.5 block text-xs sm:text-sm font-medium text-slate-300">UID</label>
            <input
              id="binance-uid"
              type="text"
              value={binanceUid}
              onChange={(e) => setBinanceUid(e.target.value)}
              placeholder="12345678"
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-white placeholder:text-slate-500 focus:border-[#fc4f02]/50 focus:outline-none focus:ring-1 focus:ring-[#fc4f02]/50 transition-colors"
              disabled={saving}
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-5 py-2.5 font-semibold text-white shadow-lg shadow-[#fc4f02]/25 hover:shadow-[#fc4f02]/40 hover:scale-[1.02] transition-all disabled:opacity-60 disabled:hover:scale-100"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </form>
      </div>
    </div>
  );
}
