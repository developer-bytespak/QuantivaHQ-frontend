"use client";

import React, { useState, useEffect } from "react";
import { tradeHistoryService, type ClosedTrade, type TradeHistorySummary } from "@/lib/api/trade-history.service";

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

interface CryptoPosition {
  symbol: string;
  quantity: number;
  avgPrice: number;
  totalCost: number;
  currentPrice?: number;
  unrealizedPL?: number;
  unrealizedPLPercent?: number;
}

interface PortfolioMetrics {
  portfolioValue?: number;
  dailyChange?: number;
  dailyChangePercent?: number;
  cash?: number;
  positions?: AlpacaPosition[];
}

interface CryptoMetrics {
  balance?: number;
  positions?: CryptoPosition[];
  totalUnrealizedPL?: number;
  totalValue?: number;
}

interface TradeLeaderboardProps {
  trades: TradeRecord[];
  onClose: () => void;
  onClear: () => void;
  portfolioMetrics?: PortfolioMetrics; // Alpaca portfolio data for stocks
  cryptoMetrics?: CryptoMetrics; // Crypto positions data
  isCrypto?: boolean;
}

export default function TradeLeaderboard({ trades, onClose, onClear, portfolioMetrics, cryptoMetrics, isCrypto = false }: TradeLeaderboardProps) {
  const [tradeHistory, setTradeHistory] = useState<ClosedTrade[]>([]);
  const [summary, setSummary] = useState<TradeHistorySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [positionsLoading, setPositionsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'profit' | 'loss'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'profit' | 'duration'>('recent');
  const [activeTab, setActiveTab] = useState<'history' | 'positions'>('history');

  // Fetch trade history on mount (stock or crypto depending on mode)
  useEffect(() => {
    const fetchTradeHistory = async () => {
      try {
        setLoading(true);
        let response;
        
        if (isCrypto) {
          // Fetch crypto trade history from Alpaca endpoint
          console.log('🔍 Fetching crypto trade history...');
          response = await tradeHistoryService.getCryptoTradeHistory({ limit: 100 });
          console.log('📊 Crypto trade history response:', response);
          console.log('📊 Number of crypto trades:', response.data?.length || 0);
          if (response.data?.length > 0) {
            console.log('📊 Sample crypto trades:', response.data.slice(0, 3));
          }
        } else {
          // Fetch stock trade history from Alpaca endpoint
          response = await tradeHistoryService.getTradeHistory({ limit: 100 });
        }
        
        setTradeHistory(response.data);
        setSummary(response.summary);
      } catch (error) {
        console.error('❌ Failed to fetch trade history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTradeHistory();
  }, [isCrypto]);

  // Calculate position metrics
  const hasStockPositions = portfolioMetrics?.positions && portfolioMetrics.positions.length > 0;
  const hasCryptoPositions = cryptoMetrics?.positions && cryptoMetrics.positions.length > 0;
  const cryptoPositions = cryptoMetrics?.positions || [];
  
  // Debug log for positions whenever props change
  useEffect(() => {
    console.log('🔍 Leaderboard Position Update:', {
      isCrypto,
      hasStockPositions,
      hasCryptoPositions,
      cryptoPositionsCount: cryptoPositions.length,
      cryptoPositions: cryptoPositions,
      portfolioMetrics,
      cryptoMetrics,
    });
  }, [cryptoMetrics, portfolioMetrics, isCrypto]);
  
  const totalUnrealizedPL = portfolioMetrics?.positions?.reduce((sum, pos) => {
    return sum + parseFloat(pos.unrealized_pl || '0');
  }, 0) || 0;

  // Calculate up/down position counts
  const stockPositionsUp = portfolioMetrics?.positions?.filter(pos => parseFloat(pos.unrealized_pl || '0') > 0).length || 0;
  const stockPositionsDown = portfolioMetrics?.positions?.filter(pos => parseFloat(pos.unrealized_pl || '0') < 0).length || 0;
  const cryptoPositionsUp = cryptoPositions.filter(pos => (pos.unrealizedPL || 0) > 0).length;
  const cryptoPositionsDown = cryptoPositions.filter(pos => (pos.unrealizedPL || 0) < 0).length;
  const totalPositionsUp = stockPositionsUp + cryptoPositionsUp;
  const totalPositionsDown = stockPositionsDown + cryptoPositionsDown;

  // Filter trades
  const filteredTrades = tradeHistory.filter(trade => {
    if (filter === 'profit') return trade.profitLoss > 0;
    if (filter === 'loss') return trade.profitLoss < 0;
    return true;
  });

  // Sort trades
  const sortedTrades = [...filteredTrades].sort((a, b) => {
    if (sortBy === 'profit') return b.profitLoss - a.profitLoss;
    if (sortBy === 'duration') {
      const aDuration = new Date(a.exitTime).getTime() - new Date(a.entryTime).getTime();
      const bDuration = new Date(b.exitTime).getTime() - new Date(b.entryTime).getTime();
      return bDuration - aDuration;
    }
    return new Date(b.exitTime).getTime() - new Date(a.exitTime).getTime();
  });


  return (
    <>
      {/* Overlay backdrop */}
      <div
        className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Panel - centered, larger size */}
      <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4">
        <div className="w-full max-w-[75vw] h-[85vh] rounded-2xl border border-white/10 bg-gradient-to-b from-gray-800 to-black shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08)] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="border-b border-white/5 bg-gradient-to-r from-gray-800 to-gray-700 p-4 flex-shrink-0">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-[#fc4f02] to-[#fda300]">
                    <span className="text-xs font-bold text-white">TH</span>
                  </span>
                  Trading Performance
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  View closed trades and open positions
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-300 transition-all border border-white/10"
                  title="Close"
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

            {/* Tab Selection */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'history'
                    ? 'bg-[#fc4f02] text-white'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                Trade History
              </button>
              <button
                onClick={() => setActiveTab('positions')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'positions'
                    ? 'bg-[#fc4f02] text-white'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                Open Positions ({(hasStockPositions ? (portfolioMetrics.positions?.length ?? 0) : 0) + (hasCryptoPositions ? cryptoPositions.length : 0)})
              </button>
            </div>

            {/* Summary Stats - Show different stats based on active tab */}
            {activeTab === 'history' && summary && (
              <div className="grid grid-cols-4 gap-2 mt-3">
                <div className="rounded-lg bg-white/5 p-2 text-center">
                  <div className="text-xs text-slate-400">Total Trades</div>
                  <div className="text-sm font-bold text-white">{summary.totalTrades}</div>
                </div>
                <div className="rounded-lg bg-white/5 p-2 text-center">
                  <div className="text-xs text-slate-400">Total P&L</div>
                  <div className={`text-sm font-bold ${summary.totalProfitLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {summary.totalProfitLoss >= 0 ? '+' : ''}${summary.totalProfitLoss.toFixed(2)}
                  </div>
                </div>
                <div className="rounded-lg bg-white/5 p-2 text-center">
                  <div className="text-xs text-slate-400">Win Rate</div>
                  <div className="text-sm font-bold text-white">{summary.winRate.toFixed(1)}%</div>
                </div>
                <div className="rounded-lg bg-white/5 p-2 text-center">
                  <div className="text-xs text-slate-400">Avg Profit</div>
                  <div className={`text-sm font-bold ${summary.avgProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {summary.avgProfit >= 0 ? '+' : ''}${summary.avgProfit.toFixed(2)}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'positions' && (hasStockPositions || hasCryptoPositions) && (
              <div className="grid grid-cols-4 gap-2 mt-3">
                <div className="rounded-lg bg-white/5 p-2 text-center">
                  <div className="text-xs text-slate-400">Total Positions</div>
                  <div className="text-sm font-bold text-white">
                    {(hasStockPositions ? portfolioMetrics.positions?.length || 0 : 0) + (hasCryptoPositions ? cryptoPositions.length : 0)}
                  </div>
                </div>
                <div className="rounded-lg bg-white/5 p-2 text-center">
                  <div className="text-xs text-slate-400">Positions Up</div>
                  <div className="text-sm font-bold text-emerald-400">
                    {totalPositionsUp}
                  </div>
                </div>
                <div className="rounded-lg bg-white/5 p-2 text-center">
                  <div className="text-xs text-slate-400">Positions Down</div>
                  <div className="text-sm font-bold text-rose-400">
                    {totalPositionsDown}
                  </div>
                </div>
                <div className="rounded-lg bg-white/5 p-2 text-center">
                  <div className="text-xs text-slate-400">Unrealized P&L</div>
                  <div className={`text-sm font-bold ${totalUnrealizedPL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {totalUnrealizedPL >= 0 ? '+' : ''}${totalUnrealizedPL.toFixed(2)}
                  </div>
                </div>
              </div>
            )}

            {/* Filters - Only show for history tab */}
            {activeTab === 'history' && (
              <div className="flex items-center gap-2 mt-3">
                <div className="flex gap-1">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                      filter === 'all'
                        ? 'bg-[#fc4f02] text-white'
                        : 'bg-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilter('profit')}
                    className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                      filter === 'profit'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    Profitable
                  </button>
                  <button
                    onClick={() => setFilter('loss')}
                    className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                      filter === 'loss'
                        ? 'bg-rose-500 text-white'
                        : 'bg-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    Loss
                  </button>
                </div>

                <div className="h-4 w-px bg-white/10" />

                <div className="flex gap-1">
                  <button
                    onClick={() => setSortBy('recent')}
                    className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                      sortBy === 'recent'
                        ? 'bg-[#fc4f02] text-white'
                        : 'bg-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    Recent
                  </button>
                  <button
                    onClick={() => setSortBy('profit')}
                    className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                      sortBy === 'profit'
                        ? 'bg-[#fc4f02] text-white'
                        : 'bg-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    P&L
                  </button>
                  <button
                    onClick={() => setSortBy('duration')}
                    className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                      sortBy === 'duration'
                        ? 'bg-[#fc4f02] text-white'
                        : 'bg-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    Duration
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Content area */}
          <div className="overflow-y-auto flex-1">
            {activeTab === 'history' ? (
              // Trade History Tab
              loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#fc4f02] border-r-transparent"></div>
                    <p className="text-sm text-slate-400 mt-3">Loading trade history...</p>
                  </div>
                </div>
              ) : sortedTrades.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 h-full text-center p-8">
                  <div className="text-5xl opacity-20 font-light">No Trades</div>
                  <p className="text-sm text-slate-400">
                    {filter === 'all' 
                      ? 'No completed trades found'
                      : filter === 'profit'
                      ? 'No profitable trades found'
                      : 'No losing trades found'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {sortedTrades.map((trade) => {
                    const isProfitable = trade.profitLoss >= 0;
                    
                    return (
                      <div
                        key={trade.id}
                        className="flex items-center justify-between gap-4 p-5 hover:bg-white/5 transition-colors"
                      >
                        <div className="flex flex-col flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="text-lg font-bold text-white">{trade.symbol}</div>
                            <span className="text-xs text-slate-400">{trade.quantity} shares</span>
                            <span className="text-xs text-slate-500">• {trade.duration}</span>
                          </div>
                          <div className="text-sm text-slate-400">
                            Entry: <span className="text-slate-200 font-semibold">${trade.entryPrice.toFixed(2)}</span>
                            {' → '}
                            Exit: <span className="text-slate-200 font-semibold">${trade.exitPrice.toFixed(2)}</span>
                            <span className="ml-2 text-xs text-slate-500">
                              {new Date(trade.exitTime).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <div
                            className={`rounded-lg px-4 py-2 text-base font-bold ${
                              isProfitable
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-rose-500/20 text-rose-400'
                            }`}
                          >
                            {isProfitable ? '+' : ''}${trade.profitLoss?.toFixed(2) || '0.00'}
                          </div>
                          <div
                            className={`text-sm font-semibold ${
                              isProfitable ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {isProfitable ? '+' : ''}{trade.profitLossPercent?.toFixed(2) || '0.00'}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              // Open Positions Tab
              <>
                {/* Stock Positions */}
                {hasStockPositions && (
                  <div className="mb-6">
                    <h4 className="text-base font-bold text-slate-300 uppercase tracking-wide mb-4 px-4 pt-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Stock Positions
                    </h4>
                    <div className="divide-y divide-white/5">
                      {portfolioMetrics.positions?.map((pos, idx) => {
                        const unrealizedPL = parseFloat(pos.unrealized_pl || '0');
                        const unrealizedPLPercent = parseFloat(pos.unrealized_plpc || '0');
                        const marketValue = parseFloat(pos.market_value || '0');
                        const qty = parseFloat(pos.qty || '0');
                        
                        return (
                          <div
                            key={`${pos.symbol}-${idx}`}
                            className="flex items-center justify-between gap-4 p-5 hover:bg-white/5 transition-colors border-b border-white/5"
                          >
                            <div className="flex flex-col flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="text-lg font-bold text-white">{pos.symbol}</div>
                                <span className="text-sm text-slate-400 font-medium">
                                  {qty.toFixed(2)} shares
                                </span>
                              </div>
                              <div className="text-sm text-slate-400 mt-1">
                                Entry: <span className="text-slate-200 font-semibold">${parseFloat(pos.avg_entry_price || '0').toFixed(2)}</span> • 
                                Current: <span className="text-slate-200 font-semibold">${parseFloat(pos.current_price || '0').toFixed(2)}</span>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              <div className="text-sm text-slate-400">
                                Value: <span className="text-slate-100 font-bold text-base">${marketValue.toFixed(2)}</span>
                              </div>
                              <div
                                className={`rounded-lg px-3 py-2 text-sm font-bold ${
                                  unrealizedPL >= 0
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : "bg-rose-500/20 text-rose-400"
                                }`}
                              >
                                {unrealizedPL >= 0 ? "+" : ""}${unrealizedPL.toFixed(2)}
                                {unrealizedPLPercent !== 0 && (
                                  <span className="ml-2">
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

                {/* Crypto Positions */}
                {hasCryptoPositions && (
                  <div className="mb-6">
                    <h4 className="text-base font-bold text-slate-300 uppercase tracking-wide mb-4 px-4 pt-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Crypto Positions
                    </h4>
                    <div className="divide-y divide-white/5">
                      {cryptoPositions.map((pos, idx) => {
                        const unrealizedPL = pos.unrealizedPL || 0;
                        const unrealizedPLPercent = pos.unrealizedPLPercent || 0;
                        const marketValue = pos.currentPrice ? pos.quantity * pos.currentPrice : pos.totalCost;
                        
                        return (
                          <div
                            key={`${pos.symbol}-${idx}`}
                            className="flex items-center justify-between gap-4 p-5 hover:bg-white/5 transition-colors border-b border-white/5"
                          >
                            <div className="flex flex-col flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="text-lg font-bold text-white">
                                  {pos.symbol.split('/')[0]}
                                </div>
                                <span className="text-sm text-slate-400 font-medium">
                                  {pos.quantity.toFixed(4)} tokens
                                </span>
                              </div>
                              <div className="text-sm text-slate-400 mt-1">
                                Entry: <span className="text-slate-200 font-semibold">${pos.avgPrice.toFixed(4)}</span>
                                {pos.currentPrice && (
                                  <> • Current: <span className="text-slate-200 font-semibold">${pos.currentPrice.toFixed(4)}</span></>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              <div className="text-sm text-slate-400">
                                Value: <span className="text-slate-100 font-bold text-base">${marketValue.toFixed(2)}</span>
                              </div>
                              <div
                                className={`rounded-lg px-3 py-2 text-sm font-bold ${
                                  unrealizedPL >= 0
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : "bg-rose-500/20 text-rose-400"
                                }`}
                              >
                                {unrealizedPL >= 0 ? "+" : ""}${unrealizedPL.toFixed(2)}
                                {unrealizedPLPercent !== 0 && (
                                  <span className="ml-2">
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

                {/* No positions message */}
                {!hasStockPositions && !hasCryptoPositions && (
                  <div className="flex flex-col items-center justify-center gap-2 h-full text-center p-8">
                    <div className="text-5xl opacity-20 font-light">No Positions</div>
                    <p className="text-sm text-slate-400">No open positions found</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-white/5 bg-gradient-to-r from-gray-800 to-gray-700 p-3 flex-shrink-0 text-center">
            <p className="text-xs text-slate-500">
              {activeTab === 'history' 
                ? `Showing ${filteredTrades.length} of ${tradeHistory.length} trade${tradeHistory.length !== 1 ? 's' : ''}`
                : `${(hasStockPositions ? portfolioMetrics.positions?.length || 0 : 0) + (hasCryptoPositions ? cryptoPositions.length : 0)} open position${((hasStockPositions ? portfolioMetrics.positions?.length || 0 : 0) + (hasCryptoPositions ? cryptoPositions.length : 0)) !== 1 ? 's' : ''}`
              }
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
