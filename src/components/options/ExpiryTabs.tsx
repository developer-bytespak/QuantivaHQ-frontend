"use client";

import { useRef, useState, useEffect, useCallback } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

interface ExpiryTabsProps {
  expiryDates: string[];
  selectedExpiry: string | null;
  onSelect: (expiry: string) => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getDaysToExpiry(expiry: string): number {
  const date = new Date(expiry + "T08:00:00Z");
  const now = new Date();
  return Math.max(0, Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

function formatExpiryLabel(expiry: string): { month: string; day: string; weekday: string } {
  const date = new Date(expiry + "T08:00:00Z");
  return {
    month: date.toLocaleDateString("en-US", { month: "short" }),
    day: date.toLocaleDateString("en-US", { day: "numeric" }),
    weekday: date.toLocaleDateString("en-US", { weekday: "short" }),
  };
}

function getDteLabel(days: number): string {
  if (days === 0) return "Today";
  if (days === 1) return "1d";
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.floor(days / 7)}w`;
  return `${days}d`;
}

function getDteColor(days: number): string {
  if (days <= 1) return "text-red-400";
  if (days <= 3) return "text-amber-400";
  if (days <= 7) return "text-yellow-400/70";
  return "text-slate-500";
}

// ── Component ────────────────────────────────────────────────────────────────

export function ExpiryTabs({ expiryDates, selectedExpiry, onSelect }: ExpiryTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      ro.disconnect();
    };
  }, [expiryDates, checkScroll]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
  };

  if (expiryDates.length === 0) return null;

  return (
    <div className="relative">
      {/* Left fade + arrow */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-0 z-10 flex h-full w-8 items-center justify-center bg-gradient-to-r from-[#0a0a0f] via-[#0a0a0f]/80 to-transparent"
          aria-label="Scroll left"
        >
          <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Scrollable expiry list */}
      <div
        ref={scrollRef}
        className="no-scrollbar flex items-stretch gap-1.5 overflow-x-auto px-1 py-1"
      >
        {expiryDates.map((expiry) => {
          const days = getDaysToExpiry(expiry);
          const { month, day, weekday } = formatExpiryLabel(expiry);
          const isActive = selectedExpiry === expiry;
          const isExpiringSoon = days <= 1;

          return (
            <button
              key={expiry}
              onClick={() => onSelect(expiry)}
              className={`group relative flex flex-shrink-0 flex-col items-center gap-0.5 rounded-xl px-3.5 py-2 transition-all duration-150 ${
                isActive
                  ? "bg-[var(--primary)]/10 shadow-[inset_0_0_0_1px_rgba(var(--primary-rgb),,0.3)]"
                  : "hover:bg-white/[0.04]"
              }`}
            >
              {/* Expiring-soon pulse dot */}
              {isExpiringSoon && !isActive && (
                <span className="absolute -right-0.5 -top-0.5 flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-50" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-400" />
                </span>
              )}

              {/* Date */}
              <span
                className={`text-xs font-semibold leading-tight ${
                  isActive ? "text-[var(--primary)]" : "text-slate-300 group-hover:text-slate-100"
                }`}
              >
                {month} {day}
              </span>

              {/* DTE badge */}
              <span
                className={`text-[10px] font-medium leading-tight ${
                  isActive ? "text-[var(--primary)]/70" : getDteColor(days)
                }`}
              >
                {getDteLabel(days)}
              </span>

              {/* Active indicator bar */}
              {isActive && (
                <div className="absolute -bottom-px left-1/2 h-[2px] w-5 -translate-x-1/2 rounded-full bg-[var(--primary)]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Right fade + arrow */}
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-0 z-10 flex h-full w-8 items-center justify-center bg-gradient-to-l from-[#0a0a0f] via-[#0a0a0f]/80 to-transparent"
          aria-label="Scroll right"
        >
          <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Hide scrollbar globally */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
