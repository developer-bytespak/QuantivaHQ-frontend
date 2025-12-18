"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { apiRequest } from "@/lib/api/client";
import type { Strategy } from "@/lib/api/strategies";

export default function MyStrategiesPage() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<Strategy | null>(null);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch all strategies and filter user-created ones
        const data = await apiRequest<never, Strategy[]>({ path: "/strategies", method: "GET" });
        if (!mounted) return;
        if (!Array.isArray(data)) {
          setStrategies([]);
        } else {
          const userStrategies = data.filter((s) => s?.type === "user");
          setStrategies(userStrategies);
        }
      } catch (err: any) {
        console.error("Failed to load strategies:", err);
        setError(err?.message ?? String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Strategies</h2>
          <p className="text-sm text-slate-400">Your custom strategies created from the dashboard</p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl bg-[--color-surface] p-6 text-center">Loading strategies...</div>
      ) : error ? (
        <div className="rounded-xl bg-red-600/10 p-6 text-center text-red-300">{error}</div>
      ) : strategies.length === 0 ? (
        <div className="rounded-xl bg-[--color-surface] p-6 text-center">No custom strategies found.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {strategies.map((s) => (
            <div key={s.strategy_id} className="rounded-xl bg-gradient-to-br from-white/[0.03] to-transparent p-4 backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 text-xs text-slate-400">Custom</p>
                  <p className="text-lg font-semibold text-white">{s.name}</p>
                  <p className="text-xs text-slate-400">Risk: <span className="text-white">{s.risk_level}</span></p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-400">Active</p>
                  <p className={`text-sm font-medium ${s.is_active ? 'text-emerald-400' : 'text-slate-500'}`}>{s.is_active ? 'Yes' : 'No'}</p>
                </div>
              </div>

              <p className="mt-3 text-sm text-slate-300 line-clamp-3">{s.description ?? '—'}</p>

              <div className="mt-4 flex items-center justify-between">
                <div className="text-xs text-slate-400">
                  <div>Stop Loss: <span className="text-white">{s.stop_loss_value ?? '—'}</span></div>
                  <div>Take Profit: <span className="text-white">{s.take_profit_value ?? '—'}</span></div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="rounded-md px-3 py-1.5 text-xs bg-[--color-surface] text-slate-300 hover:text-white"
                    onClick={() => { setSelected(s); setShowModal(true); }}
                  >
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Modal: show strategy details and Apply */}
      {showModal && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-xl bg-[--color-surface] p-4 sm:p-6 text-slate-100 ring-1 ring-white/5 shadow-lg max-h-[90vh] overflow-auto">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-xl font-semibold">{selected.name}</h3>
                <p className="text-sm text-slate-400">{selected.description ?? '—'}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-400">Risk</p>
                <p className="font-medium text-white">{selected.risk_level}</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400">Stop Loss</p>
                <p className="text-white">{selected.stop_loss_value ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Take Profit</p>
                <p className="text-white">{selected.take_profit_value ?? '—'}</p>
              </div>
            </div>


            <div className="mt-4">
              <p className="text-xs text-slate-400">Entry Rules</p>
              <div className="mt-2 bg-[--color-surface-secondary] p-3 rounded max-h-40 overflow-auto">
                {(selected.entry_rules ?? []).length === 0 ? (
                  <p className="text-sm text-slate-300">—</p>
                ) : (
                  <ul className="space-y-2">
                    {(selected.entry_rules ?? []).map((r: any, i: number) => (
                      <li key={i} className="flex items-start justify-between">
                        <div className="text-sm text-slate-100">
                          <span className="font-medium">{r.indicator ?? r.field ?? '—'}</span>
                          <span className="ml-2 text-slate-400">{r.operator}</span>
                          <span className="ml-2">{String(r.value)}</span>
                        </div>
                        {r.timeframe && <div className="text-xs text-slate-400">{r.timeframe}</div>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs text-slate-400">Exit Rules</p>
              <div className="mt-2 bg-[--color-surface-secondary] p-3 rounded max-h-40 overflow-auto">
                {(selected.exit_rules ?? []).length === 0 ? (
                  <p className="text-sm text-slate-300">—</p>
                ) : (
                  <ul className="space-y-2">
                    {(selected.exit_rules ?? []).map((r: any, i: number) => (
                      <li key={i} className="flex items-start justify-between">
                        <div className="text-sm text-slate-100">
                          <span className="font-medium">{r.indicator ?? r.field ?? '—'}</span>
                          <span className="ml-2 text-slate-400">{r.operator}</span>
                          <span className="ml-2">{String(r.value)}</span>
                        </div>
                        {r.timeframe && <div className="text-xs text-slate-400">{r.timeframe}</div>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button className="rounded-md px-4 py-2" onClick={() => { setShowModal(false); setSelected(null); }}>Close</button>
              <button
                className="rounded-md px-4 py-2 bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white"
                onClick={() => {
                  // navigate to Top Trades and request preview/apply
                  const id = selected.strategy_id;
                  setShowModal(false);
                  setSelected(null);
                  router.push(`/dashboard/top-trades?applyStrategy=${id}`);
                }}
              >
                Apply Strategy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
