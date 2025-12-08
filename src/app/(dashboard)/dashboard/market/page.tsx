"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getTop500Coins, CoinGeckoCoin } from "@/lib/api/coingecko.service";

export default function MarketPage() {
  const router = useRouter();
  const [coins, setCoins] = useState<CoinGeckoCoin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const coinsPerPage = 50;

  useEffect(() => {
    const fetchCoins = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getTop500Coins();
        setCoins(data);
      } catch (err: any) {
        console.error("Failed to fetch market data:", err);
        // Provide user-friendly error message
        const errorMessage = err.message || "Failed to load market data";
        setError(errorMessage);
        
        // If it's a network error, suggest retrying
        if (errorMessage.includes("Network error") || errorMessage.includes("Unable to connect")) {
          // Auto-retry after 5 seconds
          setTimeout(() => {
            fetchCoins();
          }, 5000);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchCoins();
  }, []);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(value);
  };

  // Format percentage
  const formatPercent = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}%`;
  };

  // Format large numbers (market cap, volume)
  const formatLargeNumber = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  // Filter coins based on search query
  const filteredCoins = coins.filter(
    (coin) =>
      coin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coin.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination calculations
  const totalPages = Math.ceil(filteredCoins.length / coinsPerPage);
  const startIndex = (currentPage - 1) * coinsPerPage;
  const endIndex = startIndex + coinsPerPage;
  const currentCoins = filteredCoins.slice(startIndex, endIndex);

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of table
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Market Overview</h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">Top 500 cryptocurrencies by market cap</p>
        </div>
        <button
          onClick={() => router.back()}
          className="rounded-lg border border-[--color-border] bg-[--color-surface] px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white transition-colors hover:border-[#fc4f02]/50 hover:bg-[--color-surface-alt] w-full sm:w-auto"
        >
          Back to Dashboard
        </button>
      </div>

      {/* Search Bar */}
      <div className="rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search by name or symbol..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-[--color-border] bg-[--color-surface] px-10 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#fc4f02] focus:outline-none focus:ring-4 focus:ring-[#fc4f02]/20"
          />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-lg border-l-4 border-red-500/50 bg-red-500/10 p-4">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 shrink-0 text-red-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-red-200 font-medium mb-2">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  setIsLoading(true);
                  getTop500Coins()
                    .then((data) => {
                      setCoins(data);
                      setIsLoading(false);
                    })
                    .catch((err: any) => {
                      setError(err.message || "Failed to load market data");
                      setIsLoading(false);
                    });
                }}
                className="text-xs text-red-300 hover:text-red-100 underline"
              >
                Click to retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Market Table */}
      <div className="rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 backdrop-blur shadow-xl shadow-blue-900/10">
        <div className="overflow-x-auto -mx-4 sm:-mx-6 px-4 sm:px-6">
          <div className="w-full inline-block min-w-full">
            <table className="w-full min-w-[500px] sm:min-w-[640px]">
              <colgroup>
                <col className="w-[50px] sm:w-[60px]" />
                <col className="w-[140px] sm:w-[160px]" />
                <col className="w-[100px] sm:w-[120px]" />
                <col className="w-[100px] sm:w-[120px]" />
                <col className="w-[120px] sm:w-[140px]" />
                <col className="w-[120px] sm:w-[140px]" />
              </colgroup>
              <thead className="divide-y divide-[--color-border]">
                <tr className="group/row relative hover:bg-[--color-surface]/40 transition-colors before:absolute before:left-0 before:top-1/2 before:h-8 before:w-1 before:-translate-y-1/2 before:rounded-r-full before:bg-gradient-to-b before:from-[#fc4f02] before:to-[#fda300] before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100">
                  <th className="py-2 sm:py-3 pl-0 pr-1 text-left text-[10px] sm:text-xs md:text-sm font-medium text-white">Rank</th>
                  <th className="py-2 sm:py-3 pl-0 pr-1 text-left text-[10px] sm:text-xs md:text-sm font-medium text-white">Assets</th>
                  <th className="py-2 sm:py-3 pl-1 pr-1 sm:pr-2 text-left text-[10px] sm:text-xs md:text-sm font-medium text-white">price</th>
                  <th className="py-2 sm:py-3 pl-1 pr-1 sm:pr-2 text-left text-[10px] sm:text-xs md:text-sm font-medium text-white">24h change</th>
                  <th className="py-2 sm:py-3 pl-1 pr-1 sm:pr-2 text-left text-[10px] sm:text-xs md:text-sm font-medium text-white hidden sm:table-cell">Market cap</th>
                  <th className="py-2 sm:py-3 pl-1 pr-1 sm:pr-2 text-left text-[10px] sm:text-xs md:text-sm font-medium text-white hidden md:table-cell">volume (24h)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[--color-border]">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <div className="flex items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700/30 border-t-[#fc4f02]"></div>
                      </div>
                    </td>
                  </tr>
                ) : currentCoins.length > 0 ? (
                  currentCoins.map((coin, index) => (
                    <tr
                      key={coin.id}
                      onClick={() => router.push(`/dashboard/market/${coin.symbol.toUpperCase()}`)}
                      className="group/row relative cursor-pointer hover:bg-[--color-surface]/40 transition-colors before:absolute before:left-0 before:top-1/2 before:h-8 before:w-1 before:-translate-y-1/2 before:rounded-r-full before:bg-gradient-to-b before:from-[#fc4f02] before:to-[#fda300] before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100"
                    >
                      <td className="py-2 sm:py-3 pl-0 pr-1 text-left text-[10px] sm:text-xs md:text-sm font-medium text-slate-300 whitespace-nowrap">
                        {startIndex + index + 1}
                      </td>
                      <td className="py-2 sm:py-3 pl-0 pr-1 text-left">
                        <div className="flex items-center justify-start gap-1.5 sm:gap-2 md:gap-3">
                          <img src={coin.image} alt={coin.name} className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 lg:h-8 lg:w-8 rounded-full flex-shrink-0" />
                          <div className="text-left min-w-0 flex-1">
                            <p className="text-[10px] sm:text-xs md:text-sm font-medium text-white truncate">{coin.name}</p>
                            <p className="text-[9px] sm:text-[10px] md:text-xs text-slate-400 uppercase truncate">{coin.symbol}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 sm:py-3 pl-1 pr-1 sm:pr-2 text-left text-[10px] sm:text-xs md:text-sm font-medium text-white whitespace-nowrap">{formatCurrency(coin.current_price)}</td>
                      <td className={`py-2 sm:py-3 pl-1 pr-1 sm:pr-2 text-left text-[10px] sm:text-xs md:text-sm font-medium whitespace-nowrap ${coin.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatPercent(coin.price_change_percentage_24h)}
                      </td>
                      <td className="py-2 sm:py-3 pl-1 pr-1 sm:pr-2 text-left text-[10px] sm:text-xs md:text-sm text-slate-300 whitespace-nowrap hidden sm:table-cell">{formatLargeNumber(coin.market_cap)}</td>
                      <td className="py-2 sm:py-3 pl-1 pr-1 sm:pr-2 text-left text-[10px] sm:text-xs md:text-sm text-slate-300 whitespace-nowrap hidden md:table-cell">{formatLargeNumber(coin.total_volume)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <p className="text-sm">No coins found matching your search</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pagination Controls */}
      {!isLoading && filteredCoins.length > 0 && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-slate-400 text-center sm:text-left">
            Showing {startIndex + 1} - {Math.min(endIndex, filteredCoins.length)} of {filteredCoins.length} coins
          </div>
          
          <div className="flex items-center justify-center gap-1.5 sm:gap-2">
            {/* Previous Button */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="rounded-lg border border-[--color-border] bg-[--color-surface] px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white transition-colors hover:border-[#fc4f02]/50 hover:bg-[--color-surface-alt] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
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
                    className={`rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-all ${
                      currentPage === pageNum
                        ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white shadow-lg shadow-[#fc4f02]/30"
                        : "border border-[--color-border] bg-[--color-surface] text-slate-300 hover:border-[#fc4f02]/50 hover:text-white"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            {/* Next Button */}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-[--color-border] bg-[--color-surface] px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white transition-colors hover:border-[#fc4f02]/50 hover:bg-[--color-surface-alt] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Results Count */}
      {!isLoading && filteredCoins.length > 0 && (
        <div className="text-center text-xs sm:text-sm text-slate-400">
          {searchQuery ? (
            <p>Found {filteredCoins.length} of {coins.length} coins matching "{searchQuery}"</p>
          ) : (
            <p>Total: {coins.length} coins</p>
          )}
        </div>
      )}
    </div>
  );
}

