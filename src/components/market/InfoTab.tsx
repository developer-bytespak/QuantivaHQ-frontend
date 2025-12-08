"use client";

import { useState, useEffect } from "react";
import { getCoinDetails } from "@/lib/api/coingecko.service";

interface InfoTabProps {
  coinSymbol: string;
}

export default function InfoTab({ coinSymbol }: InfoTabProps) {
  const [coinData, setCoinData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCoinInfo = async () => {
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

    if (coinSymbol) {
      fetchCoinInfo();
    }
  }, [coinSymbol]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700/30 border-t-[#fc4f02]"></div>
      </div>
    );
  }

  if (error || !coinData) {
    return (
      <div className="rounded-lg border-l-4 border-red-500/50 bg-red-500/10 p-4">
        <p className="text-sm text-red-200">{error || "Failed to load coin information"}</p>
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

  const marketData = coinData.market_data || {};
  const links = coinData.links || {};

  return (
    <div className="space-y-6">
      {/* Description */}
      {coinData.description?.en && (
        <div className="rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-6">
          <h3 className="text-lg font-semibold text-white mb-3">About {coinData.name}</h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            {coinData.description.en.length > 500
              ? `${coinData.description.en.substring(0, 500)}...`
              : coinData.description.en}
          </p>
        </div>
      )}

      {/* Market Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4">
          <p className="text-sm text-slate-400 mb-1">Market Cap</p>
          <p className="text-lg font-semibold text-white">
            {marketData.market_cap?.usd ? formatNumber(marketData.market_cap.usd) : "N/A"}
          </p>
        </div>

        <div className="rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4">
          <p className="text-sm text-slate-400 mb-1">Fully Diluted Valuation</p>
          <p className="text-lg font-semibold text-white">
            {marketData.fully_diluted_valuation?.usd
              ? formatNumber(marketData.fully_diluted_valuation.usd)
              : "N/A"}
          </p>
        </div>

        <div className="rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4">
          <p className="text-sm text-slate-400 mb-1">Market Cap Rank</p>
          <p className="text-lg font-semibold text-white">
            #{coinData.market_cap_rank || "N/A"}
          </p>
        </div>

        <div className="rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4">
          <p className="text-sm text-slate-400 mb-1">Circulating Supply</p>
          <p className="text-lg font-semibold text-white">
            {marketData.circulating_supply
              ? `${formatSupply(marketData.circulating_supply)} ${coinData.symbol?.toUpperCase() || ""}`
              : "N/A"}
          </p>
        </div>

        <div className="rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4">
          <p className="text-sm text-slate-400 mb-1">Total Supply</p>
          <p className="text-lg font-semibold text-white">
            {marketData.total_supply
              ? `${formatSupply(marketData.total_supply)} ${coinData.symbol?.toUpperCase() || ""}`
              : "N/A"}
          </p>
        </div>

        <div className="rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4">
          <p className="text-sm text-slate-400 mb-1">Max Supply</p>
          <p className="text-lg font-semibold text-white">
            {marketData.max_supply
              ? `${formatSupply(marketData.max_supply)} ${coinData.symbol?.toUpperCase() || ""}`
              : "Unlimited"}
          </p>
        </div>

        <div className="rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4">
          <p className="text-sm text-slate-400 mb-1">All-Time High</p>
          <p className="text-lg font-semibold text-white">
            {marketData.ath?.usd ? `$${marketData.ath.usd.toLocaleString()}` : "N/A"}
          </p>
          {marketData.ath_date?.usd && (
            <p className="text-xs text-slate-500 mt-1">
              {new Date(marketData.ath_date.usd).toLocaleDateString()}
            </p>
          )}
        </div>

        <div className="rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4">
          <p className="text-sm text-slate-400 mb-1">All-Time Low</p>
          <p className="text-lg font-semibold text-white">
            {marketData.atl?.usd ? `$${marketData.atl.usd.toLocaleString()}` : "N/A"}
          </p>
          {marketData.atl_date?.usd && (
            <p className="text-xs text-slate-500 mt-1">
              {new Date(marketData.atl_date.usd).toLocaleDateString()}
            </p>
          )}
        </div>

        <div className="rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4">
          <p className="text-sm text-slate-400 mb-1">24h Volume</p>
          <p className="text-lg font-semibold text-white">
            {marketData.total_volume?.usd ? formatNumber(marketData.total_volume.usd) : "N/A"}
          </p>
        </div>
      </div>

      {/* Price Changes */}
      <div className="rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Price Changes</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "1h", key: "price_change_percentage_1h_in_currency" },
            { label: "24h", key: "price_change_percentage_24h_in_currency" },
            { label: "7d", key: "price_change_percentage_7d_in_currency" },
            { label: "30d", key: "price_change_percentage_30d_in_currency" },
            { label: "1y", key: "price_change_percentage_1y_in_currency" },
          ].map(({ label, key }) => {
            const change = marketData[key]?.usd;
            return (
              <div key={label}>
                <p className="text-xs text-slate-400 mb-1">{label}</p>
                <p
                  className={`text-sm font-medium ${
                    change >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {change !== undefined
                    ? `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`
                    : "N/A"}
                </p>
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
        <div className="rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Links</h3>
          <div className="flex flex-wrap gap-3">
            {links.homepage?.[0] && (
              <a
                href={links.homepage[0]}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg border border-[--color-border] bg-[--color-surface] text-white text-sm hover:border-[#fc4f02]/50 transition-colors"
              >
                Website
              </a>
            )}
            {links.twitter_screen_name && (
              <a
                href={`https://twitter.com/${links.twitter_screen_name}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg border border-[--color-border] bg-[--color-surface] text-white text-sm hover:border-[#fc4f02]/50 transition-colors"
              >
                Twitter
              </a>
            )}
            {links.subreddit_url && (
              <a
                href={links.subreddit_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg border border-[--color-border] bg-[--color-surface] text-white text-sm hover:border-[#fc4f02]/50 transition-colors"
              >
                Reddit
              </a>
            )}
            {links.repos_url?.github?.[0] && (
              <a
                href={links.repos_url.github[0]}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg border border-[--color-border] bg-[--color-surface] text-white text-sm hover:border-[#fc4f02]/50 transition-colors"
              >
                GitHub
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

