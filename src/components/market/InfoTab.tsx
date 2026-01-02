"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { getCoinDetails } from "@/lib/api/coingecko.service";

interface InfoTabProps {
  coinSymbol: string;
  stockData?: {
    symbol: string;
    name: string;
    sector: string;
    price: number;
    changePercent24h: number;
    marketCap: number | null;
    volume24h: number;
    peRatio?: number;
    dividendYield?: number;
    description?: string;
  };
  connectionType: "crypto" | "stocks" | null;
}

export default function InfoTab({ coinSymbol, stockData, connectionType }: InfoTabProps) {
  const [coinData, setCoinData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDescriptionOverlayOpen, setIsDescriptionOverlayOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchCoinInfo = async () => {
      // Skip fetching for stocks
      if (connectionType === "stocks") {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        // getCoinDetails handles symbol to ID mapping automatically
        const data = await getCoinDetails(coinSymbol);
        setCoinData(data);
      } catch (err: any) {
        console.error("Failed to fetch coin info:", err);
        // Check if it's a "not found" error
        if (err.message?.includes("not found") || err.message?.includes("404")) {
          setError(`Coin "${coinSymbol}" not found. CoinGecko may not have data for this coin.`);
        } else {
          setError(err.message || "Failed to load coin information");
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (coinSymbol && connectionType) {
      fetchCoinInfo();
    }
  }, [coinSymbol, connectionType]);

  // Prevent body scroll when overlay is open
  useEffect(() => {
    if (isDescriptionOverlayOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDescriptionOverlayOpen]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700/30 border-t-[#fc4f02]"></div>
      </div>
    );
  }

  if (error || (!coinData && connectionType === "crypto")) {
    return (
      <div className="rounded-xl bg-gradient-to-br from-white/[0.05] to-transparent backdrop-blur border border-red-500/20 p-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-red-200">{error || "Failed to load coin information"}</p>
        </div>
      </div>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const formatSupply = (num: number) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(2);
  };

  // Stocks rendering
  if (connectionType === "stocks" && stockData) {
    const stockDescription = stockData.description || `${stockData.name} is a ${stockData.sector} company trading under the symbol ${stockData.symbol}.`;
    const isLongDescription = stockDescription.length > 500;
    const displayDescription = stockDescription.substring(0, 500);

    return (
      <div className="space-y-6">
        {/* Description */}
        <div className="rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)] bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">About {stockData.name}</h3>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            {displayDescription}
            {isLongDescription && "..."}
          </p>
        </div>

        {/* Stock Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="rounded-xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)] bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur p-4">
            <h4 className="text-sm font-medium text-slate-400 mb-2">Sector</h4>
            <p className="text-lg font-semibold text-white">{stockData.sector}</p>
          </div>

          <div className="rounded-xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)] bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur p-4">
            <h4 className="text-sm font-medium text-slate-400 mb-2">Market Cap</h4>
            <p className="text-lg font-semibold text-white">
              {stockData.marketCap ? formatNumber(stockData.marketCap) : "N/A"}
            </p>
          </div>

          <div className="rounded-xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)] bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur p-4">
            <h4 className="text-sm font-medium text-slate-400 mb-2">24h Volume</h4>
            <p className="text-lg font-semibold text-white">
              {formatNumber(stockData.volume24h)}
            </p>
          </div>

          {stockData.peRatio && (
            <div className="rounded-xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)] bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur p-4">
              <h4 className="text-sm font-medium text-slate-400 mb-2">P/E Ratio</h4>
              <p className="text-lg font-semibold text-white">{stockData.peRatio.toFixed(2)}</p>
            </div>
          )}

          {stockData.dividendYield && (
            <div className="rounded-xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)] bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur p-4">
              <h4 className="text-sm font-medium text-slate-400 mb-2">Dividend Yield</h4>
              <p className="text-lg font-semibold text-white">{stockData.dividendYield.toFixed(2)}%</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Original crypto rendering continues below...
  if (!coinData) {
    return (
      <div className="rounded-xl bg-gradient-to-br from-white/[0.05] to-transparent backdrop-blur border border-red-500/20 p-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-red-200">Failed to load coin information</p>
        </div>
      </div>
    );
  }

  const marketData = coinData.market_data || {};
  const links = coinData.links || {};

  const description = coinData.description?.en || "";
  const isLongDescription = description.length > 500;
  const displayDescription = description.substring(0, 500);

  return (
    <div className="space-y-6">
      {/* Description */}
      {description && (
        <div className="rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)] bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">About {coinData.name}</h3>
            {isLongDescription && (
              <button
                onClick={() => setIsDescriptionOverlayOpen(true)}
                className="text-xs font-medium text-[#fc4f02] hover:text-[#fda300] transition-colors"
              >
                Read More
              </button>
            )}
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            {displayDescription}
            {isLongDescription && "..."}
          </p>
        </div>
      )}

      {/* Description Overlay */}
      {mounted && isDescriptionOverlayOpen && createPortal(
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-xl overflow-hidden"
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            margin: 0,
            padding: '1rem',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            animation: 'fadeIn 0.3s ease-out'
          }}
          onClick={() => setIsDescriptionOverlayOpen(false)}
        >
          <div 
            className="relative w-[90vw] h-[85vh] max-w-[800px] max-h-[800px] overflow-hidden rounded-lg shadow-[0_20px_25px_-5px_rgba(0,0,0,0.3),0_0_20px_rgba(252,79,2,0.2),0_0_30px_rgba(253,163,0,0.15)] bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur"
            style={{
              animation: 'slideUp 0.3s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-[#fc4f02]/20 to-[#fda300]/20">
                  <svg className="w-5 h-5 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">About {coinData.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{coinData.symbol?.toUpperCase() || ""}</p>
                </div>
              </div>
              <button
                onClick={() => setIsDescriptionOverlayOpen(false)}
                className="p-2 rounded-lg bg-gradient-to-br from-white/[0.05] to-transparent hover:from-white/[0.1] text-slate-400 hover:text-white transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto h-[calc(100%-120px)] p-6 overlay-scrollbar">
              <div className="prose prose-invert max-w-none">
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {description}
                </p>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Market Stats - Trading App Style */}
      <div className="rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)] bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Market Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Market Cap</p>
            <p className="text-lg font-semibold text-white">
              {marketData.market_cap?.usd ? formatNumber(marketData.market_cap.usd) : "N/A"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Fully Diluted Valuation</p>
            <p className="text-lg font-semibold text-white">
              {marketData.fully_diluted_valuation?.usd ? formatNumber(marketData.fully_diluted_valuation.usd) : "N/A"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Market Cap Rank</p>
            <p className="text-lg font-semibold text-white">#{coinData.market_cap_rank || "N/A"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Circulating Supply</p>
            <p className="text-lg font-semibold text-white">
              {marketData.circulating_supply
                ? `${formatSupply(marketData.circulating_supply)} ${coinData.symbol?.toUpperCase() || ""}`
                : "N/A"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Supply</p>
            <p className="text-lg font-semibold text-white">
              {marketData.total_supply
                ? `${formatSupply(marketData.total_supply)} ${coinData.symbol?.toUpperCase() || ""}`
                : "N/A"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Max Supply</p>
            <p className="text-lg font-semibold text-white">
              {marketData.max_supply
                ? `${formatSupply(marketData.max_supply)} ${coinData.symbol?.toUpperCase() || ""}`
                : "Unlimited"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">All-Time High</p>
            <p className="text-lg font-semibold text-white">
              {marketData.ath?.usd ? `$${marketData.ath.usd.toLocaleString()}` : "N/A"}
            </p>
            {marketData.ath_date?.usd && (
              <p className="text-xs text-slate-500">{new Date(marketData.ath_date.usd).toLocaleDateString()}</p>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">All-Time Low</p>
            <p className="text-lg font-semibold text-white">
              {marketData.atl?.usd ? `$${marketData.atl.usd.toLocaleString()}` : "N/A"}
            </p>
            {marketData.atl_date?.usd && (
              <p className="text-xs text-slate-500">{new Date(marketData.atl_date.usd).toLocaleDateString()}</p>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">24h Volume</p>
            <p className="text-lg font-semibold text-white">
              {marketData.total_volume?.usd ? formatNumber(marketData.total_volume.usd) : "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* Price Changes */}
      <div className="rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)] bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Price Performance</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "1h", key: "price_change_percentage_1h_in_currency", icon: "⏱️" },
            { label: "24h", key: "price_change_percentage_24h_in_currency", icon: "📊" },
            { label: "7d", key: "price_change_percentage_7d_in_currency", icon: "📈" },
            { label: "30d", key: "price_change_percentage_30d_in_currency", icon: "📅" },
            { label: "1y", key: "price_change_percentage_1y_in_currency", icon: "🗓️" },
          ].map(({ label, key, icon }) => {
            const change = marketData[key]?.usd;
            const isPositive = change >= 0;
            const hasData = change !== undefined;
            
            return (
              <div 
                key={label} 
                className={`relative group rounded-xl p-4 transition-all duration-300 bg-gradient-to-br from-white/[0.07] to-transparent hover:from-white/[0.1] hover:to-transparent hover:scale-105 hover:shadow-lg ${
                  isPositive 
                    ? "hover:shadow-green-500/20" 
                    : "hover:shadow-red-500/20"
                }`}
              >
                {/* Decorative corner accent */}
                <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-10 ${
                  isPositive ? "bg-gradient-to-br from-green-500/20 to-transparent" : "bg-gradient-to-br from-red-500/20 to-transparent"
                }`}></div>
                
                <div className="relative space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-lg">{icon}</span>
                    <div className={`p-1.5 rounded-lg ${
                      isPositive 
                        ? "bg-green-500/20" 
                        : "bg-red-500/20"
                    }`}>
                      {isPositive ? (
                        <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                      ) : (
                        <svg className="w-3 h-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
                    <p className={`text-2xl font-bold ${
                      isPositive ? "text-green-400" : "text-red-400"
                    }`}>
                      {hasData
                        ? `${isPositive ? "+" : ""}${change.toFixed(2)}%`
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Links */}
      {(links.homepage?.[0] ||
        links.twitter_screen_name ||
        links.subreddit_url ||
        links.repos_url?.github?.[0]) && (
        <div className="rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)] bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Official Links</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {links.homepage?.[0] && (
              <a
                href={links.homepage[0]}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative rounded-xl p-4 bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur hover:from-white/[0.12] hover:to-transparent transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#fc4f02]/20"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/10 group-hover:from-blue-500/30 group-hover:to-blue-600/20 transition-all duration-300">
                    <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors">Website</p>
                    <p className="text-xs text-slate-400">Official site</p>
                  </div>
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
              </a>
            )}
            {links.twitter_screen_name && (
              <a
                href={`https://twitter.com/${links.twitter_screen_name}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative rounded-xl p-4 bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur hover:from-white/[0.12] hover:to-transparent transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-sky-500/20"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-sky-500/20 to-sky-600/10 group-hover:from-sky-500/30 group-hover:to-sky-600/20 transition-all duration-300">
                    <svg className="w-5 h-5 text-sky-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white group-hover:text-sky-300 transition-colors">Twitter</p>
                    <p className="text-xs text-slate-400">Social media</p>
                  </div>
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
              </a>
            )}
            {links.subreddit_url && (
              <a
                href={links.subreddit_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative rounded-xl p-4 bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur hover:from-white/[0.12] hover:to-transparent transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/20"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-600/10 group-hover:from-orange-500/30 group-hover:to-orange-600/20 transition-all duration-300">
                    <svg className="w-5 h-5 text-orange-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.965-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white group-hover:text-orange-300 transition-colors">Reddit</p>
                    <p className="text-xs text-slate-400">Community</p>
                  </div>
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
              </a>
            )}
            {links.repos_url?.github?.[0] && (
              <a
                href={links.repos_url.github[0]}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative rounded-xl p-4 bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur hover:from-white/[0.12] hover:to-transparent transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/10 group-hover:from-purple-500/30 group-hover:to-purple-600/20 transition-all duration-300">
                    <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors">GitHub</p>
                    <p className="text-xs text-slate-400">Repository</p>
                  </div>
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

