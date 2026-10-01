"use client";

import { BillingPeriod } from "@/mock-data/subscription-dummy-data";
import { PREMIUM_BILLING_PERIODS, PREMIUM_PERIOD_LABELS } from "@/config/subscription";

interface BillingPeriodToggleProps {
  value: BillingPeriod;
  onChange: (period: BillingPeriod) => void;
  /** Whole-number percent saved versus monthly; 0 hides the badge. */
  getSavingsPercent: (period: BillingPeriod) => number;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md";
  ariaLabel?: string;
}

/**
 * Three-way Monthly / Quarterly / Yearly segmented control shared by the
 * choose-plan page, the settings upgrade CTA and the homepage pricing section.
 */
export function BillingPeriodToggle({
  value,
  onChange,
  getSavingsPercent,
  disabled = false,
  className = "",
  size = "md",
  ariaLabel = "Billing period",
}: BillingPeriodToggleProps) {
  const pad = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`inline-flex max-w-full flex-wrap items-center justify-center gap-1 rounded-full border border-white/15 bg-white/5 p-1 backdrop-blur ${className}`}
    >
      {PREMIUM_BILLING_PERIODS.map((period) => {
        const selected = value === period;
        const savings = getSavingsPercent(period as BillingPeriod);
        return (
          <button
            key={period}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(period as BillingPeriod)}
            className={`inline-flex items-center gap-1.5 rounded-full font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${pad} ${
              selected
                ? "bg-[var(--primary)] text-white shadow"
                : "text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span>{PREMIUM_PERIOD_LABELS[period]}</span>
            {savings > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                  selected ? "bg-white/25 text-white" : "bg-emerald-500/20 text-emerald-300"
                }`}
              >
                Save {savings}%
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
