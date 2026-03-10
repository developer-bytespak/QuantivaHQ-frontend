"use client";

import type { OptionsRecommendation } from "@/lib/api/options.service";

// ── Types ────────────────────────────────────────────────────────────────────

interface OptionsRecommendationCardProps {
  recommendation: OptionsRecommendation;
  onSelect: (rec: OptionsRecommendation) => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function confidenceBar(confidence: number) {
  const pct = Math.round(confidence * 100);
  const color =
    pct >= 75 ? "bg-green-500" : pct >= 50 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/[0.06]">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-medium text-slate-400">{pct}%</span>
    </div>
  );
}

function ivRankBadge(ivRank: number) {
  const pct = Math.round(ivRank * 100);
  const label =
    pct >= 70 ? "High IV" : pct >= 40 ? "Mid IV" : "Low IV";
  const color =
    pct >= 70
      ? "bg-red-500/15 text-red-400"
      : pct >= 40
        ? "bg-yellow-500/15 text-yellow-400"
        : "bg-green-500/15 text-green-400";
  return (
    <span className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${color}`}>
      {label} ({pct}%)
    </span>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export function OptionsRecommendationCard({
  recommendation,
  onSelect,
}: OptionsRecommendationCardProps) {
  const { recommendedType, recommendedStrike, recommendedExpiry, signalConfidence, ivRank, reasoning, assetSymbol, signalAction, finalScore } = recommendation;

  const typeColor = recommendedType === "CALL" ? "text-green-400" : "text-red-400";
  const typeBg = recommendedType === "CALL" ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20";

  const expiryDate = new Date(recommendedExpiry);
  const now = new Date();
  const daysToExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div
      onClick={() => onSelect(recommendation)}
      className={`group cursor-pointer rounded-xl border ${typeBg} p-4 transition-all hover:scale-[1.01] hover:shadow-lg`}
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-lg font-bold ${typeColor}`}>
            {recommendedType}
          </span>
          <span className="text-sm font-medium text-slate-200">
            {assetSymbol}
          </span>
        </div>
        {ivRankBadge(ivRank)}
      </div>

      {/* Details grid */}
      <div className="mb-3 grid grid-cols-3 gap-3">
        <div>
          <p className="text-[10px] text-slate-500">Strike</p>
          <p className="font-mono text-sm font-semibold text-slate-200">
            ${recommendedStrike.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-slate-500">Expiry</p>
          <p className="text-sm font-medium text-slate-300">
            {expiryDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </p>
          <p className="text-[10px] text-slate-500">{daysToExpiry}d</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-500">Signal</p>
          <p className={`text-sm font-semibold ${finalScore > 0 ? "text-green-400" : finalScore < 0 ? "text-red-400" : "text-slate-400"}`}>
            {signalAction} ({(finalScore * 100).toFixed(0)}%)
          </p>
        </div>
      </div>

      {/* Confidence */}
      <div className="mb-3">
        <p className="mb-1 text-[10px] text-slate-500">AI Confidence</p>
        {confidenceBar(signalConfidence)}
      </div>

      {/* Reasoning */}
      <p className="text-[11px] leading-relaxed text-slate-400">
        {reasoning}
      </p>

      {/* Action hint */}
      <div className="mt-3 flex items-center justify-end">
        <span className="text-[10px] font-medium text-[#fc4f02] opacity-0 transition-opacity group-hover:opacity-100">
          Click to pre-fill order →
        </span>
      </div>
    </div>
  );
}

// ── List Wrapper ─────────────────────────────────────────────────────────────

interface OptionsRecommendationListProps {
  recommendations: OptionsRecommendation[];
  onSelect: (rec: OptionsRecommendation) => void;
  isLoading?: boolean;
}

export function OptionsRecommendationList({
  recommendations,
  onSelect,
  isLoading,
}: OptionsRecommendationListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#fc4f02] border-t-transparent" />
        <span className="ml-3 text-sm text-slate-400">Generating AI recommendations…</span>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-sm text-slate-500">
        <svg className="mb-3 h-8 w-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        No AI recommendations available. Select an underlying to generate.
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {recommendations.map((rec, i) => (
        <OptionsRecommendationCard key={i} recommendation={rec} onSelect={onSelect} />
      ))}
    </div>
  );
}
