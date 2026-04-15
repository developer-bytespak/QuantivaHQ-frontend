"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  adminMe,
  adminSuperLookupUser,
  adminSuperUpgradeUserSubscription,
} from "@/lib/api/vcpool-admin";
import { useNotification, Notification } from "@/components/common/notification";
import type {
  PlanTier,
  BillingPeriod,
  AdminSuperUpgradeSubscriptionResponse,
} from "@/lib/api/vcpool-admin/types";

const ALL_PLAN_OPTIONS: { value: PlanTier; label: string; description: string }[] = [
  { value: "FREE", label: "Free", description: "Basic access, limited features" },
  { value: "PRO", label: "Pro", description: "Advanced features for active traders" },
  { value: "ELITE", label: "Elite", description: "Full access to all features" },
  { value: "ELITE_PLUS", label: "Elite Plus", description: "Premium tier — not available for US users" },
];

const BILLING_OPTIONS: { value: BillingPeriod; label: string }[] = [
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "YEARLY", label: "Yearly" },
];

type LookupStatus = "idle" | "loading" | "found-us" | "found-non-us" | "not-found";

export default function SuperAdminUpgradePlanPage() {
  const router = useRouter();
  const { notification, showNotification, hideNotification } = useNotification();

  const [authChecked, setAuthChecked] = useState(false);
  const [email, setEmail] = useState("");
  const [tier, setTier] = useState<PlanTier>("PRO");
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("MONTHLY");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AdminSuperUpgradeSubscriptionResponse | null>(null);
  const [lookupStatus, setLookupStatus] = useState<LookupStatus>("idle");
  const [lookupUsername, setLookupUsername] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Whether the detected user is a US user
  const isUsUser = lookupStatus === "found-us";

  // Visible plans — hide Elite Plus for US users
  const visiblePlans = isUsUser
    ? ALL_PLAN_OPTIONS.filter((o) => o.value !== "ELITE_PLUS")
    : ALL_PLAN_OPTIONS;

  useEffect(() => {
    adminMe()
      .then((me) => {
        if (!me.is_super_admin) {
          router.replace("/super/admin/login");
        } else {
          setAuthChecked(true);
        }
      })
      .catch(() => {
        router.replace("/super/admin/login");
      });
  }, [router]);

  // Auto-switch away from Elite Plus if user turns out to be US
  useEffect(() => {
    if (isUsUser && tier === "ELITE_PLUS") {
      setTier("ELITE");
    }
  }, [isUsUser, tier]);

  // Debounced email lookup
  useEffect(() => {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setLookupStatus("idle");
      setLookupUsername(null);
      return;
    }

    setLookupStatus("loading");
    setLookupUsername(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await adminSuperLookupUser(trimmed);
        if (!res.found) {
          setLookupStatus("not-found");
          setLookupUsername(null);
        } else {
          setLookupStatus(res.is_us_user ? "found-us" : "found-non-us");
          setLookupUsername(res.username ?? null);
        }
      } catch {
        setLookupStatus("idle");
        setLookupUsername(null);
      }
    }, 600);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      showNotification("Please enter a user email", "error");
      return;
    }
    if (lookupStatus === "not-found") {
      showNotification("No user found with this email", "error");
      return;
    }
    setResult(null);
    setSubmitting(true);
    try {
      const res = await adminSuperUpgradeUserSubscription({
        email: email.trim().toLowerCase(),
        tier,
        billing_period: billingPeriod,
      });
      setResult(res);
      showNotification(res.message, "success");
    } catch (err: unknown) {
      showNotification((err as { message?: string })?.message ?? "Upgrade failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!authChecked) {
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

      <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-6">
        <h2 className="text-lg font-semibold text-white mb-2">Upgrade User Subscription</h2>
        <p className="text-sm text-slate-400 mb-6">
          Override a user&apos;s current subscription plan. This will cancel any existing active subscription
          and create a new one with the selected plan and billing period.
        </p>

        {/* US restriction warning */}
        <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-start gap-3">
            <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-amber-400">US User Restriction</p>
              <p className="mt-0.5 text-sm text-amber-300/80">
                The <strong>Elite Plus</strong> plan is <strong>not available</strong> for US users.
                Do not assign this plan to users from the United States.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              User Email <span className="text-[#fc4f02]">*</span>
            </label>
            <input
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setResult(null); }}
              disabled={submitting}
              className="w-full rounded-xl border border-[--color-border] bg-[--color-background] px-4 py-2.5 text-white placeholder-slate-500 focus:border-[#fc4f02] focus:outline-none focus:ring-1 focus:ring-[#fc4f02] disabled:opacity-50"
            />

            {/* Lookup feedback */}
            {lookupStatus === "loading" && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                Looking up user…
              </p>
            )}
            {lookupStatus === "not-found" && (
              <p className="mt-1.5 text-xs text-red-400">No user found with this email.</p>
            )}
            {lookupStatus === "found-non-us" && (
              <p className="mt-1.5 text-xs text-green-400">
                ✓ User found{lookupUsername ? ` — @${lookupUsername}` : ""}. All plans available.
              </p>
            )}
            {lookupStatus === "found-us" && (
              <p className="mt-1.5 text-xs text-amber-400">
                ⚠ US user detected{lookupUsername ? ` — @${lookupUsername}` : ""}. Elite Plus is hidden.
              </p>
            )}
          </div>

          {/* Plan Tier */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Plan</label>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {visiblePlans.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTier(opt.value)}
                  disabled={submitting}
                  className={`rounded-xl border px-4 py-3 text-left transition-colors disabled:opacity-50 ${
                    tier === opt.value
                      ? "border-[#fc4f02] bg-[#fc4f02]/10 text-white"
                      : "border-[--color-border] bg-[--color-background] text-slate-300 hover:border-slate-500"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{opt.label}</span>
                    {tier === opt.value && (
                      <svg className="h-4 w-4 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">{opt.description}</p>
                  {opt.value === "ELITE_PLUS" && (
                    <span className="mt-1 inline-block rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-400">
                      Not for US users
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Billing Period */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Billing Period</label>
            <div className="flex gap-3">
              {BILLING_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setBillingPeriod(opt.value)}
                  disabled={submitting}
                  className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                    billingPeriod === opt.value
                      ? "border-[#fc4f02] bg-[#fc4f02]/10 text-white"
                      : "border-[--color-border] bg-[--color-background] text-slate-300 hover:border-slate-500"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !email.trim() || lookupStatus === "not-found" || lookupStatus === "loading"}
            className="w-full rounded-xl bg-[#fc4f02] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Upgrading…
              </span>
            ) : (
              "Upgrade Subscription"
            )}
          </button>
        </form>
      </div>

      {/* Result */}
      {result && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-base font-semibold text-green-400">Subscription Updated Successfully</h3>
          </div>

          {/* User info */}
          <div className="rounded-lg border border-[--color-border] bg-[--color-background] p-4 space-y-2">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">User Details</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <span className="text-xs text-slate-500">Email</span>
                <p className="text-sm text-white">{result.user.email}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Username</span>
                <p className="text-sm text-white">{result.user.username}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Previous Plan</span>
                <p className="text-sm font-medium text-slate-300">{result.user.previous_tier}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500">New Plan</span>
                <p className="text-sm font-semibold text-[#fc4f02]">{result.user.new_tier}</p>
              </div>
            </div>
          </div>

          {/* Subscription info */}
          <div className="rounded-lg border border-[--color-border] bg-[--color-background] p-4 space-y-2">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Subscription Details</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <span className="text-xs text-slate-500">Status</span>
                <p className="text-sm text-white capitalize">{result.subscription.status}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Billing Period</span>
                <p className="text-sm text-white capitalize">{result.subscription.billing_period.toLowerCase()}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Start Date</span>
                <p className="text-sm text-white">
                  {new Date(result.subscription.current_period_start).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-500">End Date</span>
                <p className="text-sm text-white">
                  {new Date(result.subscription.current_period_end).toLocaleDateString()}
                </p>
              </div>
              <div className="sm:col-span-2">
                <span className="text-xs text-slate-500">Subscription ID</span>
                <p className="text-xs text-slate-400 font-mono break-all">{result.subscription.subscription_id}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


const PLAN_OPTIONS: { value: PlanTier; label: string; description: string }[] = [
  { value: "FREE", label: "Free", description: "Basic access, limited features" },
  { value: "PRO", label: "Pro", description: "Advanced features for active traders" },
  { value: "ELITE", label: "Elite", description: "Full access — not available on Binance.US" },
  { value: "ELITE_PLUS", label: "Elite Plus", description: "Premium tier — not available on Binance.US" },
];

const BILLING_OPTIONS: { value: BillingPeriod; label: string }[] = [
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "YEARLY", label: "Yearly" },
];

export default function SuperAdminUpgradePlanPage() {
  const router = useRouter();
  const { notification, showNotification, hideNotification } = useNotification();

  const [authChecked, setAuthChecked] = useState(false);
  const [email, setEmail] = useState("");
  const [tier, setTier] = useState<PlanTier>("PRO");
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("MONTHLY");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AdminSuperUpgradeSubscriptionResponse | null>(null);

  useEffect(() => {
    adminMe()
      .then((me) => {
        if (!me.is_super_admin) {
          router.replace("/super/admin/login");
        } else {
          setAuthChecked(true);
        }
      })
      .catch(() => {
        router.replace("/super/admin/login");
      });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      showNotification("Please enter a user email", "error");
      return;
    }
    setResult(null);
    setSubmitting(true);
    try {
      const res = await adminSuperUpgradeUserSubscription({
        email: email.trim().toLowerCase(),
        tier,
        billing_period: billingPeriod,
      });
      setResult(res);
      showNotification(res.message, "success");
    } catch (err: unknown) {
      showNotification((err as { message?: string })?.message ?? "Upgrade failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!authChecked) {
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

      <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-6">
        <h2 className="text-lg font-semibold text-white mb-2">Upgrade User Subscription</h2>
        <p className="text-sm text-slate-400 mb-6">
          Override a user&apos;s current subscription plan. This will cancel any existing active subscription
          and create a new one with the selected plan and billing period.
        </p>

        {/* Binance.US warning */}
        <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-start gap-3">
            <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-amber-400">Binance.US Restriction</p>
              <p className="mt-0.5 text-sm text-amber-300/80">
                The <strong>Elite</strong> plan is <strong>not available</strong> on Binance.US. Do not assign this
                plan to users registered on Binance.US.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              User Email <span className="text-[#fc4f02]">*</span>
            </label>
            <input
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              className="w-full rounded-xl border border-[--color-border] bg-[--color-background] px-4 py-2.5 text-white placeholder-slate-500 focus:border-[#fc4f02] focus:outline-none focus:ring-1 focus:ring-[#fc4f02] disabled:opacity-50"
            />
          </div>

          {/* Plan Tier */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Plan</label>
            <div className="grid gap-3 sm:grid-cols-3">
              {PLAN_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTier(opt.value)}
                  disabled={submitting}
                  className={`rounded-xl border px-4 py-3 text-left transition-colors disabled:opacity-50 ${
                    tier === opt.value
                      ? "border-[#fc4f02] bg-[#fc4f02]/10 text-white"
                      : "border-[--color-border] bg-[--color-background] text-slate-300 hover:border-slate-500"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{opt.label}</span>
                    {tier === opt.value && (
                      <svg className="h-4 w-4 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">{opt.description}</p>
                  {( opt.value === "ELITE_PLUS") && (
                    <span className="mt-1 inline-block rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-400">
                      Not on Binance.US
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Billing Period */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Billing Period</label>
            <div className="flex gap-3">
              {BILLING_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setBillingPeriod(opt.value)}
                  disabled={submitting}
                  className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                    billingPeriod === opt.value
                      ? "border-[#fc4f02] bg-[#fc4f02]/10 text-white"
                      : "border-[--color-border] bg-[--color-background] text-slate-300 hover:border-slate-500"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !email.trim()}
            className="w-full rounded-xl bg-[#fc4f02] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Upgrading…
              </span>
            ) : (
              "Upgrade Subscription"
            )}
          </button>
        </form>
      </div>

      {/* Result */}
      {result && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-base font-semibold text-green-400">Subscription Updated Successfully</h3>
          </div>

          {/* User info */}
          <div className="rounded-lg border border-[--color-border] bg-[--color-background] p-4 space-y-2">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">User Details</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <span className="text-xs text-slate-500">Email</span>
                <p className="text-sm text-white">{result.user.email}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Username</span>
                <p className="text-sm text-white">{result.user.username}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Previous Plan</span>
                <p className="text-sm font-medium text-slate-300">{result.user.previous_tier}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500">New Plan</span>
                <p className="text-sm font-semibold text-[#fc4f02]">{result.user.new_tier}</p>
              </div>
            </div>
          </div>

          {/* Subscription info */}
          <div className="rounded-lg border border-[--color-border] bg-[--color-background] p-4 space-y-2">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Subscription Details</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <span className="text-xs text-slate-500">Status</span>
                <p className="text-sm text-white capitalize">{result.subscription.status}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Billing Period</span>
                <p className="text-sm text-white capitalize">{result.subscription.billing_period.toLowerCase()}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Start Date</span>
                <p className="text-sm text-white">
                  {new Date(result.subscription.current_period_start).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-500">End Date</span>
                <p className="text-sm text-white">
                  {new Date(result.subscription.current_period_end).toLocaleDateString()}
                </p>
              </div>
              <div className="sm:col-span-2">
                <span className="text-xs text-slate-500">Subscription ID</span>
                <p className="text-xs text-slate-400 font-mono break-all">{result.subscription.subscription_id}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
