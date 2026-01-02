"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStocksMarket } from "@/hooks/useStocksMarket";
import { MarketStock } from "@/hooks/useStocksMarket";
import {
  formatPrice,
  formatPercent,
  formatVolume,
  formatMarketCap,
} from "@/lib/utils/format";

export default function StocksMarketPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const stocksPerPage = 50;

  // Fetch all stocks
  const {
    data: stocks,
    loading,
    error,
    warnings,
    timestamp,
    refresh,
  } = useStocksMarket({
    limit: 500, // Fetch all available stocks
    autoRefresh: true,
    refreshInterval: 5 * 60 * 1000, // 5 minutes
  });

  // Filter stocks based on search query
  const filteredStocks = stocks.filter((stock) =>
    stock.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stock.sector.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredStocks.length / stocksPerPage);
  const startIndex = (currentPage - 1) * stocksPerPage;
  const endIndex = startIndex + stocksPerPage;
  const currentStocks = filteredStocks.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">S&P 500 Market</h1>
            <p className="mt-2 text-sm text-slate-400">
              {filteredStocks.length} stocks • Updated {timestamp ? new Date(timestamp).toLocaleTimeString() : "N/A"}
            </p>
          </div>
          <button
            onClick={() => router.back()}
            className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700/50"
          >
            ← Back
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by symbol, name, or sector..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
            className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 focus:border-[#fc4f02] focus:outline-none focus:ring-2 focus:ring-[#fc4f02]/20"
          />
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
            <p className="text-sm text-amber-400">{warnings.join(", ")}</p>
          </div>
        )}

        {/* Market Table */}
        <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-6 backdrop-blur">
          {loading ? (
            <div className="py-12 text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-[#fc4f02]"></div>
              <p className="mt-4 text-sm text-slate-400">Loading stocks...</p>
            </div>
          ) : error ? (
            <div className="py-12 text-center">
              <p className="text-sm text-red-400">{error}</p>
              <button
                onClick={refresh}
                className="mt-4 rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-4 py-2 text-sm font-medium text-white hover:shadow-lg"
              >
                Retry
              </button>
            </div>
          ) : currentStocks.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-slate-400">No stocks found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="py-3 px-2 text-left text-sm font-medium text-white">#</th>
                      <th className="py-3 px-2 text-left text-sm font-medium text-white">Name</th>
                      <th className="py-3 px-2 text-left text-sm font-medium text-white">Price</th>
                      <th className="py-3 px-2 text-left text-sm font-medium text-white">24h Change</th>
                      <th className="py-3 px-2 text-left text-sm font-medium text-white hidden sm:table-cell">Sector</th>
                      <th className="py-3 px-2 text-left text-sm font-medium text-white hidden md:table-cell">Market Cap</th>
                      <th className="py-3 px-2 text-left text-sm font-medium text-white hidden lg:table-cell">Volume (24h)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {currentStocks.map((stock, index) => (
                      <tr
                        key={stock.symbol}
                        className="group cursor-pointer hover:bg-slate-800/40 transition-colors"
                        onClick={() => router.push(`/stocks-dashboard/market/${stock.symbol}`)}
                      >
                        <td className="py-4 px-2 text-sm font-medium text-slate-400">
                          {startIndex + index + 1}
                        </td>
                        <td className="py-4 px-2">
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="text-sm font-medium text-white">{stock.name}</p>
                              <p className="text-xs text-slate-400 uppercase">{stock.symbol}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-2 text-sm font-medium text-white">
                          {formatPrice(stock.price)}
                        </td>
                        <td className={`py-4 px-2 text-sm font-medium ${stock.changePercent24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          <div className="flex flex-col">
                            <span>{stock.changePercent24h >= 0 ? '+' : ''}{formatPrice(stock.change24h)}</span>
                            <span className="text-xs">({formatPercent(stock.changePercent24h)})</span>
                          </div>
                        </td>
                        <td className="py-4 px-2 text-sm text-slate-300 hidden sm:table-cell">
                          {stock.sector}
                        </td>
                        <td className="py-4 px-2 text-sm text-slate-300 hidden md:table-cell">
                          {stock.marketCap ? formatMarketCap(stock.marketCap) : 'N/A'}
                        </td>
                        <td className="py-4 px-2 text-sm text-slate-300 hidden lg:table-cell">
                          {formatVolume(stock.volume24h)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                            currentPage === pageNum
                              ? 'bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white'
                              : 'border border-slate-700 bg-slate-800/50 text-white hover:bg-slate-700/50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
