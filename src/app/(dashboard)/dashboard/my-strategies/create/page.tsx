"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiRequest } from "@/lib/api/client";
import { exchangesService } from "@/lib/api/exchanges.service";

// Engine-based fields that actually work in the signal generation system
// These match the pre-built strategies format exactly
const RULE_FIELDS = [
  { value: "final_score", label: "Final Score", description: "Combined weighted score from all engines (-1 to 1)" },
  { value: "metadata.engine_details.sentiment.score", label: "Sentiment Score", description: "News & social sentiment analysis (-1 to 1)" },
  { value: "metadata.engine_details.trend.score", label: "Trend Score", description: "Technical trend analysis (-1 to 1)" },
  { value: "metadata.engine_details.fundamental.score", label: "Fundamental Score", description: "Earnings, financials, growth metrics (-1 to 1)" },
  { value: "metadata.engine_details.event_risk.score", label: "Event Risk Score", description: "Earnings events, news risk (-1 to 1)" },
  { value: "metadata.engine_details.liquidity.score", label: "Liquidity Score", description: "Volume & market depth (-1 to 1)" },
];

const OPERATORS = [
  { value: ">", label: "Greater than (>)" },
  { value: "<", label: "Less than (<)" },
  { value: ">=", label: "Greater or equal (≥)" },
  { value: "<=", label: "Less or equal (≤)" },
];

// Popular crypto symbols for quick add
const POPULAR_CRYPTO = ["BTC", "ETH", "SOL", "BNB", "XRP", "ADA", "DOGE", "AVAX"];
// Popular stock symbols for quick add
const POPULAR_STOCKS = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "NVDA", "AMD"];

interface Rule {
  field: string;
  operator: string;
  value: number;
}

interface EngineWeights {
  sentiment: number;
  trend: number;
  fundamental: number;
  event_risk: number;
  liquidity: number;
}

interface AssetOption {
  symbol: string;
  name: string;
}

type Step = "basics" | "assets" | "weights" | "rules" | "risk" | "review";

export default function CreateStrategyPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>("basics");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Connection type detection
  const [connectionType, setConnectionType] = useState<"crypto" | "stocks" | null>(null);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [riskLevel, setRiskLevel] = useState<"low" | "medium" | "high">("medium");
  const [stopLoss, setStopLoss] = useState<number>(5);
  const [takeProfit, setTakeProfit] = useState<number>(15);
  const [targetAssets, setTargetAssets] = useState<string[]>([]);
  
  // Engine weights (must sum to 1.0)
  const [engineWeights, setEngineWeights] = useState<EngineWeights>({
    sentiment: 0.35,
    trend: 0.25,
    fundamental: 0.15,
    event_risk: 0.15,
    liquidity: 0.10,
  });
  
  // Entry and exit rules based on scores (matching pre-built strategy format)
  const [entryRules, setEntryRules] = useState<Rule[]>([
    { field: "final_score", operator: ">", value: 0.5 }
  ]);
  const [exitRules, setExitRules] = useState<Rule[]>([
    { field: "final_score", operator: "<", value: -0.3 }
  ]);

  // Asset search
  const [assetSearch, setAssetSearch] = useState("");
  const [assetResults, setAssetResults] = useState<AssetOption[]>([]);
  const [searchingAssets, setSearchingAssets] = useState(false);

  // Check connection type on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await exchangesService.getActiveConnection();
        setConnectionType(response.data?.exchange?.type || null);
      } catch (error) {
        console.error("Failed to check connection type:", error);
      } finally {
        setIsCheckingConnection(false);
      }
    };
    checkConnection();
  }, []);

  // Derived values
  const isStocksConnection = connectionType === "stocks";
  const assetTypeLabel = isStocksConnection ? "Stocks" : "Crypto Assets";
  const popularAssets = isStocksConnection ? POPULAR_STOCKS : POPULAR_CRYPTO;

  // Calculate total weight
  const totalWeight = Object.values(engineWeights).reduce((a, b) => a + b, 0);
  const weightsValid = Math.abs(totalWeight - 1.0) < 0.01;

  // Search assets from backend
  useEffect(() => {
    if (assetSearch.length < 1) {
      setAssetResults([]);
      return;
    }
    
    const timer = setTimeout(async () => {
      setSearchingAssets(true);
      try {
        // Use different endpoint based on connection type
        const searchEndpoint = isStocksConnection
          ? `/strategies/available-stocks?search=${encodeURIComponent(assetSearch)}`
          : `/strategies/available-crypto?search=${encodeURIComponent(assetSearch)}`;
        
        const results = await apiRequest<never, AssetOption[]>({
          path: searchEndpoint,
          method: "GET",
        });
        setAssetResults(results || []);
      } catch (err) {
        console.error("Asset search error:", err);
        // For crypto, if endpoint doesn't exist, allow manual entry
        if (!isStocksConnection) {
          setAssetResults([{ symbol: assetSearch.toUpperCase(), name: assetSearch.toUpperCase() }]);
        } else {
          setAssetResults([]);
        }
      } finally {
        setSearchingAssets(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [assetSearch, isStocksConnection]);

  const addAsset = (symbol: string) => {
    const upperSymbol = symbol.toUpperCase();
    if (!targetAssets.includes(upperSymbol)) {
      setTargetAssets([...targetAssets, upperSymbol]);
    }
    setAssetSearch("");
    setAssetResults([]);
  };

  const removeAsset = (symbol: string) => {
    setTargetAssets(targetAssets.filter((s) => s !== symbol));
  };

  const updateEngineWeight = (engine: keyof EngineWeights, value: number) => {
    setEngineWeights(prev => ({ ...prev, [engine]: value }));
  };

  const addRule = (type: "entry" | "exit") => {
    const newRule: Rule = {
      field: "final_score",
      operator: type === "entry" ? ">" : "<",
      value: type === "entry" ? 0.3 : -0.3,
    };
    if (type === "entry") {
      setEntryRules([...entryRules, newRule]);
    } else {
      setExitRules([...exitRules, newRule]);
    }
  };

  const updateRule = (type: "entry" | "exit", index: number, updates: Partial<Rule>) => {
    if (type === "entry") {
      const updated = [...entryRules];
      updated[index] = { ...updated[index], ...updates };
      setEntryRules(updated);
    } else {
      const updated = [...exitRules];
      updated[index] = { ...updated[index], ...updates };
      setExitRules(updated);
    }
  };

  const removeRule = (type: "entry" | "exit", index: number) => {
    if (type === "entry") {
      setEntryRules(entryRules.filter((_, i) => i !== index));
    } else {
      setExitRules(exitRules.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      // Use correct endpoint based on connection type
      const endpoint = isStocksConnection ? "/strategies/custom/stocks" : "/strategies/custom/crypto";
      
      await apiRequest({
        path: endpoint,
        method: "POST",
        body: {
          name,
          description,
          type: "user", // User-created custom strategy
          risk_level: riskLevel,
          stop_loss_type: "percentage",
          stop_loss_value: stopLoss,
          take_profit_type: "percentage",
          take_profit_value: takeProfit,
          target_assets: targetAssets,
          engine_weights: engineWeights,
          entry_rules: entryRules.map((r) => ({
            field: r.field,
            operator: r.operator,
            value: r.value,
          })),
          exit_rules: exitRules.map((r) => ({
            field: r.field,
            operator: r.operator,
            value: r.value,
          })),
          indicators: [], // No technical indicators for score-based strategies
        },
      });

      router.push("/dashboard/my-strategies");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create strategy";
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const steps: { key: Step; label: string }[] = [
    { key: "basics", label: "Basics" },
    { key: "assets", label: isStocksConnection ? "Stocks" : "Crypto" },
    { key: "weights", label: "AI Weights" },
    { key: "rules", label: "Rules" },
    { key: "risk", label: "Risk" },
    { key: "review", label: "Review" },
  ];

  const canProceed = () => {
    switch (currentStep) {
      case "basics":
        return name.trim().length > 0;
      case "assets":
        return targetAssets.length > 0;
      case "weights":
        return weightsValid;
      case "rules":
        return entryRules.length > 0;
      case "risk":
        return stopLoss > 0 && takeProfit > 0;
      case "review":
        return true;
      default:
        return false;
    }
  };

  const goNext = () => {
    const idx = steps.findIndex((s) => s.key === currentStep);
    if (idx < steps.length - 1) {
      setCurrentStep(steps[idx + 1].key);
    }
  };

  const goPrev = () => {
    const idx = steps.findIndex((s) => s.key === currentStep);
    if (idx > 0) {
      setCurrentStep(steps[idx - 1].key);
    }
  };

  // Helper to get field label
  const getFieldLabel = (field: string) => {
    return RULE_FIELDS.find(f => f.value === field)?.label || field;
  };

  // Show loading while checking connection
  if (isCheckingConnection) {
    return (
      <div className="max-w-4xl mx-auto pb-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-[#fc4f02]/30 border-t-[#fc4f02] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-8">
      {/* Hero Header */}
      <div className="relative rounded-2xl bg-gradient-to-br from-[#fc4f02]/20 via-[#fda300]/10 to-transparent p-6 mb-8 border border-[#fc4f02]/20 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-[#fc4f02]/30 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative">
          <Link 
            href="/dashboard/my-strategies"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white/90 hover:text-[#fda300] transition-colors mb-3 group"
          >
            <svg className="w-4 h-4 text-white group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-white/90 group-hover:text-[#fda300]">Back to My Strategies</span>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#fc4f02] to-[#fda300] flex items-center justify-center shadow-lg shadow-[#fc4f02]/30">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Create {isStocksConnection ? 'Stock' : 'Crypto'} Strategy
              </h1>
              <span className={`inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                isStocksConnection 
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                {isStocksConnection ? '📈 Stocks Mode' : '₿ Crypto Mode'}
              </span>
            </div>
          </div>
          <p className="text-slate-400 max-w-lg">
            Build your own AI-powered {isStocksConnection ? 'stock' : 'crypto'} trading strategy using the same engines as our pre-built strategies
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10">
        {steps.map((step, idx) => {
          const isCurrent = step.key === currentStep;
          const isPast = steps.findIndex((s) => s.key === currentStep) > idx;
          return (
            <button
              key={step.key}
              onClick={() => isPast && setCurrentStep(step.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm whitespace-nowrap transition-all duration-200 ${
                isCurrent
                  ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white shadow-lg shadow-[#fc4f02]/30"
                  : isPast
                  ? "bg-emerald-500/20 text-emerald-400 cursor-pointer hover:bg-emerald-500/30 border border-emerald-500/30"
                  : "bg-white/5 text-slate-400 border border-white/10"
              }`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                isCurrent ? "bg-white/20" : isPast ? "bg-emerald-500/30" : "bg-white/10"
              }`}>
                {isPast ? "✓" : idx + 1}
              </span>
              {step.label}
            </button>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="rounded-2xl bg-gradient-to-br from-white/[0.07] via-white/[0.03] to-transparent p-6 sm:p-8 border border-white/10 backdrop-blur">
        
        {/* Step 1: Basics */}
        {currentStep === "basics" && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#fc4f02]/20 to-[#fda300]/20 flex items-center justify-center border border-[#fc4f02]/30">
                <span className="text-[#fda300] font-bold">1</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Strategy Basics</h3>
                <p className="text-sm text-slate-400">Name and describe your strategy</p>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Strategy Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., My Growth Strategy"
                className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3.5 text-white placeholder:text-slate-500 focus:border-[#fc4f02]/50 focus:ring-1 focus:ring-[#fc4f02]/30 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your strategy's approach..."
                rows={3}
                className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3.5 text-white placeholder:text-slate-500 focus:border-[#fc4f02]/50 focus:ring-1 focus:ring-[#fc4f02]/30 focus:outline-none transition-all resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 2: Asset Selection (Dynamic for Stocks/Crypto) */}
        {currentStep === "assets" && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#fc4f02]/20 to-[#fda300]/20 flex items-center justify-center border border-[#fc4f02]/30">
                <span className="text-[#fda300] font-bold">2</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Select {assetTypeLabel}</h3>
                <p className="text-sm text-slate-400">Choose which {isStocksConnection ? 'stocks' : 'crypto assets'} this strategy will analyze</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Search & Add {assetTypeLabel} *</label>
              <div className="relative">
                <input
                  type="text"
                  value={assetSearch}
                  onChange={(e) => setAssetSearch(e.target.value)}
                  placeholder={isStocksConnection ? "Search by symbol (e.g., AAPL, MSFT)" : "Search by symbol (e.g., BTC, ETH)"}
                  className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3.5 text-white placeholder:text-slate-500 focus:border-[#fc4f02]/50 focus:ring-1 focus:ring-[#fc4f02]/30 focus:outline-none transition-all"
                />
                {searchingAssets && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-5 h-5 border-2 border-[#fc4f02]/30 border-t-[#fc4f02] rounded-full animate-spin"></div>
                  </div>
                )}
              </div>

              {assetResults.length > 0 && (
                <div className="mt-2 rounded-xl bg-black/40 border border-white/10 max-h-48 overflow-y-auto">
                  {assetResults.map((asset) => (
                    <button
                      key={asset.symbol}
                      onClick={() => addAsset(asset.symbol)}
                      disabled={targetAssets.includes(asset.symbol)}
                      className={`w-full text-left px-4 py-3 hover:bg-white/5 flex items-center justify-between border-b border-white/5 last:border-0 ${
                        targetAssets.includes(asset.symbol) ? "opacity-50" : ""
                      }`}
                    >
                      <div>
                        <span className="text-white font-medium">{asset.symbol}</span>
                        <span className="text-slate-400 text-sm ml-2">{asset.name}</span>
                      </div>
                      {targetAssets.includes(asset.symbol) ? (
                        <span className="text-xs text-emerald-400">Added</span>
                      ) : (
                        <span className="text-xs text-[#fda300]">+ Add</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Assets */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Selected {assetTypeLabel} ({targetAssets.length})
              </label>
              {targetAssets.length === 0 ? (
                <p className="text-slate-500 text-sm">No {isStocksConnection ? 'stocks' : 'crypto assets'} selected. Use the search above or quick-add below.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {targetAssets.map((symbol) => (
                    <span
                      key={symbol}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-[#fc4f02]/10 to-[#fda300]/10 border border-[#fc4f02]/30 rounded-lg text-white font-medium"
                    >
                      {symbol}
                      <button onClick={() => removeAsset(symbol)} className="text-slate-400 hover:text-red-400">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Add */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Quick Add Popular</label>
              <div className="flex flex-wrap gap-2">
                {popularAssets.map((symbol) => (
                  <button
                    key={symbol}
                    onClick={() => addAsset(symbol)}
                    disabled={targetAssets.includes(symbol)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                      targetAssets.includes(symbol)
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10 hover:border-[#fc4f02]/30"
                    }`}
                  >
                    {symbol}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Engine Weights */}
        {currentStep === "weights" && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#fc4f02]/20 to-[#fda300]/20 flex items-center justify-center border border-[#fc4f02]/30">
                <span className="text-[#fda300] font-bold">3</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">AI Engine Weights</h3>
                <p className="text-sm text-slate-400">Adjust how much each AI engine influences signals (must total 100%)</p>
              </div>
            </div>

            <div className={`p-4 rounded-xl ${weightsValid ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-300">Total Weight:</span>
                <span className={`text-lg font-bold ${weightsValid ? 'text-emerald-400' : 'text-red-400'}`}>
                  {(totalWeight * 100).toFixed(0)}%
                </span>
              </div>
              {!weightsValid && (
                <p className="text-xs text-red-400 mt-1">Weights must total exactly 100%</p>
              )}
            </div>

            <div className="space-y-4">
              {[
                { key: "sentiment", label: "Sentiment", desc: "News & social media sentiment analysis", icon: "💭" },
                { key: "trend", label: "Trend", desc: "Technical indicators & price momentum", icon: "📈" },
                { key: "fundamental", label: "Fundamental", desc: "Earnings, revenue, financial health", icon: "📊" },
                { key: "event_risk", label: "Event Risk", desc: "Earnings dates, news events, volatility", icon: "⚠️" },
                { key: "liquidity", label: "Liquidity", desc: "Trading volume & market depth", icon: "💧" },
              ].map(({ key, label, desc, icon }) => (
                <div key={key} className="p-4 rounded-xl bg-black/20 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{icon}</span>
                      <div>
                        <p className="font-medium text-white">{label}</p>
                        <p className="text-xs text-slate-400">{desc}</p>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-[#fda300]">
                      {(engineWeights[key as keyof EngineWeights] * 100).toFixed(0)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={engineWeights[key as keyof EngineWeights] * 100}
                    onChange={(e) => updateEngineWeight(key as keyof EngineWeights, parseInt(e.target.value) / 100)}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#fc4f02]"
                  />
                </div>
              ))}
            </div>

            {/* Presets */}
            <div className="border-t border-white/10 pt-4">
              <p className="text-sm text-slate-400 mb-3">Quick Presets:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setEngineWeights({ sentiment: 0.4, trend: 0.35, fundamental: 0.1, event_risk: 0.1, liquidity: 0.05 })}
                  className="px-3 py-2 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10 text-sm"
                >
                  🚀 Momentum (like Tech Momentum)
                </button>
                <button
                  onClick={() => setEngineWeights({ sentiment: 0.15, trend: 0.1, fundamental: 0.5, event_risk: 0.2, liquidity: 0.05 })}
                  className="px-3 py-2 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10 text-sm"
                >
                  💎 Value (like Value Investing)
                </button>
                <button
                  onClick={() => setEngineWeights({ sentiment: 0.35, trend: 0.25, fundamental: 0.15, event_risk: 0.15, liquidity: 0.1 })}
                  className="px-3 py-2 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10 text-sm"
                >
                  ⚖️ Balanced (like Alpha Fusion)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Entry & Exit Rules */}
        {currentStep === "rules" && (
          <div className="space-y-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#fc4f02]/20 to-[#fda300]/20 flex items-center justify-center border border-[#fc4f02]/30">
                <span className="text-[#fda300] font-bold">4</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Entry & Exit Rules</h3>
                <p className="text-sm text-slate-400">Define score thresholds for BUY and SELL signals</p>
              </div>
            </div>

            {/* Entry Rules */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-medium text-emerald-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    Entry Rules (BUY when ALL conditions are met)
                  </h4>
                </div>
                <button
                  onClick={() => addRule("entry")}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-sm border border-emerald-500/30"
                >
                  + Add
                </button>
              </div>
              
              <div className="space-y-2">
                {entryRules.map((rule, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                    <select
                      value={rule.field}
                      onChange={(e) => updateRule("entry", idx, { field: e.target.value })}
                      className="flex-1 rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm text-white"
                    >
                      {RULE_FIELDS.map((f) => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                    <select
                      value={rule.operator}
                      onChange={(e) => updateRule("entry", idx, { operator: e.target.value })}
                      className="rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm text-white"
                    >
                      {OPERATORS.map((op) => (
                        <option key={op.value} value={op.value}>{op.label}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      step={0.1}
                      min={-1}
                      max={1}
                      value={rule.value}
                      onChange={(e) => updateRule("entry", idx, { value: parseFloat(e.target.value) || 0 })}
                      className="w-20 rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm text-white"
                    />
                    <button onClick={() => removeRule("entry", idx)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Exit Rules */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-medium text-red-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-400"></span>
                    Exit Rules (SELL when ANY condition is met)
                  </h4>
                </div>
                <button
                  onClick={() => addRule("exit")}
                  className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-sm border border-red-500/30"
                >
                  + Add
                </button>
              </div>
              
              <div className="space-y-2">
                {exitRules.map((rule, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-3 bg-red-500/5 border border-red-500/20 rounded-xl">
                    <select
                      value={rule.field}
                      onChange={(e) => updateRule("exit", idx, { field: e.target.value })}
                      className="flex-1 rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm text-white"
                    >
                      {RULE_FIELDS.map((f) => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                    <select
                      value={rule.operator}
                      onChange={(e) => updateRule("exit", idx, { operator: e.target.value })}
                      className="rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm text-white"
                    >
                      {OPERATORS.map((op) => (
                        <option key={op.value} value={op.value}>{op.label}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      step={0.1}
                      min={-1}
                      max={1}
                      value={rule.value}
                      onChange={(e) => updateRule("exit", idx, { value: parseFloat(e.target.value) || 0 })}
                      className="w-20 rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm text-white"
                    />
                    <button onClick={() => removeRule("exit", idx)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Info Box */}
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <p className="text-sm text-blue-300">
                <strong>💡 Tip:</strong> Scores range from -1 (very bearish) to +1 (very bullish). 
                A final_score &gt; 0.5 typically indicates a strong BUY signal.
              </p>
            </div>
          </div>
        )}

        {/* Step 5: Risk Management */}
        {currentStep === "risk" && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#fc4f02]/20 to-[#fda300]/20 flex items-center justify-center border border-[#fc4f02]/30">
                <span className="text-[#fda300] font-bold">5</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Risk Management</h3>
                <p className="text-sm text-slate-400">Set stop-loss and take-profit levels</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">Risk Level</label>
              <div className="grid grid-cols-3 gap-3">
                {(["low", "medium", "high"] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => {
                      setRiskLevel(level);
                      if (level === "low") { setStopLoss(3); setTakeProfit(10); }
                      if (level === "medium") { setStopLoss(5); setTakeProfit(15); }
                      if (level === "high") { setStopLoss(7); setTakeProfit(20); }
                    }}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      riskLevel === level
                        ? level === "low" ? "border-emerald-500 bg-emerald-500/10"
                        : level === "medium" ? "border-yellow-500 bg-yellow-500/10"
                        : "border-red-500 bg-red-500/10"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    }`}
                  >
                    <p className={`font-semibold capitalize ${
                      level === "low" ? "text-emerald-400" : level === "medium" ? "text-yellow-400" : "text-red-400"
                    }`}>{level}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {level === "low" && "Conservative, tighter stops"}
                      {level === "medium" && "Balanced risk/reward"}
                      {level === "high" && "Aggressive, wider stops"}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Stop Loss (%)</label>
                <input
                  type="number"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(parseFloat(e.target.value) || 0)}
                  min={1}
                  max={20}
                  step={0.5}
                  className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3.5 text-white focus:border-[#fc4f02]/50 focus:outline-none"
                />
                <p className="text-xs text-slate-500 mt-1">Sell if price drops by this %</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Take Profit (%)</label>
                <input
                  type="number"
                  value={takeProfit}
                  onChange={(e) => setTakeProfit(parseFloat(e.target.value) || 0)}
                  min={1}
                  max={50}
                  step={0.5}
                  className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3.5 text-white focus:border-[#fc4f02]/50 focus:outline-none"
                />
                <p className="text-xs text-slate-500 mt-1">Sell when price gains this %</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-r from-[#fc4f02]/10 to-[#fda300]/10 border border-[#fc4f02]/20">
              <p className="text-sm text-white">
                <strong>Risk/Reward Ratio:</strong> 1:{(takeProfit / stopLoss).toFixed(1)}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                A ratio of 1:2 or higher is generally recommended.
              </p>
            </div>
          </div>
        )}

        {/* Step 6: Review */}
        {currentStep === "review" && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#fc4f02]/20 to-[#fda300]/20 flex items-center justify-center border border-[#fc4f02]/30">
                <span className="text-[#fda300] font-bold">✓</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Review Your Strategy</h3>
                <p className="text-sm text-slate-400">Confirm all settings before creating</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-black/20 rounded-xl border border-white/5">
                <p className="text-xs text-slate-400">Name</p>
                <p className="text-white font-medium">{name || "—"}</p>
              </div>
              <div className="p-4 bg-black/20 rounded-xl border border-white/5">
                <p className="text-xs text-slate-400">Risk Level</p>
                <p className={`font-medium capitalize ${
                  riskLevel === "low" ? "text-emerald-400" : riskLevel === "medium" ? "text-yellow-400" : "text-red-400"
                }`}>{riskLevel}</p>
              </div>
              <div className="p-4 bg-black/20 rounded-xl border border-white/5">
                <p className="text-xs text-slate-400">Stop Loss</p>
                <p className="text-white">{stopLoss}%</p>
              </div>
              <div className="p-4 bg-black/20 rounded-xl border border-white/5">
                <p className="text-xs text-slate-400">Take Profit</p>
                <p className="text-white">{takeProfit}%</p>
              </div>
            </div>

            <div className="p-4 bg-black/20 rounded-xl border border-white/5">
              <p className="text-xs text-slate-400 mb-2">Target {assetTypeLabel} ({targetAssets.length})</p>
              <div className="flex flex-wrap gap-2">
                {targetAssets.map((s) => (
                  <span key={s} className="px-2.5 py-1 bg-gradient-to-r from-[#fc4f02]/10 to-[#fda300]/10 border border-[#fc4f02]/20 rounded-lg text-sm text-white">{s}</span>
                ))}
              </div>
            </div>

            <div className="p-4 bg-black/20 rounded-xl border border-white/5">
              <p className="text-xs text-slate-400 mb-2">AI Engine Weights</p>
              <div className="grid grid-cols-5 gap-2 text-center">
                {Object.entries(engineWeights).map(([key, val]) => (
                  <div key={key}>
                    <p className="text-lg font-bold text-[#fda300]">{(val * 100).toFixed(0)}%</p>
                    <p className="text-[10px] text-slate-400 capitalize">{key.replace('_', ' ')}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/20">
                <p className="text-xs text-emerald-400 mb-2">Entry Rules ({entryRules.length})</p>
                {entryRules.map((r, i) => (
                  <p key={i} className="text-sm text-white">{getFieldLabel(r.field)} {r.operator} {r.value}</p>
                ))}
              </div>
              <div className="p-4 bg-red-500/5 rounded-xl border border-red-500/20">
                <p className="text-xs text-red-400 mb-2">Exit Rules ({exitRules.length})</p>
                {exitRules.map((r, i) => (
                  <p key={i} className="text-sm text-white">{getFieldLabel(r.field)} {r.operator} {r.value}</p>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
          <button
            onClick={goPrev}
            disabled={currentStep === "basics"}
            className="px-5 py-2.5 rounded-xl bg-white/5 text-white font-medium hover:bg-white/10 border border-white/10 hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Previous
          </button>
          
          {currentStep === "review" ? (
            <button
              onClick={handleSubmit}
              disabled={submitting || !canProceed()}
              className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white font-semibold hover:shadow-xl hover:shadow-[#fc4f02]/30 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all duration-200 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  Create Strategy
                </>
              )}
            </button>
          ) : (
            <button
              onClick={goNext}
              disabled={!canProceed()}
              className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white font-semibold hover:shadow-xl hover:shadow-[#fc4f02]/30 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all duration-200 flex items-center gap-2"
            >
              Next
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
