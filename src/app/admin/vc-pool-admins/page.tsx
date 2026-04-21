"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  adminMe,
  adminSuperCreateVcPoolAdmin,
  adminSuperDeleteVcPoolAdmin,
  adminSuperListVcPoolAdmins,
  type VcPoolAdminRow,
} from "@/lib/api/vcpool-admin";
import { Notification, useNotification } from "@/components/common/notification";

interface CreateFormState {
  email: string;
  password: string;
  full_name: string;
  currentPassword: string;
}

const INITIAL_FORM: CreateFormState = {
  email: "",
  password: "",
  full_name: "",
  currentPassword: "",
};

export default function VcPoolAdminsPage() {
  const router = useRouter();
  const { notification, showNotification, hideNotification } = useNotification();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [admins, setAdmins] = useState<VcPoolAdminRow[]>([]);
  const [form, setForm] = useState<CreateFormState>(INITIAL_FORM);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<VcPoolAdminRow | null>(null);

  const loadAdmins = async () => {
    const data = await adminSuperListVcPoolAdmins();
    setAdmins(data.admins);
  };

  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      try {
        const me = await adminMe();
        if (!me.is_super_admin) {
          router.replace("/admin/dashboard");
          return;
        }

        await loadAdmins();
      } catch (err: unknown) {
        if (!cancelled) {
          showNotification(
            (err as { message?: string })?.message ??
              "Failed to load VC pool admin page",
            "error"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    boot();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeAdmins = useMemo(
    () => admins.filter((a) => !a.is_super_admin).length,
    [admins]
  );

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await adminSuperCreateVcPoolAdmin({
        email: form.email.trim(),
        password: form.password,
        full_name: form.full_name.trim() || undefined,
        currentPassword: form.currentPassword,
      });

      setForm(INITIAL_FORM);
      await loadAdmins();
      showNotification("VC pool admin created successfully", "success");
    } catch (err: unknown) {
      showNotification(
        (err as { message?: string })?.message ?? "Failed to create admin",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async () => {
    if (!deleteTarget) return;

    setDeletingId(deleteTarget.admin_id);
    try {
      await adminSuperDeleteVcPoolAdmin(deleteTarget.admin_id, {
        currentPassword: deletePassword,
      });
      setDeleteTarget(null);
      setDeletePassword("");
      await loadAdmins();
      showNotification("VC pool admin deleted successfully", "success");
    } catch (err: unknown) {
      showNotification(
        (err as { message?: string })?.message ?? "Failed to delete admin",
        "error"
      );
    } finally {
      setDeletingId(null);
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
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={hideNotification}
        />
      )}

      <div className="rounded-2xl bg-gradient-to-br from-[#fc4f02] via-[#fd6a00] to-[#fd8a00] p-6 text-white shadow-xl">
        <h2 className="text-2xl font-bold">VC Pool Admin Management</h2>
        <p className="mt-1 text-sm text-white/90">
          Super admin can create and delete VC pool admins with password confirmation.
        </p>
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard label="Total Admins" value={admins.length} />
        <SummaryCard label="VC Pool Admins" value={activeAdmins} />
        <SummaryCard
          label="Super Admins"
          value={admins.filter((a) => a.is_super_admin).length}
        />
      </div>

      <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-4">
        <h3 className="text-base font-semibold text-white">Create VC Pool Admin</h3>
        <form onSubmit={onCreate} className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            required
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            className="rounded-lg border border-[--color-border] bg-[--color-surface-alt] px-3 py-2 text-sm text-white outline-none focus:border-[#fc4f02]"
          />
          <input
            type="text"
            placeholder="Full name (optional)"
            value={form.full_name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, full_name: e.target.value }))
            }
            className="rounded-lg border border-[--color-border] bg-[--color-surface-alt] px-3 py-2 text-sm text-white outline-none focus:border-[#fc4f02]"
          />
          <input
            required
            minLength={8}
            type="password"
            placeholder="New admin password"
            value={form.password}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, password: e.target.value }))
            }
            className="rounded-lg border border-[--color-border] bg-[--color-surface-alt] px-3 py-2 text-sm text-white outline-none focus:border-[#fc4f02]"
          />
          <input
            required
            type="password"
            placeholder="Your current password"
            value={form.currentPassword}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, currentPassword: e.target.value }))
            }
            className="rounded-lg border border-[--color-border] bg-[--color-surface-alt] px-3 py-2 text-sm text-white outline-none focus:border-[#fc4f02]"
          />
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[#fc4f02] px-4 py-2 text-sm font-semibold text-white hover:bg-[#e84700] disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create VC Pool Admin"}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-4">
        <h3 className="text-base font-semibold text-white">VC Pool Admins</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-[--color-border] text-sm">
            <thead>
              <tr className="text-left text-slate-300">
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Created</th>
                <th className="px-3 py-2">Active Pools</th>
                <th className="px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[--color-border]">
              {admins.map((admin) => (
                <tr key={admin.admin_id} className="text-white/90">
                  <td className="px-3 py-2">{admin.full_name || "—"}</td>
                  <td className="px-3 py-2">{admin.email}</td>
                  <td className="px-3 py-2">
                    {admin.is_super_admin ? "SUPER ADMIN" : "VC POOL ADMIN"}
                  </td>
                  <td className="px-3 py-2">{formatDate(admin.created_at)}</td>
                  <td className="px-3 py-2">{admin.active_pools_count}</td>
                  <td className="px-3 py-2">
                    {admin.is_super_admin ? (
                      <span className="text-xs text-slate-400">Protected</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(admin)}
                        className="rounded-md bg-red-500/20 px-2 py-1 text-xs font-semibold text-red-300 hover:bg-red-500/30"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {admins.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-400">No admins found.</p>
          )}
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-[1px] px-4">
          <div className="w-full max-w-md rounded-xl border border-slate-700 bg-[#0b111a] p-5 shadow-2xl">
            <h4 className="text-lg font-semibold text-white">Delete VC Pool Admin</h4>
            <p className="mt-2 text-sm text-slate-300">
              Enter your current password to delete {deleteTarget.email}.
            </p>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Current password"
              className="mt-4 w-full rounded-lg border border-[--color-border] bg-[--color-surface-alt] px-3 py-2 text-sm text-white outline-none focus:border-[#fc4f02]"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteTarget(null);
                  setDeletePassword("");
                }}
                className="rounded-lg border border-[--color-border] px-3 py-2 text-sm text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!deletePassword || deletingId === deleteTarget.admin_id}
                onClick={onDelete}
                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {deletingId === deleteTarget.admin_id ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[#fc4f02]/20 bg-gradient-to-br from-[#fc4f02]/20 to-[#fda300]/10 p-4">
      <p className="text-xs text-slate-300">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
