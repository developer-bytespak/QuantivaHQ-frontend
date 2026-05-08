"use client";

import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getPositionInsight,
  PositionAssetType,
  PositionInsightItem,
  PositionInsightResponse,
} from "@/lib/api/position-insights.service";
import { SentimentBadge } from "@/components/news/sentiment-badge";

const POLL_INTERVAL_MS = 5_000;
const POLL_WINDOW_MS = 30_000;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  symbol: string | null;
  assetType: PositionAssetType | null;
}

export function PositionInsightModal({ isOpen, onClose, symbol, assetType }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const enabled = isOpen && !!symbol && !!assetType;

  // Track when we first observed `refreshing: true` so we can stop polling
  // after the 30-second window even if the backend keeps reporting refreshing.
  const pollStartedAtRef = useRef<number | null>(null);
  useEffect(() => {
    if (!isOpen) pollStartedAtRef.current = null;
  }, [isOpen]);

  const { data, isLoading, isError, refetch, isFetching } = useQuery<PositionInsightResponse>({
    queryKey: ["position-insight", assetType, (symbol || "").toUpperCase()],
    queryFn: () => getPositionInsight(symbol as string, assetType as PositionAssetType),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchInterval: (query) => {
      const d = query.state.data as PositionInsightResponse | undefined;
      if (!d?.refreshing) {
        pollStartedAtRef.current = null;
        return false;
      }
      if (pollStartedAtRef.current == null) pollStartedAtRef.current = Date.now();
      const elapsed = Date.now() - pollStartedAtRef.current;
      return elapsed < POLL_WINDOW_MS ? POLL_INTERVAL_MS : false;
    },
  });

  if (!mounted || !isOpen || typeof window === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <Header
          symbol={symbol || ""}
          assetType={assetType}
          mood={data?.marketMood}
          onClose={onClose}
        />

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {isLoading && <LoadingState />}

          {isError && !isLoading && (
            <ErrorState
              onRetry={() => {
                refetch();
              }}
            />
          )}

          {!isLoading && !isError && data && (
            <>
              <SentimentSummary
                summary={data.sentimentSummary}
                lastUpdatedAt={data.lastUpdatedAt}
                refreshing={data.refreshing || isFetching}
              />

              {data.news_items.length === 0 ? (
                <EmptyState symbol={symbol || ""} refreshing={data.refreshing} />
              ) : (
                <ul className="space-y-3">
                  {data.news_items.map((item, idx) => (
                    <NewsCard key={`${item.url}-${idx}`} item={item} />
                  ))}
                </ul>
              )}
            </>
          )}
        </div>

        <div className="p-4 border-t border-slate-700/60 bg-slate-900/80">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ---------- Sub-components ----------

function Header({
  symbol,
  assetType,
  mood,
  onClose,
}: {
  symbol: string;
  assetType: PositionAssetType | null;
  mood?: "bullish" | "bearish" | "neutral";
  onClose: () => void;
}) {
  return (
    <div className="p-5 border-b border-slate-700/60 flex items-center gap-4">
      <SymbolBadge symbol={symbol} assetType={assetType} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-bold text-white truncate">{symbol}</h3>
          {mood && <MoodPill mood={mood} />}
        </div>
        <p className="text-xs text-slate-400 mt-0.5 capitalize">
          {assetType ? `${assetType} · news & sentiment` : "Loading…"}
        </p>
      </div>
      <button
        onClick={onClose}
        aria-label="Close"
        className="text-slate-400 hover:text-white transition-colors p-1 rounded"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

function SymbolBadge({
  symbol,
  assetType,
}: {
  symbol: string;
  assetType: PositionAssetType | null;
}) {
  const isStock = assetType === "stock";
  const bg = isStock
    ? "bg-blue-500/20 text-blue-300 border-blue-400/30"
    : "bg-amber-500/20 text-amber-300 border-amber-400/30";
  return (
    <div
      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold border-2 ${bg}`}
    >
      {(symbol || "?").slice(0, isStock ? 3 : 2).toUpperCase()}
    </div>
  );
}

function MoodPill({ mood }: { mood: "bullish" | "bearish" | "neutral" }) {
  const colors = {
    bullish: "bg-green-500/20 text-green-400 border-green-500/30",
    bearish: "bg-red-500/20 text-red-400 border-red-500/30",
    neutral: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  } as const;
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${colors[mood]}`}>
      {mood}
    </span>
  );
}

function SentimentSummary({
  summary,
  lastUpdatedAt,
  refreshing,
}: {
  summary: { positive: number; negative: number; neutral: number };
  lastUpdatedAt?: string | null;
  refreshing?: boolean;
}) {
  const total = summary.positive + summary.negative + summary.neutral;
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/60">
      <div className="flex items-center gap-3 text-sm">
        <Counter label="Positive" count={summary.positive} color="text-green-400" />
        <Counter label="Neutral" count={summary.neutral} color="text-slate-400" />
        <Counter label="Negative" count={summary.negative} color="text-red-400" />
      </div>
      <div className="text-right text-xs text-slate-500">
        {total === 0 ? "no data" : `${total} item${total === 1 ? "" : "s"}`}
        {refreshing && <span className="ml-2 text-amber-400">refreshing…</span>}
        {!refreshing && lastUpdatedAt && (
          <div className="text-[10px] text-slate-600">
            updated {formatRelative(lastUpdatedAt)}
          </div>
        )}
      </div>
    </div>
  );
}

function Counter({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className={`font-semibold ${color}`}>{count}</span>
      <span className="text-slate-500">{label}</span>
    </div>
  );
}

function NewsCard({ item }: { item: PositionInsightItem }) {
  return (
    <li className="rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 transition-colors">
      <a
        href={item.url || "#"}
        target="_blank"
        rel="noopener noreferrer"
        className={`block p-3 ${item.url ? "" : "pointer-events-none opacity-80"}`}
      >
        <div className="flex items-start justify-between gap-3">
          <h4 className="text-sm font-semibold text-white leading-snug">{item.title}</h4>
          <SentimentBadge
            label={item.sentiment.label}
            score={item.sentiment.score}
            size="sm"
          />
        </div>
        {item.description && (
          <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">{item.description}</p>
        )}
        <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-500">
          <span>{item.source || "Unknown"}</span>
          {item.published_at && (
            <>
              <span>·</span>
              <span>{formatRelative(item.published_at)}</span>
            </>
          )}
        </div>
      </a>
    </li>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-lg bg-slate-800/40 border border-slate-700/40 p-3 animate-pulse">
          <div className="h-4 w-3/4 bg-slate-700/60 rounded mb-2" />
          <div className="h-3 w-full bg-slate-700/40 rounded mb-1" />
          <div className="h-3 w-1/2 bg-slate-700/40 rounded" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ symbol, refreshing }: { symbol: string; refreshing?: boolean }) {
  return (
    <div className="text-center py-10">
      <div className="text-slate-300 font-medium">
        {refreshing ? `Fetching news for ${symbol}…` : `No recent news for ${symbol}`}
      </div>
      <p className="text-xs text-slate-500 mt-1">
        {refreshing
          ? "Hold on, this may take a few seconds."
          : "Check back later — we refresh news regularly."}
      </p>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="text-center py-10">
      <div className="text-slate-200 font-medium">Insight unavailable</div>
      <p className="text-xs text-slate-500 mt-1">Something went wrong fetching this position.</p>
      <button
        onClick={onRetry}
        className="mt-3 px-4 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm transition-colors"
      >
        Retry
      </button>
    </div>
  );
}

// Lightweight relative-time formatter — avoids pulling in date-fns just for this.
function formatRelative(iso: string): string {
  const ts = new Date(iso).getTime();
  if (isNaN(ts)) return "";
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}
