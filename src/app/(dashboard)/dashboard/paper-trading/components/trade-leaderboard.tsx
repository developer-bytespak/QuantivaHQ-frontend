"use client";

import React from "react";

type TradeRecord = {
  id: string;
  timestamp: number;
  symbol: string;
  type: "BUY" | "SELL";
  entryPrice: string;
  profitValue: number;
  strategyName?: string;
};

interface AlpacaPosition {
  symbol: string;
  qty: string;
  market_value: string;
  unrealized_pl: string;
  unrealized_plpc: string;
  avg_entry_price: string;
  current_price: string;
}

interface PortfolioMetrics {
  portfolioValue?: number;
  dailyChange?: number;
  dailyChangePercent?: number;
  cash?: number;
  positions?: AlpacaPosition[];
}

interface TradeLeaderboardProps {
  trades: TradeRecord[];
  onClose: () => void;
  onClear: () => void;
  portfolioMetrics?: PortfolioMetrics; // Optional Alpaca portfolio data
}

export default function TradeLeaderboard({ trades, onClose, onClear, portfolioMetrics }: TradeLeaderboardProps) {
  const totalProfit = trades.reduce((acc, t) => acc + t.profitValue, 0);
  const winCount = trades.filter((t) => t.profitValue >= 0).length;
  const lossCount = trades.filter((t) => t.profitValue < 0).length;
  
  // Calculate total unrealized P/L from Alpaca positions
  const totalUnrealizedPL = portfolioMetrics?.positions?.reduce((sum, pos) => {
    return sum + parseFloat(pos.unrealized_pl || '0');
  }, 0) || 0;
  
  // Calculate total unrealized P/L percentage (weighted average)
  const totalUnrealizedPLPercent = portfolioMetrics?.positions?.reduce((sum, pos) => {
    const plpc = parseFloat(pos.unrealized_plpc || '0');
    const marketValue = parseFloat(pos.market_value || '0');
    const totalValue = portfolioMetrics.portfolioValue || 1;
    return sum + (plpc * (marketValue / totalValue));
  }, 0) || 0;

  return (
    <>
      {/* Overlay backdrop */}
      <div
        className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Panel - centered, 80% of screen */}
      <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4">
        <div className="w-full max-w-[60vw] h-[60vh] rounded-2xl border border-white/10 bg-gradient-to-b from-gray-800 to-black shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08)] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="border-b border-white/5 bg-gradient-to-r from-gray-800 to-gray-700 p-4 flex-shrink-0">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-[#fc4f02] to-[#fda300]">
                    <span className="text-xs font-bold text-white">LB</span>
                  </span>
                  Session Leaderboard
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Paper trades from this session (cleared on refresh)
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                {/* Clear button - Recycle bin icon */}
                <button
                  onClick={onClear}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-300 transition-all border border-white/10"
                  title="Clear all trades"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>

                {/* Close button - X icon */}
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fda300] hover:shadow-lg hover:shadow-[#fc4f02]/30 text-white transition-all"
                  title="Close leaderboard"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2">
              {/* Portfolio Value (from Alpaca) */}
              {portfolioMetrics?.portfolioValue !== undefined ? (
                <div className="rounded-lg bg-white/5 p-2 text-center">
                  <div className="text-xs text-slate-400">Portfolio Value</div>
                  <div className="text-sm font-bold text-white">
                    ${portfolioMetrics.portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              ) : trades.length > 0 ? (
                <div className="rounded-lg bg-white/5 p-2 text-center">
                  <div className="text-xs text-slate-400">Total P&L</div>
                  <div
                    className={`text-sm font-bold ${
                      totalProfit >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {totalProfit >= 0 ? "+" : ""}${totalProfit.toFixed(2)}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg bg-white/5 p-2 text-center">
                  <div className="text-xs text-slate-400">Total P&L</div>
                  <div className="text-sm font-bold text-slate-500">$0.00</div>
                </div>
              )}

              {/* Daily Change (from Alpaca) */}
              {portfolioMetrics?.dailyChange !== undefined ? (
                <div className="rounded-lg bg-white/5 p-2 text-center">
                  <div className="text-xs text-slate-400">Daily Change</div>
                  <div
                    className={`text-sm font-bold ${
                      portfolioMetrics.dailyChange >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {portfolioMetrics.dailyChange >= 0 ? "+" : ""}${portfolioMetrics.dailyChange.toFixed(2)}
                    {portfolioMetrics.dailyChangePercent !== undefined && (
                      <span className="ml-1 text-xs">
                        ({portfolioMetrics.dailyChangePercent >= 0 ? "+" : ""}{portfolioMetrics.dailyChangePercent.toFixed(2)}%)
                      </span>
                    )}
                  </div>
                </div>
              ) : trades.length > 0 ? (
                <div className="rounded-lg bg-white/5 p-2 text-center">
                  <div className="text-xs text-slate-400">Wins</div>
                  <div className="text-sm font-bold text-emerald-400">{winCount}</div>
                </div>
              ) : (
                <div className="rounded-lg bg-white/5 p-2 text-center">
                  <div className="text-xs text-slate-400">Wins</div>
                  <div className="text-sm font-bold text-slate-500">0</div>
                </div>
              )}

              {/* Unrealized P/L (from Alpaca positions) */}
              {portfolioMetrics?.positions && portfolioMetrics.positions.length > 0 ? (
                <div className="rounded-lg bg-white/5 p-2 text-center">
                  <div className="text-xs text-slate-400">Unrealized P&L</div>
                  <div
                    className={`text-sm font-bold ${
                      totalUnrealizedPL >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {totalUnrealizedPL >= 0 ? "+" : ""}${totalUnrealizedPL.toFixed(2)}
                    {totalUnrealizedPLPercent !== 0 && (
                      <span className="ml-1 text-xs">
                        ({totalUnrealizedPLPercent >= 0 ? "+" : ""}{totalUnrealizedPLPercent.toFixed(2)}%)
                      </span>
                    )}
                  </div>
                </div>
              ) : trades.length > 0 ? (
                <div className="rounded-lg bg-white/5 p-2 text-center">
                  <div className="text-xs text-slate-400">Losses</div>
                  <div className="text-sm font-bold text-rose-400">{lossCount}</div>
                </div>
              ) : (
                <div className="rounded-lg bg-white/5 p-2 text-center">
                  <div className="text-xs text-slate-400">Losses</div>
                  <div className="text-sm font-bold text-slate-500">0</div>
                </div>
              )}
            </div>
            
            {/* Additional portfolio metrics row (only show if Alpaca data available) */}
            {portfolioMetrics && (portfolioMetrics.portfolioValue !== undefined || portfolioMetrics.positions?.length) && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {trades.length > 0 && (
                  <>
                    <div className="rounded-lg bg-white/5 p-2 text-center">
                      <div className="text-xs text-slate-400">Session P&L</div>
                      <div
                        className={`text-sm font-bold ${
                          totalProfit >= 0 ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {totalProfit >= 0 ? "+" : ""}${totalProfit.toFixed(2)}
                      </div>
                    </div>
                    <div className="rounded-lg bg-white/5 p-2 text-center">
                      <div className="text-xs text-slate-400">Wins</div>
                      <div className="text-sm font-bold text-emerald-400">{winCount}</div>
                    </div>
                    <div className="rounded-lg bg-white/5 p-2 text-center">
                      <div className="text-xs text-slate-400">Losses</div>
                      <div className="text-sm font-bold text-rose-400">{lossCount}</div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Trades list */}
          <div className="overflow-y-auto flex-1">
            {/* Show positions if available (Alpaca) */}
            {portfolioMetrics?.positions && portfolioMetrics.positions.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 px-4 pt-2">
                  Current Positions
                </h4>
                <div className="divide-y divide-white/5">
                  {portfolioMetrics.positions.map((pos, idx) => {
                    const unrealizedPL = parseFloat(pos.unrealized_pl || '0');
                    const unrealizedPLPercent = parseFloat(pos.unrealized_plpc || '0');
                    const marketValue = parseFloat(pos.market_value || '0');
                    const qty = parseFloat(pos.qty || '0');
                    
                    return (
                      <div
                        key={`${pos.symbol}-${idx}`}
                        className="flex items-center justify-between gap-3 p-4 hover:bg-white/5 transition-colors border-b border-white/5"
                      >
                        <div className="flex flex-col flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-semibold text-white">{pos.symbol}</div>
                            <span className="text-xs text-slate-400">
                              {qty.toFixed(2)} shares
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            Entry: ${parseFloat(pos.avg_entry_price || '0').toFixed(2)} • 
                            Current: ${parseFloat(pos.current_price || '0').toFixed(2)}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <div className="text-xs text-slate-400">
                            Value: <span className="text-slate-200 font-medium">${marketValue.toFixed(2)}</span>
                          </div>
                          <div
                            className={`rounded-md px-2.5 py-1 text-xs font-bold ${
                              unrealizedPL >= 0
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-rose-500/20 text-rose-400"
                            }`}
                          >
                            {unrealizedPL >= 0 ? "+" : ""}${unrealizedPL.toFixed(2)}
                            {unrealizedPLPercent !== 0 && (
                              <span className="ml-1">
                                ({unrealizedPLPercent >= 0 ? "+" : ""}{unrealizedPLPercent.toFixed(2)}%)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Show session trades */}
            {trades.length === 0 && (!portfolioMetrics?.positions || portfolioMetrics.positions.length === 0) ? (
              <div className="flex flex-col items-center justify-center gap-2 h-full text-center p-8">
                <div className="text-5xl opacity-20 font-light">No Data</div>
                <p className="text-sm text-slate-400">No trades executed yet this session</p>
                <p className="text-xs text-slate-500">Execute a trade to see it here</p>
              </div>
            ) : trades.length > 0 ? (
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 px-4 pt-2">
                  Session Trades
                </h4>
                <div className="divide-y divide-white/5">
                  {trades.map((trade, idx) => (
                    <div
                      key={trade.id}
                      className="flex items-center justify-between gap-3 p-4 hover:bg-white/5 transition-colors border-b border-white/5"
                    >
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-semibold text-white">{trade.symbol}</div>
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded ${
                              trade.type === "BUY"
                                ? "bg-green-500/20 text-green-400"
                                : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {trade.type}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {trade.strategyName && <span className="text-slate-400">{trade.strategyName} • </span>}
                          {new Date(trade.timestamp).toLocaleTimeString()}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <div className="text-xs text-slate-400">
                          Entry: <span className="text-slate-200 font-medium">{trade.entryPrice}</span>
                        </div>
                        <div
                          className={`rounded-md px-2.5 py-1 text-xs font-bold ${
                            trade.profitValue >= 0
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-rose-500/20 text-rose-400"
                          }`}
                        >
                          {trade.profitValue >= 0 ? "+" : ""}${trade.profitValue.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="border-t border-white/5 bg-gradient-to-r from-gray-800 to-gray-700 p-3 flex-shrink-0 text-center">
            <p className="text-xs text-slate-500">
              {trades.length} trade{trades.length !== 1 ? 's' : ''} this session
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
