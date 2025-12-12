"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Strategy } from "@/lib/api/strategies";
import { previewStrategy } from "@/lib/api/strategies";

interface StrategyPreview {
  asset_id: string;
  symbol: string;
  action: string;
  final_score: number;
  confidence: number;
  error?: string;
}

interface EnhancedStrategyCardProps {
  strategy: Strategy;
  onUseStrategy: (strategyId: string) => void;
  onViewDetails: (strategyId: string) => void;
  isSelected?: boolean;
  onSelect?: (strategyId: string, selected: boolean) => void;
}

export function EnhancedStrategyCard({
  strategy,
  onUseStrategy,
  onViewDetails,
  isSelected = false,
  onSelect,
}: EnhancedStrategyCardProps) {
  const [previewData, setPreviewData] = useState<StrategyPreview[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const loadingRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadPreview = useCallback(async () => {
    // Prevent duplicate calls
    if (loadingRef.current) {
      return;
    }

    try {
      loadingRef.current = true;
      setIsLoadingPreview(true);
      setPreviewError(null);
      const data = await previewStrategy(strategy.strategy_id, 50);
      setPreviewData(data);
    } catch (error: any) {
      console.error("Failed to load preview:", error);
      setPreviewError(error.message || "Failed to load preview");
    } finally {
      setIsLoadingPreview(false);
      loadingRef.current = false;
    }
  }, [strategy.strategy_id]);

  useEffect(() => {
    // Load preview on mount
    loadPreview();
    
    // Auto-refresh every 60 seconds
    intervalRef.current = setInterval(() => {
      loadPreview();
    }, 60000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [loadPreview]);

  // Calculate preview statistics
  const stats = {
    total: previewData.length,
    buy: previewData.filter((p) => p.action === "BUY").length,
    sell: previewData.filter((p) => p.action === "SELL").length,
    hold: previewData.filter((p) => p.action === "HOLD").length,
    errors: previewData.filter((p) => p.error).length,
  };

  // Get top 3 assets by score
  const topAssets = previewData
    .filter((p) => !p.error && p.action !== "HOLD")
    .sort((a, b) => (b.final_score || 0) - (a.final_score || 0))
    .slice(0, 3);

  // Get engine weights
  const engineWeights = strategy.engine_weights as any || {
    sentiment: 0.35,
    trend: 0.25,
    fundamental: 0.15,
    event_risk: 0.15,
    liquidity: 0.10,
  };

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "BUY":
        return "bg-green-100 text-green-800";
      case "SELL":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-md border-2 p-6 hover:shadow-xl transition-all duration-200 ${
        isSelected ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200"
      }`}
    >
      {/* Header with checkbox and title */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          {onSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect(strategy.strategy_id, e.target.checked)}
              className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
          )}
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-1 text-gray-900">{strategy.name}</h3>
            {strategy.description && (
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{strategy.description}</p>
            )}
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getRiskColor(
                strategy.risk_level
              )}`}
            >
              {strategy.risk_level.toUpperCase()} Risk
            </span>
          </div>
        </div>
      </div>

      {/* Live Signal Stats */}
      {isLoadingPreview ? (
        <div className="py-6 text-center">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <p className="text-xs text-gray-500 mt-2">Loading signals...</p>
        </div>
      ) : previewError ? (
        <div className="py-4 text-center text-red-500 text-sm bg-red-50 rounded p-3">
          {previewError}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600">{stats.buy}</div>
              <div className="text-xs text-green-700 font-medium mt-1">BUY</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="text-2xl font-bold text-red-600">{stats.sell}</div>
              <div className="text-xs text-red-700 font-medium mt-1">SELL</div>
            </div>
            <div className="text-center p-3 bg-amber-50 rounded-lg border border-amber-200">
              <div className="text-2xl font-bold text-amber-600">{stats.hold}</div>
              <div className="text-xs text-amber-700 font-medium mt-1">HOLD</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-gray-600">{stats.total}</div>
              <div className="text-xs text-gray-700 font-medium mt-1">Total</div>
            </div>
          </div>

          {/* Engine Weights Visualization */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-xs font-semibold text-gray-700 mb-2">Engine Weights</div>
            <div className="space-y-2">
              {Object.entries(engineWeights).map(([key, value]: [string, any]) => {
                const percentage = Math.round((value || 0) * 100);
                const colors: Record<string, string> = {
                  sentiment: "bg-blue-500",
                  trend: "bg-purple-500",
                  fundamental: "bg-green-500",
                  event_risk: "bg-orange-500",
                  liquidity: "bg-cyan-500",
                };
                return (
                  <div key={key} className="flex items-center gap-2">
                    <div className="text-xs text-gray-600 w-20 capitalize">{key.replace("_", " ")}</div>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colors[key] || "bg-gray-500"}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="text-xs font-semibold text-gray-700 w-10 text-right">{percentage}%</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Signals Preview */}
          {topAssets.length > 0 && (
            <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
              <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                <span>🎯</span> Top Opportunities
              </div>
              <div className="space-y-1.5">
                {topAssets.map((asset) => (
                  <div
                    key={asset.asset_id}
                    className="flex justify-between items-center text-xs bg-white rounded px-2 py-1.5 border border-gray-200"
                  >
                    <span className="font-semibold text-gray-900">{asset.symbol}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">
                        {(asset.final_score || 0).toFixed(2)}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded font-semibold ${getActionColor(asset.action)}`}
                      >
                        {asset.action}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => onViewDetails(strategy.strategy_id)}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-2 w-full text-center"
              >
                + View all {stats.total} signals →
              </button>
            </div>
          )}

          {/* Performance Badge (24h) */}
          <div className="mb-4 flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
            <span className="text-gray-600">Monitoring:</span>
            <span className="font-semibold text-gray-900">{stats.total} trending assets</span>
          </div>
        </>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t border-gray-200">
        <button
          onClick={() => onUseStrategy(strategy.strategy_id)}
          className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm shadow-sm hover:shadow-md"
        >
          Use This Strategy
        </button>
        <button
          onClick={() => onViewDetails(strategy.strategy_id)}
          className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold text-sm border border-gray-300"
        >
          Details
        </button>
      </div>
    </div>
  );
}

