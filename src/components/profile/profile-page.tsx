"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { authService } from "@/lib/auth/auth.service";
import { getTrendingAssets, getCoinGeckoLogoUrl } from "@/lib/api/trending-assets.service";
import { exchangesService, DashboardData } from "@/lib/api/exchanges.service";
import { useExchange } from "@/context/ExchangeContext";

interface Coin {
  id: string;
  name: string;
  symbol: string;
  amount: number;
  value: number;
  change: number;
  trend: "up" | "down";
  icon: string;
  logoUrl?: string | null;
}

interface Stock {
  id: string;
  name: string;
  symbol: string;
  shares: number;
  value: number;
  change: number;
  trend: "up" | "down";
  icon: string;
}

// Helper function for consistent number formatting (yesyesyes)
const formatNumber = (num: number, decimals: number = 2): string => {
  return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const formatCryptoAmount = (num: number): string => {
  // For crypto amounts, show up to 6 decimal places but remove trailing zeros
  const str = num.toFixed(6);
  return str.replace(/\.?0+$/, "");
};

export function ProfilePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [userName, setUserName] = useState<string>("User");
  const [userEmail, setUserEmail] = useState<string>("user@example.com");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [coinLogos, setCoinLogos] = useState<Record<string, string>>({});
  
  // Get connection from global context (fetched once on app start)
  const { connectionId, isLoading: isLoadingConnection } = useExchange();
  
  // Dashboard data state
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasInitialized = useRef(false);

  // Fetch dashboard data (includes positions)
  const fetchDashboardData = useCallback(async (connId: string) => {
    try {
      setIsLoading(true);
      const response = await exchangesService.getDashboard(connId);
      setDashboardData(response.data);
      setError(null);
    } catch (err: any) {
      console.error("Failed to fetch dashboard data:", err);
      setError(err.message || "Failed to load portfolio data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Convert positions to Coin/Stock format
  const coins: Coin[] = dashboardData?.positions
    ?.filter(pos => pos.symbol.includes('USD') || ['BTC', 'ETH', 'DOGE', 'ADA', 'TRX'].includes(pos.symbol))
    .map((pos, idx) => ({
      id: String(idx + 1),
      name: pos.symbol,
      symbol: pos.symbol,
      amount: pos.quantity,
      value: pos.quantity * pos.currentPrice,
      change: pos.pnlPercent,
      trend: pos.pnlPercent >= 0 ? "up" as const : "down" as const,
      icon: "🪙",
    })) || [];

  const stocks: Stock[] = dashboardData?.positions
    ?.filter(pos => !pos.symbol.includes('USD') && !['BTC', 'ETH', 'DOGE', 'ADA', 'TRX'].includes(pos.symbol))
    .map((pos, idx) => ({
      id: String(idx + 1),
      name: pos.symbol,
      symbol: pos.symbol,
      shares: pos.quantity,
      value: pos.quantity * pos.currentPrice,
      change: pos.pnlPercent,
      trend: pos.pnlPercent >= 0 ? "up" as const : "down" as const,
      icon: "📈",
    })) || [];

  // Calculate portfolio metrics
  const holdingValue = dashboardData?.portfolio?.totalValue || 0;
  const investedValue = dashboardData?.portfolio?.totalCost || 0;
  const availableUSD = dashboardData?.balance?.assets?.find(a => a.symbol === 'USD')?.free 
    ? parseFloat(dashboardData.balance.assets.find(a => a.symbol === 'USD')!.free) 
    : 0;
  const portfolioChange = dashboardData?.portfolio?.pnlPercent || 0;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load user data
  useEffect(() => {
    if (!mounted) return;
    
    const loadUserData = async () => {
      try {
        const user = await authService.getCurrentUser();
        setUserName(user.username);
        setUserEmail(user.email);
        localStorage.setItem("quantivahq_user_name", user.username);
        localStorage.setItem("quantivahq_user_email", user.email);
      } catch (error) {
        const name = localStorage.getItem("quantivahq_user_name") || "User";
        const email = localStorage.getItem("quantivahq_user_email") || "user@example.com";
        setUserName(name);
        setUserEmail(email);
      }

      const savedImage = localStorage.getItem("quantivahq_profile_image");
      if (savedImage) {
        setProfileImage(savedImage);
      }
    };

    loadUserData();
  }, [mounted]);

  // Fetch dashboard data when connection ID is available
  useEffect(() => {
    if (!mounted || hasInitialized.current || !connectionId) return;
    if (isLoadingConnection) return; // Wait for context to load
    
    const initialize = async () => {
      hasInitialized.current = true;
      await fetchDashboardData(connectionId);
    };
    
    initialize();
  }, [mounted, connectionId, isLoadingConnection, fetchDashboardData]);

  // Fetch coin data from backend database (no CoinGecko API rate limits)
  useEffect(() => {
    if (!mounted || coins.length === 0) return;

    const fetchCoinData = async () => {
      try {
        // Get trending assets from backend (includes logos and market data)
        const trendingAssets = await getTrendingAssets(20, true);
        
        // Create a map for quick lookup
        const assetMap = new Map(
          trendingAssets.map(asset => [asset.symbol.toUpperCase(), asset])
        );
        
        // Set logo map for display
        const logoMap: Record<string, string> = {};
        trendingAssets.forEach(asset => {
          const symbol = asset.symbol.toUpperCase();
          // Use DB logo if available, otherwise fallback to CoinGecko CDN
          logoMap[symbol] = asset.logo_url || getCoinGeckoLogoUrl(symbol) || "";
        });
        
        // Also add fallback logos for coins not in trending assets
        coins.forEach(coin => {
          const symbol = coin.symbol.toUpperCase();
          if (!logoMap[symbol]) {
            const fallbackLogo = getCoinGeckoLogoUrl(symbol);
            if (fallbackLogo) {
              logoMap[symbol] = fallbackLogo;
            }
          }
        });
        
        setCoinLogos(logoMap);
      } catch (error) {
        console.error("Failed to fetch coin data:", error);
        // Fallback to CDN URLs
        const fallbackLogos: Record<string, string> = {};
        coins.forEach(coin => {
          const logo = getCoinGeckoLogoUrl(coin.symbol);
          if (logo) {
            fallbackLogos[coin.symbol.toUpperCase()] = logo;
          }
        });
        setCoinLogos(fallbackLogos);
      }
    };

    fetchCoinData();
  }, [mounted, coins]);

  // Trend Graph Component using PNG images
  const TrendGraph = ({ trend }: { trend: "up" | "down" }) => {
    const getImageSrc = () => {
      return trend === "up" ? "/upper_trend.png" : "/downtrend.png";
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
  };

  if (!mounted) {
    return (
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
        <div className="relative overflow-hidden rounded-lg sm:rounded-2xl bg-gradient-to-br from-[#c93d02] via-[#d45a00] to-[#d46a00] p-4 sm:p-8 shadow-xl">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Portfolio</h1>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <p className="text-xs sm:text-sm text-white/80 mb-1">Holding value</p>
                  <div className="flex items-baseline gap-2 sm:gap-3">
                    <p className="text-3xl sm:text-4xl font-bold text-white">$0.00</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur-xl rounded-lg sm:rounded-2xl p-4 sm:p-6 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)]">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Your Coins</h2>
          </div>
          <div className="bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur-xl rounded-lg sm:rounded-2xl p-4 sm:p-6 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)]">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Your Stocks</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
      {/* Portfolio Summary Card */}
        <div className="relative overflow-hidden rounded-lg sm:rounded-2xl bg-gradient-to-br from-[#c93d02] via-[#d45a00] to-[#d46a00] p-4 sm:p-8 shadow-xl">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-0">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Portfolio</h1>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <p className="text-xs sm:text-sm text-white/80 mb-1">Holding value</p>
                <div className="flex items-baseline gap-2 sm:gap-3">
                  <p className="text-3xl sm:text-4xl font-bold text-white">${formatNumber(holdingValue)}</p>
                  <span className={`text-base sm:text-lg font-semibold ${portfolioChange >= 0 ? "text-green-300" : "text-red-300"}`}>
                    {portfolioChange >= 0 ? "+" : ""}{portfolioChange.toFixed(2)}%
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-6 mt-4 sm:mt-6">
                <div>
                  <p className="text-xs sm:text-sm text-white/80 mb-1">Invested value</p>
                  <p className="text-base sm:text-xl font-semibold text-white">${formatNumber(investedValue)}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-white/80 mb-1">Available USD</p>
                  <p className="text-base sm:text-xl font-semibold text-white">${formatNumber(availableUSD)}</p>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={() => router.push("/dashboard/settings")}
            className="absolute top-3 sm:top-4 right-3 sm:right-4 p-2 sm:p-3 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all duration-200 hover:scale-105"
            aria-label="Settings"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Coins and Stocks Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Your Coins Section */}
        <div className="bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur-xl rounded-lg sm:rounded-2xl p-4 sm:p-6 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)]">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Your Coins</h2>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 rounded-lg bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-slate-400">{error}</div>
          ) : coins.length === 0 ? (
            <div className="text-center py-8 text-slate-400">No crypto positions found</div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {coins.map((coin) => (
              <div
                key={coin.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gradient-to-br from-white/[0.07] to-transparent hover:from-white/[0.1] hover:to-transparent transition-all duration-200 group cursor-pointer"
              >
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  {coinLogos[coin.symbol.toUpperCase()] ? (
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#fc4f02]/20 to-[#fc4f02]/10 border border-[#fc4f02]/20 flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden">
                      <Image
                        src={coinLogos[coin.symbol.toUpperCase()]}
                        alt={coin.name}
                        width={48}
                        height={48}
                        className="object-cover w-full h-full"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#fc4f02]/20 to-[#fc4f02]/10 border border-[#fc4f02]/20 flex items-center justify-center text-lg sm:text-2xl flex-shrink-0 shadow-sm">
                      {coin.icon}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-semibold text-white truncate">{coin.name}</p>
                    <p className="text-xs sm:text-sm text-slate-400">{formatCryptoAmount(coin.amount)} {coin.symbol}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 ml-0 sm:ml-4">
                  <div className="hidden sm:block relative w-48 h-16 flex-shrink-0">
                    <Image
                      src={coin.trend === "up" ? "/upper_trend.png" : "/downtrend.png"}
                      alt={`${coin.trend} trend`}
                      width={192}
                      height={64}
                      className="object-contain w-full h-full"
                      unoptimized
                    />
                  </div>
                  <div className="text-right">
                    <p className="text-sm sm:text-base font-semibold text-white">${formatNumber(coin.value)}</p>
                    <p className={`text-xs sm:text-sm font-medium ${coin.change >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {coin.change >= 0 ? "+" : ""}{coin.change.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>

        {/* Your Stocks Section */}
        <div className="bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur-xl rounded-lg sm:rounded-2xl p-4 sm:p-6 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)]">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Your Stocks</h2>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 rounded-lg bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-slate-400">{error}</div>
          ) : stocks.length === 0 ? (
            <div className="text-center py-8 text-slate-400">No stock positions found</div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {stocks.map((stock) => (
              <div
                key={stock.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gradient-to-br from-white/[0.07] to-transparent hover:from-white/[0.1] hover:to-transparent transition-all duration-200 group cursor-pointer"
              >
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#1d4ed8]/20 to-[#3b82f6]/10 border border-[#1d4ed8]/20 flex items-center justify-center text-lg sm:text-2xl flex-shrink-0 shadow-sm">
                    {stock.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-semibold text-white truncate">{stock.name}</p>
                    <p className="text-xs sm:text-sm text-slate-400">{stock.shares} shares ({stock.symbol})</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 ml-0 sm:ml-4">
                  <div className="hidden sm:block relative w-48 h-16 flex-shrink-0">
                    <Image
                      src={stock.trend === "up" ? "/upper_trend.png" : "/downtrend.png"}
                      alt={`${stock.trend} trend`}
                      width={192}
                      height={64}
                      className="object-contain w-full h-full"
                      unoptimized
                    />
                  </div>
                  <div className="text-right">
                    <p className="text-sm sm:text-base font-semibold text-white">${formatNumber(stock.value)}</p>
                    <p className={`text-xs sm:text-sm font-medium ${stock.change >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {stock.change >= 0 ? "+" : ""}{stock.change.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      </div>
    </div>
  );
}

