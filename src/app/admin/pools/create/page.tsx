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
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Pools
      </button>

      <div className="rounded-2xl border border-[--color-border] bg-[--color-surface] p-6 sm:p-8">
        <h1 className="mb-1 text-xl font-semibold text-white">Create pool</h1>
        <p className="mb-6 text-sm text-slate-400">
          Create a new VC pool in draft status. You can edit and publish it later.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm text-slate-300">Name</label>
              <input
                type="text"
                value={values.name}
                onChange={(e) => setValues((p) => ({ ...p, name: e.target.value }))}
                className="w-full rounded-xl border border-[--color-border] bg-[--color-background] px-4 py-2.5 text-white focus:border-[#fc4f02] focus:outline-none focus:ring-1 focus:ring-[#fc4f02]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm text-slate-300">Description (optional)</label>
              <textarea
                rows={3}
                value={values.description || ""}
                onChange={(e) => setValues((p) => ({ ...p, description: e.target.value }))}
                className="w-full rounded-xl border border-[--color-border] bg-[--color-background] px-4 py-2.5 text-sm text-white focus:border-[#fc4f02] focus:outline-none focus:ring-1 focus:ring-[#fc4f02]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-300">Coin</label>
              <select
                value={values.coin_type}
                onChange={(e) => setValues((p) => ({ ...p, coin_type: e.target.value }))}
                className="w-full rounded-xl border border-[--color-border] bg-[--color-background] px-4 py-2.5 text-sm text-white focus:border-[#fc4f02] focus:outline-none focus:ring-1 focus:ring-[#fc4f02]"
              >
                <option value="USDT">USDT</option>
                <option value="USDC">USDC</option>
                <option value="BUSD">BUSD</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-300">Contribution per seat (USD)</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={values.contribution_amount}
                onChange={(e) => handleChangeNumber("contribution_amount", e.target.value)}
                className="w-full rounded-xl border border-[--color-border] bg-[--color-background] px-4 py-2.5 text-white focus:border-[#fc4f02] focus:outline-none focus:ring-1 focus:ring-[#fc4f02]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-300">Max members</label>
              <input
                type="number"
                min={2}
                value={values.max_members}
                onChange={(e) => handleChangeNumber("max_members", e.target.value)}
                className="w-full rounded-xl border border-[--color-border] bg-[--color-background] px-4 py-2.5 text-white focus:border-[#fc4f02] focus:outline-none focus:ring-1 focus:ring-[#fc4f02]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-300">Duration (days)</label>
              <input
                type="number"
                min={1}
                value={values.duration_days}
                onChange={(e) => handleChangeNumber("duration_days", e.target.value)}
                className="w-full rounded-xl border border-[--color-border] bg-[--color-background] px-4 py-2.5 text-white focus:border-[#fc4f02] focus:outline-none focus:ring-1 focus:ring-[#fc4f02]"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#fc4f02] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Creating…" : "Create draft"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

