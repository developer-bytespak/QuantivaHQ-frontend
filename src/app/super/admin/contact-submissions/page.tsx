"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  adminMe,
  adminSuperListContactSubmissions,
  type ContactSubmissionRow,
  type ContactSubmissionsResponse,
} from "@/lib/api/vcpool-admin";
import { Notification, useNotification } from "@/components/common/notification";

const SOURCE_OPTIONS = [
  { label: "All Sources", value: "all" },
  { label: "Homepage", value: "homepage" },
  { label: "Help & Support", value: "help-support" },
];

const SUBJECT_OPTIONS = [
  { label: "All Subjects", value: "all" },
  { label: "General Inquiry", value: "general" },
  { label: "Sales & Pricing", value: "sales" },
  { label: "Technical Support", value: "support" },
  { label: "Partnership", value: "partnership" },
  { label: "Other", value: "other" },
];

function subjectLabel(value: string): string {
  const found = SUBJECT_OPTIONS.find((o) => o.value === value);
  return found ? found.label : value;
}

function sourceBadge(source: string): string {
  switch (source) {
    case "homepage":
      return "bg-blue-500/20 text-blue-200 border border-blue-500/30";
    case "help-support":
      return "bg-green-500/20 text-green-200 border border-green-500/30";
    default:
      return "bg-slate-500/20 text-slate-200 border border-slate-500/30";
  }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SuperAdminContactSubmissionsPage() {
  const router = useRouter();
  const { notification, showNotification, hideNotification } = useNotification();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<ContactSubmissionsResponse | null>(null);
  const [page, setPage] = useState(1);
  const [source, setSource] = useState("all");
  const [subject, setSubject] = useState("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const submissions = data?.submissions ?? [];
  const pagination = data?.pagination;

  const load = async (p: number, src: string, sub: string, q: string) => {
    const res = await adminSuperListContactSubmissions({
      page: p,
      limit: 20,
      source: src,
      subject: sub,
      search: q || undefined,
    });
    setData(res);
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
        await load(1, "all", "all", "");
      } catch (err: unknown) {
        if (!cancelled) {
          showNotification(
            (err as { message?: string })?.message ?? "Failed to load contact submissions",
            "error"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    boot();
    return () => { cancelled = true; };
  }, [router]);

  const onFilterChange = async (newSource: string, newSubject: string, newSearch: string) => {
    setSource(newSource);
    setSubject(newSubject);
    setSearch(newSearch);
    setPage(1);
    setRefreshing(true);
    try {
      await load(1, newSource, newSubject, newSearch);
    } catch (err: unknown) {
      showNotification((err as { message?: string })?.message ?? "Failed to filter", "error");
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await load(page, source, subject, search);
      showNotification("Refreshed", "success");
    } catch (err: unknown) {
      showNotification((err as { message?: string })?.message ?? "Failed to refresh", "error");
    } finally {
      setRefreshing(false);
    }
  };

  const onPaginate = async (nextPage: number) => {
    setRefreshing(true);
    try {
      await load(nextPage, source, subject, search);
      setPage(nextPage);
    } catch (err: unknown) {
      showNotification((err as { message?: string })?.message ?? "Failed to load page", "error");
    } finally {
      setRefreshing(false);
    }
  };

  const handleSearch = () => {
    onFilterChange(source, subject, searchInput);
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

      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-[#fc4f02] via-[#fd6a00] to-[#fd8a00] p-6 text-white shadow-xl">
        <h2 className="text-2xl font-bold">Contact Submissions</h2>
        <p className="mt-1 text-sm text-white/90">
          View and manage all contact form submissions from the homepage and help & support page.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard label="Total Submissions" value={pagination?.total ?? 0} />
        <SummaryCard
          label="Homepage"
          value={submissions.filter((s) => s.source === "homepage").length}
          subtitle="on this page"
        />
        <SummaryCard
          label="Help & Support"
          value={submissions.filter((s) => s.source === "help-support").length}
          subtitle="on this page"
        />
      </div>

      {/* Filters & Table */}
      <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-4">
        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={source}
              onChange={(e) => onFilterChange(e.target.value, subject, search)}
              className="rounded-lg border border-[--color-border] bg-[--color-surface-alt] px-3 py-2 text-sm text-white outline-none focus:border-[#fc4f02]"
            >
              {SOURCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select
              value={subject}
              onChange={(e) => onFilterChange(source, e.target.value, search)}
              className="rounded-lg border border-[--color-border] bg-[--color-surface-alt] px-3 py-2 text-sm text-white outline-none focus:border-[#fc4f02]"
            >
              {SUBJECT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search name, email, company..."
                className="rounded-lg border border-[--color-border] bg-[--color-surface-alt] px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-[#fc4f02] w-48 sm:w-64"
              />
              <button
                type="button"
                onClick={handleSearch}
                className="rounded-lg bg-[--color-surface-alt] border border-[--color-border] px-3 py-2 text-sm text-white hover:border-[#fc4f02]"
              >
                Search
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="rounded-lg bg-[#fc4f02] px-4 py-2 text-sm font-semibold text-white hover:bg-[#e84700] disabled:opacity-50"
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-[--color-border] text-sm">
            <thead>
              <tr className="text-left text-slate-300">
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Subject</th>
                <th className="px-3 py-2">Source</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">User</th>
                <th className="px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[--color-border]">
              {submissions.map((row) => (
                <TableRow
                  key={row.id}
                  row={row}
                  isExpanded={expandedId === row.id}
                  onToggle={() => setExpandedId(expandedId === row.id ? null : row.id)}
                />
              ))}
            </tbody>
          </table>
          {submissions.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-400">No contact submissions found.</p>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-slate-300">
            <p>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1 || refreshing}
                onClick={() => onPaginate(pagination.page - 1)}
                className="rounded-lg border border-[--color-border] px-3 py-1.5 disabled:opacity-50 hover:border-[#fc4f02]"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages || refreshing}
                onClick={() => onPaginate(pagination.page + 1)}
                className="rounded-lg border border-[--color-border] px-3 py-1.5 disabled:opacity-50 hover:border-[#fc4f02]"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TableRow({
  row,
  isExpanded,
  onToggle,
}: {
  row: ContactSubmissionRow;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr className="text-white/90">
        <td className="px-3 py-2">
          <p className="font-semibold text-white">{row.name}</p>
          {row.company && <p className="text-xs text-slate-400">{row.company}</p>}
        </td>
        <td className="px-3 py-2">
          <p>{row.email}</p>
          {row.phone && <p className="text-xs text-slate-400">{row.phone}</p>}
        </td>
        <td className="px-3 py-2">
          <span className="inline-flex rounded-md bg-[#fc4f02]/15 px-2 py-1 text-xs font-semibold text-[#ffb08a]">
            {subjectLabel(row.subject)}
          </span>
        </td>
        <td className="px-3 py-2">
          <span className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold capitalize ${sourceBadge(row.source)}`}>
            {row.source}
          </span>
        </td>
        <td className="px-3 py-2 text-slate-300 whitespace-nowrap">
          {formatDate(row.created_at)}
        </td>
        <td className="px-3 py-2">
          {row.user ? (
            <div>
              <p className="text-xs text-white">{row.user.username}</p>
              <p className="text-xs text-slate-400">{row.user.email}</p>
            </div>
          ) : (
            <span className="text-xs text-slate-500">Guest</span>
          )}
        </td>
        <td className="px-3 py-2">
          <button
            type="button"
            onClick={onToggle}
            className="rounded-md bg-[#fc4f02]/20 px-2 py-1 text-xs font-semibold text-[#ffb08a] hover:bg-[#fc4f02]/30"
          >
            {isExpanded ? "Hide" : "View"}
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={7} className="px-3 py-4 bg-[--color-surface-alt]/50">
            <div className="rounded-lg border border-[--color-border]/50 bg-[--color-surface]/30 p-4">
              <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Message</p>
              <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">{row.message}</p>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function SummaryCard({
  label,
  value,
  subtitle,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
}) {
  return (
    <div className="rounded-xl border border-[#fc4f02]/20 bg-gradient-to-br from-[#fc4f02]/20 to-[#fda300]/10 p-4">
      <p className="text-xs text-slate-300">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
      {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
    </div>
  );
}
