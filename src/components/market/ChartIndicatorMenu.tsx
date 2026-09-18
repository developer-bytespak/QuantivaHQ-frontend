"use client";

import { useEffect, useRef, useState } from "react";
import {
  INDICATOR_GROUPS,
  INDICATOR_LIST,
  isIndicatorAvailable,
} from "@/lib/indicators/registry";
import type { SessionMode } from "@/lib/indicators/sessions";

interface ChartIndicatorMenuProps {
  active: string[];
  onToggle: (id: string) => void;
  onClear?: () => void;
  /** Whether the chart currently shows intraday bars (enables VWAP). */
  intraday: boolean;
  /** Which market's session rules apply; affects the VWAP label. */
  sessionMode: SessionMode;
}

interface RowProps {
  id: string;
  label: string;
  color: string;
  checked: boolean;
  disabled?: boolean;
  hint?: string;
  onToggle: (id: string) => void;
}

function Row({ id, label, color, checked, disabled, hint, onToggle }: RowProps) {
  return (
    <button
      type="button"
      onClick={() => {
        if (!disabled) onToggle(id);
      }}
      aria-disabled={disabled || undefined}
      className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
        disabled
          ? "cursor-not-allowed text-slate-500"
          : "text-slate-200 hover:bg-white/5"
      }`}
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
          checked ? "border-transparent" : "border-slate-500"
        }`}
        style={checked ? { backgroundColor: color } : undefined}
      >
        {checked && (
          <svg viewBox="0 0 12 12" className="h-3 w-3 text-black/80" fill="none">
            <path
              d="M2.5 6.5L5 9l4.5-5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <span
          className={`h-0.5 w-4 shrink-0 rounded-full ${disabled ? "opacity-40" : ""}`}
          style={{ backgroundColor: color }}
        />
        <span className="truncate">{label}</span>
      </span>
      {hint && (
        <span className="ml-auto shrink-0 text-[10px] uppercase tracking-wider text-slate-500">
          {hint}
        </span>
      )}
    </button>
  );
}

/**
 * Compact dropdown for turning studies on/off, grouped by section. Studies
 * that cannot be drawn on the current interval (VWAP on daily bars) stay
 * listed but disabled, so users learn where they live. Self-contained (own
 * open/close + click-outside), so it can be dropped into any chart header
 * without wiring parent state.
 */
export default function ChartIndicatorMenu({
  active,
  onToggle,
  onClear,
  intraday,
  sessionMode,
}: ChartIndicatorMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const activeSet = new Set(active);
  // Only count studies that are actually drawn right now, so a remembered
  // VWAP selection does not inflate the badge on a daily chart.
  const drawnCount = active.filter((id) => isIndicatorAvailable(id, intraday)).length;

  const labelFor = (id: string, label: string) =>
    id === "vwap" && sessionMode === "us-equity" ? "VWAP (IEX)" : label;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-white/10"
      >
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor">
          <path d="M2 4h12M2 8h12M2 12h12" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        Indicators
        {drawnCount > 0 && (
          <span className="ml-0.5 rounded-full bg-[var(--primary)]/20 px-1.5 text-[10px] font-semibold text-[var(--primary)]">
            {drawnCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-60 rounded-xl border border-white/10 bg-[#0f1117] p-2 shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
          {INDICATOR_GROUPS.map((group, gi) => {
            const items = INDICATOR_LIST.filter((d) => d.group === group.id);
            if (items.length === 0) return null;
            return (
              <div key={group.id}>
                <div
                  className={`px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 ${
                    gi === 0 ? "pt-1" : "mt-1 pt-2"
                  }`}
                >
                  {group.heading}
                </div>
                {items.map((d) => {
                  const available = isIndicatorAvailable(d.id, intraday);
                  return (
                    <Row
                      key={d.id}
                      id={d.id}
                      label={labelFor(d.id, d.label)}
                      color={d.color}
                      checked={activeSet.has(d.id)}
                      disabled={!available}
                      hint={available ? undefined : "Intraday only"}
                      onToggle={onToggle}
                    />
                  );
                })}
              </div>
            );
          })}

          {onClear && active.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="mt-1.5 w-full rounded-md border-t border-white/5 px-2 py-1.5 text-left text-xs text-slate-400 transition-colors hover:text-slate-200"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}
