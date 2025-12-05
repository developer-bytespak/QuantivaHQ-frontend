"use client";

import { useState, useEffect, useCallback } from "react";
import { getCryptoNews, CryptoNewsResponse, CryptoNewsItem } from "@/lib/api/news.service";
import { SentimentBadge } from "@/components/news/sentiment-badge";

export default function AIInsightsPage() {
  const [selectedAsset, setSelectedAsset] = useState<string>("BTC");
  const [selectedNews, setSelectedNews] = useState<CryptoNewsItem | null>(null);
  const [newsData, setNewsData] = useState<CryptoNewsResponse | null>(null);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [newsError, setNewsError] = useState<string | null>(null);

  // Fetch crypto news based on selected asset
  const fetchCryptoNews = useCallback(async (symbol: string) => {
    setIsLoadingNews(true);
    setNewsError(null);
    try {
      const data = await getCryptoNews(symbol, 10); // Fetch more news items for this page
      setNewsData(data);
    } catch (error: any) {
      console.error("Failed to fetch crypto news:", error);
      setNewsError(error.message || "Failed to load news");
    } finally {
      setIsLoadingNews(false);
    }
  }, []);

  // Fetch news when asset changes
  useEffect(() => {
    fetchCryptoNews(selectedAsset);
  }, [selectedAsset, fetchCryptoNews]);

  const handleNewsClick = (news: CryptoNewsItem) => {
    setSelectedNews(news);
  };

  const handleCloseOverlay = () => {
    setSelectedNews(null);
  };

  // Get filtered news items based on selected asset
  const displayNewsItems = newsData?.news_items || [];

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-400">AI-powered market news and analysis</p>
        </div>

        {/* Asset Filter */}
        <div className="flex gap-2 rounded-lg bg-[--color-surface]/60 p-1">
          {/* {["BTC", "ETH", "SOL", "XRP", "BNB", "ADA", "DOGE", "MATIC", "LINK", "AVAX"].map((asset) => (
            <button
              key={asset}
              onClick={() => setSelectedAsset(asset)}
              className={`rounded-md px-4 py-2 text-xs font-medium transition-all ${selectedAsset === asset
                  ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white shadow-lg shadow-[#fc4f02]/30"
                  : "text-slate-400 hover:text-white"
                }`}
            >
              {asset}
            </button>
          ))} */}
        </div>
      </div>

      {/* Social Metrics Display */}
      {newsData?.social_metrics && (
        <div className="rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-6 backdrop-blur shadow-xl shadow-blue-900/10">
          <h3 className="mb-4 text-lg font-semibold text-white">Social Metrics - {newsData.symbol}</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
            <div>
              <p className="text-xs text-slate-400">Galaxy Score</p>
              <p className="text-lg font-semibold text-white">{newsData.social_metrics.galaxy_score.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Alt Rank</p>
              <p className="text-lg font-semibold text-white">{newsData.social_metrics.alt_rank}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Social Volume</p>
              <p className="text-lg font-semibold text-white">{newsData.social_metrics.social_volume.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Price</p>
              <p className="text-lg font-semibold text-white">${newsData.social_metrics.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Volume 24h</p>
              <p className="text-lg font-semibold text-white">
                ${(newsData.social_metrics.volume_24h / 1e9).toFixed(2)}B
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Market Cap</p>
              <p className="text-lg font-semibold text-white">
                ${(newsData.social_metrics.market_cap / 1e12).toFixed(2)}T
              </p>
            </div>
          </div>
        </div>
      )}

      {/* News Items */}
      <div className="space-y-4">
        {isLoadingNews ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700/30 border-t-[#fc4f02]"></div>
          </div>
        ) : newsError ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-center">
            <p className="text-sm text-red-300">{newsError}</p>
          </div>
        ) : displayNewsItems.length > 0 ? (
          displayNewsItems.map((news, index) => (
            <div
              key={index}
              onClick={() => handleNewsClick(news)}
              className="cursor-pointer rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-6 backdrop-blur shadow-xl shadow-blue-900/10"
            >
              {/* Header */}
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">{news.title}</h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">
                    {news.published_at
                      ? new Date(news.published_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Recent"}
                  </span>
                </div>
              </div>

              {/* Sentiment Badge and Source */}
              <div className="mb-4 flex items-center gap-3">
                <SentimentBadge
                  label={news.sentiment.label}
                  score={news.sentiment.score}
                  confidence={news.sentiment.confidence}
                  size="sm"
                />
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs text-slate-400">{news.source}</span>
              </div>

              {/* Description */}
              <div className="space-y-2 text-sm text-slate-300">
                <p>{news.description}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-slate-400">
            <p className="text-sm">No news available for {selectedAsset}</p>
          </div>
        )}
      </div>

      {/* News Overlay */}
      {selectedNews && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={handleCloseOverlay}
        >
          <div
            className="relative mx-4 w-full max-w-2xl rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/95 to-[--color-surface-alt]/90 p-6 shadow-2xl shadow-black/50 backdrop-blur"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">{selectedNews.title}</h2>
              <button
                onClick={handleCloseOverlay}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-[--color-surface] hover:text-white"
                aria-label="Close"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
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

            {/* Timestamp and Source */}
            <div className="mb-4 flex items-center gap-3">
              <span className="text-xs text-slate-400">
                {selectedNews.published_at
                  ? new Date(selectedNews.published_at).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Recent"}
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-400">{selectedNews.source}</span>
              {selectedNews.url && (
                <>
                  <span className="text-xs text-slate-500">•</span>
                  <a
                    href={selectedNews.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#fc4f02] hover:underline"
                  >
                    Read full article
                  </a>
                </>
              )}
            </div>

            {/* Sentiment Badge */}
            <div className="mb-4">
              <SentimentBadge
                label={selectedNews.sentiment.label}
                score={selectedNews.sentiment.score}
                confidence={selectedNews.sentiment.confidence}
                size="md"
              />
            </div>

            {/* Description */}
            <div className="space-y-4">
              <div className="space-y-2 text-sm leading-relaxed text-slate-300">
                <p>{selectedNews.description}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
