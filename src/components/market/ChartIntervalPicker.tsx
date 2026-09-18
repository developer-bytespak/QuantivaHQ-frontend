"use client";

import { CHART_INTERVALS, ChartIntervalId } from "@/lib/chart/intervals";

interface ChartIntervalPickerProps {
  value: ChartIntervalId;
  onChange: (id: ChartIntervalId) => void;
}

/**
 * Candle-size selector for the market detail charts. Each button switches the
 * chart to that bar interval; the amount of history is fixed per interval.
 */
export default function ChartIntervalPicker({ value, onChange }: ChartIntervalPickerProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Candle interval"
      className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
    >
      {CHART_INTERVALS.map((d) => {
        const selected = d.id === value;
        return (
          <button
            key={d.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(d.id)}
            className={`whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
              selected
                ? "bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] text-white shadow-lg shadow-[rgba(var(--primary-rgb),0.4)] scale-105"
                : "border border-white/[0.09] bg-gradient-to-b from-white/[0.055] via-white/[0.02] to-white/[0.015] backdrop-blur text-slate-300 hover:text-white hover:scale-[1.02]"
            }`}
          >
            {d.label}
          </button>
        );
      })}
    </div>
  );
}
