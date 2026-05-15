"use client";

import React, { useEffect, useState } from "react";
import { useExchange } from "@/context/ExchangeContext";
import { getMyStrategy, updateMyStrategy } from "@/lib/api/strategies";
import {
  RULE_FIELDS,
  OPERATORS,
  DEFAULT_ENGINE_WEIGHTS,
  ENGINE_WEIGHT_ROWS,
  WEIGHT_PRESETS,
  StepGuideTooltip,
  useAssetSearch,
  usePopularAssets,
  weightsTotal,
  weightsValid as isWeightsValid,
  type Rule,
  type EngineWeights,
} from "./strategy-form-shared";

interface Props {
  strategyId: string | null;
  onClose: () => void;
  onSaved: () => void;
}

export function EditStrategyModal({ strategyId, onClose, onSaved }: Props) {
  const { connectionType } = useExchange();
  const isStocksConnection = connectionType === "stocks";
  const assetTypeLabel = isStocksConnection ? "Stocks" : "Crypto Assets";

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [legacyRulesHidden, setLegacyRulesHidden] = useState(0);

  // Form state — pre-filled on open
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [riskLevel, setRiskLevel] = useState<"low" | "medium" | "high">("medium");
  const [stopLoss, setStopLoss] = useState<number>(5);
  const [takeProfit, setTakeProfit] = useState<number>(15);
  const [targetAssets, setTargetAssets] = useState<string[]>([]);
  const [forAllAssets, setForAllAssets] = useState(false);
  const [engineWeights, setEngineWeights] = useState<EngineWeights>({ ...DEFAULT_ENGINE_WEIGHTS });
  const [entryRules, setEntryRules] = useState<Rule[]>([{ field: "final_score", operator: ">", value: 0.5 }]);

  // Asset search
  const [assetSearch, setAssetSearch] = useState("");
  const { popularCrypto, popularStocks } = usePopularAssets(connectionType);
  const popularAssets = isStocksConnection ? popularStocks : popularCrypto;
  const { results: assetResults, searching: searchingAssets, clear: clearAssetResults } = useAssetSearch(assetSearch, isStocksConnection);
  const hasNoAssetMatch = !searchingAssets && assetSearch.trim().length > 0 && assetResults.length === 0;

  const totalWeight = weightsTotal(engineWeights);
  const weightsValid = isWeightsValid(engineWeights);

  // Load strategy when modal opens
  useEffect(() => {
    if (!strategyId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setLegacyRulesHidden(0);

    (async () => {
      try {
        const s = await getMyStrategy(strategyId);
        if (cancelled) return;

        setName(s.name ?? "");
        setDescription(s.description ?? "");
        setRiskLevel((s.risk_level as "low" | "medium" | "high") || "medium");
        setStopLoss(s.stop_loss_value != null ? Number(s.stop_loss_value) : 5);
        setTakeProfit(s.take_profit_value != null ? Number(s.take_profit_value) : 15);

        const assets = (s.target_assets as string[] | null | undefined) ?? [];
        setForAllAssets(assets === null || assets.length === 0);
        setTargetAssets(assets || []);

        setEngineWeights(s.engine_weights ? { ...DEFAULT_ENGINE_WEIGHTS, ...s.engine_weights } : { ...DEFAULT_ENGINE_WEIGHTS });

        // Filter to field-based rules only. Strategies created via the legacy
        // indicator-based path won't have `field` — surface that to the user
        // rather than silently dropping their rules.
        const incomingRules = (s.entry_rules as any[] | null | undefined) ?? [];
        const fieldRules: Rule[] = incomingRules
          .filter((r) => r && typeof r === "object" && typeof r.field === "string")
          .map((r) => ({ field: r.field, operator: r.operator || ">", value: Number(r.value) || 0.5 }));
        setLegacyRulesHidden(incomingRules.length - fieldRules.length);
        setEntryRules(
          fieldRules.length > 0 ? fieldRules : [{ field: "final_score", operator: ">", value: 0.5 }]
        );
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load strategy");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [strategyId]);

  const addAsset = (symbol: string) => {
    const upperSymbol = symbol.toUpperCase();
    if (!targetAssets.includes(upperSymbol)) setTargetAssets([...targetAssets, upperSymbol]);
    setAssetSearch("");
    clearAssetResults();
  };
  const removeAsset = (symbol: string) => setTargetAssets(targetAssets.filter((s) => s !== symbol));
  const updateEngineWeight = (engine: keyof EngineWeights, value: number) =>
    setEngineWeights((prev) => ({ ...prev, [engine]: value }));
  const addRule = () =>
    setEntryRules([...entryRules, { field: "final_score", operator: ">", value: 0.3 }]);
  const updateRule = (index: number, updates: Partial<Rule>) => {
    if (updates.value !== undefined && updates.value <= 0) updates.value = 0.1;
    const next = [...entryRules];
    next[index] = { ...next[index], ...updates };
    setEntryRules(next);
  };
  const removeRule = (index: number) => setEntryRules(entryRules.filter((_, i) => i !== index));

  const canSave =
    !saving &&
    !loading &&
    name.trim().length > 0 &&
    (forAllAssets || targetAssets.length > 0) &&
    weightsValid &&
    entryRules.length > 0 &&
    stopLoss > 0 &&
    takeProfit > 0;

  const handleSave = async () => {
    if (!strategyId || !canSave) return;
    setSaving(true);
    setError(null);
    try {
      await updateMyStrategy(strategyId, {
        name,
        description,
        risk_level: riskLevel as any,
        stop_loss_value: stopLoss,
        take_profit_value: takeProfit,
        target_assets: forAllAssets ? (null as any) : targetAssets,
        engine_weights: engineWeights,
        entry_rules: entryRules.map((r) => ({ field: r.field, operator: r.operator, value: r.value })) as any,
      });
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update strategy");
    } finally {
      setSaving(false);
    }
  };

  if (!strategyId) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-md p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-2xl bg-[#0e0e18] border border-white/10 text-slate-100 shadow-2xl my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 px-6 py-4 border-b border-white/10 bg-[#0e0e18] rounded-t-2xl">
          <div>
            <h2 className="text-lg font-semibold text-white">Edit Strategy</h2>
            <p className="text-xs text-slate-400 mt-0.5">Tune your strategy's settings and rules</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="px-6 py-16 flex items-center justify-center">
            <div className="w-10 h-10 border-3 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-5">
            {legacyRulesHidden > 0 && (
              <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3">
                <p className="text-xs text-yellow-300">
                  {legacyRulesHidden} legacy indicator-based rule{legacyRulesHidden > 1 ? "s were" : " was"} hidden.
                  The editor only supports score-based rules. Saving will replace the strategy's rules with the ones below.
                </p>
              </div>
            )}

            {/* Basics */}
            <section className="rounded-2xl bg-white/[0.03] border border-white/10 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">Basics</h3>
                <StepGuideTooltip
                  title="Basics"
                  subtitle="Name and describe your strategy."
                  points={[
                    "Use a clear name so it is easy to find later.",
                    "Add a short description of your trading idea.",
                  ]}
                />
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Strategy Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl bg-black/30 border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-[var(--primary)]/50 focus:ring-1 focus:ring-[var(--primary)]/30 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full rounded-xl bg-black/30 border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-[var(--primary)]/50 focus:ring-1 focus:ring-[var(--primary)]/30 focus:outline-none resize-none"
                  />
                </div>
              </div>
            </section>

            {/* Target Assets */}
            <section className="rounded-2xl bg-white/[0.03] border border-white/10 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">Target {assetTypeLabel}</h3>
                <StepGuideTooltip
                  title={`Target ${assetTypeLabel}`}
                  subtitle="Choose which symbols this strategy scans."
                  points={[
                    `Search and add ${isStocksConnection ? "stock" : "coin"} symbols.`,
                    'Click "For All" to target all trending assets.',
                  ]}
                />
              </div>

              <div className="flex items-center gap-3 mb-3">
                <button
                  type="button"
                  onClick={() => {
                    setForAllAssets(!forAllAssets);
                    if (!forAllAssets) {
                      setTargetAssets([]);
                      setAssetSearch("");
                      clearAssetResults();
                    }
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                    forAllAssets
                      ? "bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] text-white border-[var(--primary)]/50"
                      : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
                  }`}
                >
                  For All
                </button>
                {forAllAssets && (
                  <p className="text-xs text-emerald-400">
                    Strategy will run on all top trending {isStocksConnection ? "stocks" : "crypto assets"}.
                  </p>
                )}
              </div>

              {!forAllAssets && (
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      value={assetSearch}
                      onChange={(e) => setAssetSearch(e.target.value)}
                      placeholder={isStocksConnection ? "Search e.g., AAPL, MSFT" : "Search e.g., BTC, ETH"}
                      className={`w-full rounded-xl bg-black/30 border px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:ring-1 focus:outline-none ${
                        hasNoAssetMatch
                          ? "border-red-400/60 focus:border-red-300 focus:ring-red-400/30"
                          : "border-white/10 focus:border-[var(--primary)]/50 focus:ring-[var(--primary)]/30"
                      }`}
                    />
                    {searchingAssets && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>

                  {assetResults.length > 0 && (
                    <div className="rounded-xl bg-black/40 border border-white/10 max-h-40 overflow-y-auto">
                      {assetResults.map((asset) => (
                        <button
                          key={asset.symbol}
                          type="button"
                          onClick={() => addAsset(asset.symbol)}
                          disabled={targetAssets.includes(asset.symbol)}
                          className={`w-full text-left px-3.5 py-2 hover:bg-white/5 flex items-center justify-between border-b border-white/5 last:border-0 ${
                            targetAssets.includes(asset.symbol) ? "opacity-50" : ""
                          }`}
                        >
                          <span className="text-sm">
                            <span className="text-white font-medium">{asset.symbol}</span>
                            <span className="text-slate-400 ml-2">{asset.name}</span>
                          </span>
                          {targetAssets.includes(asset.symbol) ? (
                            <span className="text-xs text-emerald-400">Added</span>
                          ) : (
                            <span className="text-xs text-[var(--primary-light)]">+ Add</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {hasNoAssetMatch && (
                    <p className="text-xs text-red-300">No such {isStocksConnection ? "stock" : "coin"} exists.</p>
                  )}

                  <div>
                    <p className="text-xs text-slate-400 mb-1.5">Selected ({targetAssets.length})</p>
                    {targetAssets.length === 0 ? (
                      <p className="text-xs text-slate-500">No {isStocksConnection ? "stocks" : "crypto assets"} selected.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {targetAssets.map((symbol) => (
                          <span
                            key={symbol}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-[var(--primary)]/10 to-[var(--primary-light)]/10 border border-[var(--primary)]/30 rounded-lg text-xs text-white"
                          >
                            {symbol}
                            <button type="button" onClick={() => removeAsset(symbol)} className="text-slate-400 hover:text-red-400">
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-xs text-slate-400 mb-1.5">Quick Add</p>
                    <div className="flex flex-wrap gap-1.5">
                      {popularAssets.map((symbol) => (
                        <button
                          key={symbol}
                          type="button"
                          onClick={() => addAsset(symbol)}
                          disabled={targetAssets.includes(symbol)}
                          className={`px-2.5 py-1 rounded-lg text-xs border transition-all ${
                            targetAssets.includes(symbol)
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                              : "bg-white/5 text-slate-300 hover:bg-white/10 border-white/10 hover:border-[var(--primary)]/30"
                          }`}
                        >
                          {symbol}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* AI Engine Weights */}
            <section className="rounded-2xl bg-white/[0.03] border border-white/10 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">AI Engine Weights</h3>
                <StepGuideTooltip
                  title="AI Weights"
                  subtitle="How much each engine influences the score."
                  points={[
                    "All weights must total exactly 100%.",
                    "Higher weight = stronger influence on signals.",
                    "Use presets for a quick starting configuration.",
                  ]}
                />
              </div>

              <div className={`p-3 rounded-xl mb-3 ${weightsValid ? "bg-emerald-500/10 border border-emerald-500/30" : "bg-red-500/10 border border-red-500/30"}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-300">Total Weight:</span>
                  <span className={`text-base font-bold ${weightsValid ? "text-emerald-400" : "text-red-400"}`}>
                    {(totalWeight * 100).toFixed(0)}%
                  </span>
                </div>
                {!weightsValid && <p className="text-[11px] text-red-400 mt-1">Weights must total exactly 100%</p>}
              </div>

              <div className="space-y-3">
                {ENGINE_WEIGHT_ROWS.map(({ key, label, desc, icon }) => (
                  <div key={key} className="p-3 rounded-xl bg-black/20 border border-white/5">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{icon}</span>
                        <div>
                          <p className="text-sm font-medium text-white">{label}</p>
                          <p className="text-[11px] text-slate-400">{desc}</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-[var(--primary-light)]">
                        {(engineWeights[key] * 100).toFixed(0)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={engineWeights[key] * 100}
                      onChange={(e) => updateEngineWeight(key, parseInt(e.target.value) / 100)}
                      className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[var(--primary)]"
                    />
                  </div>
                ))}
              </div>

              <div className="border-t border-white/10 pt-3 mt-3">
                <p className="text-xs text-slate-400 mb-2">Quick Presets:</p>
                <div className="flex flex-wrap gap-1.5">
                  {WEIGHT_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setEngineWeights({ ...preset.weights })}
                      className="px-2.5 py-1.5 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10 text-xs"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Buy Rules */}
            <section className="rounded-2xl bg-white/[0.03] border border-white/10 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">Buy Signal Rules</h3>
                <StepGuideTooltip
                  title="Buy Rules"
                  subtitle="Minimum AI score needed to generate a BUY signal."
                  points={[
                    "ALL rules must be met to fire a signal.",
                    "Higher values = fewer, stronger signals.",
                    "Values must be above 0 (scale is -1 to 1).",
                  ]}
                />
              </div>

              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-emerald-400">ALL conditions must be met</p>
                <button
                  type="button"
                  onClick={addRule}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-xs border border-emerald-500/30"
                >
                  + Add Rule
                </button>
              </div>

              <div className="space-y-2">
                {entryRules.map((rule, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2.5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                    <select
                      value={rule.field}
                      onChange={(e) => updateRule(idx, { field: e.target.value })}
                      className="flex-1 rounded-lg bg-black/30 border border-white/10 px-2.5 py-1.5 text-xs text-white"
                    >
                      {RULE_FIELDS.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={rule.operator}
                      onChange={(e) => updateRule(idx, { operator: e.target.value })}
                      className="rounded-lg bg-black/30 border border-white/10 px-2.5 py-1.5 text-xs text-white"
                    >
                      {OPERATORS.map((op) => (
                        <option key={op.value} value={op.value}>
                          {op.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      step={0.1}
                      min={0.1}
                      max={1}
                      value={rule.value}
                      onChange={(e) => updateRule(idx, { value: parseFloat(e.target.value) || 0.1 })}
                      className="w-16 rounded-lg bg-black/30 border border-white/10 px-2 py-1.5 text-xs text-white"
                    />
                    {entryRules.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRule(idx)}
                        className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Risk Management */}
            <section className="rounded-2xl bg-white/[0.03] border border-white/10 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">Risk Management</h3>
                <StepGuideTooltip
                  title="Risk"
                  subtitle="Protect downside and lock in profits."
                  points={[
                    "Stop Loss controls max downside per trade.",
                    "Take Profit defines your target gain.",
                    "Aim for a 1:2+ risk/reward ratio.",
                  ]}
                />
              </div>

              <div className="mb-3">
                <p className="text-xs font-medium text-slate-300 mb-2">Risk Level</p>
                <div className="grid grid-cols-3 gap-2">
                  {(["low", "medium", "high"] as const).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setRiskLevel(level)}
                      className={`p-2.5 rounded-xl border-2 transition-all ${
                        riskLevel === level
                          ? level === "low"
                            ? "border-emerald-500 bg-emerald-500/10"
                            : level === "medium"
                              ? "border-yellow-500 bg-yellow-500/10"
                              : "border-red-500 bg-red-500/10"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      }`}
                    >
                      <p className={`text-sm font-semibold capitalize ${level === "low" ? "text-emerald-400" : level === "medium" ? "text-yellow-400" : "text-red-400"}`}>
                        {level}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Stop Loss (%)</label>
                  <input
                    type="number"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(parseFloat(e.target.value) || 0)}
                    min={1}
                    max={20}
                    step={0.5}
                    className="w-full rounded-xl bg-black/30 border border-white/10 px-3.5 py-2.5 text-sm text-white focus:border-[var(--primary)]/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Take Profit (%)</label>
                  <input
                    type="number"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(parseFloat(e.target.value) || 0)}
                    min={1}
                    max={50}
                    step={0.5}
                    className="w-full rounded-xl bg-black/30 border border-white/10 px-3.5 py-2.5 text-sm text-white focus:border-[var(--primary)]/50 focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-[var(--primary)]/10 to-[var(--primary-light)]/10 border border-[var(--primary)]/20">
                <p className="text-xs text-white">
                  <strong>Risk/Reward Ratio:</strong> 1:{stopLoss > 0 ? (takeProfit / stopLoss).toFixed(1) : "—"}
                </p>
              </div>
            </section>

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
            )}
          </div>
        )}

        {/* Footer */}
        {!loading && (
          <div className="sticky bottom-0 z-10 flex items-center justify-between gap-3 px-6 py-4 border-t border-white/10 bg-[#0e0e18] rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/5 text-white text-sm font-medium hover:bg-white/10 border border-white/10"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] text-white text-sm font-semibold hover:shadow-xl hover:shadow-[rgba(var(--primary-rgb),0.3)]/30 disabled:opacity-50 disabled:hover:shadow-none transition-all flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
