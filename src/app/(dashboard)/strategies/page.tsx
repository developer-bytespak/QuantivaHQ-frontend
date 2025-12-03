"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getStrategies,
  deleteStrategy,
  activateStrategy,
  deactivateStrategy,
  type Strategy,
} from "@/lib/api/strategies";

export default function StrategiesPage() {
  const router = useRouter();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStrategies();
  }, []);

  const loadStrategies = async () => {
    try {
      setIsLoading(true);
      const data = await getStrategies();
      setStrategies(data);
    } catch (error: any) {
      console.error("Failed to load strategies:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (strategyId: string) => {
    if (!confirm("Are you sure you want to delete this strategy?")) return;

    try {
      await deleteStrategy(strategyId);
      await loadStrategies();
    } catch (error: any) {
      alert(`Failed to delete strategy: ${error.message}`);
    }
  };

  const handleToggleActive = async (strategy: Strategy) => {
    try {
      if (strategy.is_active) {
        await deactivateStrategy(strategy.strategy_id);
      } else {
        await activateStrategy(strategy.strategy_id);
      }
      await loadStrategies();
    } catch (error: any) {
      alert(`Failed to update strategy: ${error.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <p>Loading strategies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Trading Strategies</h1>
          <button
            onClick={() => router.push("/strategies/create")}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create Strategy
          </button>
        </div>

        {strategies.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <p className="text-gray-500 mb-4">No strategies found.</p>
            <button
              onClick={() => router.push("/strategies/create")}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Create Your First Strategy
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {strategies.map((strategy) => (
              <div key={strategy.strategy_id} className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-semibold">{strategy.name}</h2>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          strategy.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {strategy.is_active ? "Active" : "Inactive"}
                      </span>
                      <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                        {strategy.risk_level}
                      </span>
                    </div>
                    {strategy.description && (
                      <p className="text-gray-600 mb-2">{strategy.description}</p>
                    )}
                    <div className="flex gap-4 text-sm text-gray-500">
                      <span>Type: {strategy.type}</span>
                      {strategy.timeframe && <span>Timeframe: {strategy.timeframe}</span>}
                      {strategy.target_assets && (
                        <span>Assets: {strategy.target_assets.join(", ")}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleActive(strategy)}
                      className={`px-4 py-2 rounded text-sm ${
                        strategy.is_active
                          ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                          : "bg-green-100 text-green-800 hover:bg-green-200"
                      }`}
                    >
                      {strategy.is_active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => router.push(`/strategies/${strategy.strategy_id}`)}
                      className="px-4 py-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 text-sm"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDelete(strategy.strategy_id)}
                      className="px-4 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

