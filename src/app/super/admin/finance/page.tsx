"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  adminSuperUnifiedFinance,
  type SuperAdminUnifiedFinanceFilters,
  type SuperAdminFinanceGroup,
  type SuperAdminUnifiedFinanceResponse,
} from "@/lib/api/vcpool-admin";
import { Notification, useNotification } from "@/components/common/notification";

function formatMoney(value: number): string {
  if (!Number.isFinite(value)) return "$0";
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function prettyKey(key: string): string {
  return key
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function SuperAdminFinancePage() {
  const { notification, showNotification, hideNotification } = useNotification();
  const currentYear = new Date().getFullYear();

  const [loading, setLoading] = useState(true);
  const [headerLoading, setHeaderLoading] = useState(false);
  const [groupLoadingKey, setGroupLoadingKey] = useState<null | "SUBSCRIPTION" | "VC_POOL_COLLECTIONS">(null);
  const [refreshing, setRefreshing] = useState(false);
  const [year, setYear] = useState<number>(currentYear);
  const [planTier, setPlanTier] = useState<"ALL" | "PRO" | "ELITE">("ALL");
  const [billingPeriod, setBillingPeriod] = useState<
    "ALL" | "MONTHLY" | "QUARTERLY" | "YEARLY"
  >("ALL");
  const [vcCollectionSource, setVcCollectionSource] = useState<
    "ALL" | "JOIN" | "CANCEL" | "COMPLETION"
  >("ALL");
  const [data, setData] = useState<SuperAdminUnifiedFinanceResponse | null>(null);

  const groups = useMemo<SuperAdminFinanceGroup[]>(() => data?.groups ?? [], [data]);
  const subscriptionGroup = useMemo(
    () => groups.find((group) => group.key === "SUBSCRIPTION") ?? null,
    [groups]
  );
  const vcCollectionsGroup = useMemo(
    () => groups.find((group) => group.key === "VC_POOL_COLLECTIONS") ?? null,
    [groups]
  );
  const otherGroups = useMemo(
    () => groups.filter((group) => group.key !== "SUBSCRIPTION" && group.key !== "VC_POOL_COLLECTIONS"),
    [groups]
  );
  const availableYears = useMemo(() => {
    const years = data?.available_years ?? [];
    return years.length ? years : [currentYear];
  }, [data, currentYear]);

  const buildFilters = (overrides?: Partial<SuperAdminUnifiedFinanceFilters> & {
    planTier?: "ALL" | "PRO" | "ELITE";
    billingPeriod?: "ALL" | "MONTHLY" | "QUARTERLY" | "YEARLY";
    vcCollectionSource?: "ALL" | "JOIN" | "CANCEL" | "COMPLETION";
  }): SuperAdminUnifiedFinanceFilters => {
    const nextYear = overrides?.year ?? year;
    const nextPlanTier = overrides?.planTier ?? planTier;
    const nextBillingPeriod = overrides?.billingPeriod ?? billingPeriod;
    const nextVcCollectionSource = overrides?.vcCollectionSource ?? vcCollectionSource;

    return {
      year: nextYear,
      ...(nextPlanTier !== "ALL" ? { plan_tier: nextPlanTier } : {}),
      ...(nextBillingPeriod !== "ALL" ? { billing_period: nextBillingPeriod } : {}),
      ...(nextVcCollectionSource !== "ALL"
        ? { vc_collection_source: nextVcCollectionSource }
        : {}),
    };
  };

  const loadData = async (
    filters: SuperAdminUnifiedFinanceFilters,
    options?: { loadingGroup?: "SUBSCRIPTION" | "VC_POOL_COLLECTIONS"; header?: boolean }
  ) => {
    if (options?.loadingGroup) {
      setGroupLoadingKey(options.loadingGroup);
    }
    if (options?.header) {
      setHeaderLoading(true);
    }

    try {
      const res = await adminSuperUnifiedFinance(filters);
      setData(res);
      return res;
    } finally {
      if (options?.loadingGroup) {
        setGroupLoadingKey(null);
      }
      if (options?.header) {
        setHeaderLoading(false);
      }
    }
  };

  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      try {
        const res = await loadData(buildFilters({ year: currentYear }));
        if (!cancelled && res) {
          setYear(res.filters.year);
          setPlanTier(res.filters.plan_tier);
          setBillingPeriod(res.filters.billing_period);
          setVcCollectionSource(res.filters.vc_collection_source);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          showNotification(
            (err as { message?: string })?.message ?? "Failed to load unified finance",
            "error"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    boot();

    return () => {
      cancelled = true;
    };
    // AdminGuard in super layout already validates auth/role.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData(buildFilters());
      showNotification("Unified finance refreshed", "success");
    } catch (err: unknown) {
      showNotification((err as { message?: string })?.message ?? "Failed to refresh", "error");
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#fc4f02] border-t-transparent" />
      </div>
    );
  }

  const overview = data?.overview;

  const onYearChange = async (nextYear: number) => {
    setYear(nextYear);
    try {
      await loadData(buildFilters({ year: nextYear }), { header: true });
    } catch (err: unknown) {
      showNotification((err as { message?: string })?.message ?? "Failed to apply year filter", "error");
    }
  };

  const onSubscriptionFilterChange = async (next: {
    planTier?: "ALL" | "PRO" | "ELITE";
    billingPeriod?: "ALL" | "MONTHLY" | "QUARTERLY" | "YEARLY";
  }) => {
    const nextPlanTier = next.planTier ?? planTier;
    const nextBillingPeriod = next.billingPeriod ?? billingPeriod;
    setPlanTier(nextPlanTier);
    setBillingPeriod(nextBillingPeriod);

    try {
      await loadData(
        buildFilters({ planTier: nextPlanTier, billingPeriod: nextBillingPeriod }),
        { loadingGroup: "SUBSCRIPTION" }
      );
    } catch (err: unknown) {
      showNotification((err as { message?: string })?.message ?? "Failed to apply subscription filter", "error");
    }
  };

  const onVcCollectionSourceChange = async (
    nextSource: "ALL" | "JOIN" | "CANCEL" | "COMPLETION"
  ) => {
    setVcCollectionSource(nextSource);
    try {
      await loadData(buildFilters({ vcCollectionSource: nextSource }), {
        loadingGroup: "VC_POOL_COLLECTIONS",
      });
    } catch (err: unknown) {
      showNotification((err as { message?: string })?.message ?? "Failed to apply VC collection filter", "error");
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

      <div className="rounded-2xl bg-gradient-to-br from-[#fc4f02] via-[#fd6a00] to-[#fd8a00] p-6 text-white shadow-xl">
        <h2 className="text-2xl font-bold">Unified Finance</h2>
        <p className="mt-1 text-sm text-white/90">
          Subscription, trade fees, and VC pool collections are active in this view.
        </p>
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
        <OverviewCard label="Total Inflow" value={formatMoney(overview?.total_inflow ?? 0)} />
        <OverviewCard label="Total Outflow" value={formatMoney(overview?.total_outflow ?? 0)} />
        <OverviewCard
          label="Net Revenue"
          value={formatMoney(overview?.net_revenue ?? 0)}
          valueClassName={(overview?.net_revenue ?? 0) >= 0 ? "text-green-300" : "text-red-300"}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <label className="flex max-w-[220px] flex-col gap-1 text-xs text-slate-300">
          Year
          <select
            value={year}
            onChange={(e) => onYearChange(Number(e.target.value))}
            disabled={headerLoading}
            className="rounded-lg border border-[--color-border] bg-[--color-surface] px-3 py-2 text-sm text-white outline-none focus:border-[#fc4f02]"
          >
            {availableYears.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        {headerLoading && <span className="text-xs text-slate-400">Updating year...</span>}

        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="rounded-lg bg-[#fc4f02] px-4 py-2 text-sm font-semibold text-white hover:bg-[#e84700] disabled:opacity-50"
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {subscriptionGroup && (
        <section className="relative rounded-xl border border-[--color-border] bg-[--color-surface] p-4">
          {groupLoadingKey === "SUBSCRIPTION" && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-black/45 backdrop-blur-[1px]">
              <div className="rounded-lg border border-[#fc4f02]/50 bg-black/70 px-3 py-2 text-xs font-semibold text-orange-200">
                Loading subscription data...
              </div>
            </div>
          )}

          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <h3 className="rounded-full border border-[#fc4f02]/35 bg-[#fc4f02]/10 px-4 py-1.5 text-base font-semibold tracking-wide text-[#ffb489] shadow-[0_0_0_1px_rgba(252,79,2,0.08)]">
                {subscriptionGroup.title}
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex min-w-[160px] flex-col gap-1 text-xs text-slate-300">
                Plan Tier
                <select
                  value={planTier}
                  onChange={(e) =>
                    onSubscriptionFilterChange({
                      planTier: e.target.value as "ALL" | "PRO" | "ELITE",
                    })
                  }
                  disabled={groupLoadingKey === "SUBSCRIPTION"}
                  className="rounded-lg border border-[--color-border] bg-[--color-surface] px-3 py-2 text-sm text-white outline-none focus:border-[#fc4f02]"
                >
                  <option value="ALL">All</option>
                  <option value="PRO">Pro</option>
                  <option value="ELITE">Elite</option>
                </select>
              </label>

              <label className="flex min-w-[180px] flex-col gap-1 text-xs text-slate-300">
                Billing Period
                <select
                  value={billingPeriod}
                  onChange={(e) =>
                    onSubscriptionFilterChange({
                      billingPeriod: e.target.value as "ALL" | "MONTHLY" | "QUARTERLY" | "YEARLY",
                    })
                  }
                  disabled={groupLoadingKey === "SUBSCRIPTION"}
                  className="rounded-lg border border-[--color-border] bg-[--color-surface] px-3 py-2 text-sm text-white outline-none focus:border-[#fc4f02]"
                >
                  <option value="ALL">All</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="YEARLY">Yearly</option>
                </select>
              </label>
            </div>
          </div>

          <div className="mb-4 grid gap-2 grid-cols-2">
            {Object.entries(subscriptionGroup.summary).map(([key, value]) => (
              <div
                key={key}
                className="rounded-lg border border-[--color-border] bg-[--color-surface-alt]/70 px-3 py-2"
              >
                <p className="text-[11px] uppercase tracking-wide text-slate-400">{prettyKey(key)}</p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {key.includes("amount")
                    ? formatMoney(Number(value ?? 0))
                    : Number(value ?? 0).toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          <div className="h-52 rounded-lg border border-[--color-border] bg-[--color-surface-alt]/40 p-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={subscriptionGroup.chart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid rgba(148,163,184,0.25)",
                    borderRadius: 10,
                    color: "#f8fafc",
                  }}
                  formatter={(value) => [formatMoney(Number(value ?? 0)), "Value"]}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#fc4f02"
                  strokeWidth={3}
                  dot={{ r: 3, fill: "#fd8a00" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {vcCollectionsGroup && (
        <section className="relative rounded-xl border border-[--color-border] bg-[--color-surface] p-4">
          {groupLoadingKey === "VC_POOL_COLLECTIONS" && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-black/45 backdrop-blur-[1px]">
              <div className="rounded-lg border border-[#fc4f02]/50 bg-black/70 px-3 py-2 text-xs font-semibold text-orange-200">
                Loading VC collection data...
              </div>
            </div>
          )}

          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <h3 className="rounded-full border border-[#fc4f02]/35 bg-[#fc4f02]/10 px-4 py-1.5 text-base font-semibold tracking-wide text-[#ffb489] shadow-[0_0_0_1px_rgba(252,79,2,0.08)]">
                {vcCollectionsGroup.title}
              </h3>
            </div>

            <label className="flex min-w-[180px] flex-col gap-1 text-xs text-slate-300">
              Source
              <select
                value={vcCollectionSource}
                onChange={(e) =>
                  onVcCollectionSourceChange(
                    e.target.value as "ALL" | "JOIN" | "CANCEL" | "COMPLETION"
                  )
                }
                disabled={groupLoadingKey === "VC_POOL_COLLECTIONS"}
                className="rounded-lg border border-[--color-border] bg-[--color-surface] px-3 py-2 text-sm text-white outline-none focus:border-[#fc4f02]"
              >
                <option value="ALL">All Sources</option>
                <option value="JOIN">Join Fees</option>
                <option value="CANCEL">Exit Fees</option>
                <option value="COMPLETION">Completion Profit Fees</option>
              </select>
            </label>
          </div>

          <div className="mb-4 grid gap-2 grid-cols-2">
            {Object.entries(vcCollectionsGroup.summary).map(([key, value]) => (
              <div
                key={key}
                className="rounded-lg border border-[--color-border] bg-[--color-surface-alt]/70 px-3 py-2"
              >
                <p className="text-[11px] uppercase tracking-wide text-slate-400">{prettyKey(key)}</p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {key.includes("amount")
                    ? formatMoney(Number(value ?? 0))
                    : Number(value ?? 0).toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          <div className="h-52 rounded-lg border border-[--color-border] bg-[--color-surface-alt]/40 p-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={vcCollectionsGroup.chart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid rgba(148,163,184,0.25)",
                    borderRadius: 10,
                    color: "#f8fafc",
                  }}
                  formatter={(value) => [formatMoney(Number(value ?? 0)), "Value"]}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#fc4f02"
                  strokeWidth={3}
                  dot={{ r: 3, fill: "#fd8a00" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      <div className="grid gap-5 grid-cols-1 xl:grid-cols-2">
        {otherGroups.map((group) => (
          <section
            key={group.key}
            className={`rounded-xl border border-[--color-border] bg-[--color-surface] p-4 ${
              group.key === "TRADE_FEES" ? "xl:col-span-2" : ""
            }`}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="rounded-full border border-[#fc4f02]/35 bg-[#fc4f02]/10 px-4 py-1.5 text-base font-semibold tracking-wide text-[#ffb489] shadow-[0_0_0_1px_rgba(252,79,2,0.08)]">
                  {group.title}
                </h3>
              </div>

            </div>

            <div className="mb-4 grid gap-2 grid-cols-2">
              {Object.entries(group.summary).map(([key, value]) => (
                <div
                  key={key}
                  className="rounded-lg border border-[--color-border] bg-[--color-surface-alt]/70 px-3 py-2"
                >
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">
                    {prettyKey(key)}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {key.includes("amount") || key.includes("deposits") || key.includes("withdrawals") || key.includes("movement")
                      ? formatMoney(Number(value))
                      : Number(value).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            <div className="h-52 rounded-lg border border-[--color-border] bg-[--color-surface-alt]/40 p-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={group.chart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid rgba(148,163,184,0.25)",
                      borderRadius: 10,
                      color: "#f8fafc",
                    }}
                    formatter={(value) => [formatMoney(Number(value ?? 0)), "Value"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#fc4f02"
                    strokeWidth={3}
                    dot={{ r: 3, fill: "#fd8a00" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function OverviewCard({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-xl border border-[#fc4f02]/20 bg-gradient-to-br from-[#fc4f02]/20 to-[#fda300]/10 p-4">
      <p className="text-xs text-slate-300">{label}</p>
      <p className={`mt-1 text-2xl font-bold text-white ${valueClassName ?? ""}`}>{value}</p>
    </div>
  );
}
