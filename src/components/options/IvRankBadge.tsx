"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import type { IvRankData, IvHistoryPoint } from "@/lib/api/options.service";

// ── IV Rank color logic ─────────────────────────────────────────────────────

function ivColor(rank: number): { bg: string; text: string; label: string } {
  if (rank < 0.3) return { bg: "bg-emerald-500/15", text: "text-emerald-400", label: "Low" };
  if (rank < 0.7) return { bg: "bg-amber-500/15", text: "text-amber-400", label: "Medium" };
  return { bg: "bg-red-500/15", text: "text-red-400", label: "High" };
}

// ── IV History Chart ────────────────────────────────────────────────────────

function IvHistoryChart({ history }: { history: IvHistoryPoint[] }) {
  if (history.length < 2) {
    return <p className="py-4 text-center text-xs text-slate-500">Not enough IV history data.</p>;
  }

  const data = history.map((p) => ({
    date: new Date(p.recorded_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    iv: Number(p.iv_value) * 100,
    rank: p.iv_rank !== null ? Number(p.iv_rank) * 100 : null,
  }));

  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="ivGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#64748b" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#64748b" }}
            tickLine={false}
            axisLine={false}
            width={35}
            tickFormatter={(v) => `${v}%`}
          />
          <RechartsTooltip
            contentStyle={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "8px",
              fontSize: "11px",
            }}
            formatter={(value) => [`${Number(value).toFixed(1)}%`, "IV"]}
          />
          <Area
            type="monotone"
            dataKey="iv"
            stroke="#8b5cf6"
            fill="url(#ivGrad)"
            strokeWidth={1.5}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export function IvRankBadge({
  ivRankData,
  ivHistory,
  isLoadingHistory,
  onLoadHistory,
}: {
  ivRankData: IvRankData | null;
  ivHistory: IvHistoryPoint[];
  isLoadingHistory: boolean;
  onLoadHistory: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  if (!ivRankData || ivRankData.ivRank === null) return null;

  const rank = ivRankData.ivRank;
  const style = ivColor(rank);

  return (
    <div className="flex flex-col">
      {/* Badge */}
      <button
        onClick={() => {
          setExpanded(!expanded);
          if (!expanded && ivHistory.length === 0) onLoadHistory();
        }}
        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${style.bg} ${style.text} hover:opacity-80`}
      >
        <span>IV Rank</span>
        <span className="font-bold tabular-nums">{(rank * 100).toFixed(0)}%</span>
        <span className="text-[10px] opacity-70">({style.label})</span>
        <svg
          className={`ml-0.5 h-3 w-3 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expandable chart */}
      {expanded && (
        <div className="mt-2 rounded-xl bg-[--color-surface]/40 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-300">IV History (90 days)</span>
            <span className="text-[10px] text-slate-500">
              Current IV: {(ivRankData.currentIv * 100).toFixed(1)}%
            </span>
          </div>
          {isLoadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
            </div>
          ) : (
            <IvHistoryChart history={ivHistory} />
          )}
        </div>
      )}
    </div>
  );
}
