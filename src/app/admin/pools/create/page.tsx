"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  adminCreatePool,
  type CreatePoolRequest,
} from "@/lib/api/vcpool-admin";
import { useNotification, Notification } from "@/components/common/notification";

const initialValues: CreatePoolRequest = {
  name: "",
  description: "",
  coin_type: "USDT",
  contribution_amount: 100,
  max_members: 5,
  duration_days: 30,
};

const inputClass =
  "w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-[#fc4f02]/50 focus:outline-none focus:ring-1 focus:ring-[#fc4f02]/50 transition-colors";

export default function AdminCreatePoolPage() {
  const router = useRouter();
  const { notification, showNotification, hideNotification } = useNotification();
  const [values, setValues] = useState<CreatePoolRequest>(initialValues);
  const [saving, setSaving] = useState(false);

  const handleChangeNumber = (field: keyof CreatePoolRequest, v: string) => {
    setValues((prev) => ({
      ...prev,
      [field]: v === "" ? (field === "contribution_amount" ? 0 : 0) : Number(v),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.name.trim()) {
      showNotification("Name is required", "error");
      return;
    }
    if (!values.contribution_amount || !values.max_members || !values.duration_days) {
      showNotification("Contribution, members and duration are required", "error");
      return;
    }
    setSaving(true);
    try {
      const pool = await adminCreatePool(values);
      showNotification("Pool created as draft", "success");
      router.replace(`/admin/pools/${pool.pool_id}`);
    } catch (err: any) {
      showNotification(err?.message || "Failed to create pool", "error");
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
        className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-400 hover:text-[#fc4f02] transition-colors group"
      >
        <svg className="h-4 w-4 sm:h-5 sm:w-5 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Pools
      </button>

      <div className="rounded-xl sm:rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur p-6 sm:p-8
        shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.04)]">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-white">Create Pool</h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Create a new VC pool in draft status. You can edit and publish it later.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs sm:text-sm font-medium text-slate-300">Name</label>
              <input
                type="text"
                value={values.name}
                onChange={(e) => setValues((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. BTC Alpha Fund"
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs sm:text-sm font-medium text-slate-300">Description (optional)</label>
              <textarea
                rows={3}
                value={values.description || ""}
                onChange={(e) => setValues((p) => ({ ...p, description: e.target.value }))}
                placeholder="Describe the pool strategy and goals…"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs sm:text-sm font-medium text-slate-300">Coin</label>
              <select
                value={values.coin_type}
                onChange={(e) => setValues((p) => ({ ...p, coin_type: e.target.value }))}
                className={inputClass}
              >
                <option value="USDT">USDT</option>
                <option value="USDC">USDC</option>
                <option value="BUSD">BUSD</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs sm:text-sm font-medium text-slate-300">Contribution per seat (USD)</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={values.contribution_amount}
                onChange={(e) => handleChangeNumber("contribution_amount", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs sm:text-sm font-medium text-slate-300">Max members</label>
              <input
                type="number"
                min={2}
                value={values.max_members}
                onChange={(e) => handleChangeNumber("max_members", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs sm:text-sm font-medium text-slate-300">Duration (days)</label>
              <input
                type="number"
                min={1}
                value={values.duration_days}
                onChange={(e) => handleChangeNumber("duration_days", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#fc4f02]/25 hover:shadow-[#fc4f02]/40 hover:scale-[1.02] transition-all disabled:opacity-60 disabled:hover:scale-100"
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Creating…
                </>
              ) : (
                "Create draft"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

