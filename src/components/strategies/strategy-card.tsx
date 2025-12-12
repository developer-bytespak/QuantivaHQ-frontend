"use client";

import { useState, useEffect } from "react";
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

interface StrategyCardProps {
  strategy: Strategy;
  onUseStrategy: (strategyId: string) => void;
}

export function StrategyCard({ strategy, onUseStrategy }: StrategyCardProps) {
  const [previewData, setPreviewData] = useState<StrategyPreview[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    loadPreview();
  }, [strategy.strategy_id]);

  const loadPreview = async () => {
    try {
      setIsLoadingPreview(true);
      setPreviewError(null);
      const data = await previewStrategy(strategy.strategy_id, 50);
      setPreviewData(data);
    } catch (error: any) {
      console.error("Failed to load preview:", error);
      setPreviewError(error.message || "Failed to load preview");
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Calculate preview statistics
  const stats = {
    total: previewData.length,
    buy: previewData.filter((p) => p.action === "BUY").length,
    sell: previewData.filter((p) => p.action === "SELL").length,
    hold: previewData.filter((p) => p.action === "HOLD").length,
    errors: previewData.filter((p) => p.error).length,
  };

  // Get top assets by score
  const topAssets = previewData
    .filter((p) => !p.error && p.action !== "HOLD")
    .sort((a, b) => (b.final_score || 0) - (a.final_score || 0))
    .slice(0, 5);

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case "low":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "high":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold mb-2">{strategy.name}</h3>
          {strategy.description && (
            <p className="text-gray-600 text-sm mb-3">{strategy.description}</p>
          )}
          <div className="flex gap-2">
            <span
              className={`px-2 py-1 rounded text-xs ${getRiskColor(
                strategy.risk_level
              )}`}
            >
              {strategy.risk_level} Risk
            </span>
          </div>
        </div>
      </div>

      {/* Preview Results */}
      {isLoadingPreview ? (
        <div className="py-4 text-center text-gray-500">
          Loading preview...
        </div>
      ) : previewError ? (
        <div className="py-4 text-center text-red-500 text-sm">
          {previewError}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2 text-sm">
            <div className="text-center">
              <div className="font-semibold text-green-600">{stats.buy}</div>
              <div className="text-gray-500 text-xs">BUY</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-red-600">{stats.sell}</div>
              <div className="text-gray-500 text-xs">SELL</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-600">{stats.hold}</div>
              <div className="text-gray-500 text-xs">HOLD</div>
            </div>
            <div className="text-center">
              <div className="font-semibold">{stats.total}</div>
              <div className="text-gray-500 text-xs">Total</div>
            </div>
          </div>

          {topAssets.length > 0 && (
            <div className="border-t pt-3">
              <div className="text-xs text-gray-500 mb-2">Top Opportunities:</div>
              <div className="space-y-1">
                {topAssets.map((asset) => (
                  <div
                    key={asset.asset_id}
                    className="flex justify-between items-center text-xs"
                  >
                    <span className="font-medium">{asset.symbol}</span>
                    <span
                      className={`px-2 py-0.5 rounded ${
                        asset.action === "BUY"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {asset.action}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 pt-4 border-t">
        <button
          onClick={() => onUseStrategy(strategy.strategy_id)}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Use This Strategy
        </button>
      </div>
    </div>
  );
}

