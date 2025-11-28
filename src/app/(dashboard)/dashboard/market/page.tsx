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
        setError(err.message || "Failed to load market data");
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Market Overview</h1>
          <p className="mt-1 text-sm text-slate-400">Top 500 cryptocurrencies by market cap</p>
        </div>
        <button
          onClick={() => router.back()}
          className="rounded-lg border border-[--color-border] bg-[--color-surface] px-4 py-2 text-sm font-medium text-white transition-colors hover:border-[#fc4f02]/50 hover:bg-[--color-surface-alt]"
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
              <p className="text-sm text-red-200">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Market Table */}
      <div className="rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 backdrop-blur shadow-xl shadow-blue-900/10">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[--color-border]">
                <th className="pb-3 pl-6 text-left text-xs font-medium uppercase text-slate-400">#</th>
                <th className="pb-3 text-left text-xs font-medium uppercase text-slate-400">Asset</th>
                <th className="pb-3 text-right text-xs font-medium uppercase text-slate-400">Price</th>
                <th className="pb-3 text-right text-xs font-medium uppercase text-slate-400">24h Change</th>
                <th className="pb-3 text-right text-xs font-medium uppercase text-slate-400">Market Cap</th>
                <th className="pb-3 text-right text-xs font-medium uppercase text-slate-400">Volume (24h)</th>
                <th className="pb-3 pr-6 text-right text-xs font-medium uppercase text-slate-400">Circulating Supply</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[--color-border]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700/30 border-t-[#fc4f02]"></div>
                    </div>
                  </td>
                </tr>
              ) : currentCoins.length > 0 ? (
                currentCoins.map((coin) => (
                  <tr
                    key={coin.id}
                    className="group/row relative hover:bg-[--color-surface]/40 transition-colors before:absolute before:left-0 before:top-1/2 before:h-8 before:w-1 before:-translate-y-1/2 before:rounded-r-full before:bg-gradient-to-b before:from-[#fc4f02] before:to-[#fda300] before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100"
                  >
                    <td className="py-4 pl-6 text-sm text-slate-400">{coin.market_cap_rank}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <img src={coin.image} alt={coin.name} className="h-8 w-8 rounded-full" />
                        <div>
                          <p className="text-sm font-medium text-white">{coin.name}</p>
                          <p className="text-xs text-slate-400 uppercase">{coin.symbol}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-right text-sm font-medium text-white">{formatCurrency(coin.current_price)}</td>
                    <td className={`py-4 text-right text-sm font-medium ${coin.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatPercent(coin.price_change_percentage_24h)}
                    </td>
                    <td className="py-4 text-right text-sm text-slate-300">{formatLargeNumber(coin.market_cap)}</td>
                    <td className="py-4 text-right text-sm text-slate-300">{formatLargeNumber(coin.total_volume)}</td>
                    <td className="py-4 pr-6 text-right text-sm text-slate-300">
                      {coin.circulating_supply.toLocaleString()} {coin.symbol.toUpperCase()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <p className="text-sm">No coins found matching your search</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {!isLoading && filteredCoins.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4">
          <div className="text-sm text-slate-400">
            Showing {startIndex + 1} - {Math.min(endIndex, filteredCoins.length)} of {filteredCoins.length} coins
          </div>
          
          <div className="flex items-center gap-2">
            {/* Previous Button */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="rounded-lg border border-[--color-border] bg-[--color-surface] px-4 py-2 text-sm font-medium text-white transition-colors hover:border-[#fc4f02]/50 hover:bg-[--color-surface-alt] disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
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
              className="rounded-lg border border-[--color-border] bg-[--color-surface] px-4 py-2 text-sm font-medium text-white transition-colors hover:border-[#fc4f02]/50 hover:bg-[--color-surface-alt] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Results Count */}
      {!isLoading && filteredCoins.length > 0 && (
        <div className="text-center text-sm text-slate-400">
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

