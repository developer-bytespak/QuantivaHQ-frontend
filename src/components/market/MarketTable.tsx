"use client";

import { useState, useMemo } from "react";
import { MarketStock } from "@/hooks/useStocksMarket";
import {
  formatMarketCap,
  formatPrice,
  formatPercent,
  formatVolume,
  getChangeColorClass,
} from "@/lib/utils/format";

interface MarketTableProps {
  stocks: MarketStock[];
  loading: boolean;
  error: string | null;
}

type SortField = "symbol" | "price" | "changePercent24h" | "marketCap" | "volume24h";
type SortOrder = "asc" | "desc";

export function MarketTable({ stocks, loading, error }: MarketTableProps) {
  const [sortField, setSortField] = useState<SortField>("marketCap");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter and sort stocks
  const filteredAndSortedStocks = useMemo(() => {
    let filtered = stocks;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = stocks.filter(
        (stock) =>
          stock.symbol.toLowerCase().includes(query) ||
          stock.name.toLowerCase().includes(query) ||
          stock.sector.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    return [...filtered].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Handle null values for marketCap
      if (sortField === "marketCap") {
        if (aValue === null) aValue = -1;
        if (bValue === null) bValue = -1;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [stocks, searchQuery, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle order
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // New field, default to desc
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <svg className="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }

    return sortOrder === "asc" ? (
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-400 text-sm">{error}</p>
        <p className="text-slate-400 text-xs mt-2">Please try again later</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="px-6">
        <input
          type="text"
          placeholder="Search by symbol, name, or sector..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg bg-[--color-surface]/60 px-4 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#fc4f02]/50"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto px-6">
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-12 rounded-lg bg-gradient-to-r from-white/[0.05] to-transparent animate-pulse"
              />
            ))}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[--color-border]">
                <th className="pb-3 pl-2 text-left">
                  <button
                    onClick={() => handleSort("symbol")}
                    className="flex items-center gap-1 text-xs font-medium uppercase text-slate-400 hover:text-white transition-colors"
                  >
                    Symbol
                    <SortIcon field="symbol" />
                  </button>
                </th>
                <th className="pb-3 text-left">
                  <span className="text-xs font-medium uppercase text-slate-400">Name</span>
                </th>
                <th className="pb-3 text-right">
                  <button
                    onClick={() => handleSort("price")}
                    className="flex items-center gap-1 ml-auto text-xs font-medium uppercase text-slate-400 hover:text-white transition-colors"
                  >
                    Price
                    <SortIcon field="price" />
                  </button>
                </th>
                <th className="pb-3 text-right">
                  <button
                    onClick={() => handleSort("changePercent24h")}
                    className="flex items-center gap-1 ml-auto text-xs font-medium uppercase text-slate-400 hover:text-white transition-colors"
                  >
                    24h %
                    <SortIcon field="changePercent24h" />
                  </button>
                </th>
                <th className="pb-3 text-right">
                  <button
                    onClick={() => handleSort("marketCap")}
                    className="flex items-center gap-1 ml-auto text-xs font-medium uppercase text-slate-400 hover:text-white transition-colors"
                  >
                    Market Cap
                    <SortIcon field="marketCap" />
                  </button>
                </th>
                <th className="pb-3 text-right">
                  <button
                    onClick={() => handleSort("volume24h")}
                    className="flex items-center gap-1 ml-auto text-xs font-medium uppercase text-slate-400 hover:text-white transition-colors"
                  >
                    Volume
                    <SortIcon field="volume24h" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[--color-border]">
              {filteredAndSortedStocks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    {searchQuery ? "No stocks found matching your search" : "No stocks available"}
                  </td>
                </tr>
              ) : (
                filteredAndSortedStocks.map((stock) => (
                  <tr
                    key={stock.symbol}
                    className="group/row relative hover:bg-[--color-surface]/40 transition-colors before:absolute before:left-0 before:top-1/2 before:h-8 before:w-1 before:-translate-y-1/2 before:rounded-r-full before:bg-gradient-to-b before:from-[#fc4f02] before:to-[#fda300] before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100"
                  >
                    <td className="py-2 pl-2">
                      <div className="flex items-center gap-2">
                        {/* Stock Logo */}
                        <div className="flex-shrink-0 w-6 h-6 rounded bg-white/5 flex items-center justify-center overflow-hidden">
                          <img
                            src={`https://logo.clearbit.com/${stock.symbol.toLowerCase()}.com`}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Silently hide failed image and show fallback
                              e.currentTarget.style.display = 'none';
                              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                            loading="lazy"
                          />
                          <div className="hidden w-full h-full items-center justify-center text-[10px] font-bold text-slate-400">
                            {stock.symbol.charAt(0)}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{stock.symbol}</p>
                          <p className="text-xs text-slate-500">{stock.sector}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2">
                      <p className="text-sm text-slate-300 max-w-[200px] truncate">{stock.name}</p>
                    </td>
                    <td className="py-2 text-right">
                      <p className="text-sm text-slate-300">{formatPrice(stock.price)}</p>
                    </td>
                    <td className="py-2 text-right">
                      <p className={`text-sm font-medium ${getChangeColorClass(stock.changePercent24h)}`}>
                        {formatPercent(stock.changePercent24h)}
                      </p>
                    </td>
                    <td className="py-2 text-right">
                      <p className="text-sm text-slate-300">{formatMarketCap(stock.marketCap)}</p>
                    </td>
                    <td className="py-2 text-right">
                      <p className="text-sm text-slate-300">{formatVolume(stock.volume24h)}</p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Results count */}
      {!loading && filteredAndSortedStocks.length > 0 && (
        <div className="px-6 text-xs text-slate-400">
          Showing {filteredAndSortedStocks.length} {filteredAndSortedStocks.length === 1 ? "stock" : "stocks"}
        </div>
      )}
    </div>
  );
}
