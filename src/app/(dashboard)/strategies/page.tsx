"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getPreBuiltStrategies,
  usePreBuiltStrategy,
  getTrendingAssets,
  getStrategies,
  activateStrategy,
  type Strategy,
  getStrategySignals,
  type StrategySignal,
} from "@/lib/api/strategies";
import { EnhancedStrategyCard } from "@/components/strategies/enhanced-strategy-card";
import { StrategyDetailsModal } from "@/components/strategies/strategy-details-modal";

type RiskLevel = "all" | "low" | "medium" | "high";
type SortOption = "default" | "signals" | "name";

export default function StrategiesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"marketplace" | "my-strategies">("marketplace");
  const [preBuiltStrategies, setPreBuiltStrategies] = useState<Strategy[]>([]);
  const [myStrategies, setMyStrategies] = useState<Strategy[]>([]);
  const [trendingAssets, setTrendingAssets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters and sorting
  const [riskFilter, setRiskFilter] = useState<RiskLevel>("all");
  const [sortOption, setSortOption] = useState<SortOption>("default");
  const [selectedStrategies, setSelectedStrategies] = useState<Set<string>>(new Set());
  
  // Modal state
  const [selectedStrategyForDetails, setSelectedStrategyForDetails] = useState<Strategy | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Signals state (for My Strategies tab)
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null);
  const [signals, setSignals] = useState<StrategySignal[]>([]);
  const [isLoadingSignals, setIsLoadingSignals] = useState(false);

  useEffect(() => {
    loadData();
    // Auto-refresh every 60 seconds
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [preBuiltData, assetsData, userStrategies] = await Promise.all([
        getPreBuiltStrategies(),
        getTrendingAssets(50),
        getStrategies(),
      ]);
      setPreBuiltStrategies(preBuiltData);
      setMyStrategies(userStrategies);
      setTrendingAssets(assetsData);
    } catch (error: any) {
      console.error("Failed to load data:", error);
      // Don't show alert on auto-refresh
      if (!isLoading) {
        alert(`Failed to load strategies: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseStrategy = async (strategyId: string) => {
    try {
      const targetAssets = trendingAssets
        .slice(0, 10)
        .map((a) => a.asset_id || a.symbol);

      await usePreBuiltStrategy(strategyId, targetAssets);
      alert("Strategy created successfully!");
      await loadData();
      setActiveTab("my-strategies");
    } catch (error: any) {
      alert(`Failed to use strategy: ${error.message}`);
    }
  };

  const handleBatchUseStrategies = async () => {
    if (selectedStrategies.size === 0) return;
    
    try {
      const targetAssets = trendingAssets
        .slice(0, 10)
        .map((a) => a.asset_id || a.symbol);

      // Use all selected strategies
      const promises = Array.from(selectedStrategies).map((id) =>
        usePreBuiltStrategy(id, targetAssets)
      );
      await Promise.all(promises);
      
      alert(`${selectedStrategies.size} strategies created successfully!`);
      setSelectedStrategies(new Set());
      await loadData();
      setActiveTab("my-strategies");
    } catch (error: any) {
      alert(`Failed to use strategies: ${error.message}`);
    }
  };

  const handleActivateStrategy = async (strategyId: string) => {
    try {
      await activateStrategy(strategyId);
      alert("Strategy activated successfully!");
      await loadData();
    } catch (error: any) {
      alert(`Failed to activate strategy: ${error.message}`);
    }
  };

  const handleViewDetails = (strategyId: string) => {
    const strategy = preBuiltStrategies.find((s) => s.strategy_id === strategyId);
    if (strategy) {
      setSelectedStrategyForDetails(strategy);
      setIsModalOpen(true);
    }
  };

  const handleSelectStrategy = (strategyId: string, selected: boolean) => {
    const newSelected = new Set(selectedStrategies);
    if (selected) {
      newSelected.add(strategyId);
    } else {
      newSelected.delete(strategyId);
    }
    setSelectedStrategies(newSelected);
  };

  const loadStrategySignals = async (strategyId: string) => {
    try {
      setIsLoadingSignals(true);
      const strategySignals = await getStrategySignals(strategyId);
      setSignals(strategySignals);
      setSelectedStrategyId(strategyId);
    } catch (error: any) {
      console.error("Failed to load signals:", error);
      alert(`Failed to load signals: ${error.message}`);
    } finally {
      setIsLoadingSignals(false);
    }
  };

  // Filter and sort strategies
  const filteredStrategies = preBuiltStrategies.filter((strategy) => {
    if (riskFilter === "all") return true;
    return strategy.risk_level.toLowerCase() === riskFilter;
  });

  const sortedStrategies = [...filteredStrategies].sort((a, b) => {
    switch (sortOption) {
      case "name":
        return a.name.localeCompare(b.name);
      case "signals":
        // This would require fetching signal counts, for now just use default
        return 0;
      default:
        return 0;
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 mt-4">Loading strategies...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-gray-900">Strategy Marketplace</h1>
            <p className="text-gray-600">
              Live preview on top 50 trending assets • Real-time signal generation
            </p>
          </div>
          <button
            onClick={() => {
              alert("Custom strategy builder coming soon!");
            }}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-sm hover:shadow-md"
          >
            + Custom Strategy
          </button>
        </div>

        {/* Live Market Stats */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📊</span>
              <div>
                <div className="font-semibold text-gray-900">Monitoring 50 Trending Assets</div>
                <div className="text-sm text-gray-600">Real-time data updates every 60 seconds</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Last updated</div>
              <div className="font-semibold text-gray-900">{new Date().toLocaleTimeString()}</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("marketplace")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "marketplace"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Marketplace
            </button>
            <button
              onClick={() => setActiveTab("my-strategies")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "my-strategies"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              My Strategies ({myStrategies.length})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "marketplace" ? (
          <>
            {/* Filters and Selection Panel */}
            <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex flex-wrap gap-3">
                {/* Risk Filter */}
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Risk:</label>
                  <select
                    value={riskFilter}
                    onChange={(e) => setRiskFilter(e.target.value as RiskLevel)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                {/* Sort Option */}
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Sort:</label>
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="default">Default</option>
                    <option value="name">Name</option>
                    <option value="signals">Most Signals</option>
                  </select>
                </div>
              </div>

              {/* Selection Panel */}
              {selectedStrategies.size > 0 && (
                <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <span className="text-sm font-semibold text-blue-900">
                    {selectedStrategies.size} selected
                  </span>
                  <button
                    onClick={handleBatchUseStrategies}
                    className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold"
                  >
                    Use All Selected
                  </button>
                  <button
                    onClick={() => setSelectedStrategies(new Set())}
                    className="px-3 py-1.5 text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {/* Strategy Grid */}
            {sortedStrategies.length === 0 ? (
              <div className="bg-white p-12 rounded-lg shadow text-center">
                <p className="text-gray-500 mb-4">No strategies match your filters.</p>
                <button
                  onClick={() => {
                    setRiskFilter("all");
                    setSortOption("default");
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sortedStrategies.map((strategy) => (
                  <EnhancedStrategyCard
                    key={strategy.strategy_id}
                    strategy={strategy}
                    onUseStrategy={handleUseStrategy}
                    onViewDetails={handleViewDetails}
                    isSelected={selectedStrategies.has(strategy.strategy_id)}
                    onSelect={handleSelectStrategy}
                  />
                ))}
              </div>
            )}

            {/* Info Section */}
            <div className="mt-8 bg-white p-6 rounded-lg shadow border border-gray-200">
              <h2 className="text-lg font-semibold mb-3 text-gray-900">How It Works</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-600 text-sm">
                <li>Select a pre-built strategy that matches your trading style</li>
                <li>Each strategy runs on real-time data from top 50 trending assets</li>
                <li>Preview shows BUY/SELL/HOLD signals for each asset</li>
                <li>After selecting, configure your target assets and risk parameters</li>
                <li>Activate the strategy to start receiving trading signals</li>
              </ul>
            </div>
          </>
        ) : (
          <>
            {/* My Strategies */}
            {myStrategies.length === 0 ? (
              <div className="bg-white p-12 rounded-lg shadow text-center border border-gray-200">
                <p className="text-gray-500 mb-4">You haven't created any strategies yet.</p>
                <button
                  onClick={() => setActiveTab("marketplace")}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                >
                  Browse Marketplace
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myStrategies.map((strategy) => (
                  <div
                    key={strategy.strategy_id}
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-200"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2">{strategy.name}</h3>
                        {strategy.description && (
                          <p className="text-gray-600 text-sm mb-3">{strategy.description}</p>
                        )}
                        <div className="flex gap-2 mb-3">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              strategy.risk_level === "low"
                                ? "bg-green-100 text-green-800"
                                : strategy.risk_level === "medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {strategy.risk_level} Risk
                          </span>
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              strategy.is_active
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {strategy.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          <p>Target Assets: {Array.isArray(strategy.target_assets) ? strategy.target_assets.length : 0}</p>
                          <p>Created: {new Date(strategy.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t flex gap-2">
                      {!strategy.is_active && (
                        <button
                          onClick={() => handleActivateStrategy(strategy.strategy_id)}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                        >
                          Activate
                        </button>
                      )}
                      <button
                        onClick={() => loadStrategySignals(strategy.strategy_id)}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                      >
                        {selectedStrategyId === strategy.strategy_id ? "Hide Signals" : "View Signals"}
                      </button>
                    </div>

                    {/* Show signals when selected */}
                    {selectedStrategyId === strategy.strategy_id && (
                      <div className="mt-4 pt-4 border-t">
                        {isLoadingSignals ? (
                          <p className="text-gray-500 text-center py-4">Loading signals...</p>
                        ) : signals.length === 0 ? (
                          <p className="text-gray-500 text-center py-4">No signals generated yet.</p>
                        ) : (
                          <div className="space-y-4">
                            <h4 className="font-semibold mb-3">Recent Signals ({signals.length})</h4>
                            {signals.slice(0, 5).map((signal) => (
                              <div
                                key={signal.signal_id}
                                className="border rounded-lg p-4 bg-gray-50"
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <div className="font-semibold">
                                      {signal.asset?.symbol || signal.asset_id}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {new Date(signal.timestamp).toLocaleString()}
                                    </div>
                                  </div>
                                  <span
                                    className={`px-3 py-1 rounded text-sm font-semibold ${
                                      signal.action === "BUY"
                                        ? "bg-green-100 text-green-800"
                                        : signal.action === "SELL"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {signal.action}
                                  </span>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                                  <div>Score: <span className="font-semibold">{signal.final_score?.toFixed(3)}</span></div>
                                  <div>Confidence: <span className="font-semibold">{(Number(signal.confidence) * 100).toFixed(1)}%</span></div>
                                </div>

                                {/* LLM Explanation */}
                                {signal.explanations && signal.explanations.length > 0 && (
                                  <div className="mt-3 pt-3 border-t">
                                    <div className="text-xs text-gray-500 mb-1">
                                      Explanation ({signal.explanations[0].llm_model || "AI"}):
                                    </div>
                                    <p className="text-sm text-gray-700">
                                      {signal.explanations[0].text || "Explanation pending..."}
                                    </p>
                                    {signal.explanations[0].explanation_status === "pending" && (
                                      <p className="text-xs text-yellow-600 mt-1">Generating explanation...</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Strategy Details Modal */}
      <StrategyDetailsModal
        strategy={selectedStrategyForDetails}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedStrategyForDetails(null);
        }}
        onUseStrategy={handleUseStrategy}
      />
    </div>
  );
}
