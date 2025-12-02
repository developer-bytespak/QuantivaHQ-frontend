"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createStrategy,
  validateStrategy,
  type CreateStrategyDto,
  type EntryRule,
  type ExitRule,
  type IndicatorConfig,
} from "@/lib/api/strategies";

export default function CreateStrategyPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [formData, setFormData] = useState<Partial<CreateStrategyDto>>({
    name: "",
    type: "custom",
    risk_level: "medium",
    timeframe: "1h",
    entry_rules: [],
    exit_rules: [],
    indicators: [],
    target_assets: [],
    stop_loss_type: "percentage",
    take_profit_type: "percentage",
    is_active: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setValidationErrors([]);

    try {
      // Validate strategy
      const validation = await validateStrategy({
        entry_rules: formData.entry_rules || [],
        exit_rules: formData.exit_rules || [],
        indicators: formData.indicators || [],
        timeframe: formData.timeframe,
      });

      if (!validation.valid) {
        setValidationErrors(validation.errors);
        setIsSubmitting(false);
        return;
      }

      // Create strategy
      await createStrategy(formData as CreateStrategyDto);
      router.push("/strategies");
    } catch (error: any) {
      setValidationErrors([error.message || "Failed to create strategy"]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addEntryRule = () => {
    setFormData({
      ...formData,
      entry_rules: [
        ...(formData.entry_rules || []),
        { indicator: "RSI", operator: "<", value: 30 },
      ],
    });
  };

  const addExitRule = () => {
    setFormData({
      ...formData,
      exit_rules: [
        ...(formData.exit_rules || []),
        { indicator: "RSI", operator: ">", value: 70 },
      ],
    });
  };

  const addIndicator = () => {
    setFormData({
      ...formData,
      indicators: [
        ...(formData.indicators || []),
        { name: "RSI", parameters: { period: 14 } },
      ],
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Create Custom Strategy</h1>

        {validationErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            <ul className="list-disc list-inside">
              {validationErrors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Strategy Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Risk Level</label>
                  <select
                    value={formData.risk_level}
                    onChange={(e) => setFormData({ ...formData, risk_level: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Timeframe</label>
                  <select
                    value={formData.timeframe}
                    onChange={(e) => setFormData({ ...formData, timeframe: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="1m">1 Minute</option>
                    <option value="5m">5 Minutes</option>
                    <option value="15m">15 Minutes</option>
                    <option value="1h">1 Hour</option>
                    <option value="4h">4 Hours</option>
                    <option value="1d">1 Day</option>
                    <option value="1w">1 Week</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Entry Rules */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Entry Rules</h2>
              <button
                type="button"
                onClick={addEntryRule}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Add Rule
              </button>
            </div>
            <div className="space-y-2">
              {(formData.entry_rules || []).map((rule, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <select
                    value={rule.indicator}
                    onChange={(e) => {
                      const newRules = [...(formData.entry_rules || [])];
                      newRules[idx].indicator = e.target.value;
                      setFormData({ ...formData, entry_rules: newRules });
                    }}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="RSI">RSI</option>
                    <option value="MA20">MA20</option>
                    <option value="MA50">MA50</option>
                    <option value="MACD">MACD</option>
                  </select>
                  <select
                    value={rule.operator}
                    onChange={(e) => {
                      const newRules = [...(formData.entry_rules || [])];
                      newRules[idx].operator = e.target.value;
                      setFormData({ ...formData, entry_rules: newRules });
                    }}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value=">">{">"}</option>
                    <option value="<">{"<"}</option>
                    <option value=">=">{">="}</option>
                    <option value="<=">{"<="}</option>
                  </select>
                  <input
                    type="number"
                    value={rule.value}
                    onChange={(e) => {
                      const newRules = [...(formData.entry_rules || [])];
                      newRules[idx].value = parseFloat(e.target.value);
                      setFormData({ ...formData, entry_rules: newRules });
                    }}
                    className="px-3 py-2 border rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newRules = (formData.entry_rules || []).filter((_, i) => i !== idx);
                      setFormData({ ...formData, entry_rules: newRules });
                    }}
                    className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Exit Rules */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Exit Rules</h2>
              <button
                type="button"
                onClick={addExitRule}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Add Rule
              </button>
            </div>
            <div className="space-y-2">
              {(formData.exit_rules || []).map((rule, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <select
                    value={rule.indicator}
                    onChange={(e) => {
                      const newRules = [...(formData.exit_rules || [])];
                      newRules[idx].indicator = e.target.value;
                      setFormData({ ...formData, exit_rules: newRules });
                    }}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="RSI">RSI</option>
                    <option value="MA20">MA20</option>
                    <option value="MA50">MA50</option>
                    <option value="MACD">MACD</option>
                  </select>
                  <select
                    value={rule.operator}
                    onChange={(e) => {
                      const newRules = [...(formData.exit_rules || [])];
                      newRules[idx].operator = e.target.value;
                      setFormData({ ...formData, exit_rules: newRules });
                    }}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value=">">{">"}</option>
                    <option value="<">{"<"}</option>
                    <option value=">=">{">="}</option>
                    <option value="<=">{"<="}</option>
                  </select>
                  <input
                    type="number"
                    value={rule.value}
                    onChange={(e) => {
                      const newRules = [...(formData.exit_rules || [])];
                      newRules[idx].value = parseFloat(e.target.value);
                      setFormData({ ...formData, exit_rules: newRules });
                    }}
                    className="px-3 py-2 border rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newRules = (formData.exit_rules || []).filter((_, i) => i !== idx);
                      setFormData({ ...formData, exit_rules: newRules });
                    }}
                    className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Management */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Risk Management</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Stop Loss (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.stop_loss_value || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      stop_loss_value: parseFloat(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Take Profit (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.take_profit_value || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      take_profit_value: parseFloat(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Target Assets */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Target Assets</h2>
            <input
              type="text"
              placeholder="Enter asset symbols separated by commas (e.g., BTC, ETH, AAPL)"
              value={(formData.target_assets || []).join(", ")}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  target_assets: e.target.value.split(",").map((s) => s.trim()),
                })
              }
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Strategy"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

