"use client";

import { useEffect, useState } from "react";
import { AffiliateAdminTabs } from "@/components/affiliate/affiliate-admin-tabs";
import {
  superGetAffiliateProgramSettings,
  superUpdateAffiliateProgramSettings,
  type ProgramSettings,
} from "@/lib/api/vcpool-admin/affiliates";

export default function SuperAffiliateSettingsPage() {
  const [current, setCurrent] = useState<ProgramSettings | null>(null);
  const [form, setForm] = useState<{
    subscription_commission_pct: string;
    recurring_months_cap: string;
    attribution_window_days: string;
    refund_clawback_days: string;
    payout_threshold_usd: string;
    payout_cycle: "MONTHLY" | "QUARTERLY";
    premium_tier_multiplier: string;
    affiliate_signup_velocity_24h: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    try {
      const s = await superGetAffiliateProgramSettings();
      setCurrent(s);
      setForm({
        subscription_commission_pct: String(Number(s.subscription_commission_pct)),
        recurring_months_cap: String(s.recurring_months_cap),
        attribution_window_days: String(s.attribution_window_days),
        refund_clawback_days: String(s.refund_clawback_days),
        payout_threshold_usd: String(Number(s.payout_threshold_usd)),
        payout_cycle: s.payout_cycle as "MONTHLY" | "QUARTERLY",
        premium_tier_multiplier: String(Number(s.premium_tier_multiplier)),
        affiliate_signup_velocity_24h: String(s.affiliate_signup_velocity_24h),
      });
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? "Failed to load");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const next = await superUpdateAffiliateProgramSettings({
        subscription_commission_pct: Number(form.subscription_commission_pct),
        recurring_months_cap: Number(form.recurring_months_cap),
        attribution_window_days: Number(form.attribution_window_days),
        refund_clawback_days: Number(form.refund_clawback_days),
        payout_threshold_usd: Number(form.payout_threshold_usd),
        payout_cycle: form.payout_cycle,
        premium_tier_multiplier: Number(form.premium_tier_multiplier),
        affiliate_signup_velocity_24h: Number(form.affiliate_signup_velocity_24h),
      });
      setSuccess(`Saved as version ${next.version}.`);
      setCurrent(next);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <AffiliateAdminTabs />

      <div className="mb-4 text-xs text-slate-500">
        Settings are versioned — saving creates a new active row; past
        commission events keep the rate they were stamped with.
      </div>

      {current && (
        <div className="mb-4 text-xs text-slate-500">
          Active version: <span className="text-slate-200">v{current.version}</span> ·
          updated{" "}
          <span className="text-slate-200">
            {current.created_at.slice(0, 10)}
          </span>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          {success}
        </div>
      )}

      {form && (
        <form
          onSubmit={onSubmit}
          className="rounded-xl border border-slate-800/80 bg-gradient-to-b from-[#0b1220] to-[#070d17] p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField
              label="Subscription commission %"
              hint="Fraction (0.20 = 20%)"
              value={form.subscription_commission_pct}
              onChange={(v) =>
                setForm((p) => p && { ...p, subscription_commission_pct: v })
              }
              step="0.01"
              min="0"
              max="1"
            />
            <NumberField
              label="Recurring months cap"
              hint="0 = unlimited"
              value={form.recurring_months_cap}
              onChange={(v) =>
                setForm((p) => p && { ...p, recurring_months_cap: v })
              }
              step="1"
              min="0"
              max="120"
            />
            <NumberField
              label="Attribution window (days)"
              value={form.attribution_window_days}
              onChange={(v) =>
                setForm((p) => p && { ...p, attribution_window_days: v })
              }
              step="1"
              min="1"
              max="365"
            />
            <NumberField
              label="Refund clawback window (days)"
              value={form.refund_clawback_days}
              onChange={(v) =>
                setForm((p) => p && { ...p, refund_clawback_days: v })
              }
              step="1"
              min="0"
              max="365"
            />
            <NumberField
              label="Payout threshold (USD)"
              value={form.payout_threshold_usd}
              onChange={(v) =>
                setForm((p) => p && { ...p, payout_threshold_usd: v })
              }
              step="0.01"
              min="0"
            />
            <Field label="Payout cycle">
              <select
                value={form.payout_cycle}
                onChange={(e) =>
                  setForm((p) =>
                    p && {
                      ...p,
                      payout_cycle: e.target.value as "MONTHLY" | "QUARTERLY",
                    },
                  )
                }
                className={inputCls}
              >
                <option value="MONTHLY">MONTHLY</option>
                <option value="QUARTERLY">QUARTERLY</option>
              </select>
            </Field>
            <NumberField
              label="Premium tier multiplier"
              hint="e.g. 1.5×"
              value={form.premium_tier_multiplier}
              onChange={(v) =>
                setForm((p) => p && { ...p, premium_tier_multiplier: v })
              }
              step="0.1"
              min="0.1"
              max="10"
            />
            <NumberField
              label="Signup velocity flag (per 24h)"
              hint="Auto-flag if more than this many signups in 24h"
              value={form.affiliate_signup_velocity_24h}
              onChange={(v) =>
                setForm((p) => p && { ...p, affiliate_signup_velocity_24h: v })
              }
              step="1"
              min="1"
              max="10000"
            />
          </div>

          <div className="mt-6 flex items-center gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save as new version"}
            </button>
            <button
              type="button"
              onClick={load}
              disabled={saving}
              className="rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:text-white"
            >
              Reset
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

const inputCls =
  "w-full rounded-md border border-slate-700 bg-[#070d17] px-3 py-2 text-sm text-white focus:border-[#fc4f02] focus:outline-none";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-300">
        {label}
      </label>
      {hint && <p className="text-[11px] text-slate-500">{hint}</p>}
      <div className="mt-1">{children}</div>
    </div>
  );
}

function NumberField({
  label,
  hint,
  value,
  onChange,
  step,
  min,
  max,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  step?: string;
  min?: string | number;
  max?: string | number;
}) {
  return (
    <Field label={label} hint={hint}>
      <input
        type="number"
        step={step}
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
      />
    </Field>
  );
}
