"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Strategy, StrategySignal, previewStrategy } from "@/lib/api/strategies";

interface StrategyDetailsModalProps {
  strategy: Strategy | null;
  isOpen: boolean;
  onClose: () => void;
  onUseStrategy: (strategyId: string) => void;
}

interface StrategyPreview {
  asset_id: string;
  symbol: string;
  action: string;
  final_score: number;
  confidence: number;
  error?: string;
}

export function StrategyDetailsModal({
  strategy,
  isOpen,
  onClose,
  onUseStrategy,
}: StrategyDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<"signals" | "engine" | "settings">("signals");
  const [previewData, setPreviewData] = useState<StrategyPreview[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState<StrategyPreview | null>(null);
  const loadingRef = useRef(false);

  const loadPreview = useCallback(async () => {
    if (!strategy || loadingRef.current) return;
    
    try {
      loadingRef.current = true;
      setIsLoading(true);
      const data = await previewStrategy(strategy.strategy_id, 50);
      setPreviewData(data);
    } catch (error: any) {
      console.error("Failed to load preview:", error);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [strategy?.strategy_id]);

  useEffect(() => {
    if (isOpen && strategy) {
      loadPreview();
    } else {
      // Reset when modal closes
      setPreviewData([]);
      setSelectedSignal(null);
      setActiveTab("signals");
    }
  }, [isOpen, strategy, loadPreview]);

  if (!isOpen || !strategy) return null;

  const engineWeights = strategy.engine_weights as any || {
    sentiment: 0.35,
    trend: 0.25,
    fundamental: 0.15,
    event_risk: 0.15,
    liquidity: 0.10,
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "BUY":
        return "bg-green-100 text-green-800 border-green-300";
      case "SELL":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "BUY":
        return "↑";
      case "SELL":
        return "↓";
      default:
        return "→";
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{strategy.name}</h2>
              <p className="text-sm text-gray-600 mt-1">{strategy.description}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
            >
              ×
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 bg-white">
            <button
              onClick={() => setActiveTab("signals")}
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                activeTab === "signals"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              📊 All Signals ({previewData.length})
            </button>
            <button
              onClick={() => setActiveTab("engine")}
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                activeTab === "engine"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              ⚙️ Engine Details
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                activeTab === "settings"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              ⚙️ Settings
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === "signals" && (
              <div className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-gray-500 mt-4">Loading signals...</p>
                  </div>
                ) : previewData.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No signals available
                  </div>
                ) : (
                  <>
                    {/* Signal Filters */}
                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={() => setSelectedSignal(null)}
                        className={`px-3 py-1.5 rounded text-xs font-medium ${
                          !selectedSignal
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        All ({previewData.length})
                      </button>
                      <button
                        onClick={() => {
                          const buy = previewData.find((p) => p.action === "BUY");
                          setSelectedSignal(buy || null);
                        }}
                        className={`px-3 py-1.5 rounded text-xs font-medium ${
                          selectedSignal?.action === "BUY"
                            ? "bg-green-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        BUY ({previewData.filter((p) => p.action === "BUY").length})
                      </button>
                      <button
                        onClick={() => {
                          const sell = previewData.find((p) => p.action === "SELL");
                          setSelectedSignal(sell || null);
                        }}
                        className={`px-3 py-1.5 rounded text-xs font-medium ${
                          selectedSignal?.action === "SELL"
                            ? "bg-red-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        SELL ({previewData.filter((p) => p.action === "SELL").length})
                      </button>
                    </div>

                    {/* Signals Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Asset</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Signal</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Score</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Confidence</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {previewData
                            .filter((signal) => !selectedSignal || signal.action === selectedSignal.action)
                            .sort((a, b) => (b.final_score || 0) - (a.final_score || 0))
                            .map((signal) => (
                              <tr
                                key={signal.asset_id}
                                className="hover:bg-gray-50 cursor-pointer"
                                onClick={() => setSelectedSignal(signal)}
                              >
                                <td className="px-4 py-3 font-semibold text-gray-900">
                                  {signal.symbol}
                                </td>
                                <td className="px-4 py-3">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${getActionColor(
                                      signal.action
                                    )}`}
                                  >
                                    <span>{getActionIcon(signal.action)}</span>
                                    {signal.action}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="font-semibold text-gray-900">
                                    {(signal.final_score || 0).toFixed(3)}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-[100px]">
                                      <div
                                        className="h-full bg-blue-500"
                                        style={{
                                          width: `${(signal.confidence || 0) * 100}%`,
                                        }}
                                      />
                                    </div>
                                    <span className="text-xs text-gray-600">
                                      {((signal.confidence || 0) * 100).toFixed(0)}%
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <button className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                                    View →
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>

                    {/* LLM Explanation Section */}
                    {selectedSignal && (
                      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">🤖</span>
                          <h4 className="font-semibold text-gray-900">
                            AI Explanation for {selectedSignal.symbol}
                          </h4>
                        </div>
                        <div className="bg-white rounded p-4 border border-gray-200">
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold ${getActionColor(
                                selectedSignal.action
                              )}`}
                            >
                              {selectedSignal.action}
                            </span>
                            <span className="text-xs text-gray-500">
                              Score: {(selectedSignal.final_score || 0).toFixed(3)} | Confidence:{" "}
                              {((selectedSignal.confidence || 0) * 100).toFixed(1)}%
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            The {selectedSignal.action} signal for {selectedSignal.symbol} is
                            triggered based on the fusion of multiple engine scores. The final score
                            of {(selectedSignal.final_score || 0).toFixed(3)} indicates a{" "}
                            {selectedSignal.action === "BUY"
                              ? "strong bullish"
                              : selectedSignal.action === "SELL"
                              ? "strong bearish"
                              : "neutral"}{" "}
                            opportunity with {((selectedSignal.confidence || 0) * 100).toFixed(1)}%
                            confidence. This recommendation considers sentiment analysis, technical
                            indicators, fundamental factors, liquidity conditions, and event risk
                            assessment.
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === "engine" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Engine Weights</h3>
                  <div className="space-y-4">
                    {Object.entries(engineWeights).map(([key, value]: [string, any]) => {
                      const percentage = Math.round((value || 0) * 100);
                      const colors: Record<string, { bg: string; text: string }> = {
                        sentiment: { bg: "bg-blue-500", text: "text-blue-700" },
                        trend: { bg: "bg-purple-500", text: "text-purple-700" },
                        fundamental: { bg: "bg-green-500", text: "text-green-700" },
                        event_risk: { bg: "bg-orange-500", text: "text-orange-700" },
                        liquidity: { bg: "bg-cyan-500", text: "text-cyan-700" },
                      };
                      const color = colors[key] || { bg: "bg-gray-500", text: "text-gray-700" };
                      return (
                        <div key={key} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-900 capitalize">
                              {key.replace("_", " ")}
                            </span>
                            <span className={`font-bold ${color.text}`}>{percentage}%</span>
                          </div>
                          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${color.bg} transition-all duration-500`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Strategy Rules</h3>
                  <div className="space-y-4">
                    {strategy.entry_rules && Array.isArray(strategy.entry_rules) && (
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <h4 className="font-semibold text-green-900 mb-2">Entry Rules</h4>
                        <ul className="space-y-1 text-sm text-green-800">
                          {strategy.entry_rules.map((rule: any, idx: number) => (
                            <li key={idx} className="flex items-center gap-2">
                              <span className="text-green-600">•</span>
                              <span>
                                {rule.indicator} {rule.operator} {rule.value}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {strategy.exit_rules && Array.isArray(strategy.exit_rules) && (
                      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                        <h4 className="font-semibold text-red-900 mb-2">Exit Rules</h4>
                        <ul className="space-y-1 text-sm text-red-800">
                          {strategy.exit_rules.map((rule: any, idx: number) => (
                            <li key={idx} className="flex items-center gap-2">
                              <span className="text-red-600">•</span>
                              <span>
                                {rule.indicator} {rule.operator} {rule.value}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Risk Parameters</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-sm text-gray-600 mb-1">Stop Loss</div>
                      <div className="text-xl font-bold text-gray-900">
                        {strategy.stop_loss_value ? `${strategy.stop_loss_value}%` : "Not set"}
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-sm text-gray-600 mb-1">Take Profit</div>
                      <div className="text-xl font-bold text-gray-900">
                        {strategy.take_profit_value ? `${strategy.take_profit_value}%` : "Not set"}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Target Assets</h3>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-sm text-gray-600">
                      {Array.isArray(strategy.target_assets) && strategy.target_assets.length > 0
                        ? `${strategy.target_assets.length} assets configured`
                        : "No target assets set"}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
            >
              Close
            </button>
            <button
              onClick={() => {
                onUseStrategy(strategy.strategy_id);
                onClose();
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow-sm hover:shadow-md"
            >
              Use This Strategy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

