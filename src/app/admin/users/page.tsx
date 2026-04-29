"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  adminMe,
  adminSuperListUsers,
  adminSuperUsersAnalytics,
  adminSuperUsersGrowth,
  type SuperAdminUserRow,
  type SuperAdminUsersAnalyticsResponse,
  type SuperAdminUsersGrowthResponse,
} from "@/lib/api/vcpool-admin";
import { Notification, useNotification } from "@/components/common/notification";

const GROWTH_PLAN_OPTIONS = ["ALL", "FREE", "PRO", "ELITE", "ELITE_PLUS"] as const;

type PlanTier = "FREE" | "PRO" | "ELITE" | "ELITE_PLUS";
const PLAN_USERS_PAGE_SIZE = 10;

interface PlanUsersState {
  users: SuperAdminUserRow[];
  page: number;
  totalPages: number;
  total: number;
  loading: boolean;
  error: string | null;
}

const EMPTY_PLAN_USERS_STATE: PlanUsersState = {
  users: [],
  page: 1,
  totalPages: 1,
  total: 0,
  loading: false,
  error: null,
};

export default function AdminUsersPage() {
  const router = useRouter();
  const { notification, showNotification, hideNotification } = useNotification();

  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] =
    useState<SuperAdminUsersAnalyticsResponse | null>(null);
  const [growth, setGrowth] = useState<SuperAdminUsersGrowthResponse | null>(null);
  const [growthLoading, setGrowthLoading] = useState(true);

  const [growthYear, setGrowthYear] = useState<number>(new Date().getFullYear());
  const [growthPlan, setGrowthPlan] =
    useState<(typeof GROWTH_PLAN_OPTIONS)[number]>("ALL");
  const [growthActiveOnly, setGrowthActiveOnly] = useState(false);

  const [expandedPlan, setExpandedPlan] = useState<PlanTier | null>(null);
  const [activePlanIndex, setActivePlanIndex] = useState<number | null>(null);
  const [planUsers, setPlanUsers] = useState<Record<PlanTier, PlanUsersState>>({
    FREE: EMPTY_PLAN_USERS_STATE,
    PRO: EMPTY_PLAN_USERS_STATE,
    ELITE: EMPTY_PLAN_USERS_STATE,
    ELITE_PLUS: EMPTY_PLAN_USERS_STATE,
  });

  const loadPlanUsers = async (plan: PlanTier, page: number) => {
    setPlanUsers((prev) => ({
      ...prev,
      [plan]: { ...prev[plan], loading: true, error: null },
    }));
    try {
      const data = await adminSuperListUsers({
        plan,
        page,
        limit: PLAN_USERS_PAGE_SIZE,
      });
      setPlanUsers((prev) => ({
        ...prev,
        [plan]: {
          users: data.users,
          page: data.pagination.page,
          totalPages: data.pagination.totalPages,
          total: data.pagination.total,
          loading: false,
          error: null,
        },
      }));
    } catch (err: unknown) {
      const message =
        (err as { message?: string })?.message ?? "Failed to load users";
      setPlanUsers((prev) => ({
        ...prev,
        [plan]: { ...prev[plan], loading: false, error: message },
      }));
    }
  };

  const handleTogglePlan = (plan: PlanTier) => {
    if (expandedPlan === plan) {
      setExpandedPlan(null);
      return;
    }
    setExpandedPlan(plan);
    if (planUsers[plan].users.length === 0 && !planUsers[plan].loading) {
      loadPlanUsers(plan, 1);
    }
  };

  const handlePlanPageChange = (plan: PlanTier, nextPage: number) => {
    const state = planUsers[plan];
    if (nextPage < 1 || nextPage > state.totalPages || nextPage === state.page) {
      return;
    }
    loadPlanUsers(plan, nextPage);
  };

  const loadGrowth = async (
    year: number,
    selectedPlan: (typeof GROWTH_PLAN_OPTIONS)[number],
    activeOnly: boolean
  ) => {
    setGrowthLoading(true);
    try {
      const data = await adminSuperUsersGrowth({
        year,
        subscription_plan: selectedPlan === "ALL" ? undefined : selectedPlan,
        active_only: activeOnly,
      });

      setGrowth(data);
      setGrowthYear(data.year);
    } catch (err: unknown) {
      showNotification(
        (err as { message?: string })?.message ??
          "Failed to load growth chart",
        "error"
      );
    } finally {
      setGrowthLoading(false);
    }
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

        const [analyticsData, growthData] = await Promise.all([
          adminSuperUsersAnalytics(),
          adminSuperUsersGrowth({ year: new Date().getFullYear() }),
        ]);

        if (cancelled) return;

        setAnalytics(analyticsData);
        setGrowth(growthData);
        setGrowthYear(growthData.year);
      } catch (err: unknown) {
        if (!cancelled) {
          const message =
            (err as { message?: string })?.message ??
            "Failed to load super admin users page";
          showNotification(message, "error");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setGrowthLoading(false);
        }
      }
    };

    boot();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (loading) return;
    loadGrowth(growthYear, growthPlan, growthActiveOnly);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [growthYear, growthPlan, growthActiveOnly]);

  const planPercentages = useMemo(() => {
    if (!analytics?.summary.total_users) {
      return { free: 0, pro: 0, elite: 0, elite_plus: 0 };
    }

    const total = analytics.summary.total_users;
    return {
      free: Math.round((analytics.plan_distribution.FREE / total) * 100),
      pro: Math.round((analytics.plan_distribution.PRO / total) * 100),
      elite: Math.round((analytics.plan_distribution.ELITE / total) * 100),
      elite_plus: Math.round((analytics.plan_distribution.ELITE_PLUS / total) * 100),
    };
  }, [analytics]);

  const planChartData = useMemo(
    () => [
      {
        name: "FREE",
        value: analytics?.plan_distribution.FREE ?? 0,
        percent: planPercentages.free,
        color: "#94a3b8",
      },
      {
        name: "PRO",
        value: analytics?.plan_distribution.PRO ?? 0,
        percent: planPercentages.pro,
        color: "#3b82f6",
      },
      {
        name: "ELITE",
        value: analytics?.plan_distribution.ELITE ?? 0,
        percent: planPercentages.elite,
        color: "#fc4f02",
      },
      {
        name: "ELITE_PLUS",
        value: analytics?.plan_distribution.ELITE_PLUS ?? 0,
        percent: planPercentages.elite_plus,
        color: "#facc15",
      },
    ],
    [analytics, planPercentages]
  );

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
        <h2 className="text-2xl font-bold">Users Overview</h2>
        <p className="mt-1 text-sm text-white/90">
          All platform users with plan, subscription, and activity insights.
        </p>
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Users"
          value={analytics?.summary.total_users ?? 0}
          tone="orange"
        />
        <StatCard
          label="Active (30d)"
          value={analytics?.summary.active_last_30_days ?? 0}
          tone="blue"
        />
        <StatCard
          label="Paid Users"
          value={analytics?.summary.paid_users ?? 0}
          tone="green"
        />
        <StatCard
          label="Free Users"
          value={analytics?.summary.free_users ?? 0}
          tone="slate"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-4 lg:col-span-2">
          <h3 className="text-base font-semibold text-white">Plan Distribution</h3>
          <div className="mt-4 grid gap-5 md:grid-cols-[240px,1fr] md:items-center">
            <div
              className="relative mx-auto h-[220px] w-full max-w-[240px]"
              onMouseLeave={() => setActivePlanIndex(null)}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={planChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={88}
                    paddingAngle={3}
                    stroke="rgba(15,23,42,0.55)"
                    strokeWidth={2}
                    onMouseEnter={(_, index) => setActivePlanIndex(index)}
                    onMouseLeave={() => setActivePlanIndex(null)}
                  >
                    {planChartData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={entry.color}
                        opacity={
                          activePlanIndex === null || activePlanIndex === index
                            ? 1
                            : 0.35
                        }
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                {activePlanIndex !== null && planChartData[activePlanIndex] ? (
                  <>
                    <span
                      className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                      style={{ color: planChartData[activePlanIndex].color }}
                    >
                      {planChartData[activePlanIndex].name}
                    </span>
                    <span className="mt-0.5 text-2xl font-bold text-white">
                      {planChartData[activePlanIndex].value}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {planChartData[activePlanIndex].percent}% of users
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-xs uppercase tracking-wide text-slate-400">
                      Total Users
                    </span>
                    <span className="text-2xl font-bold text-white">
                      {analytics?.summary.total_users ?? 0}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {planChartData.map((item) => {
                const planKey = item.name as PlanTier;
                const isOpen = expandedPlan === planKey;
                const state = planUsers[planKey];
                return (
                  <div key={item.name} className="space-y-2">
                    <button
                      type="button"
                      onClick={() => handleTogglePlan(planKey)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center justify-between rounded-lg border border-[--color-border] bg-[--color-surface-alt] px-3 py-2 transition hover:border-[#fc4f02]/60 hover:bg-[--color-surface]"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm font-medium text-white">
                          {item.name}
                        </span>
                        <svg
                          className={`h-3.5 w-3.5 text-slate-400 transition-transform ${
                            isOpen ? "rotate-180" : ""
                          }`}
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-white">
                          {item.percent}%
                        </p>
                        <p className="text-xs text-slate-400">
                          {item.value} users
                        </p>
                      </div>
                    </button>

                    {isOpen && (
                      <div
                        className="relative overflow-hidden rounded-lg border border-[--color-border] bg-gradient-to-br from-[--color-surface] to-[--color-surface-alt] shadow-inner"
                      >
                        <span
                          className="absolute inset-y-0 left-0 w-[3px]"
                          style={{ backgroundColor: item.color }}
                          aria-hidden="true"
                        />
                        <div className="p-3 pl-4">
                          {state.loading ? (
                            <div className="flex items-center justify-center py-6">
                              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#fc4f02] border-t-transparent" />
                            </div>
                          ) : state.error ? (
                            <p className="py-4 text-center text-sm text-red-400">
                              {state.error}
                            </p>
                          ) : state.users.length === 0 ? (
                            <p className="py-4 text-center text-sm text-slate-400">
                              No users on this plan
                            </p>
                          ) : (
                            <>
                              <div className="overflow-hidden rounded-md border border-[--color-border]/60">
                                <table className="w-full text-left text-sm">
                                  <thead className="bg-[--color-surface-alt]/60 backdrop-blur">
                                    <tr className="text-[10px] uppercase tracking-[0.08em] text-slate-400">
                                      <th className="px-3 py-2 font-semibold">
                                        Email
                                      </th>
                                      <th className="px-3 py-2 font-semibold">
                                        Full name
                                      </th>
                                      <th className="px-3 py-2 font-semibold">
                                        KYC
                                      </th>
                                      <th className="px-3 py-2 font-semibold">
                                        Joined
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-[--color-border]/60">
                                    {state.users.map((user) => (
                                      <tr
                                        key={user.user_id}
                                        className="transition-colors hover:bg-[#fc4f02]/5"
                                      >
                                        <td className="px-3 py-2 align-middle text-xs font-medium text-white">
                                          <span className="block max-w-[220px] truncate">
                                            {user.email}
                                          </span>
                                        </td>
                                        <td className="px-3 py-2 align-middle text-xs text-slate-300">
                                          {user.full_name || (
                                            <span className="text-slate-500">
                                              —
                                            </span>
                                          )}
                                        </td>
                                        <td className="px-3 py-2 align-middle">
                                          <KycBadge status={user.kyc_status} />
                                        </td>
                                        <td className="px-3 py-2 align-middle text-xs text-slate-400">
                                          {new Date(
                                            user.created_at
                                          ).toLocaleDateString(undefined, {
                                            year: "numeric",
                                            month: "short",
                                            day: "numeric",
                                          })}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>

                              <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                                <span>
                                  Page{" "}
                                  <span className="font-semibold text-white">
                                    {state.page}
                                  </span>{" "}
                                  of{" "}
                                  <span className="font-semibold text-white">
                                    {state.totalPages}
                                  </span>{" "}
                                  ·{" "}
                                  <span className="font-semibold text-white">
                                    {state.total}
                                  </span>{" "}
                                  total
                                </span>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handlePlanPageChange(
                                        planKey,
                                        state.page - 1
                                      )
                                    }
                                    disabled={
                                      state.page <= 1 || state.loading
                                    }
                                    className="rounded-md border border-[--color-border] bg-[--color-surface] px-2.5 py-1 text-white transition hover:border-[#fc4f02]/60 hover:bg-[#fc4f02]/10 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[--color-border] disabled:hover:bg-[--color-surface]"
                                  >
                                    Prev
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handlePlanPageChange(
                                        planKey,
                                        state.page + 1
                                      )
                                    }
                                    disabled={
                                      state.page >= state.totalPages ||
                                      state.loading
                                    }
                                    className="rounded-md border border-[--color-border] bg-[--color-surface] px-2.5 py-1 text-white transition hover:border-[#fc4f02]/60 hover:bg-[#fc4f02]/10 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[--color-border] disabled:hover:bg-[--color-surface]"
                                  >
                                    Next
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-4">
          <h3 className="text-base font-semibold text-white">Recent Signups</h3>
          <div className="mt-3 space-y-2">
            {(analytics?.recent_signups ?? []).slice(0, 6).map((user) => (
              <div
                key={user.user_id}
                className="rounded-lg bg-[--color-surface-alt] p-2"
              >
                <p className="truncate text-sm font-medium text-white">
                  {user.email}
                </p>
                <p className="text-xs text-slate-400">{user.current_tier}</p>
              </div>
            ))}
            {(analytics?.recent_signups ?? []).length === 0 && (
              <p className="text-sm text-slate-400">No recent signups</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-4 lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-white">Exchange Connections</h3>
              <p className="mt-1 text-sm text-slate-400">
                Crypto/stocks connections with active and pending status overview.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MiniMetric
              label="Crypto Connections"
              value={String(analytics?.exchange_connections.crypto_connections ?? 0)}
            />
            <MiniMetric
              label="Stock Connections"
              value={String(analytics?.exchange_connections.stock_connections ?? 0)}
            />
            <MiniMetric
              label="Active Connections"
              value={String(analytics?.exchange_connections.active_connections ?? 0)}
            />
            <MiniMetric
              label="Pending Connections"
              value={String(analytics?.exchange_connections.pending_connections ?? 0)}
            />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-[--color-border] bg-[--color-surface-alt] p-3">
              <p className="text-sm font-medium text-white">Exchange Type Distribution</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={[
                    {
                      name: "Crypto",
                      count: analytics?.exchange_connections.crypto_connections ?? 0,
                    },
                    {
                      name: "Stock",
                      count: analytics?.exchange_connections.stock_connections ?? 0,
                    },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="name" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1a1a",
                      border: "1px solid #333",
                      borderRadius: "6px",
                    }}
                    cursor={{ fill: "rgba(252, 79, 2, 0.1)" }}
                  />
                  <Bar dataKey="count" fill="#fc4f02" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-lg border border-[--color-border] bg-[--color-surface-alt] p-3">
              <p className="text-sm font-medium text-white">Connection Status</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={[
                    {
                      name: "Active",
                      count: analytics?.exchange_connections.active_connections ?? 0,
                    },
                    {
                      name: "Pending",
                      count: analytics?.exchange_connections.pending_connections ?? 0,
                    },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="name" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1a1a",
                      border: "1px solid #333",
                      borderRadius: "6px",
                    }}
                    cursor={{ fill: "rgba(59, 130, 246, 0.1)" }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-4">
          <h3 className="text-base font-semibold text-white">Last Synced Users</h3>
          <div className="mt-3 space-y-2">
            {(analytics?.exchange_connections.recent_synced_users ?? []).map((item) => (
              <div
                key={item.connection_id}
                className="rounded-lg bg-[--color-surface-alt] p-3"
              >
                <p className="truncate text-sm font-medium text-white">
                  {item.email}
                </p>
                <p className="text-xs text-slate-400">
                  {item.exchange_name} • {item.exchange_type}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {formatDateTime(item.last_synced_at)}
                </p>
              </div>
            ))}
            {(analytics?.exchange_connections.recent_synced_users ?? []).length === 0 && (
              <p className="text-sm text-slate-400">No synced users yet</p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-white">Monthly User Growth</h3>
            <p className="mt-1 text-sm text-slate-400">
              Year-wise user growth with subscription and active-user filters.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={growthYear}
              onChange={(e) => setGrowthYear(Number(e.target.value))}
              className="rounded-lg border border-[--color-border] bg-[--color-surface-alt] px-3 py-2 text-sm text-white outline-none focus:border-[#fc4f02]"
            >
              {(growth?.available_years ?? [growthYear]).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>

            <select
              value={growthPlan}
              onChange={(e) =>
                setGrowthPlan(
                  e.target.value as (typeof GROWTH_PLAN_OPTIONS)[number]
                )
              }
              className="rounded-lg border border-[--color-border] bg-[--color-surface-alt] px-3 py-2 text-sm text-white outline-none focus:border-[#fc4f02]"
            >
              {GROWTH_PLAN_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === "ALL" ? "All Subscriptions" : option}
                </option>
              ))}
            </select>

            <label className="flex items-center gap-2 rounded-lg border border-[--color-border] bg-[--color-surface-alt] px-3 py-2 text-sm text-white">
              <input
                type="checkbox"
                checked={growthActiveOnly}
                onChange={(e) => setGrowthActiveOnly(e.target.checked)}
                className="accent-[#fc4f02]"
              />
              Active Users Only
            </label>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <MiniMetric
            label="Selected Year"
            value={String(growth?.year ?? growthYear)}
          />
          <MiniMetric
            label="Matching Users"
            value={String(growth?.total_users ?? 0)}
          />
          <MiniMetric
            label="Current Filter"
            value={growthActiveOnly ? "Active" : "All Users"}
          />
        </div>

        <div className="mt-6 h-[320px] w-full">
          {growthLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              Loading growth chart...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growth?.monthly ?? []}>
                <defs>
                  <linearGradient id="usersGrowthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fc4f02" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#fc4f02" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(148,163,184,0.16)" vertical={false} />
                <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#111827",
                    border: "1px solid rgba(252,79,2,0.25)",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="users"
                  name="New Users"
                  stroke="#fc4f02"
                  strokeWidth={3}
                  fill="url(#usersGrowthGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="cumulative_users"
                  name="Cumulative"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  fill="transparent"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

    </div>
  );
}

function formatDateTime(value: string | null) {
  if (!value) return "Never synced";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Never synced";
  return date.toLocaleString();
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[--color-border] bg-[--color-surface-alt] p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "orange" | "blue" | "green" | "slate";
}) {
  const toneMap: Record<typeof tone, string> = {
    orange: "from-[#fc4f02]/20 to-[#fda300]/10 border-[#fc4f02]/30",
    blue: "from-blue-500/15 to-blue-600/5 border-blue-500/30",
    green: "from-green-500/15 to-green-600/5 border-green-500/30",
    slate: "from-slate-500/15 to-slate-600/5 border-slate-500/30",
  };

  return (
    <div className={`rounded-xl border bg-gradient-to-br p-4 ${toneMap[tone]}`}>
      <p className="text-xs text-slate-300">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function KycBadge({
  status,
}: {
  status: SuperAdminUserRow["kyc_status"];
}) {
  const styles: Record<SuperAdminUserRow["kyc_status"], string> = {
    approved: "bg-green-500/15 text-green-300 border-green-500/30",
    pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    review: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    rejected: "bg-red-500/15 text-red-300 border-red-500/30",
  };
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${styles[status]}`}
    >
      {status}
    </span>
  );
}
