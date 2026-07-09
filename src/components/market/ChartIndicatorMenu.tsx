"use client";

import { useEffect, useRef, useState } from "react";
import { INDICATOR_LIST } from "@/lib/indicators/registry";

interface ChartIndicatorMenuProps {
  active: string[];
  onToggle: (id: string) => void;
  onClear?: () => void;
}

/**
 * Compact dropdown for turning studies on/off, grouped into Moving Averages
 * and Oscillators. Self-contained (own open/close + click-outside), so it can
 * be dropped into any chart header without wiring parent state.
 */
export default function ChartIndicatorMenu({
  active,
  onToggle,
  onClear,
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

  const movingAverages = INDICATOR_LIST.filter((d) => d.group === "ma");
  const oscillators = INDICATOR_LIST.filter((d) => d.group === "osc");
  const activeSet = new Set(active);

  const Row = ({ id, label, color }: { id: string; label: string; color: string }) => (
    <button
      type="button"
      onClick={() => onToggle(id)}
      className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm text-slate-200 transition-colors hover:bg-white/5"
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
          activeSet.has(id) ? "border-transparent" : "border-slate-500"
        }`}
        style={activeSet.has(id) ? { backgroundColor: color } : undefined}
      >
        {activeSet.has(id) && (
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
      <span className="flex items-center gap-2">
        <span className="h-0.5 w-4 rounded-full" style={{ backgroundColor: color }} />
        {label}
      </span>
    </button>
  );

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
        {active.length > 0 && (
          <span className="ml-0.5 rounded-full bg-[var(--primary)]/20 px-1.5 text-[10px] font-semibold text-[var(--primary)]">
            {active.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-56 rounded-xl border border-white/10 bg-[#0f1117] p-2 shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
          <div className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Moving Averages
          </div>
          {movingAverages.map((d) => (
            <Row key={d.id} id={d.id} label={d.label} color={d.color} />
          ))}

          <div className="mt-1 px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Oscillators
          </div>
          {oscillators.map((d) => (
            <Row key={d.id} id={d.id} label={d.label} color={d.color} />
          ))}

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
