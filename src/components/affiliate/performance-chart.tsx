"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface PerformanceChartProps {
  data: Array<{ date: string; signups: number; earnings_usd: number }>;
}

export function PerformanceChart({ data }: PerformanceChartProps) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 16, bottom: 0, left: 0 }}
        >
          <defs>
            <linearGradient id="signupsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fc4f02" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#fc4f02" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="earningsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            stroke="#475569"
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            tickFormatter={(d: string) => d.slice(5)}
            minTickGap={24}
          />
          <YAxis
            yAxisId="signups"
            stroke="#fc4f02"
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            width={32}
          />
          <YAxis
            yAxisId="earnings"
            orientation="right"
            stroke="#34d399"
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            tickFormatter={(v: number) => `$${v}`}
            width={48}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0b1220",
              border: "1px solid #1e293b",
              borderRadius: 8,
              color: "#e2e8f0",
            }}
            labelStyle={{ color: "#94a3b8" }}
            formatter={(value, name) => {
              const v = value as number | string | undefined;
              if (name === "earnings_usd") {
                return [`$${Number(v ?? 0).toFixed(2)}`, "Earnings"];
              }
              return [String(v ?? ""), "Signups"];
            }}
          />
          <Legend
            iconSize={10}
            wrapperStyle={{ color: "#94a3b8", fontSize: 11, paddingTop: 8 }}
            formatter={(v: string) =>
              v === "signups" ? "Signups" : "Earnings (USD)"
            }
          />
          <Area
            yAxisId="signups"
            type="monotone"
            dataKey="signups"
            stroke="#fc4f02"
            strokeWidth={2}
            fill="url(#signupsFill)"
          />
          <Area
            yAxisId="earnings"
            type="monotone"
            dataKey="earnings_usd"
            stroke="#34d399"
            strokeWidth={2}
            fill="url(#earningsFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
