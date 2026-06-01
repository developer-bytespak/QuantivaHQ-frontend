"use client";

import { useEffect, useState } from "react";
import { getSettings, updateSettings } from "@/lib/api/affiliate";
import type { AffiliateSettings } from "@/lib/api/affiliate";
import { affiliateSettingsSchema } from "@/lib/validation/affiliate";

const inputCls =
  "w-full rounded-lg border border-slate-700 bg-[#070d17] px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-[#fc4f02] focus:outline-none";

export default function AffiliateSettingsPage() {
  const [settings, setSettings] = useState<AffiliateSettings | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    country: "",
    tax_residency: "",
    payout_instructions: "",
    tax_form_url: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getSettings()
      .then((s) => {
        if (cancelled) return;
        setSettings(s);
        setForm({
          full_name: s.full_name ?? "",
          country: s.country ?? "",
          tax_residency: s.tax_residency ?? "",
          payout_instructions: s.payout_instructions ?? "",
          tax_form_url: s.tax_form_url ?? "",
        });
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError((err as { message?: string })?.message ?? "Failed to load");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const parsed = affiliateSettingsSchema.safeParse({
      full_name: form.full_name || undefined,
      country: form.country || undefined,
      tax_residency: form.tax_residency || undefined,
      payout_instructions: form.payout_instructions || undefined,
      tax_form_url: form.tax_form_url || undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    setSaving(true);
    try {
      const next = await updateSettings(parsed.data);
      setSettings((s) => ({ ...(s as AffiliateSettings), ...next }));
      setSuccess("Settings saved.");
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-800/80 bg-gradient-to-b from-[#0b1220] to-[#070d17] p-5">
        <h2 className="text-lg font-semibold text-white">Account</h2>
        <div className="mt-3 grid gap-2 text-sm">
          <Row label="Email" value={settings?.email ?? "—"} />
          <Row label="Display name" value={settings?.display_name ?? "—"} />
          <Row label="Status" value={settings?.status ?? "—"} />
          <Row
            label="Commission rate"
            value={
              settings?.commission_pct != null
                ? `${(Number(settings.commission_pct) * 100).toFixed(2)}%`
                : "—"
            }
          />
        </div>
        <p className="mt-3 text-xs text-slate-500">
          To change your email or display name, contact the QuantivaHQ team.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-xl border border-slate-800/80 bg-gradient-to-b from-[#0b1220] to-[#070d17] p-5"
      >
        <h2 className="text-lg font-semibold text-white">Profile</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full legal name">
            <input
              value={form.full_name}
              onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
              className={inputCls}
            />
          </Field>
          <Field label="Country">
            <input
              value={form.country}
              onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))}
              className={inputCls}
            />
          </Field>
          <Field label="Tax residency">
            <input
              value={form.tax_residency}
              onChange={(e) =>
                setForm((p) => ({ ...p, tax_residency: e.target.value }))
              }
              className={inputCls}
            />
          </Field>
          <Field label="Tax form URL (W-9 / W-8BEN upload link)">
            <input
              value={form.tax_form_url}
              onChange={(e) =>
                setForm((p) => ({ ...p, tax_form_url: e.target.value }))
              }
              className={inputCls}
              placeholder="https://…"
            />
          </Field>
        </div>

        <Field label="Payout instructions (free-form: how & where to pay you)">
          <textarea
            value={form.payout_instructions}
            onChange={(e) =>
              setForm((p) => ({ ...p, payout_instructions: e.target.value }))
            }
            rows={5}
            className={inputCls}
            placeholder="E.g. Wise transfer to: name, IBAN, BIC — OR PayPal: you@example.com — OR USDT (TRC20) wallet…"
          />
        </Field>

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

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-800/60 py-1.5 last:border-b-0">
      <span className="text-xs uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <span className="text-sm text-slate-200">{value}</span>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-300">
        {label}
      </label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
