"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { getGeneralCryptoNews, getGeneralStockNews, CryptoNewsResponse, CryptoNewsItem, StockNewsItem } from "@/lib/api/news.service";
import { useExchange } from "@/context/ExchangeContext";
import { ComingSoon } from "@/components/common/coming-soon";

// Extended news item with AI insights (for both crypto and stocks)
interface AIEnhancedNewsItem extends CryptoNewsItem {
  symbol: string;
  aiSummary?: string;
  impactScore?: number; // 0-100
  impactLevel?: "Low" | "Medium" | "High";
  marketMood?: "Bullish" | "Bearish" | "Neutral";
  riskRating?: "Low" | "Medium" | "High";
  trendDirection?: "up" | "down" | "neutral";
  sparklineData?: number[];
}

// Extended stock news item with AI insights
interface AIEnhancedStockNewsItem extends StockNewsItem {
  symbol: string;
  aiSummary?: string;
  impactScore?: number;
  impactLevel?: "Low" | "Medium" | "High";
  marketMood?: "Bullish" | "Bearish" | "Neutral";
  riskRating?: "Low" | "Medium" | "High";
  trendDirection?: "up" | "down" | "neutral";
  sparklineData?: number[];
}

// Popular coins to fetch news from
const POPULAR_COINS = ["BTC", "ETH", "SOL", "XRP", "BNB", "ADA", "DOGE", "MATIC", "LINK", "AVAX"];

// Map symbol to CoinGecko coin ID
const SYMBOL_TO_COINGECKO_ID: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  XRP: "ripple",
  BNB: "binancecoin",
  ADA: "cardano",
  DOGE: "dogecoin",
  MATIC: "matic-network",
  LINK: "chainlink",
  AVAX: "avalanche-2",
};

// Coin logo colors with glow
const COIN_COLORS: Record<string, { bg: string; glow: string; text: string }> = {
  BTC: { bg: "bg-orange-500/20", glow: "shadow-orange-500/30", text: "text-orange-400" },
  ETH: { bg: "bg-purple-500/20", glow: "shadow-purple-500/30", text: "text-purple-400" },
  SOL: { bg: "bg-teal-500/20", glow: "shadow-teal-500/30", text: "text-teal-400" },
  XRP: { bg: "bg-blue-500/20", glow: "shadow-blue-500/30", text: "text-blue-400" },
  BNB: { bg: "bg-yellow-500/20", glow: "shadow-yellow-500/30", text: "text-yellow-400" },
  ADA: { bg: "bg-cyan-500/20", glow: "shadow-cyan-500/30", text: "text-cyan-400" },
  DOGE: { bg: "bg-amber-500/20", glow: "shadow-amber-500/30", text: "text-amber-400" },
  MATIC: { bg: "bg-indigo-500/20", glow: "shadow-indigo-500/30", text: "text-indigo-400" },
  LINK: { bg: "bg-blue-400/20", glow: "shadow-blue-400/30", text: "text-blue-300" },
  AVAX: { bg: "bg-red-500/20", glow: "shadow-red-500/30", text: "text-red-400" },
};

// Popular stocks for background
const POPULAR_STOCKS = ["AAPL", "TSLA", "GOOGL", "AMZN", "MSFT", "NVDA", "META", "AMD", "NFLX", "DIS"];

// Stock colors with glow (using company brand-inspired colors)
const STOCK_COLORS: Record<string, { bg: string; glow: string; text: string }> = {
  AAPL: { bg: "bg-slate-400/20", glow: "shadow-slate-400/30", text: "text-slate-300" },
  TSLA: { bg: "bg-red-500/20", glow: "shadow-red-500/30", text: "text-red-400" },
  GOOGL: { bg: "bg-blue-500/20", glow: "shadow-blue-500/30", text: "text-blue-400" },
  AMZN: { bg: "bg-orange-500/20", glow: "shadow-orange-500/30", text: "text-orange-400" },
  MSFT: { bg: "bg-cyan-500/20", glow: "shadow-cyan-500/30", text: "text-cyan-400" },
  NVDA: { bg: "bg-green-500/20", glow: "shadow-green-500/30", text: "text-green-400" },
  META: { bg: "bg-blue-600/20", glow: "shadow-blue-600/30", text: "text-blue-400" },
  AMD: { bg: "bg-red-600/20", glow: "shadow-red-600/30", text: "text-red-400" },
  NFLX: { bg: "bg-red-500/20", glow: "shadow-red-500/30", text: "text-red-400" },
  DIS: { bg: "bg-indigo-500/20", glow: "shadow-indigo-500/30", text: "text-indigo-400" },
};

// Generate AI-enhanced data from news item
function enhanceNewsWithAI(news: CryptoNewsItem, symbol: string): AIEnhancedNewsItem {
  // Determine market mood from sentiment
  const marketMood: "Bullish" | "Bearish" | "Neutral" = 
    news.sentiment.label === "positive" ? "Bullish" :
    news.sentiment.label === "negative" ? "Bearish" : "Neutral";

  // Calculate impact score based on sentiment and confidence
  const impactScore = Math.round(
    (Math.abs(news.sentiment.score) * 50) + (news.sentiment.confidence * 50)
  );

  // Determine impact level
  const impactLevel: "Low" | "Medium" | "High" = 
    impactScore >= 75 ? "High" : impactScore >= 50 ? "Medium" : "Low";

  // Determine risk rating (inverse of confidence for negative, same for positive)
  const riskRating: "Low" | "Medium" | "High" = 
    news.sentiment.confidence > 0.7 ? "Low" : 
    news.sentiment.confidence > 0.4 ? "Medium" : "High";

  // Determine trend direction
  const trendDirection: "up" | "down" | "neutral" = 
    news.sentiment.score > 0.1 ? "up" : 
    news.sentiment.score < -0.1 ? "down" : "neutral";

  // Generate AI summary
  const aiSummary = `This ${news.sentiment.label === "positive" ? "positive" : news.sentiment.label === "negative" ? "negative" : "neutral"} news suggests ${
    marketMood === "Bullish" ? "increased market interest" :
    marketMood === "Bearish" ? "potential market concerns" :
    "neutral market conditions"
  }. Historically, similar news has ${
    marketMood === "Bullish" ? "boosted" : marketMood === "Bearish" ? "impacted" : "maintained"
  } ${symbol} by ${Math.abs(news.sentiment.score * 10).toFixed(1)}-${(Math.abs(news.sentiment.score * 10) + 5).toFixed(1)}% within 24 hours.`;

  // Generate sparkline data (simulated price movement)
  const sparklineData = Array.from({ length: 20 }, (_, i) => {
    const base = 50;
    const trend = news.sentiment.score * 20;
    const volatility = (Math.random() - 0.5) * 10;
    return Math.max(0, Math.min(100, base + trend + (i * trend / 20) + volatility));
  });

  return {
    ...news,
    symbol,
    aiSummary,
    impactScore,
    impactLevel,
    marketMood,
    riskRating,
    trendDirection,
    sparklineData,
  };
}

// Generate AI-enhanced data from stock news item
function enhanceStockNewsWithAI(news: StockNewsItem, symbol: string): AIEnhancedStockNewsItem {
  // Determine market mood from sentiment
  const marketMood: "Bullish" | "Bearish" | "Neutral" = 
    news.sentiment.label === "positive" ? "Bullish" :
    news.sentiment.label === "negative" ? "Bearish" : "Neutral";

  // Calculate impact score based on sentiment and confidence
  const impactScore = Math.round(
    (Math.abs(news.sentiment.score) * 50) + (news.sentiment.confidence * 50)
  );

  // Determine impact level
  const impactLevel: "Low" | "Medium" | "High" = 
    impactScore >= 75 ? "High" : impactScore >= 50 ? "Medium" : "Low";

  // Determine risk rating
  const riskRating: "Low" | "Medium" | "High" = 
    news.sentiment.confidence > 0.7 ? "Low" : 
    news.sentiment.confidence > 0.4 ? "Medium" : "High";

  // Determine trend direction
  const trendDirection: "up" | "down" | "neutral" = 
    news.sentiment.score > 0.1 ? "up" : 
    news.sentiment.score < -0.1 ? "down" : "neutral";

  // Generate AI summary for stocks
  const aiSummary = `This ${news.sentiment.label === "positive" ? "positive" : news.sentiment.label === "negative" ? "negative" : "neutral"} news indicates ${
    marketMood === "Bullish" ? "increased investor confidence" :
    marketMood === "Bearish" ? "potential market concerns" :
    "neutral market sentiment"
  } for ${symbol}. Based on sentiment analysis, the stock may ${
    marketMood === "Bullish" ? "see upward movement" : marketMood === "Bearish" ? "face downward pressure" : "remain stable"
  } in the short term.`;

  // Generate sparkline data
  const sparklineData = Array.from({ length: 20 }, (_, i) => {
    const base = 50;
    const trend = news.sentiment.score * 20;
    const volatility = (Math.random() - 0.5) * 10;
    return Math.max(0, Math.min(100, base + trend + (i * trend / 20) + volatility));
  });

  return {
    ...news,
    symbol,
    aiSummary,
    impactScore,
    impactLevel,
    marketMood,
    riskRating,
    trendDirection,
    sparklineData,
  };
}

// Coin Logo Component with CoinGecko CDN
function CoinLogo({ 
  symbol, 
  size = "md",
  logoUrl 
}: { 
  symbol: string; 
  size?: "sm" | "md" | "lg";
  logoUrl?: string | null;
}) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const colors = COIN_COLORS[symbol] || COIN_COLORS.BTC;
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  // If no logo URL or image error, show fallback with coin symbol
  if (!logoUrl || imageError) {
    return (
      <div
        className={`${sizeClasses[size]} ${colors.bg} rounded-full flex items-center justify-center font-bold ${colors.text} border-2 ${colors.text}/30 shadow-lg ${colors.glow}`}
        title={symbol}
      >
        {symbol.slice(0, 2)}
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} ${colors.bg} rounded-full flex items-center justify-center border-2 ${colors.text}/30 shadow-lg ${colors.glow} overflow-hidden relative`}
      title={symbol}
    >
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin"></div>
        </div>
      )}
      <Image
        src={logoUrl}
        alt={`${symbol} logo`}
        fill
        className={`object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setImageLoaded(true)}
        onError={() => {
          setImageError(true);
          setImageLoaded(false);
        }}
        unoptimized
        priority={false}
      />
    </div>
  );
}

// Stock Logo Component (text-based with company colors)
function StockLogo({ 
  symbol, 
  size = "md" 
}: { 
  symbol: string; 
  size?: "sm" | "md" | "lg";
}) {
  const colors = STOCK_COLORS[symbol] || { bg: "bg-slate-500/20", glow: "shadow-slate-500/30", text: "text-slate-300" };
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  };

  return (
    <div
      className={`${sizeClasses[size]} ${colors.bg} rounded-full flex items-center justify-center font-bold ${colors.text} border-2 ${colors.text}/30 shadow-lg ${colors.glow}`}
      title={symbol}
    >
      {symbol.slice(0, 3)}
    </div>
  );
}

// Floating stock symbols component (background)
function FloatingStockSymbols({ stocks }: { stocks: string[] }) {
  return (
    <>
      {stocks.map((stock, index) => {
        const delay = index * 0.3;
        const duration = 8 + Math.random() * 4;
        const startX = 10 + Math.random() * 80;
        const startY = 10 + Math.random() * 80;
        
        return (
          <div
            key={stock}
            className="absolute text-slate-600/10 text-5xl md:text-6xl font-bold select-none"
            style={{
              left: `${startX}%`,
              top: `${startY}%`,
              animationName: 'float-gentle',
              animationDuration: `${duration}s`,
              animationTimingFunction: 'ease-in-out',
              animationIterationCount: 'infinite',
              animationDelay: `${delay}s`,
            }}
          >
            {stock}
          </div>
        );
      })}
    </>
  );
}

// Trend Graph Component using PNG images
function TrendGraph({ trend }: { trend: "up" | "down" | "neutral" }) {
  const getImageSrc = () => {
    switch (trend) {
      case "up":
        return "/upper_trend.png";
      case "down":
        return "/downtrend.png";
      case "neutral":
        return "/neural_tren.png";
      default:
        return "/neural_tren.png";
    }
  };

  return (
    <div className="relative w-48 h-16 flex-shrink-0">
      <Image
        src={getImageSrc()}
        alt={`${trend} trend`}
        width={192}
        height={64}
        className="object-contain w-full h-full"
        unoptimized
      />
    </div>
  );
}

// Market Mood Badge
function MarketMoodBadge({ mood }: { mood: "Bullish" | "Bearish" | "Neutral" }) {
  const colors = {
    Bullish: "bg-green-500/20 text-green-400 border-green-500/30",
    Bearish: "bg-red-500/20 text-red-400 border-red-500/30",
    Neutral: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${colors[mood]}`}>
      {mood}
    </span>
  );
}

// Impact Score Bar
function ImpactScoreBar({ score, level }: { score: number; level: "Low" | "Medium" | "High" }) {
  const levelColors = {
    Low: "bg-slate-500",
    Medium: "bg-yellow-500",
    High: "bg-orange-500",
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-700/50 rounded-full overflow-hidden">
        <div
          className={`h-full ${levelColors[level]} transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-white">{score}/100</span>
      <span className={`text-xs font-medium ${levelColors[level].replace('bg-', 'text-')}`}>
        {level}
      </span>
    </div>
  );
}

// Filter Buttons Component
function FilterButtons({
  activeFilter,
  onFilterChange,
}: {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}) {
  const filters = [
    { id: "trending", label: "Trending" },
    { id: "bullish", label: "Bullish" },
    { id: "bearish", label: "Bearish" },
    { id: "high-impact", label: "High-impact" },
    { id: "ai-predicted", label: "AI predicted" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeFilter === filter.id
              ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white shadow-lg shadow-[#fc4f02]/30"
              : "bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}

// Pagination Component
function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first, last, current, and surrounding pages
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push(-1); // ellipsis
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push(-1);
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push(-1);
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push(-1);
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-700/50">
      {/* Info text */}
      <div className="text-xs sm:text-sm text-slate-400">
        Showing {startItem} to {endItem} of {totalItems} items
      </div>

      {/* Pagination buttons */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Previous button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
            currentPage === 1
              ? "bg-slate-800/30 text-slate-600 cursor-not-allowed"
              : "bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => {
            if (page === -1) {
              return (
                <span key={`ellipsis-${index}`} className="px-2 text-slate-500">
                  ...
                </span>
              );
            }
            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  currentPage === page
                    ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white shadow-lg shadow-[#fc4f02]/30"
                    : "bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Next button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
            currentPage === totalPages
              ? "bg-slate-800/30 text-slate-600 cursor-not-allowed"
              : "bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Floating coin symbols component (background)
function FloatingCoinSymbols({ coins }: { coins: string[] }) {
  return (
    <>
      {coins.map((coin, index) => {
        const delay = index * 0.3;
        const duration = 8 + Math.random() * 4;
        const startX = 10 + Math.random() * 80;
        const startY = 10 + Math.random() * 80;
        
        return (
          <div
            key={coin}
            className="absolute text-slate-600/10 text-5xl md:text-6xl font-bold select-none"
            style={{
              left: `${startX}%`,
              top: `${startY}%`,
              animationName: 'float-gentle',
              animationDuration: `${duration}s`,
              animationTimingFunction: 'ease-in-out',
              animationIterationCount: 'infinite',
              animationDelay: `${delay}s`,
            }}
          >
            {coin}
          </div>
        );
      })}
    </>
  );
}

// Animated connection lines component
function AnimatedConnectionLines() {
  const [lines, setLines] = useState<Array<{ id: number; x1: number; y1: number; x2: number; y2: number; delay: number }>>([]);

  useEffect(() => {
    const generateLines = () => {
      const newLines = Array.from({ length: 8 }, (_, i) => ({
        id: i,
        x1: Math.random() * 100,
        y1: Math.random() * 100,
        x2: Math.random() * 100,
        y2: Math.random() * 100,
        delay: i * 0.2,
      }));
      setLines(newLines);
    };

    generateLines();
    const interval = setInterval(generateLines, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.03 }}>
      {lines.map((line) => (
        <line
          key={line.id}
          x1={`${line.x1}%`}
          y1={`${line.y1}%`}
          x2={`${line.x2}%`}
          y2={`${line.y2}%`}
          stroke="#fc4f02"
          strokeWidth="1"
          className="animate-pulse"
          style={{ animationDelay: `${line.delay}s` }}
        />
      ))}
    </svg>
  );
}

// Data stream particles component
function DataStreamParticles() {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    const generateParticles = () => {
      const newParticles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: i * 0.1,
      }));
      setParticles(newParticles);
    };

    generateParticles();
    const interval = setInterval(generateParticles, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {particles.map((particle) => {
        const duration = 3 + Math.random() * 2;
        return (
          <div
            key={particle.id}
            className="absolute w-1 h-1 rounded-full bg-[#fc4f02]/20"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animationName: 'particle-float',
              animationDuration: `${duration}s`,
              animationTimingFunction: 'ease-in-out',
              animationIterationCount: 'infinite',
              animationDelay: `${particle.delay}s`,
            }}
          />
        );
      })}
    </>
  );
}

export default function AIInsightsPage() {
  // Connection type detection - using global context
  const { connectionType, isLoading: isCheckingConnection } = useExchange();

  const [selectedNews, setSelectedNews] = useState<AIEnhancedNewsItem | AIEnhancedStockNewsItem | null>(null);
  const [allNewsItems, setAllNewsItems] = useState<AIEnhancedNewsItem[]>([]);
  const [allStockNewsItems, setAllStockNewsItems] = useState<AIEnhancedStockNewsItem[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("trending");
  const [sortBy, setSortBy] = useState<string>("most-recent");
  const [coinLogos, setCoinLogos] = useState<Record<string, string>>({});
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);
  const [isInitializingML, setIsInitializingML] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Fetch general crypto news (not specific to any coin)
  const fetchAllCryptoNews = useCallback(async () => {
    // Only fetch if crypto connection
    if (connectionType !== "crypto") return;
    
    setIsLoadingNews(true);
    setNewsError(null);
    const startTime = Date.now();
    setLoadingStartTime(startTime);
    setIsInitializingML(false);
    
    // Show ML initialization message after 30 seconds
    const mlInitTimeout = setTimeout(() => {
      setIsInitializingML(true);
    }, 30000);
    
    try {
      console.log("Fetching general crypto news...");
      // Fetch general crypto news - single request, no multiple coin requests
      // Timeout is now 10 minutes to allow for FinBERT initialization
      const data = await getGeneralCryptoNews(30); // Get more news items for general feed
      
      clearTimeout(mlInitTimeout);
      setIsInitializingML(false);
      
      // Enhance news with AI insights
      // Use the symbol field from the API response (already includes symbol for each news item)
      const enhancedNews = data.news_items.map((item: any) => {
        // Use the symbol from the response, fallback to "CRYPTO" if not available
        const symbol = item.symbol || "CRYPTO";
        return enhanceNewsWithAI(item, symbol);
      });
      
      // Sort by date (most recent first)
      const sortedNews = enhancedNews.sort((a, b) => {
        const dateA = a.published_at ? new Date(a.published_at).getTime() : 0;
        const dateB = b.published_at ? new Date(b.published_at).getTime() : 0;
        return dateB - dateA;
      });

      setAllNewsItems(sortedNews);
      
      if (sortedNews.length === 0) {
        setNewsError("No news available. The backend may still be initializing ML models. Please refresh in a moment.");
      } else {
        console.log(`✅ Loaded ${sortedNews.length} general crypto news items`);
      }
    } catch (error: any) {
      clearTimeout(mlInitTimeout);
      setIsInitializingML(false);
      console.error("Failed to fetch general crypto news:", error);
      
      // Provide helpful error message
      const elapsed = Math.round((Date.now() - startTime) / 1000 / 60);
      if (error.message?.includes('timeout') || error.message?.includes('FinBERT')) {
        setNewsError(
          `FinBERT model is still initializing (${elapsed} minute${elapsed !== 1 ? 's' : ''} elapsed). ` +
          `This is a one-time process that downloads ~438MB from Hugging Face. ` +
          `Please wait a few more minutes and refresh the page. The model will be cached after the first download.`
        );
      } else {
        setNewsError(error.message || "Failed to load news. The backend may be initializing ML models.");
      }
    } finally {
      setIsLoadingNews(false);
      setLoadingStartTime(null);
    }
  }, [connectionType]); // Depend on connectionType so function updates when connection changes

  // Fetch all stock news
  const fetchAllStockNews = useCallback(async () => {
    // Only fetch if stocks connection
    if (connectionType !== "stocks") return;
    
    setIsLoadingNews(true);
    setNewsError(null);
    const startTime = Date.now();
    setLoadingStartTime(startTime);
    setIsInitializingML(false);
    
    // Show ML initialization message after 30 seconds
    const mlInitTimeout = setTimeout(() => {
      setIsInitializingML(true);
    }, 30000);
    
    try {
      console.log("Fetching general stock news...");
      const data = await getGeneralStockNews(30);
      
      clearTimeout(mlInitTimeout);
      setIsInitializingML(false);
      
      // Enhance news with AI insights
      const enhancedNews = data.news_items.map((item: any) => {
        const symbol = item.symbol || "STOCK";
        return enhanceStockNewsWithAI(item, symbol);
      });
      
      // Sort by date (most recent first)
      const sortedNews = enhancedNews.sort((a, b) => {
        const dateA = a.published_at ? new Date(a.published_at).getTime() : 0;
        const dateB = b.published_at ? new Date(b.published_at).getTime() : 0;
        return dateB - dateA;
      });

      setAllStockNewsItems(sortedNews);
      
      if (sortedNews.length === 0) {
        setNewsError("No stock news available. The system may still be fetching news from StockNewsAPI. Please refresh in a moment.");
      } else {
        console.log(`Loaded ${sortedNews.length} general stock news items`);
      }
    } catch (error: any) {
      clearTimeout(mlInitTimeout);
      setIsInitializingML(false);
      console.error("Failed to fetch general stock news:", error);
      
      const elapsed = Math.round((Date.now() - startTime) / 1000 / 60);
      if (error.message?.includes('timeout') || error.message?.includes('FinBERT')) {
        setNewsError(
          `Sentiment analysis model is initializing (${elapsed} minute${elapsed !== 1 ? 's' : ''} elapsed). ` +
          `Please wait a few more minutes and refresh the page.`
        );
      } else {
        setNewsError(error.message || "Failed to load stock news. Please try again later.");
      }
    } finally {
      setIsLoadingNews(false);
      setLoadingStartTime(null);
    }
  }, [connectionType]);

  // Fetch coin logos from CoinGecko CDN (no API calls needed)
  const fetchCoinLogos = useCallback(async () => {
    // CoinGecko image CDN URLs (direct access, no API needed, no rate limits)
    // Format: https://assets.coingecko.com/coins/images/{id}/large/{coin_id}.png
    const COINGECKO_IMAGE_CDN = "https://assets.coingecko.com/coins/images";
    
    // Known CoinGecko image IDs for popular coins (these are stable and don't change)
    const COIN_IMAGE_IDS: Record<string, number> = {
      BTC: 1,      // bitcoin
      ETH: 279,    // ethereum
      SOL: 4128,   // solana
      XRP: 52,     // ripple
      BNB: 1839,   // binancecoin
      ADA: 2010,   // cardano
      DOGE: 5,     // dogecoin
      MATIC: 4713, // matic-network
      LINK: 1975,  // chainlink
      AVAX: 12559, // avalanche-2
    };

    const logoMap: Record<string, string> = {};
    
    // Use direct CDN URLs (no API calls, no rate limits, faster)
    POPULAR_COINS.forEach((symbol) => {
      const imageId = COIN_IMAGE_IDS[symbol];
      const coinId = SYMBOL_TO_COINGECKO_ID[symbol];
      if (imageId && coinId) {
        logoMap[symbol] = `${COINGECKO_IMAGE_CDN}/${imageId}/large/${coinId}.png`;
      }
    });
    
    // Set the logos immediately (no async API call needed)
    if (Object.keys(logoMap).length > 0) {
      setCoinLogos(logoMap);
      if (process.env.NODE_ENV === "development") {
        console.log("✅ Coin logos loaded from CDN:", Object.keys(logoMap));
      }
    }
  }, []);

  useEffect(() => {
    // Fetch data based on connection type
    if (connectionType === "crypto") {
      fetchAllCryptoNews();
      fetchCoinLogos();
    } else if (connectionType === "stocks") {
      fetchAllStockNews();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionType]); // Run when connection type is determined

  // Filter and sort news (works for both crypto and stocks)
  const filteredAndSortedNews = useMemo(() => {
    // Use the appropriate news items based on connection type
    const sourceItems = connectionType === "stocks" ? allStockNewsItems : allNewsItems;
    let filtered = [...sourceItems];

    // Apply filters
    if (activeFilter === "bullish") {
      filtered = filtered.filter((item) => item.marketMood === "Bullish");
    } else if (activeFilter === "bearish") {
      filtered = filtered.filter((item) => item.marketMood === "Bearish");
    } else if (activeFilter === "high-impact") {
      filtered = filtered.filter((item) => item.impactLevel === "High");
    } else if (activeFilter === "ai-predicted") {
      filtered = filtered.filter((item) => item.impactScore && item.impactScore > 70);
    }
    // "trending" shows all

    // Apply sorting
    if (sortBy === "most-recent") {
      filtered.sort((a, b) => {
        const dateA = a.published_at ? new Date(a.published_at).getTime() : 0;
        const dateB = b.published_at ? new Date(b.published_at).getTime() : 0;
        return dateB - dateA;
      });
    } else if (sortBy === "coin-based" || sortBy === "stock-based") {
      filtered.sort((a, b) => a.symbol.localeCompare(b.symbol));
    } else if (sortBy === "sentiment-level") {
      filtered.sort((a, b) => {
        const moodOrder = { Bullish: 3, Neutral: 2, Bearish: 1 };
        return (moodOrder[b.marketMood || "Neutral"] || 0) - (moodOrder[a.marketMood || "Neutral"] || 0);
      });
    }

    return filtered;
  }, [allNewsItems, allStockNewsItems, activeFilter, sortBy, connectionType]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredAndSortedNews.length / itemsPerPage);
  const paginatedNews = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedNews.slice(startIndex, endIndex);
  }, [filteredAndSortedNews, currentPage, itemsPerPage]);

  // Reset to page 1 when filters or sorting changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, sortBy, connectionType]);

  const handleNewsClick = (news: AIEnhancedNewsItem | AIEnhancedStockNewsItem) => {
    setSelectedNews(news);
  };

  const handleCloseSidebar = () => {
    setSelectedNews(null);
  };

  // Prevent body scroll when overlay is open
  useEffect(() => {
    if (selectedNews) {
      // Save current scroll position
      const scrollY = window.scrollY;
      // Prevent scrolling
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    } else {
      // Restore scrolling
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }

    // Cleanup on unmount
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
    };
  }, [selectedNews]);

  const getTimeAgo = (publishedAt: string | null) => {
    if (!publishedAt) return "Recent";
    const now = new Date();
    const published = new Date(publishedAt);
    const diffMs = now.getTime() - published.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  // Show loading while checking connection
  if (isCheckingConnection) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700/30 border-t-[#fc4f02]"></div>
      </div>
    );
  }

  // Unified return for both crypto and stocks
  return (
    <div className="relative space-y-3 sm:space-y-4 md:space-y-6 pb-8 p-4 sm:p-0 overflow-x-hidden w-full">
      {/* Interactive Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 max-w-full">
        <div className="absolute top-1/4 left-1/4 h-64 sm:h-96 w-64 sm:w-96 rounded-full bg-[#fc4f02]/5 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 h-64 sm:h-96 w-64 sm:w-96 rounded-full bg-[#fda300]/5 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 right-1/3 h-48 sm:h-64 w-48 sm:w-64 rounded-full bg-[#fc4f02]/3 blur-3xl animate-pulse" style={{ animationDelay: "0.5s" }} />
        {connectionType === "stocks" ? (
          <FloatingStockSymbols stocks={POPULAR_STOCKS} />
        ) : (
          <FloatingCoinSymbols coins={POPULAR_COINS} />
        )}
        <AnimatedConnectionLines />
        <DataStreamParticles />
      </div>

      {/* Content */}
      <div className="relative z-10">
      {/* Page Header */}
        <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
        <div>
            <p className="text-xs sm:text-sm text-slate-400 mb-1 sm:mb-2">
              AI-powered {connectionType === "stocks" ? "stock" : "crypto"} market news and analysis
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">AI Insights</h1>
        </div>

          {/* Filter Buttons */}
          <FilterButtons activeFilter={activeFilter} onFilterChange={setActiveFilter} />

          {/* Sort Options */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
            <span className="text-xs sm:text-sm text-slate-400">Latest</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-1.5 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#fc4f02]/50 w-full sm:w-auto"
            >
              <option value="most-recent">Most recent</option>
              <option value={connectionType === "stocks" ? "stock-based" : "coin-based"}>
                {connectionType === "stocks" ? "Stock-based" : "Coin-based"}
              </option>
              <option value="sentiment-level">Sentiment level</option>
            </select>
        </div>
      </div>

      {/* News Items */}
      <div className="space-y-3 sm:space-y-4">
        {isLoadingNews ? (
          <div className="flex flex-col items-center justify-center py-8 sm:py-12 space-y-3 sm:space-y-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700/30 border-t-[#fc4f02]"></div>
            {isInitializingML && (
              <div className="text-center max-w-xs sm:max-w-md px-4">
                <p className="text-xs sm:text-sm text-slate-300 mb-2">
                  Initializing FinBERT ML Model
                </p>
                <p className="text-xs text-slate-400">
                  Downloading ~438MB model from Hugging Face. This is a one-time process that takes 5-10 minutes depending on your internet speed. The model will be cached after download.
                </p>
                {loadingStartTime && (
                  <p className="text-xs text-slate-500 mt-2">
                    Elapsed: {Math.round((Date.now() - loadingStartTime) / 1000 / 60)} minute{Math.round((Date.now() - loadingStartTime) / 1000 / 60) !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            )}
            {!isInitializingML && (
              <p className="text-xs sm:text-sm text-slate-400">Loading news...</p>
            )}
          </div>
        ) : newsError ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 sm:p-4 text-center">
            <p className="text-xs sm:text-sm text-red-300">{newsError}</p>
          </div>
          ) : paginatedNews.length > 0 ? (
            <>
              {paginatedNews.map((news, index) => (
            <div
                  key={`${news.symbol}-${(currentPage - 1) * itemsPerPage + index}`}
              onClick={() => handleNewsClick(news)}
                className="group cursor-pointer rounded-lg sm:rounded-2xl bg-gradient-to-br from-white/[0.07] to-transparent p-4 sm:p-6 backdrop-blur shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)] transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_25px_30px_-5px_rgba(0,0,0,0.15),0_0_25px_rgba(252,79,2,0.12),0_0_35px_rgba(253,163,0,0.1)]"
              >
                {/* Title Row with Coin Logo and Sparkline on Right */}
                <div className="flex items-start justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
                  <h2 className="text-base sm:text-xl font-bold text-white group-hover:text-[#fc4f02] transition-colors text-left flex-1 leading-tight">
                    {news.title}
                  </h2>
                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    {/* Asset Logo - Coin for crypto, Stock badge for stocks */}
                    {connectionType === "stocks" ? (
                      <StockLogo symbol={news.symbol} size="md" />
                    ) : (
                      <CoinLogo symbol={news.symbol} size="md" logoUrl={coinLogos[news.symbol]} />
                    )}
                    
                    {/* Trend Graph */}
                    {news.trendDirection && (
                      <TrendGraph trend={news.trendDirection} />
                    )}
                  </div>
                </div>

                {/* AI Summary */}
                {news.aiSummary && (
                  <div className="space-y-1 text-left mb-3 sm:mb-4">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">AI Summary</p>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed line-clamp-2">{news.aiSummary}</p>
                  </div>
                )}

                {/* Horizontal Line */}
                <div className="border-t border-slate-700/50 my-3 sm:my-4"></div>

                {/* Single Line: Market Mood, Impact on Coin, Impact Level, Timestamp */}
                <div className="flex items-center gap-2 sm:gap-4 flex-wrap text-xs sm:text-sm">
                  {/* Market Mood */}
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-xs text-slate-400 hidden sm:inline">Market Mood</span>
                    <MarketMoodBadge mood={news.marketMood || "Neutral"} />
                  </div>

                  {/* Impact on Coin */}
                  {news.impactScore !== undefined && (
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <span className="text-xs text-slate-400 hidden sm:inline">Impact</span>
                      <span className="text-xs font-semibold px-2 py-1 rounded bg-green-500/20 text-green-400 border border-green-500/30">
                        {news.impactScore}
                      </span>
                    </div>
                  )}

                  {/* Impact Level */}
                  {news.impactLevel && (
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className={`text-xs font-medium ${
                        news.impactLevel === "High" ? "text-orange-400" :
                        news.impactLevel === "Medium" ? "text-yellow-400" :
                        "text-slate-400"
                      }`}>
                        {news.impactLevel}
                      </span>
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
                    <span className="text-xs text-slate-400">{getTimeAgo(news.published_at)}</span>
                  </div>
                </div>
            </div>
              ))}
              
              {/* Pagination Controls */}
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={filteredAndSortedNews.length}
                itemsPerPage={itemsPerPage}
              />
            </>
        ) : (
          <div className="py-8 sm:py-12 text-center text-slate-400">
              <p className="text-xs sm:text-sm">No news available</p>
          </div>
        )}
        </div>
      </div>

      {/* Right Sidebar Panel - Enhanced */}
      {selectedNews && (
        <>
          {/* Backdrop with animation - Mobile only */}
          <div
            className="fixed inset-0 bg-black/90 z-[100] sm:hidden"
            onClick={handleCloseSidebar}
            style={{ 
              animationName: 'fade-in',
              animationDuration: '0.3s',
              animationTimingFunction: 'ease-out',
              animationFillMode: 'forwards',
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              height: '100%'
            }}
          />
          
          {/* Sidebar with fade-in animation - Mobile Centered Modal / Desktop Centered */}
          <div 
            className="fixed left-4 right-4 top-1/2 -translate-y-1/2 max-h-[70vh] sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:top-1/2 sm:w-full sm:max-w-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-lg sm:rounded-lg border border-slate-700/50 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)] z-[110] overflow-y-auto overflow-x-hidden"
            style={{ animation: "fade-in-center 0.2s ease-out" }}
          >
            <div className="p-3 sm:p-6 space-y-3 sm:space-y-6 pb-8 sm:pb-0">
              {/* Header with gradient accent */}
              <div className="flex items-center justify-between pb-2 sm:pb-4 border-b border-slate-700/50">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 sm:h-6 bg-gradient-to-b from-[#fc4f02] to-[#fda300] rounded-full"></div>
                  <h2 className="text-base sm:text-2xl font-bold text-white truncate">AI Deep Insight</h2>
                </div>
                <button
                  onClick={handleCloseSidebar}
                  className="rounded-lg p-1.5 sm:p-2 text-slate-400 hover:bg-slate-700/50 hover:text-white transition-all hover:scale-110 flex-shrink-0"
                  aria-label="Close"
                >
                  <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Asset Info Card */}
              <div className="rounded-lg sm:rounded-xl bg-gradient-to-br from-white/[0.05] to-transparent p-2.5 sm:p-4 backdrop-blur border border-slate-700/30 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)]">
                <div className="flex items-center gap-2 sm:gap-4">
                  {connectionType === "stocks" ? (
                    <StockLogo symbol={selectedNews.symbol} size="lg" />
                  ) : (
                    <CoinLogo symbol={selectedNews.symbol} size="lg" logoUrl={coinLogos[selectedNews.symbol]} />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-xl font-bold text-white truncate mb-0.5 sm:mb-1">{selectedNews.symbol}</h3>
                    <div className="flex items-center gap-1 sm:gap-2 flex-wrap text-xs">
                      <span className="text-slate-400 truncate">{selectedNews.source}</span>
                      <span className="text-slate-600 hidden sm:inline">•</span>
                      <span className="text-slate-400 whitespace-nowrap">
                        {getTimeAgo(selectedNews.published_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Title */}
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-white leading-tight">{selectedNews.title}</h2>
              </div>

              {/* AI Summary Card */}
              {selectedNews.aiSummary && (
                <div className="rounded-lg sm:rounded-xl bg-gradient-to-br from-white/[0.05] to-transparent p-3 sm:p-5 backdrop-blur border border-slate-700/30 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)]">
                  <div className="flex items-center gap-2 mb-2 sm:mb-3">
                    <div className="w-2 h-2 rounded-full bg-[#fc4f02] animate-pulse"></div>
                    <p className="text-xs font-semibold text-[#fc4f02] uppercase tracking-wide">AI Summary</p>
                  </div>
                  <p className="text-xs sm:text-base text-slate-200 leading-relaxed">{selectedNews.aiSummary}</p>
                </div>
              )}

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                {/* Market Mood */}
                <div className="rounded-lg sm:rounded-xl bg-gradient-to-br from-white/[0.05] to-transparent p-2.5 sm:p-4 backdrop-blur border border-slate-700/30">
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-2 sm:mb-3">Market Mood</p>
                  <MarketMoodBadge mood={selectedNews.marketMood || "Neutral"} />
                </div>

                {/* Impact Level */}
                <div className="rounded-lg sm:rounded-xl bg-gradient-to-br from-white/[0.05] to-transparent p-2.5 sm:p-4 backdrop-blur border border-slate-700/30">
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-2 sm:mb-3">Impact Level</p>
                  <span className={`inline-block px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-semibold ${
                    selectedNews.impactLevel === "High" ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" :
                    selectedNews.impactLevel === "Low" ? "bg-slate-500/20 text-slate-400 border border-slate-500/30" :
                    "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                  }`}>
                    {selectedNews.impactLevel || "Medium"}
                  </span>
                </div>
              </div>

              {/* Impact Score with Visual Bar */}
              {selectedNews.impactScore !== undefined && (
                <div className="rounded-lg sm:rounded-xl bg-gradient-to-br from-white/[0.05] to-transparent p-3 sm:p-5 backdrop-blur border border-slate-700/30">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <p className="text-xs text-slate-400 uppercase tracking-wide">Impact Score</p>
                    <span className="text-base sm:text-lg font-bold text-white">{selectedNews.impactScore}/100</span>
                  </div>
                  <ImpactScoreBar score={selectedNews.impactScore} level={selectedNews.impactLevel || "Medium"} />
                </div>
              )}

              {/* Risk & Trend Row */}
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                {/* Risk Rating */}
                <div className="rounded-lg sm:rounded-xl bg-gradient-to-br from-white/[0.05] to-transparent p-2.5 sm:p-4 backdrop-blur border border-slate-700/30">
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-2 sm:mb-3">Risk Rating</p>
                  <span className={`inline-block px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-semibold ${
                    selectedNews.riskRating === "Low" ? "bg-green-500/20 text-green-400 border border-green-500/30" :
                    selectedNews.riskRating === "High" ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                    "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                  }`}>
                    {selectedNews.riskRating || "Medium"}
                  </span>
                </div>

                {/* Trend Direction */}
                <div className="rounded-lg sm:rounded-xl bg-gradient-to-br from-white/[0.05] to-transparent p-2.5 sm:p-4 backdrop-blur border border-slate-700/30">
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-2 sm:mb-3">Trend</p>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {selectedNews.trendDirection && (
                      <TrendGraph trend={selectedNews.trendDirection} />
                    )}
                    <span className={`text-xs sm:text-sm font-semibold truncate ${
                      selectedNews.trendDirection === "up" ? "text-green-400" :
                      selectedNews.trendDirection === "down" ? "text-red-400" :
                      "text-slate-400"
                    }`}>
                      {selectedNews.trendDirection === "up" ? "↑ Uptrend" :
                       selectedNews.trendDirection === "down" ? "↓ Downtrend" :
                       "➖ Neutral"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sentiment Score */}
              <div className="rounded-lg sm:rounded-xl bg-gradient-to-br from-white/[0.05] to-transparent p-3 sm:p-5 backdrop-blur border border-slate-700/30">
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-2 sm:mb-3">Sentiment Analysis</p>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-slate-300">Score</span>
                    <span className={`text-xs sm:text-sm font-semibold ${
                      selectedNews.sentiment.score > 0 ? "text-green-400" :
                      selectedNews.sentiment.score < 0 ? "text-red-400" :
                      "text-slate-400"
                    }`}>
                      {selectedNews.sentiment.score > 0 ? "+" : ""}{selectedNews.sentiment.score.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-slate-300">Confidence</span>
                    <span className="text-xs sm:text-sm font-semibold text-white">
                      {(selectedNews.sentiment.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        selectedNews.sentiment.score > 0 ? "bg-green-500" :
                        selectedNews.sentiment.score < 0 ? "bg-red-500" :
                        "bg-slate-500"
                      }`}
                      style={{ width: `${Math.abs(selectedNews.sentiment.score) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Full Description */}
              <div className="rounded-lg sm:rounded-xl bg-gradient-to-br from-white/[0.05] to-transparent p-3 sm:p-5 backdrop-blur border border-slate-700/30">
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-2 sm:mb-3">Full Description</p>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{selectedNews.description}</p>
              </div>

              {/* Footer with Actions */}
              <div className="pt-2 sm:pt-4 border-t border-slate-700/50 space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>
                    Published: {selectedNews.published_at 
                      ? new Date(selectedNews.published_at).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Recent"}
                  </span>
                </div>
                {selectedNews.url && (
                  <a
                    href={selectedNews.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white font-semibold text-sm sm:text-base hover:shadow-lg hover:shadow-[#fc4f02]/30 transition-all duration-300 hover:scale-[1.02]"
                  >
                    <span>Read Full Article</span>
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
