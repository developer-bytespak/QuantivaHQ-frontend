"use client";

interface KpiTileProps {
  label: string;
  value: string | number;
  /** Optional secondary label, e.g. "vs last month" or a status hint. */
  hint?: string;
  /** Optional sub-label, e.g. previous-month value. */
  subValue?: string | number;
  /** Optional delta (number). Auto-colored when provided. */
  delta?: number;
  /** Format as a USD currency value. */
  currency?: boolean;
}

function formatNumber(n: number | string, currency = false): string {
  const num = typeof n === "string" ? Number(n) : n;
  if (Number.isNaN(num)) return String(n);
  if (currency) {
    return num.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    });
  }
  return num.toLocaleString("en-US");
}

export function KpiTile({
  label,
  value,
  hint,
  subValue,
  delta,
  currency = false,
}: KpiTileProps) {
  const deltaColor =
    delta == null
      ? "text-slate-400"
      : delta > 0
        ? "text-emerald-400"
        : delta < 0
          ? "text-rose-400"
          : "text-slate-400";

  return (
    <div className="rounded-xl border border-slate-800/80 bg-gradient-to-b from-[#0b1220] to-[#070d17] p-4 shadow-lg">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-white sm:text-3xl">
        {formatNumber(value, currency)}
      </p>
      {(hint || subValue != null || delta != null) && (
        <div className="mt-2 flex items-center gap-2 text-xs">
          {delta != null && (
            <span className={`font-semibold ${deltaColor}`}>
              {delta > 0 ? "▲" : delta < 0 ? "▼" : "·"} {Math.abs(delta).toFixed(0)}
              {hint?.includes("%") ? "%" : ""}
            </span>
          )}
          {subValue != null && (
            <span className="text-slate-500">
              Prev: {formatNumber(subValue, currency)}
            </span>
          )}
          {hint && !subValue && <span className="text-slate-500">{hint}</span>}
        </div>
      )}
    </div>
  );
}
